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
    can be an O(1) operation.

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
  * [`Fragment`](#Fragment)
  * [`karet-lift` attribute](#karet-lift)
  * [`fromClass(Component)`](#fromClass "fromClass: Component props -> Component (Property props)")

## <a id="tutorial"></a> [≡](#contents) Tutorial

To use Karet, you simply import it as `React`:

```jsx
import * as React from "karet"
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

[Here is a live example in CodeSandbox](https://codesandbox.io/s/2o1mmnwxvp).

**NOTE:** Karet does not pass through all named React exports.  Only
`createElement` and [`Fragment`](#Fragment) are exported, which is all that is
needed for basic use of VDOM or the Babel JSX transform.

**NOTE:** The result, like the date and time dispplay above, is *just* a React
component.  If you export it, you can use it just like any other React component
and even in modules that do not import `karet`.

## <a id="reference"></a> [≡](#contents) Reference

### <a id="Fragment"></a> [≡](#contents) [`Fragment`](#Fragment)

In addition to `createElement`, Karet exports [React's `Fragment`
component](https://reactjs.org/docs/fragments.html) and lifts fragments
implicitly.

### <a id="karet-lift"></a> [≡](#contents) [`karet-lift` attribute](#karet-lift)

Karet only lifts built-in HTML elements and [fragments](#Fragment) implicitly.
The `karet-lift` attribute on a non-primitive element instructs Karet to lift
the element.

For example, you could write:

```jsx
import Select from 'react-select'
import * as React from "karet"

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
import * as React from "karet"

const SelectLifted = React.fromClassdate and time dispplay

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
