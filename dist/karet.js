(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('react'), require('kefir'), require('infestines')) :
  typeof define === 'function' && define.amd ? define(['exports', 'react', 'kefir', 'infestines'], factory) :
  (factory((global.karet = {}),global.React,global.Kefir,global.I));
}(this, (function (exports,React,kefir,infestines) { 'use strict';

  //

  var header = 'karet: ';

  function warn(f, m) {
    if (!f.warned) {
      f.warned = 1;
      console.warn(header + m);
    }
  }

  //

  var VALUE = 'value';
  var ERROR = 'error';
  var END = 'end';
  var STYLE = 'style';
  var CHILDREN = 'children';
  var LIFT = 'karet-lift';
  var DD_REF = '$$ref';

  //

  var reactElement = React.createElement;
  var Component = React.Component;

  var isObs = function isObs(x) {
    return x instanceof kefir.Observable;
  };

  //

  function doSubscribe(self, props) {
    self.at = 0;
    self.doSubscribe(props);
    self.at = 1;
  }

  var LiftedComponent = /*#__PURE__*/infestines.inherit(function LiftedComponent(props) {
    Component.call(this, props);
    this.at = 0;
  }, Component, {
    componentWillReceiveProps: function componentWillReceiveProps(nextProps) {
      this.componentWillUnmount();
      doSubscribe(this, nextProps);
    },
    componentWillMount: function componentWillMount() {
      doSubscribe(this, this.props);
    }
  });

  //

  var FromKefir = /*#__PURE__*/infestines.inherit(function FromKefir(props) {
    LiftedComponent.call(this, props);
    this.callback = this.rendered = null;
  }, LiftedComponent, {
    componentWillUnmount: function componentWillUnmount() {
      var callback = this.callback;
      if (callback) this.props.observable.offAny(callback);
    },
    doSubscribe: function doSubscribe(_ref) {
      var _this = this;

      var observable = _ref.observable;

      if (isObs(observable)) {
        var callback = function callback(e) {
          switch (e.type) {
            case VALUE:
              _this.rendered = e.value || null;
              _this.at && _this.forceUpdate();
              break;
            case ERROR:
              throw e.value;
            case END:
              _this.callback = null;
          }
        };
        this.callback = callback;
        observable.onAny(callback);
      } else {
        this.rendered = observable || null;
      }
      this.at = 1;
    },
    render: function render() {
      return this.rendered;
    }
  });

  var fromKefir = /*#__PURE__*/(function (fn) {
    return function (x) {
      warn(fromKefir, '`fromKefir` has been obsoleted, use `Fragment` instead.');
      return fn(x);
    };
  })(function (observable) {
    return reactElement(FromKefir, { observable: observable });
  });

  //

  function renderChildren(children, self, values) {
    if (isObs(children)) {
      return values[self.at++];
    } else if (infestines.isArray(children)) {
      var newChildren = children;
      for (var i = 0, n = children.length; i < n; ++i) {
        var childI = children[i];
        var newChildI = childI;
        if (isObs(childI)) {
          newChildI = values[self.at++];
        } else if (infestines.isArray(childI)) {
          newChildI = renderChildren(childI, self, values);
        }
        if (newChildI !== childI) {
          if (newChildren === children) newChildren = children.slice(0);
          newChildren[i] = newChildI;
        }
      }
      return newChildren;
    } else {
      return children;
    }
  }

  function renderStyle(style, self, values) {
    var newStyle = null;
    for (var i in style) {
      var styleI = style[i];
      if (isObs(styleI)) {
        if (!newStyle) {
          newStyle = {};
          for (var j in style) {
            if (j === i) break;
            newStyle[j] = style[j];
          }
        }
        newStyle[i] = values[self.at++];
      } else if (newStyle) {
        newStyle[i] = styleI;
      }
    }
    return newStyle || style;
  }

  function _render(self, values) {
    var props = self.props;

    var type = null;
    var newProps = null;
    var newChildren = null;

    self.at = 0;

    for (var key in props) {
      var val = props[key];
      if (CHILDREN === key) {
        newChildren = renderChildren(val, self, values);
      } else if ('$$type' === key) {
        type = props[key];
      } else if (DD_REF === key) {
        newProps = newProps || {};
        newProps.ref = isObs(val) ? values[self.at++] : val;
      } else if (isObs(val)) {
        newProps = newProps || {};
        newProps[key] = values[self.at++];
      } else if (STYLE === key) {
        newProps = newProps || {};
        newProps.style = renderStyle(val, self, values);
      } else {
        newProps = newProps || {};
        newProps[key] = val;
      }
    }

    return newChildren instanceof Array ? reactElement.apply(null, [type, newProps].concat(newChildren)) : null !== newChildren ? reactElement(type, newProps, newChildren) : reactElement(type, newProps);
  }

  //

  function forEachInChildrenArray(children, extra, fn) {
    for (var i = 0, n = children.length; i < n; ++i) {
      var childI = children[i];
      if (isObs(childI)) fn(extra, childI);else if (infestines.isArray(childI)) forEachInChildrenArray(childI, extra, fn);
    }
  }

  function forEachInProps(props, extra, fn) {
    for (var key in props) {
      var val = props[key];
      if (isObs(val)) {
        fn(extra, val);
      } else if (CHILDREN === key) {
        if (infestines.isArray(val)) forEachInChildrenArray(val, extra, fn);
      } else if (STYLE === key) {
        for (var k in val) {
          var valK = val[k];
          if (isObs(valK)) fn(extra, valK);
        }
      }
    }
  }

  //

  function incValues(self) {
    self.values += 1;
  }
  function offAny1(handlers, obs) {
    obs.offAny(handlers);
  }
  function offAny(handlers, obs) {
    var handler = handlers.pop();
    if (handler) obs.offAny(handler);
  }
  function onAny1(handlers, obs) {
    obs.onAny(handlers);
  }
  function onAny(self, obs) {
    var handler = function handler(e) {
      var handlers = self.handlers;
      var idx = 0;
      while (handlers[idx] !== handler) {
        ++idx;
      }switch (e.type) {
        case VALUE:
          {
            var value = e.value;
            var values = self.values;
            if (values[idx] !== value) {
              values[idx] = value;
              self.at && self.forceUpdate();
            }
            break;
          }
        case ERROR:
          throw e.value;
        default:
          {
            handlers[idx] = null;
            var n = handlers.length;
            if (n !== self.values.length) return;
            for (var i = 0; i < n; ++i) {
              if (handlers[i]) return;
            }self.handlers = null;
          }
      }
    };
    self.handlers.push(handler);
    obs.onAny(handler);
  }

  var FromClass = /*#__PURE__*/infestines.inherit(function FromClass(props) {
    LiftedComponent.call(this, props);
    this.values = this;
    this.handlers = null;
  }, LiftedComponent, {
    componentWillUnmount: function componentWillUnmount() {
      var handlers = this.handlers;
      if (handlers instanceof Function) {
        forEachInProps(this.props, handlers, offAny1);
      } else if (handlers) {
        forEachInProps(this.props, handlers.reverse(), offAny);
      }
    },
    doSubscribe: function doSubscribe(props) {
      var _this2 = this;

      this.values = 0;
      forEachInProps(props, this, incValues);
      var n = this.values;

      switch (n) {
        case 0:
          this.values = infestines.array0;
          break;
        case 1:
          {
            this.values = this;
            forEachInProps(props, this.handlers = function (e) {
              switch (e.type) {
                case VALUE:
                  {
                    var value = e.value;
                    if (_this2.values !== value) {
                      _this2.values = value;
                      _this2.at && _this2.forceUpdate();
                    }
                    break;
                  }
                case ERROR:
                  throw e.value;
                default:
                  {
                    _this2.values = [_this2.values];
                    _this2.handlers = null;
                  }
              }
            }, onAny1);
            break;
          }
        default:
          this.values = Array(n).fill(this);
          this.handlers = [];
          forEachInProps(props, this, onAny);
      }
    },
    render: function render() {
      if (this.handlers instanceof Function) {
        var value = this.values;
        if (value === this) return null;
        return _render(this, [value]);
      } else {
        var values = this.values;
        for (var i = 0, n = values.length; i < n; ++i) {
          if (values[i] === this) return null;
        }return _render(this, values);
      }
    }
  });

  //

  function hasObsInChildrenArray(i, children) {
    for (var n = children.length; i < n; ++i) {
      var child = children[i];
      if (isObs(child) || infestines.isArray(child) && hasObsInChildrenArray(0, child)) return true;
    }
    return false;
  }

  function hasObsInProps(props) {
    for (var key in props) {
      var val = props[key];
      if (isObs(val)) {
        return true;
      } else if (CHILDREN === key) {
        if (infestines.isArray(val) && hasObsInChildrenArray(0, val)) return true;
      } else if (STYLE === key) {
        for (var k in val) {
          if (isObs(val[k])) return true;
        }
      }
    }
    return false;
  }

  //

  function filterProps(type, props) {
    var newProps = { $$type: type };
    for (var key in props) {
      var val = props[key];
      if ('ref' === key) newProps[DD_REF] = val;else if (LIFT !== key) newProps[key] = val;
    }
    return newProps;
  }

  function createElement() {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    var type = args[0];
    var props = args[1] || infestines.object0;
    if (infestines.isString(type) || React.Fragment === type || props[LIFT]) {
      if (hasObsInChildrenArray(2, args) || hasObsInProps(props)) {
        args[1] = filterProps(type, props);
        args[0] = FromClass;
      } else if (props[LIFT]) {
        args[1] = infestines.dissocPartialU(LIFT, props) || infestines.object0;
      }
    }
    return reactElement.apply(undefined, args);
  }

  //

  var fromClass = function fromClass(Class) {
    return function (props) {
      return reactElement(FromClass, filterProps(Class, props));
    };
  };

  exports.Fragment = React.Fragment;
  exports.fromKefir = fromKefir;
  exports.createElement = createElement;
  exports.fromClass = fromClass;

  Object.defineProperty(exports, '__esModule', { value: true });

})));
