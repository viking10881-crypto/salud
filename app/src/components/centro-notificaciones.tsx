import ICONO_APP from '@/assets/images/icon.png';
import DOCTORA from '@/assets/images/doctora.jpg';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { type Aviso, type GrupoAvisos } from '@/lib/centro-notificaciones';
import { cn } from '@/lib/utils';
import { useMedicamentos } from '@/providers/medicamentos-provider';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { BellOff, Check, ChevronUp, X } from 'lucide-react-native';
import { type ComponentRef, type RefObject, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, PanResponder, Pressable, ScrollView, View } from 'react-native';
import Reanimated, { FadeInDown, FadeOut } from 'react-native-reanimated';

type Props = {
  /** Abierto o cerrado: al pasar a false se anima la salida y luego se desmonta */
  abierto: boolean;
  onCerrar: () => void;
  grupos: GrupoAvisos[];
  /** Vista que se desenfoca detrás del panel (necesario en Android) */
  fondo: RefObject<ComponentRef<typeof View> | null>;
};

/** Tarjeta translúcida oscura, como los cuadros del Centro de Control de iOS. */
function Tarjeta({ aviso, indice, onAbrir }: { aviso: Aviso; indice: number; onAbrir: (a: Aviso) => void }) {
  const { tomar } = useMedicamentos();
  const [tomando, setTomando] = useState(false);
  const [hecho, setHecho] = useState(false);
  const urgente = aviso.tipo === 'atrasada';

  const marcar = async () => {
    if (!aviso.dosis) return;
    setTomando(true);
    try {
      await tomar(aviso.dosis);
      setHecho(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } finally {
      setTomando(false);
    }
  };

  return (
    <Reanimated.View
      entering={FadeInDown.delay(60 + indice * 55)
        .springify()
        .damping(18)}
      exiting={FadeOut}>
      <Pressable
        onPress={() => onAbrir(aviso)}
        className="flex-row gap-3 rounded-[26px] bg-neutral-900/55 p-4 active:opacity-80">
        <Image
          source={aviso.tipo === 'doctora' ? DOCTORA : ICONO_APP}
          style={{ width: 40, height: 40, borderRadius: aviso.tipo === 'doctora' ? 20 : 10 }}
          contentFit="cover"
        />
        <View className="flex-1 gap-0.5">
          <View className="flex-row items-center gap-2">
            <Text className="flex-1 text-[15px] font-semibold text-white" numberOfLines={1}>
              {aviso.titulo}
            </Text>
            <Text className={cn('text-[13px]', urgente ? 'font-semibold text-pink-300' : 'text-white/60')}>
              {aviso.cuando}
            </Text>
          </View>
          <Text className="text-[15px] leading-5 text-white/90">{aviso.cuerpo}</Text>
          {aviso.dosis && (
            <Pressable
              onPress={marcar}
              disabled={tomando || hecho}
              className={cn(
                'mt-2.5 h-10 flex-row items-center justify-center gap-1.5 rounded-2xl active:opacity-70',
                hecho ? 'bg-green-500' : 'bg-white/15'
              )}>
              {tomando ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Icon as={Check} size={16} className="text-white" />
                  <Text className="text-sm font-semibold text-white">{hecho ? 'Tomado' : 'Marcar como tomado'}</Text>
                </>
              )}
            </Pressable>
          )}
        </View>
      </Pressable>
    </Reanimated.View>
  );
}

/**
 * Centro de notificaciones estilo iOS: se despliega desde arriba sobre la pantalla,
 * con el fondo desenfocado. La campana sigue visible para volver a cerrarlo.
 */
export function CentroNotificaciones({ abierto, onCerrar, grupos, fondo }: Props) {
  const [montado, setMontado] = useState(abierto);
  const [opacidad] = useState(() => new Animated.Value(0));
  const [bajada] = useState(() => new Animated.Value(-60));
  const [ocultos, setOcultos] = useState<string[]>([]);

  // Al abrir se monta en el mismo render (patrón de "ajustar estado cuando cambia una prop")
  if (abierto && !montado) setMontado(true);

  useEffect(() => {
    if (abierto) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      Animated.parallel([
        Animated.timing(opacidad, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(bajada, { toValue: 0, useNativeDriver: true, damping: 18, stiffness: 170 }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacidad, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(bajada, { toValue: -60, duration: 200, useNativeDriver: true }),
      ]).start(({ finished }) => finished && setMontado(false));
    }
  }, [abierto, opacidad, bajada]);

  // Deslizar hacia arriba para cerrar. El PanResponder se crea una sola vez y avisa con un contador.
  const [cierresPorGesto, setCierresPorGesto] = useState(0);
  const cierresAtendidos = useRef(0);
  useEffect(() => {
    if (cierresPorGesto > cierresAtendidos.current) {
      cierresAtendidos.current = cierresPorGesto;
      onCerrar();
    }
  }, [cierresPorGesto, onCerrar]);

  const [arrastre] = useState(() =>
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) => g.dy < -8 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderMove: (_e, g) => bajada.setValue(Math.min(0, g.dy)),
      onPanResponderRelease: (_e, g) => {
        if (g.dy < -70 || g.vy < -0.6) setCierresPorGesto((n) => n + 1);
        else Animated.spring(bajada, { toValue: 0, useNativeDriver: true, damping: 18 }).start();
      },
    })
  );

  if (!montado) return null;

  const abrir = (a: Aviso) => {
    onCerrar();
    if (a.cita) router.push({ pathname: '/cita', params: { id: a.cita.id } });
    else if (a.dosis) router.push('/medicamentos');
  };

  const visibles = grupos
    .map((g) => ({ ...g, avisos: g.avisos.filter((a) => !ocultos.includes(a.id)) }))
    .filter((g) => g.avisos.length > 0);
  let indice = 0;

  return (
    <Animated.View
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: opacidad }}
      pointerEvents={abierto ? 'auto' : 'none'}>
      {/* Fondo opaco y desenfocado, como el Centro de Control */}
      <BlurView
        intensity={85}
        tint="systemThinMaterialLight"
        blurMethod="dimezisBlurViewSdk31Plus"
        blurTarget={fondo}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <View className="absolute inset-0 bg-neutral-400/25" pointerEvents="none" />

      <Animated.View style={{ flex: 1, transform: [{ translateY: bajada }] }} {...arrastre.panHandlers}>
        <Pressable
          onPress={onCerrar}
          hitSlop={12}
          accessibilityLabel="Cerrar notificaciones"
          className="items-center py-2">
          <Icon as={ChevronUp} size={28} className="text-neutral-700" />
        </Pressable>
        <ScrollView contentContainerClassName="gap-3 px-4 pb-8" showsVerticalScrollIndicator={false}>
          {visibles.length === 0 ? (
            <View className="items-center gap-3 py-20">
              <Icon as={BellOff} size={40} className="text-neutral-700" />
              <Text className="text-lg text-neutral-700">No hay notificaciones</Text>
            </View>
          ) : (
            visibles.map((g) => (
              <View key={g.titulo} className="gap-2.5">
                <View className="flex-row items-center justify-between px-1 pt-1">
                  <Text className="text-xl font-bold text-neutral-800">{g.titulo}</Text>
                  <Pressable
                    onPress={() => setOcultos((o) => [...o, ...g.avisos.map((a) => a.id)])}
                    hitSlop={10}
                    accessibilityLabel={`Borrar ${g.titulo}`}
                    className="h-7 w-7 items-center justify-center rounded-full bg-neutral-900/20 active:opacity-60">
                    <Icon as={X} size={14} className="text-neutral-800" />
                  </Pressable>
                </View>
                {g.avisos.map((a) => (
                  <Tarjeta key={a.id} aviso={a} indice={indice++} onAbrir={abrir} />
                ))}
              </View>
            ))
          )}
        </ScrollView>
      </Animated.View>
    </Animated.View>
  );
}
