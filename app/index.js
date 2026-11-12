import 'react-native-gesture-handler';
import { AppRegistry, Platform } from 'react-native';
import App from './App';

// Registrar el componente raíz 'main' de forma garantizada antes de cualquier módulo nativo opcional
// para evitar el fallo "[runtime not ready]: Cannot find native module 'ExpoAsset' / 'main' has not been registered"
AppRegistry.registerComponent('main', () => App);

try {
  // Inicialización opcional de utilidades de desarrollo de Expo cuando el runtime JSI ya está listo
  const { registerRootComponent } = require('expo');
  if (typeof registerRootComponent === 'function') {
    registerRootComponent(App);
  }
} catch (_e) {
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    const rootTag = document.getElementById('root');
    if (rootTag) {
      AppRegistry.runApplication('main', { rootTag });
    }
  }
}

