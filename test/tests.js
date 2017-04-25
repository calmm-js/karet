import * as Kefir from "kefir"

import * as React from "react"
import * as ReactDOM from "react-dom/server"

import * as Preact from "preact"
import preactToString from "preact-render-to-string"

import PropTypes from "prop-types"

import Karet from "../dist/karet.cjs"

function show(x) {
  switch (typeof x) {
    case "string":
    case "object":
      return JSON.stringify(x)
    default:
      return `${x}`
  }
}

[
  {
    title: "React",
    createElement: React.createElement,
    Component: React.Component,
    renderToStaticMarkup: ReactDOM.renderToStaticMarkup
  },
  {
    title: "Preact",
    createElement: Preact.createElement,
    Component: Preact.Component,
    renderToStaticMarkup: preactToString
  }
].forEach(({title, createElement, Component, renderToStaticMarkup}) => {
  const React = Karet({createElement, Component})

  const testRender = (vdom, expect) => it(`${expect}`, () => {
    const actual =
      renderToStaticMarkup(vdom)
      .replace(/: ([^;]*);/g, ":$1;") // <- React / Preact style rendering diffs
      .replace(/; ([^:]*):/g, ";$1:") // <- React / Preact style rendering diffs

    if (actual !== expect)
      throw new Error(`Expected: ${show(expect)}, actual: ${show(actual)}`)
  })

  describe(`${title} basics`, () => {
    testRender(<p key="k" ref={() => {}}>Hello</p>,
               '<p>Hello</p>')

    testRender(<p id={Kefir.constant("test")}>{null}</p>,
               '<p id="test"></p>')

    testRender(<p key="k" ref={() => {}}>{Kefir.constant("Hello")}</p>,
               '<p>Hello</p>')

    testRender(<p>{[Kefir.constant("Hello")]}</p>,
               '<p>Hello</p>')

    testRender(<p>Just testing <span>constants</span>.</p>,
               '<p>Just testing <span>constants</span>.</p>')

    testRender(<div onClick={() => {}}
               style={{display: "block",
                       color: Kefir.constant("red"),
                       background: "green"}}>
               <p>{Kefir.constant(["Hello"])}</p>
               <p>{Kefir.constant(["World"])}</p>
               </div>,
               '<div style="display:block;color:red;background:green;"><p>Hello</p><p>World</p></div>')

    testRender(<a href="#lol" style={Kefir.constant({color: "red"})}>
               {Kefir.constant("Hello")} {Kefir.constant("world!")}
               </a>,
               '<a href="#lol" style="color:red;">Hello world!</a>')

    testRender(<div>{Kefir.later(1000,0)}</div>, "")
    testRender(<div>{Kefir.constant(1).merge(Kefir.later(1000,0))}</div>, "<div>1</div>")
    testRender(<div>{Kefir.later(1000,0)} {Kefir.constant(0)}</div>, "")

    const Custom = ({prop, ...props}) => <div>{`${prop} ${JSON.stringify(props)}`}</div>

    testRender(<Custom prop={Kefir.constant("not-lifted")} ref="test"/>,
               '<div>[constant] {}</div>')

    testRender(<Custom karet-lift prop={Kefir.constant("lifted")} ref="test"/>,
               '<div>lifted {}</div>')

    testRender(<Custom karet-lift prop={"lifted anyway"} ref="test"/>,
               '<div>lifted anyway {}</div>')

    const Spread = props => <div {...props} />

    testRender(<Spread>
               Hello {Kefir.constant("world!")}
               </Spread>,
               '<div>Hello world!</div>')

    testRender(<div><div>a</div>{[<div key="b">b</div>, [<div key="c">c</div>, [<div key="d">d</div>]]]}</div>,
               '<div><div>a</div><div>b</div><div>c</div><div>d</div></div>')

    testRender(<div><div>a</div>{[<div key="b">b</div>, Kefir.constant([<div key="c">c</div>, [<div key="d">d</div>]])]}</div>,
               '<div><div>a</div><div>b</div><div>c</div><div>d</div></div>')

    const ChildrenWithSibling = ({children}) => <div>Test: {children}</div>

    testRender(<ChildrenWithSibling>
               Hello {Kefir.constant("world!")}
               </ChildrenWithSibling>,
               '<div>Test: Hello world!</div>')
  })

  describe(`${title} fromKefir`, () => {
    testRender(React.fromKefir(Kefir.constant(<p>Yes</p>)), '<p>Yes</p>')
  })

  describe(`${title} fromClass`, () => {
    const P = React.fromClass("p")
    testRender(<P $$ref={() => {}}>Hello</P>, '<p>Hello</p>')

    testRender(<P>Hello, {"world"}!</P>, '<p>Hello, world!</p>')
    testRender(<P ref={() => {}}>Hello, {Kefir.constant("world")}!</P>, '<p>Hello, world!</p>')

    testRender(<P>{[Kefir.constant("Hello")]}</P>,
               '<p>Hello</p>')

    testRender(<P>{Kefir.later(1000,0)}</P>, "")
  })

  describe(`${title} context`, () => {
    class Context extends Component {
      constructor(props) {
        super(props)
      }
      getChildContext() {
        return this.props.context
      }
      render() {
        return <div>{this.props.children}</div>
      }
    }
    Context.childContextTypes = {message: PropTypes.any}

    const Bottom = (_, context) => <div>{Kefir.constant("Bottom")} {context.message}</div>
      Bottom.contextTypes = {message: PropTypes.any}

    const Middle = () => <div>{Kefir.constant("Middle")} <Bottom/></div>
      const Top = () => <div>{Kefir.constant("Top")} <Middle/></div>

    testRender(<Context context={{message: Kefir.constant("Hello")}}><Top/></Context>,
               "<div><div>Top <div>Middle <div>Bottom Hello</div></div></div></div>")
  })
})
