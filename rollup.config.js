import pkg from './package.json';
import sourcemaps from 'rollup-plugin-sourcemaps';
import nodeResolve from '@rollup/plugin-node-resolve';

export default {
  input: 'dist/index.js',

  plugins: [sourcemaps(), nodeResolve()],

  external: ['path', 'node-sass', 'fs', 'util'],

  output: [
    {
      sourcemap: true,
      format: 'cjs',
      file: pkg.main,
    },
    {
      sourcemap: true,
      format: 'es',
      file: pkg.module,
    },
  ],
};
