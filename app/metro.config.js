const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Permite empaquetar el avatar 3D (GLB/GLTF) como asset
config.resolver.assetExts.push('glb', 'gltf');

// three >= 0.18x: su build CommonJS (three.cjs, que pide React Three Fiber con require)
// llama a process.emitWarning, que no existe en React Native. Se fuerza el build ESM.
const path = require('path');
const THREE_ESM = path.join(path.dirname(require.resolve('three')), 'three.module.js');
const resolverPrevio = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'three') return { type: 'sourceFile', filePath: THREE_ESM };
  return (resolverPrevio ?? context.resolveRequest)(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: './src/global.css', inlineRem: 16 });
