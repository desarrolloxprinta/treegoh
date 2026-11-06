const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Permite importar directamente el corpus científico maestro (../biblia-plantas/output/biblia.json)
config.watchFolders = [path.resolve(__dirname, '..')];

// Fuerza invalidación de caché de transformación en WSL2 / Expo SDK 58
config.resetCache = true;
config.cacheVersion = 'treegoh-stage-66-profile-photo-upload-and-header-sync';

module.exports = config;


