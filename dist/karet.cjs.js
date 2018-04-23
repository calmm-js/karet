'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var I = require('infestines');
var React = require('react');
var kefir = require('kefir');

//

var STYLE = 'style';
var DANGEROUSLY = 'dangerouslySetInnerHTML';

var CHILDREN = 'children';

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

function renderChildren(children) {
  var newChildren = children;
  for (var i = 0, n = children.length; i < n; ++i) {
    var v = children[i];
    var w = isProperty(v) ? valueOf(v) : I.isArray(v) ? renderChildren(v) : v;
    if (v !== w) {
      if (newChildren === children) newChildren = children.slice(0);
      newChildren[i] = w;
    }
  }
  return newChildren;
}

function renderObject(object) {
  var newObject = null;
  for (var i in object) {
    var v = object[i];
    if (isProperty(v)) {
      if (!newObject) {
        newObject = {};
        for (var j in object) {
          if (j === i) break;
          newObject[j] = object[j];
        }
      }
      newObject[i] = valueOf(v);
    } else if (newObject) {
      newObject[i] = v;
    }
  }
  return newObject || object;
}

function renderProps(props) {
  var newProps = null;
  for (var i in props) {
    var v = props[i];
    var w = isProperty(v) ? valueOf(v) : CHILDREN === i ? I.isArray(v) ? renderChildren(v) : v : STYLE === i || DANGEROUSLY === i ? renderObject(v) : v;
    if (v !== w) {
      if (!newProps) {
        newProps = {};
        for (var j in props) {
          if (j === i) break;
          newProps[j] = props[j];
        }
      }
      newProps[i] = w;
    } else if (newProps) {
      newProps[i] = w;
    }
  }
  return newProps || props;
}

//

function forEachInChildren(i, children, extra, fn) {
  for (var n = children.length; i < n; ++i) {
    var c = children[i];
    if (isProperty(c)) fn(extra, c);else if (I.isArray(c)) forEachInChildren(0, c, extra, fn);
  }
}

function forEachInProps(props, extra, fn) {
  for (var i in props) {
    var v = props[i];
    if (isProperty(v)) {
      fn(extra, v);
    } else if (CHILDREN === i) {
      if (I.isArray(v)) forEachInChildren(0, v, extra, fn);
    } else if (STYLE === i || DANGEROUSLY === i) {
      for (var j in v) {
        var vj = v[j];
        if (isProperty(vj)) fn(extra, vj);
      }
    }
  }
}

//

function offAny(handler, property) {
  property.offAny(handler);
}

function onAny(handler, property) {
  property.onAny(handler);
}

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

  forEachInProps(args[1], handler, onAny);
  forEachInChildren(2, args, handler, onAny);
}

function doUnsubscribe(_ref2, _ref3) {
  var h = _ref2.h;
  var args = _ref3.args;

  forEachInChildren(2, args, h, offAny);
  forEachInProps(args[1], h, offAny);
}

function decObs(p2n, property) {
  p2n.set(property, (p2n.get(property) || 0) - 1);
}

function incObs(p2n, property) {
  p2n.set(property, (p2n.get(property) || 0) + 1);
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
  componentDidUpdate: function componentDidUpdate(_ref4) {
    var before = _ref4.args;
    var after = this.props.args;


    var p2n = new Map();
    p2n.h = this.h;

    forEachInProps(before[1], p2n, decObs);
    forEachInChildren(2, before, p2n, decObs);

    forEachInProps(after[1], p2n, incObs);
    forEachInChildren(2, after, p2n, incObs);

    p2n.forEach(updateObs);
  },
  componentWillUnmount: function componentWillUnmount() {
    doUnsubscribe(this, this.props);
  },
  render: function render() {
    if (this.h) {
      var args = this.props.args;

      var n = args.length;
      var newArgs = Array(n);
      var type = newArgs[0] = args[0];
      newArgs[1] = renderProps(args[1]);
      for (var i = 2; i < n; ++i) {
        var v = args[i];
        newArgs[i] = isProperty(v) ? valueOf(v) : I.isArray(v) ? renderChildren(v) : v;
      }
      if (type === React.Fragment && n < 4 && null == newArgs[2]) return null;
      return React.createElement.apply(null, newArgs);
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

function hasPropertiesInChildren(i, children) {
  for (var n = children.length; i < n; ++i) {
    var c = children[i];
    if (isProperty(c) || I.isArray(c) && hasPropertiesInChildren(0, c)) return true;
  }
  return false;
}

function hasPropertiesInProps(props) {
  for (var i in props) {
    var v = props[i];
    if (isProperty(v)) {
      return true;
    } else if (CHILDREN === i) {
      if (I.isArray(v) && hasPropertiesInChildren(0, v)) return true;
    } else if (STYLE === i || DANGEROUSLY === i) {
      for (var j in v) {
        if (isProperty(v[j])) return true;
      }
    }
  }
  return false;
}

//

function considerLifting(args) {
  var props = args[1];
  return hasPropertiesInProps(props) || hasPropertiesInChildren(2, args) ? React.createElement(FromClass, { args: args, key: props.key }) : React.createElement.apply(null, args);
}

function createElement(type, props, _child) {
  props = props || I.object0;
  var lift = props[LIFT];
  if (lift || I.isString(type) || React.Fragment === type) {
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
