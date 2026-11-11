module.exports = function (api) {
  api.cache(true);
  let expoPreset = 'babel-preset-expo';
  try {
    expoPreset = require.resolve('babel-preset-expo', { paths: [__dirname] });
  } catch (_e) {
    try {
      expoPreset = require.resolve('babel-preset-expo', {
        paths: [require.resolve('expo/package.json')],
      });
    } catch (_e2) {
      expoPreset = 'babel-preset-expo';
    }
  }
  return {
    presets: [expoPreset],
  };
};

