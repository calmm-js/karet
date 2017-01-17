[![npm version](https://badge.fury.io/js/karet.svg)](http://badge.fury.io/js/karet) [![Build Status](https://travis-ci.org/calmm-js/karet.svg?branch=master)](https://travis-ci.org/calmm-js/karet) [![Code Coverage](https://img.shields.io/codecov/c/github/calmm-js/karet/master.svg)](https://codecov.io/github/calmm-js/karet?branch=master) [![](https://david-dm.org/calmm-js/karet.svg)](https://david-dm.org/calmm-js/karet) [![](https://david-dm.org/calmm-js/karet/dev-status.svg)](https://david-dm.org/calmm-js/karet?type=dev)

This is an experimental library that allows you to
embed [Kefir](http://rpominov.github.io/kefir/) observables
into [React](https://facebook.github.io/react/) Virtual DOM.

## Reference

To use Karet, you simply import it as `React`:

```jsx
import React from "karet"
```

and you can then write React components:

```jsx
const oncePerSecond = Kefir.interval(1000).toProperty(() => {})

const Clock = () =>
  <div>
    The time is {oncePerSecond.map(() => new Date().toString())}.
  </div>
```

with VDOM that can have embedded [Kefir](http://rpominov.github.io/kefir/)
observables.

**NOTE:** The result, like the `Clock` above, is *just* a React component.  If
you export it, you can use it just like any other React component and even in
modules that do not import `karet`.

### <a name="karet-lift"></a> [`karet-lift` attribute](#karet-lift)

Karet only lifts built-in HTML elements implicitly.  You can instruct Karet to
lift non-primitive elements by adding the `karet-lift` attribute to them.  For
example, you could write:

```jsx
import * as RR from "react-router"
import React   from "karet"

const Link1 = ({...props}) => <RR.Link karet-lift {...props}/>
```

to be able to use `Link1` with
embedded [Kefir](http://rpominov.github.io/kefir/) observables:

```jsx
<Link1 href="https://www.youtube.com/watch?v=Rbm6GXllBiw"
       ref={dom => dom && dom.focus()}>
  {Kefir.sequentially(1000, [3, 2, 1, "Boom!"])}
</Link1>
```

(The silly `ref` attribute example is there as an example to contrast
with [`$$ref`](#ref).)

### <a name="fromKefir"></a> [`fromKefir(vdomObservable)`](#fromKefir "fromKefir: Observable VDOM -> VDOM")

In case the top-most element of a component depends on a Kefir observable, one
can use `fromKefir`:

```jsx
import {fromKefir} from "karet"
import {ifte} from "karet.util"

const choice = Atom(false)
// ...
fromKefir(ifte(choice, <True/>, <False/>))
```

### <a name="fromClass"></a> [`fromClass(Component)`](#fromClass "fromClass: Component props -> Component (Observable props)")

Aside from using [`karet-lift`](#karet-lift) to lift particular elements, you
can also lift components using `fromClass`:

```jsx
import * as RR from "react-router"
import {fromClass} from "karet"

const Link2 = fromClass(RR.Link)
```

**WARNING:** A difficulty with lifting components is that you will then need to
use the [`$$ref`](#ref) attribute, which is not necessary when
using [`karet-lift`](#karet-lift).

#### <a name="ref"></a> [`$$ref` attribute](#ref)

The `$$ref` attribute on an element whose component is lifted using `fromClass`

```jsx
<Link2 href="https://www.youtube.com/watch?v=Rbm6GXllBiw"
       $$ref={dom => dom && dom.focus()}>
  {Kefir.sequentially(1000, [3, 2, 1, "Boom!"])}
</Link2>
```

does the same thing as the ordinary
JSX
[`ref` attribute](https://facebook.github.io/react/docs/more-about-refs.html#the-ref-callback-attribute):
JSX/React treats `ref` as a special case and it is not passed to components, so
a special name had to be introduced for it.
