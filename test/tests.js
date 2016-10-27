import * as Kefir from "kefir"

import React, {fromKefir} from "../src/karet"
import ReactDOM from "react-dom/server"

function show(x) {
  switch (typeof x) {
    case "string":
    case "object":
      return JSON.stringify(x)
    default:
      return `${x}`
  }
}

const testRender = (vdom, expect) => it(`${expect}`, () => {
  const actual = ReactDOM.renderToStaticMarkup(vdom)

  if (actual !== expect)
    throw new Error(`Expected: ${show(expect)}, actual: ${show(actual)}`)
})

describe("basics", () => {
  testRender(<p key="k" ref={() => {}}>Hello</p>,
             '<p>Hello</p>')

  testRender(<p key="k" ref={() => {}}>{Kefir.constant("Hello")}</p>,
             '<p>Hello</p>')

  testRender(<p>Just testing <span>constants</span>.</p>,
             '<p>Just testing <span>constants</span>.</p>')

  testRender(<div onClick={() => {}}
                  style={{display: "block",
                          color: Kefir.constant("red")}}>
               <p>{Kefir.constant(["Hello"])}</p>
               <p>{Kefir.constant(["World"])}</p>
             </div>,
             '<div style="display:block;color:red;"><p>Hello</p><p>World</p></div>')

  testRender(<a href="#lol" style={Kefir.constant({color: "red"})}>
               {Kefir.constant("Hello")} {Kefir.constant("world!")}
             </a>,
             '<a href="#lol" style="color:red;">Hello world!</a>')

  const Custom = ({prop, ...props}) => <div>{`${prop} ${JSON.stringify(props)}`}</div>

  testRender(<Custom prop={Kefir.constant("not-lifted")} ref="test"/>,
             '<div>[constant] {}</div>')

  testRender(<Custom karet-lift prop={Kefir.constant("lifted")} ref="test"/>,
             '<div>lifted {}</div>')

  testRender(<Custom karet-lift prop={"lifted anyway"} ref="test"/>,
             '<div>lifted anyway {}</div>')
})

describe("fromKefir", () => {
  testRender(fromKefir(Kefir.constant(<p>Yes</p>)), '<p>Yes</p>')
})

describe("context", () => {
  class Context extends React.Component {
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
  Context.childContextTypes = {message: React.PropTypes.any}

  const Bottom = (_, context) => <div>{Kefir.constant("Bottom")} {context.message}</div>
  Bottom.contextTypes = {message: React.PropTypes.any}

  const Middle = () => <div>{Kefir.constant("Middle")} <Bottom/></div>
  const Top = () => <div>{Kefir.constant("Top")} <Middle/></div>

  testRender(<Context context={{message: Kefir.constant("Hello")}}><Top/></Context>,
             "<div><div>Top <div>Middle <div>Bottom Hello</div></div></div></div>")
})
