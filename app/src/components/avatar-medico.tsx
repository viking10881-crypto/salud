import DOCTOR from '@/assets/images/doctor.jpg';
import DOCTORA from '@/assets/images/doctora.jpg';
import type { TipoMedico } from '@/lib/medico';
import { cn } from '@/lib/utils';
import { Image } from 'expo-image';
import { View } from 'react-native';

/** Ilustración del doctor o la doctora de una cita, en un círculo. */
export function AvatarMedico({ tipo, size = 48, className }: { tipo: TipoMedico; size?: number; className?: string }) {
  return (
    <View
      className={cn('overflow-hidden rounded-full border-2 border-card bg-secondary', className)}
      style={{ width: size, height: size }}>
      <Image
        source={tipo === 'doctora' ? DOCTORA : DOCTOR}
        style={{ width: '100%', height: '100%' }}
        contentFit="cover"
        accessibilityLabel={tipo === 'doctora' ? 'Doctora' : 'Doctor'}
      />
    </View>
  );
}
