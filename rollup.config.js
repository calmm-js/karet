import babel from 'rollup-plugin-babel'
import commonjs from 'rollup-plugin-commonjs'
import nodeResolve from 'rollup-plugin-node-resolve'
import replace from 'rollup-plugin-replace'
import uglify from 'rollup-plugin-uglify'

const build = ({NODE_ENV, format, file}) => ({
  external: ['infestines', 'react', 'kefir'],
  input: 'src/karet.js',
  output: {
    globals: {
      infestines: 'I',
      kefir: 'Kefir',
      react: 'React'
    },
    exports: 'named',
    name: 'karet',
    format,
    file
  },
  plugins: [
    NODE_ENV && replace({'process.env.NODE_ENV': JSON.stringify(NODE_ENV)}),
    nodeResolve(),
    commonjs({
      include: 'node_modules/**',
      namedExports: {
        'node_modules/react/index.js': ['Component', 'createElement']
      }
    }),
    babel(),
    NODE_ENV === 'production' &&
      uglify({
        compress: {
          hoist_funs: true,
          passes: 3,
          pure_getters: true,
          pure_funcs: ['require']
        }
      })
  ].filter(x => x)
})

export default [
  build({format: 'cjs', file: 'dist/karet.cjs.js'}),
  build({format: 'es', file: 'dist/karet.es.js'}),
  build({format: 'umd', file: 'dist/karet.js', NODE_ENV: 'dev'}),
  build({
    format: 'umd',
    file: 'dist/karet.min.js',
    NODE_ENV: 'production'
  })
]
