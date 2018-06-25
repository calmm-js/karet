# <a id="karet"></a> [≡](#contents) Karet &middot; [![Gitter](https://img.shields.io/gitter/room/calmm-js/chat.js.svg)](https://gitter.im/calmm-js/chat) [![GitHub stars](https://img.shields.io/github/stars/calmm-js/karet.svg?style=social)](https://github.com/calmm-js/karet) [![npm](https://img.shields.io/npm/dm/karet.svg)](https://www.npmjs.com/package/karet)

Karet is a library that allows you to embed
[Kefir](https://kefirjs.github.io/kefir/) properties into
[React](https://facebook.github.io/react/) Virtual DOM.  Embedding observable
properties into VDOM has the following benefits:

* It allows you to use only [functional
  components](https://facebook.github.io/react/docs/components-and-props.html#functional-and-class-components),
  because you can then use observables for managing state and component
  lifetime, leading to more **_concise code_**.
* It helps you to use React in an **_algorithmically efficient_** way:
  * The body of a functional component is evaluated only once each time the
    component is mounted.
  * Only elements that contain embedded properties are rerendered when changes
    are pushed through observables.  An update to a deeply nested VDOM element
    can be an `O(1)` operation.

Using Karet couldn't be simpler.  Usually you just `import * as React from
'karet'` and you are good to go.

[![npm version](https://badge.fury.io/js/karet.svg)](http://badge.fury.io/js/karet)
[![Gitter](https://img.shields.io/gitter/room/calmm-js/chat.js.svg)](https://gitter.im/calmm-js/chat)
[![Build Status](https://travis-ci.org/calmm-js/karet.svg?branch=master)](https://travis-ci.org/calmm-js/karet)
[![Code Coverage](https://img.shields.io/codecov/c/github/calmm-js/karet/master.svg)](https://codecov.io/github/calmm-js/karet?branch=master)
[![](https://david-dm.org/calmm-js/karet.svg)](https://david-dm.org/calmm-js/karet)
[![](https://david-dm.org/calmm-js/karet/dev-status.svg)](https://david-dm.org/calmm-js/karet?type=dev)

## <a id="contents"></a> [≡](#contents) Contents

* [Tutorial](#tutorial)
* [Reference](#reference)
  * [React exports passed through](#react-exports-passed-through)
  * [`karet-lift` attribute](#karet-lift)
  * [`fromClass(Component)`](#fromClass "fromClass: Component props -> Component (Property props)")
  * [Known gotchas](#known-gotchas)

## <a id="tutorial"></a> [≡](#contents) Tutorial

To use Karet, you simply import it as `React`:

```jsx
import * as React from 'karet'
```

and you can then write React components:

```jsx
const App = () => (
  <div>
    <h1>What is the date and time</h1>
    {Kefir.interval(1000)
      .toProperty(() => {})
      .map(() => new Date().toString())}
  </div>
)
```

with VDOM that can have embedded [Kefir](https://kefirjs.github.io/kefir/)
properties.  This works because Karet exports an enhanced version of
`createElement`.

Note that the result, like the date and time display above, is *just* a React
component.  If you export it, you can use it just like any other React component
and even in modules that do not import `karet`.

[Here is a live example in CodeSandbox](https://codesandbox.io/s/2o1mmnwxvp).

[More links to live examples in the Calmm documentation
Wiki](https://github.com/calmm-js/documentation/wiki/Links-to-live-examples).

## <a id="reference"></a> [≡](#contents) Reference

### <a id="react-exports-passed-through"></a> [≡](#contents) [React exports passed through](#react-exports-passed-through)

Karet passes through the following exports from React:

* [`Children`](https://reactjs.org/docs/react-api.html#reactchildren) as is.
  Note that with observable properties in children these functions may not do
  exactly what you want and you might want to
  [lift](https://github.com/calmm-js/karet.util#lifting) them.
* [`Fragment`](https://reactjs.org/docs/fragments.html) as is.  It should work
  without problems.
* [`createContext`](https://reactjs.org/docs/context.html#reactcreatecontext) as
  is.  Note that with Karet it is preferable to put observable properties into
  the context and let changes propagate through them rather than update the
  context.  Also note that neither the provider nor the consumer are lifted by
  default.  Lifting the consumer will likely cause no issues, but lifting the
  provider would eliminate observables from the `value` property and could cause
  problems.  If you need to have observable children inside the provider, you
  can wrap the children inside a
  [`Fragment`](https://reactjs.org/docs/fragments.html).  See the CodeSandbox
  examples
  * [Exam Events Form](https://codesandbox.io/s/x20w218owo) where the context is
    used to transmit the language as an observable atom, and
  * [Form using Context](https://codesandbox.io/s/2rq54pgrp) where context is
    used to transmit form properties to form elements.
* [`createElement`](https://reactjs.org/docs/react-api.html#createelement) which
  lifts Kefir properties in [fragments](https://reactjs.org/docs/fragments.html)
  and built-in HTML elements.
* [`forwardRef`](https://reactjs.org/docs/react-api.html#reactforwardref) as is.

Notably the following are not exported:

* [`Component`](https://reactjs.org/docs/react-api.html#reactcomponent) and
  [`PureComponent`](https://reactjs.org/docs/react-api.html#reactpurecomponent),
  because with Karet you really don't need them and the `render` method can
  cause undesired component remounting when used with observable properties
  embedded into VDOM.
* [`cloneElement`](https://reactjs.org/docs/react-api.html#cloneelement) does
  not work out of the box with elements containing Kefir properties.  It should
  be possible [to support it](https://github.com/calmm-js/karet/issues/6),
  however.
* [`createRef`](https://reactjs.org/docs/react-api.html#reactcreateref) is not
  exported, because [Karet Util](https://github.com/calmm-js/karet.util)
  provides an [alternative](https://github.com/calmm-js/karet.util/#U-refTo)
  that works better with observable properties.

### <a id="karet-lift"></a> [≡](#contents) [`karet-lift` attribute](#karet-lift)

Karet only lifts built-in HTML elements and [fragments](#Fragment) implicitly.
The `karet-lift` attribute on a non-primitive element instructs Karet to lift
the element.

For example, you could write:

```jsx
import Select from 'react-select'
import * as React from 'karet'

// ...

const ReactSelect1 = ({value}) => (
  <Select
    karet-lift
    name="form-field-name"
    value={value}
    options={options}
    onChange={o => value.set(o && o.value)}
  />
)
```

to be able to use `Select` from [React
Select](https://github.com/JedWatson/react-select) with embedded [Kefir
Atoms](https://github.com/calmm-js/kefir.atom).

[Here is a live example in CodeSandbox](https://codesandbox.io/s/7yjj16jz7q).

### <a id="fromClass"></a> [≡](#contents) [`fromClass(Component)`](#fromClass "fromClass: Component props -> Component (Property props)")

Karet only lifts built-in HTML elements and [fragments](#Fragment) implicitly.
`fromClass` allows one to create lifted version of a given React component.

For example, you could write:

```jsx
import Select from 'react-select'
import * as React from 'karet'

const SelectLifted = React.fromClass(Select)

const ReactSelect2 = ({value}) => (
  <SelectLifted
    name="form-field-name"
    value={value}
    options={options}
    onChange={o => value.set(o && o.value)}
  />
)
```

to be able to use `Select` from [React
Select](https://github.com/JedWatson/react-select) with embedded [Kefir
Atoms](https://github.com/calmm-js/kefir.atom).

[Here is a live example in CodeSandbox](https://codesandbox.io/s/7yjj16jz7q).

### <a id="known-gotchas"></a> [≡](#contents) [Known gotchas](#known-gotchas)

The [React inline elements transform
](https://babeljs.io/docs/plugins/transform-react-inline-elements/) is
incompatible with Karet, because it bypasses `React.createElement`.  OTOH, the
[React constant elements
transform](https://babeljs.io/docs/plugins/transform-react-constant-elements/)
works just fine with Karet.
