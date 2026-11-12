/**
 * Expo Config Plugin: withIosWidget
 * 
 * Configura los derechos de App Group (group.com.treegoh.app) para compartir
 * datos entre la aplicación React Native y los Widgets nativos de iOS (WidgetKit).
 */

const { withEntitlementsPlist } = require('@expo/config-plugins');

const APP_GROUP = 'group.com.treegoh.app';

const withIosWidget = (config) => {
  // Configurar App Groups en los derechos (entitlements) de iOS
  config = withEntitlementsPlist(config, (modConfig) => {
    const entitlements = modConfig.modResults;
    const currentGroups = entitlements['com.apple.security.application-groups'] || [];
    if (!currentGroups.includes(APP_GROUP)) {
      entitlements['com.apple.security.application-groups'] = [...currentGroups, APP_GROUP];
    }
    return modConfig;
  });

  return config;
};

module.exports = withIosWidget;

