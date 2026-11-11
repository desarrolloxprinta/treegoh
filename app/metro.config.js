const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Permite importar directamente el corpus científico maestro (../biblia-plantas/output/biblia.json)
config.watchFolders = [path.resolve(__dirname, '..')];

module.exports = config;


