import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { HeartPulse } from 'lucide-react-native';
import { View } from 'react-native';

export function Logo({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <View className={cn('flex-row items-center gap-2', className)}>
      {!compact && <Icon as={HeartPulse} size={44} className="text-heart" />}
      <Text className="text-5xl font-extrabold tracking-tight text-primary">
        Salud<Text className="text-5xl font-extrabold text-heart">+</Text>
      </Text>
    </View>
  );
}
