const { getDefaultConfig } = require("expo/metro-config");
const { mergeConfig } = require("@react-native/metro-config");
const { withRorkMetro } = require("@rork-ai/toolkit-sdk/metro");

const defaultConfig = getDefaultConfig(__dirname);

const customConfig = {
  transformer: {
    unstable_allowRequireContext: true,
  },
};

const mergedConfig = mergeConfig(defaultConfig, customConfig);

module.exports = withRorkMetro(mergedConfig);