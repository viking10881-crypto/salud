import type { Encuadre } from '@/lib/avatar/geometria';
import type { ReactNode } from 'react';

type Props = { size: number; encuadre: Encuadre; respaldo: ReactNode };

/** En web (solo desarrollo) se muestra el avatar 2D; el 3D está en avatar-3d.native.tsx. */
export function Avatar3D({ respaldo }: Props) {
  return <>{respaldo}</>;
}
