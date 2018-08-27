import * as Kefir from 'kefir'
import * as L from 'partial.lenses'

import * as React from '../dist/karet.cjs'
import ReactDOM from 'react-dom/server'

function show(x) {
  switch (typeof x) {
    case 'string':
    case 'object':
      return JSON.stringify(x)
    default:
      return `${x}`
  }
}

const assertSame = ({actual, expect}) => {
  if (actual !== expect)
    throw new Error(`Expected: ${show(expect)}, actual: ${show(actual)}`)
}

const testRender = (vdom, expect) =>
  it(`${expect}`, () => {
    const actual = ReactDOM.renderToStaticMarkup(vdom)
    assertSame({actual, expect})
  })

describe('basics', () => {
  testRender(
    <p key="k" ref={() => {}}>
      Hello
    </p>,
    '<p>Hello</p>'
  )

  testRender(<p id={Kefir.constant('test')}>{null}</p>, '<p id="test"></p>')

  testRender(
    <p key="k" ref={() => {}}>
      {Kefir.constant('Hello')}
    </p>,
    '<p>Hello</p>'
  )

  testRender(<p>{[Kefir.constant('Hello')]}</p>, '<p>Hello</p>')

  testRender(
    <p>
      Just testing <span>constants</span>.
    </p>,
    '<p>Just testing <span>constants</span>.</p>'
  )

  testRender(
    <div
      onClick={() => {}}
      style={{
        display: 'block',
        color: Kefir.constant('red'),
        background: Kefir.constant('green')
      }}>
      <p>{Kefir.constant(['Hello'])}</p>
      <p>{Kefir.constant(['World'])}</p>
    </div>,
    '<div style="display:block;color:red;background:green"><p>Hello</p><p>World</p></div>'
  )

  testRender(
    <div
      onClick={() => {}}
      style={{
        display: 'block',
        color: Kefir.constant('red'),
        background: 'green'
      }}>
      <p>{[Kefir.constant('Hel'), [Kefir.constant('lo')]]}</p>
      <p>{Kefir.constant(['World'])}</p>
    </div>,
    '<div style="display:block;color:red;background:green"><p>Hello</p><p>World</p></div>'
  )

  testRender(
    <div
      onClick={() => {}}
      style={{
        display: 'block',
        color: 'red',
        background: 'green'
      }}>
      {[Kefir.constant('Hel'), [Kefir.constant('lo')]]}
    </div>,
    '<div style="display:block;color:red;background:green">Hello</div>'
  )

  testRender(
    <a style={Kefir.constant({color: 'red'})} href={Kefir.constant('#lol')}>
      {Kefir.constant('Hello')} {Kefir.constant('world!')}
    </a>,
    '<a style="color:red" href="#lol">Hello world!</a>'
  )

  testRender(
    <div>
      {Kefir.constant(1)
        .merge(Kefir.later(1000, 0))
        .toProperty()}
    </div>,
    '<div>1</div>'
  )

  const Custom = ({prop, ...props}) => (
    <div>{`${prop} ${JSON.stringify(props)}`}</div>
  )

  testRender(
    <Custom prop={Kefir.constant('not-lifted')} ref="test" />,
    '<div>[constant] {}</div>'
  )

  testRender(
    <Custom karet-lift prop={Kefir.constant('lifted')} ref="test" />,
    '<div>lifted {}</div>'
  )

  testRender(
    <Custom karet-lift prop={'lifted anyway'} ref="test" />,
    '<div>lifted anyway {}</div>'
  )

  const Spread = props => <div {...props} />

  testRender(
    <Spread>Hello {Kefir.constant('world!')}</Spread>,
    '<div>Hello world!</div>'
  )

  testRender(
    <div>
      <div>a</div>
      {[<div key="b">b</div>, [<div key="c">c</div>, [<div key="d">d</div>]]]}
    </div>,
    '<div><div>a</div><div>b</div><div>c</div><div>d</div></div>'
  )

  testRender(
    <div>
      <div>a</div>
      {[
        <div key="b">b</div>,
        Kefir.constant([<div key="c">c</div>, [<div key="d">d</div>]])
      ]}
    </div>,
    '<div><div>a</div><div>b</div><div>c</div><div>d</div></div>'
  )

  testRender(
    <div className={Kefir.later(100, 'bar').toProperty()} children="foo" />,
    '<div>foo</div>'
  )

  const ChildrenWithSibling = ({children}) => <div>Test: {children}</div>

  testRender(
    <ChildrenWithSibling>Hello {Kefir.constant('world!')}</ChildrenWithSibling>,
    '<div>Test: Hello world!</div>'
  )

  testRender(<span>0</span>, '<span>0</span>')
  testRender(<span>{Kefir.constant(0)}</span>, '<span>0</span>')

  testRender(
    <div dangerouslySetInnerHTML={{__html: 'oh yes'}} />,
    '<div>oh yes</div>'
  )

  testRender(
    <div dangerouslySetInnerHTML={{__html: Kefir.constant('oh yes')}} />,
    '<div>oh yes</div>'
  )

  const Elem = Kefir.constant('div')

  testRender(<Elem />, '<div></div>')
})

describe('Fragment', () => {
  testRender(
    <ul>
      {
        <React.Fragment>
          {Kefir.constant(<li key="1">1</li>)}
          <li>2</li>
        </React.Fragment>
      }
    </ul>,
    '<ul><li>1</li><li>2</li></ul>'
  )
  testRender(
    <React.Fragment>{Kefir.constant(<p>Yes</p>)}</React.Fragment>,
    '<p>Yes</p>'
  )
  testRender(<React.Fragment>{Kefir.constant(undefined)}</React.Fragment>, '')
})

describe('fromClass', () => {
  const P = React.fromClass('p')
  const Code = React.fromClass('code')
  testRender(<P />, '<p></p>')

  testRender(<P ref={() => {}}>Hello</P>, '<p>Hello</p>')

  testRender(<P>Hello, {'world'}!</P>, '<p>Hello, world!</p>')
  testRender(
    <P ref={() => {}}>Hello, {Kefir.constant('world')}!</P>,
    '<p>Hello, world!</p>'
  )

  testRender(
    <P>
      <code />
      {[[[<Code key={1}>{Kefir.constant('this')}</Code>]], [<Code key={2} />]]}
      <code />
    </P>,
    '<p><code></code><code>this</code><code></code><code></code></p>'
  )

  testRender(<P>{[Kefir.constant('Hello')]}</P>, '<p>Hello</p>')
})

describe('simulated frontend', () => {
  it('works as expected', () => {
    const {type, props} = React.createElement('div', {}, Kefir.constant('foo'))
    const element = new type(props)
    element.h = null // This makes `render` believe we are in frontend.

    assertSame({
      expect: '',
      actual: ReactDOM.renderToStaticMarkup(element.render())
    })

    let calledForceUpdate = false
    element.forceUpdate = () => (calledForceUpdate = true)

    element.componentDidMount()
    assertSame({expect: true, actual: calledForceUpdate})

    assertSame({
      expect: 'foo',
      actual: L.get(['props', 'children'], element.render())
    })
    element.componentDidUpdate(props)

    assertSame({
      expect: 'foo',
      actual: L.get(['props', 'children'], element.render())
    })

    element.props = L.set(['args', 2], Kefir.constant('bar'), props)
    element.componentDidUpdate(props)

    assertSame({
      expect: 'bar',
      actual: L.get(['props', 'children'], element.render())
    })

    element.componentWillUnmount()
  })
})

describe('context', () => {
  const {Provider, Consumer} = React.createContext({})

  testRender(
    <Provider value={Kefir.constant('It is')}>
      <Consumer>
        {message => (
          <div>
            {message} {(message instanceof Kefir.Property).toString()}!
          </div>
        )}
      </Consumer>
    </Provider>,
    '<div>It is true!</div>'
  )
})

describe('exceptions', () => {
  it('throws on errors', () => {
    const error = Kefir.constantError('did throw')
    let raised = 'did not throw'
    try {
      ReactDOM.renderToStaticMarkup(<div>{error}</div>)
    } catch (e) {
      raised = e
    }
    assertSame({expect: 'did throw', actual: raised})
  })
})
