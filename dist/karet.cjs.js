'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var I = require('infestines');
var L = require('partial.lenses');
var React = require('react');
var kefir = require('kefir');

//

var LIFT = 'karet-lift';

//

var isProperty = function isProperty(x) {
  return x instanceof kefir.Property;
};

function valueOf(p) {
  var ce = p._currentEvent;
  if (ce) return ce.value;
}

//

var inProperty = /*#__PURE__*/L.when(isProperty);
var inChildren = /*#__PURE__*/L.toFunction([L.flatten, inProperty]);
var inValues = /*#__PURE__*/L.ifElse(isProperty, L.identity, [L.values, inProperty]);
var inProps = /*#__PURE__*/L.branchOr(inProperty, {
  children: inChildren,
  style: inValues,
  dangerouslySetInnerHTML: inValues
});
var inArgs = /*#__PURE__*/L.toFunction([L.elems, /*#__PURE__*/L.choose(function (_, i) {
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

  L.forEach(function (p) {
    return p.onAny(handler);
  }, inArgs, args);
}

function doUnsubscribe(_ref2, _ref3) {
  var h = _ref2.h;
  var args = _ref3.args;

  L.forEach(function (p) {
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

var FromClass = /*#__PURE__*/I.inherit(function FromClass(props) {
  React.Component.call(this, props);
  if (this.h = server) this.state = I.object0;
}, React.Component, {
  componentDidMount: function componentDidMount() {
    doSubscribe(this, this.props);
  },
  componentDidUpdate: function componentDidUpdate(prevProps) {
    var p2n = new Map();
    p2n.h = this.h;

    L.forEach(function (p) {
      return p2n.set(p, (p2n.get(p) || 0) - 1);
    }, inArgs, prevProps.args);
    L.forEach(function (p) {
      return p2n.set(p, (p2n.get(p) || 0) + 1);
    }, inArgs, this.props.args);

    p2n.forEach(updateObs);
  },
  componentWillUnmount: function componentWillUnmount() {
    doUnsubscribe(this, this.props);
  },
  render: function render() {
    if (this.h) {
      var args = L.modify(inArgs, valueOf, this.props.args);
      if (args[0] === React.Fragment && args.length < 3) return null;
      return React.createElement.apply(null, args);
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

var considerLifting = function considerLifting(args) {
  return L.select(inArgs, args) ? React.createElement(FromClass, { args: args, key: args[1].key }) : React.createElement.apply(null, args);
};

function createElement(type, props, _child) {
  props = props || I.object0;
  var lift = props[LIFT];
  if (lift || I.isString(type) || React.Fragment === type || isProperty(type)) {
    var n = arguments.length;
    var args = Array(n);
    args[0] = type;
    args[1] = lift ? I.dissocPartialU(LIFT, props) : props;
    for (var i = 2; i < n; ++i) {
      args[i] = arguments[i];
    }return considerLifting(args);
  } else {
    return React.createElement.apply(null, arguments);
  }
}

//

var fromClass = function fromClass(type) {
  return React.forwardRef(function (props, ref) {
    return considerLifting([type, null == ref ? props : I.assocPartialU('ref', ref, props)]);
  });
};

exports.Children = React.Children;
exports.Fragment = React.Fragment;
exports.createContext = React.createContext;
exports.forwardRef = React.forwardRef;
exports.createElement = createElement;
exports.fromClass = fromClass;
