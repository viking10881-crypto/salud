import { type Href, router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { Platform } from 'react-native';

function abrir(n: Notifications.Notification) {
  const url = n.request.content.data?.url;
  if (typeof url === 'string') router.push(url as Href);
}

/** Al tocar una notificación (con la app abierta o cerrada) navega a su pantalla. */
export function ManejadorNotificaciones() {
  useEffect(() => {
    if (Platform.OS === 'web') return;
    let vigente = true;

    // La app se abrió desde una notificación
    Notifications.getLastNotificationResponseAsync().then((r) => {
      if (vigente && r) {
        abrir(r.notification);
        Notifications.clearLastNotificationResponseAsync();
      }
    });

    const sub = Notifications.addNotificationResponseReceivedListener((r) => abrir(r.notification));
    return () => {
      vigente = false;
      sub.remove();
    };
  }, []);

  return null;
}
