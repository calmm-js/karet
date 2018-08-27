# Changelog

## 4.0.1

Fixed bug with use of `key` prop with components created using `fromClass`.

## 3.2.1

Changed rendering of children to replace `undefined` children with `null`
children, because `React.Fragment` apparently does not like `undefined`
children.

## 3.0.0

Only Kefir properties, in other words, objects that inherit `Kefir.Property`,
are lifted.  `Kefir.Stream` and `Kefir.Observable` objects are not lifted and
will result in errors.

Dropped previously obsoleted `fromKefir` combinator.

`$$ref` is no longer required due to using `React.forwardRef` in `fromClass`.

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
