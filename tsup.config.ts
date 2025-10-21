import { defineConfig } from 'tsup'

export default defineConfig((options) => {
  return {
    clean: true,
    dts: true,
    sourcemap: true,
    format: 'esm',
    entry: ['src/index.ts'],
    outDir: 'dist',
    target: 'es2022',
    treeshake: true,
  }
})
