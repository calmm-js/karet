import * as I from 'infestines'
import * as L from 'partial.lenses'
import * as React from 'react'
import {Property} from 'kefir'

//

const LIFT = 'karet-lift'

//

const isProperty = x => x instanceof Property

function valueOf(p) {
  const ce = p._currentEvent
  if (ce) return ce.value
}

//

const inProperty = L.when(isProperty)
const inChildren = L.toFunction([L.flatten, inProperty])
const inValues = L.ifElse(isProperty, L.identity, [L.values, inProperty])
const inProps = L.branchOr(inProperty, {
  children: inChildren,
  style: inValues,
  dangerouslySetInnerHTML: inValues
})
const inArgs = L.toFunction([
  L.elems,
  L.choose((_, i) => (1 < i ? inChildren : 1 === i ? inProps : inProperty))
])

//

function doSubscribe(self, {args}) {
  let handler = self.h
  if (!handler)
    handler = self.h = e => {
      const {type} = e
      if (type === 'value') {
        self.forceUpdate()
      } else if (type === 'error') {
        throw e.value
      }
    }

  L.forEach(p => p.onAny(handler), inArgs, args)
}

function doUnsubscribe({h}, {args}) {
  L.forEach(p => p.offAny(h), inArgs, args)
}

function updateObs(delta, property, p2n) {
  for (; delta < 0; ++delta) property.offAny(p2n.h)
  for (; 0 < delta; --delta) property.onAny(p2n.h)
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
    componentDidUpdate(prevProps) {
      const p2n = new Map()
      p2n.h = this.h

      L.forEach(p => p2n.set(p, (p2n.get(p) || 0) - 1), inArgs, prevProps.args)
      L.forEach(p => p2n.set(p, (p2n.get(p) || 0) + 1), inArgs, this.props.args)

      p2n.forEach(updateObs)
    },
    componentWillUnmount() {
      doUnsubscribe(this, this.props)
    },
    render() {
      if (this.h) {
        const args = L.modify(inArgs, valueOf, this.props.args)
        if (args[0] === React.Fragment && args.length < 3) return null
        return React.createElement.apply(null, args)
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

const considerLifting = args =>
  L.get(inArgs, args)
    ? React.createElement(FromClass, {args, key: args[1].key})
    : React.createElement.apply(null, args)

export function createElement(type, props, _child) {
  props = props || I.object0
  const lift = props[LIFT]
  if (lift || I.isString(type) || React.Fragment === type || isProperty(type)) {
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

export {Children, Fragment, createContext, forwardRef} from 'react'
