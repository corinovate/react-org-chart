import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: { index: 'src/core/index.ts' },
    outDir: 'dist',
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: true,
    treeshake: true,
  },
  {
    entry: { index: 'src/react/index.ts' },
    outDir: 'dist/react',
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    treeshake: true,
    external: ['react', 'react-dom'],
  },
  {
    entry: { index: 'src/native/index.ts' },
    outDir: 'dist/native',
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    treeshake: true,
    external: [
      'react',
      'react-native',
      'react-native-svg',
      'react-native-gesture-handler',
      'react-native-reanimated',
      'expo-print',
      'expo-linear-gradient',
    ],
  },
]);
