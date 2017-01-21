import React from "react"
import {Observable} from "kefir"
import {
  array0,
  assocPartialU,
  dissocPartialU,
  inherit,
  isArray,
  object0
} from "infestines"

//

const reactElement = React.createElement
const Component = React.Component

const isObs = x => x instanceof Observable

//

function LiftedComponent(props) {
  Component.call(this, props)
}

inherit(LiftedComponent, Component, {
  componentWillReceiveProps(nextProps) {
    this.doUnsubscribe()
    this.doSubscribe(nextProps)
  },
  componentWillMount() {
    this.doSubscribe(this.props)
  },
  componentWillUnmount() {
    this.doUnsubscribe()
  }
})

//

function FromKefir(props) {
  LiftedComponent.call(this, props)
  this.callback = null
  this.rendered = null
}

inherit(FromKefir, LiftedComponent, {
  doUnsubscribe() {
    const callback = this.callback
    if (callback)
      this.props.observable.offAny(callback)
  },
  doSubscribe({observable}) {
    if (isObs(observable)) {
      const callback = e => {
        switch (e.type) {
          case "value":
            this.rendered = e.value || null
            this.forceUpdate()
            break
          case "error":
            throw e.value
          case "end":
            this.callback = null
        }
      }
      this.callback = callback
      observable.onAny(callback)
    } else {
      this.rendered = observable || null
    }
  },
  render() {
    return this.rendered
  }
})

export const fromKefir = observable => reactElement(FromKefir, {observable})

//

function hasObs(props) {
  for (const key in props) {
    const val = props[key]
    if (isObs(val)) {
      return true
    } else if ("style" === key) {
      for (const k in val) {
        const valK = val[k]
        if (isObs(valK))
          return true
      }
    }
  }
  return false
}

function forEach(props, extra, fn) {
  for (const key in props) {
    const val = props[key]
    if (isObs(val)) {
      fn(extra, val)
    } else if ("children" === key) {
      const children = props[key]
      if (isArray(children)) {
        for (let i=0; i<children.length; ++i) {
          const val = children[i]
          if (isObs(val))
            fn(extra, val)
        }
      }
    } else if ("style" === key) {
      for (const k in val) {
        const valK = val[k]
        if (isObs(valK))
          fn(extra, valK)
      }
    }
  }
}

function render(props, values) {
  let type = null
  let newProps = null
  let newChildren = null

  let k = -1

  for (const key in props) {
    const val = props[key]
    if ("children" === key) {
      if (isObs(val)) {
        newChildren = values[++k]
      } else if (isArray(val)) {
        for (let i=0, n=val.length; i<n; ++i) {
          const valI = val[i]
          if (isObs(valI)) {
            if (!newChildren) {
              newChildren = Array(val.length)
              for (let j=0; j<i; ++j)
                newChildren[j] = val[j]
            }
            newChildren[i] = values[++k]
          } else if (newChildren)
            newChildren[i] = valI
        }
        if (!newChildren)
          newChildren = val
      } else {
        newChildren = val
      }
    } else if ("$$ref" === key) {
      newProps = newProps || {}
      newProps.ref = isObs(val) ? values[++k] : val
    } else if (isObs(val)) {
      newProps = newProps || {}
      newProps[key] = values[++k]
    } else if ("style" === key) {
      let newStyle
      for (const i in val) {
        const valI = val[i]
        if (isObs(valI)) {
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
      newProps = newProps || {}
      newProps.style = newStyle || val
    } else if ("$$type" === key) {
      type = props[key]
    } else {
      newProps = newProps || {}
      newProps[key] = val
    }
  }

  return newChildren instanceof Array
    ? reactElement.apply(null, [type, newProps].concat(newChildren))
    : newChildren
    ? reactElement(type, newProps, newChildren)
    : reactElement(type, newProps)
}

//

function incValues(self) { self.values += 1 }
function offAny1(handlers, obs) { obs.offAny(handlers) }
function offAny(handlers, obs) {
  const handler = handlers.pop()
  if (handler)
    obs.offAny(handler)
}
function onAny1(handlers, obs) { obs.onAny(handlers) }
function onAny(self, obs) {
  const handler = e => self.doHandleN(handler, e)
  self.handlers.push(handler)
  obs.onAny(handler)
}

function FromClass(props) {
  LiftedComponent.call(this, props)
  this.values = this
  this.handlers = null
}

inherit(FromClass, LiftedComponent, {
  doUnsubscribe() {
    const handlers = this.handlers
    if (handlers) {
      if (handlers instanceof Function) {
        forEach(this.props, handlers, offAny1)
      } else {
        forEach(this.props, handlers.reverse(), offAny)
      }
    }
  },
  doSubscribe(props) {
    this.values = 0
    forEach(props, this, incValues)
    const n = this.values

    switch (n) {
      case 0:
        this.values = array0
        break
      case 1: {
        this.values = this
        const handlers = e => this.doHandle1(e)
        this.handlers = handlers
        forEach(props, handlers, onAny1)
        break
      }
      default:
        this.values = Array(n).fill(this)
        this.handlers = []
        forEach(props, this, onAny)
    }
  },
  doHandle1(e) {
    switch (e.type) {
      case "value": {
        const value = e.value
        if (this.values !== value) {
          this.values = value
          this.forceUpdate()
        }
        break
      }
      case "error": throw e.value
      default: {
        this.values = [this.values]
        this.handlers = null
      }
    }
  },
  doHandleN(handler, e) {
    const handlers = this.handlers
    let idx=0
    while (handlers[idx] !== handler)
      ++idx
    switch (e.type) {
      case "value": {
        const value = e.value
        const values = this.values
        if (values[idx] !== value) {
          values[idx] = value
          this.forceUpdate()
        }
        break
      }
      case "error": throw e.value
      default: {
        handlers[idx] = null
        const n = handlers.length
        if (n !== this.values.length)
          return
        for (let i=0; i < n; ++i)
          if (handlers[i])
            return
        this.handlers = null
      }
    }
  },
  render() {
    if (this.handlers instanceof Function) {
      const value = this.values
      if (value === this)
        return null
      return render(this.props, [value])
    } else {
      const values = this.values
      for (let i=0, n=values.length; i<n; ++i)
        if (values[i] === this)
          return null
      return render(this.props, values)
    }
  }
})

//

function hasAnyObs(props, args) {
  for (let i=2, n=args.length; i<n; ++i) {
    const arg = args[i]
    if (Array.isArray(arg)) {
      for (let j=0, m=arg.length; j<m; ++j)
        if (isObs(arg[j]))
          return true
    } else if (isObs(arg)) {
      return true
    }
  }
  return hasObs(args[1])
}

function filterProps(type, props) {
  const newProps = {"$$type": type}
  for (const key in props) {
    const val = props[key]
    if ("ref" === key)
      newProps["$$ref"] = val
    else if ("karet-lift" !== key)
      newProps[key] = val
  }
  return newProps
}

function createElement(...args) {
  const type = args[0]
  const props = args[1]
  if (typeof type === "string" && hasAnyObs(props, args)) {
    args[1] = filterProps(type, props)
    args[0] = FromClass
  } else if (props && props["karet-lift"] === true) {
    if (hasAnyObs(props, args)) {
      args[1] = filterProps(type, props)
      args[0] = FromClass
    } else {
      args[1] = dissocPartialU("karet-lift", props) || object0
    }
  }
  return reactElement(...args)
}

export default assocPartialU("createElement", createElement, React)

//

export const fromClass = Class => props =>
  reactElement(FromClass, filterProps(Class, props))
