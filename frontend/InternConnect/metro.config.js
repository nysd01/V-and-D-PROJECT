const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push('glb', 'gltf', 'usdz');

config.resolver.extraNodeModules = {
  '@': path.resolve(__dirname),
};

module.exports = config;