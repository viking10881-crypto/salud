// Quita el fondo amarillo que Android pinta en los campos rellenados con autocompletar
// (contraseñas guardadas, correo…). El autocompletado sigue funcionando.
// Solo aplica a la app compilada (APK / development build); Expo Go usa su propio tema.
const { AndroidConfig, withAndroidStyles } = require('expo/config-plugins');

module.exports = function sinResaltadoAutocompletar(config) {
  return withAndroidStyles(config, (cfg) => {
    cfg.modResults = AndroidConfig.Styles.assignStylesValue(cfg.modResults, {
      add: true,
      parent: AndroidConfig.Styles.getAppThemeGroup(),
      name: 'android:autofilledHighlight',
      value: '@android:color/transparent',
    });
    return cfg;
  });
};
