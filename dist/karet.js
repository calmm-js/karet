(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('infestines'), require('react'), require('kefir')) :
  typeof define === 'function' && define.amd ? define(['exports', 'infestines', 'react', 'kefir'], factory) :
  (factory((global.karet = {}),global.I,global.React,global.Kefir));
}(this, (function (exports,I,React,kefir) { 'use strict';

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

  var FromClass = /*#__PURE__*/I.inherit(function FromClass(props) {
    React.Component.call(this, props);
    this.handler = null;
  }, React.Component, {
    componentWillMount: function componentWillMount() {
      this.doSubscribe(this.props);
    },
    componentWillReceiveProps: function componentWillReceiveProps(nextProps) {
      this.componentWillUnmount();
      this.doSubscribe(nextProps);
    },
    componentWillUnmount: function componentWillUnmount() {
      var handler = this.handler;
      if (handler) {
        var args = this.props.args;

        forEachInChildren(2, args, handler, offAny);
        forEachInProps(args[1], handler, offAny);
      }
    },
    doSubscribe: function doSubscribe(_ref) {
      var _this = this;

      var args = _ref.args;

      var handler = this.handler = function (e) {
        var type = e.type;

        if (type === VALUE) _this.forceUpdate();else if (type === ERROR) throw e.value;else _this.handler = null;
      };
      forEachInProps(args[1], handler, onAny);
      forEachInChildren(2, args, handler, onAny);
    },
    render: function render() {
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
      return considerLifting([type, undefined === ref ? props : I.assocPartialU('ref', ref, props)]);
    });
  };

  exports.Fragment = React.Fragment;
  exports.createElement = createElement;
  exports.fromClass = fromClass;

  Object.defineProperty(exports, '__esModule', { value: true });

})));
