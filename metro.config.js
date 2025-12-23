const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  resolver: {
    sourceExts: ['js', 'json', 'ts', 'tsx', 'jsx', 'shared'],
    assetExts: ['png', 'jpg', 'jpeg', 'svg', 'gif', 'webp'],
    resolveRequest: (context, moduleName, platform) => {
      // Fix for Supabase realtime-js module resolution
      if (moduleName === '@supabase/realtime-js') {
        return {
          filePath: require.resolve('@supabase/realtime-js'),
          type: 'sourceFile',
        };
      }
      return context.resolveRequest(context, moduleName, platform);
    },
  },
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
