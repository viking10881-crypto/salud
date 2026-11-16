import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

type Props = {
  icon: LucideIcon;
  iconClassName?: string;
  iconBgClassName?: string;
  title: string;
  subtitle?: string;
  meta?: string;
  right?: React.ReactNode;
  onPress?: () => void;
};

export function ListRow({ icon, iconClassName, iconBgClassName, title, subtitle, meta, right, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      className="flex-row items-center gap-3 rounded-2xl border border-border bg-card p-3 active:opacity-80">
      <View className={cn('h-12 w-12 items-center justify-center rounded-xl bg-secondary', iconBgClassName)}>
        <Icon as={icon} size={24} className={cn('text-primary', iconClassName)} />
      </View>
      <View className="flex-1">
        <Text className="font-semibold">{title}</Text>
        {subtitle ? <Text className="text-sm text-muted-foreground">{subtitle}</Text> : null}
        {meta ? <Text className="text-xs text-muted-foreground">{meta}</Text> : null}
      </View>
      {right}
    </Pressable>
  );
}
