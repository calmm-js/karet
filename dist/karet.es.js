import { inherit, object0, isString, dissocPartialU, assocPartialU } from 'infestines';
import { when, toFunction, flatten, ifElse, identity, values, branchOr, elems, choose, forEach, modify, get } from 'partial.lenses';
import { Component, Fragment, createElement, forwardRef } from 'react';
export { Children, Fragment, createContext, forwardRef } from 'react';
import { Property } from 'kefir';

//

var LIFT = 'karet-lift';

//

var isProperty = function isProperty(x) {
  return x instanceof Property;
};

function valueOf(p) {
  var ce = p._currentEvent;
  if (ce) return ce.value;
}

//

var inProperty = /*#__PURE__*/when(isProperty);
var inChildren = /*#__PURE__*/toFunction([flatten, inProperty]);
var inValues = /*#__PURE__*/ifElse(isProperty, identity, [values, inProperty]);
var inProps = /*#__PURE__*/branchOr(inProperty, {
  children: inChildren,
  style: inValues,
  dangerouslySetInnerHTML: inValues
});
var inArgs = /*#__PURE__*/toFunction([elems, /*#__PURE__*/choose(function (_, i) {
  return 1 < i ? inChildren : 1 === i ? inProps : inProperty;
})]);

//

function doSubscribe(self, _ref) {
  var args = _ref.args;

  var handler = self.h;
  if (!handler) handler = self.h = function (e) {
    var type = e.type;

    if (type === 'value') {
      self.forceUpdate();
    } else if (type === 'error') {
      throw e.value;
    }
  };

  forEach(function (p) {
    return p.onAny(handler);
  }, inArgs, args);
}

function doUnsubscribe(_ref2, _ref3) {
  var h = _ref2.h;
  var args = _ref3.args;

  forEach(function (p) {
    return p.offAny(h);
  }, inArgs, args);
}

function updateObs(delta, property, p2n) {
  for (; delta < 0; ++delta) {
    property.offAny(p2n.h);
  }for (; 0 < delta; --delta) {
    property.onAny(p2n.h);
  }
}

var server = typeof window === 'undefined' ? { h: null, forceUpdate: function forceUpdate() {}
} : null;

var FromClass = /*#__PURE__*/inherit(function FromClass(props) {
  Component.call(this, props);
  if (this.h = server) this.state = object0;
}, Component, {
  componentDidMount: function componentDidMount() {
    doSubscribe(this, this.props);
  },
  componentDidUpdate: function componentDidUpdate(prevProps) {
    var p2n = new Map();
    p2n.h = this.h;

    forEach(function (p) {
      return p2n.set(p, (p2n.get(p) || 0) - 1);
    }, inArgs, prevProps.args);
    forEach(function (p) {
      return p2n.set(p, (p2n.get(p) || 0) + 1);
    }, inArgs, this.props.args);

    p2n.forEach(updateObs);
  },
  componentWillUnmount: function componentWillUnmount() {
    doUnsubscribe(this, this.props);
  },
  render: function render() {
    if (this.h) {
      var args = modify(inArgs, valueOf, this.props.args);
      if (args[0] === Fragment && args.length < 3) return null;
      return createElement.apply(null, args);
    } else {
      return null;
    }
  }
}, server && {
  getDerivedStateFromProps: function getDerivedStateFromProps(nextProps) {
    doSubscribe(server, nextProps);
    doUnsubscribe(server, nextProps);
    return null;
  }
});

//

function createElement$1(type, props, _child) {
  props = props || object0;
  var lift = props[LIFT];
  if (lift || isString(type) || Fragment === type || isProperty(type)) {
    var n = arguments.length;
    var args = Array(n);
    args[0] = type;
    args[1] = lift ? dissocPartialU(LIFT, props) : props;
    for (var i = 2; i < n; ++i) {
      args[i] = arguments[i];
    }return get(inArgs, args) ? createElement(FromClass, { args: args, key: props.key }) : createElement.apply(null, args);
  } else {
    return createElement.apply(null, arguments);
  }
}

//

var fromClass = function fromClass(type) {
  return forwardRef(function (props, ref) {
    var args = [type, null == ref ? props : assocPartialU('ref', ref, props)];
    return get(inArgs, args) ? createElement(FromClass, { args: args }) : createElement.apply(null, args);
  });
};

export { createElement$1 as createElement, fromClass };
