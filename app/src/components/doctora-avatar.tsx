import DOCTORA from '@/assets/images/doctora.jpg';
import { Icon } from '@/components/ui/icon';
import { Image } from 'expo-image';
import { HeartPulse } from 'lucide-react-native';
import { View } from 'react-native';

type Props = { size?: number; className?: string; showBadge?: boolean };

/**
 * Dra. Salud, la doctora virtual: ilustración en un círculo con la insignia del corazón.
 * La imagen original está en avatar/doctora-original.jpg (recortada a 512×512).
 */
export function DoctoraAvatar({ size = 160, className, showBadge = true }: Props) {
  return (
    <View className={className} style={{ width: size, height: size }}>
      <View className="flex-1 overflow-hidden rounded-full border-2 border-secondary bg-secondary">
        <Image
          source={DOCTORA}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
          accessibilityLabel="Dra. Salud, tu doctora virtual"
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
