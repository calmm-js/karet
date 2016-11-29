import React        from "react"
import {Observable} from "kefir"

//

const emptyArray = []

function dissoc(k, o) {
  const r = {}
  for (const p in o)
    if (p !== k)
      r[p] = o[p]
  return r
}

//

class LiftedComponent extends React.Component {
  constructor(props) {
    super(props)
  }
  componentWillReceiveProps(nextProps) {
    this.doUnsubscribe()
    this.doSubscribe(nextProps)
  }
  componentWillMount() {
    this.doSubscribe(this.props)
  }
  componentWillUnmount() {
    this.doUnsubscribe()
  }
}

//

class FromKefir extends LiftedComponent {
  constructor(props) {
    super(props)
    this.callback = null
    this.rendered = null
  }
  doUnsubscribe() {
    const callback = this.callback
    if (callback)
      this.props.observable.offAny(callback)
  }
  doSubscribe({observable}) {
    if (observable instanceof Observable) {
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
  }
  render() {
    return this.rendered
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

function forEach(props, fn) {
  for (const key in props) {
    const val = props[key]
    if (val instanceof Observable) {
      fn(val)
    } else if ("children" === key) {
      const children = props[key]
      if (children.constructor === Array) {
        for (let i=0; i<children.length; ++i) {
          const val = children[i]
          if (val instanceof Observable)
            fn(val)
        }
      }
    } else if ("style" === key) {
      for (const k in val) {
        const valK = val[k]
        if (valK instanceof Observable)
          fn(valK)
      }
    }
  }
}

function render(props, values) {
  let type
  let newProps = null
  let newChildren

  let k = -1

  for (const key in props) {
    const val = props[key]
    if ("children" === key) {
      if (val instanceof Observable) {
        newChildren = [values[++k]]
      } else if (val.constructor === Array) {
        newChildren = Array(val.length)
        for (let i=0, n=val.length; i<n; ++i) {
          const valI = val[i]
          if (valI instanceof Observable)
            newChildren[i] = values[++k]
          else
            newChildren[i] = valI
        }
      } else {
        newChildren = [val]
      }
    } else if ("$$ref" === key) {
      if (!newProps) newProps = {}
      if (val instanceof Observable) {
        newProps.ref = values[++k]
      } else {
        newProps.ref = val
      }
    } else if (val instanceof Observable) {
      const valO = values[++k]
      if (!newProps) newProps = {}
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
      if (!newProps) newProps = {}
      newProps.style = newStyle || val
    } else if ("$$type" === key) {
      type = props[key]
    } else {
      if (!newProps) newProps = {}
      newProps[key] = val
    }
  }
  return React.createElement(type, newProps, ...(newChildren || emptyArray))
}

//

class FromClass extends LiftedComponent {
  constructor(props) {
    super(props)
    this.values = this
    this.handlers = null
  }
  doUnsubscribe() {
    const handlers = this.handlers
    if (handlers) {
      if (handlers instanceof Function) {
        forEach(this.props, obs => obs.offAny(handlers))
      } else {
        let i = -1
        forEach(this.props, obs => {
          const handler = handlers[++i]
          if (handler)
            obs.offAny(handler)
        })
      }
    }
  }
  doSubscribe(props) {
    let n = 0
    forEach(props, () => ++n)

    if (n === 1) {
      this.values = this
      const handlers = e => this.doHandle1(e)
      this.handlers = handlers
      forEach(props, obs => obs.onAny(handlers))
    } else {
      this.values = Array(n).fill(this)
      this.handlers = []
      forEach(props, obs => {
        const handler = e => this.doHandleN(handler, e)
        this.handlers.push(handler)
        obs.onAny(handler)
      })
    }
  }
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
  }
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
  }
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
}

//

const hasAnyObs = (props, children) =>
  children.find(x => x instanceof Observable) || props && hasObs(props)

const filterProps = (type, props) => {
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

const client = {
  ...React,
  createElement(type, props, ...children) {
    if (typeof type === "string" && hasAnyObs(props, children)) {
      return React.createElement(FromClass, filterProps(type, props), ...children)
    } else if (props && props["karet-lift"] === true) {
      if (hasAnyObs(props, children)) {
        return React.createElement(FromClass, filterProps(type, props), ...children)
      } else {
        return React.createElement(type, dissoc("karet-lift", props), ...children)
      }
    } else {
      return React.createElement(type, props, ...children)
    }
  }
}

export default client
