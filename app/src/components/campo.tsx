import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Eye, EyeOff, type LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, type TextInputProps, View } from 'react-native';

type Props = TextInputProps & { icon: LucideIcon; clave?: boolean; invalido?: boolean };

/** Input con icono a la izquierda (y botón para ver la contraseña si `clave`). */
export function Campo({ icon, clave, invalido, className, ...props }: Props) {
  const [ver, setVer] = useState(false);
  return (
    <View
      className={cn(
        'flex-row items-center rounded-2xl border border-input bg-card px-4',
        invalido && 'border-destructive',
        className
      )}>
      <Icon as={icon} size={20} className="text-muted-foreground" />
      <Input
        className="h-14 flex-1 border-0 bg-transparent shadow-none dark:bg-transparent"
        secureTextEntry={clave && !ver}
        autoCapitalize={clave ? 'none' : props.autoCapitalize}
        aria-invalid={invalido}
        {...props}
      />
      {clave && (
        <Pressable
          onPress={() => setVer((v) => !v)}
          hitSlop={12}
          accessibilityLabel={ver ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
          <Icon as={ver ? Eye : EyeOff} size={20} className="text-muted-foreground" />
        </Pressable>
      )}
    </View>
  );
}
