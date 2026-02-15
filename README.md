# react-data-table

Feature-rich, accessible data table component for React with TypeScript support. Zero configuration needed for basic usage, fully customizable for complex needs.

## Features

- **Sorting**: Click column headers to sort (asc/desc/none)
- **Filtering**: Global search + per-column filters
- **Pagination**: Configurable page sizes with navigation
- **Selection**: Single/multi-row selection with callbacks
- **Virtual Scrolling**: Render thousands of rows efficiently
- **Responsive**: Horizontal scroll on small screens
- **Accessible**: Full keyboard navigation, ARIA attributes
- **TypeScript**: Fully typed API with generics

## Quick Start

```tsx
import { DataTable } from 'react-data-table';

const columns = [
  { key: 'name', title: 'Name', sortable: true },
  { key: 'email', title: 'Email', sortable: true },
  { key: 'role', title: 'Role', filterable: true },
];

const data = [
  { id: 1, name: 'Alice', email: 'alice@example.com', role: 'Admin' },
  { id: 2, name: 'Bob', email: 'bob@example.com', role: 'User' },
];

function App() {
  return (
    <DataTable
      columns={columns}
      data={data}
      pageSize={10}
      searchable
      selectable
      onSelectionChange={(rows) => console.log(rows)}
    />
  );
}
```

## Column Definition

```typescript
interface Column<T> {
  key: keyof T;
  title: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  render?: (value: any, row: T) => React.ReactNode;
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| columns | Column[] | required | Column definitions |
| data | T[] | required | Row data array |
| pageSize | number | 10 | Rows per page |
| searchable | boolean | false | Enable global search |
| selectable | boolean | false | Enable row selection |
| loading | boolean | false | Show loading state |
| emptyMessage | string | 'No data' | Empty state message |
| onSelectionChange | (rows) => void | - | Selection callback |
| onSort | (key, dir) => void | - | Sort callback |

## License

MIT