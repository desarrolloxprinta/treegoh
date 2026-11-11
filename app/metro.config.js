const { getDefaultConfig } = require('expo/metro-config');

// Auto-sync official Treegoh app icons if master source exists
try {
  require('./scripts/sync-icons');
} catch (e) {
  // Silent fallback if running in environments without image processing
}

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

module.exports = config;


