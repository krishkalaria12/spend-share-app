const { getDefaultConfig } = require('expo/metro-config');

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  resolver: {
    // Add patterns to ignore require cycles for node_modules and src directory
    requireCycleIgnorePatterns: [
      /node_modules\/.*/,
      /src\/.*/,
    ],
  },
};

module.exports = getDefaultConfig(__dirname), config;