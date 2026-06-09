'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Botones de acción estándar para las celdas de las tablas (DataTable).
 * Estilo unificado: link de texto, sin recuadro, subraya al hover.
 *  - <RowAction>      acción neutra (verde): Editar, Ver, Ajustar…
 *  - <RowDangerAction> acción destructiva (rojo): Eliminar.
 *  - <RowActions>     contenedor que alinea los botones a la derecha con separación uniforme.
 */

export function RowActions({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('flex items-center justify-end gap-3', className)}>{children}</div>;
}

interface ActionProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export function RowAction({ children, className, ...props }: ActionProps) {
  return (
    <button
      type="button"
      className={cn('text-xs font-medium text-green-700 hover:text-green-900 hover:underline transition-colors', className)}
      {...props}
    >
      {children}
    </button>
  );
}

export function RowDangerAction({ children, className, ...props }: ActionProps) {
  return (
    <button
      type="button"
      className={cn('text-xs font-medium text-red-600 hover:text-red-800 hover:underline transition-colors', className)}
      {...props}
    >
      {children}
    </button>
  );
}
