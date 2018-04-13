# Changelog

## 2.1.0

Added support for fragments, IOW the `React.Fragment` component, and deprecated
`fromKefir`, because fragments make it unnecessary:

```diff
-const Foo = ( ... ) =>
-  fromKefir( ... )
+const Foo = ( ... ) =>
+  <React.Fragment>
+    { ... }
+  </React.Fragment>
```

## 1.1.0

Kefir was changed from a dependency to a peer dependency to avoid the
possibility of having multiple versions of Kefir in a project.
