import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { router } from 'expo-router';
import { ChevronLeft, type LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';

type Props = { title: string; actionIcon?: LucideIcon; onAction?: () => void; back?: boolean };

export function ScreenHeader({ title, actionIcon, onAction, back = true }: Props) {
  return (
    <View className="flex-row items-center justify-between px-4 pb-2 pt-1">
      <View className="w-10">
        {back && (
          <Button variant="ghost" size="icon" onPress={() => router.back()} accessibilityLabel="Volver">
            <Icon as={ChevronLeft} size={24} className="text-foreground" />
          </Button>
        )}
      </View>
      <Text className="text-lg font-bold">{title}</Text>
      <View className="w-10">
        {actionIcon && (
          <Button variant="secondary" size="icon" className="rounded-full" onPress={onAction} accessibilityLabel={title}>
            <Icon as={actionIcon} size={20} className="text-primary" />
          </Button>
        )}
      </View>
    </View>
  );
}
