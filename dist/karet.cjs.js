'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var I = require('infestines');
var React = require('react');
var kefir = require('kefir');

//

var VALUE = 'value';
var ERROR = 'error';

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

    if (type === VALUE) {
      self.forceUpdate();
    } else if (type === ERROR) {
      throw e.value;
    }
  };

  forEachInProps(args[1], handler, onAny);
  forEachInChildren(2, args, handler, onAny);
}

function doUnsubscribe(self, _ref2) {
  var args = _ref2.args;

  var handler = self.h;
  if (handler) {
    forEachInChildren(2, args, handler, offAny);
    forEachInProps(args[1], handler, offAny);
  }
}

function decObs(obs2num, property) {
  obs2num.set(property, (obs2num.get(property) || 0) - 1);
}

function incObs(obs2num, property) {
  obs2num.set(property, (obs2num.get(property) || 0) + 1);
}

function updateObs(delta, property, obs2num) {
  if (delta < 0) do {
    property.offAny(obs2num.h);
  } while (++delta);else if (0 < delta) do {
    property.onAny(obs2num.h);
  } while (--delta);
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
  componentDidUpdate: function componentDidUpdate(_ref3) {
    var before = _ref3.args;
    var after = this.props.args;


    var obs2num = new Map();
    obs2num.h = this.h;

    forEachInProps(before[1], obs2num, decObs);
    forEachInChildren(2, before, obs2num, decObs);

    forEachInProps(after[1], obs2num, incObs);
    forEachInChildren(2, after, obs2num, incObs);

    obs2num.forEach(updateObs);
  },
  componentWillUnmount: function componentWillUnmount() {
    doUnsubscribe(this, this.props);
  },
  render: function render() {
    if (this.h) {
      var args = this.props.args;

      var n = args.length;
      var newArgs = Array(n);
      newArgs[0] = args[0];
      newArgs[1] = renderProps(args[1]);
      for (var i = 2; i < n; ++i) {
        var v = args[i];
        newArgs[i] = isProperty(v) ? valueOf(v) : I.isArray(v) ? renderChildren(v) : v;
      }
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
  if (hasPropertiesInProps(props) || hasPropertiesInChildren(2, args)) {
    var fromClassProps = { args: args };
    if (props) {
      var key = props.key;
      if (null != key) fromClassProps.key = key;
    }
    return React.createElement(FromClass, fromClassProps);
  } else {
    return React.createElement.apply(null, args);
  }
}

function createElement(type, props, _child) {
  var lift = props && props[LIFT];
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

exports.Fragment = React.Fragment;
exports.createElement = createElement;
exports.fromClass = fromClass;
