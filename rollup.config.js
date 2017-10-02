import babel       from "rollup-plugin-babel"
import commonjs    from "rollup-plugin-commonjs"
import nodeResolve from "rollup-plugin-node-resolve"
import replace     from "rollup-plugin-replace"
import uglify      from "rollup-plugin-uglify"

export default {
  exports: "named",
  external: ["infestines", "react", "kefir"],
  globals: {
    "infestines": "I",
    "kefir": "Kefir",
    "react": "React"
  },
  plugins: [
    process.env.NODE_ENV &&
      replace({"process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV)}),
    nodeResolve(),
    commonjs({
      include: "node_modules/**",
      namedExports: {
        "node_modules/react/index.js": [
          "Component",
          "createElement"
        ]
      }
    }),
    babel(),
    process.env.NODE_ENV === "production" &&
      uglify()
  ].filter(x => x)
}
