import * as R       from "ramda"
import React        from "react"
import {Observable} from "kefir"

//

class LiftedComponent extends React.Component {
  constructor(props) {
    super(props)
    this.state = this.theInitialState()
  }
  componentWillReceiveProps(nextProps) {
    this.doUnsubscribe()
    this.doSubscribe(nextProps)
  }
  componentWillMount() {
    this.doUnsubscribe()
    this.doSubscribe(this.props)
  }
  shouldComponentUpdate(np, ns) {
    return ns.rendered !== this.state.rendered
  }
  componentWillUnmount() {
    this.doUnsubscribe()
    this.setState(this.theInitialState())
  }
  render() {
    return this.state.rendered
  }
}

//

const FromKefirEnd = {callback: null}
const FromKefirNull = {callback: null, rendered: null}

class FromKefir extends LiftedComponent {
  constructor(props) {
    super(props)
  }
  theInitialState() {
    return FromKefirNull
  }
  doUnsubscribe() {
    const {callback} = this.state
    if (callback)
      this.props.observable.offAny(callback)
  }
  doSubscribe({observable}) {
    if (observable instanceof Observable) {
      const callback = e => {
        switch (e.type) {
          case "value":
            this.setState({rendered: e.value})
            break
          case "error":
            throw e.value
          case "end":
            this.setState(FromKefirEnd)
            break
        }
      }
      observable.onAny(callback)
      this.setState({callback})
    } else {
      this.setState({rendered: observable})
    }
  }
}

export const fromKefir = observable =>
  React.createElement(FromKefir, {observable})

//

function hasObs(props) {
  for (const key in props) {
    const val = props[key]
    if (val instanceof Observable) {
      return true
    } else if ("style" === key) {
      for (const k in val) {
        const valK = val[k]
        if (valK instanceof Observable)
          return true
      }
    }
  }
  return false
}

function forEach({props, children}, fn) {
  for (const key in props) {
    const val = props[key]
    if (val instanceof Observable) {
      fn(val)
    } else if ("style" === key) {
      for (const k in val) {
        const valK = val[k]
        if (valK instanceof Observable)
          fn(valK)
      }
    }
  }
  for (let i=0; i<children.length; ++i) {
    const val = children[i]
    if (val instanceof Observable)
      fn(val)
  }
}

function render({type, props, children}, values) {
  const newProps = props ? {} : null
  const newChildren = Array(children.length)

  let k = -1

  if (props) {
    for (const key in props) {
      const val = props[key]
      if (val instanceof Observable) {
        const valO = values[++k]
        newProps[key] = valO
      } else if ("style" === key) {
        let newStyle
        for (const i in val) {
          const valI = val[i]
          if (valI instanceof Observable) {
            if (!newStyle) {
              newStyle = {}
              for (const j in val) {
                if (j === i)
                  break
                newStyle[j] = val[j]
              }
            }
            newStyle[i] = values[++k]
          } else if (newStyle) {
            newStyle[i] = valI
          }
        }
        newProps.style = newStyle || val
      } else {
        newProps[key] = val
      }
    }
  }

  for (let i=0, n=children.length; i<n; ++i) {
    const valI = children[i]
    if (valI instanceof Observable)
      newChildren[i] = values[++k]
    else
      newChildren[i] = valI
  }

  return React.createElement(type, newProps, ...newChildren)
}

//

function FakeComponent(state, props) {
  this.props = props
  this.state = state
}

FakeComponent.prototype.setState = function (newState) {
  if ("renderer" in newState)
    this.state.renderer = newState.renderer
  if ("rendered" in newState)
    this.state.rendered = newState.rendered
}

//

function Renderer1(component, newProps) {
  const state = {renderer: this, rendered: component.state.rendered}
  this.component = new FakeComponent(state, newProps)
  this.handler = e => this.doHandle(e)
  forEach(newProps, observable => observable.onAny(this.handler))
  this.component = component
  component.setState(state)
}

Renderer1.prototype.unsubscribe = function () {
  const handler = this.handler
  if (handler)
    forEach(this.component.props, observable => observable.offAny(handler))
}

Renderer1.prototype.doHandle = function (e) {
  switch (e.type) {
    case "value": {
      const component = this.component
      const rendered = render(component.props, [e.value])
      if (!R.equals(component.state.rendered, rendered))
        component.setState({rendered})
      return
    }
    case "error":
      throw e.value
    default:
      this.handler = null
      this.component.setState(FromClassEnd)
      return
  }
}

//

function RendererN(component, newProps, n) {
  const state = {renderer: this, rendered: component.state.rendered}
  this.component = new FakeComponent(state, newProps)
  this.handlers = []
  this.values = Array(n)

  for (let i=0; i<n; ++i)
    this.values[i] = this

  forEach(newProps, observable => {
    const i = this.handlers.length
    const handler = e => this.doHandle(i, e)
    this.handlers.push(handler)
    observable.onAny(handler)
  })

  this.component = component
  component.setState(state)
}

RendererN.prototype.unsubscribe = function () {
  let i = -1
  forEach(this.component.props, observable => {
    const handler = this.handlers[++i]
    if (handler)
      observable.offAny(handler)
  })
}

RendererN.prototype.doHandle = function (idx, e) {
  switch (e.type) {
    case "value": {
      this.values[idx] = e.value

      for (let i=this.values.length-1; 0 <= i; --i)
        if (this.values[i] === this)
          return

      const component = this.component
      const rendered = render(component.props, this.values)
      if (!R.equals(component.state.rendered, rendered))
        component.setState({rendered})
      return
    }
    case "error":
      throw e.value
    default: {
      this.handlers[idx] = null

      const n = this.handlers.length

      if (n !== this.values.length)
        return

      for (let i=0; i < n; ++i)
        if (this.handlers[i])
          return

      this.component.setState(FromClassEnd)
      return
    }
  }
}

//

const FromClassEnd = {renderer: null}
const FromClassNull = {renderer: null, rendered: null}

class FromClass extends LiftedComponent {
  constructor(props) {
    super(props)
  }
  theInitialState() {
    return FromClassNull
  }
  doUnsubscribe() {
    const {renderer} = this.state
    if (renderer)
      renderer.unsubscribe()
  }
  doSubscribe(props) {
    let n = 0
    forEach(props, () => n += 1)

    switch (n) {
      case 1:
        new Renderer1(this, props)
        break
      default:
        new RendererN(this, props, n)
        break
    }
  }
}

//

class Client {
  createElement(type, props, ...children) {
    if (typeof type === "string" &&
        (children.find(x => x instanceof Observable) ||
         (props && hasObs(props)))) {
      return React.createElement(FromClass, {type, props, children})
    } else {
      return React.createElement(type, props, ...children)
    }
  }
}

export default new Client()
