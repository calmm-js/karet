import * as React from "react"
import {Observable} from "kefir"
import {
  array0,
  assocPartialU,
  dissocPartialU,
  inherit,
  isArray,
  isString,
  object0
} from "infestines"

//

const VALUE = "value"
const ERROR = "error"
const END = "end"
const STYLE = "style"
const CHILDREN = "children"
const LIFT = "karet-lift"
const DD_REF = "$$ref"

//

const reactElement = React.createElement
const Component = React.Component

const isObs = x => x instanceof Observable

//

const LiftedComponent = /*#__PURE__*/inherit(function LiftedComponent(props) {
  Component.call(this, props)
  this.at = 0
}, Component, {
  componentWillReceiveProps(nextProps) {
    this.componentWillUnmount()
    this.at = 0
    this.doSubscribe(nextProps)
  },
  componentWillMount() {
    this.at = 0
    this.doSubscribe(this.props)
  }
})

//

const FromKefir = /*#__PURE__*/inherit(function FromKefir(props) {
  LiftedComponent.call(this, props)
  this.callback =
  this.rendered = null
}, LiftedComponent, {
  componentWillUnmount() {
    const callback = this.callback
    if (callback)
      this.props.observable.offAny(callback)
  },
  doSubscribe({observable}) {
    if (isObs(observable)) {
      const callback = e => {
        switch (e.type) {
          case VALUE:
            this.rendered = e.value || null
            this.at && this.forceUpdate()
            break
          case ERROR:
            throw e.value
          case END:
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

function renderChildren(children, self, values) {
  if (isObs(children)) {
    return values[self.at++]
  } else if (isArray(children)) {
    let newChildren = children
    for (let i=0, n=children.length; i<n; ++i) {
      const childI = children[i]
      let newChildI = childI
      if (isObs(childI)) {
        newChildI = values[self.at++]
      } else if (isArray(childI)) {
        newChildI = renderChildren(childI, self, values)
      }
      if (newChildI !== childI) {
        if (newChildren === children)
          newChildren = children.slice(0)
        newChildren[i] = newChildI
      }
    }
    return newChildren
  } else {
    return children
  }
}

function renderStyle(style, self, values) {
  let newStyle = undefined
  for (const i in style) {
    const styleI = style[i]
    if (isObs(styleI)) {
      if (!newStyle) {
        newStyle = {}
        for (const j in style) {
          if (j === i)
            break
          newStyle[j] = style[j]
        }
      }
      newStyle[i] = values[self.at++]
    } else if (newStyle) {
      newStyle[i] = styleI
    }
  }
  return newStyle || style
}

function render(self, values) {
  const props = self.props

  let type = null
  let newProps = null
  let newChildren = null

  self.at = 0

  for (const key in props) {
    const val = props[key]
    if (CHILDREN === key) {
      newChildren = renderChildren(val, self, values)
    } else if ("$$type" === key) {
      type = props[key]
    } else if (DD_REF === key) {
      newProps = newProps || {}
      newProps.ref = isObs(val) ? values[self.at++] : val
    } else if (isObs(val)) {
      newProps = newProps || {}
      newProps[key] = values[self.at++]
    } else if (STYLE === key) {
      newProps = newProps || {}
      newProps.style = renderStyle(val, self, values) || val
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

function forEachInChildrenArray(children, extra, fn) {
  for (let i=0, n=children.length; i<n; ++i) {
    const childI = children[i]
    if (isObs(childI))
      fn(extra, childI)
    else if (isArray(childI))
      forEachInChildrenArray(childI, extra, fn)
  }
}

function forEachInProps(props, extra, fn) {
  for (const key in props) {
    const val = props[key]
    if (isObs(val)) {
      fn(extra, val)
    } else if (CHILDREN === key) {
      if (isArray(val))
        forEachInChildrenArray(val, extra, fn)
    } else if (STYLE === key) {
      for (const k in val) {
        const valK = val[k]
        if (isObs(valK))
          fn(extra, valK)
      }
    }
  }
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
  const handler = e => {
    const handlers = self.handlers
    let idx=0
    while (handlers[idx] !== handler)
      ++idx
    switch (e.type) {
      case VALUE: {
        const value = e.value
        const values = self.values
        if (values[idx] !== value) {
          values[idx] = value
          self.at && self.forceUpdate()
        }
        break
      }
      case ERROR: throw e.value
      default: {
        handlers[idx] = null
        const n = handlers.length
        if (n !== self.values.length)
          return
        for (let i=0; i < n; ++i)
          if (handlers[i])
            return
        self.handlers = null
      }
    }
  }
  self.handlers.push(handler)
  obs.onAny(handler)
}

const FromClass = /*#__PURE__*/inherit(function FromClass(props) {
  LiftedComponent.call(this, props)
  this.values = this
  this.handlers = null
}, LiftedComponent, {
  componentWillUnmount() {
    const handlers = this.handlers
    if (handlers instanceof Function) {
      forEachInProps(this.props, handlers, offAny1)
    } else if (handlers) {
      forEachInProps(this.props, handlers.reverse(), offAny)
    }
  },
  doSubscribe(props) {
    this.values = 0
    forEachInProps(props, this, incValues)
    const n = this.values

    switch (n) {
      case 0:
        this.values = array0
        break
      case 1: {
        this.values = this
        forEachInProps(props, this.handlers = e => {
          switch (e.type) {
            case VALUE: {
              const value = e.value
              if (this.values !== value) {
                this.values = value
                this.at && this.forceUpdate()
              }
              break
            }
            case ERROR: throw e.value
            default: {
              this.values = [this.values]
              this.handlers = null
            }
          }
        }, onAny1)
        break
      }
      default:
        this.values = Array(n).fill(this)
        this.handlers = []
        forEachInProps(props, this, onAny)
    }
  },
  render() {
    if (this.handlers instanceof Function) {
      const value = this.values
      if (value === this)
        return null
      return render(this, [value])
    } else {
      const values = this.values
      for (let i=0, n=values.length; i<n; ++i)
        if (values[i] === this)
          return null
      return render(this, values)
    }
  }
})

//

function hasObsInChildrenArray(i, children) {
  for (const n = children.length; i < n; ++i) {
    const child = children[i]
    if (isObs(child) || isArray(child) && hasObsInChildrenArray(0, child))
      return true
  }
  return false
}

function hasObsInProps(props) {
  for (const key in props) {
    const val = props[key]
    if (isObs(val)) {
      return true
    } else if (CHILDREN === key) {
      if (isArray(val) && hasObsInChildrenArray(0, val))
        return true
    } else if (STYLE === key) {
      for (const k in val)
        if (isObs(val[k]))
          return true
    }
  }
  return false
}

//

function filterProps(type, props) {
  const newProps = {"$$type": type}
  for (const key in props) {
    const val = props[key]
    if ("ref" === key)
      newProps[DD_REF] = val
    else if (LIFT !== key)
      newProps[key] = val
  }
  return newProps
}

function createElement(...args) {
  const type = args[0]
  const props = args[1] || object0
  if (isString(type) || props[LIFT]) {
    if (hasObsInChildrenArray(2, args) || hasObsInProps(props)) {
      args[1] = filterProps(type, props)
      args[0] = FromClass
    } else if (props[LIFT]) {
      args[1] = dissocPartialU(LIFT, props) || object0
    }
  }
  return reactElement(...args)
}

export default process.env.NODE_ENV === "production"
  ? assocPartialU("createElement", createElement, React)
  : Object.defineProperty(assocPartialU("createElement", createElement, dissocPartialU("PropTypes", React)), "PropTypes", {
    get: (React => () => React.PropTypes)(React)
  })

//

export const fromClass = Class => props =>
  reactElement(FromClass, filterProps(Class, props))
