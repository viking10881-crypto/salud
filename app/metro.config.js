const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Permite empaquetar el avatar 3D (GLB/GLTF) como asset
config.resolver.assetExts.push('glb', 'gltf');

module.exports = withNativeWind(config, { input: './src/global.css', inlineRem: 16 });
