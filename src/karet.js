import * as I from 'infestines'
import * as React from 'react'
import {Property} from 'kefir'

//

const VALUE = 'value'
const ERROR = 'error'

const STYLE = 'style'
const DANGEROUSLY = 'dangerouslySetInnerHTML'

const CHILDREN = 'children'

const LIFT = 'karet-lift'

//

const isProperty = x => x instanceof Property

function valueOf(p) {
  const ce = p._currentEvent
  if (ce) return ce.value
}

//

function renderChildren(children) {
  let newChildren = children
  for (let i = 0, n = children.length; i < n; ++i) {
    const v = children[i]
    const w = isProperty(v) ? valueOf(v) : I.isArray(v) ? renderChildren(v) : v
    if (v !== w) {
      if (newChildren === children) newChildren = children.slice(0)
      newChildren[i] = w
    }
  }
  return newChildren
}

function renderObject(object) {
  let newObject = null
  for (const i in object) {
    const v = object[i]
    if (isProperty(v)) {
      if (!newObject) {
        newObject = {}
        for (const j in object) {
          if (j === i) break
          newObject[j] = object[j]
        }
      }
      newObject[i] = valueOf(v)
    } else if (newObject) {
      newObject[i] = v
    }
  }
  return newObject || object
}

function renderProps(props) {
  let newProps = null
  for (const i in props) {
    const v = props[i]
    const w = isProperty(v)
      ? valueOf(v)
      : CHILDREN === i
        ? I.isArray(v) ? renderChildren(v) : v
        : STYLE === i || DANGEROUSLY === i ? renderObject(v) : v
    if (v !== w) {
      if (!newProps) {
        newProps = {}
        for (const j in props) {
          if (j === i) break
          newProps[j] = props[j]
        }
      }
      newProps[i] = w
    } else if (newProps) {
      newProps[i] = w
    }
  }
  return newProps || props
}

//

function forEachInChildren(i, children, extra, fn) {
  for (let n = children.length; i < n; ++i) {
    const c = children[i]
    if (isProperty(c)) fn(extra, c)
    else if (I.isArray(c)) forEachInChildren(0, c, extra, fn)
  }
}

function forEachInProps(props, extra, fn) {
  for (const i in props) {
    const v = props[i]
    if (isProperty(v)) {
      fn(extra, v)
    } else if (CHILDREN === i) {
      if (I.isArray(v)) forEachInChildren(0, v, extra, fn)
    } else if (STYLE === i || DANGEROUSLY === i) {
      for (const j in v) {
        const vj = v[j]
        if (isProperty(vj)) fn(extra, vj)
      }
    }
  }
}

//

function offAny(handler, property) {
  property.offAny(handler)
}

function onAny(handler, property) {
  property.onAny(handler)
}

function doSubscribe(self, {args}) {
  let handler = self.h
  if (!handler)
    handler = self.h = e => {
      const {type} = e
      if (type === VALUE) {
        self.forceUpdate()
      } else if (type === ERROR) {
        throw e.value
      }
    }

  forEachInProps(args[1], handler, onAny)
  forEachInChildren(2, args, handler, onAny)
}

function doUnsubscribe({h}, {args}) {
  forEachInChildren(2, args, h, offAny)
  forEachInProps(args[1], h, offAny)
}

function decObs(obs2num, property) {
  obs2num.set(property, (obs2num.get(property) || 0) - 1)
}

function incObs(obs2num, property) {
  obs2num.set(property, (obs2num.get(property) || 0) + 1)
}

function updateObs(delta, property, obs2num) {
  if (delta < 0)
    do {
      property.offAny(obs2num.h)
    } while (++delta)
  else if (0 < delta)
    do {
      property.onAny(obs2num.h)
    } while (--delta)
}

const server =
  typeof window === 'undefined' ? {h: null, forceUpdate() {}} : null

const FromClass = I.inherit(
  function FromClass(props) {
    React.Component.call(this, props)
    if ((this.h = server)) this.state = I.object0
  },
  React.Component,
  {
    componentDidMount() {
      doSubscribe(this, this.props)
    },
    componentDidUpdate({args: before}) {
      const {args: after} = this.props

      const obs2num = new Map()
      obs2num.h = this.h

      forEachInProps(before[1], obs2num, decObs)
      forEachInChildren(2, before, obs2num, decObs)

      forEachInProps(after[1], obs2num, incObs)
      forEachInChildren(2, after, obs2num, incObs)

      obs2num.forEach(updateObs)
    },
    componentWillUnmount() {
      doUnsubscribe(this, this.props)
    },
    render() {
      if (this.h) {
        const {args} = this.props
        const n = args.length
        const newArgs = Array(n)
        const type = (newArgs[0] = args[0])
        newArgs[1] = renderProps(args[1])
        for (let i = 2; i < n; ++i) {
          const v = args[i]
          newArgs[i] = isProperty(v)
            ? valueOf(v)
            : I.isArray(v) ? renderChildren(v) : v
        }
        if (type === React.Fragment && n < 4 && null == newArgs[2]) return null
        return React.createElement.apply(null, newArgs)
      } else {
        return null
      }
    }
  },
  server && {
    getDerivedStateFromProps(nextProps) {
      doSubscribe(server, nextProps)
      doUnsubscribe(server, nextProps)
      return null
    }
  }
)

//

function hasPropertiesInChildren(i, children) {
  for (let n = children.length; i < n; ++i) {
    const c = children[i]
    if (isProperty(c) || (I.isArray(c) && hasPropertiesInChildren(0, c)))
      return true
  }
  return false
}

function hasPropertiesInProps(props) {
  for (const i in props) {
    const v = props[i]
    if (isProperty(v)) {
      return true
    } else if (CHILDREN === i) {
      if (I.isArray(v) && hasPropertiesInChildren(0, v)) return true
    } else if (STYLE === i || DANGEROUSLY === i) {
      for (const j in v) if (isProperty(v[j])) return true
    }
  }
  return false
}

//

function considerLifting(args) {
  const props = args[1]
  if (hasPropertiesInProps(props) || hasPropertiesInChildren(2, args)) {
    const fromClassProps = {args}
    if (props) {
      const key = props.key
      if (null != key) fromClassProps.key = key
    }
    return React.createElement(FromClass, fromClassProps)
  } else {
    return React.createElement.apply(null, args)
  }
}

export function createElement(type, props, _child) {
  const lift = props && props[LIFT]
  if (lift || I.isString(type) || React.Fragment === type) {
    const n = arguments.length
    const args = Array(n)
    args[0] = type
    args[1] = lift ? I.dissocPartialU(LIFT, props) : props
    for (let i = 2; i < n; ++i) args[i] = arguments[i]
    return considerLifting(args)
  } else {
    return React.createElement.apply(null, arguments)
  }
}

//

export const fromClass = type =>
  React.forwardRef((props, ref) =>
    considerLifting([
      type,
      null == ref ? props : I.assocPartialU('ref', ref, props)
    ])
  )

//

export {Fragment} from 'react'
