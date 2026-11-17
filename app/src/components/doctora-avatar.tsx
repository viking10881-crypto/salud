import { Avatar3D } from '@/components/avatar-3d';
import { Icon } from '@/components/ui/icon';
import type { Encuadre } from '@/lib/avatar/geometria';
import { HeartPulse, Stethoscope } from 'lucide-react-native';
import { View } from 'react-native';

type Props = { size?: number; className?: string; showBadge?: boolean; encuadre?: Encuadre };

/** Respaldo 2D: estetoscopio en un círculo (web o si el 3D no está disponible). */
function Doctora2D({ size }: { size: number }) {
  return (
    <View className="flex-1 items-center justify-center">
      <View
        className="items-center justify-center rounded-full bg-card"
        style={{ width: size * 0.72, height: size * 0.72 }}>
        <Icon as={Stethoscope} size={size * 0.38} className="text-primary" />
      </View>
    </View>
  );
}

/**
 * Dra. Salud, la doctora virtual: modelo 3D animado dentro de un círculo lavanda,
 * con la insignia del corazón. Los avatares pequeños muestran solo el busto.
 */
export function DoctoraAvatar({ size = 160, className, showBadge = true, encuadre }: Props) {
  return (
    <View className={className} style={{ width: size, height: size }}>
      <View className="flex-1 overflow-hidden rounded-full bg-secondary">
        <Avatar3D
          size={size}
          encuadre={encuadre ?? (size < 120 ? 'busto' : 'medio')}
          respaldo={<Doctora2D size={size} />}
        />
      </View>
      {showBadge && (
        <View
          className="absolute items-center justify-center rounded-full border-4 border-background bg-heart"
          style={{ width: size * 0.3, height: size * 0.3, right: 0, bottom: size * 0.04 }}>
          <Icon as={HeartPulse} size={size * 0.15} className="text-white" />
        </View>
      )}
    </View>
  );
}
