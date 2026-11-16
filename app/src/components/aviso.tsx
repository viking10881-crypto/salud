import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { CircleAlert, CircleCheck } from 'lucide-react-native';
import { View } from 'react-native';

export function Aviso({ tipo = 'error', children }: { tipo?: 'error' | 'exito'; children: string }) {
  const error = tipo === 'error';
  return (
    <View
      role="alert"
      className={cn(
        'flex-row items-center gap-2 rounded-xl px-3 py-2',
        error ? 'bg-destructive/10' : 'bg-meds'
      )}>
      <Icon
        as={error ? CircleAlert : CircleCheck}
        size={18}
        className={error ? 'text-destructive' : 'text-meds-foreground'}
      />
      <Text className={cn('flex-1 text-sm', error ? 'text-destructive' : 'text-meds-foreground')}>
        {children}
      </Text>
    </View>
  );
}
