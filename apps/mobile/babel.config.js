module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Reanimated v4 (Expo SDK 54) — worklets plugin replaces the legacy
    // 'react-native-reanimated/plugin'. Must be last in the plugin list.
    plugins: ['react-native-worklets/plugin'],
  };
};
