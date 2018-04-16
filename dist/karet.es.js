import { isArray, inherit, object0, acyclicEqualsU, isString, dissocPartialU, assocPartialU } from 'infestines';
import { Component, createElement, Fragment, forwardRef } from 'react';
export { Fragment } from 'react';
import { Property } from 'kefir';

//

var VALUE = 'value';
var ERROR = 'error';

var STYLE = 'style';
var DANGEROUSLY = 'dangerouslySetInnerHTML';

var CHILDREN = 'children';

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

function renderChildren(children) {
  var newChildren = children;
  for (var i = 0, n = children.length; i < n; ++i) {
    var v = children[i];
    var w = isProperty(v) ? valueOf(v) : isArray(v) ? renderChildren(v) : v;
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
    var w = isProperty(v) ? valueOf(v) : CHILDREN === i ? isArray(v) ? renderChildren(v) : v : STYLE === i || DANGEROUSLY === i ? renderObject(v) : v;
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
    if (isProperty(c)) fn(extra, c);else if (isArray(c)) forEachInChildren(0, c, extra, fn);
  }
}

function forEachInProps(props, extra, fn) {
  for (var i in props) {
    var v = props[i];
    if (isProperty(v)) {
      fn(extra, v);
    } else if (CHILDREN === i) {
      if (isArray(v)) forEachInChildren(0, v, extra, fn);
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

var server = typeof window === 'undefined' && { h: null, forceUpdate: function forceUpdate() {}
};

var FromClass = /*#__PURE__*/inherit(function FromClass(props) {
  Component.call(this, props);
  this.h = null;
  if (server) this.state = object0;
}, Component, {
  componentDidMount: function componentDidMount() {
    doSubscribe(this, this.props);
  },
  componentDidUpdate: function componentDidUpdate(prevProps) {
    var props = this.props;
    if (!acyclicEqualsU(props, prevProps)) {
      doUnsubscribe(this, prevProps);
      doSubscribe(this, props);
    }
  },
  componentWillUnmount: function componentWillUnmount() {
    doUnsubscribe(this, this.props);
  },
  render: function render() {
    if (this.h || server) {
      var args = this.props.args;

      var n = args.length;
      var newArgs = Array(n);
      newArgs[0] = args[0];
      newArgs[1] = renderProps(args[1]);
      for (var i = 2; i < n; ++i) {
        var v = args[i];
        newArgs[i] = isProperty(v) ? valueOf(v) : isArray(v) ? renderChildren(v) : v;
      }
      return createElement.apply(null, newArgs);
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
    if (isProperty(c) || isArray(c) && hasPropertiesInChildren(0, c)) return true;
  }
  return false;
}

function hasPropertiesInProps(props) {
  for (var i in props) {
    var v = props[i];
    if (isProperty(v)) {
      return true;
    } else if (CHILDREN === i) {
      if (isArray(v) && hasPropertiesInChildren(0, v)) return true;
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
    return createElement(FromClass, fromClassProps);
  } else {
    return createElement.apply(null, args);
  }
}

function createElement$1(type, props, _child) {
  var lift = props && props[LIFT];
  if (lift || isString(type) || Fragment === type) {
    var n = arguments.length;
    var args = Array(n);
    args[0] = type;
    args[1] = lift ? dissocPartialU(LIFT, props) : props;
    for (var i = 2; i < n; ++i) {
      args[i] = arguments[i];
    }return considerLifting(args);
  } else {
    return createElement.apply(null, arguments);
  }
}

//

var fromClass = function fromClass(type) {
  return forwardRef(function (props, ref) {
    return considerLifting([type, null == ref ? props : assocPartialU('ref', ref, props)]);
  });
};

export { createElement$1 as createElement, fromClass };
