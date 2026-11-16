import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/utils';
import { HeartPulse, Stethoscope } from 'lucide-react-native';
import { View } from 'react-native';

type Props = { size?: number; className?: string; showBadge?: boolean };

/**
 * Doctora virtual (placeholder 2D).
 * En la fase del avatar se reemplazará por el modelo 3D (GLB) renderizado con
 * React Three Fiber, manteniendo esta misma API de props.
 */
export function DoctoraAvatar({ size = 160, className, showBadge = true }: Props) {
  return (
    <View
      className={cn('items-center justify-center rounded-full bg-secondary', className)}
      style={{ width: size, height: size }}>
      <View
        className="items-center justify-center rounded-full bg-card"
        style={{ width: size * 0.72, height: size * 0.72 }}>
        <Icon as={Stethoscope} size={size * 0.38} className="text-primary" />
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
