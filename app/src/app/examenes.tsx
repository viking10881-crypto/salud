import { ScreenHeader } from '@/components/screen-header';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { examenes, formatoFecha } from '@/data/mock';
import { CloudUpload, Download, FileText, ScanLine } from 'lucide-react-native';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Examenes() {
  // TODO(fase 6): expo-document-picker + Supabase Storage
  const subir = () => {};

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScreenHeader title="Mis Exámenes" actionIcon={CloudUpload} onAction={subir} />
      <ScrollView contentContainerClassName="gap-4 p-4">
        <Pressable
          onPress={subir}
          className="items-center gap-2 rounded-3xl border-2 border-dashed border-ring bg-secondary/60 px-4 py-8 active:opacity-80">
          <Icon as={CloudUpload} size={44} className="text-primary" />
          <Text className="font-semibold text-secondary-foreground">Sube tus exámenes médicos</Text>
          <Text variant="muted">Formatos: JPG, PDF, PNG</Text>
        </Pressable>

        <View className="flex-row flex-wrap justify-between gap-y-4">
          {examenes.map((e) => (
            <Card key={e.id} className="w-[48%] gap-0 overflow-hidden rounded-2xl py-0">
              <View className="h-32 items-center justify-center bg-muted">
                <Icon as={e.tipo === 'imagen' ? ScanLine : FileText} size={48} className="text-muted-foreground" />
              </View>
              <View className="flex-row items-center p-3">
                <View className="flex-1">
                  <Text className="text-sm font-semibold" numberOfLines={1}>{e.titulo}</Text>
                  <Text className="text-xs text-muted-foreground">{formatoFecha(e.fecha)}</Text>
                </View>
                <Icon as={Download} size={20} className="text-primary" />
              </View>
            </Card>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
