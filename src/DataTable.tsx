import React, { useState, useMemo, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────

type SortDirection = 'asc' | 'desc' | null;

interface Column<T> {
  key: keyof T & string;
  title: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
}

interface DataTableProps<T extends { id: string | number }> {
  columns: Column<T>[];
  data: T[];
  pageSize?: number;
  searchable?: boolean;
  selectable?: boolean;
  loading?: boolean;
  emptyMessage?: string;
  onSelectionChange?: (selectedRows: T[]) => void;
  onSort?: (key: string, direction: SortDirection) => void;
  className?: string;
}

// ─── Styles ───────────────────────────────────────────────────────────────

const styles = {
  wrapper: { width: '100%', overflowX: 'auto' as const, fontFamily: 'system-ui, sans-serif' },
  table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: '14px' },
  th: {
    padding: '12px 16px', textAlign: 'left' as const,
    borderBottom: '2px solid #e2e8f0', backgroundColor: '#f8fafc',
    fontWeight: 600, color: '#475569', userSelect: 'none' as const,
  },
  td: { padding: '12px 16px', borderBottom: '1px solid #e2e8f0', color: '#1e293b' },
  trHover: { backgroundColor: '#f1f5f9' },
  trSelected: { backgroundColor: '#eff6ff' },
  search: {
    width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1',
    borderRadius: '8px', fontSize: '14px', marginBottom: '12px',
    outline: 'none',
  },
  pagination: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '12px 0', fontSize: '14px', color: '#64748b',
  },
  pageBtn: {
    padding: '6px 12px', border: '1px solid #cbd5e1', borderRadius: '6px',
    backgroundColor: '#fff', cursor: 'pointer', fontSize: '13px', margin: '0 4px',
  },
  pageBtnActive: { backgroundColor: '#3b82f6', color: '#fff', borderColor: '#3b82f6' },
  pageBtnDisabled: { opacity: 0.5, cursor: 'not-allowed' as const },
  loading: { textAlign: 'center' as const, padding: '40px', color: '#94a3b8' },
  sortIcon: { marginLeft: '4px', fontSize: '12px' },
  checkbox: { width: '16px', height: '16px', cursor: 'pointer' },
};

// ─── Component ────────────────────────────────────────────────────────────

export function DataTable<T extends { id: string | number }>({
  columns, data, pageSize = 10, searchable = false, selectable = false,
  loading = false, emptyMessage = 'No data available',
  onSelectionChange, onSort, className = '',
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selected, setSelected] = useState<Set<string | number>>(new Set());
  const [hoveredRow, setHoveredRow] = useState<string | number | null>(null);

  // Filter
  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter((row) =>
      columns.some((col) => {
        const val = row[col.key];
        return val != null && String(val).toLowerCase().includes(q);
      })
    );
  }, [data, search, columns]);

  // Sort
  const sorted = useMemo(() => {
    if (!sortKey || !sortDir) return filtered;
    return [...filtered].sort((a, b) => {
      const aVal = a[sortKey as keyof T];
      const bVal = b[sortKey as keyof T];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  // Paginate
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginated = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, safeCurrentPage, pageSize]);

  const handleSort = useCallback(
    (key: string) => {
      let dir: SortDirection;
      if (sortKey === key) {
        dir = sortDir === 'asc' ? 'desc' : sortDir === 'desc' ? null : 'asc';
      } else {
        dir = 'asc';
      }
      setSortKey(dir ? key : null);
      setSortDir(dir);
      onSort?.(key, dir);
    },
    [sortKey, sortDir, onSort]
  );

  const toggleRow = useCallback(
    (id: string | number) => {
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        onSelectionChange?.(data.filter((r) => next.has(r.id)));
        return next;
      });
    },
    [data, onSelectionChange]
  );

  const toggleAll = useCallback(() => {
    setSelected((prev) => {
      const allIds = paginated.map((r) => r.id);
      const allSelected = allIds.every((id) => prev.has(id));
      const next = new Set(prev);
      allIds.forEach((id) => (allSelected ? next.delete(id) : next.add(id)));
      onSelectionChange?.(data.filter((r) => next.has(r.id)));
      return next;
    });
  }, [paginated, data, onSelectionChange]);

  const sortIcon = (key: string) => {
    if (sortKey !== key) return ' \u2195';
    return sortDir === 'asc' ? ' \u2191' : ' \u2193';
  };

  return (
    <div className={className} style={styles.wrapper}>
      {searchable && (
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
          style={styles.search}
          aria-label="Search table"
        />
      )}

      <table style={styles.table} role="grid">
        <thead>
          <tr>
            {selectable && (
              <th style={{ ...styles.th, width: '40px' }}>
                <input
                  type="checkbox"
                  style={styles.checkbox}
                  checked={paginated.length > 0 && paginated.every((r) => selected.has(r.id))}
                  onChange={toggleAll}
                  aria-label="Select all rows"
                />
              </th>
            )}
            {columns.map((col) => (
              <th
                key={col.key}
                style={{ ...styles.th, width: col.width, cursor: col.sortable ? 'pointer' : 'default' }}
                onClick={() => col.sortable && handleSort(col.key)}
                aria-sort={sortKey === col.key ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
              >
                {col.title}
                {col.sortable && <span style={styles.sortIcon}>{sortIcon(col.key)}</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={columns.length + (selectable ? 1 : 0)} style={styles.loading}>Loading...</td></tr>
          ) : paginated.length === 0 ? (
            <tr><td colSpan={columns.length + (selectable ? 1 : 0)} style={styles.loading}>{emptyMessage}</td></tr>
          ) : (
            paginated.map((row) => (
              <tr
                key={row.id}
                style={selected.has(row.id) ? styles.trSelected : hoveredRow === row.id ? styles.trHover : undefined}
                onMouseEnter={() => setHoveredRow(row.id)}
                onMouseLeave={() => setHoveredRow(null)}
              >
                {selectable && (
                  <td style={styles.td}>
                    <input
                      type="checkbox"
                      style={styles.checkbox}
                      checked={selected.has(row.id)}
                      onChange={() => toggleRow(row.id)}
                      aria-label={'Select row ' + row.id}
                    />
                  </td>
                )}
                {columns.map((col) => (
                  <td key={col.key} style={styles.td}>
                    {col.render ? col.render(row[col.key], row) : String(row[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {!loading && sorted.length > pageSize && (
        <div style={styles.pagination}>
          <span>
            Showing {(safeCurrentPage - 1) * pageSize + 1}-{Math.min(safeCurrentPage * pageSize, sorted.length)} of {sorted.length}
          </span>
          <div>
            <button
              style={{ ...styles.pageBtn, ...(safeCurrentPage <= 1 ? styles.pageBtnDisabled : {}) }}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safeCurrentPage <= 1}
            >
              Prev
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = Math.max(1, Math.min(safeCurrentPage - 2, totalPages - 4)) + i;
              if (page > totalPages) return null;
              return (
                <button
                  key={page}
                  style={{ ...styles.pageBtn, ...(page === safeCurrentPage ? styles.pageBtnActive : {}) }}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              );
            })}
            <button
              style={{ ...styles.pageBtn, ...(safeCurrentPage >= totalPages ? styles.pageBtnDisabled : {}) }}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safeCurrentPage >= totalPages}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;