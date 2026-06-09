'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

/**
 * Tabla estándar de la app — un solo estilo para TODOS los roles.
 * Header gris sutil, filas con divisor fino y hover, buen espaciado.
 * Responsive: las columnas con `hideOnMobile` se ocultan en pantallas chicas.
 *
 * Uso:
 *   <DataTable
 *     data={items}
 *     getRowKey={(it) => it.id}
 *     onRowClick={(it) => ...}           // opcional
 *     columns={[
 *       { key: 'name', header: 'Nombre', cell: (it) => <>{it.name}</> },
 *       { key: 'price', header: 'Precio', align: 'right', cell: (it) => `$${it.price}` },
 *       { key: 'actions', header: '', align: 'right', cell: (it) => <button/>, stopClick: true },
 *     ]}
 *   />
 */

export interface DataTableColumn<T> {
  /** Identificador único de la columna. */
  key: string;
  /** Texto del header (vacío para columnas de acciones). */
  header?: React.ReactNode;
  /** Render de la celda para un item. */
  cell: (item: T, index: number) => React.ReactNode;
  /** Alineación del contenido. */
  align?: 'left' | 'right' | 'center';
  /** Oculta la columna en mobile (< sm). */
  hideOnMobile?: boolean;
  /** Ancho fijo opcional (clase tailwind, p.ej. 'w-16'). */
  className?: string;
  /** Si true, un click dentro de la celda no dispara onRowClick (para botones/acciones). */
  stopClick?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  getRowKey: (item: T, index: number) => React.Key;
  onRowClick?: (item: T, index: number) => void;
  /** Mostrar columna de índice (#) a la izquierda. */
  showIndex?: boolean;
  /** Mensaje cuando no hay filas. */
  emptyMessage?: string;
  /** Clase extra para el contenedor. */
  className?: string;
}

const alignClass = {
  left: 'text-left',
  right: 'text-right',
  center: 'text-center',
} as const;

export function DataTable<T>({
  data,
  columns,
  getRowKey,
  onRowClick,
  showIndex = false,
  emptyMessage = 'No hay registros',
  className,
}: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <p className="text-center text-sm text-gray-400 py-10">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn('bg-white rounded-xl shadow-sm overflow-hidden', className)}>
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50/80 hover:bg-gray-50/80 border-b border-gray-100">
            {showIndex && (
              <TableHead className="pl-5 py-2.5 w-12 text-xs font-semibold text-gray-500">#</TableHead>
            )}
            {columns.map((col, i) => (
              <TableHead
                key={col.key}
                className={cn(
                  'py-2.5 text-xs font-semibold text-gray-500',
                  i === 0 && !showIndex ? 'pl-5' : '',
                  i === columns.length - 1 ? 'pr-5' : '',
                  alignClass[col.align ?? 'left'],
                  col.hideOnMobile && 'hidden sm:table-cell',
                  col.className,
                )}
              >
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item, idx) => (
            <TableRow
              key={getRowKey(item, idx)}
              className={cn(
                'border-b border-gray-50 last:border-0 hover:bg-gray-50/60',
                onRowClick && 'cursor-pointer',
              )}
              onClick={onRowClick ? () => onRowClick(item, idx) : undefined}
            >
              {showIndex && (
                <TableCell className="pl-5 py-3 text-xs text-gray-400 font-mono">{idx + 1}</TableCell>
              )}
              {columns.map((col, i) => (
                <TableCell
                  key={col.key}
                  className={cn(
                    'py-3 text-sm text-gray-700',
                    i === 0 && !showIndex ? 'pl-5' : '',
                    i === columns.length - 1 ? 'pr-5' : '',
                    alignClass[col.align ?? 'left'],
                    col.hideOnMobile && 'hidden sm:table-cell',
                    col.className,
                  )}
                  onClick={col.stopClick ? (e) => e.stopPropagation() : undefined}
                >
                  {col.cell(item, idx)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default DataTable;
