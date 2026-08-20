#!/usr/bin/env node
// Built by scripts/bundle.mjs. Edit src/, not this file.
//
// yaml ships CommonJS that calls require('process'). An ESM bundle has no
// require, and esbuild's fallback shim throws rather than guessing, so one is
// made here. Builtins resolve through it with no node_modules present.
import { createRequire as __createRequire } from 'node:module';
const require = __createRequire(import.meta.url);
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __commonJS = (cb, mod) => function __require2() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/picocolors/picocolors.js
var require_picocolors = __commonJS({
  "node_modules/picocolors/picocolors.js"(exports, module) {
    var p = process || {};
    var argv = p.argv || [];
    var env = p.env || {};
    var isColorSupported = !(!!env.NO_COLOR || argv.includes("--no-color")) && (!!env.FORCE_COLOR || argv.includes("--color") || p.platform === "win32" || (p.stdout || {}).isTTY && env.TERM !== "dumb" || !!env.CI);
    var formatter = (open, close, replace = open) => (input) => {
      let string = "" + input, index = string.indexOf(close, open.length);
      return ~index ? open + replaceClose(string, close, replace, index) + close : open + string + close;
    };
    var replaceClose = (string, close, replace, index) => {
      let result = "", cursor = 0;
      do {
        result += string.substring(cursor, index) + replace;
        cursor = index + close.length;
        index = string.indexOf(close, cursor);
      } while (~index);
      return result + string.substring(cursor);
    };
    var createColors = (enabled = isColorSupported) => {
      let f = enabled ? formatter : () => String;
      return {
        isColorSupported: enabled,
        reset: f("\x1B[0m", "\x1B[0m"),
        bold: f("\x1B[1m", "\x1B[22m", "\x1B[22m\x1B[1m"),
        dim: f("\x1B[2m", "\x1B[22m", "\x1B[22m\x1B[2m"),
        italic: f("\x1B[3m", "\x1B[23m"),
        underline: f("\x1B[4m", "\x1B[24m"),
        inverse: f("\x1B[7m", "\x1B[27m"),
        hidden: f("\x1B[8m", "\x1B[28m"),
        strikethrough: f("\x1B[9m", "\x1B[29m"),
        black: f("\x1B[30m", "\x1B[39m"),
        red: f("\x1B[31m", "\x1B[39m"),
        green: f("\x1B[32m", "\x1B[39m"),
        yellow: f("\x1B[33m", "\x1B[39m"),
        blue: f("\x1B[34m", "\x1B[39m"),
        magenta: f("\x1B[35m", "\x1B[39m"),
        cyan: f("\x1B[36m", "\x1B[39m"),
        white: f("\x1B[37m", "\x1B[39m"),
        gray: f("\x1B[90m", "\x1B[39m"),
        bgBlack: f("\x1B[40m", "\x1B[49m"),
        bgRed: f("\x1B[41m", "\x1B[49m"),
        bgGreen: f("\x1B[42m", "\x1B[49m"),
        bgYellow: f("\x1B[43m", "\x1B[49m"),
        bgBlue: f("\x1B[44m", "\x1B[49m"),
        bgMagenta: f("\x1B[45m", "\x1B[49m"),
        bgCyan: f("\x1B[46m", "\x1B[49m"),
        bgWhite: f("\x1B[47m", "\x1B[49m"),
        blackBright: f("\x1B[90m", "\x1B[39m"),
        redBright: f("\x1B[91m", "\x1B[39m"),
        greenBright: f("\x1B[92m", "\x1B[39m"),
        yellowBright: f("\x1B[93m", "\x1B[39m"),
        blueBright: f("\x1B[94m", "\x1B[39m"),
        magentaBright: f("\x1B[95m", "\x1B[39m"),
        cyanBright: f("\x1B[96m", "\x1B[39m"),
        whiteBright: f("\x1B[97m", "\x1B[39m"),
        bgBlackBright: f("\x1B[100m", "\x1B[49m"),
        bgRedBright: f("\x1B[101m", "\x1B[49m"),
        bgGreenBright: f("\x1B[102m", "\x1B[49m"),
        bgYellowBright: f("\x1B[103m", "\x1B[49m"),
        bgBlueBright: f("\x1B[104m", "\x1B[49m"),
        bgMagentaBright: f("\x1B[105m", "\x1B[49m"),
        bgCyanBright: f("\x1B[106m", "\x1B[49m"),
        bgWhiteBright: f("\x1B[107m", "\x1B[49m")
      };
    };
    module.exports = createColors();
    module.exports.createColors = createColors;
  }
});

// node_modules/yaml/dist/nodes/identity.js
var require_identity = __commonJS({
  "node_modules/yaml/dist/nodes/identity.js"(exports) {
    "use strict";
    var ALIAS = /* @__PURE__ */ Symbol.for("yaml.alias");
    var DOC = /* @__PURE__ */ Symbol.for("yaml.document");
    var MAP = /* @__PURE__ */ Symbol.for("yaml.map");
    var PAIR = /* @__PURE__ */ Symbol.for("yaml.pair");
    var SCALAR = /* @__PURE__ */ Symbol.for("yaml.scalar");
    var SEQ = /* @__PURE__ */ Symbol.for("yaml.seq");
    var NODE_TYPE = /* @__PURE__ */ Symbol.for("yaml.node.type");
    var isAlias = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === ALIAS;
    var isDocument = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === DOC;
    var isMap = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === MAP;
    var isPair = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === PAIR;
    var isScalar = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === SCALAR;
    var isSeq = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === SEQ;
    function isCollection(node) {
      if (node && typeof node === "object")
        switch (node[NODE_TYPE]) {
          case MAP:
          case SEQ:
            return true;
        }
      return false;
    }
    function isNode(node) {
      if (node && typeof node === "object")
        switch (node[NODE_TYPE]) {
          case ALIAS:
          case MAP:
          case SCALAR:
          case SEQ:
            return true;
        }
      return false;
    }
    var hasAnchor = (node) => (isScalar(node) || isCollection(node)) && !!node.anchor;
    exports.ALIAS = ALIAS;
    exports.DOC = DOC;
    exports.MAP = MAP;
    exports.NODE_TYPE = NODE_TYPE;
    exports.PAIR = PAIR;
    exports.SCALAR = SCALAR;
    exports.SEQ = SEQ;
    exports.hasAnchor = hasAnchor;
    exports.isAlias = isAlias;
    exports.isCollection = isCollection;
    exports.isDocument = isDocument;
    exports.isMap = isMap;
    exports.isNode = isNode;
    exports.isPair = isPair;
    exports.isScalar = isScalar;
    exports.isSeq = isSeq;
  }
});

// node_modules/yaml/dist/visit.js
var require_visit = __commonJS({
  "node_modules/yaml/dist/visit.js"(exports) {
    "use strict";
    var identity = require_identity();
    var BREAK = /* @__PURE__ */ Symbol("break visit");
    var SKIP = /* @__PURE__ */ Symbol("skip children");
    var REMOVE = /* @__PURE__ */ Symbol("remove node");
    function visit(node, visitor) {
      const visitor_ = initVisitor(visitor);
      if (identity.isDocument(node)) {
        const cd = visit_(null, node.contents, visitor_, Object.freeze([node]));
        if (cd === REMOVE)
          node.contents = null;
      } else
        visit_(null, node, visitor_, Object.freeze([]));
    }
    visit.BREAK = BREAK;
    visit.SKIP = SKIP;
    visit.REMOVE = REMOVE;
    function visit_(key, node, visitor, path2) {
      const ctrl = callVisitor(key, node, visitor, path2);
      if (identity.isNode(ctrl) || identity.isPair(ctrl)) {
        replaceNode(key, path2, ctrl);
        return visit_(key, ctrl, visitor, path2);
      }
      if (typeof ctrl !== "symbol") {
        if (identity.isCollection(node)) {
          path2 = Object.freeze(path2.concat(node));
          for (let i = 0; i < node.items.length; ++i) {
            const ci = visit_(i, node.items[i], visitor, path2);
            if (typeof ci === "number")
              i = ci - 1;
            else if (ci === BREAK)
              return BREAK;
            else if (ci === REMOVE) {
              node.items.splice(i, 1);
              i -= 1;
            }
          }
        } else if (identity.isPair(node)) {
          path2 = Object.freeze(path2.concat(node));
          const ck = visit_("key", node.key, visitor, path2);
          if (ck === BREAK)
            return BREAK;
          else if (ck === REMOVE)
            node.key = null;
          const cv = visit_("value", node.value, visitor, path2);
          if (cv === BREAK)
            return BREAK;
          else if (cv === REMOVE)
            node.value = null;
        }
      }
      return ctrl;
    }
    async function visitAsync(node, visitor) {
      const visitor_ = initVisitor(visitor);
      if (identity.isDocument(node)) {
        const cd = await visitAsync_(null, node.contents, visitor_, Object.freeze([node]));
        if (cd === REMOVE)
          node.contents = null;
      } else
        await visitAsync_(null, node, visitor_, Object.freeze([]));
    }
    visitAsync.BREAK = BREAK;
    visitAsync.SKIP = SKIP;
    visitAsync.REMOVE = REMOVE;
    async function visitAsync_(key, node, visitor, path2) {
      const ctrl = await callVisitor(key, node, visitor, path2);
      if (identity.isNode(ctrl) || identity.isPair(ctrl)) {
        replaceNode(key, path2, ctrl);
        return visitAsync_(key, ctrl, visitor, path2);
      }
      if (typeof ctrl !== "symbol") {
        if (identity.isCollection(node)) {
          path2 = Object.freeze(path2.concat(node));
          for (let i = 0; i < node.items.length; ++i) {
            const ci = await visitAsync_(i, node.items[i], visitor, path2);
            if (typeof ci === "number")
              i = ci - 1;
            else if (ci === BREAK)
              return BREAK;
            else if (ci === REMOVE) {
              node.items.splice(i, 1);
              i -= 1;
            }
          }
        } else if (identity.isPair(node)) {
          path2 = Object.freeze(path2.concat(node));
          const ck = await visitAsync_("key", node.key, visitor, path2);
          if (ck === BREAK)
            return BREAK;
          else if (ck === REMOVE)
            node.key = null;
          const cv = await visitAsync_("value", node.value, visitor, path2);
          if (cv === BREAK)
            return BREAK;
          else if (cv === REMOVE)
            node.value = null;
        }
      }
      return ctrl;
    }
    function initVisitor(visitor) {
      if (typeof visitor === "object" && (visitor.Collection || visitor.Node || visitor.Value)) {
        return Object.assign({
          Alias: visitor.Node,
          Map: visitor.Node,
          Scalar: visitor.Node,
          Seq: visitor.Node
        }, visitor.Value && {
          Map: visitor.Value,
          Scalar: visitor.Value,
          Seq: visitor.Value
        }, visitor.Collection && {
          Map: visitor.Collection,
          Seq: visitor.Collection
        }, visitor);
      }
      return visitor;
    }
    function callVisitor(key, node, visitor, path2) {
      if (typeof visitor === "function")
        return visitor(key, node, path2);
      if (identity.isMap(node))
        return visitor.Map?.(key, node, path2);
      if (identity.isSeq(node))
        return visitor.Seq?.(key, node, path2);
      if (identity.isPair(node))
        return visitor.Pair?.(key, node, path2);
      if (identity.isScalar(node))
        return visitor.Scalar?.(key, node, path2);
      if (identity.isAlias(node))
        return visitor.Alias?.(key, node, path2);
      return void 0;
    }
    function replaceNode(key, path2, node) {
      const parent = path2[path2.length - 1];
      if (identity.isCollection(parent)) {
        parent.items[key] = node;
      } else if (identity.isPair(parent)) {
        if (key === "key")
          parent.key = node;
        else
          parent.value = node;
      } else if (identity.isDocument(parent)) {
        parent.contents = node;
      } else {
        const pt = identity.isAlias(parent) ? "alias" : "scalar";
        throw new Error(`Cannot replace node with ${pt} parent`);
      }
    }
    exports.visit = visit;
    exports.visitAsync = visitAsync;
  }
});

// node_modules/yaml/dist/doc/directives.js
var require_directives = __commonJS({
  "node_modules/yaml/dist/doc/directives.js"(exports) {
    "use strict";
    var identity = require_identity();
    var visit = require_visit();
    var escapeChars = {
      "!": "%21",
      ",": "%2C",
      "[": "%5B",
      "]": "%5D",
      "{": "%7B",
      "}": "%7D"
    };
    var escapeTagName = (tn) => tn.replace(/[!,[\]{}]/g, (ch) => escapeChars[ch]);
    var Directives = class _Directives {
      constructor(yaml, tags) {
        this.docStart = null;
        this.docEnd = false;
        this.yaml = Object.assign({}, _Directives.defaultYaml, yaml);
        this.tags = Object.assign({}, _Directives.defaultTags, tags);
      }
      clone() {
        const copy = new _Directives(this.yaml, this.tags);
        copy.docStart = this.docStart;
        return copy;
      }
      /**
       * During parsing, get a Directives instance for the current document and
       * update the stream state according to the current version's spec.
       */
      atDocument() {
        const res = new _Directives(this.yaml, this.tags);
        switch (this.yaml.version) {
          case "1.1":
            this.atNextDocument = true;
            break;
          case "1.2":
            this.atNextDocument = false;
            this.yaml = {
              explicit: _Directives.defaultYaml.explicit,
              version: "1.2"
            };
            this.tags = Object.assign({}, _Directives.defaultTags);
            break;
        }
        return res;
      }
      /**
       * @param onError - May be called even if the action was successful
       * @returns `true` on success
       */
      add(line, onError) {
        if (this.atNextDocument) {
          this.yaml = { explicit: _Directives.defaultYaml.explicit, version: "1.1" };
          this.tags = Object.assign({}, _Directives.defaultTags);
          this.atNextDocument = false;
        }
        const parts = line.trim().split(/[ \t]+/);
        const name = parts.shift();
        switch (name) {
          case "%TAG": {
            if (parts.length !== 2) {
              onError(0, "%TAG directive should contain exactly two parts");
              if (parts.length < 2)
                return false;
            }
            const [handle, prefix] = parts;
            this.tags[handle] = prefix;
            return true;
          }
          case "%YAML": {
            this.yaml.explicit = true;
            if (parts.length !== 1) {
              onError(0, "%YAML directive should contain exactly one part");
              return false;
            }
            const [version] = parts;
            if (version === "1.1" || version === "1.2") {
              this.yaml.version = version;
              return true;
            } else {
              const isValid = /^\d+\.\d+$/.test(version);
              onError(6, `Unsupported YAML version ${version}`, isValid);
              return false;
            }
          }
          default:
            onError(0, `Unknown directive ${name}`, true);
            return false;
        }
      }
      /**
       * Resolves a tag, matching handles to those defined in %TAG directives.
       *
       * @returns Resolved tag, which may also be the non-specific tag `'!'` or a
       *   `'!local'` tag, or `null` if unresolvable.
       */
      tagName(source, onError) {
        if (source === "!")
          return "!";
        if (source[0] !== "!") {
          onError(`Not a valid tag: ${source}`);
          return null;
        }
        if (source[1] === "<") {
          const verbatim = source.slice(2, -1);
          if (verbatim === "!" || verbatim === "!!") {
            onError(`Verbatim tags aren't resolved, so ${source} is invalid.`);
            return null;
          }
          if (source[source.length - 1] !== ">")
            onError("Verbatim tags must end with a >");
          return verbatim;
        }
        const [, handle, suffix] = source.match(/^(.*!)([^!]*)$/s);
        if (!suffix)
          onError(`The ${source} tag has no suffix`);
        const prefix = this.tags[handle];
        if (prefix) {
          try {
            return prefix + decodeURIComponent(suffix);
          } catch (error) {
            onError(String(error));
            return null;
          }
        }
        if (handle === "!")
          return source;
        onError(`Could not resolve tag: ${source}`);
        return null;
      }
      /**
       * Given a fully resolved tag, returns its printable string form,
       * taking into account current tag prefixes and defaults.
       */
      tagString(tag) {
        for (const [handle, prefix] of Object.entries(this.tags)) {
          if (tag.startsWith(prefix))
            return handle + escapeTagName(tag.substring(prefix.length));
        }
        return tag[0] === "!" ? tag : `!<${tag}>`;
      }
      toString(doc) {
        const lines = this.yaml.explicit ? [`%YAML ${this.yaml.version || "1.2"}`] : [];
        const tagEntries = Object.entries(this.tags);
        let tagNames;
        if (doc && tagEntries.length > 0 && identity.isNode(doc.contents)) {
          const tags = {};
          visit.visit(doc.contents, (_key, node) => {
            if (identity.isNode(node) && node.tag)
              tags[node.tag] = true;
          });
          tagNames = Object.keys(tags);
        } else
          tagNames = [];
        for (const [handle, prefix] of tagEntries) {
          if (handle === "!!" && prefix === "tag:yaml.org,2002:")
            continue;
          if (!doc || tagNames.some((tn) => tn.startsWith(prefix)))
            lines.push(`%TAG ${handle} ${prefix}`);
        }
        return lines.join("\n");
      }
    };
    Directives.defaultYaml = { explicit: false, version: "1.2" };
    Directives.defaultTags = { "!!": "tag:yaml.org,2002:" };
    exports.Directives = Directives;
  }
});

// node_modules/yaml/dist/doc/anchors.js
var require_anchors = __commonJS({
  "node_modules/yaml/dist/doc/anchors.js"(exports) {
    "use strict";
    var identity = require_identity();
    var visit = require_visit();
    function anchorIsValid(anchor) {
      if (/[\x00-\x19\s,[\]{}]/.test(anchor)) {
        const sa = JSON.stringify(anchor);
        const msg = `Anchor must not contain whitespace or control characters: ${sa}`;
        throw new Error(msg);
      }
      return true;
    }
    function anchorNames(root) {
      const anchors = /* @__PURE__ */ new Set();
      visit.visit(root, {
        Value(_key, node) {
          if (node.anchor)
            anchors.add(node.anchor);
        }
      });
      return anchors;
    }
    function findNewAnchor(prefix, exclude) {
      for (let i = 1; true; ++i) {
        const name = `${prefix}${i}`;
        if (!exclude.has(name))
          return name;
      }
    }
    function createNodeAnchors(doc, prefix) {
      const aliasObjects = [];
      const sourceObjects = /* @__PURE__ */ new Map();
      let prevAnchors = null;
      return {
        onAnchor: (source) => {
          aliasObjects.push(source);
          prevAnchors ?? (prevAnchors = anchorNames(doc));
          const anchor = findNewAnchor(prefix, prevAnchors);
          prevAnchors.add(anchor);
          return anchor;
        },
        /**
         * With circular references, the source node is only resolved after all
         * of its child nodes are. This is why anchors are set only after all of
         * the nodes have been created.
         */
        setAnchors: () => {
          for (const source of aliasObjects) {
            const ref = sourceObjects.get(source);
            if (typeof ref === "object" && ref.anchor && (identity.isScalar(ref.node) || identity.isCollection(ref.node))) {
              ref.node.anchor = ref.anchor;
            } else {
              const error = new Error("Failed to resolve repeated object (this should not happen)");
              error.source = source;
              throw error;
            }
          }
        },
        sourceObjects
      };
    }
    exports.anchorIsValid = anchorIsValid;
    exports.anchorNames = anchorNames;
    exports.createNodeAnchors = createNodeAnchors;
    exports.findNewAnchor = findNewAnchor;
  }
});

// node_modules/yaml/dist/doc/applyReviver.js
var require_applyReviver = __commonJS({
  "node_modules/yaml/dist/doc/applyReviver.js"(exports) {
    "use strict";
    function applyReviver(reviver, obj, key, val) {
      if (val && typeof val === "object") {
        if (Array.isArray(val)) {
          for (let i = 0, len = val.length; i < len; ++i) {
            const v0 = val[i];
            const v1 = applyReviver(reviver, val, String(i), v0);
            if (v1 === void 0)
              delete val[i];
            else if (v1 !== v0)
              val[i] = v1;
          }
        } else if (val instanceof Map) {
          for (const k of Array.from(val.keys())) {
            const v0 = val.get(k);
            const v1 = applyReviver(reviver, val, k, v0);
            if (v1 === void 0)
              val.delete(k);
            else if (v1 !== v0)
              val.set(k, v1);
          }
        } else if (val instanceof Set) {
          for (const v0 of Array.from(val)) {
            const v1 = applyReviver(reviver, val, v0, v0);
            if (v1 === void 0)
              val.delete(v0);
            else if (v1 !== v0) {
              val.delete(v0);
              val.add(v1);
            }
          }
        } else {
          for (const [k, v0] of Object.entries(val)) {
            const v1 = applyReviver(reviver, val, k, v0);
            if (v1 === void 0)
              delete val[k];
            else if (v1 !== v0)
              val[k] = v1;
          }
        }
      }
      return reviver.call(obj, key, val);
    }
    exports.applyReviver = applyReviver;
  }
});

// node_modules/yaml/dist/nodes/toJS.js
var require_toJS = __commonJS({
  "node_modules/yaml/dist/nodes/toJS.js"(exports) {
    "use strict";
    var identity = require_identity();
    function toJS(value, arg, ctx) {
      if (Array.isArray(value))
        return value.map((v, i) => toJS(v, String(i), ctx));
      if (value && typeof value.toJSON === "function") {
        if (!ctx || !identity.hasAnchor(value))
          return value.toJSON(arg, ctx);
        const data = { aliasCount: 0, count: 1, res: void 0 };
        ctx.anchors.set(value, data);
        ctx.onCreate = (res2) => {
          data.res = res2;
          delete ctx.onCreate;
        };
        const res = value.toJSON(arg, ctx);
        if (ctx.onCreate)
          ctx.onCreate(res);
        return res;
      }
      if (typeof value === "bigint" && !ctx?.keep)
        return Number(value);
      return value;
    }
    exports.toJS = toJS;
  }
});

// node_modules/yaml/dist/nodes/Node.js
var require_Node = __commonJS({
  "node_modules/yaml/dist/nodes/Node.js"(exports) {
    "use strict";
    var applyReviver = require_applyReviver();
    var identity = require_identity();
    var toJS = require_toJS();
    var NodeBase = class {
      constructor(type) {
        Object.defineProperty(this, identity.NODE_TYPE, { value: type });
      }
      /** Create a copy of this node.  */
      clone() {
        const copy = Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this));
        if (this.range)
          copy.range = this.range.slice();
        return copy;
      }
      /** A plain JavaScript representation of this node. */
      toJS(doc, { mapAsMap, maxAliasCount, onAnchor, reviver } = {}) {
        if (!identity.isDocument(doc))
          throw new TypeError("A document argument is required");
        const ctx = {
          anchors: /* @__PURE__ */ new Map(),
          doc,
          keep: true,
          mapAsMap: mapAsMap === true,
          mapKeyWarned: false,
          maxAliasCount: typeof maxAliasCount === "number" ? maxAliasCount : 100
        };
        const res = toJS.toJS(this, "", ctx);
        if (typeof onAnchor === "function")
          for (const { count, res: res2 } of ctx.anchors.values())
            onAnchor(res2, count);
        return typeof reviver === "function" ? applyReviver.applyReviver(reviver, { "": res }, "", res) : res;
      }
    };
    exports.NodeBase = NodeBase;
  }
});

// node_modules/yaml/dist/nodes/Alias.js
var require_Alias = __commonJS({
  "node_modules/yaml/dist/nodes/Alias.js"(exports) {
    "use strict";
    var anchors = require_anchors();
    var visit = require_visit();
    var identity = require_identity();
    var Node = require_Node();
    var toJS = require_toJS();
    var Alias = class extends Node.NodeBase {
      constructor(source) {
        super(identity.ALIAS);
        this.source = source;
        Object.defineProperty(this, "tag", {
          set() {
            throw new Error("Alias nodes cannot have tags");
          }
        });
      }
      /**
       * Resolve the value of this alias within `doc`, finding the last
       * instance of the `source` anchor before this node.
       */
      resolve(doc, ctx) {
        if (ctx?.maxAliasCount === 0)
          throw new ReferenceError("Alias resolution is disabled");
        let nodes;
        if (ctx?.aliasResolveCache) {
          nodes = ctx.aliasResolveCache;
        } else {
          nodes = [];
          visit.visit(doc, {
            Node: (_key, node) => {
              if (identity.isAlias(node) || identity.hasAnchor(node))
                nodes.push(node);
            }
          });
          if (ctx)
            ctx.aliasResolveCache = nodes;
        }
        let found = void 0;
        for (const node of nodes) {
          if (node === this)
            break;
          if (node.anchor === this.source)
            found = node;
        }
        return found;
      }
      toJSON(_arg, ctx) {
        if (!ctx)
          return { source: this.source };
        const { anchors: anchors2, doc, maxAliasCount } = ctx;
        const source = this.resolve(doc, ctx);
        if (!source) {
          const msg = `Unresolved alias (the anchor must be set before the alias): ${this.source}`;
          throw new ReferenceError(msg);
        }
        let data = anchors2.get(source);
        if (!data) {
          toJS.toJS(source, null, ctx);
          data = anchors2.get(source);
        }
        if (data?.res === void 0) {
          const msg = "This should not happen: Alias anchor was not resolved?";
          throw new ReferenceError(msg);
        }
        if (maxAliasCount >= 0) {
          data.count += 1;
          if (data.aliasCount === 0)
            data.aliasCount = getAliasCount(doc, source, anchors2);
          if (data.count * data.aliasCount > maxAliasCount) {
            const msg = "Excessive alias count indicates a resource exhaustion attack";
            throw new ReferenceError(msg);
          }
        }
        return data.res;
      }
      toString(ctx, _onComment, _onChompKeep) {
        const src = `*${this.source}`;
        if (ctx) {
          anchors.anchorIsValid(this.source);
          if (ctx.options.verifyAliasOrder && !ctx.anchors.has(this.source)) {
            const msg = `Unresolved alias (the anchor must be set before the alias): ${this.source}`;
            throw new Error(msg);
          }
          if (ctx.implicitKey)
            return `${src} `;
        }
        return src;
      }
    };
    function getAliasCount(doc, node, anchors2) {
      if (identity.isAlias(node)) {
        const source = node.resolve(doc);
        const anchor = anchors2 && source && anchors2.get(source);
        return anchor ? anchor.count * anchor.aliasCount : 0;
      } else if (identity.isCollection(node)) {
        let count = 0;
        for (const item of node.items) {
          const c = getAliasCount(doc, item, anchors2);
          if (c > count)
            count = c;
        }
        return count;
      } else if (identity.isPair(node)) {
        const kc = getAliasCount(doc, node.key, anchors2);
        const vc = getAliasCount(doc, node.value, anchors2);
        return Math.max(kc, vc);
      }
      return 1;
    }
    exports.Alias = Alias;
  }
});

// node_modules/yaml/dist/nodes/Scalar.js
var require_Scalar = __commonJS({
  "node_modules/yaml/dist/nodes/Scalar.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Node = require_Node();
    var toJS = require_toJS();
    var isScalarValue = (value) => !value || typeof value !== "function" && typeof value !== "object";
    var Scalar = class extends Node.NodeBase {
      constructor(value) {
        super(identity.SCALAR);
        this.value = value;
      }
      toJSON(arg, ctx) {
        return ctx?.keep ? this.value : toJS.toJS(this.value, arg, ctx);
      }
      toString() {
        return String(this.value);
      }
    };
    Scalar.BLOCK_FOLDED = "BLOCK_FOLDED";
    Scalar.BLOCK_LITERAL = "BLOCK_LITERAL";
    Scalar.PLAIN = "PLAIN";
    Scalar.QUOTE_DOUBLE = "QUOTE_DOUBLE";
    Scalar.QUOTE_SINGLE = "QUOTE_SINGLE";
    exports.Scalar = Scalar;
    exports.isScalarValue = isScalarValue;
  }
});

// node_modules/yaml/dist/doc/createNode.js
var require_createNode = __commonJS({
  "node_modules/yaml/dist/doc/createNode.js"(exports) {
    "use strict";
    var Alias = require_Alias();
    var identity = require_identity();
    var Scalar = require_Scalar();
    var defaultTagPrefix = "tag:yaml.org,2002:";
    function findTagObject(value, tagName, tags) {
      if (tagName) {
        const match = tags.filter((t) => t.tag === tagName);
        const tagObj = match.find((t) => !t.format) ?? match[0];
        if (!tagObj)
          throw new Error(`Tag ${tagName} not found`);
        return tagObj;
      }
      return tags.find((t) => t.identify?.(value) && !t.format);
    }
    function createNode(value, tagName, ctx) {
      if (identity.isDocument(value))
        value = value.contents;
      if (identity.isNode(value))
        return value;
      if (identity.isPair(value)) {
        const map = ctx.schema[identity.MAP].createNode?.(ctx.schema, null, ctx);
        map.items.push(value);
        return map;
      }
      if (value instanceof String || value instanceof Number || value instanceof Boolean || typeof BigInt !== "undefined" && value instanceof BigInt) {
        value = value.valueOf();
      }
      const { aliasDuplicateObjects, onAnchor, onTagObj, schema, sourceObjects } = ctx;
      let ref = void 0;
      if (aliasDuplicateObjects && value && typeof value === "object") {
        ref = sourceObjects.get(value);
        if (ref) {
          ref.anchor ?? (ref.anchor = onAnchor(value));
          return new Alias.Alias(ref.anchor);
        } else {
          ref = { anchor: null, node: null };
          sourceObjects.set(value, ref);
        }
      }
      if (tagName?.startsWith("!!"))
        tagName = defaultTagPrefix + tagName.slice(2);
      let tagObj = findTagObject(value, tagName, schema.tags);
      if (!tagObj) {
        if (value && typeof value.toJSON === "function") {
          value = value.toJSON();
        }
        if (!value || typeof value !== "object") {
          const node2 = new Scalar.Scalar(value);
          if (ref)
            ref.node = node2;
          return node2;
        }
        tagObj = value instanceof Map ? schema[identity.MAP] : Symbol.iterator in Object(value) ? schema[identity.SEQ] : schema[identity.MAP];
      }
      if (onTagObj) {
        onTagObj(tagObj);
        delete ctx.onTagObj;
      }
      const node = tagObj?.createNode ? tagObj.createNode(ctx.schema, value, ctx) : typeof tagObj?.nodeClass?.from === "function" ? tagObj.nodeClass.from(ctx.schema, value, ctx) : new Scalar.Scalar(value);
      if (tagName)
        node.tag = tagName;
      else if (!tagObj.default)
        node.tag = tagObj.tag;
      if (ref)
        ref.node = node;
      return node;
    }
    exports.createNode = createNode;
  }
});

// node_modules/yaml/dist/nodes/Collection.js
var require_Collection = __commonJS({
  "node_modules/yaml/dist/nodes/Collection.js"(exports) {
    "use strict";
    var createNode = require_createNode();
    var identity = require_identity();
    var Node = require_Node();
    function collectionFromPath(schema, path2, value) {
      let v = value;
      for (let i = path2.length - 1; i >= 0; --i) {
        const k = path2[i];
        if (typeof k === "number" && Number.isInteger(k) && k >= 0) {
          const a = [];
          a[k] = v;
          v = a;
        } else {
          v = /* @__PURE__ */ new Map([[k, v]]);
        }
      }
      return createNode.createNode(v, void 0, {
        aliasDuplicateObjects: false,
        keepUndefined: false,
        onAnchor: () => {
          throw new Error("This should not happen, please report a bug.");
        },
        schema,
        sourceObjects: /* @__PURE__ */ new Map()
      });
    }
    var isEmptyPath = (path2) => path2 == null || typeof path2 === "object" && !!path2[Symbol.iterator]().next().done;
    var Collection = class extends Node.NodeBase {
      constructor(type, schema) {
        super(type);
        Object.defineProperty(this, "schema", {
          value: schema,
          configurable: true,
          enumerable: false,
          writable: true
        });
      }
      /**
       * Create a copy of this collection.
       *
       * @param schema - If defined, overwrites the original's schema
       */
      clone(schema) {
        const copy = Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this));
        if (schema)
          copy.schema = schema;
        copy.items = copy.items.map((it) => identity.isNode(it) || identity.isPair(it) ? it.clone(schema) : it);
        if (this.range)
          copy.range = this.range.slice();
        return copy;
      }
      /**
       * Adds a value to the collection. For `!!map` and `!!omap` the value must
       * be a Pair instance or a `{ key, value }` object, which may not have a key
       * that already exists in the map.
       */
      addIn(path2, value) {
        if (isEmptyPath(path2))
          this.add(value);
        else {
          const [key, ...rest] = path2;
          const node = this.get(key, true);
          if (identity.isCollection(node))
            node.addIn(rest, value);
          else if (node === void 0 && this.schema)
            this.set(key, collectionFromPath(this.schema, rest, value));
          else
            throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
        }
      }
      /**
       * Removes a value from the collection.
       * @returns `true` if the item was found and removed.
       */
      deleteIn(path2) {
        const [key, ...rest] = path2;
        if (rest.length === 0)
          return this.delete(key);
        const node = this.get(key, true);
        if (identity.isCollection(node))
          return node.deleteIn(rest);
        else
          throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
      }
      /**
       * Returns item at `key`, or `undefined` if not found. By default unwraps
       * scalar values from their surrounding node; to disable set `keepScalar` to
       * `true` (collections are always returned intact).
       */
      getIn(path2, keepScalar) {
        const [key, ...rest] = path2;
        const node = this.get(key, true);
        if (rest.length === 0)
          return !keepScalar && identity.isScalar(node) ? node.value : node;
        else
          return identity.isCollection(node) ? node.getIn(rest, keepScalar) : void 0;
      }
      hasAllNullValues(allowScalar) {
        return this.items.every((node) => {
          if (!identity.isPair(node))
            return false;
          const n = node.value;
          return n == null || allowScalar && identity.isScalar(n) && n.value == null && !n.commentBefore && !n.comment && !n.tag;
        });
      }
      /**
       * Checks if the collection includes a value with the key `key`.
       */
      hasIn(path2) {
        const [key, ...rest] = path2;
        if (rest.length === 0)
          return this.has(key);
        const node = this.get(key, true);
        return identity.isCollection(node) ? node.hasIn(rest) : false;
      }
      /**
       * Sets a value in this collection. For `!!set`, `value` needs to be a
       * boolean to add/remove the item from the set.
       */
      setIn(path2, value) {
        const [key, ...rest] = path2;
        if (rest.length === 0) {
          this.set(key, value);
        } else {
          const node = this.get(key, true);
          if (identity.isCollection(node))
            node.setIn(rest, value);
          else if (node === void 0 && this.schema)
            this.set(key, collectionFromPath(this.schema, rest, value));
          else
            throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
        }
      }
    };
    exports.Collection = Collection;
    exports.collectionFromPath = collectionFromPath;
    exports.isEmptyPath = isEmptyPath;
  }
});

// node_modules/yaml/dist/stringify/stringifyComment.js
var require_stringifyComment = __commonJS({
  "node_modules/yaml/dist/stringify/stringifyComment.js"(exports) {
    "use strict";
    var stringifyComment = (str) => str.replace(/^(?!$)(?: $)?/gm, "#");
    function indentComment(comment, indent) {
      if (/^\n+$/.test(comment))
        return comment.substring(1);
      return indent ? comment.replace(/^(?! *$)/gm, indent) : comment;
    }
    var lineComment = (str, indent, comment) => str.endsWith("\n") ? indentComment(comment, indent) : comment.includes("\n") ? "\n" + indentComment(comment, indent) : (str.endsWith(" ") ? "" : " ") + comment;
    exports.indentComment = indentComment;
    exports.lineComment = lineComment;
    exports.stringifyComment = stringifyComment;
  }
});

// node_modules/yaml/dist/stringify/foldFlowLines.js
var require_foldFlowLines = __commonJS({
  "node_modules/yaml/dist/stringify/foldFlowLines.js"(exports) {
    "use strict";
    var FOLD_FLOW = "flow";
    var FOLD_BLOCK = "block";
    var FOLD_QUOTED = "quoted";
    function foldFlowLines(text, indent, mode = "flow", { indentAtStart, lineWidth = 80, minContentWidth = 20, onFold, onOverflow } = {}) {
      if (!lineWidth || lineWidth < 0)
        return text;
      if (lineWidth < minContentWidth)
        minContentWidth = 0;
      const endStep = Math.max(1 + minContentWidth, 1 + lineWidth - indent.length);
      if (text.length <= endStep)
        return text;
      const folds = [];
      const escapedFolds = {};
      let end = lineWidth - indent.length;
      if (typeof indentAtStart === "number") {
        if (indentAtStart > lineWidth - Math.max(2, minContentWidth))
          folds.push(0);
        else
          end = lineWidth - indentAtStart;
      }
      let split = void 0;
      let prev = void 0;
      let overflow = false;
      let i = -1;
      let escStart = -1;
      let escEnd = -1;
      if (mode === FOLD_BLOCK) {
        i = consumeMoreIndentedLines(text, i, indent.length);
        if (i !== -1)
          end = i + endStep;
      }
      for (let ch; ch = text[i += 1]; ) {
        if (mode === FOLD_QUOTED && ch === "\\") {
          escStart = i;
          switch (text[i + 1]) {
            case "x":
              i += 3;
              break;
            case "u":
              i += 5;
              break;
            case "U":
              i += 9;
              break;
            default:
              i += 1;
          }
          escEnd = i;
        }
        if (ch === "\n") {
          if (mode === FOLD_BLOCK)
            i = consumeMoreIndentedLines(text, i, indent.length);
          end = i + indent.length + endStep;
          split = void 0;
        } else {
          if (ch === " " && prev && prev !== " " && prev !== "\n" && prev !== "	") {
            const next = text[i + 1];
            if (next && next !== " " && next !== "\n" && next !== "	")
              split = i;
          }
          if (i >= end) {
            if (split) {
              folds.push(split);
              end = split + endStep;
              split = void 0;
            } else if (mode === FOLD_QUOTED) {
              while (prev === " " || prev === "	") {
                prev = ch;
                ch = text[i += 1];
                overflow = true;
              }
              const j = i > escEnd + 1 ? i - 2 : escStart - 1;
              if (escapedFolds[j])
                return text;
              folds.push(j);
              escapedFolds[j] = true;
              end = j + endStep;
              split = void 0;
            } else {
              overflow = true;
            }
          }
        }
        prev = ch;
      }
      if (overflow && onOverflow)
        onOverflow();
      if (folds.length === 0)
        return text;
      if (onFold)
        onFold();
      let res = text.slice(0, folds[0]);
      for (let i2 = 0; i2 < folds.length; ++i2) {
        const fold = folds[i2];
        const end2 = folds[i2 + 1] || text.length;
        if (fold === 0)
          res = `
${indent}${text.slice(0, end2)}`;
        else {
          if (mode === FOLD_QUOTED && escapedFolds[fold])
            res += `${text[fold]}\\`;
          res += `
${indent}${text.slice(fold + 1, end2)}`;
        }
      }
      return res;
    }
    function consumeMoreIndentedLines(text, i, indent) {
      let end = i;
      let start = i + 1;
      let ch = text[start];
      while (ch === " " || ch === "	") {
        if (i < start + indent) {
          ch = text[++i];
        } else {
          do {
            ch = text[++i];
          } while (ch && ch !== "\n");
          end = i;
          start = i + 1;
          ch = text[start];
        }
      }
      return end;
    }
    exports.FOLD_BLOCK = FOLD_BLOCK;
    exports.FOLD_FLOW = FOLD_FLOW;
    exports.FOLD_QUOTED = FOLD_QUOTED;
    exports.foldFlowLines = foldFlowLines;
  }
});

// node_modules/yaml/dist/stringify/stringifyString.js
var require_stringifyString = __commonJS({
  "node_modules/yaml/dist/stringify/stringifyString.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    var foldFlowLines = require_foldFlowLines();
    var getFoldOptions = (ctx, isBlock) => ({
      indentAtStart: isBlock ? ctx.indent.length : ctx.indentAtStart,
      lineWidth: ctx.options.lineWidth,
      minContentWidth: ctx.options.minContentWidth
    });
    var containsDocumentMarker = (str) => /^(%|---|\.\.\.)/m.test(str);
    function lineLengthOverLimit(str, lineWidth, indentLength) {
      if (!lineWidth || lineWidth < 0)
        return false;
      const limit = lineWidth - indentLength;
      const strLen = str.length;
      if (strLen <= limit)
        return false;
      for (let i = 0, start = 0; i < strLen; ++i) {
        if (str[i] === "\n") {
          if (i - start > limit)
            return true;
          start = i + 1;
          if (strLen - start <= limit)
            return false;
        }
      }
      return true;
    }
    function doubleQuotedString(value, ctx) {
      const json = JSON.stringify(value);
      if (ctx.options.doubleQuotedAsJSON)
        return json;
      const { implicitKey } = ctx;
      const minMultiLineLength = ctx.options.doubleQuotedMinMultiLineLength;
      const indent = ctx.indent || (containsDocumentMarker(value) ? "  " : "");
      let str = "";
      let start = 0;
      for (let i = 0, ch = json[i]; ch; ch = json[++i]) {
        if (ch === " " && json[i + 1] === "\\" && json[i + 2] === "n") {
          str += json.slice(start, i) + "\\ ";
          i += 1;
          start = i;
          ch = "\\";
        }
        if (ch === "\\")
          switch (json[i + 1]) {
            case "u":
              {
                str += json.slice(start, i);
                const code = json.substr(i + 2, 4);
                switch (code) {
                  case "0000":
                    str += "\\0";
                    break;
                  case "0007":
                    str += "\\a";
                    break;
                  case "000b":
                    str += "\\v";
                    break;
                  case "001b":
                    str += "\\e";
                    break;
                  case "0085":
                    str += "\\N";
                    break;
                  case "00a0":
                    str += "\\_";
                    break;
                  case "2028":
                    str += "\\L";
                    break;
                  case "2029":
                    str += "\\P";
                    break;
                  default:
                    if (code.substr(0, 2) === "00")
                      str += "\\x" + code.substr(2);
                    else
                      str += json.substr(i, 6);
                }
                i += 5;
                start = i + 1;
              }
              break;
            case "n":
              if (implicitKey || json[i + 2] === '"' || json.length < minMultiLineLength) {
                i += 1;
              } else {
                str += json.slice(start, i) + "\n\n";
                while (json[i + 2] === "\\" && json[i + 3] === "n" && json[i + 4] !== '"') {
                  str += "\n";
                  i += 2;
                }
                str += indent;
                if (json[i + 2] === " ")
                  str += "\\";
                i += 1;
                start = i + 1;
              }
              break;
            default:
              i += 1;
          }
      }
      str = start ? str + json.slice(start) : json;
      return implicitKey ? str : foldFlowLines.foldFlowLines(str, indent, foldFlowLines.FOLD_QUOTED, getFoldOptions(ctx, false));
    }
    function singleQuotedString(value, ctx) {
      if (ctx.options.singleQuote === false || ctx.implicitKey && value.includes("\n") || /[ \t]\n|\n[ \t]/.test(value))
        return doubleQuotedString(value, ctx);
      const indent = ctx.indent || (containsDocumentMarker(value) ? "  " : "");
      const res = "'" + value.replace(/'/g, "''").replace(/\n+/g, `$&
${indent}`) + "'";
      return ctx.implicitKey ? res : foldFlowLines.foldFlowLines(res, indent, foldFlowLines.FOLD_FLOW, getFoldOptions(ctx, false));
    }
    function quotedString(value, ctx) {
      const { singleQuote } = ctx.options;
      let qs;
      if (singleQuote === false)
        qs = doubleQuotedString;
      else {
        const hasDouble = value.includes('"');
        const hasSingle = value.includes("'");
        if (hasDouble && !hasSingle)
          qs = singleQuotedString;
        else if (hasSingle && !hasDouble)
          qs = doubleQuotedString;
        else
          qs = singleQuote ? singleQuotedString : doubleQuotedString;
      }
      return qs(value, ctx);
    }
    var blockEndNewlines;
    try {
      blockEndNewlines = new RegExp("(^|(?<!\n))\n+(?!\n|$)", "g");
    } catch {
      blockEndNewlines = /\n+(?!\n|$)/g;
    }
    function blockString({ comment, type, value }, ctx, onComment, onChompKeep) {
      const { blockQuote, commentString, lineWidth } = ctx.options;
      if (!blockQuote || /\n[\t ]+$/.test(value)) {
        return quotedString(value, ctx);
      }
      const indent = ctx.indent || (ctx.forceBlockIndent || containsDocumentMarker(value) ? "  " : "");
      const literal = blockQuote === "literal" ? true : blockQuote === "folded" || type === Scalar.Scalar.BLOCK_FOLDED ? false : type === Scalar.Scalar.BLOCK_LITERAL ? true : !lineLengthOverLimit(value, lineWidth, indent.length);
      if (!value)
        return literal ? "|\n" : ">\n";
      let chomp;
      let endStart;
      for (endStart = value.length; endStart > 0; --endStart) {
        const ch = value[endStart - 1];
        if (ch !== "\n" && ch !== "	" && ch !== " ")
          break;
      }
      let end = value.substring(endStart);
      const endNlPos = end.indexOf("\n");
      if (endNlPos === -1) {
        chomp = "-";
      } else if (value === end || endNlPos !== end.length - 1) {
        chomp = "+";
        if (onChompKeep)
          onChompKeep();
      } else {
        chomp = "";
      }
      if (end) {
        value = value.slice(0, -end.length);
        if (end[end.length - 1] === "\n")
          end = end.slice(0, -1);
        end = end.replace(blockEndNewlines, `$&${indent}`);
      }
      let startWithSpace = false;
      let startEnd;
      let startNlPos = -1;
      for (startEnd = 0; startEnd < value.length; ++startEnd) {
        const ch = value[startEnd];
        if (ch === " ")
          startWithSpace = true;
        else if (ch === "\n")
          startNlPos = startEnd;
        else
          break;
      }
      let start = value.substring(0, startNlPos < startEnd ? startNlPos + 1 : startEnd);
      if (start) {
        value = value.substring(start.length);
        start = start.replace(/\n+/g, `$&${indent}`);
      }
      const indentSize = indent ? "2" : "1";
      let header = (startWithSpace ? indentSize : "") + chomp;
      if (comment) {
        header += " " + commentString(comment.replace(/ ?[\r\n]+/g, " "));
        if (onComment)
          onComment();
      }
      if (!literal) {
        const foldedValue = value.replace(/\n+/g, "\n$&").replace(/(?:^|\n)([\t ].*)(?:([\n\t ]*)\n(?![\n\t ]))?/g, "$1$2").replace(/\n+/g, `$&${indent}`);
        let literalFallback = false;
        const foldOptions = getFoldOptions(ctx, true);
        if (blockQuote !== "folded" && type !== Scalar.Scalar.BLOCK_FOLDED) {
          foldOptions.onOverflow = () => {
            literalFallback = true;
          };
        }
        const body = foldFlowLines.foldFlowLines(`${start}${foldedValue}${end}`, indent, foldFlowLines.FOLD_BLOCK, foldOptions);
        if (!literalFallback)
          return `>${header}
${indent}${body}`;
      }
      value = value.replace(/\n+/g, `$&${indent}`);
      return `|${header}
${indent}${start}${value}${end}`;
    }
    function plainString(item, ctx, onComment, onChompKeep) {
      const { type, value } = item;
      const { actualString, implicitKey, indent, indentStep, inFlow } = ctx;
      if (implicitKey && value.includes("\n") || inFlow && /[[\]{},]/.test(value)) {
        return quotedString(value, ctx);
      }
      if (/^[\n\t ,[\]{}#&*!|>'"%@`]|^[?-]$|^[?-][ \t]|[\n:][ \t]|[ \t]\n|[\n\t ]#|[\n\t :]$/.test(value)) {
        return implicitKey || inFlow || !value.includes("\n") ? quotedString(value, ctx) : blockString(item, ctx, onComment, onChompKeep);
      }
      if (!implicitKey && !inFlow && type !== Scalar.Scalar.PLAIN && value.includes("\n")) {
        return blockString(item, ctx, onComment, onChompKeep);
      }
      if (containsDocumentMarker(value)) {
        if (indent === "") {
          ctx.forceBlockIndent = true;
          return blockString(item, ctx, onComment, onChompKeep);
        } else if (implicitKey && indent === indentStep) {
          return quotedString(value, ctx);
        }
      }
      const str = value.replace(/\n+/g, `$&
${indent}`);
      if (actualString) {
        const test = (tag) => tag.default && tag.tag !== "tag:yaml.org,2002:str" && tag.test?.test(str);
        const { compat, tags } = ctx.doc.schema;
        if (tags.some(test) || compat?.some(test))
          return quotedString(value, ctx);
      }
      return implicitKey ? str : foldFlowLines.foldFlowLines(str, indent, foldFlowLines.FOLD_FLOW, getFoldOptions(ctx, false));
    }
    function stringifyString(item, ctx, onComment, onChompKeep) {
      const { implicitKey, inFlow } = ctx;
      const ss = typeof item.value === "string" ? item : Object.assign({}, item, { value: String(item.value) });
      let { type } = item;
      if (type !== Scalar.Scalar.QUOTE_DOUBLE) {
        if (/[\x00-\x08\x0b-\x1f\x7f-\x9f\u{D800}-\u{DFFF}]/u.test(ss.value))
          type = Scalar.Scalar.QUOTE_DOUBLE;
      }
      const _stringify = (_type) => {
        switch (_type) {
          case Scalar.Scalar.BLOCK_FOLDED:
          case Scalar.Scalar.BLOCK_LITERAL:
            return implicitKey || inFlow ? quotedString(ss.value, ctx) : blockString(ss, ctx, onComment, onChompKeep);
          case Scalar.Scalar.QUOTE_DOUBLE:
            return doubleQuotedString(ss.value, ctx);
          case Scalar.Scalar.QUOTE_SINGLE:
            return singleQuotedString(ss.value, ctx);
          case Scalar.Scalar.PLAIN:
            return plainString(ss, ctx, onComment, onChompKeep);
          default:
            return null;
        }
      };
      let res = _stringify(type);
      if (res === null) {
        const { defaultKeyType, defaultStringType } = ctx.options;
        const t = implicitKey && defaultKeyType || defaultStringType;
        res = _stringify(t);
        if (res === null)
          throw new Error(`Unsupported default string type ${t}`);
      }
      return res;
    }
    exports.stringifyString = stringifyString;
  }
});

// node_modules/yaml/dist/stringify/stringify.js
var require_stringify = __commonJS({
  "node_modules/yaml/dist/stringify/stringify.js"(exports) {
    "use strict";
    var anchors = require_anchors();
    var identity = require_identity();
    var stringifyComment = require_stringifyComment();
    var stringifyString = require_stringifyString();
    function createStringifyContext(doc, options) {
      const opt = Object.assign({
        blockQuote: true,
        commentString: stringifyComment.stringifyComment,
        defaultKeyType: null,
        defaultStringType: "PLAIN",
        directives: null,
        doubleQuotedAsJSON: false,
        doubleQuotedMinMultiLineLength: 40,
        falseStr: "false",
        flowCollectionPadding: true,
        indentSeq: true,
        lineWidth: 80,
        minContentWidth: 20,
        nullStr: "null",
        simpleKeys: false,
        singleQuote: null,
        trailingComma: false,
        trueStr: "true",
        verifyAliasOrder: true
      }, doc.schema.toStringOptions, options);
      let inFlow;
      switch (opt.collectionStyle) {
        case "block":
          inFlow = false;
          break;
        case "flow":
          inFlow = true;
          break;
        default:
          inFlow = null;
      }
      return {
        anchors: /* @__PURE__ */ new Set(),
        doc,
        flowCollectionPadding: opt.flowCollectionPadding ? " " : "",
        indent: "",
        indentStep: typeof opt.indent === "number" ? " ".repeat(opt.indent) : "  ",
        inFlow,
        options: opt
      };
    }
    function getTagObject(tags, item) {
      if (item.tag) {
        const match = tags.filter((t) => t.tag === item.tag);
        if (match.length > 0)
          return match.find((t) => t.format === item.format) ?? match[0];
      }
      let tagObj = void 0;
      let obj;
      if (identity.isScalar(item)) {
        obj = item.value;
        let match = tags.filter((t) => t.identify?.(obj));
        if (match.length > 1) {
          const testMatch = match.filter((t) => t.test);
          if (testMatch.length > 0)
            match = testMatch;
        }
        tagObj = match.find((t) => t.format === item.format) ?? match.find((t) => !t.format);
      } else {
        obj = item;
        tagObj = tags.find((t) => t.nodeClass && obj instanceof t.nodeClass);
      }
      if (!tagObj) {
        const name = obj?.constructor?.name ?? (obj === null ? "null" : typeof obj);
        throw new Error(`Tag not resolved for ${name} value`);
      }
      return tagObj;
    }
    function stringifyProps(node, tagObj, { anchors: anchors$1, doc }) {
      if (!doc.directives)
        return "";
      const props = [];
      const anchor = (identity.isScalar(node) || identity.isCollection(node)) && node.anchor;
      if (anchor && anchors.anchorIsValid(anchor)) {
        anchors$1.add(anchor);
        props.push(`&${anchor}`);
      }
      const tag = node.tag ?? (tagObj.default ? null : tagObj.tag);
      if (tag)
        props.push(doc.directives.tagString(tag));
      return props.join(" ");
    }
    function stringify(item, ctx, onComment, onChompKeep) {
      if (identity.isPair(item))
        return item.toString(ctx, onComment, onChompKeep);
      if (identity.isAlias(item)) {
        if (ctx.doc.directives)
          return item.toString(ctx);
        if (ctx.resolvedAliases?.has(item)) {
          throw new TypeError(`Cannot stringify circular structure without alias nodes`);
        } else {
          if (ctx.resolvedAliases)
            ctx.resolvedAliases.add(item);
          else
            ctx.resolvedAliases = /* @__PURE__ */ new Set([item]);
          item = item.resolve(ctx.doc);
        }
      }
      let tagObj = void 0;
      const node = identity.isNode(item) ? item : ctx.doc.createNode(item, { onTagObj: (o) => tagObj = o });
      tagObj ?? (tagObj = getTagObject(ctx.doc.schema.tags, node));
      const props = stringifyProps(node, tagObj, ctx);
      if (props.length > 0)
        ctx.indentAtStart = (ctx.indentAtStart ?? 0) + props.length + 1;
      const str = typeof tagObj.stringify === "function" ? tagObj.stringify(node, ctx, onComment, onChompKeep) : identity.isScalar(node) ? stringifyString.stringifyString(node, ctx, onComment, onChompKeep) : node.toString(ctx, onComment, onChompKeep);
      if (!props)
        return str;
      return identity.isScalar(node) || str[0] === "{" || str[0] === "[" ? `${props} ${str}` : `${props}
${ctx.indent}${str}`;
    }
    exports.createStringifyContext = createStringifyContext;
    exports.stringify = stringify;
  }
});

// node_modules/yaml/dist/stringify/stringifyPair.js
var require_stringifyPair = __commonJS({
  "node_modules/yaml/dist/stringify/stringifyPair.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Scalar = require_Scalar();
    var stringify = require_stringify();
    var stringifyComment = require_stringifyComment();
    function stringifyPair({ key, value }, ctx, onComment, onChompKeep) {
      const { allNullValues, doc, indent, indentStep, options: { commentString, indentSeq, simpleKeys } } = ctx;
      let keyComment = identity.isNode(key) && key.comment || null;
      if (simpleKeys) {
        if (keyComment) {
          throw new Error("With simple keys, key nodes cannot have comments");
        }
        if (identity.isCollection(key) || !identity.isNode(key) && typeof key === "object") {
          const msg = "With simple keys, collection cannot be used as a key value";
          throw new Error(msg);
        }
      }
      let explicitKey = !simpleKeys && (!key || keyComment && value == null && !ctx.inFlow || identity.isCollection(key) || (identity.isScalar(key) ? key.type === Scalar.Scalar.BLOCK_FOLDED || key.type === Scalar.Scalar.BLOCK_LITERAL : typeof key === "object"));
      ctx = Object.assign({}, ctx, {
        allNullValues: false,
        implicitKey: !explicitKey && (simpleKeys || !allNullValues),
        indent: indent + indentStep
      });
      let keyCommentDone = false;
      let chompKeep = false;
      let str = stringify.stringify(key, ctx, () => keyCommentDone = true, () => chompKeep = true);
      if (!explicitKey && !ctx.inFlow && str.length > 1024) {
        if (simpleKeys)
          throw new Error("With simple keys, single line scalar must not span more than 1024 characters");
        explicitKey = true;
      }
      if (ctx.inFlow) {
        if (allNullValues || value == null) {
          if (keyCommentDone && onComment)
            onComment();
          return str === "" ? "?" : explicitKey ? `? ${str}` : str;
        }
      } else if (allNullValues && !simpleKeys || value == null && explicitKey) {
        str = `? ${str}`;
        if (keyComment && !keyCommentDone) {
          str += stringifyComment.lineComment(str, ctx.indent, commentString(keyComment));
        } else if (chompKeep && onChompKeep)
          onChompKeep();
        return str;
      }
      if (keyCommentDone)
        keyComment = null;
      if (explicitKey) {
        if (keyComment)
          str += stringifyComment.lineComment(str, ctx.indent, commentString(keyComment));
        str = `? ${str}
${indent}:`;
      } else {
        str = `${str}:`;
        if (keyComment)
          str += stringifyComment.lineComment(str, ctx.indent, commentString(keyComment));
      }
      let vsb, vcb, valueComment;
      if (identity.isNode(value)) {
        vsb = !!value.spaceBefore;
        vcb = value.commentBefore;
        valueComment = value.comment;
      } else {
        vsb = false;
        vcb = null;
        valueComment = null;
        if (value && typeof value === "object")
          value = doc.createNode(value);
      }
      ctx.implicitKey = false;
      if (!explicitKey && !keyComment && identity.isScalar(value))
        ctx.indentAtStart = str.length + 1;
      chompKeep = false;
      if (!indentSeq && indentStep.length >= 2 && !ctx.inFlow && !explicitKey && identity.isSeq(value) && !value.flow && !value.tag && !value.anchor) {
        ctx.indent = ctx.indent.substring(2);
      }
      let valueCommentDone = false;
      const valueStr = stringify.stringify(value, ctx, () => valueCommentDone = true, () => chompKeep = true);
      let ws = " ";
      if (keyComment || vsb || vcb) {
        ws = vsb ? "\n" : "";
        if (vcb) {
          const cs = commentString(vcb);
          ws += `
${stringifyComment.indentComment(cs, ctx.indent)}`;
        }
        if (valueStr === "" && !ctx.inFlow) {
          if (ws === "\n" && valueComment)
            ws = "\n\n";
        } else {
          ws += `
${ctx.indent}`;
        }
      } else if (!explicitKey && identity.isCollection(value)) {
        const vs0 = valueStr[0];
        const nl0 = valueStr.indexOf("\n");
        const hasNewline = nl0 !== -1;
        const flow = ctx.inFlow ?? value.flow ?? value.items.length === 0;
        if (hasNewline || !flow) {
          let hasPropsLine = false;
          if (hasNewline && (vs0 === "&" || vs0 === "!")) {
            let sp0 = valueStr.indexOf(" ");
            if (vs0 === "&" && sp0 !== -1 && sp0 < nl0 && valueStr[sp0 + 1] === "!") {
              sp0 = valueStr.indexOf(" ", sp0 + 1);
            }
            if (sp0 === -1 || nl0 < sp0)
              hasPropsLine = true;
          }
          if (!hasPropsLine)
            ws = `
${ctx.indent}`;
        }
      } else if (valueStr === "" || valueStr[0] === "\n") {
        ws = "";
      }
      str += ws + valueStr;
      if (ctx.inFlow) {
        if (valueCommentDone && onComment)
          onComment();
      } else if (valueComment && !valueCommentDone) {
        str += stringifyComment.lineComment(str, ctx.indent, commentString(valueComment));
      } else if (chompKeep && onChompKeep) {
        onChompKeep();
      }
      return str;
    }
    exports.stringifyPair = stringifyPair;
  }
});

// node_modules/yaml/dist/log.js
var require_log = __commonJS({
  "node_modules/yaml/dist/log.js"(exports) {
    "use strict";
    var node_process = __require("process");
    function debug(logLevel, ...messages) {
      if (logLevel === "debug")
        console.log(...messages);
    }
    function warn(logLevel, warning) {
      if (logLevel === "debug" || logLevel === "warn") {
        if (typeof node_process.emitWarning === "function")
          node_process.emitWarning(warning);
        else
          console.warn(warning);
      }
    }
    exports.debug = debug;
    exports.warn = warn;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/merge.js
var require_merge = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/merge.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Scalar = require_Scalar();
    var MERGE_KEY = "<<";
    var merge = {
      identify: (value) => value === MERGE_KEY || typeof value === "symbol" && value.description === MERGE_KEY,
      default: "key",
      tag: "tag:yaml.org,2002:merge",
      test: /^<<$/,
      resolve: () => Object.assign(new Scalar.Scalar(Symbol(MERGE_KEY)), {
        addToJSMap: addMergeToJSMap
      }),
      stringify: () => MERGE_KEY
    };
    var isMergeKey = (ctx, key) => (merge.identify(key) || identity.isScalar(key) && (!key.type || key.type === Scalar.Scalar.PLAIN) && merge.identify(key.value)) && ctx?.doc.schema.tags.some((tag) => tag.tag === merge.tag && tag.default);
    function addMergeToJSMap(ctx, map, value) {
      const source = resolveAliasValue(ctx, value);
      if (identity.isSeq(source))
        for (const it of source.items)
          mergeValue(ctx, map, it);
      else if (Array.isArray(source))
        for (const it of source)
          mergeValue(ctx, map, it);
      else
        mergeValue(ctx, map, source);
    }
    function mergeValue(ctx, map, value) {
      const source = resolveAliasValue(ctx, value);
      if (!identity.isMap(source))
        throw new Error("Merge sources must be maps or map aliases");
      const srcMap = source.toJSON(null, ctx, Map);
      for (const [key, value2] of srcMap) {
        if (map instanceof Map) {
          if (!map.has(key))
            map.set(key, value2);
        } else if (map instanceof Set) {
          map.add(key);
        } else if (!Object.prototype.hasOwnProperty.call(map, key)) {
          Object.defineProperty(map, key, {
            value: value2,
            writable: true,
            enumerable: true,
            configurable: true
          });
        }
      }
      return map;
    }
    function resolveAliasValue(ctx, value) {
      return ctx && identity.isAlias(value) ? value.resolve(ctx.doc, ctx) : value;
    }
    exports.addMergeToJSMap = addMergeToJSMap;
    exports.isMergeKey = isMergeKey;
    exports.merge = merge;
  }
});

// node_modules/yaml/dist/nodes/addPairToJSMap.js
var require_addPairToJSMap = __commonJS({
  "node_modules/yaml/dist/nodes/addPairToJSMap.js"(exports) {
    "use strict";
    var log = require_log();
    var merge = require_merge();
    var stringify = require_stringify();
    var identity = require_identity();
    var toJS = require_toJS();
    function addPairToJSMap(ctx, map, { key, value }) {
      if (identity.isNode(key) && key.addToJSMap)
        key.addToJSMap(ctx, map, value);
      else if (merge.isMergeKey(ctx, key))
        merge.addMergeToJSMap(ctx, map, value);
      else {
        const jsKey = toJS.toJS(key, "", ctx);
        if (map instanceof Map) {
          map.set(jsKey, toJS.toJS(value, jsKey, ctx));
        } else if (map instanceof Set) {
          map.add(jsKey);
        } else {
          const stringKey = stringifyKey(key, jsKey, ctx);
          const jsValue = toJS.toJS(value, stringKey, ctx);
          if (stringKey in map)
            Object.defineProperty(map, stringKey, {
              value: jsValue,
              writable: true,
              enumerable: true,
              configurable: true
            });
          else
            map[stringKey] = jsValue;
        }
      }
      return map;
    }
    function stringifyKey(key, jsKey, ctx) {
      if (jsKey === null)
        return "";
      if (typeof jsKey !== "object")
        return String(jsKey);
      if (identity.isNode(key) && ctx?.doc) {
        const strCtx = stringify.createStringifyContext(ctx.doc, {});
        strCtx.anchors = /* @__PURE__ */ new Set();
        for (const node of ctx.anchors.keys())
          strCtx.anchors.add(node.anchor);
        strCtx.inFlow = true;
        strCtx.inStringifyKey = true;
        const strKey = key.toString(strCtx);
        if (!ctx.mapKeyWarned) {
          let jsonStr = JSON.stringify(strKey);
          if (jsonStr.length > 40)
            jsonStr = jsonStr.substring(0, 36) + '..."';
          log.warn(ctx.doc.options.logLevel, `Keys with collection values will be stringified due to JS Object restrictions: ${jsonStr}. Set mapAsMap: true to use object keys.`);
          ctx.mapKeyWarned = true;
        }
        return strKey;
      }
      return JSON.stringify(jsKey);
    }
    exports.addPairToJSMap = addPairToJSMap;
  }
});

// node_modules/yaml/dist/nodes/Pair.js
var require_Pair = __commonJS({
  "node_modules/yaml/dist/nodes/Pair.js"(exports) {
    "use strict";
    var createNode = require_createNode();
    var stringifyPair = require_stringifyPair();
    var addPairToJSMap = require_addPairToJSMap();
    var identity = require_identity();
    function createPair(key, value, ctx) {
      const k = createNode.createNode(key, void 0, ctx);
      const v = createNode.createNode(value, void 0, ctx);
      return new Pair(k, v);
    }
    var Pair = class _Pair {
      constructor(key, value = null) {
        Object.defineProperty(this, identity.NODE_TYPE, { value: identity.PAIR });
        this.key = key;
        this.value = value;
      }
      clone(schema) {
        let { key, value } = this;
        if (identity.isNode(key))
          key = key.clone(schema);
        if (identity.isNode(value))
          value = value.clone(schema);
        return new _Pair(key, value);
      }
      toJSON(_, ctx) {
        const pair = ctx?.mapAsMap ? /* @__PURE__ */ new Map() : {};
        return addPairToJSMap.addPairToJSMap(ctx, pair, this);
      }
      toString(ctx, onComment, onChompKeep) {
        return ctx?.doc ? stringifyPair.stringifyPair(this, ctx, onComment, onChompKeep) : JSON.stringify(this);
      }
    };
    exports.Pair = Pair;
    exports.createPair = createPair;
  }
});

// node_modules/yaml/dist/stringify/stringifyCollection.js
var require_stringifyCollection = __commonJS({
  "node_modules/yaml/dist/stringify/stringifyCollection.js"(exports) {
    "use strict";
    var identity = require_identity();
    var stringify = require_stringify();
    var stringifyComment = require_stringifyComment();
    function stringifyCollection(collection, ctx, options) {
      const flow = ctx.inFlow ?? collection.flow;
      const stringify2 = flow ? stringifyFlowCollection : stringifyBlockCollection;
      return stringify2(collection, ctx, options);
    }
    function stringifyBlockCollection({ comment, items }, ctx, { blockItemPrefix, flowChars, itemIndent, onChompKeep, onComment }) {
      const { indent, options: { commentString } } = ctx;
      const itemCtx = Object.assign({}, ctx, { indent: itemIndent, type: null });
      let chompKeep = false;
      const lines = [];
      for (let i = 0; i < items.length; ++i) {
        const item = items[i];
        let comment2 = null;
        if (identity.isNode(item)) {
          if (!chompKeep && item.spaceBefore)
            lines.push("");
          addCommentBefore(ctx, lines, item.commentBefore, chompKeep);
          if (item.comment)
            comment2 = item.comment;
        } else if (identity.isPair(item)) {
          const ik = identity.isNode(item.key) ? item.key : null;
          if (ik) {
            if (!chompKeep && ik.spaceBefore)
              lines.push("");
            addCommentBefore(ctx, lines, ik.commentBefore, chompKeep);
          }
        }
        chompKeep = false;
        let str2 = stringify.stringify(item, itemCtx, () => comment2 = null, () => chompKeep = true);
        if (comment2)
          str2 += stringifyComment.lineComment(str2, itemIndent, commentString(comment2));
        if (chompKeep && comment2)
          chompKeep = false;
        lines.push(blockItemPrefix + str2);
      }
      let str;
      if (lines.length === 0) {
        str = flowChars.start + flowChars.end;
      } else {
        str = lines[0];
        for (let i = 1; i < lines.length; ++i) {
          const line = lines[i];
          str += line ? `
${indent}${line}` : "\n";
        }
      }
      if (comment) {
        str += "\n" + stringifyComment.indentComment(commentString(comment), indent);
        if (onComment)
          onComment();
      } else if (chompKeep && onChompKeep)
        onChompKeep();
      return str;
    }
    function stringifyFlowCollection({ items }, ctx, { flowChars, itemIndent }) {
      const { indent, indentStep, flowCollectionPadding: fcPadding, options: { commentString } } = ctx;
      itemIndent += indentStep;
      const itemCtx = Object.assign({}, ctx, {
        indent: itemIndent,
        inFlow: true,
        type: null
      });
      let reqNewline = false;
      let linesAtValue = 0;
      const lines = [];
      for (let i = 0; i < items.length; ++i) {
        const item = items[i];
        let comment = null;
        if (identity.isNode(item)) {
          if (item.spaceBefore)
            lines.push("");
          addCommentBefore(ctx, lines, item.commentBefore, false);
          if (item.comment)
            comment = item.comment;
        } else if (identity.isPair(item)) {
          const ik = identity.isNode(item.key) ? item.key : null;
          if (ik) {
            if (ik.spaceBefore)
              lines.push("");
            addCommentBefore(ctx, lines, ik.commentBefore, false);
            if (ik.comment)
              reqNewline = true;
          }
          const iv = identity.isNode(item.value) ? item.value : null;
          if (iv) {
            if (iv.comment)
              comment = iv.comment;
            if (iv.commentBefore)
              reqNewline = true;
          } else if (item.value == null && ik?.comment) {
            comment = ik.comment;
          }
        }
        if (comment)
          reqNewline = true;
        let str = stringify.stringify(item, itemCtx, () => comment = null);
        reqNewline || (reqNewline = lines.length > linesAtValue || str.includes("\n"));
        if (i < items.length - 1) {
          str += ",";
        } else if (ctx.options.trailingComma) {
          if (ctx.options.lineWidth > 0) {
            reqNewline || (reqNewline = lines.reduce((sum, line) => sum + line.length + 2, 2) + (str.length + 2) > ctx.options.lineWidth);
          }
          if (reqNewline) {
            str += ",";
          }
        }
        if (comment)
          str += stringifyComment.lineComment(str, itemIndent, commentString(comment));
        lines.push(str);
        linesAtValue = lines.length;
      }
      const { start, end } = flowChars;
      if (lines.length === 0) {
        return start + end;
      } else {
        if (!reqNewline) {
          const len = lines.reduce((sum, line) => sum + line.length + 2, 2);
          reqNewline = ctx.options.lineWidth > 0 && len > ctx.options.lineWidth;
        }
        if (reqNewline) {
          let str = start;
          for (const line of lines)
            str += line ? `
${indentStep}${indent}${line}` : "\n";
          return `${str}
${indent}${end}`;
        } else {
          return `${start}${fcPadding}${lines.join(" ")}${fcPadding}${end}`;
        }
      }
    }
    function addCommentBefore({ indent, options: { commentString } }, lines, comment, chompKeep) {
      if (comment && chompKeep)
        comment = comment.replace(/^\n+/, "");
      if (comment) {
        const ic = stringifyComment.indentComment(commentString(comment), indent);
        lines.push(ic.trimStart());
      }
    }
    exports.stringifyCollection = stringifyCollection;
  }
});

// node_modules/yaml/dist/nodes/YAMLMap.js
var require_YAMLMap = __commonJS({
  "node_modules/yaml/dist/nodes/YAMLMap.js"(exports) {
    "use strict";
    var stringifyCollection = require_stringifyCollection();
    var addPairToJSMap = require_addPairToJSMap();
    var Collection = require_Collection();
    var identity = require_identity();
    var Pair = require_Pair();
    var Scalar = require_Scalar();
    function findPair(items, key) {
      const k = identity.isScalar(key) ? key.value : key;
      for (const it of items) {
        if (identity.isPair(it)) {
          if (it.key === key || it.key === k)
            return it;
          if (identity.isScalar(it.key) && it.key.value === k)
            return it;
        }
      }
      return void 0;
    }
    var YAMLMap = class extends Collection.Collection {
      static get tagName() {
        return "tag:yaml.org,2002:map";
      }
      constructor(schema) {
        super(identity.MAP, schema);
        this.items = [];
      }
      /**
       * A generic collection parsing method that can be extended
       * to other node classes that inherit from YAMLMap
       */
      static from(schema, obj, ctx) {
        const { keepUndefined, replacer } = ctx;
        const map = new this(schema);
        const add = (key, value) => {
          if (typeof replacer === "function")
            value = replacer.call(obj, key, value);
          else if (Array.isArray(replacer) && !replacer.includes(key))
            return;
          if (value !== void 0 || keepUndefined)
            map.items.push(Pair.createPair(key, value, ctx));
        };
        if (obj instanceof Map) {
          for (const [key, value] of obj)
            add(key, value);
        } else if (obj && typeof obj === "object") {
          for (const key of Object.keys(obj))
            add(key, obj[key]);
        }
        if (typeof schema.sortMapEntries === "function") {
          map.items.sort(schema.sortMapEntries);
        }
        return map;
      }
      /**
       * Adds a value to the collection.
       *
       * @param overwrite - If not set `true`, using a key that is already in the
       *   collection will throw. Otherwise, overwrites the previous value.
       */
      add(pair, overwrite) {
        let _pair;
        if (identity.isPair(pair))
          _pair = pair;
        else if (!pair || typeof pair !== "object" || !("key" in pair)) {
          _pair = new Pair.Pair(pair, pair?.value);
        } else
          _pair = new Pair.Pair(pair.key, pair.value);
        const prev = findPair(this.items, _pair.key);
        const sortEntries = this.schema?.sortMapEntries;
        if (prev) {
          if (!overwrite)
            throw new Error(`Key ${_pair.key} already set`);
          if (identity.isScalar(prev.value) && Scalar.isScalarValue(_pair.value))
            prev.value.value = _pair.value;
          else
            prev.value = _pair.value;
        } else if (sortEntries) {
          const i = this.items.findIndex((item) => sortEntries(_pair, item) < 0);
          if (i === -1)
            this.items.push(_pair);
          else
            this.items.splice(i, 0, _pair);
        } else {
          this.items.push(_pair);
        }
      }
      delete(key) {
        const it = findPair(this.items, key);
        if (!it)
          return false;
        const del = this.items.splice(this.items.indexOf(it), 1);
        return del.length > 0;
      }
      get(key, keepScalar) {
        const it = findPair(this.items, key);
        const node = it?.value;
        return (!keepScalar && identity.isScalar(node) ? node.value : node) ?? void 0;
      }
      has(key) {
        return !!findPair(this.items, key);
      }
      set(key, value) {
        this.add(new Pair.Pair(key, value), true);
      }
      /**
       * @param ctx - Conversion context, originally set in Document#toJS()
       * @param {Class} Type - If set, forces the returned collection type
       * @returns Instance of Type, Map, or Object
       */
      toJSON(_, ctx, Type) {
        const map = Type ? new Type() : ctx?.mapAsMap ? /* @__PURE__ */ new Map() : {};
        if (ctx?.onCreate)
          ctx.onCreate(map);
        for (const item of this.items)
          addPairToJSMap.addPairToJSMap(ctx, map, item);
        return map;
      }
      toString(ctx, onComment, onChompKeep) {
        if (!ctx)
          return JSON.stringify(this);
        for (const item of this.items) {
          if (!identity.isPair(item))
            throw new Error(`Map items must all be pairs; found ${JSON.stringify(item)} instead`);
        }
        if (!ctx.allNullValues && this.hasAllNullValues(false))
          ctx = Object.assign({}, ctx, { allNullValues: true });
        return stringifyCollection.stringifyCollection(this, ctx, {
          blockItemPrefix: "",
          flowChars: { start: "{", end: "}" },
          itemIndent: ctx.indent || "",
          onChompKeep,
          onComment
        });
      }
    };
    exports.YAMLMap = YAMLMap;
    exports.findPair = findPair;
  }
});

// node_modules/yaml/dist/schema/common/map.js
var require_map = __commonJS({
  "node_modules/yaml/dist/schema/common/map.js"(exports) {
    "use strict";
    var identity = require_identity();
    var YAMLMap = require_YAMLMap();
    var map = {
      collection: "map",
      default: true,
      nodeClass: YAMLMap.YAMLMap,
      tag: "tag:yaml.org,2002:map",
      resolve(map2, onError) {
        if (!identity.isMap(map2))
          onError("Expected a mapping for this tag");
        return map2;
      },
      createNode: (schema, obj, ctx) => YAMLMap.YAMLMap.from(schema, obj, ctx)
    };
    exports.map = map;
  }
});

// node_modules/yaml/dist/nodes/YAMLSeq.js
var require_YAMLSeq = __commonJS({
  "node_modules/yaml/dist/nodes/YAMLSeq.js"(exports) {
    "use strict";
    var createNode = require_createNode();
    var stringifyCollection = require_stringifyCollection();
    var Collection = require_Collection();
    var identity = require_identity();
    var Scalar = require_Scalar();
    var toJS = require_toJS();
    var YAMLSeq = class extends Collection.Collection {
      static get tagName() {
        return "tag:yaml.org,2002:seq";
      }
      constructor(schema) {
        super(identity.SEQ, schema);
        this.items = [];
      }
      add(value) {
        this.items.push(value);
      }
      /**
       * Removes a value from the collection.
       *
       * `key` must contain a representation of an integer for this to succeed.
       * It may be wrapped in a `Scalar`.
       *
       * @returns `true` if the item was found and removed.
       */
      delete(key) {
        const idx = asItemIndex(key);
        if (typeof idx !== "number")
          return false;
        const del = this.items.splice(idx, 1);
        return del.length > 0;
      }
      get(key, keepScalar) {
        const idx = asItemIndex(key);
        if (typeof idx !== "number")
          return void 0;
        const it = this.items[idx];
        return !keepScalar && identity.isScalar(it) ? it.value : it;
      }
      /**
       * Checks if the collection includes a value with the key `key`.
       *
       * `key` must contain a representation of an integer for this to succeed.
       * It may be wrapped in a `Scalar`.
       */
      has(key) {
        const idx = asItemIndex(key);
        return typeof idx === "number" && idx < this.items.length;
      }
      /**
       * Sets a value in this collection. For `!!set`, `value` needs to be a
       * boolean to add/remove the item from the set.
       *
       * If `key` does not contain a representation of an integer, this will throw.
       * It may be wrapped in a `Scalar`.
       */
      set(key, value) {
        const idx = asItemIndex(key);
        if (typeof idx !== "number")
          throw new Error(`Expected a valid index, not ${key}.`);
        const prev = this.items[idx];
        if (identity.isScalar(prev) && Scalar.isScalarValue(value))
          prev.value = value;
        else
          this.items[idx] = value;
      }
      toJSON(_, ctx) {
        const seq = [];
        if (ctx?.onCreate)
          ctx.onCreate(seq);
        let i = 0;
        for (const item of this.items)
          seq.push(toJS.toJS(item, String(i++), ctx));
        return seq;
      }
      toString(ctx, onComment, onChompKeep) {
        if (!ctx)
          return JSON.stringify(this);
        return stringifyCollection.stringifyCollection(this, ctx, {
          blockItemPrefix: "- ",
          flowChars: { start: "[", end: "]" },
          itemIndent: (ctx.indent || "") + "  ",
          onChompKeep,
          onComment
        });
      }
      static from(schema, obj, ctx) {
        const { replacer } = ctx;
        const seq = new this(schema);
        if (obj && Symbol.iterator in Object(obj)) {
          let i = 0;
          for (let it of obj) {
            if (typeof replacer === "function") {
              const key = obj instanceof Set ? it : String(i++);
              it = replacer.call(obj, key, it);
            }
            seq.items.push(createNode.createNode(it, void 0, ctx));
          }
        }
        return seq;
      }
    };
    function asItemIndex(key) {
      let idx = identity.isScalar(key) ? key.value : key;
      if (idx && typeof idx === "string")
        idx = Number(idx);
      return typeof idx === "number" && Number.isInteger(idx) && idx >= 0 ? idx : null;
    }
    exports.YAMLSeq = YAMLSeq;
  }
});

// node_modules/yaml/dist/schema/common/seq.js
var require_seq = __commonJS({
  "node_modules/yaml/dist/schema/common/seq.js"(exports) {
    "use strict";
    var identity = require_identity();
    var YAMLSeq = require_YAMLSeq();
    var seq = {
      collection: "seq",
      default: true,
      nodeClass: YAMLSeq.YAMLSeq,
      tag: "tag:yaml.org,2002:seq",
      resolve(seq2, onError) {
        if (!identity.isSeq(seq2))
          onError("Expected a sequence for this tag");
        return seq2;
      },
      createNode: (schema, obj, ctx) => YAMLSeq.YAMLSeq.from(schema, obj, ctx)
    };
    exports.seq = seq;
  }
});

// node_modules/yaml/dist/schema/common/string.js
var require_string = __commonJS({
  "node_modules/yaml/dist/schema/common/string.js"(exports) {
    "use strict";
    var stringifyString = require_stringifyString();
    var string = {
      identify: (value) => typeof value === "string",
      default: true,
      tag: "tag:yaml.org,2002:str",
      resolve: (str) => str,
      stringify(item, ctx, onComment, onChompKeep) {
        ctx = Object.assign({ actualString: true }, ctx);
        return stringifyString.stringifyString(item, ctx, onComment, onChompKeep);
      }
    };
    exports.string = string;
  }
});

// node_modules/yaml/dist/schema/common/null.js
var require_null = __commonJS({
  "node_modules/yaml/dist/schema/common/null.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    var nullTag = {
      identify: (value) => value == null,
      createNode: () => new Scalar.Scalar(null),
      default: true,
      tag: "tag:yaml.org,2002:null",
      test: /^(?:~|[Nn]ull|NULL)?$/,
      resolve: () => new Scalar.Scalar(null),
      stringify: ({ source }, ctx) => typeof source === "string" && nullTag.test.test(source) ? source : ctx.options.nullStr
    };
    exports.nullTag = nullTag;
  }
});

// node_modules/yaml/dist/schema/core/bool.js
var require_bool = __commonJS({
  "node_modules/yaml/dist/schema/core/bool.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    var boolTag = {
      identify: (value) => typeof value === "boolean",
      default: true,
      tag: "tag:yaml.org,2002:bool",
      test: /^(?:[Tt]rue|TRUE|[Ff]alse|FALSE)$/,
      resolve: (str) => new Scalar.Scalar(str[0] === "t" || str[0] === "T"),
      stringify({ source, value }, ctx) {
        if (source && boolTag.test.test(source)) {
          const sv = source[0] === "t" || source[0] === "T";
          if (value === sv)
            return source;
        }
        return value ? ctx.options.trueStr : ctx.options.falseStr;
      }
    };
    exports.boolTag = boolTag;
  }
});

// node_modules/yaml/dist/stringify/stringifyNumber.js
var require_stringifyNumber = __commonJS({
  "node_modules/yaml/dist/stringify/stringifyNumber.js"(exports) {
    "use strict";
    function stringifyNumber({ format, minFractionDigits, tag, value }) {
      if (typeof value === "bigint")
        return String(value);
      const num = typeof value === "number" ? value : Number(value);
      if (!isFinite(num))
        return isNaN(num) ? ".nan" : num < 0 ? "-.inf" : ".inf";
      let n = Object.is(value, -0) ? "-0" : JSON.stringify(value);
      if (!format && minFractionDigits && (!tag || tag === "tag:yaml.org,2002:float") && /^-?\d/.test(n) && !n.includes("e")) {
        let i = n.indexOf(".");
        if (i < 0) {
          i = n.length;
          n += ".";
        }
        let d = minFractionDigits - (n.length - i - 1);
        while (d-- > 0)
          n += "0";
      }
      return n;
    }
    exports.stringifyNumber = stringifyNumber;
  }
});

// node_modules/yaml/dist/schema/core/float.js
var require_float = __commonJS({
  "node_modules/yaml/dist/schema/core/float.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    var stringifyNumber = require_stringifyNumber();
    var floatNaN = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      test: /^(?:[-+]?\.(?:inf|Inf|INF)|\.nan|\.NaN|\.NAN)$/,
      resolve: (str) => str.slice(-3).toLowerCase() === "nan" ? NaN : str[0] === "-" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
      stringify: stringifyNumber.stringifyNumber
    };
    var floatExp = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      format: "EXP",
      test: /^[-+]?(?:\.[0-9]+|[0-9]+(?:\.[0-9]*)?)[eE][-+]?[0-9]+$/,
      resolve: (str) => parseFloat(str),
      stringify(node) {
        const num = Number(node.value);
        return isFinite(num) ? num.toExponential() : stringifyNumber.stringifyNumber(node);
      }
    };
    var float = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      test: /^[-+]?(?:\.[0-9]+|[0-9]+\.[0-9]*)$/,
      resolve(str) {
        const node = new Scalar.Scalar(parseFloat(str));
        const dot = str.indexOf(".");
        if (dot !== -1 && str[str.length - 1] === "0")
          node.minFractionDigits = str.length - dot - 1;
        return node;
      },
      stringify: stringifyNumber.stringifyNumber
    };
    exports.float = float;
    exports.floatExp = floatExp;
    exports.floatNaN = floatNaN;
  }
});

// node_modules/yaml/dist/schema/core/int.js
var require_int = __commonJS({
  "node_modules/yaml/dist/schema/core/int.js"(exports) {
    "use strict";
    var stringifyNumber = require_stringifyNumber();
    var intIdentify = (value) => typeof value === "bigint" || Number.isInteger(value);
    var intResolve = (str, offset, radix, { intAsBigInt }) => intAsBigInt ? BigInt(str) : parseInt(str.substring(offset), radix);
    function intStringify(node, radix, prefix) {
      const { value } = node;
      if (intIdentify(value) && value >= 0)
        return prefix + value.toString(radix);
      return stringifyNumber.stringifyNumber(node);
    }
    var intOct = {
      identify: (value) => intIdentify(value) && value >= 0,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "OCT",
      test: /^0o[0-7]+$/,
      resolve: (str, _onError, opt) => intResolve(str, 2, 8, opt),
      stringify: (node) => intStringify(node, 8, "0o")
    };
    var int = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      test: /^[-+]?[0-9]+$/,
      resolve: (str, _onError, opt) => intResolve(str, 0, 10, opt),
      stringify: stringifyNumber.stringifyNumber
    };
    var intHex = {
      identify: (value) => intIdentify(value) && value >= 0,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "HEX",
      test: /^0x[0-9a-fA-F]+$/,
      resolve: (str, _onError, opt) => intResolve(str, 2, 16, opt),
      stringify: (node) => intStringify(node, 16, "0x")
    };
    exports.int = int;
    exports.intHex = intHex;
    exports.intOct = intOct;
  }
});

// node_modules/yaml/dist/schema/core/schema.js
var require_schema = __commonJS({
  "node_modules/yaml/dist/schema/core/schema.js"(exports) {
    "use strict";
    var map = require_map();
    var _null = require_null();
    var seq = require_seq();
    var string = require_string();
    var bool = require_bool();
    var float = require_float();
    var int = require_int();
    var schema = [
      map.map,
      seq.seq,
      string.string,
      _null.nullTag,
      bool.boolTag,
      int.intOct,
      int.int,
      int.intHex,
      float.floatNaN,
      float.floatExp,
      float.float
    ];
    exports.schema = schema;
  }
});

// node_modules/yaml/dist/schema/json/schema.js
var require_schema2 = __commonJS({
  "node_modules/yaml/dist/schema/json/schema.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    var map = require_map();
    var seq = require_seq();
    function intIdentify(value) {
      return typeof value === "bigint" || Number.isInteger(value);
    }
    var stringifyJSON = ({ value }) => JSON.stringify(value);
    var jsonScalars = [
      {
        identify: (value) => typeof value === "string",
        default: true,
        tag: "tag:yaml.org,2002:str",
        resolve: (str) => str,
        stringify: stringifyJSON
      },
      {
        identify: (value) => value == null,
        createNode: () => new Scalar.Scalar(null),
        default: true,
        tag: "tag:yaml.org,2002:null",
        test: /^null$/,
        resolve: () => null,
        stringify: stringifyJSON
      },
      {
        identify: (value) => typeof value === "boolean",
        default: true,
        tag: "tag:yaml.org,2002:bool",
        test: /^true$|^false$/,
        resolve: (str) => str === "true",
        stringify: stringifyJSON
      },
      {
        identify: intIdentify,
        default: true,
        tag: "tag:yaml.org,2002:int",
        test: /^-?(?:0|[1-9][0-9]*)$/,
        resolve: (str, _onError, { intAsBigInt }) => intAsBigInt ? BigInt(str) : parseInt(str, 10),
        stringify: ({ value }) => intIdentify(value) ? value.toString() : JSON.stringify(value)
      },
      {
        identify: (value) => typeof value === "number",
        default: true,
        tag: "tag:yaml.org,2002:float",
        test: /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]*)?(?:[eE][-+]?[0-9]+)?$/,
        resolve: (str) => parseFloat(str),
        stringify: stringifyJSON
      }
    ];
    var jsonError = {
      default: true,
      tag: "",
      test: /^/,
      resolve(str, onError) {
        onError(`Unresolved plain scalar ${JSON.stringify(str)}`);
        return str;
      }
    };
    var schema = [map.map, seq.seq].concat(jsonScalars, jsonError);
    exports.schema = schema;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/binary.js
var require_binary = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/binary.js"(exports) {
    "use strict";
    var node_buffer = __require("buffer");
    var Scalar = require_Scalar();
    var stringifyString = require_stringifyString();
    var binary = {
      identify: (value) => value instanceof Uint8Array,
      // Buffer inherits from Uint8Array
      default: false,
      tag: "tag:yaml.org,2002:binary",
      /**
       * Returns a Buffer in node and an Uint8Array in browsers
       *
       * To use the resulting buffer as an image, you'll want to do something like:
       *
       *   const blob = new Blob([buffer], { type: 'image/jpeg' })
       *   document.querySelector('#photo').src = URL.createObjectURL(blob)
       */
      resolve(src, onError) {
        if (typeof node_buffer.Buffer === "function") {
          return node_buffer.Buffer.from(src, "base64");
        } else if (typeof atob === "function") {
          const str = atob(src.replace(/[\n\r]/g, ""));
          const buffer = new Uint8Array(str.length);
          for (let i = 0; i < str.length; ++i)
            buffer[i] = str.charCodeAt(i);
          return buffer;
        } else {
          onError("This environment does not support reading binary tags; either Buffer or atob is required");
          return src;
        }
      },
      stringify({ comment, type, value }, ctx, onComment, onChompKeep) {
        if (!value)
          return "";
        const buf = value;
        let str;
        if (typeof node_buffer.Buffer === "function") {
          str = buf instanceof node_buffer.Buffer ? buf.toString("base64") : node_buffer.Buffer.from(buf.buffer).toString("base64");
        } else if (typeof btoa === "function") {
          let s = "";
          for (let i = 0; i < buf.length; ++i)
            s += String.fromCharCode(buf[i]);
          str = btoa(s);
        } else {
          throw new Error("This environment does not support writing binary tags; either Buffer or btoa is required");
        }
        type ?? (type = Scalar.Scalar.BLOCK_LITERAL);
        if (type !== Scalar.Scalar.QUOTE_DOUBLE) {
          const lineWidth = Math.max(ctx.options.lineWidth - ctx.indent.length, ctx.options.minContentWidth);
          const n = Math.ceil(str.length / lineWidth);
          const lines = new Array(n);
          for (let i = 0, o = 0; i < n; ++i, o += lineWidth) {
            lines[i] = str.substr(o, lineWidth);
          }
          str = lines.join(type === Scalar.Scalar.BLOCK_LITERAL ? "\n" : " ");
        }
        return stringifyString.stringifyString({ comment, type, value: str }, ctx, onComment, onChompKeep);
      }
    };
    exports.binary = binary;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/pairs.js
var require_pairs = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/pairs.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Pair = require_Pair();
    var Scalar = require_Scalar();
    var YAMLSeq = require_YAMLSeq();
    function resolvePairs(seq, onError) {
      if (identity.isSeq(seq)) {
        for (let i = 0; i < seq.items.length; ++i) {
          let item = seq.items[i];
          if (identity.isPair(item))
            continue;
          else if (identity.isMap(item)) {
            if (item.items.length > 1)
              onError("Each pair must have its own sequence indicator");
            const pair = item.items[0] || new Pair.Pair(new Scalar.Scalar(null));
            if (item.commentBefore)
              pair.key.commentBefore = pair.key.commentBefore ? `${item.commentBefore}
${pair.key.commentBefore}` : item.commentBefore;
            if (item.comment) {
              const cn = pair.value ?? pair.key;
              cn.comment = cn.comment ? `${item.comment}
${cn.comment}` : item.comment;
            }
            item = pair;
          }
          seq.items[i] = identity.isPair(item) ? item : new Pair.Pair(item);
        }
      } else
        onError("Expected a sequence for this tag");
      return seq;
    }
    function createPairs(schema, iterable, ctx) {
      const { replacer } = ctx;
      const pairs2 = new YAMLSeq.YAMLSeq(schema);
      pairs2.tag = "tag:yaml.org,2002:pairs";
      let i = 0;
      if (iterable && Symbol.iterator in Object(iterable))
        for (let it of iterable) {
          if (typeof replacer === "function")
            it = replacer.call(iterable, String(i++), it);
          let key, value;
          if (Array.isArray(it)) {
            if (it.length === 2) {
              key = it[0];
              value = it[1];
            } else
              throw new TypeError(`Expected [key, value] tuple: ${it}`);
          } else if (it && it instanceof Object) {
            const keys = Object.keys(it);
            if (keys.length === 1) {
              key = keys[0];
              value = it[key];
            } else {
              throw new TypeError(`Expected tuple with one key, not ${keys.length} keys`);
            }
          } else {
            key = it;
          }
          pairs2.items.push(Pair.createPair(key, value, ctx));
        }
      return pairs2;
    }
    var pairs = {
      collection: "seq",
      default: false,
      tag: "tag:yaml.org,2002:pairs",
      resolve: resolvePairs,
      createNode: createPairs
    };
    exports.createPairs = createPairs;
    exports.pairs = pairs;
    exports.resolvePairs = resolvePairs;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/omap.js
var require_omap = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/omap.js"(exports) {
    "use strict";
    var identity = require_identity();
    var toJS = require_toJS();
    var YAMLMap = require_YAMLMap();
    var YAMLSeq = require_YAMLSeq();
    var pairs = require_pairs();
    var YAMLOMap = class _YAMLOMap extends YAMLSeq.YAMLSeq {
      constructor() {
        super();
        this.add = YAMLMap.YAMLMap.prototype.add.bind(this);
        this.delete = YAMLMap.YAMLMap.prototype.delete.bind(this);
        this.get = YAMLMap.YAMLMap.prototype.get.bind(this);
        this.has = YAMLMap.YAMLMap.prototype.has.bind(this);
        this.set = YAMLMap.YAMLMap.prototype.set.bind(this);
        this.tag = _YAMLOMap.tag;
      }
      /**
       * If `ctx` is given, the return type is actually `Map<unknown, unknown>`,
       * but TypeScript won't allow widening the signature of a child method.
       */
      toJSON(_, ctx) {
        if (!ctx)
          return super.toJSON(_);
        const map = /* @__PURE__ */ new Map();
        if (ctx?.onCreate)
          ctx.onCreate(map);
        for (const pair of this.items) {
          let key, value;
          if (identity.isPair(pair)) {
            key = toJS.toJS(pair.key, "", ctx);
            value = toJS.toJS(pair.value, key, ctx);
          } else {
            key = toJS.toJS(pair, "", ctx);
          }
          if (map.has(key))
            throw new Error("Ordered maps must not include duplicate keys");
          map.set(key, value);
        }
        return map;
      }
      static from(schema, iterable, ctx) {
        const pairs$1 = pairs.createPairs(schema, iterable, ctx);
        const omap2 = new this();
        omap2.items = pairs$1.items;
        return omap2;
      }
    };
    YAMLOMap.tag = "tag:yaml.org,2002:omap";
    var omap = {
      collection: "seq",
      identify: (value) => value instanceof Map,
      nodeClass: YAMLOMap,
      default: false,
      tag: "tag:yaml.org,2002:omap",
      resolve(seq, onError) {
        const pairs$1 = pairs.resolvePairs(seq, onError);
        const seenKeys = [];
        for (const { key } of pairs$1.items) {
          if (identity.isScalar(key)) {
            if (seenKeys.includes(key.value)) {
              onError(`Ordered maps must not include duplicate keys: ${key.value}`);
            } else {
              seenKeys.push(key.value);
            }
          }
        }
        return Object.assign(new YAMLOMap(), pairs$1);
      },
      createNode: (schema, iterable, ctx) => YAMLOMap.from(schema, iterable, ctx)
    };
    exports.YAMLOMap = YAMLOMap;
    exports.omap = omap;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/bool.js
var require_bool2 = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/bool.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    function boolStringify({ value, source }, ctx) {
      const boolObj = value ? trueTag : falseTag;
      if (source && boolObj.test.test(source))
        return source;
      return value ? ctx.options.trueStr : ctx.options.falseStr;
    }
    var trueTag = {
      identify: (value) => value === true,
      default: true,
      tag: "tag:yaml.org,2002:bool",
      test: /^(?:Y|y|[Yy]es|YES|[Tt]rue|TRUE|[Oo]n|ON)$/,
      resolve: () => new Scalar.Scalar(true),
      stringify: boolStringify
    };
    var falseTag = {
      identify: (value) => value === false,
      default: true,
      tag: "tag:yaml.org,2002:bool",
      test: /^(?:N|n|[Nn]o|NO|[Ff]alse|FALSE|[Oo]ff|OFF)$/,
      resolve: () => new Scalar.Scalar(false),
      stringify: boolStringify
    };
    exports.falseTag = falseTag;
    exports.trueTag = trueTag;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/float.js
var require_float2 = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/float.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    var stringifyNumber = require_stringifyNumber();
    var floatNaN = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      test: /^(?:[-+]?\.(?:inf|Inf|INF)|\.nan|\.NaN|\.NAN)$/,
      resolve: (str) => str.slice(-3).toLowerCase() === "nan" ? NaN : str[0] === "-" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
      stringify: stringifyNumber.stringifyNumber
    };
    var floatExp = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      format: "EXP",
      test: /^[-+]?(?:[0-9][0-9_]*)?(?:\.[0-9_]*)?[eE][-+]?[0-9]+$/,
      resolve: (str) => parseFloat(str.replace(/_/g, "")),
      stringify(node) {
        const num = Number(node.value);
        return isFinite(num) ? num.toExponential() : stringifyNumber.stringifyNumber(node);
      }
    };
    var float = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      test: /^[-+]?(?:[0-9][0-9_]*)?\.[0-9_]*$/,
      resolve(str) {
        const node = new Scalar.Scalar(parseFloat(str.replace(/_/g, "")));
        const dot = str.indexOf(".");
        if (dot !== -1) {
          const f = str.substring(dot + 1).replace(/_/g, "");
          if (f[f.length - 1] === "0")
            node.minFractionDigits = f.length;
        }
        return node;
      },
      stringify: stringifyNumber.stringifyNumber
    };
    exports.float = float;
    exports.floatExp = floatExp;
    exports.floatNaN = floatNaN;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/int.js
var require_int2 = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/int.js"(exports) {
    "use strict";
    var stringifyNumber = require_stringifyNumber();
    var intIdentify = (value) => typeof value === "bigint" || Number.isInteger(value);
    function intResolve(str, offset, radix, { intAsBigInt }) {
      const sign = str[0];
      if (sign === "-" || sign === "+")
        offset += 1;
      str = str.substring(offset).replace(/_/g, "");
      if (intAsBigInt) {
        switch (radix) {
          case 2:
            str = `0b${str}`;
            break;
          case 8:
            str = `0o${str}`;
            break;
          case 16:
            str = `0x${str}`;
            break;
        }
        const n2 = BigInt(str);
        return sign === "-" ? BigInt(-1) * n2 : n2;
      }
      const n = parseInt(str, radix);
      return sign === "-" ? -1 * n : n;
    }
    function intStringify(node, radix, prefix) {
      const { value } = node;
      if (intIdentify(value)) {
        const str = value.toString(radix);
        return value < 0 ? "-" + prefix + str.substr(1) : prefix + str;
      }
      return stringifyNumber.stringifyNumber(node);
    }
    var intBin = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "BIN",
      test: /^[-+]?0b[0-1_]+$/,
      resolve: (str, _onError, opt) => intResolve(str, 2, 2, opt),
      stringify: (node) => intStringify(node, 2, "0b")
    };
    var intOct = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "OCT",
      test: /^[-+]?0[0-7_]+$/,
      resolve: (str, _onError, opt) => intResolve(str, 1, 8, opt),
      stringify: (node) => intStringify(node, 8, "0")
    };
    var int = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      test: /^[-+]?[0-9][0-9_]*$/,
      resolve: (str, _onError, opt) => intResolve(str, 0, 10, opt),
      stringify: stringifyNumber.stringifyNumber
    };
    var intHex = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "HEX",
      test: /^[-+]?0x[0-9a-fA-F_]+$/,
      resolve: (str, _onError, opt) => intResolve(str, 2, 16, opt),
      stringify: (node) => intStringify(node, 16, "0x")
    };
    exports.int = int;
    exports.intBin = intBin;
    exports.intHex = intHex;
    exports.intOct = intOct;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/set.js
var require_set = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/set.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Pair = require_Pair();
    var YAMLMap = require_YAMLMap();
    var YAMLSet = class _YAMLSet extends YAMLMap.YAMLMap {
      constructor(schema) {
        super(schema);
        this.tag = _YAMLSet.tag;
      }
      add(key) {
        let pair;
        if (identity.isPair(key))
          pair = key;
        else if (key && typeof key === "object" && "key" in key && "value" in key && key.value === null)
          pair = new Pair.Pair(key.key, null);
        else
          pair = new Pair.Pair(key, null);
        const prev = YAMLMap.findPair(this.items, pair.key);
        if (!prev)
          this.items.push(pair);
      }
      /**
       * If `keepPair` is `true`, returns the Pair matching `key`.
       * Otherwise, returns the value of that Pair's key.
       */
      get(key, keepPair) {
        const pair = YAMLMap.findPair(this.items, key);
        return !keepPair && identity.isPair(pair) ? identity.isScalar(pair.key) ? pair.key.value : pair.key : pair;
      }
      set(key, value) {
        if (typeof value !== "boolean")
          throw new Error(`Expected boolean value for set(key, value) in a YAML set, not ${typeof value}`);
        const prev = YAMLMap.findPair(this.items, key);
        if (prev && !value) {
          this.items.splice(this.items.indexOf(prev), 1);
        } else if (!prev && value) {
          this.items.push(new Pair.Pair(key));
        }
      }
      toJSON(_, ctx) {
        return super.toJSON(_, ctx, Set);
      }
      toString(ctx, onComment, onChompKeep) {
        if (!ctx)
          return JSON.stringify(this);
        if (this.hasAllNullValues(true))
          return super.toString(Object.assign({}, ctx, { allNullValues: true }), onComment, onChompKeep);
        else
          throw new Error("Set items must all have null values");
      }
      static from(schema, iterable, ctx) {
        const { replacer } = ctx;
        const set2 = new this(schema);
        if (iterable && Symbol.iterator in Object(iterable))
          for (let value of iterable) {
            if (typeof replacer === "function")
              value = replacer.call(iterable, value, value);
            set2.items.push(Pair.createPair(value, null, ctx));
          }
        return set2;
      }
    };
    YAMLSet.tag = "tag:yaml.org,2002:set";
    var set = {
      collection: "map",
      identify: (value) => value instanceof Set,
      nodeClass: YAMLSet,
      default: false,
      tag: "tag:yaml.org,2002:set",
      createNode: (schema, iterable, ctx) => YAMLSet.from(schema, iterable, ctx),
      resolve(map, onError) {
        if (identity.isMap(map)) {
          if (map.hasAllNullValues(true))
            return Object.assign(new YAMLSet(), map);
          else
            onError("Set items must all have null values");
        } else
          onError("Expected a mapping for this tag");
        return map;
      }
    };
    exports.YAMLSet = YAMLSet;
    exports.set = set;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/timestamp.js
var require_timestamp = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/timestamp.js"(exports) {
    "use strict";
    var stringifyNumber = require_stringifyNumber();
    function parseSexagesimal(str, asBigInt) {
      const sign = str[0];
      const parts = sign === "-" || sign === "+" ? str.substring(1) : str;
      const num = (n) => asBigInt ? BigInt(n) : Number(n);
      const res = parts.replace(/_/g, "").split(":").reduce((res2, p) => res2 * num(60) + num(p), num(0));
      return sign === "-" ? num(-1) * res : res;
    }
    function stringifySexagesimal(node) {
      let { value } = node;
      let num = (n) => n;
      if (typeof value === "bigint")
        num = (n) => BigInt(n);
      else if (isNaN(value) || !isFinite(value))
        return stringifyNumber.stringifyNumber(node);
      let sign = "";
      if (value < 0) {
        sign = "-";
        value *= num(-1);
      }
      const _60 = num(60);
      const parts = [value % _60];
      if (value < 60) {
        parts.unshift(0);
      } else {
        value = (value - parts[0]) / _60;
        parts.unshift(value % _60);
        if (value >= 60) {
          value = (value - parts[0]) / _60;
          parts.unshift(value);
        }
      }
      return sign + parts.map((n) => String(n).padStart(2, "0")).join(":").replace(/000000\d*$/, "");
    }
    var intTime = {
      identify: (value) => typeof value === "bigint" || Number.isInteger(value),
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "TIME",
      test: /^[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+$/,
      resolve: (str, _onError, { intAsBigInt }) => parseSexagesimal(str, intAsBigInt),
      stringify: stringifySexagesimal
    };
    var floatTime = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      format: "TIME",
      test: /^[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+\.[0-9_]*$/,
      resolve: (str) => parseSexagesimal(str, false),
      stringify: stringifySexagesimal
    };
    var timestamp = {
      identify: (value) => value instanceof Date,
      default: true,
      tag: "tag:yaml.org,2002:timestamp",
      // If the time zone is omitted, the timestamp is assumed to be specified in UTC. The time part
      // may be omitted altogether, resulting in a date format. In such a case, the time part is
      // assumed to be 00:00:00Z (start of day, UTC).
      test: RegExp("^([0-9]{4})-([0-9]{1,2})-([0-9]{1,2})(?:(?:t|T|[ \\t]+)([0-9]{1,2}):([0-9]{1,2}):([0-9]{1,2}(\\.[0-9]+)?)(?:[ \\t]*(Z|[-+][012]?[0-9](?::[0-9]{2})?))?)?$"),
      resolve(str) {
        const match = str.match(timestamp.test);
        if (!match)
          throw new Error("!!timestamp expects a date, starting with yyyy-mm-dd");
        const [, year, month, day, hour, minute, second] = match.map(Number);
        const millisec = match[7] ? Number((match[7] + "00").substr(1, 3)) : 0;
        let date = Date.UTC(year, month - 1, day, hour || 0, minute || 0, second || 0, millisec);
        const tz = match[8];
        if (tz && tz !== "Z") {
          let d = parseSexagesimal(tz, false);
          if (Math.abs(d) < 30)
            d *= 60;
          date -= 6e4 * d;
        }
        return new Date(date);
      },
      stringify: ({ value }) => value?.toISOString().replace(/(T00:00:00)?\.000Z$/, "") ?? ""
    };
    exports.floatTime = floatTime;
    exports.intTime = intTime;
    exports.timestamp = timestamp;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/schema.js
var require_schema3 = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/schema.js"(exports) {
    "use strict";
    var map = require_map();
    var _null = require_null();
    var seq = require_seq();
    var string = require_string();
    var binary = require_binary();
    var bool = require_bool2();
    var float = require_float2();
    var int = require_int2();
    var merge = require_merge();
    var omap = require_omap();
    var pairs = require_pairs();
    var set = require_set();
    var timestamp = require_timestamp();
    var schema = [
      map.map,
      seq.seq,
      string.string,
      _null.nullTag,
      bool.trueTag,
      bool.falseTag,
      int.intBin,
      int.intOct,
      int.int,
      int.intHex,
      float.floatNaN,
      float.floatExp,
      float.float,
      binary.binary,
      merge.merge,
      omap.omap,
      pairs.pairs,
      set.set,
      timestamp.intTime,
      timestamp.floatTime,
      timestamp.timestamp
    ];
    exports.schema = schema;
  }
});

// node_modules/yaml/dist/schema/tags.js
var require_tags = __commonJS({
  "node_modules/yaml/dist/schema/tags.js"(exports) {
    "use strict";
    var map = require_map();
    var _null = require_null();
    var seq = require_seq();
    var string = require_string();
    var bool = require_bool();
    var float = require_float();
    var int = require_int();
    var schema = require_schema();
    var schema$1 = require_schema2();
    var binary = require_binary();
    var merge = require_merge();
    var omap = require_omap();
    var pairs = require_pairs();
    var schema$2 = require_schema3();
    var set = require_set();
    var timestamp = require_timestamp();
    var schemas = /* @__PURE__ */ new Map([
      ["core", schema.schema],
      ["failsafe", [map.map, seq.seq, string.string]],
      ["json", schema$1.schema],
      ["yaml11", schema$2.schema],
      ["yaml-1.1", schema$2.schema]
    ]);
    var tagsByName = {
      binary: binary.binary,
      bool: bool.boolTag,
      float: float.float,
      floatExp: float.floatExp,
      floatNaN: float.floatNaN,
      floatTime: timestamp.floatTime,
      int: int.int,
      intHex: int.intHex,
      intOct: int.intOct,
      intTime: timestamp.intTime,
      map: map.map,
      merge: merge.merge,
      null: _null.nullTag,
      omap: omap.omap,
      pairs: pairs.pairs,
      seq: seq.seq,
      set: set.set,
      timestamp: timestamp.timestamp
    };
    var coreKnownTags = {
      "tag:yaml.org,2002:binary": binary.binary,
      "tag:yaml.org,2002:merge": merge.merge,
      "tag:yaml.org,2002:omap": omap.omap,
      "tag:yaml.org,2002:pairs": pairs.pairs,
      "tag:yaml.org,2002:set": set.set,
      "tag:yaml.org,2002:timestamp": timestamp.timestamp
    };
    function getTags(customTags, schemaName, addMergeTag) {
      const schemaTags = schemas.get(schemaName);
      if (schemaTags && !customTags) {
        return addMergeTag && !schemaTags.includes(merge.merge) ? schemaTags.concat(merge.merge) : schemaTags.slice();
      }
      let tags = schemaTags;
      if (!tags) {
        if (Array.isArray(customTags))
          tags = [];
        else {
          const keys = Array.from(schemas.keys()).filter((key) => key !== "yaml11").map((key) => JSON.stringify(key)).join(", ");
          throw new Error(`Unknown schema "${schemaName}"; use one of ${keys} or define customTags array`);
        }
      }
      if (Array.isArray(customTags)) {
        for (const tag of customTags)
          tags = tags.concat(tag);
      } else if (typeof customTags === "function") {
        tags = customTags(tags.slice());
      }
      if (addMergeTag)
        tags = tags.concat(merge.merge);
      return tags.reduce((tags2, tag) => {
        const tagObj = typeof tag === "string" ? tagsByName[tag] : tag;
        if (!tagObj) {
          const tagName = JSON.stringify(tag);
          const keys = Object.keys(tagsByName).map((key) => JSON.stringify(key)).join(", ");
          throw new Error(`Unknown custom tag ${tagName}; use one of ${keys}`);
        }
        if (!tags2.includes(tagObj))
          tags2.push(tagObj);
        return tags2;
      }, []);
    }
    exports.coreKnownTags = coreKnownTags;
    exports.getTags = getTags;
  }
});

// node_modules/yaml/dist/schema/Schema.js
var require_Schema = __commonJS({
  "node_modules/yaml/dist/schema/Schema.js"(exports) {
    "use strict";
    var identity = require_identity();
    var map = require_map();
    var seq = require_seq();
    var string = require_string();
    var tags = require_tags();
    var sortMapEntriesByKey = (a, b) => a.key < b.key ? -1 : a.key > b.key ? 1 : 0;
    var Schema = class _Schema {
      constructor({ compat, customTags, merge, resolveKnownTags, schema, sortMapEntries, toStringDefaults }) {
        this.compat = Array.isArray(compat) ? tags.getTags(compat, "compat") : compat ? tags.getTags(null, compat) : null;
        this.name = typeof schema === "string" && schema || "core";
        this.knownTags = resolveKnownTags ? tags.coreKnownTags : {};
        this.tags = tags.getTags(customTags, this.name, merge);
        this.toStringOptions = toStringDefaults ?? null;
        Object.defineProperty(this, identity.MAP, { value: map.map });
        Object.defineProperty(this, identity.SCALAR, { value: string.string });
        Object.defineProperty(this, identity.SEQ, { value: seq.seq });
        this.sortMapEntries = typeof sortMapEntries === "function" ? sortMapEntries : sortMapEntries === true ? sortMapEntriesByKey : null;
      }
      clone() {
        const copy = Object.create(_Schema.prototype, Object.getOwnPropertyDescriptors(this));
        copy.tags = this.tags.slice();
        return copy;
      }
    };
    exports.Schema = Schema;
  }
});

// node_modules/yaml/dist/stringify/stringifyDocument.js
var require_stringifyDocument = __commonJS({
  "node_modules/yaml/dist/stringify/stringifyDocument.js"(exports) {
    "use strict";
    var identity = require_identity();
    var stringify = require_stringify();
    var stringifyComment = require_stringifyComment();
    function stringifyDocument(doc, options) {
      const lines = [];
      let hasDirectives = options.directives === true;
      if (options.directives !== false && doc.directives) {
        const dir = doc.directives.toString(doc);
        if (dir) {
          lines.push(dir);
          hasDirectives = true;
        } else if (doc.directives.docStart)
          hasDirectives = true;
      }
      if (hasDirectives)
        lines.push("---");
      const ctx = stringify.createStringifyContext(doc, options);
      const { commentString } = ctx.options;
      if (doc.commentBefore) {
        if (lines.length !== 1)
          lines.unshift("");
        const cs = commentString(doc.commentBefore);
        lines.unshift(stringifyComment.indentComment(cs, ""));
      }
      let chompKeep = false;
      let contentComment = null;
      if (doc.contents) {
        if (identity.isNode(doc.contents)) {
          if (doc.contents.spaceBefore && hasDirectives)
            lines.push("");
          if (doc.contents.commentBefore) {
            const cs = commentString(doc.contents.commentBefore);
            lines.push(stringifyComment.indentComment(cs, ""));
          }
          ctx.forceBlockIndent = !!doc.comment;
          contentComment = doc.contents.comment;
        }
        const onChompKeep = contentComment ? void 0 : () => chompKeep = true;
        let body = stringify.stringify(doc.contents, ctx, () => contentComment = null, onChompKeep);
        if (contentComment)
          body += stringifyComment.lineComment(body, "", commentString(contentComment));
        if ((body[0] === "|" || body[0] === ">") && lines[lines.length - 1] === "---") {
          lines[lines.length - 1] = `--- ${body}`;
        } else
          lines.push(body);
      } else {
        lines.push(stringify.stringify(doc.contents, ctx));
      }
      if (doc.directives?.docEnd) {
        if (doc.comment) {
          const cs = commentString(doc.comment);
          if (cs.includes("\n")) {
            lines.push("...");
            lines.push(stringifyComment.indentComment(cs, ""));
          } else {
            lines.push(`... ${cs}`);
          }
        } else {
          lines.push("...");
        }
      } else {
        let dc = doc.comment;
        if (dc && chompKeep)
          dc = dc.replace(/^\n+/, "");
        if (dc) {
          if ((!chompKeep || contentComment) && lines[lines.length - 1] !== "")
            lines.push("");
          lines.push(stringifyComment.indentComment(commentString(dc), ""));
        }
      }
      return lines.join("\n") + "\n";
    }
    exports.stringifyDocument = stringifyDocument;
  }
});

// node_modules/yaml/dist/doc/Document.js
var require_Document = __commonJS({
  "node_modules/yaml/dist/doc/Document.js"(exports) {
    "use strict";
    var Alias = require_Alias();
    var Collection = require_Collection();
    var identity = require_identity();
    var Pair = require_Pair();
    var toJS = require_toJS();
    var Schema = require_Schema();
    var stringifyDocument = require_stringifyDocument();
    var anchors = require_anchors();
    var applyReviver = require_applyReviver();
    var createNode = require_createNode();
    var directives = require_directives();
    var Document = class _Document {
      constructor(value, replacer, options) {
        this.commentBefore = null;
        this.comment = null;
        this.errors = [];
        this.warnings = [];
        Object.defineProperty(this, identity.NODE_TYPE, { value: identity.DOC });
        let _replacer = null;
        if (typeof replacer === "function" || Array.isArray(replacer)) {
          _replacer = replacer;
        } else if (options === void 0 && replacer) {
          options = replacer;
          replacer = void 0;
        }
        const opt = Object.assign({
          intAsBigInt: false,
          keepSourceTokens: false,
          logLevel: "warn",
          prettyErrors: true,
          strict: true,
          stringKeys: false,
          uniqueKeys: true,
          version: "1.2"
        }, options);
        this.options = opt;
        let { version } = opt;
        if (options?._directives) {
          this.directives = options._directives.atDocument();
          if (this.directives.yaml.explicit)
            version = this.directives.yaml.version;
        } else
          this.directives = new directives.Directives({ version });
        this.setSchema(version, options);
        this.contents = value === void 0 ? null : this.createNode(value, _replacer, options);
      }
      /**
       * Create a deep copy of this Document and its contents.
       *
       * Custom Node values that inherit from `Object` still refer to their original instances.
       */
      clone() {
        const copy = Object.create(_Document.prototype, {
          [identity.NODE_TYPE]: { value: identity.DOC }
        });
        copy.commentBefore = this.commentBefore;
        copy.comment = this.comment;
        copy.errors = this.errors.slice();
        copy.warnings = this.warnings.slice();
        copy.options = Object.assign({}, this.options);
        if (this.directives)
          copy.directives = this.directives.clone();
        copy.schema = this.schema.clone();
        copy.contents = identity.isNode(this.contents) ? this.contents.clone(copy.schema) : this.contents;
        if (this.range)
          copy.range = this.range.slice();
        return copy;
      }
      /** Adds a value to the document. */
      add(value) {
        if (assertCollection(this.contents))
          this.contents.add(value);
      }
      /** Adds a value to the document. */
      addIn(path2, value) {
        if (assertCollection(this.contents))
          this.contents.addIn(path2, value);
      }
      /**
       * Create a new `Alias` node, ensuring that the target `node` has the required anchor.
       *
       * If `node` already has an anchor, `name` is ignored.
       * Otherwise, the `node.anchor` value will be set to `name`,
       * or if an anchor with that name is already present in the document,
       * `name` will be used as a prefix for a new unique anchor.
       * If `name` is undefined, the generated anchor will use 'a' as a prefix.
       */
      createAlias(node, name) {
        if (!node.anchor) {
          const prev = anchors.anchorNames(this);
          node.anchor = // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
          !name || prev.has(name) ? anchors.findNewAnchor(name || "a", prev) : name;
        }
        return new Alias.Alias(node.anchor);
      }
      createNode(value, replacer, options) {
        let _replacer = void 0;
        if (typeof replacer === "function") {
          value = replacer.call({ "": value }, "", value);
          _replacer = replacer;
        } else if (Array.isArray(replacer)) {
          const keyToStr = (v) => typeof v === "number" || v instanceof String || v instanceof Number;
          const asStr = replacer.filter(keyToStr).map(String);
          if (asStr.length > 0)
            replacer = replacer.concat(asStr);
          _replacer = replacer;
        } else if (options === void 0 && replacer) {
          options = replacer;
          replacer = void 0;
        }
        const { aliasDuplicateObjects, anchorPrefix, flow, keepUndefined, onTagObj, tag } = options ?? {};
        const { onAnchor, setAnchors, sourceObjects } = anchors.createNodeAnchors(
          this,
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
          anchorPrefix || "a"
        );
        const ctx = {
          aliasDuplicateObjects: aliasDuplicateObjects ?? true,
          keepUndefined: keepUndefined ?? false,
          onAnchor,
          onTagObj,
          replacer: _replacer,
          schema: this.schema,
          sourceObjects
        };
        const node = createNode.createNode(value, tag, ctx);
        if (flow && identity.isCollection(node))
          node.flow = true;
        setAnchors();
        return node;
      }
      /**
       * Convert a key and a value into a `Pair` using the current schema,
       * recursively wrapping all values as `Scalar` or `Collection` nodes.
       */
      createPair(key, value, options = {}) {
        const k = this.createNode(key, null, options);
        const v = this.createNode(value, null, options);
        return new Pair.Pair(k, v);
      }
      /**
       * Removes a value from the document.
       * @returns `true` if the item was found and removed.
       */
      delete(key) {
        return assertCollection(this.contents) ? this.contents.delete(key) : false;
      }
      /**
       * Removes a value from the document.
       * @returns `true` if the item was found and removed.
       */
      deleteIn(path2) {
        if (Collection.isEmptyPath(path2)) {
          if (this.contents == null)
            return false;
          this.contents = null;
          return true;
        }
        return assertCollection(this.contents) ? this.contents.deleteIn(path2) : false;
      }
      /**
       * Returns item at `key`, or `undefined` if not found. By default unwraps
       * scalar values from their surrounding node; to disable set `keepScalar` to
       * `true` (collections are always returned intact).
       */
      get(key, keepScalar) {
        return identity.isCollection(this.contents) ? this.contents.get(key, keepScalar) : void 0;
      }
      /**
       * Returns item at `path`, or `undefined` if not found. By default unwraps
       * scalar values from their surrounding node; to disable set `keepScalar` to
       * `true` (collections are always returned intact).
       */
      getIn(path2, keepScalar) {
        if (Collection.isEmptyPath(path2))
          return !keepScalar && identity.isScalar(this.contents) ? this.contents.value : this.contents;
        return identity.isCollection(this.contents) ? this.contents.getIn(path2, keepScalar) : void 0;
      }
      /**
       * Checks if the document includes a value with the key `key`.
       */
      has(key) {
        return identity.isCollection(this.contents) ? this.contents.has(key) : false;
      }
      /**
       * Checks if the document includes a value at `path`.
       */
      hasIn(path2) {
        if (Collection.isEmptyPath(path2))
          return this.contents !== void 0;
        return identity.isCollection(this.contents) ? this.contents.hasIn(path2) : false;
      }
      /**
       * Sets a value in this document. For `!!set`, `value` needs to be a
       * boolean to add/remove the item from the set.
       */
      set(key, value) {
        if (this.contents == null) {
          this.contents = Collection.collectionFromPath(this.schema, [key], value);
        } else if (assertCollection(this.contents)) {
          this.contents.set(key, value);
        }
      }
      /**
       * Sets a value in this document. For `!!set`, `value` needs to be a
       * boolean to add/remove the item from the set.
       */
      setIn(path2, value) {
        if (Collection.isEmptyPath(path2)) {
          this.contents = value;
        } else if (this.contents == null) {
          this.contents = Collection.collectionFromPath(this.schema, Array.from(path2), value);
        } else if (assertCollection(this.contents)) {
          this.contents.setIn(path2, value);
        }
      }
      /**
       * Change the YAML version and schema used by the document.
       * A `null` version disables support for directives, explicit tags, anchors, and aliases.
       * It also requires the `schema` option to be given as a `Schema` instance value.
       *
       * Overrides all previously set schema options.
       */
      setSchema(version, options = {}) {
        if (typeof version === "number")
          version = String(version);
        let opt;
        switch (version) {
          case "1.1":
            if (this.directives)
              this.directives.yaml.version = "1.1";
            else
              this.directives = new directives.Directives({ version: "1.1" });
            opt = { resolveKnownTags: false, schema: "yaml-1.1" };
            break;
          case "1.2":
          case "next":
            if (this.directives)
              this.directives.yaml.version = version;
            else
              this.directives = new directives.Directives({ version });
            opt = { resolveKnownTags: true, schema: "core" };
            break;
          case null:
            if (this.directives)
              delete this.directives;
            opt = null;
            break;
          default: {
            const sv = JSON.stringify(version);
            throw new Error(`Expected '1.1', '1.2' or null as first argument, but found: ${sv}`);
          }
        }
        if (options.schema instanceof Object)
          this.schema = options.schema;
        else if (opt)
          this.schema = new Schema.Schema(Object.assign(opt, options));
        else
          throw new Error(`With a null YAML version, the { schema: Schema } option is required`);
      }
      // json & jsonArg are only used from toJSON()
      toJS({ json, jsonArg, mapAsMap, maxAliasCount, onAnchor, reviver } = {}) {
        const ctx = {
          anchors: /* @__PURE__ */ new Map(),
          doc: this,
          keep: !json,
          mapAsMap: mapAsMap === true,
          mapKeyWarned: false,
          maxAliasCount: typeof maxAliasCount === "number" ? maxAliasCount : 100
        };
        const res = toJS.toJS(this.contents, jsonArg ?? "", ctx);
        if (typeof onAnchor === "function")
          for (const { count, res: res2 } of ctx.anchors.values())
            onAnchor(res2, count);
        return typeof reviver === "function" ? applyReviver.applyReviver(reviver, { "": res }, "", res) : res;
      }
      /**
       * A JSON representation of the document `contents`.
       *
       * @param jsonArg Used by `JSON.stringify` to indicate the array index or
       *   property name.
       */
      toJSON(jsonArg, onAnchor) {
        return this.toJS({ json: true, jsonArg, mapAsMap: false, onAnchor });
      }
      /** A YAML representation of the document. */
      toString(options = {}) {
        if (this.errors.length > 0)
          throw new Error("Document with errors cannot be stringified");
        if ("indent" in options && (!Number.isInteger(options.indent) || Number(options.indent) <= 0)) {
          const s = JSON.stringify(options.indent);
          throw new Error(`"indent" option must be a positive integer, not ${s}`);
        }
        return stringifyDocument.stringifyDocument(this, options);
      }
    };
    function assertCollection(contents) {
      if (identity.isCollection(contents))
        return true;
      throw new Error("Expected a YAML collection as document contents");
    }
    exports.Document = Document;
  }
});

// node_modules/yaml/dist/errors.js
var require_errors = __commonJS({
  "node_modules/yaml/dist/errors.js"(exports) {
    "use strict";
    var YAMLError = class extends Error {
      constructor(name, pos, code, message) {
        super();
        this.name = name;
        this.code = code;
        this.message = message;
        this.pos = pos;
      }
    };
    var YAMLParseError = class extends YAMLError {
      constructor(pos, code, message) {
        super("YAMLParseError", pos, code, message);
      }
    };
    var YAMLWarning = class extends YAMLError {
      constructor(pos, code, message) {
        super("YAMLWarning", pos, code, message);
      }
    };
    var prettifyError = (src, lc) => (error) => {
      if (error.pos[0] === -1)
        return;
      error.linePos = error.pos.map((pos) => lc.linePos(pos));
      const { line, col } = error.linePos[0];
      error.message += ` at line ${line}, column ${col}`;
      let ci = col - 1;
      let lineStr = src.substring(lc.lineStarts[line - 1], lc.lineStarts[line]).replace(/[\n\r]+$/, "");
      if (ci >= 60 && lineStr.length > 80) {
        const trimStart = Math.min(ci - 39, lineStr.length - 79);
        lineStr = "\u2026" + lineStr.substring(trimStart);
        ci -= trimStart - 1;
      }
      if (lineStr.length > 80)
        lineStr = lineStr.substring(0, 79) + "\u2026";
      if (line > 1 && /^ *$/.test(lineStr.substring(0, ci))) {
        let prev = src.substring(lc.lineStarts[line - 2], lc.lineStarts[line - 1]);
        if (prev.length > 80)
          prev = prev.substring(0, 79) + "\u2026\n";
        lineStr = prev + lineStr;
      }
      if (/[^ ]/.test(lineStr)) {
        let count = 1;
        const end = error.linePos[1];
        if (end?.line === line && end.col > col) {
          count = Math.max(1, Math.min(end.col - col, 80 - ci));
        }
        const pointer = " ".repeat(ci) + "^".repeat(count);
        error.message += `:

${lineStr}
${pointer}
`;
      }
    };
    exports.YAMLError = YAMLError;
    exports.YAMLParseError = YAMLParseError;
    exports.YAMLWarning = YAMLWarning;
    exports.prettifyError = prettifyError;
  }
});

// node_modules/yaml/dist/compose/resolve-props.js
var require_resolve_props = __commonJS({
  "node_modules/yaml/dist/compose/resolve-props.js"(exports) {
    "use strict";
    function resolveProps(tokens, { flow, indicator, next, offset, onError, parentIndent, startOnNewline }) {
      let spaceBefore = false;
      let atNewline = startOnNewline;
      let hasSpace = startOnNewline;
      let comment = "";
      let commentSep = "";
      let hasNewline = false;
      let reqSpace = false;
      let tab = null;
      let anchor = null;
      let tag = null;
      let newlineAfterProp = null;
      let comma = null;
      let found = null;
      let start = null;
      for (const token of tokens) {
        if (reqSpace) {
          if (token.type !== "space" && token.type !== "newline" && token.type !== "comma")
            onError(token.offset, "MISSING_CHAR", "Tags and anchors must be separated from the next token by white space");
          reqSpace = false;
        }
        if (tab) {
          if (atNewline && token.type !== "comment" && token.type !== "newline") {
            onError(tab, "TAB_AS_INDENT", "Tabs are not allowed as indentation");
          }
          tab = null;
        }
        switch (token.type) {
          case "space":
            if (!flow && (indicator !== "doc-start" || next?.type !== "flow-collection") && token.source.includes("	")) {
              tab = token;
            }
            hasSpace = true;
            break;
          case "comment": {
            if (!hasSpace)
              onError(token, "MISSING_CHAR", "Comments must be separated from other tokens by white space characters");
            const cb = token.source.substring(1) || " ";
            if (!comment)
              comment = cb;
            else
              comment += commentSep + cb;
            commentSep = "";
            atNewline = false;
            break;
          }
          case "newline":
            if (atNewline) {
              if (comment)
                comment += token.source;
              else if (!found || indicator !== "seq-item-ind")
                spaceBefore = true;
            } else
              commentSep += token.source;
            atNewline = true;
            hasNewline = true;
            if (anchor || tag)
              newlineAfterProp = token;
            hasSpace = true;
            break;
          case "anchor":
            if (anchor)
              onError(token, "MULTIPLE_ANCHORS", "A node can have at most one anchor");
            if (token.source.endsWith(":"))
              onError(token.offset + token.source.length - 1, "BAD_ALIAS", "Anchor ending in : is ambiguous", true);
            anchor = token;
            start ?? (start = token.offset);
            atNewline = false;
            hasSpace = false;
            reqSpace = true;
            break;
          case "tag": {
            if (tag)
              onError(token, "MULTIPLE_TAGS", "A node can have at most one tag");
            tag = token;
            start ?? (start = token.offset);
            atNewline = false;
            hasSpace = false;
            reqSpace = true;
            break;
          }
          case indicator:
            if (anchor || tag)
              onError(token, "BAD_PROP_ORDER", `Anchors and tags must be after the ${token.source} indicator`);
            if (found)
              onError(token, "UNEXPECTED_TOKEN", `Unexpected ${token.source} in ${flow ?? "collection"}`);
            found = token;
            atNewline = indicator === "seq-item-ind" || indicator === "explicit-key-ind";
            hasSpace = false;
            break;
          case "comma":
            if (flow) {
              if (comma)
                onError(token, "UNEXPECTED_TOKEN", `Unexpected , in ${flow}`);
              comma = token;
              atNewline = false;
              hasSpace = false;
              break;
            }
          // else fallthrough
          default:
            onError(token, "UNEXPECTED_TOKEN", `Unexpected ${token.type} token`);
            atNewline = false;
            hasSpace = false;
        }
      }
      const last = tokens[tokens.length - 1];
      const end = last ? last.offset + last.source.length : offset;
      if (reqSpace && next && next.type !== "space" && next.type !== "newline" && next.type !== "comma" && (next.type !== "scalar" || next.source !== "")) {
        onError(next.offset, "MISSING_CHAR", "Tags and anchors must be separated from the next token by white space");
      }
      if (tab && (atNewline && tab.indent <= parentIndent || next?.type === "block-map" || next?.type === "block-seq"))
        onError(tab, "TAB_AS_INDENT", "Tabs are not allowed as indentation");
      return {
        comma,
        found,
        spaceBefore,
        comment,
        hasNewline,
        anchor,
        tag,
        newlineAfterProp,
        end,
        start: start ?? end
      };
    }
    exports.resolveProps = resolveProps;
  }
});

// node_modules/yaml/dist/compose/util-contains-newline.js
var require_util_contains_newline = __commonJS({
  "node_modules/yaml/dist/compose/util-contains-newline.js"(exports) {
    "use strict";
    function containsNewline(key) {
      if (!key)
        return null;
      switch (key.type) {
        case "alias":
        case "scalar":
        case "double-quoted-scalar":
        case "single-quoted-scalar":
          if (key.source.includes("\n"))
            return true;
          if (key.end) {
            for (const st of key.end)
              if (st.type === "newline")
                return true;
          }
          return false;
        case "flow-collection":
          for (const it of key.items) {
            for (const st of it.start)
              if (st.type === "newline")
                return true;
            if (it.sep) {
              for (const st of it.sep)
                if (st.type === "newline")
                  return true;
            }
            if (containsNewline(it.key) || containsNewline(it.value))
              return true;
          }
          return false;
        default:
          return true;
      }
    }
    exports.containsNewline = containsNewline;
  }
});

// node_modules/yaml/dist/compose/util-flow-indent-check.js
var require_util_flow_indent_check = __commonJS({
  "node_modules/yaml/dist/compose/util-flow-indent-check.js"(exports) {
    "use strict";
    var utilContainsNewline = require_util_contains_newline();
    function flowIndentCheck(indent, fc, onError) {
      if (fc?.type === "flow-collection") {
        const end = fc.end[0];
        if (end.indent === indent && (end.source === "]" || end.source === "}") && utilContainsNewline.containsNewline(fc)) {
          const msg = "Flow end indicator should be more indented than parent";
          onError(end, "BAD_INDENT", msg, true);
        }
      }
    }
    exports.flowIndentCheck = flowIndentCheck;
  }
});

// node_modules/yaml/dist/compose/util-map-includes.js
var require_util_map_includes = __commonJS({
  "node_modules/yaml/dist/compose/util-map-includes.js"(exports) {
    "use strict";
    var identity = require_identity();
    function mapIncludes(ctx, items, search) {
      const { uniqueKeys } = ctx.options;
      if (uniqueKeys === false)
        return false;
      const isEqual = typeof uniqueKeys === "function" ? uniqueKeys : (a, b) => a === b || identity.isScalar(a) && identity.isScalar(b) && a.value === b.value;
      return items.some((pair) => isEqual(pair.key, search));
    }
    exports.mapIncludes = mapIncludes;
  }
});

// node_modules/yaml/dist/compose/resolve-block-map.js
var require_resolve_block_map = __commonJS({
  "node_modules/yaml/dist/compose/resolve-block-map.js"(exports) {
    "use strict";
    var Pair = require_Pair();
    var YAMLMap = require_YAMLMap();
    var resolveProps = require_resolve_props();
    var utilContainsNewline = require_util_contains_newline();
    var utilFlowIndentCheck = require_util_flow_indent_check();
    var utilMapIncludes = require_util_map_includes();
    var startColMsg = "All mapping items must start at the same column";
    function resolveBlockMap({ composeNode, composeEmptyNode }, ctx, bm, onError, tag) {
      const NodeClass = tag?.nodeClass ?? YAMLMap.YAMLMap;
      const map = new NodeClass(ctx.schema);
      if (ctx.atRoot)
        ctx.atRoot = false;
      let offset = bm.offset;
      let commentEnd = null;
      for (const collItem of bm.items) {
        const { start, key, sep, value } = collItem;
        const keyProps = resolveProps.resolveProps(start, {
          indicator: "explicit-key-ind",
          next: key ?? sep?.[0],
          offset,
          onError,
          parentIndent: bm.indent,
          startOnNewline: true
        });
        const implicitKey = !keyProps.found;
        if (implicitKey) {
          if (key) {
            if (key.type === "block-seq")
              onError(offset, "BLOCK_AS_IMPLICIT_KEY", "A block sequence may not be used as an implicit map key");
            else if ("indent" in key && key.indent !== bm.indent)
              onError(offset, "BAD_INDENT", startColMsg);
          }
          if (!keyProps.anchor && !keyProps.tag && !sep) {
            commentEnd = keyProps.end;
            if (keyProps.comment) {
              if (map.comment)
                map.comment += "\n" + keyProps.comment;
              else
                map.comment = keyProps.comment;
            }
            continue;
          }
          if (keyProps.newlineAfterProp || utilContainsNewline.containsNewline(key)) {
            onError(key ?? start[start.length - 1], "MULTILINE_IMPLICIT_KEY", "Implicit keys need to be on a single line");
          }
        } else if (keyProps.found?.indent !== bm.indent) {
          onError(offset, "BAD_INDENT", startColMsg);
        }
        ctx.atKey = true;
        const keyStart = keyProps.end;
        const keyNode = key ? composeNode(ctx, key, keyProps, onError) : composeEmptyNode(ctx, keyStart, start, null, keyProps, onError);
        if (ctx.schema.compat)
          utilFlowIndentCheck.flowIndentCheck(bm.indent, key, onError);
        ctx.atKey = false;
        if (utilMapIncludes.mapIncludes(ctx, map.items, keyNode))
          onError(keyStart, "DUPLICATE_KEY", "Map keys must be unique");
        const valueProps = resolveProps.resolveProps(sep ?? [], {
          indicator: "map-value-ind",
          next: value,
          offset: keyNode.range[2],
          onError,
          parentIndent: bm.indent,
          startOnNewline: !key || key.type === "block-scalar"
        });
        offset = valueProps.end;
        if (valueProps.found) {
          if (implicitKey) {
            if (value?.type === "block-map" && !valueProps.hasNewline)
              onError(offset, "BLOCK_AS_IMPLICIT_KEY", "Nested mappings are not allowed in compact mappings");
            if (ctx.options.strict && keyProps.start < valueProps.found.offset - 1024)
              onError(keyNode.range, "KEY_OVER_1024_CHARS", "The : indicator must be at most 1024 chars after the start of an implicit block mapping key");
          }
          const valueNode = value ? composeNode(ctx, value, valueProps, onError) : composeEmptyNode(ctx, offset, sep, null, valueProps, onError);
          if (ctx.schema.compat)
            utilFlowIndentCheck.flowIndentCheck(bm.indent, value, onError);
          offset = valueNode.range[2];
          const pair = new Pair.Pair(keyNode, valueNode);
          if (ctx.options.keepSourceTokens)
            pair.srcToken = collItem;
          map.items.push(pair);
        } else {
          if (implicitKey)
            onError(keyNode.range, "MISSING_CHAR", "Implicit map keys need to be followed by map values");
          if (valueProps.comment) {
            if (keyNode.comment)
              keyNode.comment += "\n" + valueProps.comment;
            else
              keyNode.comment = valueProps.comment;
          }
          const pair = new Pair.Pair(keyNode);
          if (ctx.options.keepSourceTokens)
            pair.srcToken = collItem;
          map.items.push(pair);
        }
      }
      if (commentEnd && commentEnd < offset)
        onError(commentEnd, "IMPOSSIBLE", "Map comment with trailing content");
      map.range = [bm.offset, offset, commentEnd ?? offset];
      return map;
    }
    exports.resolveBlockMap = resolveBlockMap;
  }
});

// node_modules/yaml/dist/compose/resolve-block-seq.js
var require_resolve_block_seq = __commonJS({
  "node_modules/yaml/dist/compose/resolve-block-seq.js"(exports) {
    "use strict";
    var YAMLSeq = require_YAMLSeq();
    var resolveProps = require_resolve_props();
    var utilFlowIndentCheck = require_util_flow_indent_check();
    function resolveBlockSeq({ composeNode, composeEmptyNode }, ctx, bs, onError, tag) {
      const NodeClass = tag?.nodeClass ?? YAMLSeq.YAMLSeq;
      const seq = new NodeClass(ctx.schema);
      if (ctx.atRoot)
        ctx.atRoot = false;
      if (ctx.atKey)
        ctx.atKey = false;
      let offset = bs.offset;
      let commentEnd = null;
      for (const { start, value } of bs.items) {
        const props = resolveProps.resolveProps(start, {
          indicator: "seq-item-ind",
          next: value,
          offset,
          onError,
          parentIndent: bs.indent,
          startOnNewline: true
        });
        if (!props.found) {
          if (props.anchor || props.tag || value) {
            if (value?.type === "block-seq")
              onError(props.end, "BAD_INDENT", "All sequence items must start at the same column");
            else
              onError(offset, "MISSING_CHAR", "Sequence item without - indicator");
          } else {
            commentEnd = props.end;
            if (props.comment)
              seq.comment = props.comment;
            continue;
          }
        }
        const node = value ? composeNode(ctx, value, props, onError) : composeEmptyNode(ctx, props.end, start, null, props, onError);
        if (ctx.schema.compat)
          utilFlowIndentCheck.flowIndentCheck(bs.indent, value, onError);
        offset = node.range[2];
        seq.items.push(node);
      }
      seq.range = [bs.offset, offset, commentEnd ?? offset];
      return seq;
    }
    exports.resolveBlockSeq = resolveBlockSeq;
  }
});

// node_modules/yaml/dist/compose/resolve-end.js
var require_resolve_end = __commonJS({
  "node_modules/yaml/dist/compose/resolve-end.js"(exports) {
    "use strict";
    function resolveEnd(end, offset, reqSpace, onError) {
      let comment = "";
      if (end) {
        let hasSpace = false;
        let sep = "";
        for (const token of end) {
          const { source, type } = token;
          switch (type) {
            case "space":
              hasSpace = true;
              break;
            case "comment": {
              if (reqSpace && !hasSpace)
                onError(token, "MISSING_CHAR", "Comments must be separated from other tokens by white space characters");
              const cb = source.substring(1) || " ";
              if (!comment)
                comment = cb;
              else
                comment += sep + cb;
              sep = "";
              break;
            }
            case "newline":
              if (comment)
                sep += source;
              hasSpace = true;
              break;
            default:
              onError(token, "UNEXPECTED_TOKEN", `Unexpected ${type} at node end`);
          }
          offset += source.length;
        }
      }
      return { comment, offset };
    }
    exports.resolveEnd = resolveEnd;
  }
});

// node_modules/yaml/dist/compose/resolve-flow-collection.js
var require_resolve_flow_collection = __commonJS({
  "node_modules/yaml/dist/compose/resolve-flow-collection.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Pair = require_Pair();
    var YAMLMap = require_YAMLMap();
    var YAMLSeq = require_YAMLSeq();
    var resolveEnd = require_resolve_end();
    var resolveProps = require_resolve_props();
    var utilContainsNewline = require_util_contains_newline();
    var utilMapIncludes = require_util_map_includes();
    var blockMsg = "Block collections are not allowed within flow collections";
    var isBlock = (token) => token && (token.type === "block-map" || token.type === "block-seq");
    function resolveFlowCollection({ composeNode, composeEmptyNode }, ctx, fc, onError, tag) {
      const isMap = fc.start.source === "{";
      const fcName = isMap ? "flow map" : "flow sequence";
      const NodeClass = tag?.nodeClass ?? (isMap ? YAMLMap.YAMLMap : YAMLSeq.YAMLSeq);
      const coll = new NodeClass(ctx.schema);
      coll.flow = true;
      const atRoot = ctx.atRoot;
      if (atRoot)
        ctx.atRoot = false;
      if (ctx.atKey)
        ctx.atKey = false;
      let offset = fc.offset + fc.start.source.length;
      for (let i = 0; i < fc.items.length; ++i) {
        const collItem = fc.items[i];
        const { start, key, sep, value } = collItem;
        const props = resolveProps.resolveProps(start, {
          flow: fcName,
          indicator: "explicit-key-ind",
          next: key ?? sep?.[0],
          offset,
          onError,
          parentIndent: fc.indent,
          startOnNewline: false
        });
        if (!props.found) {
          if (!props.anchor && !props.tag && !sep && !value) {
            if (i === 0 && props.comma)
              onError(props.comma, "UNEXPECTED_TOKEN", `Unexpected , in ${fcName}`);
            else if (i < fc.items.length - 1)
              onError(props.start, "UNEXPECTED_TOKEN", `Unexpected empty item in ${fcName}`);
            if (props.comment) {
              if (coll.comment)
                coll.comment += "\n" + props.comment;
              else
                coll.comment = props.comment;
            }
            offset = props.end;
            continue;
          }
          if (!isMap && ctx.options.strict && utilContainsNewline.containsNewline(key))
            onError(
              key,
              // checked by containsNewline()
              "MULTILINE_IMPLICIT_KEY",
              "Implicit keys of flow sequence pairs need to be on a single line"
            );
        }
        if (i === 0) {
          if (props.comma)
            onError(props.comma, "UNEXPECTED_TOKEN", `Unexpected , in ${fcName}`);
        } else {
          if (!props.comma)
            onError(props.start, "MISSING_CHAR", `Missing , between ${fcName} items`);
          if (props.comment) {
            let prevItemComment = "";
            loop: for (const st of start) {
              switch (st.type) {
                case "comma":
                case "space":
                  break;
                case "comment":
                  prevItemComment = st.source.substring(1);
                  break loop;
                default:
                  break loop;
              }
            }
            if (prevItemComment) {
              let prev = coll.items[coll.items.length - 1];
              if (identity.isPair(prev))
                prev = prev.value ?? prev.key;
              if (prev.comment)
                prev.comment += "\n" + prevItemComment;
              else
                prev.comment = prevItemComment;
              props.comment = props.comment.substring(prevItemComment.length + 1);
            }
          }
        }
        if (!isMap && !sep && !props.found) {
          const valueNode = value ? composeNode(ctx, value, props, onError) : composeEmptyNode(ctx, props.end, sep, null, props, onError);
          coll.items.push(valueNode);
          offset = valueNode.range[2];
          if (isBlock(value))
            onError(valueNode.range, "BLOCK_IN_FLOW", blockMsg);
        } else {
          ctx.atKey = true;
          const keyStart = props.end;
          const keyNode = key ? composeNode(ctx, key, props, onError) : composeEmptyNode(ctx, keyStart, start, null, props, onError);
          if (isBlock(key))
            onError(keyNode.range, "BLOCK_IN_FLOW", blockMsg);
          ctx.atKey = false;
          const valueProps = resolveProps.resolveProps(sep ?? [], {
            flow: fcName,
            indicator: "map-value-ind",
            next: value,
            offset: keyNode.range[2],
            onError,
            parentIndent: fc.indent,
            startOnNewline: false
          });
          if (valueProps.found) {
            if (!isMap && !props.found && ctx.options.strict) {
              if (sep)
                for (const st of sep) {
                  if (st === valueProps.found)
                    break;
                  if (st.type === "newline") {
                    onError(st, "MULTILINE_IMPLICIT_KEY", "Implicit keys of flow sequence pairs need to be on a single line");
                    break;
                  }
                }
              if (props.start < valueProps.found.offset - 1024)
                onError(valueProps.found, "KEY_OVER_1024_CHARS", "The : indicator must be at most 1024 chars after the start of an implicit flow sequence key");
            }
          } else if (value) {
            if ("source" in value && value.source?.[0] === ":")
              onError(value, "MISSING_CHAR", `Missing space after : in ${fcName}`);
            else
              onError(valueProps.start, "MISSING_CHAR", `Missing , or : between ${fcName} items`);
          }
          const valueNode = value ? composeNode(ctx, value, valueProps, onError) : valueProps.found ? composeEmptyNode(ctx, valueProps.end, sep, null, valueProps, onError) : null;
          if (valueNode) {
            if (isBlock(value))
              onError(valueNode.range, "BLOCK_IN_FLOW", blockMsg);
          } else if (valueProps.comment) {
            if (keyNode.comment)
              keyNode.comment += "\n" + valueProps.comment;
            else
              keyNode.comment = valueProps.comment;
          }
          const pair = new Pair.Pair(keyNode, valueNode);
          if (ctx.options.keepSourceTokens)
            pair.srcToken = collItem;
          if (isMap) {
            const map = coll;
            if (utilMapIncludes.mapIncludes(ctx, map.items, keyNode))
              onError(keyStart, "DUPLICATE_KEY", "Map keys must be unique");
            map.items.push(pair);
          } else {
            const map = new YAMLMap.YAMLMap(ctx.schema);
            map.flow = true;
            map.items.push(pair);
            const endRange = (valueNode ?? keyNode).range;
            map.range = [keyNode.range[0], endRange[1], endRange[2]];
            coll.items.push(map);
          }
          offset = valueNode ? valueNode.range[2] : valueProps.end;
        }
      }
      const expectedEnd = isMap ? "}" : "]";
      const [ce, ...ee] = fc.end;
      let cePos = offset;
      if (ce?.source === expectedEnd)
        cePos = ce.offset + ce.source.length;
      else {
        const name = fcName[0].toUpperCase() + fcName.substring(1);
        const msg = atRoot ? `${name} must end with a ${expectedEnd}` : `${name} in block collection must be sufficiently indented and end with a ${expectedEnd}`;
        onError(offset, atRoot ? "MISSING_CHAR" : "BAD_INDENT", msg);
        if (ce && ce.source.length !== 1)
          ee.unshift(ce);
      }
      if (ee.length > 0) {
        const end = resolveEnd.resolveEnd(ee, cePos, ctx.options.strict, onError);
        if (end.comment) {
          if (coll.comment)
            coll.comment += "\n" + end.comment;
          else
            coll.comment = end.comment;
        }
        coll.range = [fc.offset, cePos, end.offset];
      } else {
        coll.range = [fc.offset, cePos, cePos];
      }
      return coll;
    }
    exports.resolveFlowCollection = resolveFlowCollection;
  }
});

// node_modules/yaml/dist/compose/compose-collection.js
var require_compose_collection = __commonJS({
  "node_modules/yaml/dist/compose/compose-collection.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Scalar = require_Scalar();
    var YAMLMap = require_YAMLMap();
    var YAMLSeq = require_YAMLSeq();
    var resolveBlockMap = require_resolve_block_map();
    var resolveBlockSeq = require_resolve_block_seq();
    var resolveFlowCollection = require_resolve_flow_collection();
    function resolveCollection(CN, ctx, token, onError, tagName, tag) {
      const coll = token.type === "block-map" ? resolveBlockMap.resolveBlockMap(CN, ctx, token, onError, tag) : token.type === "block-seq" ? resolveBlockSeq.resolveBlockSeq(CN, ctx, token, onError, tag) : resolveFlowCollection.resolveFlowCollection(CN, ctx, token, onError, tag);
      const Coll = coll.constructor;
      if (tagName === "!" || tagName === Coll.tagName) {
        coll.tag = Coll.tagName;
        return coll;
      }
      if (tagName)
        coll.tag = tagName;
      return coll;
    }
    function composeCollection(CN, ctx, token, props, onError) {
      const tagToken = props.tag;
      const tagName = !tagToken ? null : ctx.directives.tagName(tagToken.source, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg));
      if (token.type === "block-seq") {
        const { anchor, newlineAfterProp: nl } = props;
        const lastProp = anchor && tagToken ? anchor.offset > tagToken.offset ? anchor : tagToken : anchor ?? tagToken;
        if (lastProp && (!nl || nl.offset < lastProp.offset)) {
          const message = "Missing newline after block sequence props";
          onError(lastProp, "MISSING_CHAR", message);
        }
      }
      const expType = token.type === "block-map" ? "map" : token.type === "block-seq" ? "seq" : token.start.source === "{" ? "map" : "seq";
      if (!tagToken || !tagName || tagName === "!" || tagName === YAMLMap.YAMLMap.tagName && expType === "map" || tagName === YAMLSeq.YAMLSeq.tagName && expType === "seq") {
        return resolveCollection(CN, ctx, token, onError, tagName);
      }
      let tag = ctx.schema.tags.find((t) => t.tag === tagName && t.collection === expType);
      if (!tag) {
        const kt = ctx.schema.knownTags[tagName];
        if (kt?.collection === expType) {
          ctx.schema.tags.push(Object.assign({}, kt, { default: false }));
          tag = kt;
        } else {
          if (kt) {
            onError(tagToken, "BAD_COLLECTION_TYPE", `${kt.tag} used for ${expType} collection, but expects ${kt.collection ?? "scalar"}`, true);
          } else {
            onError(tagToken, "TAG_RESOLVE_FAILED", `Unresolved tag: ${tagName}`, true);
          }
          return resolveCollection(CN, ctx, token, onError, tagName);
        }
      }
      const coll = resolveCollection(CN, ctx, token, onError, tagName, tag);
      const res = tag.resolve?.(coll, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg), ctx.options) ?? coll;
      const node = identity.isNode(res) ? res : new Scalar.Scalar(res);
      node.range = coll.range;
      node.tag = tagName;
      if (tag?.format)
        node.format = tag.format;
      return node;
    }
    exports.composeCollection = composeCollection;
  }
});

// node_modules/yaml/dist/compose/resolve-block-scalar.js
var require_resolve_block_scalar = __commonJS({
  "node_modules/yaml/dist/compose/resolve-block-scalar.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    function resolveBlockScalar(ctx, scalar, onError) {
      const start = scalar.offset;
      const header = parseBlockScalarHeader(scalar, ctx.options.strict, onError);
      if (!header)
        return { value: "", type: null, comment: "", range: [start, start, start] };
      const type = header.mode === ">" ? Scalar.Scalar.BLOCK_FOLDED : Scalar.Scalar.BLOCK_LITERAL;
      const lines = scalar.source ? splitLines(scalar.source) : [];
      let chompStart = lines.length;
      for (let i = lines.length - 1; i >= 0; --i) {
        const content = lines[i][1];
        if (content === "" || content === "\r")
          chompStart = i;
        else
          break;
      }
      if (chompStart === 0) {
        const value2 = header.chomp === "+" && lines.length > 0 ? "\n".repeat(Math.max(1, lines.length - 1)) : "";
        let end2 = start + header.length;
        if (scalar.source)
          end2 += scalar.source.length;
        return { value: value2, type, comment: header.comment, range: [start, end2, end2] };
      }
      let trimIndent = scalar.indent + header.indent;
      let offset = scalar.offset + header.length;
      let contentStart = 0;
      for (let i = 0; i < chompStart; ++i) {
        const [indent, content] = lines[i];
        if (content === "" || content === "\r") {
          if (header.indent === 0 && indent.length > trimIndent)
            trimIndent = indent.length;
        } else {
          if (indent.length < trimIndent) {
            const message = "Block scalars with more-indented leading empty lines must use an explicit indentation indicator";
            onError(offset + indent.length, "MISSING_CHAR", message);
          }
          if (header.indent === 0)
            trimIndent = indent.length;
          contentStart = i;
          if (trimIndent === 0 && !ctx.atRoot) {
            const message = "Block scalar values in collections must be indented";
            onError(offset, "BAD_INDENT", message);
          }
          break;
        }
        offset += indent.length + content.length + 1;
      }
      for (let i = lines.length - 1; i >= chompStart; --i) {
        if (lines[i][0].length > trimIndent)
          chompStart = i + 1;
      }
      let value = "";
      let sep = "";
      let prevMoreIndented = false;
      for (let i = 0; i < contentStart; ++i)
        value += lines[i][0].slice(trimIndent) + "\n";
      for (let i = contentStart; i < chompStart; ++i) {
        let [indent, content] = lines[i];
        offset += indent.length + content.length + 1;
        const crlf = content[content.length - 1] === "\r";
        if (crlf)
          content = content.slice(0, -1);
        if (content && indent.length < trimIndent) {
          const src = header.indent ? "explicit indentation indicator" : "first line";
          const message = `Block scalar lines must not be less indented than their ${src}`;
          onError(offset - content.length - (crlf ? 2 : 1), "BAD_INDENT", message);
          indent = "";
        }
        if (type === Scalar.Scalar.BLOCK_LITERAL) {
          value += sep + indent.slice(trimIndent) + content;
          sep = "\n";
        } else if (indent.length > trimIndent || content[0] === "	") {
          if (sep === " ")
            sep = "\n";
          else if (!prevMoreIndented && sep === "\n")
            sep = "\n\n";
          value += sep + indent.slice(trimIndent) + content;
          sep = "\n";
          prevMoreIndented = true;
        } else if (content === "") {
          if (sep === "\n")
            value += "\n";
          else
            sep = "\n";
        } else {
          value += sep + content;
          sep = " ";
          prevMoreIndented = false;
        }
      }
      switch (header.chomp) {
        case "-":
          break;
        case "+":
          for (let i = chompStart; i < lines.length; ++i)
            value += "\n" + lines[i][0].slice(trimIndent);
          if (value[value.length - 1] !== "\n")
            value += "\n";
          break;
        default:
          value += "\n";
      }
      const end = start + header.length + scalar.source.length;
      return { value, type, comment: header.comment, range: [start, end, end] };
    }
    function parseBlockScalarHeader({ offset, props }, strict, onError) {
      if (props[0].type !== "block-scalar-header") {
        onError(props[0], "IMPOSSIBLE", "Block scalar header not found");
        return null;
      }
      const { source } = props[0];
      const mode = source[0];
      let indent = 0;
      let chomp = "";
      let error = -1;
      for (let i = 1; i < source.length; ++i) {
        const ch = source[i];
        if (!chomp && (ch === "-" || ch === "+"))
          chomp = ch;
        else {
          const n = Number(ch);
          if (!indent && n)
            indent = n;
          else if (error === -1)
            error = offset + i;
        }
      }
      if (error !== -1)
        onError(error, "UNEXPECTED_TOKEN", `Block scalar header includes extra characters: ${source}`);
      let hasSpace = false;
      let comment = "";
      let length = source.length;
      for (let i = 1; i < props.length; ++i) {
        const token = props[i];
        switch (token.type) {
          case "space":
            hasSpace = true;
          // fallthrough
          case "newline":
            length += token.source.length;
            break;
          case "comment":
            if (strict && !hasSpace) {
              const message = "Comments must be separated from other tokens by white space characters";
              onError(token, "MISSING_CHAR", message);
            }
            length += token.source.length;
            comment = token.source.substring(1);
            break;
          case "error":
            onError(token, "UNEXPECTED_TOKEN", token.message);
            length += token.source.length;
            break;
          /* istanbul ignore next should not happen */
          default: {
            const message = `Unexpected token in block scalar header: ${token.type}`;
            onError(token, "UNEXPECTED_TOKEN", message);
            const ts = token.source;
            if (ts && typeof ts === "string")
              length += ts.length;
          }
        }
      }
      return { mode, indent, chomp, comment, length };
    }
    function splitLines(source) {
      const split = source.split(/\n( *)/);
      const first = split[0];
      const m = first.match(/^( *)/);
      const line0 = m?.[1] ? [m[1], first.slice(m[1].length)] : ["", first];
      const lines = [line0];
      for (let i = 1; i < split.length; i += 2)
        lines.push([split[i], split[i + 1]]);
      return lines;
    }
    exports.resolveBlockScalar = resolveBlockScalar;
  }
});

// node_modules/yaml/dist/compose/resolve-flow-scalar.js
var require_resolve_flow_scalar = __commonJS({
  "node_modules/yaml/dist/compose/resolve-flow-scalar.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    var resolveEnd = require_resolve_end();
    function resolveFlowScalar(scalar, strict, onError) {
      const { offset, type, source, end } = scalar;
      let _type;
      let value;
      const _onError = (rel, code, msg) => onError(offset + rel, code, msg);
      switch (type) {
        case "scalar":
          _type = Scalar.Scalar.PLAIN;
          value = plainValue(source, _onError);
          break;
        case "single-quoted-scalar":
          _type = Scalar.Scalar.QUOTE_SINGLE;
          value = singleQuotedValue(source, _onError);
          break;
        case "double-quoted-scalar":
          _type = Scalar.Scalar.QUOTE_DOUBLE;
          value = doubleQuotedValue(source, _onError);
          break;
        /* istanbul ignore next should not happen */
        default:
          onError(scalar, "UNEXPECTED_TOKEN", `Expected a flow scalar value, but found: ${type}`);
          return {
            value: "",
            type: null,
            comment: "",
            range: [offset, offset + source.length, offset + source.length]
          };
      }
      const valueEnd = offset + source.length;
      const re = resolveEnd.resolveEnd(end, valueEnd, strict, onError);
      return {
        value,
        type: _type,
        comment: re.comment,
        range: [offset, valueEnd, re.offset]
      };
    }
    function plainValue(source, onError) {
      let badChar = "";
      switch (source[0]) {
        /* istanbul ignore next should not happen */
        case "	":
          badChar = "a tab character";
          break;
        case ",":
          badChar = "flow indicator character ,";
          break;
        case "%":
          badChar = "directive indicator character %";
          break;
        case "|":
        case ">": {
          badChar = `block scalar indicator ${source[0]}`;
          break;
        }
        case "@":
        case "`": {
          badChar = `reserved character ${source[0]}`;
          break;
        }
      }
      if (badChar)
        onError(0, "BAD_SCALAR_START", `Plain value cannot start with ${badChar}`);
      return foldLines(source);
    }
    function singleQuotedValue(source, onError) {
      if (source[source.length - 1] !== "'" || source.length === 1)
        onError(source.length, "MISSING_CHAR", "Missing closing 'quote");
      return foldLines(source.slice(1, -1)).replace(/''/g, "'");
    }
    function foldLines(source) {
      let first, line;
      try {
        first = new RegExp("(.*?)(?<![ 	])[ 	]*\r?\n", "sy");
        line = new RegExp("[ 	]*(.*?)(?:(?<![ 	])[ 	]*)?\r?\n", "sy");
      } catch {
        first = /(.*?)[ \t]*\r?\n/sy;
        line = /[ \t]*(.*?)[ \t]*\r?\n/sy;
      }
      let match = first.exec(source);
      if (!match)
        return source;
      let res = match[1];
      let sep = " ";
      let pos = first.lastIndex;
      line.lastIndex = pos;
      while (match = line.exec(source)) {
        if (match[1] === "") {
          if (sep === "\n")
            res += sep;
          else
            sep = "\n";
        } else {
          res += sep + match[1];
          sep = " ";
        }
        pos = line.lastIndex;
      }
      const last = /[ \t]*(.*)/sy;
      last.lastIndex = pos;
      match = last.exec(source);
      return res + sep + (match?.[1] ?? "");
    }
    function doubleQuotedValue(source, onError) {
      let res = "";
      for (let i = 1; i < source.length - 1; ++i) {
        const ch = source[i];
        if (ch === "\r" && source[i + 1] === "\n")
          continue;
        if (ch === "\n") {
          const { fold, offset } = foldNewline(source, i);
          res += fold;
          i = offset;
        } else if (ch === "\\") {
          let next = source[++i];
          const cc = escapeCodes[next];
          if (cc)
            res += cc;
          else if (next === "\n") {
            next = source[i + 1];
            while (next === " " || next === "	")
              next = source[++i + 1];
          } else if (next === "\r" && source[i + 1] === "\n") {
            next = source[++i + 1];
            while (next === " " || next === "	")
              next = source[++i + 1];
          } else if (next === "x" || next === "u" || next === "U") {
            const length = next === "x" ? 2 : next === "u" ? 4 : 8;
            res += parseCharCode(source, i + 1, length, onError);
            i += length;
          } else {
            const raw = source.substr(i - 1, 2);
            onError(i - 1, "BAD_DQ_ESCAPE", `Invalid escape sequence ${raw}`);
            res += raw;
          }
        } else if (ch === " " || ch === "	") {
          const wsStart = i;
          let next = source[i + 1];
          while (next === " " || next === "	")
            next = source[++i + 1];
          if (next !== "\n" && !(next === "\r" && source[i + 2] === "\n"))
            res += i > wsStart ? source.slice(wsStart, i + 1) : ch;
        } else {
          res += ch;
        }
      }
      if (source[source.length - 1] !== '"' || source.length === 1)
        onError(source.length, "MISSING_CHAR", 'Missing closing "quote');
      return res;
    }
    function foldNewline(source, offset) {
      let fold = "";
      let ch = source[offset + 1];
      while (ch === " " || ch === "	" || ch === "\n" || ch === "\r") {
        if (ch === "\r" && source[offset + 2] !== "\n")
          break;
        if (ch === "\n")
          fold += "\n";
        offset += 1;
        ch = source[offset + 1];
      }
      if (!fold)
        fold = " ";
      return { fold, offset };
    }
    var escapeCodes = {
      "0": "\0",
      // null character
      a: "\x07",
      // bell character
      b: "\b",
      // backspace
      e: "\x1B",
      // escape character
      f: "\f",
      // form feed
      n: "\n",
      // line feed
      r: "\r",
      // carriage return
      t: "	",
      // horizontal tab
      v: "\v",
      // vertical tab
      N: "\x85",
      // Unicode next line
      _: "\xA0",
      // Unicode non-breaking space
      L: "\u2028",
      // Unicode line separator
      P: "\u2029",
      // Unicode paragraph separator
      " ": " ",
      '"': '"',
      "/": "/",
      "\\": "\\",
      "	": "	"
    };
    function parseCharCode(source, offset, length, onError) {
      const cc = source.substr(offset, length);
      const ok = cc.length === length && /^[0-9a-fA-F]+$/.test(cc);
      const code = ok ? parseInt(cc, 16) : NaN;
      try {
        return String.fromCodePoint(code);
      } catch {
        const raw = source.substr(offset - 2, length + 2);
        onError(offset - 2, "BAD_DQ_ESCAPE", `Invalid escape sequence ${raw}`);
        return raw;
      }
    }
    exports.resolveFlowScalar = resolveFlowScalar;
  }
});

// node_modules/yaml/dist/compose/compose-scalar.js
var require_compose_scalar = __commonJS({
  "node_modules/yaml/dist/compose/compose-scalar.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Scalar = require_Scalar();
    var resolveBlockScalar = require_resolve_block_scalar();
    var resolveFlowScalar = require_resolve_flow_scalar();
    function composeScalar(ctx, token, tagToken, onError) {
      const { value, type, comment, range } = token.type === "block-scalar" ? resolveBlockScalar.resolveBlockScalar(ctx, token, onError) : resolveFlowScalar.resolveFlowScalar(token, ctx.options.strict, onError);
      const tagName = tagToken ? ctx.directives.tagName(tagToken.source, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg)) : null;
      let tag;
      if (ctx.options.stringKeys && ctx.atKey) {
        tag = ctx.schema[identity.SCALAR];
      } else if (tagName)
        tag = findScalarTagByName(ctx.schema, value, tagName, tagToken, onError);
      else if (token.type === "scalar")
        tag = findScalarTagByTest(ctx, value, token, onError);
      else
        tag = ctx.schema[identity.SCALAR];
      let scalar;
      try {
        const res = tag.resolve(value, (msg) => onError(tagToken ?? token, "TAG_RESOLVE_FAILED", msg), ctx.options);
        scalar = identity.isScalar(res) ? res : new Scalar.Scalar(res);
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        onError(tagToken ?? token, "TAG_RESOLVE_FAILED", msg);
        scalar = new Scalar.Scalar(value);
      }
      scalar.range = range;
      scalar.source = value;
      if (type)
        scalar.type = type;
      if (tagName)
        scalar.tag = tagName;
      if (tag.format)
        scalar.format = tag.format;
      if (comment)
        scalar.comment = comment;
      return scalar;
    }
    function findScalarTagByName(schema, value, tagName, tagToken, onError) {
      if (tagName === "!")
        return schema[identity.SCALAR];
      const matchWithTest = [];
      for (const tag of schema.tags) {
        if (!tag.collection && tag.tag === tagName) {
          if (tag.default && tag.test)
            matchWithTest.push(tag);
          else
            return tag;
        }
      }
      for (const tag of matchWithTest)
        if (tag.test?.test(value))
          return tag;
      const kt = schema.knownTags[tagName];
      if (kt && !kt.collection) {
        schema.tags.push(Object.assign({}, kt, { default: false, test: void 0 }));
        return kt;
      }
      onError(tagToken, "TAG_RESOLVE_FAILED", `Unresolved tag: ${tagName}`, tagName !== "tag:yaml.org,2002:str");
      return schema[identity.SCALAR];
    }
    function findScalarTagByTest({ atKey, directives, schema }, value, token, onError) {
      const tag = schema.tags.find((tag2) => (tag2.default === true || atKey && tag2.default === "key") && tag2.test?.test(value)) || schema[identity.SCALAR];
      if (schema.compat) {
        const compat = schema.compat.find((tag2) => tag2.default && tag2.test?.test(value)) ?? schema[identity.SCALAR];
        if (tag.tag !== compat.tag) {
          const ts = directives.tagString(tag.tag);
          const cs = directives.tagString(compat.tag);
          const msg = `Value may be parsed as either ${ts} or ${cs}`;
          onError(token, "TAG_RESOLVE_FAILED", msg, true);
        }
      }
      return tag;
    }
    exports.composeScalar = composeScalar;
  }
});

// node_modules/yaml/dist/compose/util-empty-scalar-position.js
var require_util_empty_scalar_position = __commonJS({
  "node_modules/yaml/dist/compose/util-empty-scalar-position.js"(exports) {
    "use strict";
    function emptyScalarPosition(offset, before, pos) {
      if (before) {
        pos ?? (pos = before.length);
        for (let i = pos - 1; i >= 0; --i) {
          let st = before[i];
          switch (st.type) {
            case "space":
            case "comment":
            case "newline":
              offset -= st.source.length;
              continue;
          }
          st = before[++i];
          while (st?.type === "space") {
            offset += st.source.length;
            st = before[++i];
          }
          break;
        }
      }
      return offset;
    }
    exports.emptyScalarPosition = emptyScalarPosition;
  }
});

// node_modules/yaml/dist/compose/compose-node.js
var require_compose_node = __commonJS({
  "node_modules/yaml/dist/compose/compose-node.js"(exports) {
    "use strict";
    var Alias = require_Alias();
    var identity = require_identity();
    var composeCollection = require_compose_collection();
    var composeScalar = require_compose_scalar();
    var resolveEnd = require_resolve_end();
    var utilEmptyScalarPosition = require_util_empty_scalar_position();
    var CN = { composeNode, composeEmptyNode };
    function composeNode(ctx, token, props, onError) {
      const atKey = ctx.atKey;
      const { spaceBefore, comment, anchor, tag } = props;
      let node;
      let isSrcToken = true;
      switch (token.type) {
        case "alias":
          node = composeAlias(ctx, token, onError);
          if (anchor || tag)
            onError(token, "ALIAS_PROPS", "An alias node must not specify any properties");
          break;
        case "scalar":
        case "single-quoted-scalar":
        case "double-quoted-scalar":
        case "block-scalar":
          node = composeScalar.composeScalar(ctx, token, tag, onError);
          if (anchor)
            node.anchor = anchor.source.substring(1);
          break;
        case "block-map":
        case "block-seq":
        case "flow-collection":
          try {
            node = composeCollection.composeCollection(CN, ctx, token, props, onError);
            if (anchor)
              node.anchor = anchor.source.substring(1);
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            onError(token, "RESOURCE_EXHAUSTION", message);
          }
          break;
        default: {
          const message = token.type === "error" ? token.message : `Unsupported token (type: ${token.type})`;
          onError(token, "UNEXPECTED_TOKEN", message);
          isSrcToken = false;
        }
      }
      node ?? (node = composeEmptyNode(ctx, token.offset, void 0, null, props, onError));
      if (anchor && node.anchor === "")
        onError(anchor, "BAD_ALIAS", "Anchor cannot be an empty string");
      if (atKey && ctx.options.stringKeys && (!identity.isScalar(node) || typeof node.value !== "string" || node.tag && node.tag !== "tag:yaml.org,2002:str")) {
        const msg = "With stringKeys, all keys must be strings";
        onError(tag ?? token, "NON_STRING_KEY", msg);
      }
      if (spaceBefore)
        node.spaceBefore = true;
      if (comment) {
        if (token.type === "scalar" && token.source === "")
          node.comment = comment;
        else
          node.commentBefore = comment;
      }
      if (ctx.options.keepSourceTokens && isSrcToken)
        node.srcToken = token;
      return node;
    }
    function composeEmptyNode(ctx, offset, before, pos, { spaceBefore, comment, anchor, tag, end }, onError) {
      const token = {
        type: "scalar",
        offset: utilEmptyScalarPosition.emptyScalarPosition(offset, before, pos),
        indent: -1,
        source: ""
      };
      const node = composeScalar.composeScalar(ctx, token, tag, onError);
      if (anchor) {
        node.anchor = anchor.source.substring(1);
        if (node.anchor === "")
          onError(anchor, "BAD_ALIAS", "Anchor cannot be an empty string");
      }
      if (spaceBefore)
        node.spaceBefore = true;
      if (comment) {
        node.comment = comment;
        node.range[2] = end;
      }
      return node;
    }
    function composeAlias({ options }, { offset, source, end }, onError) {
      const alias = new Alias.Alias(source.substring(1));
      if (alias.source === "")
        onError(offset, "BAD_ALIAS", "Alias cannot be an empty string");
      if (alias.source.endsWith(":"))
        onError(offset + source.length - 1, "BAD_ALIAS", "Alias ending in : is ambiguous", true);
      const valueEnd = offset + source.length;
      const re = resolveEnd.resolveEnd(end, valueEnd, options.strict, onError);
      alias.range = [offset, valueEnd, re.offset];
      if (re.comment)
        alias.comment = re.comment;
      return alias;
    }
    exports.composeEmptyNode = composeEmptyNode;
    exports.composeNode = composeNode;
  }
});

// node_modules/yaml/dist/compose/compose-doc.js
var require_compose_doc = __commonJS({
  "node_modules/yaml/dist/compose/compose-doc.js"(exports) {
    "use strict";
    var Document = require_Document();
    var composeNode = require_compose_node();
    var resolveEnd = require_resolve_end();
    var resolveProps = require_resolve_props();
    function composeDoc(options, directives, { offset, start, value, end }, onError) {
      const opts = Object.assign({ _directives: directives }, options);
      const doc = new Document.Document(void 0, opts);
      const ctx = {
        atKey: false,
        atRoot: true,
        directives: doc.directives,
        options: doc.options,
        schema: doc.schema
      };
      const props = resolveProps.resolveProps(start, {
        indicator: "doc-start",
        next: value ?? end?.[0],
        offset,
        onError,
        parentIndent: 0,
        startOnNewline: true
      });
      if (props.found) {
        doc.directives.docStart = true;
        if (value && (value.type === "block-map" || value.type === "block-seq") && !props.hasNewline)
          onError(props.end, "MISSING_CHAR", "Block collection cannot start on same line with directives-end marker");
      }
      doc.contents = value ? composeNode.composeNode(ctx, value, props, onError) : composeNode.composeEmptyNode(ctx, props.end, start, null, props, onError);
      const contentEnd = doc.contents.range[2];
      const re = resolveEnd.resolveEnd(end, contentEnd, false, onError);
      if (re.comment)
        doc.comment = re.comment;
      doc.range = [offset, contentEnd, re.offset];
      return doc;
    }
    exports.composeDoc = composeDoc;
  }
});

// node_modules/yaml/dist/compose/composer.js
var require_composer = __commonJS({
  "node_modules/yaml/dist/compose/composer.js"(exports) {
    "use strict";
    var node_process = __require("process");
    var directives = require_directives();
    var Document = require_Document();
    var errors = require_errors();
    var identity = require_identity();
    var composeDoc = require_compose_doc();
    var resolveEnd = require_resolve_end();
    function getErrorPos(src) {
      if (typeof src === "number")
        return [src, src + 1];
      if (Array.isArray(src))
        return src.length === 2 ? src : [src[0], src[1]];
      const { offset, source } = src;
      return [offset, offset + (typeof source === "string" ? source.length : 1)];
    }
    function parsePrelude(prelude) {
      let comment = "";
      let atComment = false;
      let afterEmptyLine = false;
      for (let i = 0; i < prelude.length; ++i) {
        const source = prelude[i];
        switch (source[0]) {
          case "#":
            comment += (comment === "" ? "" : afterEmptyLine ? "\n\n" : "\n") + (source.substring(1) || " ");
            atComment = true;
            afterEmptyLine = false;
            break;
          case "%":
            if (prelude[i + 1]?.[0] !== "#")
              i += 1;
            atComment = false;
            break;
          default:
            if (!atComment)
              afterEmptyLine = true;
            atComment = false;
        }
      }
      return { comment, afterEmptyLine };
    }
    var Composer = class {
      constructor(options = {}) {
        this.doc = null;
        this.atDirectives = false;
        this.prelude = [];
        this.errors = [];
        this.warnings = [];
        this.onError = (source, code, message, warning) => {
          const pos = getErrorPos(source);
          if (warning)
            this.warnings.push(new errors.YAMLWarning(pos, code, message));
          else
            this.errors.push(new errors.YAMLParseError(pos, code, message));
        };
        this.directives = new directives.Directives({ version: options.version || "1.2" });
        this.options = options;
      }
      decorate(doc, afterDoc) {
        const { comment, afterEmptyLine } = parsePrelude(this.prelude);
        if (comment) {
          const dc = doc.contents;
          if (afterDoc) {
            doc.comment = doc.comment ? `${doc.comment}
${comment}` : comment;
          } else if (afterEmptyLine || doc.directives.docStart || !dc) {
            doc.commentBefore = comment;
          } else if (identity.isCollection(dc) && !dc.flow && dc.items.length > 0) {
            let it = dc.items[0];
            if (identity.isPair(it))
              it = it.key;
            const cb = it.commentBefore;
            it.commentBefore = cb ? `${comment}
${cb}` : comment;
          } else {
            const cb = dc.commentBefore;
            dc.commentBefore = cb ? `${comment}
${cb}` : comment;
          }
        }
        if (afterDoc) {
          for (let i = 0; i < this.errors.length; ++i)
            doc.errors.push(this.errors[i]);
          for (let i = 0; i < this.warnings.length; ++i)
            doc.warnings.push(this.warnings[i]);
        } else {
          doc.errors = this.errors;
          doc.warnings = this.warnings;
        }
        this.prelude = [];
        this.errors = [];
        this.warnings = [];
      }
      /**
       * Current stream status information.
       *
       * Mostly useful at the end of input for an empty stream.
       */
      streamInfo() {
        return {
          comment: parsePrelude(this.prelude).comment,
          directives: this.directives,
          errors: this.errors,
          warnings: this.warnings
        };
      }
      /**
       * Compose tokens into documents.
       *
       * @param forceDoc - If the stream contains no document, still emit a final document including any comments and directives that would be applied to a subsequent document.
       * @param endOffset - Should be set if `forceDoc` is also set, to set the document range end and to indicate errors correctly.
       */
      *compose(tokens, forceDoc = false, endOffset = -1) {
        for (const token of tokens)
          yield* this.next(token);
        yield* this.end(forceDoc, endOffset);
      }
      /** Advance the composer by one CST token. */
      *next(token) {
        if (node_process.env.LOG_STREAM)
          console.dir(token, { depth: null });
        switch (token.type) {
          case "directive":
            this.directives.add(token.source, (offset, message, warning) => {
              const pos = getErrorPos(token);
              pos[0] += offset;
              this.onError(pos, "BAD_DIRECTIVE", message, warning);
            });
            this.prelude.push(token.source);
            this.atDirectives = true;
            break;
          case "document": {
            const doc = composeDoc.composeDoc(this.options, this.directives, token, this.onError);
            if (this.atDirectives && !doc.directives.docStart)
              this.onError(token, "MISSING_CHAR", "Missing directives-end/doc-start indicator line");
            this.decorate(doc, false);
            if (this.doc)
              yield this.doc;
            this.doc = doc;
            this.atDirectives = false;
            break;
          }
          case "byte-order-mark":
          case "space":
            break;
          case "comment":
          case "newline":
            this.prelude.push(token.source);
            break;
          case "error": {
            const msg = token.source ? `${token.message}: ${JSON.stringify(token.source)}` : token.message;
            const error = new errors.YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", msg);
            if (this.atDirectives || !this.doc)
              this.errors.push(error);
            else
              this.doc.errors.push(error);
            break;
          }
          case "doc-end": {
            if (!this.doc) {
              const msg = "Unexpected doc-end without preceding document";
              this.errors.push(new errors.YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", msg));
              break;
            }
            this.doc.directives.docEnd = true;
            const end = resolveEnd.resolveEnd(token.end, token.offset + token.source.length, this.doc.options.strict, this.onError);
            this.decorate(this.doc, true);
            if (end.comment) {
              const dc = this.doc.comment;
              this.doc.comment = dc ? `${dc}
${end.comment}` : end.comment;
            }
            this.doc.range[2] = end.offset;
            break;
          }
          default:
            this.errors.push(new errors.YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", `Unsupported token ${token.type}`));
        }
      }
      /**
       * Call at end of input to yield any remaining document.
       *
       * @param forceDoc - If the stream contains no document, still emit a final document including any comments and directives that would be applied to a subsequent document.
       * @param endOffset - Should be set if `forceDoc` is also set, to set the document range end and to indicate errors correctly.
       */
      *end(forceDoc = false, endOffset = -1) {
        if (this.doc) {
          this.decorate(this.doc, true);
          yield this.doc;
          this.doc = null;
        } else if (forceDoc) {
          const opts = Object.assign({ _directives: this.directives }, this.options);
          const doc = new Document.Document(void 0, opts);
          if (this.atDirectives)
            this.onError(endOffset, "MISSING_CHAR", "Missing directives-end indicator line");
          doc.range = [0, endOffset, endOffset];
          this.decorate(doc, false);
          yield doc;
        }
      }
    };
    exports.Composer = Composer;
  }
});

// node_modules/yaml/dist/parse/cst-scalar.js
var require_cst_scalar = __commonJS({
  "node_modules/yaml/dist/parse/cst-scalar.js"(exports) {
    "use strict";
    var resolveBlockScalar = require_resolve_block_scalar();
    var resolveFlowScalar = require_resolve_flow_scalar();
    var errors = require_errors();
    var stringifyString = require_stringifyString();
    function resolveAsScalar(token, strict = true, onError) {
      if (token) {
        const _onError = (pos, code, message) => {
          const offset = typeof pos === "number" ? pos : Array.isArray(pos) ? pos[0] : pos.offset;
          if (onError)
            onError(offset, code, message);
          else
            throw new errors.YAMLParseError([offset, offset + 1], code, message);
        };
        switch (token.type) {
          case "scalar":
          case "single-quoted-scalar":
          case "double-quoted-scalar":
            return resolveFlowScalar.resolveFlowScalar(token, strict, _onError);
          case "block-scalar":
            return resolveBlockScalar.resolveBlockScalar({ options: { strict } }, token, _onError);
        }
      }
      return null;
    }
    function createScalarToken(value, context) {
      const { implicitKey = false, indent, inFlow = false, offset = -1, type = "PLAIN" } = context;
      const source = stringifyString.stringifyString({ type, value }, {
        implicitKey,
        indent: indent > 0 ? " ".repeat(indent) : "",
        inFlow,
        options: { blockQuote: true, lineWidth: -1 }
      });
      const end = context.end ?? [
        { type: "newline", offset: -1, indent, source: "\n" }
      ];
      switch (source[0]) {
        case "|":
        case ">": {
          const he = source.indexOf("\n");
          const head = source.substring(0, he);
          const body = source.substring(he + 1) + "\n";
          const props = [
            { type: "block-scalar-header", offset, indent, source: head }
          ];
          if (!addEndtoBlockProps(props, end))
            props.push({ type: "newline", offset: -1, indent, source: "\n" });
          return { type: "block-scalar", offset, indent, props, source: body };
        }
        case '"':
          return { type: "double-quoted-scalar", offset, indent, source, end };
        case "'":
          return { type: "single-quoted-scalar", offset, indent, source, end };
        default:
          return { type: "scalar", offset, indent, source, end };
      }
    }
    function setScalarValue(token, value, context = {}) {
      let { afterKey = false, implicitKey = false, inFlow = false, type } = context;
      let indent = "indent" in token ? token.indent : null;
      if (afterKey && typeof indent === "number")
        indent += 2;
      if (!type)
        switch (token.type) {
          case "single-quoted-scalar":
            type = "QUOTE_SINGLE";
            break;
          case "double-quoted-scalar":
            type = "QUOTE_DOUBLE";
            break;
          case "block-scalar": {
            const header = token.props[0];
            if (header.type !== "block-scalar-header")
              throw new Error("Invalid block scalar header");
            type = header.source[0] === ">" ? "BLOCK_FOLDED" : "BLOCK_LITERAL";
            break;
          }
          default:
            type = "PLAIN";
        }
      const source = stringifyString.stringifyString({ type, value }, {
        implicitKey: implicitKey || indent === null,
        indent: indent !== null && indent > 0 ? " ".repeat(indent) : "",
        inFlow,
        options: { blockQuote: true, lineWidth: -1 }
      });
      switch (source[0]) {
        case "|":
        case ">":
          setBlockScalarValue(token, source);
          break;
        case '"':
          setFlowScalarValue(token, source, "double-quoted-scalar");
          break;
        case "'":
          setFlowScalarValue(token, source, "single-quoted-scalar");
          break;
        default:
          setFlowScalarValue(token, source, "scalar");
      }
    }
    function setBlockScalarValue(token, source) {
      const he = source.indexOf("\n");
      const head = source.substring(0, he);
      const body = source.substring(he + 1) + "\n";
      if (token.type === "block-scalar") {
        const header = token.props[0];
        if (header.type !== "block-scalar-header")
          throw new Error("Invalid block scalar header");
        header.source = head;
        token.source = body;
      } else {
        const { offset } = token;
        const indent = "indent" in token ? token.indent : -1;
        const props = [
          { type: "block-scalar-header", offset, indent, source: head }
        ];
        if (!addEndtoBlockProps(props, "end" in token ? token.end : void 0))
          props.push({ type: "newline", offset: -1, indent, source: "\n" });
        for (const key of Object.keys(token))
          if (key !== "type" && key !== "offset")
            delete token[key];
        Object.assign(token, { type: "block-scalar", indent, props, source: body });
      }
    }
    function addEndtoBlockProps(props, end) {
      if (end)
        for (const st of end)
          switch (st.type) {
            case "space":
            case "comment":
              props.push(st);
              break;
            case "newline":
              props.push(st);
              return true;
          }
      return false;
    }
    function setFlowScalarValue(token, source, type) {
      switch (token.type) {
        case "scalar":
        case "double-quoted-scalar":
        case "single-quoted-scalar":
          token.type = type;
          token.source = source;
          break;
        case "block-scalar": {
          const end = token.props.slice(1);
          let oa = source.length;
          if (token.props[0].type === "block-scalar-header")
            oa -= token.props[0].source.length;
          for (const tok of end)
            tok.offset += oa;
          delete token.props;
          Object.assign(token, { type, source, end });
          break;
        }
        case "block-map":
        case "block-seq": {
          const offset = token.offset + source.length;
          const nl = { type: "newline", offset, indent: token.indent, source: "\n" };
          delete token.items;
          Object.assign(token, { type, source, end: [nl] });
          break;
        }
        default: {
          const indent = "indent" in token ? token.indent : -1;
          const end = "end" in token && Array.isArray(token.end) ? token.end.filter((st) => st.type === "space" || st.type === "comment" || st.type === "newline") : [];
          for (const key of Object.keys(token))
            if (key !== "type" && key !== "offset")
              delete token[key];
          Object.assign(token, { type, indent, source, end });
        }
      }
    }
    exports.createScalarToken = createScalarToken;
    exports.resolveAsScalar = resolveAsScalar;
    exports.setScalarValue = setScalarValue;
  }
});

// node_modules/yaml/dist/parse/cst-stringify.js
var require_cst_stringify = __commonJS({
  "node_modules/yaml/dist/parse/cst-stringify.js"(exports) {
    "use strict";
    var stringify = (cst) => "type" in cst ? stringifyToken(cst) : stringifyItem(cst);
    function stringifyToken(token) {
      switch (token.type) {
        case "block-scalar": {
          let res = "";
          for (const tok of token.props)
            res += stringifyToken(tok);
          return res + token.source;
        }
        case "block-map":
        case "block-seq": {
          let res = "";
          for (const item of token.items)
            res += stringifyItem(item);
          return res;
        }
        case "flow-collection": {
          let res = token.start.source;
          for (const item of token.items)
            res += stringifyItem(item);
          for (const st of token.end)
            res += st.source;
          return res;
        }
        case "document": {
          let res = stringifyItem(token);
          if (token.end)
            for (const st of token.end)
              res += st.source;
          return res;
        }
        default: {
          let res = token.source;
          if ("end" in token && token.end)
            for (const st of token.end)
              res += st.source;
          return res;
        }
      }
    }
    function stringifyItem({ start, key, sep, value }) {
      let res = "";
      for (const st of start)
        res += st.source;
      if (key)
        res += stringifyToken(key);
      if (sep)
        for (const st of sep)
          res += st.source;
      if (value)
        res += stringifyToken(value);
      return res;
    }
    exports.stringify = stringify;
  }
});

// node_modules/yaml/dist/parse/cst-visit.js
var require_cst_visit = __commonJS({
  "node_modules/yaml/dist/parse/cst-visit.js"(exports) {
    "use strict";
    var BREAK = /* @__PURE__ */ Symbol("break visit");
    var SKIP = /* @__PURE__ */ Symbol("skip children");
    var REMOVE = /* @__PURE__ */ Symbol("remove item");
    function visit(cst, visitor) {
      if ("type" in cst && cst.type === "document")
        cst = { start: cst.start, value: cst.value };
      _visit(Object.freeze([]), cst, visitor);
    }
    visit.BREAK = BREAK;
    visit.SKIP = SKIP;
    visit.REMOVE = REMOVE;
    visit.itemAtPath = (cst, path2) => {
      let item = cst;
      for (const [field, index] of path2) {
        const tok = item?.[field];
        if (tok && "items" in tok) {
          item = tok.items[index];
        } else
          return void 0;
      }
      return item;
    };
    visit.parentCollection = (cst, path2) => {
      const parent = visit.itemAtPath(cst, path2.slice(0, -1));
      const field = path2[path2.length - 1][0];
      const coll = parent?.[field];
      if (coll && "items" in coll)
        return coll;
      throw new Error("Parent collection not found");
    };
    function _visit(path2, item, visitor) {
      let ctrl = visitor(item, path2);
      if (typeof ctrl === "symbol")
        return ctrl;
      for (const field of ["key", "value"]) {
        const token = item[field];
        if (token && "items" in token) {
          for (let i = 0; i < token.items.length; ++i) {
            const ci = _visit(Object.freeze(path2.concat([[field, i]])), token.items[i], visitor);
            if (typeof ci === "number")
              i = ci - 1;
            else if (ci === BREAK)
              return BREAK;
            else if (ci === REMOVE) {
              token.items.splice(i, 1);
              i -= 1;
            }
          }
          if (typeof ctrl === "function" && field === "key")
            ctrl = ctrl(item, path2);
        }
      }
      return typeof ctrl === "function" ? ctrl(item, path2) : ctrl;
    }
    exports.visit = visit;
  }
});

// node_modules/yaml/dist/parse/cst.js
var require_cst = __commonJS({
  "node_modules/yaml/dist/parse/cst.js"(exports) {
    "use strict";
    var cstScalar = require_cst_scalar();
    var cstStringify = require_cst_stringify();
    var cstVisit = require_cst_visit();
    var BOM = "\uFEFF";
    var DOCUMENT = "";
    var FLOW_END = "";
    var SCALAR = "";
    var isCollection = (token) => !!token && "items" in token;
    var isScalar = (token) => !!token && (token.type === "scalar" || token.type === "single-quoted-scalar" || token.type === "double-quoted-scalar" || token.type === "block-scalar");
    function prettyToken(token) {
      switch (token) {
        case BOM:
          return "<BOM>";
        case DOCUMENT:
          return "<DOC>";
        case FLOW_END:
          return "<FLOW_END>";
        case SCALAR:
          return "<SCALAR>";
        default:
          return JSON.stringify(token);
      }
    }
    function tokenType(source) {
      switch (source) {
        case BOM:
          return "byte-order-mark";
        case DOCUMENT:
          return "doc-mode";
        case FLOW_END:
          return "flow-error-end";
        case SCALAR:
          return "scalar";
        case "---":
          return "doc-start";
        case "...":
          return "doc-end";
        case "":
        case "\n":
        case "\r\n":
          return "newline";
        case "-":
          return "seq-item-ind";
        case "?":
          return "explicit-key-ind";
        case ":":
          return "map-value-ind";
        case "{":
          return "flow-map-start";
        case "}":
          return "flow-map-end";
        case "[":
          return "flow-seq-start";
        case "]":
          return "flow-seq-end";
        case ",":
          return "comma";
      }
      switch (source[0]) {
        case " ":
        case "	":
          return "space";
        case "#":
          return "comment";
        case "%":
          return "directive-line";
        case "*":
          return "alias";
        case "&":
          return "anchor";
        case "!":
          return "tag";
        case "'":
          return "single-quoted-scalar";
        case '"':
          return "double-quoted-scalar";
        case "|":
        case ">":
          return "block-scalar-header";
      }
      return null;
    }
    exports.createScalarToken = cstScalar.createScalarToken;
    exports.resolveAsScalar = cstScalar.resolveAsScalar;
    exports.setScalarValue = cstScalar.setScalarValue;
    exports.stringify = cstStringify.stringify;
    exports.visit = cstVisit.visit;
    exports.BOM = BOM;
    exports.DOCUMENT = DOCUMENT;
    exports.FLOW_END = FLOW_END;
    exports.SCALAR = SCALAR;
    exports.isCollection = isCollection;
    exports.isScalar = isScalar;
    exports.prettyToken = prettyToken;
    exports.tokenType = tokenType;
  }
});

// node_modules/yaml/dist/parse/lexer.js
var require_lexer = __commonJS({
  "node_modules/yaml/dist/parse/lexer.js"(exports) {
    "use strict";
    var cst = require_cst();
    function isEmpty(ch) {
      switch (ch) {
        case void 0:
        case " ":
        case "\n":
        case "\r":
        case "	":
          return true;
        default:
          return false;
      }
    }
    var hexDigits = new Set("0123456789ABCDEFabcdef");
    var tagChars = new Set("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-#;/?:@&=+$_.!~*'()");
    var flowIndicatorChars = new Set(",[]{}");
    var invalidAnchorChars = new Set(" ,[]{}\n\r	");
    var isNotAnchorChar = (ch) => !ch || invalidAnchorChars.has(ch);
    var Lexer = class {
      constructor() {
        this.atEnd = false;
        this.blockScalarIndent = -1;
        this.blockScalarKeep = false;
        this.buffer = "";
        this.flowKey = false;
        this.flowLevel = 0;
        this.indentNext = 0;
        this.indentValue = 0;
        this.lineEndPos = null;
        this.next = null;
        this.pos = 0;
      }
      /**
       * Generate YAML tokens from the `source` string. If `incomplete`,
       * a part of the last line may be left as a buffer for the next call.
       *
       * @returns A generator of lexical tokens
       */
      *lex(source, incomplete = false) {
        if (source) {
          if (typeof source !== "string")
            throw TypeError("source is not a string");
          this.buffer = this.buffer ? this.buffer + source : source;
          this.lineEndPos = null;
        }
        this.atEnd = !incomplete;
        let next = this.next ?? "stream";
        while (next && (incomplete || this.hasChars(1)))
          next = yield* this.parseNext(next);
      }
      atLineEnd() {
        let i = this.pos;
        let ch = this.buffer[i];
        while (ch === " " || ch === "	")
          ch = this.buffer[++i];
        if (!ch || ch === "#" || ch === "\n")
          return true;
        if (ch === "\r")
          return this.buffer[i + 1] === "\n";
        return false;
      }
      charAt(n) {
        return this.buffer[this.pos + n];
      }
      continueScalar(offset) {
        let ch = this.buffer[offset];
        if (this.indentNext > 0) {
          let indent = 0;
          while (ch === " ")
            ch = this.buffer[++indent + offset];
          if (ch === "\r") {
            const next = this.buffer[indent + offset + 1];
            if (next === "\n" || !next && !this.atEnd)
              return offset + indent + 1;
          }
          return ch === "\n" || indent >= this.indentNext || !ch && !this.atEnd ? offset + indent : -1;
        }
        if (ch === "-" || ch === ".") {
          const dt = this.buffer.substr(offset, 3);
          if ((dt === "---" || dt === "...") && isEmpty(this.buffer[offset + 3]))
            return -1;
        }
        return offset;
      }
      getLine() {
        let end = this.lineEndPos;
        if (typeof end !== "number" || end !== -1 && end < this.pos) {
          end = this.buffer.indexOf("\n", this.pos);
          this.lineEndPos = end;
        }
        if (end === -1)
          return this.atEnd ? this.buffer.substring(this.pos) : null;
        if (this.buffer[end - 1] === "\r")
          end -= 1;
        return this.buffer.substring(this.pos, end);
      }
      hasChars(n) {
        return this.pos + n <= this.buffer.length;
      }
      setNext(state) {
        this.buffer = this.buffer.substring(this.pos);
        this.pos = 0;
        this.lineEndPos = null;
        this.next = state;
        return null;
      }
      peek(n) {
        return this.buffer.substr(this.pos, n);
      }
      *parseNext(next) {
        switch (next) {
          case "stream":
            return yield* this.parseStream();
          case "line-start":
            return yield* this.parseLineStart();
          case "block-start":
            return yield* this.parseBlockStart();
          case "doc":
            return yield* this.parseDocument();
          case "flow":
            return yield* this.parseFlowCollection();
          case "quoted-scalar":
            return yield* this.parseQuotedScalar();
          case "block-scalar":
            return yield* this.parseBlockScalar();
          case "plain-scalar":
            return yield* this.parsePlainScalar();
        }
      }
      *parseStream() {
        let line = this.getLine();
        if (line === null)
          return this.setNext("stream");
        if (line[0] === cst.BOM) {
          yield* this.pushCount(1);
          line = line.substring(1);
        }
        if (line[0] === "%") {
          let dirEnd = line.length;
          let cs = line.indexOf("#");
          while (cs !== -1) {
            const ch = line[cs - 1];
            if (ch === " " || ch === "	") {
              dirEnd = cs - 1;
              break;
            } else {
              cs = line.indexOf("#", cs + 1);
            }
          }
          while (true) {
            const ch = line[dirEnd - 1];
            if (ch === " " || ch === "	")
              dirEnd -= 1;
            else
              break;
          }
          const n = (yield* this.pushCount(dirEnd)) + (yield* this.pushSpaces(true));
          yield* this.pushCount(line.length - n);
          this.pushNewline();
          return "stream";
        }
        if (this.atLineEnd()) {
          const sp = yield* this.pushSpaces(true);
          yield* this.pushCount(line.length - sp);
          yield* this.pushNewline();
          return "stream";
        }
        yield cst.DOCUMENT;
        return yield* this.parseLineStart();
      }
      *parseLineStart() {
        const ch = this.charAt(0);
        if (!ch && !this.atEnd)
          return this.setNext("line-start");
        if (ch === "-" || ch === ".") {
          if (!this.atEnd && !this.hasChars(4))
            return this.setNext("line-start");
          const s = this.peek(3);
          if ((s === "---" || s === "...") && isEmpty(this.charAt(3))) {
            yield* this.pushCount(3);
            this.indentValue = 0;
            this.indentNext = 0;
            return s === "---" ? "doc" : "stream";
          }
        }
        this.indentValue = yield* this.pushSpaces(false);
        if (this.indentNext > this.indentValue && !isEmpty(this.charAt(1)))
          this.indentNext = this.indentValue;
        return yield* this.parseBlockStart();
      }
      *parseBlockStart() {
        const [ch0, ch1] = this.peek(2);
        if (!ch1 && !this.atEnd)
          return this.setNext("block-start");
        if ((ch0 === "-" || ch0 === "?" || ch0 === ":") && isEmpty(ch1)) {
          const n = (yield* this.pushCount(1)) + (yield* this.pushSpaces(true));
          this.indentNext = this.indentValue + 1;
          this.indentValue += n;
          return "block-start";
        }
        return "doc";
      }
      *parseDocument() {
        yield* this.pushSpaces(true);
        const line = this.getLine();
        if (line === null)
          return this.setNext("doc");
        let n = yield* this.pushIndicators();
        switch (line[n]) {
          case "#":
            yield* this.pushCount(line.length - n);
          // fallthrough
          case void 0:
            yield* this.pushNewline();
            return yield* this.parseLineStart();
          case "{":
          case "[":
            yield* this.pushCount(1);
            this.flowKey = false;
            this.flowLevel = 1;
            return "flow";
          case "}":
          case "]":
            yield* this.pushCount(1);
            return "doc";
          case "*":
            yield* this.pushUntil(isNotAnchorChar);
            return "doc";
          case '"':
          case "'":
            return yield* this.parseQuotedScalar();
          case "|":
          case ">":
            n += yield* this.parseBlockScalarHeader();
            n += yield* this.pushSpaces(true);
            yield* this.pushCount(line.length - n);
            yield* this.pushNewline();
            return yield* this.parseBlockScalar();
          default:
            return yield* this.parsePlainScalar();
        }
      }
      *parseFlowCollection() {
        let nl, sp;
        let indent = -1;
        do {
          nl = yield* this.pushNewline();
          if (nl > 0) {
            sp = yield* this.pushSpaces(false);
            this.indentValue = indent = sp;
          } else {
            sp = 0;
          }
          sp += yield* this.pushSpaces(true);
        } while (nl + sp > 0);
        const line = this.getLine();
        if (line === null)
          return this.setNext("flow");
        if (indent !== -1 && indent < this.indentNext && line[0] !== "#" || indent === 0 && (line.startsWith("---") || line.startsWith("...")) && isEmpty(line[3])) {
          const atFlowEndMarker = indent === this.indentNext - 1 && this.flowLevel === 1 && (line[0] === "]" || line[0] === "}");
          if (!atFlowEndMarker) {
            this.flowLevel = 0;
            yield cst.FLOW_END;
            return yield* this.parseLineStart();
          }
        }
        let n = 0;
        while (line[n] === ",") {
          n += yield* this.pushCount(1);
          n += yield* this.pushSpaces(true);
          this.flowKey = false;
        }
        n += yield* this.pushIndicators();
        switch (line[n]) {
          case void 0:
            return "flow";
          case "#":
            yield* this.pushCount(line.length - n);
            return "flow";
          case "{":
          case "[":
            yield* this.pushCount(1);
            this.flowKey = false;
            this.flowLevel += 1;
            return "flow";
          case "}":
          case "]":
            yield* this.pushCount(1);
            this.flowKey = true;
            this.flowLevel -= 1;
            return this.flowLevel ? "flow" : "doc";
          case "*":
            yield* this.pushUntil(isNotAnchorChar);
            return "flow";
          case '"':
          case "'":
            this.flowKey = true;
            return yield* this.parseQuotedScalar();
          case ":": {
            const next = this.charAt(1);
            if (this.flowKey || isEmpty(next) || next === ",") {
              this.flowKey = false;
              yield* this.pushCount(1);
              yield* this.pushSpaces(true);
              return "flow";
            }
          }
          // fallthrough
          default:
            this.flowKey = false;
            return yield* this.parsePlainScalar();
        }
      }
      *parseQuotedScalar() {
        const quote = this.charAt(0);
        let end = this.buffer.indexOf(quote, this.pos + 1);
        if (quote === "'") {
          while (end !== -1 && this.buffer[end + 1] === "'")
            end = this.buffer.indexOf("'", end + 2);
        } else {
          while (end !== -1) {
            let n = 0;
            while (this.buffer[end - 1 - n] === "\\")
              n += 1;
            if (n % 2 === 0)
              break;
            end = this.buffer.indexOf('"', end + 1);
          }
        }
        const qb = this.buffer.substring(0, end);
        let nl = qb.indexOf("\n", this.pos);
        if (nl !== -1) {
          while (nl !== -1) {
            const cs = this.continueScalar(nl + 1);
            if (cs === -1)
              break;
            nl = qb.indexOf("\n", cs);
          }
          if (nl !== -1) {
            end = nl - (qb[nl - 1] === "\r" ? 2 : 1);
          }
        }
        if (end === -1) {
          if (!this.atEnd)
            return this.setNext("quoted-scalar");
          end = this.buffer.length;
        }
        yield* this.pushToIndex(end + 1, false);
        return this.flowLevel ? "flow" : "doc";
      }
      *parseBlockScalarHeader() {
        this.blockScalarIndent = -1;
        this.blockScalarKeep = false;
        let i = this.pos;
        while (true) {
          const ch = this.buffer[++i];
          if (ch === "+")
            this.blockScalarKeep = true;
          else if (ch > "0" && ch <= "9")
            this.blockScalarIndent = Number(ch) - 1;
          else if (ch !== "-")
            break;
        }
        return yield* this.pushUntil((ch) => isEmpty(ch) || ch === "#");
      }
      *parseBlockScalar() {
        let nl = this.pos - 1;
        let indent = 0;
        let ch;
        loop: for (let i2 = this.pos; ch = this.buffer[i2]; ++i2) {
          switch (ch) {
            case " ":
              indent += 1;
              break;
            case "\n":
              nl = i2;
              indent = 0;
              break;
            case "\r": {
              const next = this.buffer[i2 + 1];
              if (!next && !this.atEnd)
                return this.setNext("block-scalar");
              if (next === "\n")
                break;
            }
            // fallthrough
            default:
              break loop;
          }
        }
        if (!ch && !this.atEnd)
          return this.setNext("block-scalar");
        if (indent >= this.indentNext) {
          if (this.blockScalarIndent === -1)
            this.indentNext = indent;
          else {
            this.indentNext = this.blockScalarIndent + (this.indentNext === 0 ? 1 : this.indentNext);
          }
          do {
            const cs = this.continueScalar(nl + 1);
            if (cs === -1)
              break;
            nl = this.buffer.indexOf("\n", cs);
          } while (nl !== -1);
          if (nl === -1) {
            if (!this.atEnd)
              return this.setNext("block-scalar");
            nl = this.buffer.length;
          }
        }
        let i = nl + 1;
        ch = this.buffer[i];
        while (ch === " ")
          ch = this.buffer[++i];
        if (ch === "	") {
          while (ch === "	" || ch === " " || ch === "\r" || ch === "\n")
            ch = this.buffer[++i];
          nl = i - 1;
        } else if (!this.blockScalarKeep) {
          do {
            let i2 = nl - 1;
            let ch2 = this.buffer[i2];
            if (ch2 === "\r")
              ch2 = this.buffer[--i2];
            const lastChar = i2;
            while (ch2 === " ")
              ch2 = this.buffer[--i2];
            if (ch2 === "\n" && i2 >= this.pos && i2 + 1 + indent > lastChar)
              nl = i2;
            else
              break;
          } while (true);
        }
        yield cst.SCALAR;
        yield* this.pushToIndex(nl + 1, true);
        return yield* this.parseLineStart();
      }
      *parsePlainScalar() {
        const inFlow = this.flowLevel > 0;
        let end = this.pos - 1;
        let i = this.pos - 1;
        let ch;
        while (ch = this.buffer[++i]) {
          if (ch === ":") {
            const next = this.buffer[i + 1];
            if (isEmpty(next) || inFlow && flowIndicatorChars.has(next))
              break;
            end = i;
          } else if (isEmpty(ch)) {
            let next = this.buffer[i + 1];
            if (ch === "\r") {
              if (next === "\n") {
                i += 1;
                ch = "\n";
                next = this.buffer[i + 1];
              } else
                end = i;
            }
            if (next === "#" || inFlow && flowIndicatorChars.has(next))
              break;
            if (ch === "\n") {
              const cs = this.continueScalar(i + 1);
              if (cs === -1)
                break;
              i = Math.max(i, cs - 2);
            }
          } else {
            if (inFlow && flowIndicatorChars.has(ch))
              break;
            end = i;
          }
        }
        if (!ch && !this.atEnd)
          return this.setNext("plain-scalar");
        yield cst.SCALAR;
        yield* this.pushToIndex(end + 1, true);
        return inFlow ? "flow" : "doc";
      }
      *pushCount(n) {
        if (n > 0) {
          yield this.buffer.substr(this.pos, n);
          this.pos += n;
          return n;
        }
        return 0;
      }
      *pushToIndex(i, allowEmpty) {
        const s = this.buffer.slice(this.pos, i);
        if (s) {
          yield s;
          this.pos += s.length;
          return s.length;
        } else if (allowEmpty)
          yield "";
        return 0;
      }
      *pushIndicators() {
        let n = 0;
        loop: while (true) {
          switch (this.charAt(0)) {
            case "!":
              n += yield* this.pushTag();
              n += yield* this.pushSpaces(true);
              continue loop;
            case "&":
              n += yield* this.pushUntil(isNotAnchorChar);
              n += yield* this.pushSpaces(true);
              continue loop;
            case "-":
            // this is an error
            case "?":
            // this is an error outside flow collections
            case ":": {
              const inFlow = this.flowLevel > 0;
              const ch1 = this.charAt(1);
              if (isEmpty(ch1) || inFlow && flowIndicatorChars.has(ch1)) {
                if (!inFlow)
                  this.indentNext = this.indentValue + 1;
                else if (this.flowKey)
                  this.flowKey = false;
                n += yield* this.pushCount(1);
                n += yield* this.pushSpaces(true);
                continue loop;
              }
            }
          }
          break loop;
        }
        return n;
      }
      *pushTag() {
        if (this.charAt(1) === "<") {
          let i = this.pos + 2;
          let ch = this.buffer[i];
          while (!isEmpty(ch) && ch !== ">")
            ch = this.buffer[++i];
          return yield* this.pushToIndex(ch === ">" ? i + 1 : i, false);
        } else {
          let i = this.pos + 1;
          let ch = this.buffer[i];
          while (ch) {
            if (tagChars.has(ch))
              ch = this.buffer[++i];
            else if (ch === "%" && hexDigits.has(this.buffer[i + 1]) && hexDigits.has(this.buffer[i + 2])) {
              ch = this.buffer[i += 3];
            } else
              break;
          }
          return yield* this.pushToIndex(i, false);
        }
      }
      *pushNewline() {
        const ch = this.buffer[this.pos];
        if (ch === "\n")
          return yield* this.pushCount(1);
        else if (ch === "\r" && this.charAt(1) === "\n")
          return yield* this.pushCount(2);
        else
          return 0;
      }
      *pushSpaces(allowTabs) {
        let i = this.pos - 1;
        let ch;
        do {
          ch = this.buffer[++i];
        } while (ch === " " || allowTabs && ch === "	");
        const n = i - this.pos;
        if (n > 0) {
          yield this.buffer.substr(this.pos, n);
          this.pos = i;
        }
        return n;
      }
      *pushUntil(test) {
        let i = this.pos;
        let ch = this.buffer[i];
        while (!test(ch))
          ch = this.buffer[++i];
        return yield* this.pushToIndex(i, false);
      }
    };
    exports.Lexer = Lexer;
  }
});

// node_modules/yaml/dist/parse/line-counter.js
var require_line_counter = __commonJS({
  "node_modules/yaml/dist/parse/line-counter.js"(exports) {
    "use strict";
    var LineCounter = class {
      constructor() {
        this.lineStarts = [];
        this.addNewLine = (offset) => this.lineStarts.push(offset);
        this.linePos = (offset) => {
          let low = 0;
          let high = this.lineStarts.length;
          while (low < high) {
            const mid = low + high >> 1;
            if (this.lineStarts[mid] < offset)
              low = mid + 1;
            else
              high = mid;
          }
          if (this.lineStarts[low] === offset)
            return { line: low + 1, col: 1 };
          if (low === 0)
            return { line: 0, col: offset };
          const start = this.lineStarts[low - 1];
          return { line: low, col: offset - start + 1 };
        };
      }
    };
    exports.LineCounter = LineCounter;
  }
});

// node_modules/yaml/dist/parse/parser.js
var require_parser = __commonJS({
  "node_modules/yaml/dist/parse/parser.js"(exports) {
    "use strict";
    var node_process = __require("process");
    var cst = require_cst();
    var lexer = require_lexer();
    function includesToken(list, type) {
      for (let i = 0; i < list.length; ++i)
        if (list[i].type === type)
          return true;
      return false;
    }
    function findNonEmptyIndex(list) {
      for (let i = 0; i < list.length; ++i) {
        switch (list[i].type) {
          case "space":
          case "comment":
          case "newline":
            break;
          default:
            return i;
        }
      }
      return -1;
    }
    function isFlowToken(token) {
      switch (token?.type) {
        case "alias":
        case "scalar":
        case "single-quoted-scalar":
        case "double-quoted-scalar":
        case "flow-collection":
          return true;
        default:
          return false;
      }
    }
    function getPrevProps(parent) {
      switch (parent.type) {
        case "document":
          return parent.start;
        case "block-map": {
          const it = parent.items[parent.items.length - 1];
          return it.sep ?? it.start;
        }
        case "block-seq":
          return parent.items[parent.items.length - 1].start;
        /* istanbul ignore next should not happen */
        default:
          return [];
      }
    }
    function getFirstKeyStartProps(prev) {
      if (prev.length === 0)
        return [];
      let i = prev.length;
      loop: while (--i >= 0) {
        switch (prev[i].type) {
          case "doc-start":
          case "explicit-key-ind":
          case "map-value-ind":
          case "seq-item-ind":
          case "newline":
            break loop;
        }
      }
      while (prev[++i]?.type === "space") {
      }
      return prev.splice(i, prev.length);
    }
    function arrayPushArray(target, source) {
      if (source.length < 1e5)
        Array.prototype.push.apply(target, source);
      else
        for (let i = 0; i < source.length; ++i)
          target.push(source[i]);
    }
    function fixFlowSeqItems(fc) {
      if (fc.start.type === "flow-seq-start") {
        for (const it of fc.items) {
          if (it.sep && !it.value && !includesToken(it.start, "explicit-key-ind") && !includesToken(it.sep, "map-value-ind")) {
            if (it.key)
              it.value = it.key;
            delete it.key;
            if (isFlowToken(it.value)) {
              if (it.value.end)
                arrayPushArray(it.value.end, it.sep);
              else
                it.value.end = it.sep;
            } else
              arrayPushArray(it.start, it.sep);
            delete it.sep;
          }
        }
      }
    }
    var Parser = class {
      /**
       * @param onNewLine - If defined, called separately with the start position of
       *   each new line (in `parse()`, including the start of input).
       */
      constructor(onNewLine) {
        this.atNewLine = true;
        this.atScalar = false;
        this.indent = 0;
        this.offset = 0;
        this.onKeyLine = false;
        this.stack = [];
        this.source = "";
        this.type = "";
        this.lexer = new lexer.Lexer();
        this.onNewLine = onNewLine;
      }
      /**
       * Parse `source` as a YAML stream.
       * If `incomplete`, a part of the last line may be left as a buffer for the next call.
       *
       * Errors are not thrown, but yielded as `{ type: 'error', message }` tokens.
       *
       * @returns A generator of tokens representing each directive, document, and other structure.
       */
      *parse(source, incomplete = false) {
        if (this.onNewLine && this.offset === 0)
          this.onNewLine(0);
        for (const lexeme of this.lexer.lex(source, incomplete))
          yield* this.next(lexeme);
        if (!incomplete)
          yield* this.end();
      }
      /**
       * Advance the parser by the `source` of one lexical token.
       */
      *next(source) {
        this.source = source;
        if (node_process.env.LOG_TOKENS)
          console.log("|", cst.prettyToken(source));
        if (this.atScalar) {
          this.atScalar = false;
          yield* this.step();
          this.offset += source.length;
          return;
        }
        const type = cst.tokenType(source);
        if (!type) {
          const message = `Not a YAML token: ${source}`;
          yield* this.pop({ type: "error", offset: this.offset, message, source });
          this.offset += source.length;
        } else if (type === "scalar") {
          this.atNewLine = false;
          this.atScalar = true;
          this.type = "scalar";
        } else {
          this.type = type;
          yield* this.step();
          switch (type) {
            case "newline":
              this.atNewLine = true;
              this.indent = 0;
              if (this.onNewLine)
                this.onNewLine(this.offset + source.length);
              break;
            case "space":
              if (this.atNewLine && source[0] === " ")
                this.indent += source.length;
              break;
            case "explicit-key-ind":
            case "map-value-ind":
            case "seq-item-ind":
              if (this.atNewLine)
                this.indent += source.length;
              break;
            case "doc-mode":
            case "flow-error-end":
              return;
            default:
              this.atNewLine = false;
          }
          this.offset += source.length;
        }
      }
      /** Call at end of input to push out any remaining constructions */
      *end() {
        while (this.stack.length > 0)
          yield* this.pop();
      }
      get sourceToken() {
        const st = {
          type: this.type,
          offset: this.offset,
          indent: this.indent,
          source: this.source
        };
        return st;
      }
      *step() {
        const top = this.peek(1);
        if (this.type === "doc-end" && top?.type !== "doc-end") {
          while (this.stack.length > 0)
            yield* this.pop();
          this.stack.push({
            type: "doc-end",
            offset: this.offset,
            source: this.source
          });
          return;
        }
        if (!top)
          return yield* this.stream();
        switch (top.type) {
          case "document":
            return yield* this.document(top);
          case "alias":
          case "scalar":
          case "single-quoted-scalar":
          case "double-quoted-scalar":
            return yield* this.scalar(top);
          case "block-scalar":
            return yield* this.blockScalar(top);
          case "block-map":
            return yield* this.blockMap(top);
          case "block-seq":
            return yield* this.blockSequence(top);
          case "flow-collection":
            return yield* this.flowCollection(top);
          case "doc-end":
            return yield* this.documentEnd(top);
        }
        yield* this.pop();
      }
      peek(n) {
        return this.stack[this.stack.length - n];
      }
      *pop(error) {
        const token = error ?? this.stack.pop();
        if (!token) {
          const message = "Tried to pop an empty stack";
          yield { type: "error", offset: this.offset, source: "", message };
        } else if (this.stack.length === 0) {
          yield token;
        } else {
          const top = this.peek(1);
          if (token.type === "block-scalar") {
            token.indent = "indent" in top ? top.indent : 0;
          } else if (token.type === "flow-collection" && top.type === "document") {
            token.indent = 0;
          }
          if (token.type === "flow-collection")
            fixFlowSeqItems(token);
          switch (top.type) {
            case "document":
              top.value = token;
              break;
            case "block-scalar":
              top.props.push(token);
              break;
            case "block-map": {
              const it = top.items[top.items.length - 1];
              if (it.value) {
                top.items.push({ start: [], key: token, sep: [] });
                this.onKeyLine = true;
                return;
              } else if (it.sep) {
                it.value = token;
              } else {
                Object.assign(it, { key: token, sep: [] });
                this.onKeyLine = !it.explicitKey;
                return;
              }
              break;
            }
            case "block-seq": {
              const it = top.items[top.items.length - 1];
              if (it.value)
                top.items.push({ start: [], value: token });
              else
                it.value = token;
              break;
            }
            case "flow-collection": {
              const it = top.items[top.items.length - 1];
              if (!it || it.value)
                top.items.push({ start: [], key: token, sep: [] });
              else if (it.sep)
                it.value = token;
              else
                Object.assign(it, { key: token, sep: [] });
              return;
            }
            /* istanbul ignore next should not happen */
            default:
              yield* this.pop();
              yield* this.pop(token);
          }
          if ((top.type === "document" || top.type === "block-map" || top.type === "block-seq") && (token.type === "block-map" || token.type === "block-seq")) {
            const last = token.items[token.items.length - 1];
            if (last && !last.sep && !last.value && last.start.length > 0 && findNonEmptyIndex(last.start) === -1 && (token.indent === 0 || last.start.every((st) => st.type !== "comment" || st.indent < token.indent))) {
              if (top.type === "document")
                top.end = last.start;
              else
                top.items.push({ start: last.start });
              token.items.splice(-1, 1);
            }
          }
        }
      }
      *stream() {
        switch (this.type) {
          case "directive-line":
            yield { type: "directive", offset: this.offset, source: this.source };
            return;
          case "byte-order-mark":
          case "space":
          case "comment":
          case "newline":
            yield this.sourceToken;
            return;
          case "doc-mode":
          case "doc-start": {
            const doc = {
              type: "document",
              offset: this.offset,
              start: []
            };
            if (this.type === "doc-start")
              doc.start.push(this.sourceToken);
            this.stack.push(doc);
            return;
          }
        }
        yield {
          type: "error",
          offset: this.offset,
          message: `Unexpected ${this.type} token in YAML stream`,
          source: this.source
        };
      }
      *document(doc) {
        if (doc.value)
          return yield* this.lineEnd(doc);
        switch (this.type) {
          case "doc-start": {
            if (findNonEmptyIndex(doc.start) !== -1) {
              yield* this.pop();
              yield* this.step();
            } else
              doc.start.push(this.sourceToken);
            return;
          }
          case "anchor":
          case "tag":
          case "space":
          case "comment":
          case "newline":
            doc.start.push(this.sourceToken);
            return;
        }
        const bv = this.startBlockValue(doc);
        if (bv)
          this.stack.push(bv);
        else {
          yield {
            type: "error",
            offset: this.offset,
            message: `Unexpected ${this.type} token in YAML document`,
            source: this.source
          };
        }
      }
      *scalar(scalar) {
        if (this.type === "map-value-ind") {
          const prev = getPrevProps(this.peek(2));
          const start = getFirstKeyStartProps(prev);
          let sep;
          if (scalar.end) {
            sep = scalar.end;
            sep.push(this.sourceToken);
            delete scalar.end;
          } else
            sep = [this.sourceToken];
          const map = {
            type: "block-map",
            offset: scalar.offset,
            indent: scalar.indent,
            items: [{ start, key: scalar, sep }]
          };
          this.onKeyLine = true;
          this.stack[this.stack.length - 1] = map;
        } else
          yield* this.lineEnd(scalar);
      }
      *blockScalar(scalar) {
        switch (this.type) {
          case "space":
          case "comment":
          case "newline":
            scalar.props.push(this.sourceToken);
            return;
          case "scalar":
            scalar.source = this.source;
            this.atNewLine = true;
            this.indent = 0;
            if (this.onNewLine) {
              let nl = this.source.indexOf("\n") + 1;
              while (nl !== 0) {
                this.onNewLine(this.offset + nl);
                nl = this.source.indexOf("\n", nl) + 1;
              }
            }
            yield* this.pop();
            break;
          /* istanbul ignore next should not happen */
          default:
            yield* this.pop();
            yield* this.step();
        }
      }
      *blockMap(map) {
        const it = map.items[map.items.length - 1];
        switch (this.type) {
          case "newline":
            this.onKeyLine = false;
            if (it.value) {
              const end = "end" in it.value ? it.value.end : void 0;
              const last = Array.isArray(end) ? end[end.length - 1] : void 0;
              if (last?.type === "comment")
                end?.push(this.sourceToken);
              else
                map.items.push({ start: [this.sourceToken] });
            } else if (it.sep) {
              it.sep.push(this.sourceToken);
            } else {
              it.start.push(this.sourceToken);
            }
            return;
          case "space":
          case "comment":
            if (it.value) {
              map.items.push({ start: [this.sourceToken] });
            } else if (it.sep) {
              it.sep.push(this.sourceToken);
            } else {
              if (this.atIndentedComment(it.start, map.indent)) {
                const prev = map.items[map.items.length - 2];
                const end = prev?.value?.end;
                if (Array.isArray(end)) {
                  arrayPushArray(end, it.start);
                  end.push(this.sourceToken);
                  map.items.pop();
                  return;
                }
              }
              it.start.push(this.sourceToken);
            }
            return;
        }
        if (this.indent >= map.indent) {
          const atMapIndent = !this.onKeyLine && this.indent === map.indent;
          const atNextItem = atMapIndent && (it.sep || it.explicitKey) && this.type !== "seq-item-ind";
          let start = [];
          if (atNextItem && it.sep && !it.value) {
            const nl = [];
            for (let i = 0; i < it.sep.length; ++i) {
              const st = it.sep[i];
              switch (st.type) {
                case "newline":
                  nl.push(i);
                  break;
                case "space":
                  break;
                case "comment":
                  if (st.indent > map.indent)
                    nl.length = 0;
                  break;
                default:
                  nl.length = 0;
              }
            }
            if (nl.length >= 2)
              start = it.sep.splice(nl[1]);
          }
          switch (this.type) {
            case "anchor":
            case "tag":
              if (atNextItem || it.value) {
                start.push(this.sourceToken);
                map.items.push({ start });
                this.onKeyLine = true;
              } else if (it.sep) {
                it.sep.push(this.sourceToken);
              } else {
                it.start.push(this.sourceToken);
              }
              return;
            case "explicit-key-ind":
              if (!it.sep && !it.explicitKey) {
                it.start.push(this.sourceToken);
                it.explicitKey = true;
              } else if (atNextItem || it.value) {
                start.push(this.sourceToken);
                map.items.push({ start, explicitKey: true });
              } else {
                this.stack.push({
                  type: "block-map",
                  offset: this.offset,
                  indent: this.indent,
                  items: [{ start: [this.sourceToken], explicitKey: true }]
                });
              }
              this.onKeyLine = true;
              return;
            case "map-value-ind":
              if (it.explicitKey) {
                if (!it.sep) {
                  if (includesToken(it.start, "newline")) {
                    Object.assign(it, { key: null, sep: [this.sourceToken] });
                  } else {
                    const start2 = getFirstKeyStartProps(it.start);
                    this.stack.push({
                      type: "block-map",
                      offset: this.offset,
                      indent: this.indent,
                      items: [{ start: start2, key: null, sep: [this.sourceToken] }]
                    });
                  }
                } else if (it.value) {
                  map.items.push({ start: [], key: null, sep: [this.sourceToken] });
                } else if (includesToken(it.sep, "map-value-ind")) {
                  this.stack.push({
                    type: "block-map",
                    offset: this.offset,
                    indent: this.indent,
                    items: [{ start, key: null, sep: [this.sourceToken] }]
                  });
                } else if (isFlowToken(it.key) && !includesToken(it.sep, "newline")) {
                  const start2 = getFirstKeyStartProps(it.start);
                  const key = it.key;
                  const sep = it.sep;
                  sep.push(this.sourceToken);
                  delete it.key;
                  delete it.sep;
                  this.stack.push({
                    type: "block-map",
                    offset: this.offset,
                    indent: this.indent,
                    items: [{ start: start2, key, sep }]
                  });
                } else if (start.length > 0) {
                  it.sep = it.sep.concat(start, this.sourceToken);
                } else {
                  it.sep.push(this.sourceToken);
                }
              } else {
                if (!it.sep) {
                  Object.assign(it, { key: null, sep: [this.sourceToken] });
                } else if (it.value || atNextItem) {
                  map.items.push({ start, key: null, sep: [this.sourceToken] });
                } else if (includesToken(it.sep, "map-value-ind")) {
                  this.stack.push({
                    type: "block-map",
                    offset: this.offset,
                    indent: this.indent,
                    items: [{ start: [], key: null, sep: [this.sourceToken] }]
                  });
                } else {
                  it.sep.push(this.sourceToken);
                }
              }
              this.onKeyLine = true;
              return;
            case "alias":
            case "scalar":
            case "single-quoted-scalar":
            case "double-quoted-scalar": {
              const fs = this.flowScalar(this.type);
              if (atNextItem || it.value) {
                map.items.push({ start, key: fs, sep: [] });
                this.onKeyLine = true;
              } else if (it.sep) {
                this.stack.push(fs);
              } else {
                Object.assign(it, { key: fs, sep: [] });
                this.onKeyLine = true;
              }
              return;
            }
            default: {
              const bv = this.startBlockValue(map);
              if (bv) {
                if (bv.type === "block-seq") {
                  if (!it.explicitKey && it.sep && !includesToken(it.sep, "newline")) {
                    yield* this.pop({
                      type: "error",
                      offset: this.offset,
                      message: "Unexpected block-seq-ind on same line with key",
                      source: this.source
                    });
                    return;
                  }
                } else if (atMapIndent) {
                  map.items.push({ start });
                }
                this.stack.push(bv);
                return;
              }
            }
          }
        }
        yield* this.pop();
        yield* this.step();
      }
      *blockSequence(seq) {
        const it = seq.items[seq.items.length - 1];
        switch (this.type) {
          case "newline":
            if (it.value) {
              const end = "end" in it.value ? it.value.end : void 0;
              const last = Array.isArray(end) ? end[end.length - 1] : void 0;
              if (last?.type === "comment")
                end?.push(this.sourceToken);
              else
                seq.items.push({ start: [this.sourceToken] });
            } else
              it.start.push(this.sourceToken);
            return;
          case "space":
          case "comment":
            if (it.value)
              seq.items.push({ start: [this.sourceToken] });
            else {
              if (this.atIndentedComment(it.start, seq.indent)) {
                const prev = seq.items[seq.items.length - 2];
                const end = prev?.value?.end;
                if (Array.isArray(end)) {
                  arrayPushArray(end, it.start);
                  end.push(this.sourceToken);
                  seq.items.pop();
                  return;
                }
              }
              it.start.push(this.sourceToken);
            }
            return;
          case "anchor":
          case "tag":
            if (it.value || this.indent <= seq.indent)
              break;
            it.start.push(this.sourceToken);
            return;
          case "seq-item-ind":
            if (this.indent !== seq.indent)
              break;
            if (it.value || includesToken(it.start, "seq-item-ind"))
              seq.items.push({ start: [this.sourceToken] });
            else
              it.start.push(this.sourceToken);
            return;
        }
        if (this.indent > seq.indent) {
          const bv = this.startBlockValue(seq);
          if (bv) {
            this.stack.push(bv);
            return;
          }
        }
        yield* this.pop();
        yield* this.step();
      }
      *flowCollection(fc) {
        const it = fc.items[fc.items.length - 1];
        if (this.type === "flow-error-end") {
          let top;
          do {
            yield* this.pop();
            top = this.peek(1);
          } while (top?.type === "flow-collection");
        } else if (fc.end.length === 0) {
          switch (this.type) {
            case "comma":
            case "explicit-key-ind":
              if (!it || it.sep)
                fc.items.push({ start: [this.sourceToken] });
              else
                it.start.push(this.sourceToken);
              return;
            case "map-value-ind":
              if (!it || it.value)
                fc.items.push({ start: [], key: null, sep: [this.sourceToken] });
              else if (it.sep)
                it.sep.push(this.sourceToken);
              else
                Object.assign(it, { key: null, sep: [this.sourceToken] });
              return;
            case "space":
            case "comment":
            case "newline":
            case "anchor":
            case "tag":
              if (!it || it.value)
                fc.items.push({ start: [this.sourceToken] });
              else if (it.sep)
                it.sep.push(this.sourceToken);
              else
                it.start.push(this.sourceToken);
              return;
            case "alias":
            case "scalar":
            case "single-quoted-scalar":
            case "double-quoted-scalar": {
              const fs = this.flowScalar(this.type);
              if (!it || it.value)
                fc.items.push({ start: [], key: fs, sep: [] });
              else if (it.sep)
                this.stack.push(fs);
              else
                Object.assign(it, { key: fs, sep: [] });
              return;
            }
            case "flow-map-end":
            case "flow-seq-end":
              fc.end.push(this.sourceToken);
              return;
          }
          const bv = this.startBlockValue(fc);
          if (bv)
            this.stack.push(bv);
          else {
            yield* this.pop();
            yield* this.step();
          }
        } else {
          const parent = this.peek(2);
          if (parent.type === "block-map" && (this.type === "map-value-ind" && parent.indent === fc.indent || this.type === "newline" && !parent.items[parent.items.length - 1].sep)) {
            yield* this.pop();
            yield* this.step();
          } else if (this.type === "map-value-ind" && parent.type !== "flow-collection") {
            const prev = getPrevProps(parent);
            const start = getFirstKeyStartProps(prev);
            fixFlowSeqItems(fc);
            const sep = fc.end.splice(1, fc.end.length);
            sep.push(this.sourceToken);
            const map = {
              type: "block-map",
              offset: fc.offset,
              indent: fc.indent,
              items: [{ start, key: fc, sep }]
            };
            this.onKeyLine = true;
            this.stack[this.stack.length - 1] = map;
          } else {
            yield* this.lineEnd(fc);
          }
        }
      }
      flowScalar(type) {
        if (this.onNewLine) {
          let nl = this.source.indexOf("\n") + 1;
          while (nl !== 0) {
            this.onNewLine(this.offset + nl);
            nl = this.source.indexOf("\n", nl) + 1;
          }
        }
        return {
          type,
          offset: this.offset,
          indent: this.indent,
          source: this.source
        };
      }
      startBlockValue(parent) {
        switch (this.type) {
          case "alias":
          case "scalar":
          case "single-quoted-scalar":
          case "double-quoted-scalar":
            return this.flowScalar(this.type);
          case "block-scalar-header":
            return {
              type: "block-scalar",
              offset: this.offset,
              indent: this.indent,
              props: [this.sourceToken],
              source: ""
            };
          case "flow-map-start":
          case "flow-seq-start":
            return {
              type: "flow-collection",
              offset: this.offset,
              indent: this.indent,
              start: this.sourceToken,
              items: [],
              end: []
            };
          case "seq-item-ind":
            return {
              type: "block-seq",
              offset: this.offset,
              indent: this.indent,
              items: [{ start: [this.sourceToken] }]
            };
          case "explicit-key-ind": {
            this.onKeyLine = true;
            const prev = getPrevProps(parent);
            const start = getFirstKeyStartProps(prev);
            start.push(this.sourceToken);
            return {
              type: "block-map",
              offset: this.offset,
              indent: this.indent,
              items: [{ start, explicitKey: true }]
            };
          }
          case "map-value-ind": {
            this.onKeyLine = true;
            const prev = getPrevProps(parent);
            const start = getFirstKeyStartProps(prev);
            return {
              type: "block-map",
              offset: this.offset,
              indent: this.indent,
              items: [{ start, key: null, sep: [this.sourceToken] }]
            };
          }
        }
        return null;
      }
      atIndentedComment(start, indent) {
        if (this.type !== "comment")
          return false;
        if (this.indent <= indent)
          return false;
        return start.every((st) => st.type === "newline" || st.type === "space");
      }
      *documentEnd(docEnd) {
        if (this.type !== "doc-mode") {
          if (docEnd.end)
            docEnd.end.push(this.sourceToken);
          else
            docEnd.end = [this.sourceToken];
          if (this.type === "newline")
            yield* this.pop();
        }
      }
      *lineEnd(token) {
        switch (this.type) {
          case "comma":
          case "doc-start":
          case "doc-end":
          case "flow-seq-end":
          case "flow-map-end":
          case "map-value-ind":
            yield* this.pop();
            yield* this.step();
            break;
          case "newline":
            this.onKeyLine = false;
          // fallthrough
          case "space":
          case "comment":
          default:
            if (token.end)
              token.end.push(this.sourceToken);
            else
              token.end = [this.sourceToken];
            if (this.type === "newline")
              yield* this.pop();
        }
      }
    };
    exports.Parser = Parser;
  }
});

// node_modules/yaml/dist/public-api.js
var require_public_api = __commonJS({
  "node_modules/yaml/dist/public-api.js"(exports) {
    "use strict";
    var composer = require_composer();
    var Document = require_Document();
    var errors = require_errors();
    var log = require_log();
    var identity = require_identity();
    var lineCounter = require_line_counter();
    var parser = require_parser();
    function parseOptions(options) {
      const prettyErrors = options.prettyErrors !== false;
      const lineCounter$1 = options.lineCounter || prettyErrors && new lineCounter.LineCounter() || null;
      return { lineCounter: lineCounter$1, prettyErrors };
    }
    function parseAllDocuments(source, options = {}) {
      const { lineCounter: lineCounter2, prettyErrors } = parseOptions(options);
      const parser$1 = new parser.Parser(lineCounter2?.addNewLine);
      const composer$1 = new composer.Composer(options);
      const docs = Array.from(composer$1.compose(parser$1.parse(source)));
      if (prettyErrors && lineCounter2)
        for (const doc of docs) {
          doc.errors.forEach(errors.prettifyError(source, lineCounter2));
          doc.warnings.forEach(errors.prettifyError(source, lineCounter2));
        }
      if (docs.length > 0)
        return docs;
      return Object.assign([], { empty: true }, composer$1.streamInfo());
    }
    function parseDocument(source, options = {}) {
      const { lineCounter: lineCounter2, prettyErrors } = parseOptions(options);
      const parser$1 = new parser.Parser(lineCounter2?.addNewLine);
      const composer$1 = new composer.Composer(options);
      let doc = null;
      for (const _doc of composer$1.compose(parser$1.parse(source), true, source.length)) {
        if (!doc)
          doc = _doc;
        else if (doc.options.logLevel !== "silent") {
          doc.errors.push(new errors.YAMLParseError(_doc.range.slice(0, 2), "MULTIPLE_DOCS", "Source contains multiple documents; please use YAML.parseAllDocuments()"));
          break;
        }
      }
      if (prettyErrors && lineCounter2) {
        doc.errors.forEach(errors.prettifyError(source, lineCounter2));
        doc.warnings.forEach(errors.prettifyError(source, lineCounter2));
      }
      return doc;
    }
    function parse3(src, reviver, options) {
      let _reviver = void 0;
      if (typeof reviver === "function") {
        _reviver = reviver;
      } else if (options === void 0 && reviver && typeof reviver === "object") {
        options = reviver;
      }
      const doc = parseDocument(src, options);
      if (!doc)
        return null;
      doc.warnings.forEach((warning) => log.warn(doc.options.logLevel, warning));
      if (doc.errors.length > 0) {
        if (doc.options.logLevel !== "silent")
          throw doc.errors[0];
        else
          doc.errors = [];
      }
      return doc.toJS(Object.assign({ reviver: _reviver }, options));
    }
    function stringify(value, replacer, options) {
      let _replacer = null;
      if (typeof replacer === "function" || Array.isArray(replacer)) {
        _replacer = replacer;
      } else if (options === void 0 && replacer) {
        options = replacer;
      }
      if (typeof options === "string")
        options = options.length;
      if (typeof options === "number") {
        const indent = Math.round(options);
        options = indent < 1 ? void 0 : indent > 8 ? { indent: 8 } : { indent };
      }
      if (value === void 0) {
        const { keepUndefined } = options ?? replacer ?? {};
        if (!keepUndefined)
          return void 0;
      }
      if (identity.isDocument(value) && !_replacer)
        return value.toString(options);
      return new Document.Document(value, _replacer, options).toString(options);
    }
    exports.parse = parse3;
    exports.parseAllDocuments = parseAllDocuments;
    exports.parseDocument = parseDocument;
    exports.stringify = stringify;
  }
});

// node_modules/yaml/dist/index.js
var require_dist = __commonJS({
  "node_modules/yaml/dist/index.js"(exports) {
    "use strict";
    var composer = require_composer();
    var Document = require_Document();
    var Schema = require_Schema();
    var errors = require_errors();
    var Alias = require_Alias();
    var identity = require_identity();
    var Pair = require_Pair();
    var Scalar = require_Scalar();
    var YAMLMap = require_YAMLMap();
    var YAMLSeq = require_YAMLSeq();
    var cst = require_cst();
    var lexer = require_lexer();
    var lineCounter = require_line_counter();
    var parser = require_parser();
    var publicApi = require_public_api();
    var visit = require_visit();
    exports.Composer = composer.Composer;
    exports.Document = Document.Document;
    exports.Schema = Schema.Schema;
    exports.YAMLError = errors.YAMLError;
    exports.YAMLParseError = errors.YAMLParseError;
    exports.YAMLWarning = errors.YAMLWarning;
    exports.Alias = Alias.Alias;
    exports.isAlias = identity.isAlias;
    exports.isCollection = identity.isCollection;
    exports.isDocument = identity.isDocument;
    exports.isMap = identity.isMap;
    exports.isNode = identity.isNode;
    exports.isPair = identity.isPair;
    exports.isScalar = identity.isScalar;
    exports.isSeq = identity.isSeq;
    exports.Pair = Pair.Pair;
    exports.Scalar = Scalar.Scalar;
    exports.YAMLMap = YAMLMap.YAMLMap;
    exports.YAMLSeq = YAMLSeq.YAMLSeq;
    exports.CST = cst;
    exports.Lexer = lexer.Lexer;
    exports.LineCounter = lineCounter.LineCounter;
    exports.Parser = parser.Parser;
    exports.parse = publicApi.parse;
    exports.parseAllDocuments = publicApi.parseAllDocuments;
    exports.parseDocument = publicApi.parseDocument;
    exports.stringify = publicApi.stringify;
    exports.visit = visit.visit;
    exports.visitAsync = visit.visitAsync;
  }
});

// src/cli.ts
var import_picocolors2 = __toESM(require_picocolors(), 1);
import { writeFileSync as writeFileSync4, readFileSync as readFileSync6, existsSync as existsSync4 } from "node:fs";
import { resolve as resolve4, join as join7 } from "node:path";

// src/scan.ts
import { resolve as resolve3, join as join6 } from "node:path";
import { mkdirSync as mkdirSync4, existsSync as existsSync3 } from "node:fs";

// src/channels/source.ts
import { readFileSync as readFileSync2, readdirSync as readdirSync2, statSync } from "node:fs";
import { join as join2, relative, extname } from "node:path";

// src/corpus/load.ts
var import_yaml = __toESM(require_dist(), 1);
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
var HERE = dirname(fileURLToPath(import.meta.url));
function rulesDir() {
  let dir = HERE;
  for (let up = 0; up < 6; up++) {
    const candidate = join(dir, "rules");
    try {
      readdirSync(candidate);
      return candidate;
    } catch {
      const parent = dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
  }
  throw new Error(
    `could not locate the rules/ directory \u2014 looked upward from ${HERE}. A checkout keeps it at the repo root; a plugin install keeps it beside bundle/.`
  );
}
var VALID_CATEGORIES = /* @__PURE__ */ new Set([
  "craft",
  "residue",
  "color",
  "typography",
  "layout",
  "depth",
  "motion",
  "iconography",
  "copy",
  "usability",
  "a11y",
  "sameness",
  "chrome",
  "system",
  "composition"
]);
var VALID_CHANNELS = /* @__PURE__ */ new Set([
  "source",
  "render",
  "vision",
  "fingerprint"
]);
var VALID_KINDS = /* @__PURE__ */ new Set(["slop", "quality"]);
var VALID_SURFACES = /* @__PURE__ */ new Set(["persuade", "operate", "read"]);
function validate(rule, file, index) {
  const r = rule;
  const where = `${file}[${index}]`;
  if (!r.id) throw new Error(`${where} has no id`);
  if (!r.title) throw new Error(`rule "${r.id}" has no title`);
  if (!r.category || !VALID_CATEGORIES.has(r.category)) {
    throw new Error(`rule "${r.id}" has invalid category "${r.category}"`);
  }
  if (!r.kind || !VALID_KINDS.has(r.kind)) {
    throw new Error(
      `redpen: rule "${r.id}" must declare kind: slop | quality \u2014 "does it look machine-made" and "is it broken" are scored separately`
    );
  }
  if (r.surfaces !== void 0) {
    if (!Array.isArray(r.surfaces) || r.surfaces.length === 0) {
      throw new Error(`rule "${r.id}" has an empty surfaces list \u2014 omit the field to mean all`);
    }
    for (const s of r.surfaces) {
      if (!VALID_SURFACES.has(s)) {
        throw new Error(`rule "${r.id}" names unknown surface "${s}"`);
      }
    }
    if (r.surfaces.length === 3) {
      throw new Error(`rule "${r.id}" lists every surface \u2014 omit the field instead`);
    }
  }
  if (r.requires !== void 0) {
    if (!Array.isArray(r.requires) || r.requires.length === 0) {
      throw new Error(`rule "${r.id}" has an empty requires list`);
    }
    for (const cap of r.requires) {
      if (!VALID_CAPABILITIES.has(cap)) {
        throw new Error(`rule "${r.id}" requires unknown capability "${cap}"`);
      }
    }
  }
  if (!Array.isArray(r.sources) || r.sources.length === 0) {
    throw new Error(`rule "${r.id}" has no sources \u2014 provenance is mandatory`);
  }
  if (!Array.isArray(r.channels) || r.channels.length === 0) {
    throw new Error(`rule "${r.id}" declares no channels`);
  }
  for (const ch of r.channels) {
    if (!VALID_CHANNELS.has(ch)) {
      throw new Error(`rule "${r.id}" declares unknown channel "${ch}"`);
    }
  }
  if (typeof r.weight !== "number" || r.weight < 0 || r.weight > 100) {
    throw new Error(`rule "${r.id}" weight must be 0-100, got ${r.weight}`);
  }
  if (!r.why || !r.fix) {
    throw new Error(`rule "${r.id}" must explain both why and fix`);
  }
  for (const ch of r.channels) {
    if (ch === "source" && !r.source && !r.cascade) {
      throw new Error(`rule "${r.id}" declares the source channel but has no matcher`);
    }
    if (ch === "render" && !r.render) {
      throw new Error(`rule "${r.id}" declares the render channel but has no matcher`);
    }
    if (ch === "vision" && !r.vision) {
      throw new Error(`rule "${r.id}" declares the vision channel but has no matcher`);
    }
  }
  if (r.source?.patterns) {
    for (const p of r.source.patterns) {
      try {
        new RegExp(p, "giu");
      } catch (err) {
        throw new Error(`rule "${r.id}" has an invalid pattern /${p}/: ${err}`);
      }
    }
  }
  const complete = r;
  return {
    ...complete,
    evidenceRank: complete.evidenceRank ?? null,
    advisory: complete.advisory ?? false
  };
}
var cached = null;
function loadCorpus() {
  if (cached) return cached;
  const dir = rulesDir();
  const files = readdirSync(dir).filter((f) => f.endsWith(".yaml") || f.endsWith(".yml")).sort();
  const rules = [];
  const seen = /* @__PURE__ */ new Map();
  for (const file of files) {
    const raw = (0, import_yaml.parse)(readFileSync(join(dir, file), "utf8"));
    if (!Array.isArray(raw)) {
      throw new Error(`${file} must contain a top-level list of rules`);
    }
    raw.forEach((entry, i) => {
      const rule = validate(entry, file, i);
      const prior = seen.get(rule.id);
      if (prior) {
        throw new Error(`duplicate rule id "${rule.id}" in ${file} and ${prior}`);
      }
      seen.set(rule.id, file);
      rules.push(rule);
    });
  }
  cached = rules;
  return rules;
}
function rulesForChannel(channel) {
  return loadCorpus().filter((r) => r.channels.includes(channel));
}
function appliesTo(rule, surface) {
  if (!rule.surfaces) return true;
  if (!surface) return true;
  return rule.surfaces.includes(surface);
}
var VALID_CAPABILITIES = /* @__PURE__ */ new Set(["javascript", "externalAssets"]);
function isActionable(rule, capabilities) {
  if (!rule.requires) return true;
  return rule.requires.every((cap) => capabilities[cap] !== false);
}
function ruleById(id) {
  return loadCorpus().find((r) => r.id === id);
}
function originCounts() {
  const counts = {};
  for (const rule of loadCorpus()) {
    for (const s of rule.sources) {
      counts[s.origin] = (counts[s.origin] ?? 0) + 1;
    }
  }
  return counts;
}

// src/channels/cascade.ts
function blankComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "));
}
function specificity(selector) {
  let s = selector.trim();
  let a = 0;
  let b = 0;
  let c = 0;
  s = s.replace(/:where\([^)]*\)/g, " ");
  s = s.replace(/:(not|is|has|matches)\(([^)]*)\)/g, (_m, _fn, inner) => {
    const best = inner.split(",").map((part) => specificity(part)).sort((x, y) => y[0] - x[0] || y[1] - x[1] || y[2] - x[2])[0];
    if (best) {
      a += best[0];
      b += best[1];
      c += best[2];
    }
    return " ";
  });
  a += (s.match(/#[\w-]+/g) ?? []).length;
  s = s.replace(/#[\w-]+/g, " ");
  b += (s.match(/\.[\w-]+/g) ?? []).length;
  s = s.replace(/\.[\w-]+/g, " ");
  b += (s.match(/\[[^\]]*\]/g) ?? []).length;
  s = s.replace(/\[[^\]]*\]/g, " ");
  c += (s.match(/::[\w-]+/g) ?? []).length;
  s = s.replace(/::[\w-]+/g, " ");
  b += (s.match(/:[\w-]+/g) ?? []).length;
  s = s.replace(/:[\w-]+/g, " ");
  c += (s.match(/\b[a-zA-Z][\w-]*/g) ?? []).length;
  return [a, b, c];
}
function isNarrowing(condition) {
  return /\b(max-width|min-width|max-height|min-height|pointer|any-pointer|hover|any-hover|orientation|max-device-width|min-device-width)\b/i.test(
    condition
  );
}
function normalise(selector) {
  return selector.trim().replace(/\s*([>+~])\s*/g, "$1").replace(/\s+/g, " ");
}
function compare(x, y) {
  return x[0] - y[0] || x[1] - y[1] || x[2] - y[2];
}
function rightmostCompound(selector) {
  const last = selector.trim().split(/\s*[\s>+~]\s*/).filter(Boolean).pop() ?? "";
  return last.match(/[#.]?[\w-]+|\[[^\]]*\]|::?[\w-]+(?:\([^)]*\))?/g) ?? [];
}
function subsumes(weak, strong) {
  const w = weak.trim();
  if (/[\s>+~]/.test(w)) return false;
  if (/:where|:has|:is|:not|:nth|::/.test(w)) return false;
  const weakParts = rightmostCompound(w);
  if (!weakParts.length) return false;
  const strongParts = new Set(rightmostCompound(strong));
  return weakParts.every((p) => strongParts.has(p));
}
function px(value) {
  const v = value.trim();
  if (/var\(|calc\(|clamp\(|min\(|max\(|%/.test(v)) return null;
  const m = /^(-?[\d.]+)(px|rem|em)?$/.exec(v);
  if (!m) return null;
  const n = parseFloat(m[1]);
  if (!Number.isFinite(n)) return null;
  if (m[2] === "rem") return n * 16;
  if (m[2] === "em") return null;
  return n;
}
function declValue(body, prop) {
  const re = new RegExp(`(^|[;{\\s])${prop}\\s*:\\s*([^;}]+)`, "gi");
  let last = null;
  for (const m of body.matchAll(re)) {
    last = { value: m[2].trim(), offset: m.index };
  }
  return last;
}
function parse2(css) {
  const text = blankComments(css);
  const sets = [];
  const conditions = [];
  let i = 0;
  let selectorStart = 0;
  const lineAt = (offset) => text.slice(0, offset).split("\n").length;
  const skipString = (from) => {
    const quote = text[from];
    let k = from + 1;
    while (k < text.length) {
      if (text[k] === "\\\\") {
        k += 2;
        continue;
      }
      if (text[k] === quote) return k + 1;
      k++;
    }
    return k;
  };
  while (i < text.length) {
    const ch = text[i];
    if (ch === '"' || ch === "'") {
      i = skipString(i);
      continue;
    }
    if (ch === ";" && text.slice(selectorStart, i).trim().startsWith("@")) {
      i++;
      selectorStart = i;
      continue;
    }
    if (ch === "{") {
      const head = text.slice(selectorStart, i).trim();
      if (head.startsWith("@")) {
        conditions.push(head);
        i++;
        selectorStart = i;
        continue;
      }
      let depth = 1;
      let j = i + 1;
      while (j < text.length && depth > 0) {
        const c = text[j];
        if (c === '"' || c === "'") {
          j = skipString(j);
          continue;
        }
        if (c === "{") depth++;
        else if (c === "}") depth--;
        j++;
      }
      const body = text.slice(i + 1, j - 1);
      if (head) sets.push({ selector: head, body, line: lineAt(i), conditions: [...conditions] });
      i = j;
      selectorStart = i;
      continue;
    }
    if (ch === "}") {
      conditions.pop();
      i++;
      selectorStart = i;
      continue;
    }
    i++;
  }
  return sets;
}
function findCancelledFloors(css, opts = {}) {
  const floor = opts.floorPx ?? 44;
  const sets = parse2(css);
  const promises = sets.map((r) => {
    const d = declValue(r.body, "min-height");
    if (!d) return null;
    const value = px(d.value);
    if (value === null || value < floor) return null;
    return { rule: r, value, decl: `min-height: ${d.value}` };
  }).filter((x) => x !== null);
  if (!promises.length) return [];
  const conflicts = [];
  for (const r of sets) {
    const d = declValue(r.body, "height");
    if (!d) continue;
    const value = px(d.value);
    if (value === null || value >= floor) continue;
    for (const p of promises) {
      if (p.rule === r) continue;
      if (!subsumes(p.rule.selector, r.selector)) continue;
      const off = specificity(r.selector);
      const weak = specificity(p.rule.selector);
      if (compare(off, weak) <= 0) continue;
      let partialUnder = null;
      const restored = sets.some((other) => {
        if (other === r) return false;
        if (!other.conditions.length) return false;
        const od = declValue(other.body, "height") ?? declValue(other.body, "min-height");
        if (!od) return false;
        const ov = px(od.value);
        if (ov === null || ov < floor) return false;
        if (compare(specificity(other.selector), off) < 0) return false;
        if (normalise(other.selector) !== normalise(r.selector)) return false;
        const narrowing = other.conditions.filter(isNarrowing);
        if (narrowing.length) {
          partialUnder = narrowing.join(" and ");
          return false;
        }
        return true;
      });
      if (restored) continue;
      const fmt = (s) => `(${s.join(",")})`;
      const caveat = partialUnder ? ` \u2014 restored only under ${partialUnder}, so it stays ${value}px everywhere else` : ` \u2014 computes to ${value}px, floor is ${floor}px`;
      conflicts.push({
        offender: { selector: r.selector, declaration: `height: ${d.value}`, specificity: off },
        promise: { selector: p.rule.selector, declaration: p.decl, specificity: weak },
        line: r.line,
        restoredUnder: partialUnder,
        summary: `${r.selector} { height: ${d.value} } ${fmt(off)} cancels ${p.rule.selector} { ${p.decl} } ${fmt(weak)}${caveat}`
      });
      break;
    }
  }
  return conflicts;
}

// src/channels/source.ts
var UI_EXTENSIONS = /* @__PURE__ */ new Set([
  ".html",
  ".htm",
  ".css",
  ".scss",
  ".sass",
  ".less",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".ts",
  ".tsx",
  ".vue",
  ".svelte",
  ".astro",
  ".mdx"
]);
var CODE_EXTENSIONS = /* @__PURE__ */ new Set([
  ...UI_EXTENSIONS,
  ".go",
  ".py",
  ".rs",
  ".rb",
  ".java",
  ".kt",
  ".swift",
  ".cs",
  ".php",
  ".c",
  ".h",
  ".cc",
  ".cpp",
  ".hpp",
  ".m",
  ".mm",
  ".scala",
  ".ex",
  ".exs",
  ".lua",
  ".pl",
  ".r",
  ".dart",
  ".sh",
  ".bash",
  ".zsh",
  ".sql",
  ".gradle"
]);
var SCANNED_EXTENSIONS = CODE_EXTENSIONS;
var SKIP_DIRS = /* @__PURE__ */ new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  ".next",
  "out",
  "vendor",
  "coverage",
  ".svelte-kit",
  ".astro",
  ".turbo",
  ".cache",
  "__pycache__",
  ".vercel",
  ".netlify",
  "storybook-static",
  ".redpen",
  // Test material is not shipped UI. Reported from the field: a Go render
  // test's golden file was fingerprinted as a page and cited ten times.
  "testdata",
  "__snapshots__",
  "__fixtures__",
  "fixtures",
  "__mocks__"
]);
var SKIP_FILE = /\.(golden|snap|snapshot)\.|\.golden$|\.snap$|\.(test|spec)\.[jt]sx?$/i;
var MAX_FILE_BYTES = 512 * 1024;
var MAX_LINE_LENGTH = 2e3;
function unreadLanguages(root) {
  const counts = /* @__PURE__ */ new Map();
  const visit = (dir) => {
    let entries;
    try {
      entries = readdirSync2(dir);
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.startsWith(".") || SKIP_DIRS.has(entry)) continue;
      const full = join2(dir, entry);
      let stat;
      try {
        stat = statSync(full);
      } catch {
        continue;
      }
      if (stat.isDirectory()) {
        visit(full);
        continue;
      }
      const ext = extname(entry);
      if (!ext || SCANNED_EXTENSIONS.has(ext) || !SOURCE_SHAPED.test(ext)) continue;
      counts.set(ext, (counts.get(ext) ?? 0) + 1);
    }
  };
  visit(root);
  return [...counts].sort((a, b) => b[1] - a[1]).slice(0, 4);
}
var SOURCE_SHAPED = /^\.(zig|nim|hs|clj|cljs|erl|fs|fsx|ml|pas|pro|tcl|vb|groovy|jl|cr|d|v|elm|purs|res|rkt|scm|lisp|f90|f95|for|cob|adb|ads|asm|s)$/i;
function walk(root) {
  const found = [];
  const visit = (dir) => {
    let entries;
    try {
      entries = readdirSync2(dir);
    } catch {
      return;
    }
    for (const entry of entries) {
      if (SKIP_DIRS.has(entry)) continue;
      const full = join2(dir, entry);
      let st;
      try {
        st = statSync(full);
      } catch {
        continue;
      }
      if (st.isDirectory()) {
        if (!entry.startsWith(".")) visit(full);
      } else if (SCANNED_EXTENSIONS.has(extname(entry)) && st.size <= MAX_FILE_BYTES && !SKIP_FILE.test(entry)) {
        found.push(full);
      }
    }
  };
  visit(root);
  return found;
}
function compile(rules) {
  return rules.filter((r) => r.source?.patterns?.length).map((rule) => {
    const m = rule.source;
    return {
      rule,
      // 'u' for the emoji ranges, 'i' because CSS and class names vary in
      // case — except where a rule reads prose, where case is the signal.
      patterns: m.patterns.map((p) => new RegExp(p, m.caseSensitive ? "gu" : "giu")),
      suppress: m.suppress ? new RegExp(m.suppress, m.caseSensitive ? "u" : "iu") : null,
      /**
       * A rule reads the files its category is about.
       *
       * The walk carries every source language now, and a UI rule let loose
       * on Go would report a colour literal in a terminal theme. Page rules
       * stay on page files; craft and residue read whatever the project is
       * written in. An explicit `extensions` on the rule still wins.
       */
      extensions: m.extensions ? new Set(m.extensions) : CODE_CATEGORIES.has(rule.category) ? CODE_EXTENSIONS : UI_EXTENSIONS,
      minHits: m.minHits ?? 1
    };
  });
}
var IGNORE_RE = /redpen-ignore(?::([a-z0-9-]+))?\s+(.+)$/i;
var TERMINATOR_RE = /\s*(?:\*\/|-->|\}\)?|\*)\s*$/;
function parseIgnore(line) {
  if (!line) return null;
  const m = IGNORE_RE.exec(line);
  if (!m) return null;
  const reason = (m[2] ?? "").replace(TERMINATOR_RE, "").trim();
  if (!/[a-z0-9]/i.test(reason)) return null;
  return { ruleId: m[1] ?? null, reason };
}
function scanSource(opts) {
  const compiled = compile(rulesForChannel("source"));
  const cascadeRules = rulesForChannel("source").filter((r) => r.cascade);
  const files = opts.files ?? walk(opts.root);
  const hits = /* @__PURE__ */ new Map();
  const ignored = /* @__PURE__ */ new Map();
  for (const file of files) {
    let text;
    try {
      text = readFileSync2(file, "utf8");
    } catch {
      continue;
    }
    const rel = relative(opts.root, file) || file;
    const lines = text.split("\n");
    const ext = extname(file);
    if (ext === ".css") {
      for (const rule of cascadeRules) {
        const params = rule.cascade.params ?? {};
        for (const conflict of findCancelledFloors(text, params)) {
          const list = hits.get(rule.id) ?? [];
          list.push({
            channel: "source",
            location: rel,
            line: conflict.line,
            excerpt: conflict.summary
          });
          hits.set(rule.id, list);
        }
      }
    }
    for (const c of compiled) {
      if (c.extensions && !c.extensions.has(ext)) continue;
      for (const pattern of c.patterns) {
        pattern.lastIndex = 0;
        let match;
        while ((match = pattern.exec(text)) !== null) {
          if (match[0].length === 0) {
            pattern.lastIndex += 1;
            continue;
          }
          const lineNo = countLines(text, match.index);
          const line = lines[lineNo - 1] ?? "";
          if (line.length > MAX_LINE_LENGTH) continue;
          if (c.suppress && c.suppress.test(line)) continue;
          const directive = parseIgnore(line) ?? parseIgnore(lines[lineNo - 2]);
          if (directive && (directive.ruleId === null || directive.ruleId === c.rule.id)) {
            const list2 = ignored.get(c.rule.id) ?? [];
            list2.push(directive);
            ignored.set(c.rule.id, list2);
            continue;
          }
          const evidence = {
            channel: "source",
            location: rel,
            line: lineNo,
            excerpt: line.trim().slice(0, 160)
          };
          const list = hits.get(c.rule.id) ?? [];
          list.push(evidence);
          hits.set(c.rule.id, list);
        }
      }
    }
  }
  const findings = [];
  for (const c of compiled) {
    const evidence = hits.get(c.rule.id);
    if (!evidence) continue;
    const distinctLines = new Set(evidence.map((e) => `${e.location}:${e.line}`));
    if (distinctLines.size < c.minHits) continue;
    findings.push({
      ruleId: c.rule.id,
      channel: "source",
      evidence: dedupe(evidence).slice(0, 12)
    });
  }
  for (const rule of cascadeRules) {
    const evidence = hits.get(rule.id);
    if (!evidence?.length) continue;
    findings.push({
      ruleId: rule.id,
      channel: "source",
      evidence: dedupe(evidence).slice(0, 12)
    });
  }
  return { findings, ignored, filesScanned: files.length };
}
function countLines(text, index) {
  let n = 1;
  for (let i = 0; i < index; i++) {
    if (text.charCodeAt(i) === 10) n++;
  }
  return n;
}
function dedupe(evidence) {
  const seen = /* @__PURE__ */ new Set();
  const out = [];
  for (const e of evidence) {
    const key = `${e.location}:${e.line}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(e);
  }
  return out;
}

// src/channels/detectors.ts
function detectorSource() {
  return `(specs) => {
${OKLCH_LIB}
${CONTRAST_LIB}
${HELPERS_LIB}
${CHECKS_LIB}

  const hits = [];
  const byCheck = {};
  for (const spec of specs) {
    (byCheck[spec.check] = byCheck[spec.check] || []).push(spec);
  }

  for (const name in byCheck) {
    const fn = CHECKS[name];
    if (!fn) continue;
    for (const spec of byCheck[name]) {
      let found = [];
      try {
        found = fn(spec.params || {}) || [];
      } catch (err) {
        // A detector that throws must not take the whole run with it. Report
        // the failure as a hit against a reserved id so it is visible.
        hits.push({
          ruleId: '__detector_error__',
          selector: name,
          excerpt: String((err && err.message) || err).slice(0, 160),
        });
        continue;
      }
      if (found.length < (spec.minHits || 1)) continue;
      for (const f of found.slice(0, 12)) {
        hits.push({ ruleId: spec.ruleId, selector: f.selector, excerpt: f.excerpt });
      }
    }
  }
  return hits;
}`;
}
var OKLCH_LIB = `
  function parseColor(str) {
    if (!str) return null;

    // Anything that went through color-mix() serialises as color(srgb r g b / a)
    // with 0-1 channels, not rgb(). A parser that only knows rgba() returns null
    // for every control on a sheet that tints with color-mix \u2014 and null here
    // means the translucent layer silently drops out of the composite, so the
    // measured ground is the layer behind it rather than the one on screen.
    var fn = /color\\(\\s*srgb\\s+([^)]+)\\)/.exec(str);
    if (fn) {
      var p = fn[1].split(/[\\s\\/]+/).filter(Boolean).map(parseFloat);
      if (p.length < 3) return null;
      var fa = p.length > 3 ? p[3] : 1;
      return {
        r: p[0] * 255,
        g: p[1] * 255,
        b: p[2] * 255,
        a: isNaN(fa) ? 1 : fa,
      };
    }

    var m = /rgba?\\(([^)]+)\\)/.exec(str);
    if (!m) return null;
    var parts = m[1].split(/[\\s,\\/]+/).filter(Boolean).map(parseFloat);
    if (parts.length < 3) return null;
    var a = parts.length > 3 ? parts[3] : 1;
    return { r: parts[0], g: parts[1], b: parts[2], a: isNaN(a) ? 1 : a };
  }

  function srgbToLinear(c) {
    c = c / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  }

  function toOklch(rgb) {
    if (!rgb) return null;
    var r = srgbToLinear(rgb.r), g = srgbToLinear(rgb.g), b = srgbToLinear(rgb.b);
    var l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    var m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    var s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    var L = 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s;
    var A = 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s;
    var B = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s;
    var C = Math.sqrt(A * A + B * B);
    var H = (Math.atan2(B, A) * 180) / Math.PI;
    if (H < 0) H += 360;
    return { l: L, c: C, h: H, alpha: rgb.a };
  }

  function inHueBand(oklch, range, minChroma) {
    if (!oklch || oklch.c < (minChroma || 0)) return false;
    var lo = range[0], hi = range[1];
    return lo <= hi ? (oklch.h >= lo && oklch.h <= hi)
                    : (oklch.h >= lo || oklch.h <= hi);
  }
`;
var CONTRAST_LIB = `
  function relLuminance(rgb) {
    var r = srgbToLinear(rgb.r), g = srgbToLinear(rgb.g), b = srgbToLinear(rgb.b);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  function contrastRatio(fg, bg) {
    var l1 = relLuminance(fg), l2 = relLuminance(bg);
    var hi = Math.max(l1, l2), lo = Math.min(l1, l2);
    return (hi + 0.05) / (lo + 0.05);
  }

  // Walk up for the first non-transparent background. Alpha-compositing a
  // semi-transparent card over its parent is what makes muted-text-on-tinted-
  // surface failures so easy to miss.
  /**
   * True when a gradient or image sits between this element and the first
   * solid colour above it. Contrast cannot be computed against those from
   * computed styles alone, and guessing produced a confident 1.00:1 for white
   * text on a violet gradient button.
   */
  function hasPaintedAncestor(el) {
    var node = el, depth = 0;
    while (node && depth < 4) {
      var s = getComputedStyle(node);
      if (s.backgroundImage && s.backgroundImage !== 'none') return true;
      var bg = parseColor(s.backgroundColor);
      if (bg && bg.a >= 0.999) return false;
      node = node.parentElement; depth++;
    }
    return false;
  }

  function effectiveBackground(el) {
    var node = el;
    var stack = [];
    while (node && node !== document.documentElement.parentNode) {
      var bg = parseColor(getComputedStyle(node).backgroundColor);
      if (bg && bg.a > 0) {
        stack.push(bg);
        if (bg.a >= 0.999) break;
      }
      node = node.parentElement;
    }
    if (!stack.length) return { r: 255, g: 255, b: 255, a: 1 };
    var out = stack[stack.length - 1];
    for (var i = stack.length - 2; i >= 0; i--) {
      var top = stack[i];
      out = {
        r: top.r * top.a + out.r * (1 - top.a),
        g: top.g * top.a + out.g * (1 - top.a),
        b: top.b * top.a + out.b * (1 - top.a),
        a: 1,
      };
    }
    return out;
  }
`;
var HELPERS_LIB = `
  function visible(el) {
    var s = getComputedStyle(el);
    if (s.display === 'none' || s.visibility === 'hidden' || parseFloat(s.opacity) === 0) return false;
    var r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }

  function selectorFor(el) {
    if (!el || el === document.body) return 'body';
    // A form whose control is named "id" shadows form.id with the element
    // itself, so a naive '#' + el.id stringifies a DOM node. Only trust a
    // string, and only one that can actually be written as a selector.
    var id = el.getAttribute ? el.getAttribute('id') : null;
    if (typeof id === 'string' && id && /^[A-Za-z_][\\w:.-]*$/.test(id)) return '#' + id;
    var parts = [];
    var node = el;
    var depth = 0;
    while (node && node.nodeType === 1 && node !== document.body && depth < 4) {
      var part = node.tagName.toLowerCase();
      var cls = (node.getAttribute('class') || '')
        .split(/\\s+/).filter(Boolean).slice(0, 2).join('.');
      if (cls) part += '.' + cls;
      parts.unshift(part);
      node = node.parentElement;
      depth++;
    }
    return parts.join(' > ').slice(0, 120);
  }

  function textOf(el) {
    return (el.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 80);
  }

  function all(sel) {
    return Array.prototype.slice.call(document.querySelectorAll(sel || '*')).filter(visible);
  }

  function hit(el, excerpt) {
    return { selector: selectorFor(el), excerpt: String(excerpt).slice(0, 160) };
  }

  function area(el) {
    var r = el.getBoundingClientRect();
    return Math.max(0, r.width) * Math.max(0, r.height);
  }

  function viewportArea() {
    return window.innerWidth * Math.max(window.innerHeight, document.documentElement.scrollHeight);
  }

  // The standard visually-hidden recipe: 1px box, clipped, off-canvas. It is
  // meant to be unreadable on screen and readable to a screen reader, so every
  // geometry check has to skip it or adding a skip link creates findings.
  function isVisuallyHidden(el) {
    var s = getComputedStyle(el);
    if (s.clip === 'rect(0px, 0px, 0px, 0px)' || /inset\\(100%|circle\\(0/.test(s.clipPath)) return true;
    var r = el.getBoundingClientRect();
    if (r.width <= 1 && r.height <= 1 && (el.textContent || '').trim().length > 1) return true;
    // Parked off-canvas rather than clipped.
    if (r.right < 0 || r.bottom < 0 || r.left > window.innerWidth * 2) return true;
    var node = el.parentElement, depth = 0;
    while (node && depth < 3) {
      var ps = getComputedStyle(node);
      if (ps.clip === 'rect(0px, 0px, 0px, 0px)') return true;
      node = node.parentElement; depth++;
    }
    return false;
  }

  function isTextBearing(el) {
    if (!el.childNodes) return false;
    for (var i = 0; i < el.childNodes.length; i++) {
      var n = el.childNodes[i];
      if (n.nodeType === 3 && n.textContent.trim().length > 1) return true;
    }
    return false;
  }

  // Layout sections only. A decorative svg or a stray img is a child of body on
  // plenty of pages and would otherwise skew every rhythm measurement.
  var NON_SECTION = { SVG: 1, IMG: 1, SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, CANVAS: 1, TEMPLATE: 1, LINK: 1 };

  function topLevelSections() {
    var main = document.querySelector('main') || document.body;
    return Array.prototype.slice.call(main.children).filter(function (el) {
      if (NON_SECTION[String(el.tagName).toUpperCase()]) return false;
      return visible(el) && el.getBoundingClientRect().height > 80;
    });
  }

  function bodySections() {
    return topLevelSections().filter(function (el) {
      var t = el.tagName;
      return t !== 'NAV' && t !== 'HEADER' && t !== 'FOOTER';
    });
  }

  function isInteractive(el) {
    var tag = el.tagName.toLowerCase();
    if (tag === 'a' || tag === 'button' || tag === 'input' || tag === 'select' || tag === 'textarea') return true;
    var role = el.getAttribute('role');
    if (role && /button|link|menuitem|tab|checkbox|switch/.test(role)) return true;
    return el.hasAttribute('tabindex') && el.getAttribute('tabindex') !== '-1';
  }

  function coefficientOfVariation(values) {
    if (values.length < 2) return 1;
    var mean = values.reduce(function (a, b) { return a + b; }, 0) / values.length;
    if (mean === 0) return 0;
    var variance = values.reduce(function (a, b) { return a + Math.pow(b - mean, 2); }, 0) / values.length;
    return Math.sqrt(variance) / mean;
  }
`;
var CHECKS_LIB = `
  var CHECKS = {};

  CHECKS['hue-band-share'] = function (p) {
    var range = p.hueRange || [265, 305];
    var minChroma = p.minChroma || 0.1;
    var minShare = p.minAreaShare || 0.03;
    var total = viewportArea();
    var accum = 0;
    var examples = [];
    all('*').forEach(function (el) {
      var s = getComputedStyle(el);
      var bg = toOklch(parseColor(s.backgroundColor));
      if (bg && bg.alpha > 0.2 && inHueBand(bg, range, minChroma)) {
        accum += area(el);
        if (examples.length < 8) examples.push(hit(el, 'background ' + s.backgroundColor));
      }
      var fg = toOklch(parseColor(s.color));
      if (fg && isTextBearing(el) && inHueBand(fg, range, minChroma)) {
        if (examples.length < 8) examples.push(hit(el, 'text ' + s.color));
      }
    });
    if (!examples.length) return [];
    if (accum / total < minShare && examples.length < 3) return [];
    return examples;
  };

  CHECKS['clipped-gradient-text'] = function () {
    return all('*').filter(function (el) {
      var s = getComputedStyle(el);
      var clip = s.webkitBackgroundClip || s.backgroundClip;
      return clip === 'text' && /gradient/.test(s.backgroundImage) && isTextBearing(el);
    }).map(function (el) { return hit(el, textOf(el)); });
  };

  CHECKS['gradient-hue-span'] = function (p) {
    var minSpan = p.minHueSpan || 40;
    var involving = p.involvingHueRange;
    return all('*').filter(function (el) {
      var img = getComputedStyle(el).backgroundImage;
      if (!/gradient/.test(img)) return false;
      var colors = (img.match(/rgba?\\([^)]+\\)/g) || []).map(function (c) {
        return toOklch(parseColor(c));
      }).filter(function (c) { return c && c.c > 0.03; });
      if (colors.length < 2) return false;
      var hues = colors.map(function (c) { return c.h; });
      var span = Math.max.apply(null, hues) - Math.min.apply(null, hues);
      if (span > 180) span = 360 - span;
      if (span < minSpan) return false;
      if (involving) {
        return colors.some(function (c) { return inHueBand(c, involving, 0.05); });
      }
      return true;
    }).map(function (el) { return hit(el, getComputedStyle(el).backgroundImage.slice(0, 120)); });
  };

  CHECKS['warm-neutral-ground'] = function (p) {
    var body = toOklch(effectiveBackground(document.body));
    if (!body) return [];
    var lightOk = body.l >= (p.lightnessMin || 0.93);
    var cr = p.chromaRange || [0.008, 0.035];
    var chromaOk = body.c >= cr[0] && body.c <= cr[1];
    var hueOk = inHueBand(body, p.hueRange || [60, 110], cr[0]);
    if (!(lightOk && chromaOk && hueOk)) return [];
    if (p.requiresSerifDisplay) {
      var headings = all('h1, h2, .hero__title, [class*="display"]');
      var serif = headings.some(function (h) {
        return /serif|georgia|garamond|fraunces|playfair|cormorant|spectral|instrument/i
          .test(getComputedStyle(h).fontFamily);
      });
      if (!serif) return [];
    }
    return [hit(document.body, 'cream ground L=' + body.l.toFixed(2) + ' C=' + body.c.toFixed(3) + ' H=' + body.h.toFixed(0))];
  };

  CHECKS['unmixed-extremes'] = function (p) {
    var minShare = p.minAreaShare || 0.25;
    var total = viewportArea();
    var accum = 0;
    var examples = [];
    all('*').forEach(function (el) {
      var bg = parseColor(getComputedStyle(el).backgroundColor);
      if (!bg || bg.a < 0.9) return;
      var pure = (bg.r === 0 && bg.g === 0 && bg.b === 0) || (bg.r === 255 && bg.g === 255 && bg.b === 255);
      if (!pure) return;
      accum += area(el);
      if (examples.length < 4) examples.push(hit(el, getComputedStyle(el).backgroundColor));
    });
    return accum / total >= minShare ? examples : [];
  };

  CHECKS['neutral-chroma-floor'] = function (p) {
    var min = p.minChroma || 0.005;
    var seen = {};
    var area = {};
    all('*').forEach(function (el) {
      var s = getComputedStyle(el);
      var r = el.getBoundingClientRect();
      // The root carries the CSS initial color: rgb(0,0,0) unless something
      // sets it, and html/body usually set only layout. Reading it reported a
      // pure black that appears nowhere in the source. A text colour only
      // counts where there is text wearing it.
      var pairs = [s.backgroundColor];
      if (isTextBearing(el)) pairs.push(s.color);
      pairs.forEach(function (c) {
        var ok = toOklch(parseColor(c));
        if (!ok || ok.alpha < 0.5) return;
        // Pure black at full opacity on a zero-area element is almost always a
        // UA default on something invisible, not a colour the page chose.
        if (ok.l < 0.02 && r.width * r.height < 4) return;
        if (ok.c < min) {
          seen[c] = ok.c;
          area[c] = (area[c] || 0) + r.width * r.height;
        }
      });
    });
    var keys = Object.keys(seen).filter(function (k) { return area[k] > 0; });
    if (keys.length < (p.minDistinctNeutrals || 3)) return [];
    // Say the measured chroma and the floor. "Tinted" is not actionable; a
    // number is \u2014 someone tinted their greys twice because of this rule and it
    // kept firing, because 2% RGB spread is still under 0.005 OKLCH chroma.
    var detail = keys.slice(0, 5).map(function (k) {
      return k + ' (chroma ' + seen[k].toFixed(4) + ')';
    }).join(', ');
    return [hit(document.body, detail + ' \u2014 floor is ' + min + ' OKLCH chroma')];
  };

  CHECKS['contrast-threshold'] = function (p) {
    var out = [];
    all('*').forEach(function (el) {
      if (!isTextBearing(el)) return;
      if (isVisuallyHidden(el)) return;
      // A gradient or image behind the text cannot be measured from computed
      // styles. Reporting a number derived from the wrong surface is worse
      // than reporting nothing \u2014 this is a job for the vision channel.
      if (hasPaintedAncestor(el)) return;
      var s = getComputedStyle(el);
      var fg = parseColor(s.color);
      if (!fg || fg.a < 0.1) return;
      var bg = effectiveBackground(el);
      var size = parseFloat(s.fontSize);
      var weight = parseInt(s.fontWeight, 10) || 400;
      var large = size >= (p.largePx || 24) || (weight >= 700 && size >= (p.largeBoldPx || 18));
      var need = large ? (p.largeRatio || 3) : (p.bodyRatio || 4.5);
      var ratio = contrastRatio(fg, bg);
      if (ratio < need) {
        out.push(hit(el, ratio.toFixed(2) + ':1 needs ' + need + ':1 \u2014 "' + textOf(el) + '"'));
      }
    });
    return out;
  };

  CHECKS['neutral-text-on-chromatic-ground'] = function (p) {
    return all('*').filter(function (el) {
      if (!isTextBearing(el)) return false;
      var fg = toOklch(parseColor(getComputedStyle(el).color));
      var bg = toOklch(effectiveBackground(el));
      if (!fg || !bg) return false;
      return bg.c >= (p.minGroundChroma || 0.04) && fg.c <= (p.maxTextChroma || 0.01);
    }).map(function (el) { return hit(el, 'grey text on chromatic ground: "' + textOf(el) + '"'); });
  };

  CHECKS['chromatic-glow-shadow'] = function (p) {
    var minBlur = p.minBlur || 16;
    return all('*').filter(function (el) {
      var s = getComputedStyle(el);
      var shadows = s.boxShadow + ' ' + s.textShadow;
      if (shadows === 'none none' || !/\\d/.test(shadows)) return false;
      var m = /rgba?\\([^)]+\\)\\s+(-?[\\d.]+)px\\s+(-?[\\d.]+)px\\s+([\\d.]+)px/.exec(shadows);
      if (!m) return false;
      var ox = parseFloat(m[1]), oy = parseFloat(m[2]), blur = parseFloat(m[3]);
      if (blur < minBlur) return false;
      if (p.requiresZeroOffset && (Math.abs(ox) > 2 || Math.abs(oy) > 2)) return false;
      var col = toOklch(parseColor(shadows));
      return !!col && col.c >= (p.minShadowChroma || 0.05);
    }).map(function (el) { return hit(el, getComputedStyle(el).boxShadow.slice(0, 120)); });
  };

  CHECKS['blurred-decorative-blob'] = function (p) {
    var total = viewportArea();
    return all('*').filter(function (el) {
      var s = getComputedStyle(el);
      var m = /blur\\(([\\d.]+)px\\)/.exec(s.filter);
      if (!m || parseFloat(m[1]) < (p.minBlurPx || 40)) return false;
      if (textOf(el).length > 0) return false;
      return area(el) / total >= (p.minAreaShare || 0.08);
    }).map(function (el) { return hit(el, 'blurred decorative element ' + getComputedStyle(el).filter); });
  };

  CHECKS['off-token-color'] = function (p) {
    var seen = {};
    all('*').forEach(function (el) {
      var s = getComputedStyle(el);
      [s.color, s.backgroundColor, s.borderTopColor].forEach(function (c) {
        var col = parseColor(c);
        if (col && col.a > 0.05) seen[c] = (seen[c] || 0) + 1;
      });
    });
    var keys = Object.keys(seen);
    if (keys.length <= (p.maxDistinctColors || 14)) return [];
    return [hit(document.body, keys.length + ' distinct colours in use (ceiling ' + (p.maxDistinctColors || 14) + ')')];
  };

  CHECKS['single-family-default'] = function (p) {
    var defaults = (p.defaults || []).map(function (d) { return d.toLowerCase(); });
    var families = {};
    var total = 0;
    all('*').forEach(function (el) {
      if (!isTextBearing(el)) return;
      var f = getComputedStyle(el).fontFamily.split(',')[0].replace(/["']/g, '').trim().toLowerCase();
      if (!f) return;
      families[f] = (families[f] || 0) + 1;
      total++;
    });
    var keys = Object.keys(families);
    if (!keys.length) return [];

    // Measure by share, not by count of distinct names. One stray element
    // inheriting a UA default should not excuse a page set entirely in Inter.
    var dominant = keys[0];
    keys.forEach(function (k) { if (families[k] > families[dominant]) dominant = k; });
    if (families[dominant] / total < (p.minDominantShare || 0.8)) return [];
    if (!defaults.some(function (d) { return dominant.indexOf(d) !== -1; })) return [];

    // A display face carrying the headings means a decision was made, even if
    // the body is a default.
    var display = all('h1, h2, [class*="title"], [class*="display"]').some(function (h) {
      var f = getComputedStyle(h).fontFamily.split(',')[0].replace(/["']/g, '').trim().toLowerCase();
      return f && f !== dominant;
    });
    if (display) return [];

    return [hit(document.body, Math.round((families[dominant] / total) * 100) + '% of text set in ' + dominant)];
  };

  CHECKS['family-count'] = function (p) {
    var families = {};
    all('*').forEach(function (el) {
      if (!isTextBearing(el)) return;
      var f = getComputedStyle(el).fontFamily.split(',')[0].replace(/["']/g, '').trim().toLowerCase();
      if (f) families[f] = (families[f] || 0) + 1;
    });
    var keys = Object.keys(families);
    if (keys.length <= (p.max || 3)) return [];
    return [hit(document.body, keys.length + ' families: ' + keys.join(', '))];
  };

  CHECKS['italic-heading'] = function () {
    var out = [];
    all('h1, h2, h3, h4, h5, h6, [class*="title"], [class*="display"], [class*="hero"]').forEach(function (el) {
      if (getComputedStyle(el).fontStyle === 'italic') { out.push(hit(el, 'italic: "' + textOf(el) + '"')); return; }
      var inner = el.querySelectorAll('em, i, [class*="italic"]');
      for (var i = 0; i < inner.length; i++) {
        if (getComputedStyle(inner[i]).fontStyle === 'italic') {
          out.push(hit(el, 'italic word inside heading: "' + textOf(el) + '"'));
          return;
        }
      }
    });
    return out;
  };

  CHECKS['type-scale-spread'] = function (p) {
    var sizes = {};
    all('*').forEach(function (el) {
      if (!isTextBearing(el)) return;
      var px = Math.round(parseFloat(getComputedStyle(el).fontSize));
      if (px) sizes[px] = (sizes[px] || 0) + 1;
    });
    var keys = Object.keys(sizes).map(Number).sort(function (a, b) { return a - b; });
    if (!keys.length) return [];
    var body = keys.reduce(function (best, k) { return sizes[k] > sizes[best] ? k : best; }, keys[0]);
    var top = keys[keys.length - 1];
    var ratio = top / body;
    var problems = [];
    if (ratio < (p.minRatioTopToBody || 2.2)) {
      problems.push('largest type is only ' + ratio.toFixed(2) + 'x body');
    }
    if (keys.length < (p.minDistinctSizes || 4)) {
      problems.push('only ' + keys.length + ' distinct sizes');
    }
    return problems.length ? [hit(document.body, problems.join('; '))] : [];
  };

  CHECKS['measure-range'] = function (p) {
    // A narrow measure on a phone is the viewport, not a decision. Only judge
    // measure where the author actually had room to get it wrong.
    if (window.innerWidth < (p.minViewport || 900)) return [];

    return all('p, blockquote').filter(function (el) {
      // Direct text only. A <p> that is mostly nested elements is a layout
      // wrapper, and its box width says nothing about the line length.
      var direct = 0;
      for (var i = 0; i < el.childNodes.length; i++) {
        if (el.childNodes[i].nodeType === 3) direct += el.childNodes[i].textContent.trim().length;
      }
      if (direct < 120) return false;

      var ch = measureCh(el);
      return ch < (p.minCh || 45) || ch > (p.maxCh || 78);
    }).map(function (el) { return hit(el, 'measure ~' + Math.round(measureCh(el)) + 'ch'); });
  };

  // Width of the text box in characters. Uses the rendered width of a real
  // string rather than a fudge factor, because 0.5em is wrong by 30% on a
  // condensed or a monospaced face.
  var _chCache = {};
  function measureCh(el) {
    var s = getComputedStyle(el);
    var key = s.fontFamily + '|' + s.fontSize + '|' + s.fontWeight + '|' + s.letterSpacing;
    if (_chCache[key] === undefined) {
      var probe = document.createElement('span');
      probe.textContent = 'abcdefghijklmnopqrstuvwxyz';
      probe.style.cssText = 'position:absolute;visibility:hidden;white-space:pre;';
      probe.style.font = s.font || (s.fontWeight + ' ' + s.fontSize + '/' + s.lineHeight + ' ' + s.fontFamily);
      probe.style.letterSpacing = s.letterSpacing;
      document.body.appendChild(probe);
      _chCache[key] = probe.getBoundingClientRect().width / 26;
      document.body.removeChild(probe);
    }
    var avg = _chCache[key] || parseFloat(s.fontSize) * 0.5;
    var box = el.getBoundingClientRect().width
      - parseFloat(s.paddingLeft) - parseFloat(s.paddingRight);
    return box / avg;
  }

  CHECKS['leading-ratio'] = function (p) {
    return all('p, li, h1, h2, h3, h4').filter(function (el) {
      if (!isTextBearing(el)) return false;
      var s = getComputedStyle(el);
      var size = parseFloat(s.fontSize);
      var lh = s.lineHeight === 'normal' ? size * 1.2 : parseFloat(s.lineHeight);
      if (!size || !lh) return false;

      // A heading is display type at any size \u2014 tight leading is correct there,
      // and judging a 22px h2 by the body rule flags good typography as bad.
      var isHeading = /^H[1-6]$/.test(el.tagName);
      var ratio = lh / size;

      if (isHeading || size >= 32) return ratio > (p.maxDisplayRatio || 1.35);

      // Single-line body elements have no leading to get wrong.
      if (el.getBoundingClientRect().height < size * 1.9) return false;
      return ratio < (p.minBodyRatio || 1.4);
    }).map(function (el) {
      var s = getComputedStyle(el);
      var size = parseFloat(s.fontSize);
      var lh = s.lineHeight === 'normal' ? size * 1.2 : parseFloat(s.lineHeight);
      return hit(el, 'leading ' + (lh / size).toFixed(2) + ' at ' + s.fontSize);
    });
  };

  CHECKS['font-size-floor'] = function (p) {
    // The rule's own fix promises "14px for anything read as prose, 12px for
    // incidental UI chrome". Treating only interactive elements as chrome broke
    // that promise: an id, a timestamp or a unit label is chrome by any reading,
    // and was being held to the prose floor with no way to satisfy the rule.
    function isChrome(el) {
      if (isInteractive(el)) return true;
      var t = textOf(el);
      if (!t) return true;
      // A short, sentence-less label is chrome. Prose has sentences.
      if (t.length <= 24 && !/[.!?]\\s/.test(t)) return true;
      // Nothing without a space in it is prose. A file path, a url, a hash or
      // an id is chrome at any length \u2014 a 68-character temp path in a menu was
      // being held to the 14px prose floor with no way to satisfy the rule.
      if (!/\\s/.test(t)) return true;
      // Monospace is how a page says "this is an identifier, not sentences".
      if (/mono/i.test(getComputedStyle(el).fontFamily)) return true;
      return /^(label|badge|chip|tag|meta|caption|id|count|unit|hint|status)$/i.test(
        (el.getAttribute('class') || '').split(/[\\s_-]/).pop() || '',
      );
    }
    return all('*').filter(function (el) {
      if (!isTextBearing(el)) return false;
      var px = parseFloat(getComputedStyle(el).fontSize);
      var floor = isChrome(el) ? (p.uiFloorPx || 12) : (p.bodyFloorPx || 14);
      return px < floor;
    }).map(function (el) {
      var chrome = isChrome(el);
      return hit(el, getComputedStyle(el).fontSize + (chrome ? ' chrome' : ' prose') +
        ' (floor ' + (chrome ? (p.uiFloorPx || 12) : (p.bodyFloorPx || 14)) + 'px) \u2014 "' + textOf(el) + '"');
    });
  };

  CHECKS['tracking-bounds'] = function (p) {
    return all('*').filter(function (el) {
      if (!isTextBearing(el)) return false;
      var s = getComputedStyle(el);
      if (s.letterSpacing === 'normal') return false;
      var em = parseFloat(s.letterSpacing) / parseFloat(s.fontSize);
      return em < (p.minEm || -0.05) || em > (p.maxEm || 0.2);
    }).map(function (el) {
      var s = getComputedStyle(el);
      return hit(el, 'tracking ' + (parseFloat(s.letterSpacing) / parseFloat(s.fontSize)).toFixed(3) + 'em');
    });
  };

  CHECKS['uppercase-run-length'] = function (p) {
    return all('p, li, div, span').filter(function (el) {
      if (!isTextBearing(el)) return false;
      var s = getComputedStyle(el);
      var t = textOf(el);
      var isUpper = s.textTransform === 'uppercase' || (t.length > 10 && t === t.toUpperCase() && /[A-Z]/.test(t));
      return isUpper && t.length > (p.maxChars || 60);
    }).map(function (el) { return hit(el, textOf(el)); });
  };

  CHECKS['text-align-justify'] = function () {
    return all('p, li, div').filter(function (el) {
      return isTextBearing(el) && getComputedStyle(el).textAlign === 'justify';
    }).map(function (el) { return hit(el, textOf(el)); });
  };

  CHECKS['display-size-vs-viewport'] = function (p) {
    return all('h1, [class*="hero"] h1, [class*="display"]').filter(function (el) {
      var px = parseFloat(getComputedStyle(el).fontSize);
      return px / window.innerWidth > (p.maxShareOfViewportWidth || 0.14);
    }).map(function (el) {
      return hit(el, getComputedStyle(el).fontSize + ' at ' + window.innerWidth + 'px viewport');
    });
  };

  CHECKS['heading-order'] = function () {
    var headings = all('h1, h2, h3, h4, h5, h6');
    var out = [];
    var prev = 0;
    headings.forEach(function (el) {
      var level = parseInt(el.tagName.charAt(1), 10);
      if (prev && level > prev + 1) {
        out.push(hit(el, 'h' + prev + ' -> h' + level + ': "' + textOf(el) + '"'));
      }
      prev = level;
    });
    return out;
  };

  CHECKS['repeated-eyebrow'] = function (p) {
    var sections = topLevelSections();
    var withEyebrow = sections.filter(function (sec) {
      var first = sec.querySelector('p, span, div');
      if (!first) return false;
      var t = textOf(first);
      if (!t || t.length > 40) return false;
      var s = getComputedStyle(first);
      return s.textTransform === 'uppercase' || parseFloat(s.letterSpacing) > 1;
    });
    if (withEyebrow.length < (p.minSections || 3)) return [];
    return withEyebrow.map(function (el) { return hit(el, 'eyebrow: "' + textOf(el.querySelector('p, span, div')) + '"'); });
  };

  CHECKS['icon-above-heading-triptych'] = function (p) {
    var grids = all('*').filter(function (el) {
      var s = getComputedStyle(el);
      if (s.display !== 'grid') return false;
      var cols = s.gridTemplateColumns.split(' ').filter(Boolean).length;
      return cols === (p.exactColumns || 3);
    });
    var out = [];
    grids.forEach(function (grid) {
      var cards = Array.prototype.slice.call(grid.children);
      if (cards.length < 3) return;
      var matching = cards.filter(function (card) {
        var icon = card.querySelector('svg, img, i, [class*="icon"]');
        var heading = card.querySelector('h1,h2,h3,h4,h5,h6,[class*="title"]');
        if (!icon || !heading) return false;
        return icon.getBoundingClientRect().top < heading.getBoundingClientRect().top;
      });
      if (matching.length >= 3) out.push(hit(grid, matching.length + ' icon-above-heading cards in a 3-column grid'));
    });
    return out;
  };

  CHECKS['centered-axis-stack'] = function (p) {
    var hero = document.querySelector('header + section, main > section:first-child, [class*="hero"]') ||
               topLevelSections()[0];
    if (!hero) return [];
    var h = hero.getBoundingClientRect().height;
    if (h / window.innerHeight < (p.minHeroVh || 0.85)) return [];
    var centered = Array.prototype.slice.call(hero.querySelectorAll('h1, h2, p, a, button, span'))
      .filter(visible)
      .filter(function (el) {
        var s = getComputedStyle(el);
        if (s.textAlign === 'center') return true;
        var r = el.getBoundingClientRect();
        var mid = r.left + r.width / 2;
        return Math.abs(mid - window.innerWidth / 2) < 8;
      });
    if (centered.length < (p.minStackedCentered || 4)) return [];
    return [hit(hero, centered.length + ' elements on the same centred axis in a ' + Math.round(h / window.innerHeight * 100) + 'vh hero')];
  };

  CHECKS['nested-surface'] = function (p) {
    var signals = p.signals || ['borderRadius', 'boxShadow', 'borderWidth'];
    var minSignals = p.minSignals || 2;
    var minPx = p.minSurfacePx || 24;
    var CONTROLS = { INPUT: 1, SELECT: 1, TEXTAREA: 1, BUTTON: 1, OPTION: 1, PROGRESS: 1, METER: 1 };
    function isSurface(el) {
      // A control is not a container. Every design system gives its inputs and
      // buttons a background, a border, a radius and padding, which is four of
      // the four signals below \u2014 so on the first real app this ever scanned,
      // input.field inside div.card was reported as a card inside a card,
      // twelve times, at weight 73. Card-in-card is about two levels of chrome
      // around the same content; a field inside a card is one level of chrome
      // around a control that has always looked like that.
      if (CONTROLS[el.tagName] || el.getAttribute('role') === 'button') return false;
      // Anything smaller than a tap target is an indicator, not a card. A 5px
      // status dot inside a menu item is not a nested surface.
      var r = el.getBoundingClientRect();
      if (r.width < minPx || r.height < minPx) return false;
      var s = getComputedStyle(el);

      // A container holds things: it has its own ground and its own padding.
      // Without that requirement a row carrying a 2px inset state stripe read
      // as a card, and the button inside it read as a card within a card.
      var bg = parseColor(s.backgroundColor);
      var hasGround = (bg && bg.a > 0.02) || parseFloat(s.borderTopWidth) > 0;
      var pad = parseFloat(s.paddingTop) + parseFloat(s.paddingBottom) +
                parseFloat(s.paddingLeft) + parseFloat(s.paddingRight);
      if (!hasGround || pad < 8) return false;

      var n = 0;
      if (parseFloat(s.borderRadius) > 2) n++;
      // An inset shadow is a state marker, not elevation.
      if (s.boxShadow && s.boxShadow !== 'none' && s.boxShadow.indexOf('inset') === -1) n++;
      if (parseFloat(s.borderTopWidth) > 0) n++;
      if (bg && bg.a > 0.02) n++;
      return n >= minSignals;
    }
    return all('*').filter(function (el) {
      if (!isSurface(el)) return false;
      var parent = el.parentElement;
      var depth = 0;
      while (parent && depth < 3) {
        if (isSurface(parent) && parent !== document.body) return true;
        parent = parent.parentElement;
        depth++;
      }
      return false;
    }).map(function (el) { return hit(el, 'surface nested inside another surface'); });
  };

  CHECKS['asymmetric-accent-border'] = function (p) {
    var min = p.minWidthPx || 3;
    return all('*').filter(function (el) {
      var s = getComputedStyle(el);
      var w = [s.borderTopWidth, s.borderRightWidth, s.borderBottomWidth, s.borderLeftWidth].map(parseFloat);
      var thick = w.filter(function (x) { return x >= min; });
      if (thick.length !== 1) return false;
      var idx = w.indexOf(thick[0]);
      if (p.requiresSingleSide && idx !== 1 && idx !== 3) return false;
      var colors = [s.borderTopColor, s.borderRightColor, s.borderBottomColor, s.borderLeftColor];
      var c = toOklch(parseColor(colors[idx]));
      return !!c && c.c > 0.05;
    }).map(function (el) { return hit(el, 'side stripe ' + getComputedStyle(el).borderLeftWidth); });
  };

  CHECKS['section-rhythm-variance'] = function (p) {
    // Nav and footer have their own rhythm by convention, so including them
    // manufactures variance the reader never perceives.
    var sections = bodySections();
    if (sections.length < 3) return [];
    var pads = sections.map(function (s) {
      var cs = getComputedStyle(s);
      return parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
    });
    var cv = coefficientOfVariation(pads);
    if (cv >= (p.minCoefficientOfVariation || 0.18)) return [];

    // The rule is "sections separated only by equal whitespace". A boundary
    // drawn with a rule or a colour shift is legible rhythm even when the
    // padding is uniform, so the tell does not apply.
    var drawn = sections.filter(function (s) {
      var cs = getComputedStyle(s);
      if (parseFloat(cs.borderTopWidth) > 0 || parseFloat(cs.borderBottomWidth) > 0) return true;
      var bg = parseColor(cs.backgroundColor);
      return !!bg && bg.a > 0.02;
    });
    if (drawn.length >= sections.length - 1) return [];

    return [hit(document.body, sections.length + ' sections all padded ~' + Math.round(pads[0]) + 'px with no drawn boundary (variance ' + cv.toFixed(3) + ')')];
  };

  // Elements that sit past the viewport edge.
  //
  // This used to gate on document.scrollWidth, which overflow-x: clip on the
  // root sets equal to clientWidth \u2014 so a page could put three of five nav
  // destinations and a destructive action off-screen at 375px and measure as
  // perfectly clean. Reported from a project that applied the clip *because
  // redpen told it to*. So: measure element rects against the viewport, and
  // treat a clipping root as a reason to look harder rather than as a pass.
  function pastViewport() {
    var vw = window.innerWidth;
    return all('*').filter(function (el) {
      // The standard visually-hidden idiom parks content at -9999px on purpose.
      if (isVisuallyHidden(el)) return false;
      var r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) return false;
      if (r.right <= vw + 1 && r.left >= -1) return false;

      // A wide table inside its own overflow-x: auto wrapper is the correct
      // pattern, not a defect \u2014 measuring it against the viewport rather than
      // against its scroll parent manufactures a finding.
      for (var p = el.parentElement; p && p !== document.documentElement; p = p.parentElement) {
        var ps = getComputedStyle(p);
        if (ps.overflowX === 'auto' || ps.overflowX === 'scroll') {
          var pr = p.getBoundingClientRect();
          if (pr.right <= vw + 1 && pr.left >= -1) return false;
        }
      }
      return true;
    });
  }

  CHECKS['input-zoom-font-size'] = function (p) {
    // iOS Safari zooms the whole page when a text input under 16px takes
    // focus, and does not zoom back out. The layout the author tested is not
    // the layout the user gets, and nothing about the page looks wrong until
    // someone taps a field.
    var floor = p.minFontSizePx || 16;
    var types = /^(text|email|password|search|tel|url|number|date|datetime-local|month|week|time)$/;
    return all('input, select, textarea').filter(function (el) {
      if (el.tagName === 'INPUT') {
        var t = (el.getAttribute('type') || 'text').toLowerCase();
        if (!types.test(t)) return false;
      }
      return parseFloat(getComputedStyle(el).fontSize) < floor;
    }).map(function (el) {
      return hit(el, getComputedStyle(el).fontSize + ' on a focusable field \u2014 iOS zooms below ' + floor + 'px');
    });
  };

  CHECKS['adjacent-tap-targets'] = function (p) {
    // Size is only half of a tap target. Two 44px buttons touching each other
    // still produce mis-taps, because the finger contact patch is wider than
    // the gap between them.
    var min = p.minGapPx || 8;
    var controls = all('a, button, input, select, [role="button"], [role="tab"], [role="menuitem"]')
      .filter(function (el) {
        var r = el.getBoundingClientRect();
        return r.width >= 12 && r.height >= 12;
      });
    var out = [];
    for (var i = 0; i < controls.length && out.length < 8; i++) {
      for (var j = i + 1; j < controls.length; j++) {
        var a = controls[i].getBoundingClientRect();
        var b = controls[j].getBoundingClientRect();
        if (controls[i].contains(controls[j]) || controls[j].contains(controls[i])) continue;
        // Gap along whichever axis they are separated on. Overlapping on both
        // means one is stacked over the other, which is a different defect.
        var gapX = Math.max(a.left - b.right, b.left - a.right);
        var gapY = Math.max(a.top - b.bottom, b.top - a.bottom);
        var overlapX = gapX < 0;
        var overlapY = gapY < 0;
        if (overlapX && overlapY) continue;
        var gap = overlapY ? gapX : (overlapX ? gapY : Math.max(gapX, gapY));
        if (gap >= 0 && gap < min) {
          out.push(hit(controls[i], Math.round(gap) + 'px from the next control, floor is ' + min + 'px \u2014 "' + textOf(controls[i]) + '"'));
          break;
        }
      }
    }
    return out;
  };

  CHECKS['wrapped-control-label'] = function (p) {
    // A button whose label wraps was sized for a shorter string than the one
    // it holds. It reads as a layout accident rather than a decision, and it
    // is the first thing a longer translation breaks.
    var minWidth = p.desktopOnlyAbovePx || 1000;
    if (window.innerWidth < minWidth) return [];
    return all('button, a[class], [role="button"], input[type=submit]').filter(function (el) {
      var t = textOf(el);
      if (!t || t.length < 2) return false;
      var s = getComputedStyle(el);
      if (s.display === 'inline') return false;
      if (s.whiteSpace === 'nowrap' || s.whiteSpace === 'pre') return false;
      // Comparing box height to line height counted an icon beside the label,
      // or any extra padding, as a wrap \u2014 it fired on a correct button in the
      // clean fixture. Count the text's own line boxes instead: a Range over
      // the text node yields one client rect per rendered line.
      var lines = 0;
      for (var i = 0; i < el.childNodes.length; i++) {
        var n = el.childNodes[i];
        if (n.nodeType !== 3 || !n.textContent.trim()) continue;
        var range = document.createRange();
        range.selectNodeContents(n);
        var rects = range.getClientRects();
        // Rects on the same baseline are one line split by inline markup.
        var tops = {};
        for (var k = 0; k < rects.length; k++) {
          if (rects[k].width > 0) tops[Math.round(rects[k].top)] = 1;
        }
        lines += Object.keys(tops).length;
      }
      return lines > 1;
    }).map(function (el) {
      return hit(el, 'label wraps to more than one line at ' + window.innerWidth + 'px \u2014 "' + textOf(el) + '"');
    });
  };

  CHECKS['empty-grid-cell'] = function (p) {
    // A grid whose item count does not fill its final row. The gap reads as a
    // missing card rather than a choice, and it is what happens when a layout
    // was written for a number of items the content did not supply.
    var minItems = p.minItems || 4;
    return all('*').filter(function (el) {
      var s = getComputedStyle(el);
      if (s.display !== 'grid') return false;
      var cols = (s.gridTemplateColumns || '').split(' ').filter(Boolean).length;
      if (cols < 2) return false;
      var items = Array.prototype.slice.call(el.children).filter(visible);
      if (items.length < minItems) return false;
      // A single full row, or an exactly-filled grid, is fine.
      if (items.length <= cols) return false;
      return items.length % cols !== 0;
    }).map(function (el) {
      var s = getComputedStyle(el);
      var cols = (s.gridTemplateColumns || '').split(' ').filter(Boolean).length;
      var n = Array.prototype.slice.call(el.children).filter(visible).length;
      return hit(el, n + ' items in a ' + cols + '-column grid leaves ' + (cols - (n % cols)) + ' empty cell(s) in the last row');
    });
  };

  CHECKS['horizontal-scroll'] = function () {
    var doc = document.documentElement;
    var rootClips = /clip|hidden/.test(getComputedStyle(doc).overflowX);
    var scrolls = doc.scrollWidth > window.innerWidth + 1;
    if (!rootClips && !scrolls) return [];

    var culprits = pastViewport();
    if (!culprits.length) {
      if (!scrolls) return [];
      return [hit(document.body, (doc.scrollWidth - window.innerWidth) + 'px of horizontal overflow at ' + window.innerWidth + 'px')];
    }

    return culprits.slice(0, 6).map(function (el) {
      var over = Math.round(el.getBoundingClientRect().right - window.innerWidth);
      // Clipped is strictly worse than scrollable: the reader cannot even drag
      // to it. Say which, because the two need different fixes.
      var how = rootClips
        ? over + 'px past the edge at ' + window.innerWidth + 'px \u2014 unreachable, the root sets overflow-x: ' + getComputedStyle(doc).overflowX
        : over + 'px past the edge at ' + window.innerWidth + 'px';
      return hit(el, how + (textOf(el) ? ': "' + textOf(el) + '"' : ''));
    });
  };

  CHECKS['clipped-text'] = function (p) {
    var min = p.minOverflowPx || 2;
    return all('*').filter(function (el) {
      if (!isTextBearing(el)) return false;
      // A visually-hidden label is clipped on purpose.
      if (isVisuallyHidden(el)) return false;
      // A textarea scrolls by contract \u2014 scrollHeight > clientHeight is its
      // resting state, not clipped content. Same for a multi-row select.
      var tag = el.tagName;
      if (tag === 'TEXTAREA' || tag === 'SELECT') return false;
      var s = getComputedStyle(el);
      if (s.overflow === 'visible' && s.overflowY === 'visible') return false;
      if (/ellipsis/.test(s.textOverflow)) return false;
      return el.scrollHeight > el.clientHeight + min || el.scrollWidth > el.clientWidth + min;
    }).map(function (el) { return hit(el, 'content clipped: "' + textOf(el) + '"'); });
  };

  CHECKS['edge-gutter'] = function (p) {
    var min = p.minGutterPx || 16;
    return all('p, h1, h2, h3, li').filter(function (el) {
      if (!isTextBearing(el)) return false;
      if (isVisuallyHidden(el)) return false;
      var r = el.getBoundingClientRect();
      return r.left < min || (window.innerWidth - r.right) < min;
    }).map(function (el) {
      var r = el.getBoundingClientRect();
      return hit(el, Math.round(Math.min(r.left, window.innerWidth - r.right)) + 'px from the viewport edge');
    });
  };

  CHECKS['control-padding-floor'] = function (p) {
    var minH = p.minHeightPx || 44;
    return all('button, a, input, select, [role="button"]').filter(function (el) {
      var r = el.getBoundingClientRect();
      if (r.height === 0) return false;

      // Off-canvas by design \u2014 skip links, focus-revealed controls. Their
      // resting geometry is not what the user ever touches.
      if (r.right < 0 || r.left > window.innerWidth) return false;

      var s = getComputedStyle(el);

      // A link is only a control when it is drawn as one. A styled anchor with
      // no fill, border, or radius is running text and has no height floor.
      if (el.tagName === 'A') {
        var bg = parseColor(s.backgroundColor);
        var painted = (bg && bg.a > 0.05) ||
                      parseFloat(s.borderTopWidth) > 0 ||
                      parseFloat(s.borderRadius) > 2;
        if (!painted) return false;
      }

      return r.height < minH || parseFloat(s.paddingLeft) < (p.minPaddingX || 12);
    }).map(function (el) {
      // Say the assumption. A page may well have a coarse-pointer rule that
      // grows this control; the scan runs with a fine pointer and never
      // triggers it, and "32px tall" reads as unconditional without this.
      return hit(el, Math.round(el.getBoundingClientRect().height) +
        'px tall at ' + window.innerWidth + 'px with a fine pointer \u2014 "' + textOf(el) + '"');
    });
  };

  CHECKS['sibling-control-height'] = function (p) {
    var max = p.maxDeltaPx || 2;
    var out = [];
    all('form, [class*="form"], [class*="input-group"]').forEach(function (form) {
      var controls = Array.prototype.slice.call(form.querySelectorAll('input, select, button'))
        .filter(visible)
        .filter(function (el) { return el.type !== 'checkbox' && el.type !== 'radio' && el.type !== 'hidden'; });
      if (controls.length < 2) return;
      var heights = controls.map(function (c) { return Math.round(c.getBoundingClientRect().height); });
      var span = Math.max.apply(null, heights) - Math.min.apply(null, heights);
      if (span > max) out.push(hit(form, 'control heights differ by ' + span + 'px: ' + heights.join(', ')));
    });
    return out;
  };

  CHECKS['flex-baseline-drift'] = function (p) {
    var max = p.maxDeltaPx || 3;
    var out = [];
    all('*').forEach(function (el) {
      var s = getComputedStyle(el);
      if (s.display !== 'flex' || s.flexDirection.indexOf('column') === 0) return;
      if (s.alignItems === 'center' || s.alignItems === 'baseline') return;
      var kids = Array.prototype.slice.call(el.children).filter(visible);
      if (kids.length < 2) return;
      var centers = kids.map(function (k) {
        var r = k.getBoundingClientRect();
        return r.top + r.height / 2;
      });
      var span = Math.max.apply(null, centers) - Math.min.apply(null, centers);
      if (span > max) out.push(hit(el, 'row items off-centre by ' + Math.round(span) + 'px (align-items: ' + s.alignItems + ')'));
    });
    return out;
  };

  CHECKS['duplicate-block-text'] = function (p) {
    var counts = {};
    all('p, h2, h3, li, span').forEach(function (el) {
      var t = textOf(el);
      if (t.length < (p.minLength || 24)) return;
      // The rule looks for placeholder prose that survived into production.
      // An identifier repeating is data, not copy: three queue rows naming the
      // same file is how you see one file blocking three items. Prose has
      // spaces and does not look like a path, a url, or a code point.
      if (!/\\s/.test(t)) return;
      if (/^[^\\s]+\\/[^\\s]+$/.test(t)) return;
      if (el.closest('a[href], code, pre, kbd, samp')) return;
      counts[t] = (counts[t] || 0) + 1;
    });
    return Object.keys(counts)
      .filter(function (t) { return counts[t] >= (p.minRepeats || 3); })
      .slice(0, 5)
      .map(function (t) { return { selector: 'body', excerpt: 'repeated ' + counts[t] + 'x: "' + t + '"' }; });
  };

  CHECKS['repeating-background-pattern'] = function (p) {
    var total = viewportArea();
    return all('*').filter(function (el) {
      var img = getComputedStyle(el).backgroundImage;
      if (!/repeating-(linear|radial)-gradient/.test(img)) return false;
      return area(el) / total >= (p.minAreaShare || 0.3);
    }).map(function (el) { return hit(el, getComputedStyle(el).backgroundImage.slice(0, 120)); });
  };

  CHECKS['uniform-entrance-animation'] = function (p) {
    var sections = topLevelSections();
    var animated = sections.filter(function (s) {
      var cs = getComputedStyle(s);
      if (cs.animationName !== 'none') return true;
      var inner = s.querySelector('[style*="opacity"], [class*="fade"], [class*="animate"], [data-aos]');
      return !!inner;
    });
    if (animated.length < (p.minAnimatedSections || 4)) return [];
    return [hit(document.body, animated.length + ' of ' + sections.length + ' sections carry an entrance animation')];
  };

  CHECKS['transition-property-all'] = function () {
    return all('*').filter(function (el) {
      var s = getComputedStyle(el);
      // "all" is the CSS initial value, so every element on every page reports
      // it. Only an element that actually transitions has made the mistake.
      if (s.transitionProperty !== 'all') return false;
      return parseFloat(s.transitionDuration) > 0;
    }).slice(0, 10).map(function (el) {
      return hit(el, 'transition: all ' + getComputedStyle(el).transitionDuration);
    });
  };

  CHECKS['uniform-hover-transform'] = function (p) {
    // Hover styles are not in the computed cascade at rest, so read the
    // stylesheets instead. Same-origin only; cross-origin sheets throw.
    var rules = [];
    for (var i = 0; i < document.styleSheets.length; i++) {
      try {
        var cssRules = document.styleSheets[i].cssRules;
        for (var j = 0; j < cssRules.length; j++) {
          var r = cssRules[j];
          if (r.selectorText && /:hover/.test(r.selectorText) && /scale\\(/.test(r.style.transform || '')) {
            rules.push({ sel: r.selectorText, transform: r.style.transform });
          }
        }
      } catch (e) { /* cross-origin stylesheet */ }
    }
    var byTransform = {};
    rules.forEach(function (r) { (byTransform[r.transform] = byTransform[r.transform] || []).push(r.sel); });
    var out = [];
    Object.keys(byTransform).forEach(function (t) {
      var sels = byTransform[t];
      if (sels.length >= (p.minElements || 4)) {
        out.push({ selector: sels.slice(0, 3).join(', '), excerpt: t + ' on ' + sels.length + ' distinct selectors' });
      }
    });
    return out;
  };

  CHECKS['overshoot-timing-function'] = function () {
    return all('*').filter(function (el) {
      var tf = getComputedStyle(el).transitionTimingFunction + ' ' + getComputedStyle(el).animationTimingFunction;
      var m = /cubic-bezier\\(([^)]+)\\)/.exec(tf);
      if (!m) return false;
      var nums = m[1].split(',').map(parseFloat);
      return nums.length === 4 && (nums[1] > 1.05 || nums[3] > 1.05);
    }).slice(0, 8).map(function (el) { return hit(el, getComputedStyle(el).transitionTimingFunction); });
  };

  CHECKS['layout-affecting-transition'] = function () {
    var layoutProps = /\\b(width|height|top|left|right|bottom|margin|padding)\\b/;
    return all('*').filter(function (el) {
      var tp = getComputedStyle(el).transitionProperty;
      return tp !== 'none' && tp !== 'all' && layoutProps.test(tp);
    }).slice(0, 10).map(function (el) { return hit(el, 'transition-property: ' + getComputedStyle(el).transitionProperty); });
  };

  CHECKS['reduced-motion-coverage'] = function () {
    var hasMotion = all('*').some(function (el) {
      var s = getComputedStyle(el);
      return s.animationName !== 'none' || (s.transitionDuration !== '0s' && s.transitionProperty !== 'none');
    });
    if (!hasMotion) return [];
    var covered = false;
    for (var i = 0; i < document.styleSheets.length; i++) {
      try {
        var rules = document.styleSheets[i].cssRules;
        for (var j = 0; j < rules.length; j++) {
          if (rules[j].conditionText && /prefers-reduced-motion/.test(rules[j].conditionText)) covered = true;
        }
      } catch (e) { /* cross-origin */ }
    }
    return covered ? [] : [hit(document.body, 'page animates with no prefers-reduced-motion block')];
  };

  CHECKS['infinite-small-pulse'] = function (p) {
    return all('*').filter(function (el) {
      var s = getComputedStyle(el);
      if (s.animationIterationCount !== 'infinite') return false;
      var r = el.getBoundingClientRect();
      return r.width <= (p.maxElementPx || 16) && r.height <= (p.maxElementPx || 16);
    }).map(function (el) { return hit(el, 'infinite animation on a ' + Math.round(el.getBoundingClientRect().width) + 'px element'); });
  };

  CHECKS['continuous-translate-loop'] = function () {
    return all('*').filter(function (el) {
      var s = getComputedStyle(el);
      if (s.animationIterationCount !== 'infinite') return false;
      if (parseFloat(s.animationDuration) <= 3) return false;
      // A slow infinite fade is a pulse, not a marquee. Require travel.
      return /translate|marquee|scroll/i.test(s.animationName + ' ' + s.transform);
    }).slice(0, 5).map(function (el) {
      var s = getComputedStyle(el);
      return hit(el, s.animationName + ' ' + s.animationDuration + ' infinite');
    });
  };

  CHECKS['focus-ring-transition'] = function () {
    var out = [];
    for (var i = 0; i < document.styleSheets.length; i++) {
      try {
        var rules = document.styleSheets[i].cssRules;
        for (var j = 0; j < rules.length; j++) {
          var r = rules[j];
          if (!r.selectorText || !/:focus/.test(r.selectorText)) continue;
          var t = r.style.transition || r.style.transitionProperty || '';
          if (/outline|box-shadow|all/.test(t)) {
            out.push({ selector: r.selectorText, excerpt: 'focus ring transitions: ' + t });
          }
        }
      } catch (e) { /* cross-origin */ }
    }
    return out;
  };

  CHECKS['radius-uniformity'] = function (p) {
    var radii = {};
    all('*').forEach(function (el) {
      var r = Math.round(parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0);
      if (r > 0) radii[r] = (radii[r] || 0) + 1;
    });
    var keys = Object.keys(radii).map(Number);
    if (!keys.length) return [];
    var total = keys.reduce(function (a, k) { return a + radii[k]; }, 0);
    var max = Math.max.apply(null, keys);
    var shareAtMax = radii[max] / total;
    var problems = [];
    if (keys.length < (p.minDistinctRadii || 2)) problems.push('only one radius in use (' + max + 'px)');
    if (shareAtMax > (p.maxShareAtMaxRadius || 0.6)) {
      problems.push(Math.round(shareAtMax * 100) + '% of rounded elements use the largest radius');
    }
    return problems.length ? [hit(document.body, problems.join('; '))] : [];
  };

  CHECKS['shadow-uniformity'] = function (p) {
    var shadows = {};
    all('*').forEach(function (el) {
      var s = getComputedStyle(el).boxShadow;
      if (s && s !== 'none') shadows[s] = (shadows[s] || 0) + 1;
    });
    var keys = Object.keys(shadows);
    if (!keys.length) return [];
    var problems = [];
    if (keys.length > (p.maxDistinctShadows || 2)) problems.push(keys.length + ' distinct shadows');
    if (p.requiresNeutralShadow) {
      var neutral = keys.filter(function (k) {
        var c = toOklch(parseColor(k));
        return c && c.c < 0.01;
      });
      if (neutral.length) problems.push(neutral.length + ' untinted black shadow(s)');
    }
    return problems.length ? [hit(document.body, problems.join('; '))] : [];
  };

  CHECKS['border-and-shadow-double-edge'] = function () {
    return all('*').filter(function (el) {
      var s = getComputedStyle(el);
      var hasBorder = parseFloat(s.borderTopWidth) > 0 && parseFloat(s.borderTopWidth) <= 1.5;
      var hasWideShadow = /(\\d{2,})px/.test(s.boxShadow) && s.boxShadow !== 'none';
      return hasBorder && hasWideShadow;
    }).slice(0, 8).map(function (el) { return hit(el, 'hairline border + wide shadow on the same edge'); });
  };

  CHECKS['backdrop-blur-over-flat'] = function () {
    return all('*').filter(function (el) {
      var s = getComputedStyle(el);
      if (!/blur/.test(s.backdropFilter || s.webkitBackdropFilter || '')) return false;
      // Blur is only meaningful over content. If the thing behind is one flat
      // colour, the effect is invisible and only costs paint time.
      var behind = el.parentElement ? effectiveBackground(el.parentElement) : null;
      var parentHasContent = el.parentElement && el.parentElement.querySelectorAll('img, svg, video, canvas').length > 0;
      return !!behind && !parentHasContent;
    }).map(function (el) { return hit(el, 'backdrop-blur over a flat surface'); });
  };

  CHECKS['card-content-uniformity'] = function (p) {
    var out = [];
    all('*').forEach(function (grid) {
      var s = getComputedStyle(grid);
      if (s.display !== 'grid' && s.display !== 'flex') return;
      var cards = Array.prototype.slice.call(grid.children).filter(visible);
      if (cards.length < (p.minCards || 3)) return;

      // Only judge things drawn as cards. An <ol> of numbered steps is a
      // sequence \u2014 items of similar length there are a sign of good editing,
      // not of content written to fill a component.
      var cardish = cards.filter(function (c) {
        var cs = getComputedStyle(c);
        var bg = parseColor(cs.backgroundColor);
        return (bg && bg.a > 0.02) ||
               parseFloat(cs.borderTopWidth) > 0 && parseFloat(cs.borderLeftWidth) > 0 ||
               (cs.boxShadow && cs.boxShadow !== 'none');
      });
      if (cardish.length < cards.length) return;

      // Full text length, not the truncated excerpt \u2014 textOf caps at 80 chars,
      // which made every card of any real length look identical.
      var lengths = cards.map(function (c) {
        return (c.textContent || '').replace(/\\s+/g, ' ').trim().length;
      }).filter(function (l) { return l > 0; });
      if (lengths.length < cards.length) return;

      var cv = coefficientOfVariation(lengths);
      if (cv < (p.maxTextLengthVariance || 0.15)) {
        out.push(hit(grid, cards.length + ' cards with near-identical content length (variance ' + cv.toFixed(3) + ')'));
      }
    });
    return out;
  };

  CHECKS['chip-density'] = function (p) {
    var out = [];
    topLevelSections().forEach(function (sec) {
      var chips = Array.prototype.slice.call(sec.querySelectorAll('span, div')).filter(function (el) {
        if (!visible(el) || !isTextBearing(el)) return false;
        var s = getComputedStyle(el);
        var r = el.getBoundingClientRect();
        return parseFloat(s.borderRadius) >= r.height / 2 - 2 && r.height < 40 && textOf(el).length < 24;
      });
      if (chips.length > (p.maxChipsPerSection || 6)) {
        out.push(hit(sec, chips.length + ' chips in one section'));
      }
    });
    return out;
  };

  CHECKS['emoji-in-ui-slot'] = function () {
    var EMOJI = /[\\u{1F300}-\\u{1FAFF}\\u{2600}-\\u{27BF}\\u{2B00}-\\u{2BFF}]/u;
    return all('button, a, li, h1, h2, h3, h4, [class*="card"] > *, [class*="feature"] > *')
      .filter(function (el) {
        var t = textOf(el);
        return t.length > 0 && t.length < 60 && EMOJI.test(t);
      })
      .slice(0, 10)
      .map(function (el) { return hit(el, textOf(el)); });
  };

  CHECKS['icon-stroke-variance'] = function (p) {
    var widths = {};
    all('svg').forEach(function (svg) {
      // A filled mark draws no stroke, so its *computed* stroke-width is the
      // SVG initial value of 1 \u2014 a number nobody authored. Counting it made a
      // brand mark beside stroked nav icons read as two icon libraries, which
      // is a normal and deliberate pairing.
      var parts = Array.prototype.slice.call(svg.querySelectorAll('*'));
      parts.unshift(svg);
      var stroked = parts.filter(function (el) {
        var st = getComputedStyle(el).stroke;
        return st && st !== 'none';
      });
      if (!stroked.length) return;
      var w = svg.getAttribute('stroke-width') ||
              (svg.querySelector('[stroke-width]') || {}).getAttribute?.('stroke-width') ||
              getComputedStyle(stroked[0]).strokeWidth;
      if (w && w !== '0px' && w !== 'none') widths[String(parseFloat(w))] = (widths[String(parseFloat(w))] || 0) + 1;
    });
    var keys = Object.keys(widths).filter(function (k) { return k !== 'NaN'; });
    if (keys.length <= (p.maxDistinctStrokeWidths || 1)) return [];
    return [hit(document.body, 'icon stroke widths in use: ' + keys.join(', '))];
  };

  CHECKS['icon-tile-above-heading'] = function (p) {
    var tiles = all('*').filter(function (el) {
      var r = el.getBoundingClientRect();
      if (r.width < 28 || r.width > 72) return false;
      if (Math.abs(r.width - r.height) > 4) return false;
      var s = getComputedStyle(el);
      if (parseFloat(s.borderRadius) < 4) return false;
      var bg = parseColor(s.backgroundColor);
      if (!bg || bg.a < 0.03) return false;
      // The glyph inside is often an emoji rather than an icon element, which
      // is the same component with a worse choice inside it.
      if (el.querySelector('svg, img, i')) return true;
      var t = textOf(el);
      return t.length > 0 && t.length <= 3;
    });
    if (tiles.length < (p.minInstances || 3)) return [];
    return tiles.slice(0, 6).map(function (el) { return hit(el, 'icon tile ' + Math.round(el.getBoundingClientRect().width) + 'px'); });
  };

  CHECKS['image-load-failure'] = function () {
    return Array.prototype.slice.call(document.images)
      .filter(function (img) { return img.complete && img.naturalWidth === 0; })
      .map(function (img) { return hit(img, 'failed to load: ' + img.getAttribute('src')); });
  };

  CHECKS['primitive-shape-cluster'] = function (p) {
    return all('svg').filter(function (svg) {
      var shapes = svg.querySelectorAll('circle, rect, ellipse, path[d]');
      if (shapes.length < (p.minShapes || 8)) return false;
      var kinds = {};
      Array.prototype.forEach.call(shapes, function (s) { kinds[s.tagName] = 1; });
      return Object.keys(kinds).length <= (p.maxDistinctShapeTypes || 3);
    }).map(function (svg) { return hit(svg, svg.querySelectorAll('circle, rect, ellipse, path').length + ' primitive shapes'); });
  };

  CHECKS['svg-accessible-name'] = function () {
    return all('svg').filter(function (svg) {
      if (svg.getAttribute('aria-hidden') === 'true') return false;
      if (svg.getAttribute('aria-label') || svg.getAttribute('aria-labelledby')) return false;
      if (svg.querySelector('title')) return false;
      return true;
    }).slice(0, 10).map(function (svg) { return hit(svg, 'inline svg with no accessible name and no aria-hidden'); });
  };

  CHECKS['img-alt-presence'] = function () {
    return Array.prototype.slice.call(document.images)
      .filter(function (img) { return !img.hasAttribute('alt'); })
      .map(function (img) { return hit(img, 'no alt attribute: ' + img.getAttribute('src')); });
  };

  CHECKS['duplicate-cta-label'] = function (p) {
    var counts = {};
    all('a, button').forEach(function (el) {
      var t = textOf(el).toLowerCase();
      if (t.length > 1 && t.length < 32) counts[t] = (counts[t] || 0) + 1;
    });
    return Object.keys(counts)
      .filter(function (t) { return counts[t] >= (p.minRepeats || 3); })
      .slice(0, 5)
      .map(function (t) { return { selector: 'a, button', excerpt: '"' + t + '" appears ' + counts[t] + ' times' }; });
  };

  CHECKS['empty-container'] = function () {
    return all('ul, ol, tbody, [role="list"]').filter(function (el) {
      return el.children.length === 0 && textOf(el).length === 0;
    }).map(function (el) { return hit(el, 'empty list container with no empty state'); });
  };

  CHECKS['hover-revealed-control'] = function () {
    var out = [];
    for (var i = 0; i < document.styleSheets.length; i++) {
      try {
        var rules = document.styleSheets[i].cssRules;
        for (var j = 0; j < rules.length; j++) {
          var r = rules[j];
          if (!r.selectorText || !/:hover/.test(r.selectorText)) continue;
          if (/opacity\\s*:\\s*1/.test(r.cssText) || /visibility\\s*:\\s*visible/.test(r.cssText)) {
            out.push({ selector: r.selectorText, excerpt: 'control only revealed on hover' });
          }
        }
      } catch (e) { /* cross-origin */ }
    }
    return out.slice(0, 8);
  };

  CHECKS['interactive-state-coverage'] = function (p) {
    var required = p.required || ['hover', 'focus-visible', 'active', 'disabled'];
    var covered = {};
    for (var i = 0; i < document.styleSheets.length; i++) {
      try {
        var rules = document.styleSheets[i].cssRules;
        for (var j = 0; j < rules.length; j++) {
          var sel = rules[j].selectorText || '';
          required.forEach(function (state) {
            if (sel.indexOf(':' + state) !== -1) covered[state] = true;
          });
        }
      } catch (e) { /* cross-origin */ }
    }
    var missing = required.filter(function (s) { return !covered[s]; });
    if (!missing.length) return [];
    return [hit(document.body, 'no styling found for: ' + missing.join(', '))];
  };

  CHECKS['nonsemantic-interactive'] = function () {
    return all('div, span').filter(function (el) {
      if (isInteractive(el)) return false;
      var s = getComputedStyle(el);
      return s.cursor === 'pointer';
    }).slice(0, 10).map(function (el) { return hit(el, 'cursor:pointer with no role or tabindex \u2014 "' + textOf(el) + '"'); });
  };

  CHECKS['skip-link-present'] = function () {
    var links = Array.prototype.slice.call(document.querySelectorAll('a[href^="#"]'));
    var found = links.some(function (a) { return /skip/i.test(a.textContent || ''); });
    return found ? [] : [hit(document.body, 'no skip-to-content link')];
  };

  CHECKS['nav-current-marker'] = function () {
    var navs = all('nav');
    if (!navs.length) return [];
    var marked = navs.filter(function (nav) {
      return nav.querySelector('[aria-current], .active, [data-active="true"], [class*="active"]');
    });
    return marked.length ? [] : navs.slice(0, 2).map(function (n) { return hit(n, 'no current-page indicator'); });
  };

  CHECKS['dialog-dismissal'] = function () {
    return all('[role="dialog"], dialog, [class*="modal"]').filter(function (el) {
      var hasClose = el.querySelector('[aria-label*="lose" i], [class*="close"], button[data-dismiss]');
      return !hasClose;
    }).map(function (el) { return hit(el, 'dialog with no visible close control'); });
  };

  CHECKS['html-lang-present'] = function () {
    var lang = document.documentElement.getAttribute('lang');
    return lang ? [] : [{ selector: 'html', excerpt: 'no lang attribute' }];
  };

  CHECKS['control-accessible-name'] = function () {
    return all('input, select, textarea').filter(function (el) {
      if (el.type === 'hidden' || el.type === 'submit' || el.type === 'button') return false;
      if (el.getAttribute('aria-label') || el.getAttribute('aria-labelledby')) return false;
      if (el.id && document.querySelector('label[for="' + CSS.escape(el.id) + '"]')) return false;
      if (el.closest('label')) return false;
      return true;
    }).map(function (el) { return hit(el, '<' + el.tagName.toLowerCase() + '> with no accessible name'); });
  };

  CHECKS['color-only-state'] = function () {
    return all('[class*="error"], [class*="success"], [class*="warning"], [aria-invalid="true"]')
      .filter(function (el) {
        var hasIcon = el.querySelector('svg, img, [class*="icon"]');
        var hasText = textOf(el).length > 2;
        return !hasIcon && !hasText;
      })
      .map(function (el) { return hit(el, 'state carried by colour alone'); });
  };

  CHECKS['disabled-signal-channels'] = function (p) {
    var min = p.minChannels || 3;
    return all('[disabled], [aria-disabled="true"], [class*="disabled"]').filter(function (el) {
      var s = getComputedStyle(el);
      var channels = 0;
      if (parseFloat(s.opacity) < 1) channels++;
      if (s.cursor === 'not-allowed') channels++;
      if (el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true') channels++;
      return channels < min;
    }).map(function (el) { return hit(el, 'disabled signalled through too few channels'); });
  };


  /* ---- browser surfaces -------------------------------------------------
   * The parts nobody drew still carry the design. Selection, caret, scrollbar,
   * focus ring, underline offset and tabular numerals all ship with browser
   * defaults belonging to no design system \u2014 the cheapest signal a page was built
   * rather than assembled, and the one models skip most reliably.
   *
   * All six read the stylesheets rather than computed styles, because a
   * pseudo-element that was never authored has no computed style to inspect.
   * ------------------------------------------------------------------- */

  function eachRule(fn) {
    // Since CSS Nesting shipped, every CSSStyleRule carries a cssRules list \u2014
    // usually empty. An empty CSSRuleList is still an object, so a truthiness
    // check descends into nothing and never visits the rule itself. Visit
    // first, then recurse only when there is something to recurse into.
    function walk(r) {
      if (r.selectorText || r.style) fn(r);
      if (r.cssRules && r.cssRules.length) {
        for (var k = 0; k < r.cssRules.length; k++) walk(r.cssRules[k]);
      }
    }
    for (var i = 0; i < document.styleSheets.length; i++) {
      var rules;
      try { rules = document.styleSheets[i].cssRules; } catch (e) { continue; }
      if (!rules) continue;
      for (var j = 0; j < rules.length; j++) walk(rules[j]);
    }
  }

  function anySelector(re) {
    var found = false;
    eachRule(function (r) { if (r.selectorText && re.test(r.selectorText)) found = true; });
    return found;
  }

  function anyDeclaration(prop) {
    var found = false;
    eachRule(function (r) {
      if (r.style && r.style.getPropertyValue(prop)) found = true;
    });
    return found;
  }

  CHECKS['selection-unthemed'] = function () {
    if (anySelector(/::(-moz-)?selection/)) return [];
    // Only a finding on a page with enough prose for anyone to select any.
    var prose = all('p, li, article, main').reduce(function (n, el) {
      return n + textOf(el).length;
    }, 0);
    if (prose < 400) return [];
    return [hit(document.body, 'no ::selection rule \u2014 highlight falls back to the browser blue')];
  };

  CHECKS['caret-unthemed'] = function (p) {
    var fields = all('input:not([type=checkbox]):not([type=radio]):not([type=hidden]), textarea, [contenteditable="true"]');
    if (fields.length < (p.minFields || 1)) return [];
    if (anyDeclaration('caret-color')) return [];
    return [hit(fields[0], fields.length + ' text field(s) with no caret-color')];
  };

  CHECKS['scrollbar-unthemed'] = function () {
    var scrollers = all('*').filter(function (el) {
      var s = getComputedStyle(el);
      if (!/auto|scroll/.test(s.overflowY + ' ' + s.overflowX)) return false;
      return el.scrollHeight > el.clientHeight + 8 || el.scrollWidth > el.clientWidth + 8;
    });
    if (!scrollers.length) return [];
    if (anySelector(/::-webkit-scrollbar/) || anyDeclaration('scrollbar-color') ||
        anyDeclaration('scrollbar-width')) return [];
    return scrollers.slice(0, 4).map(function (el) {
      return hit(el, 'scrolling container with an unthemed scrollbar');
    });
  };

  CHECKS['focus-ring-unthemed'] = function () {
    // A page with no :focus-visible rule at all is already caught by
    // interactive-state-coverage. This is the subtler case: the rule exists
    // but only turns the ring off, or leaves the UA default in place.
    var themed = false, suppressedOnly = false;
    eachRule(function (r) {
      if (!r.selectorText || !/:focus(-visible)?/.test(r.selectorText)) return;
      // "outline" is a shorthand and the CSSOM expands it, so a rule that sets
      // it correctly returns empty for the shorthand. Read the longhands too.
      var outline = [
        'outline', 'outline-style', 'outline-width', 'outline-color', 'box-shadow',
      ].map(function (prop) { return r.style.getPropertyValue(prop); }).join(' ');
      if (/none|0px|^\\s*$/.test(outline) && !/solid|auto|rgb|#|var\\(/.test(outline)) {
        suppressedOnly = true;
      }
      if (/solid|double|dashed|rgb|#|var\\(/.test(outline)) themed = true;
    });
    if (themed) return [];
    if (!all('a, button, input, select, textarea, [tabindex]').length) return [];
    return [hit(document.body, suppressedOnly
      ? 'focus rings are switched off without a replacement'
      : 'no themed focus ring \u2014 the browser default is doing the work')];
  };

  CHECKS['underline-default'] = function (p) {
    var links = all('p a, li a, article a, main a').filter(function (a) {
      return getComputedStyle(a).textDecorationLine.indexOf('underline') !== -1;
    });
    if (links.length < (p.minLinks || 2)) return [];
    if (anyDeclaration('text-underline-offset') || anyDeclaration('text-decoration-thickness')) return [];
    return [hit(links[0], links.length + ' underlined in-prose link(s) at the default offset and thickness')];
  };

  CHECKS['tabular-nums-missing'] = function () {
    var out = [];
    all('table').forEach(function (table) {
      var cells = Array.prototype.slice.call(table.querySelectorAll('td'));
      // A column is numeric when most of its cells are numbers.
      var numeric = cells.filter(function (c) {
        return /^[\\s$\xA3\u20AC]*[\\d,.]+\\s*[%a-zA-Z]{0,3}$/.test(textOf(c));
      });
      if (cells.length < 4 || numeric.length < cells.length * 0.4) return;
      var variant = getComputedStyle(numeric[0]).fontVariantNumeric || '';
      var feature = getComputedStyle(numeric[0]).fontFeatureSettings || '';
      if (/tabular-nums/.test(variant) || /tnum/.test(feature)) return;
      out.push(hit(table, numeric.length + ' numeric cells without tabular-nums \u2014 digits will not align'));
    });
    return out;
  };

  /* ---- token drift ------------------------------------------------------
   * the prior art checks literal values against a declared DESIGN.md. redpen
   * reads the declaration the project already has: the custom properties on
   * :root. A project that defines --color-* and then hard-codes hex values
   * elsewhere has drifted from its own system, and no external file is needed
   * to prove it.
   * ------------------------------------------------------------------- */

  /**
   * Tokens declared for one role, found by NAME not by value.
   *
   * Matching on value shape alone is what made the first version noise: a
   * --space-2xs of 4px looks exactly like a font-size token, so a project with
   * a spacing scale and no type scale was told its type scale was broken. A
   * design system names its roles; read the names.
   */
  function declaredTokens(namePattern) {
    var out = {};
    var found = 0;
    eachRule(function (r) {
      if (!r.style || !r.selectorText || !/(^|,)s*(:root|html)s*($|,)/.test(r.selectorText)) return;
      for (var i = 0; i < r.style.length; i++) {
        var name = r.style[i];
        if (name.indexOf('--') !== 0 || !namePattern.test(name)) continue;
        var value = r.style.getPropertyValue(name).trim().toLowerCase();
        if (!value) continue;
        out[value] = name;
        found++;
        // A stack is a declaration of every face in it, not just the first.
        if (value.indexOf(',') !== -1) {
          value.split(',').forEach(function (part) {
            var f = part.replace(/["']/g, '').trim();
            if (f) out[f] = name;
          });
        }
      }
    });
    out.__count = found;
    return out;
  }

  function usedLiterals(props, valuePattern) {
    var seen = {};
    eachRule(function (r) {
      if (!r.style || !r.selectorText) return;
      if (/(^|,)s*(:root|html)s*($|,)/.test(r.selectorText)) return;
      props.forEach(function (prop) {
        var v = r.style.getPropertyValue(prop);
        // A value routed through a token is by definition not drift.
        if (!v || v.indexOf('var(') !== -1) return;
        var m = String(v).match(valuePattern);
        if (m) m.forEach(function (x) { seen[x.toLowerCase()] = 1; });
      });
    });
    return Object.keys(seen);
  }

  function driftCheck(opts) {
    var tokens = declaredTokens(opts.namePattern);
    var declared = tokens.__count;
    // No tokens for this role means there is no system to drift from. That is
    // a different (and weaker) finding, and stating it here would state it
    // badly \u2014 so stay silent.
    if (declared < opts.minTokens) return [];
    var off = usedLiterals(opts.props, opts.valuePattern).filter(function (v) {
      return !(v in tokens);
    });
    if (off.length < opts.minDrift) return [];
    return [hit(document.body,
      off.length + ' ' + opts.label + ' outside the ' + declared +
      ' declared token(s): ' + off.slice(0, 6).join(', '))];
  }

  CHECKS['color-token-drift'] = function (p) {
    return driftCheck({
      namePattern: /color|colour|bg|background|surface|ink|paper|accent|brand|fg|foreground|border/i,
      props: ['color', 'background-color', 'border-color', 'fill', 'stroke'],
      valuePattern: /#[0-9a-f]{3,8}\b|rgba?([^)]*)|oklch([^)]*)|hsla?([^)]*)/gi,
      label: 'literal colour(s)',
      minTokens: p.minTokens || 4,
      minDrift: p.minDrift || 4,
    });
  };

  CHECKS['radius-token-drift'] = function (p) {
    return driftCheck({
      namePattern: /radius|rounded|corner/i,
      props: ['border-radius'],
      valuePattern: /\bd+(?:.d+)?(?:px|rem|em)\b/gi,
      label: 'literal radius value(s)',
      minTokens: p.minTokens || 2,
      minDrift: p.minDrift || 3,
    });
  };

  CHECKS['font-size-token-drift'] = function (p) {
    return driftCheck({
      // Type-scale names only. A --space-* of 4px is not a font size, and
      // treating it as one told projects with a spacing scale that their
      // (nonexistent) type scale was broken.
      namePattern: /font-size|fontsize|text-(xs|sm|base|md|lg|xl|d)|type-(scale|step)|step-d/i,
      props: ['font-size'],
      valuePattern: /\bd+(?:.d+)?(?:px|rem)\b/gi,
      label: 'literal font-size(s)',
      minTokens: p.minTokens || 3,
      minDrift: p.minDrift || 4,
    });
  };

  CHECKS['font-family-drift'] = function (p) {
    var tokens = declaredTokens(/font(?!-size)|typeface|family/i);
    if (tokens.__count < 1) return [];
    var used = {};
    all('*').forEach(function (el) {
      if (!isTextBearing(el)) return;
      var f = getComputedStyle(el).fontFamily.split(',')[0].replace(/["']/g, '').trim().toLowerCase();
      if (f) used[f] = 1;
    });
    var off = Object.keys(used).filter(function (f) {
      // Generic and platform families are never "declared" and never drift.
      if (/^(ui-|system-|-apple-)/.test(f)) return false;
      if (/^(serif|sans-serif|monospace|cursive|fantasy|system-ui)$/.test(f)) return false;
      return !(f in tokens);
    });
    if (off.length < (p.minDrift || 1)) return [];
    return [hit(document.body,
      'face(s) not in the declared type system: ' + off.slice(0, 4).join(', '))];
  };

  // ---- the tells the upstream catalogues name above their fortieth gate ----
  // Cited densely up to gate 40 and not at all above it, which is where the
  // most specific and most recent ones live.

  CHECKS['grid-track-bare-fr'] = function () {
    // Measured, not inferred.
    //
    // The first cut read grid-template-columns out of the stylesheet and
    // reported any bare fr beside an image somewhere on the page. On the first
    // real project it cited three Tailwind classes that only apply above the lg
    // breakpoint, at a viewport where they do not apply, on a page with no
    // overflow at all. A stylesheet rule is not a fact about the page.
    //
    // What is a fact: a grid whose content is wider than the grid, holding an
    // image whose own natural width is what makes it so. That is the defect,
    // and it is visible from the element.
    var out = [];
    all('*').forEach(function (el) {
      if (out.length >= 5) return;
      var s = getComputedStyle(el);
      if (s.display.indexOf('grid') === -1) return;
      if (el.scrollWidth <= el.clientWidth + 1) return;
      var imgs = Array.prototype.slice.call(el.querySelectorAll('img, picture img, video')).filter(function (im) {
        // Not "rendered smaller than natural" \u2014 when the track cannot shrink the
        // image is rendered AT its natural width, which is the defect. What
        // matters is that its own width is what the grid cannot fit.
        var natural = im.naturalWidth || im.videoWidth || 0;
        return natural > 0 && natural > el.clientWidth;
      });
      if (!imgs.length) return;
      var im = imgs[0];
      out.push(hit(el, 'grid overflows by ' + Math.round(el.scrollWidth - el.clientWidth) +
        'px around a ' + (im.naturalWidth || im.videoWidth) + 'px image \u2014 the track has no minmax(0, ...) to shrink into'));
    });
    return out;
  };

  CHECKS['display-no-word-wrap'] = function (p) {
    var minPx = p.minSizePx || 28;
    return all('h1, h2, h3, [class*="display"], [class*="hero"]').filter(function (el) {
      var s = getComputedStyle(el);
      if (parseFloat(s.fontSize) < minPx) return false;
      var wrap = (s.overflowWrap || '') + ' ' + (s.wordBreak || '');
      if (/anywhere|break-word|break-all/.test(wrap)) return false;
      // Only where the risk is real: a token long enough to overflow a phone at
      // this size, whose only break opportunity is a hyphen or nothing at all.
      var longest = textOf(el).split(/\\s+/).reduce(function (a, w) { return w.length > a.length ? w : a; }, '');
      return longest.length >= 12;
    }).slice(0, 5).map(function (el) {
      var longest = textOf(el).split(/\\s+/).reduce(function (a, w) { return w.length > a.length ? w : a; }, '');
      return hit(el, 'display type with no overflow-wrap and an unbreakable ' + longest.length + '-character word: ' + longest);
    });
  };

  CHECKS['caps-tight-leading'] = function (p) {
    var minPx = p.minSizePx || 22;
    return all('*').filter(function (el) {
      if (!textOf(el) || el.children.length) return false;
      var s = getComputedStyle(el);
      if (s.textTransform !== 'uppercase') return false;
      var size = parseFloat(s.fontSize);
      if (size < minPx) return false;
      var lh = parseFloat(s.lineHeight);
      if (!lh || isNaN(lh)) return false;
      return lh / size < 1.0;
    }).slice(0, 5).map(function (el) {
      var s = getComputedStyle(el);
      var ratio = (parseFloat(s.lineHeight) / parseFloat(s.fontSize)).toFixed(2);
      return hit(el, 'uppercase display at line-height ' + ratio + ' \u2014 cap-tops collide with the line above when it wraps');
    });
  };

  CHECKS['double-sticky-top'] = function () {
    var stuck = all('*').filter(function (el) {
      var s = getComputedStyle(el);
      return s.position === 'sticky' && parseFloat(s.top) === 0;
    });
    if (stuck.length < 2) return [];
    // Only a defect when one of them is the page banner, which is what the
    // others would paint over.
    var banner = stuck.filter(function (el) {
      return /^(HEADER|NAV)$/.test(el.tagName) || el.getAttribute('role') === 'banner' ||
             /nav|header|banner/i.test(el.className || '');
    });
    if (!banner.length) return [];
    return stuck.filter(function (el) { return banner.indexOf(el) === -1; }).slice(0, 4).map(function (el) {
      return hit(el, 'a second element stuck at top: 0 under a sticky banner \u2014 they overlap on scroll');
    });
  };

  CHECKS['redrawn-chrome'] = function () {
    // Three small circles in a row at the top of a bordered box is a hand-built
    // browser or terminal window. The model drew a UI the reader's own machine
    // already provides, which is among the strongest tells there is.
    var out = [];
    all('*').forEach(function (parent) {
      if (out.length >= 4) return;
      var kids = Array.prototype.slice.call(parent.children);
      if (kids.length < 3) return;
      var dots = kids.filter(function (k) {
        var r = k.getBoundingClientRect();
        var s = getComputedStyle(k);
        if (r.width < 6 || r.width > 18) return false;
        if (Math.abs(r.width - r.height) > 2) return false;
        if (parseFloat(s.borderRadius) < r.width * 0.4) return false;
        var bg = parseColor(s.backgroundColor);
        return bg && bg.a > 0.2;
      });
      if (dots.length < 3) return;
      // On one row, not a scattered set of indicators.
      var tops = {};
      dots.forEach(function (d) { tops[Math.round(d.getBoundingClientRect().top)] = 1; });
      if (Object.keys(tops).length > 1) return;
      out.push(hit(parent, dots.length + ' traffic-light dots in a row \u2014 a hand-drawn window frame'));
    });
    return out;
  };

  CHECKS['bare-noun-bullets'] = function (p) {
    var minItems = p.minItems || 5;
    var FINITE = /\\b(is|are|was|were|has|have|had|does|do|did|can|will|runs?|stays?|takes?|drops?|holds?|cuts?|adds?|keeps?|returns?|costs?|saves?|beats?|survives?|fails?|reports?)\\b/i;
    return all('ul, ol').filter(function (list) {
      var items = Array.prototype.slice.call(list.children).filter(function (li) {
        return li.tagName === 'LI';
      });
      if (items.length < minItems) return false;
      // Every item short, none of them asserting anything. The symmetry is the
      // tell: a real list has items of different lengths and at least one that
      // breaks the shape.
      return items.every(function (li) {
        var t = textOf(li);
        var words = t.split(/\\s+/).filter(Boolean).length;
        return words > 0 && words <= 6 && !FINITE.test(t);
      });
    }).slice(0, 4).map(function (list) {
      var n = list.querySelectorAll('li').length;
      return hit(list, n + ' items, none of them a claim \u2014 every one an adjective and a noun');
    });
  };

  CHECKS['shadcn-default-card'] = function () {
    // The untouched starter card: 1px hairline, the default 0.5rem radius, and
    // the stock shadow, repeated across a grid. shadcn itself is fine; the
    // tell is that nobody opened the file.
    var cards = all('*').filter(function (el) {
      var s = getComputedStyle(el);
      var r = el.getBoundingClientRect();
      if (r.width < 120 || r.height < 80) return false;
      if (parseFloat(s.borderTopWidth) !== 1) return false;
      var rad = parseFloat(s.borderRadius);
      if (Math.abs(rad - 8) > 0.6) return false;
      return /rgba?\\([^)]*0\\.1\\)|0 1px 2px|0 1px 3px/.test(s.boxShadow || '');
    });
    if (cards.length < 3) return [];
    return [hit(cards[0], cards.length + ' cards on the starter defaults \u2014 1px border, 0.5rem radius, stock shadow')];
  };

  CHECKS['stock-illustration'] = function () {
    // Not all(): an image that failed to load is 0x0, and visible() drops it.
    // The src is the evidence and it is in the markup whether it loaded or not.
    var nodes = Array.prototype.slice.call(document.querySelectorAll('img, image, use, object'));
    var sources = nodes.map(function (el) {
      return (el.getAttribute('src') || el.getAttribute('href') || el.getAttribute('data') || '');
    }).filter(Boolean);
    var STOCK = /undraw|storyset|humaaans|opendoodles|illustrations\\.co|drawkit|manypixels|absurd\\.design/i;
    var hits = sources.filter(function (u) { return STOCK.test(u); });
    if (!hits.length) return [];
    return hits.slice(0, 4).map(function (u) {
      return { selector: 'img', excerpt: 'stock illustration set: ' + u.slice(0, 90) };
    });
  };

  CHECKS['nav-fingerprint'] = function () {
    // The banner is the element carrying the rule and the width, which is not
    // always the <nav> \u2014 a header with a nav inside it wears both, and reading
    // the inner one finds a flex row with no border and no width.
    var banner = document.querySelector('header[role="banner"], body > header, header') ||
                 document.querySelector('body > nav, nav');
    if (!banner || !visible(banner)) return [];
    var s = getComputedStyle(banner);
    var links = Array.prototype.slice.call(banner.querySelectorAll('a')).filter(visible);
    var buttons = links.filter(function (a) {
      var cs = getComputedStyle(a);
      return /btn|button|cta/i.test(a.className || '') ||
             (parseColor(cs.backgroundColor) || { a: 0 }).a > 0.5;
    });
    if (links.length < 4 || links.length > 7) return [];
    if (!buttons.length) return [];
    if (parseFloat(s.borderBottomWidth) !== 1) return [];
    var r = banner.getBoundingClientRect();
    if (r.width < window.innerWidth * 0.95) return [];
    var plain = links.filter(function (a) { return buttons.indexOf(a) === -1; });
    if (plain.length < 3) return [];
    var tops = {};
    plain.forEach(function (a) { tops[Math.round(a.getBoundingClientRect().top)] = 1; });
    if (Object.keys(tops).length !== 1) return [];
    return [hit(banner, plain.length + ' inline links between a wordmark and a button, on one hairline rule \u2014 the default bar')];
  };

  CHECKS['footer-fingerprint'] = function () {
    var foot = document.querySelector('footer');
    if (!foot) return [];
    var lists = Array.prototype.slice.call(foot.querySelectorAll('ul, nav > div, div[class*="col"]')).filter(function (el) {
      return el.querySelectorAll('a').length >= 3 && visible(el);
    });
    if (lists.length < 4) return [];
    var tops = {};
    lists.forEach(function (l) { tops[Math.round(l.getBoundingClientRect().top)] = 1; });
    if (Object.keys(tops).length > 1) return [];
    return [hit(foot, lists.length + ' columns of links in one row \u2014 the Product / Company / Resources / Legal default')];
  };

  CHECKS['decorative-no-anchor'] = function () {
    // Ornament with nothing in the content to motivate it, on the opening
    // screen where the decorative reflex lives. Keyed on where it sits rather
    // than on being inside a <section>, because it often is not.
    var fold = window.innerHeight;
    var out = [];
    Array.prototype.slice.call(document.querySelectorAll(
      '[class*="blob"], [class*="ornament"], [class*="sticker"], [class*="scanline"], [class*="glow"], [class*="sparkle"], [class*="orb"]'
    )).forEach(function (el) {
      if (out.length >= 4) return;
      if (!visible(el)) return;
      if (textOf(el)) return;
      var r = el.getBoundingClientRect();
      if (r.top > fold) return;
      if (r.width < 40 || r.height < 40) return;
      if (el.closest('figure')) return;
      out.push(hit(el, 'ornament on the opening screen with no anchor in the content around it'));
    });
    return out;
  };

  // ---- WCAG criteria the corpus had no rule for ----

  function accessibleName(el) {
    var label = el.getAttribute('aria-label');
    if (label && label.trim()) return label.trim();
    var by = el.getAttribute('aria-labelledby');
    if (by) {
      var parts = by.split(/\\s+/).map(function (id) {
        var t = document.getElementById(id);
        return t ? (t.textContent || '').trim() : '';
      }).filter(Boolean);
      if (parts.length) return parts.join(' ');
    }
    var text = (el.textContent || '').trim();
    if (text) return text;
    var img = el.querySelector('img[alt]');
    if (img && img.getAttribute('alt').trim()) return img.getAttribute('alt').trim();
    var svg = el.querySelector('svg[aria-label], svg > title');
    if (svg) return (svg.getAttribute('aria-label') || svg.textContent || '').trim();
    if (el.tagName === 'INPUT') {
      var t = el.getAttribute('type');
      if (t === 'submit' || t === 'button' || t === 'reset') return (el.getAttribute('value') || '').trim();
    }
    var title = el.getAttribute('title');
    return title && title.trim() ? title.trim() : '';
  }

  CHECKS['control-no-accessible-name'] = function () {
    // 4.1.2. A control with an icon and nothing else is announced as "button"
    // and nothing more, which is the same as unlabelled. It is the most common
    // failure on a toolbar and the least visible, because it looks finished.
    return all('button, a[href], [role="button"], [role="link"], input[type=submit], input[type=button]')
      .filter(function (el) { return !accessibleName(el); })
      .slice(0, 6)
      .map(function (el) {
        return hit(el, el.tagName.toLowerCase() + ' with no accessible name \u2014 announced as "' +
          (el.getAttribute('role') || el.tagName.toLowerCase()) + '" and nothing else');
      });
  };

  CHECKS['target-size-minimum'] = function (p) {
    // 2.5.8, AA in WCAG 2.2. 24 by 24 CSS pixels, with an exemption for a
    // control inline in a sentence, where the line is the target.
    var min = p.minPx || 24;
    var targets = all('button, a[href], [role="button"], input[type=checkbox], input[type=radio], select');
    return targets
      .filter(function (el) {
        var r = el.getBoundingClientRect();
        if (r.width >= min && r.height >= min) return false;
        // The WCAG exemption is for a target *in a sentence*, which means the
        // control flows with the text. A <p> used as a flex row is not running
        // text, and reading it as one exempted an 18px button sitting beside a
        // label \u2014 so the control's own display has to be inline too.
        var cs = getComputedStyle(el);
        if (cs.display === 'inline' || cs.display === 'inline-block') {
          var pnt = el.parentElement;
          var pd = pnt ? getComputedStyle(pnt).display : '';
          var flowing = pnt && /^(P|LI|TD|SPAN|LABEL|H1|H2|H3|H4|H5|H6)$/.test(pnt.tagName) &&
                        pd.indexOf('flex') === -1 && pd.indexOf('grid') === -1;
          if (flowing) {
            var txt = (pnt.textContent || '').trim().length;
            if (txt > (el.textContent || '').trim().length + 12) return false;
          }
        }
        return r.width > 0 && r.height > 0;
      })
      .filter(function (el) {
        // 2.5.8's spacing exemption, which is the rest of the criterion: an
        // undersized target passes if a min-diameter circle centred on it
        // reaches no other target's circle. Without it a 23px nav link \u2014 one
        // pixel under, with room around it \u2014 reads as a failure, which is how
        // this first fired on a page that has no problem.
        var r = el.getBoundingClientRect();
        var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        return targets.some(function (other) {
          if (other === el) return false;
          var o = other.getBoundingClientRect();
          var ox = o.left + o.width / 2, oy = o.top + o.height / 2;
          return Math.sqrt((cx - ox) * (cx - ox) + (cy - oy) * (cy - oy)) < min;
        });
      })
      .slice(0, 6)
      .map(function (el) {
        var r = el.getBoundingClientRect();
        return hit(el, Math.round(r.width) + 'x' + Math.round(r.height) +
          'px with a neighbour inside ' + min + 'px \u2014 below the minimum and not spaced clear of it');
      });
  };

  CHECKS['aria-hidden-focusable'] = function () {
    // A focusable element inside aria-hidden is reachable by tab and invisible
    // to the screen reader at the same time. Nothing announces, focus appears
    // to vanish.
    var out = [];
    Array.prototype.slice.call(document.querySelectorAll('[aria-hidden="true"]')).forEach(function (host) {
      if (out.length >= 5) return;
      var focusable = host.querySelectorAll('a[href], button, input, select, textarea, [tabindex]');
      for (var i = 0; i < focusable.length && out.length < 5; i++) {
        var el = focusable[i];
        if (el.hasAttribute('disabled')) continue;
        if (el.getAttribute('tabindex') === '-1') continue;
        out.push(hit(el, 'focusable inside aria-hidden \u2014 reachable by tab, invisible to a screen reader'));
      }
    });
    return out;
  };

  CHECKS['positive-tabindex'] = function () {
    // 2.4.3. Any positive tabindex takes the element out of document order and
    // ahead of everything that has none, so the whole page's focus order stops
    // matching what is on screen.
    return all('[tabindex]')
      .filter(function (el) { return parseInt(el.getAttribute('tabindex'), 10) > 0; })
      .slice(0, 5)
      .map(function (el) {
        return hit(el, 'tabindex="' + el.getAttribute('tabindex') + '" \u2014 jumps ahead of the whole document');
      });
  };

  CHECKS['duplicate-id'] = function () {
    // 4.1.1. A repeated id silently breaks every label, aria-labelledby and
    // aria-controls pointing at it: they all resolve to the first one.
    var seen = {};
    var dupes = {};
    Array.prototype.slice.call(document.querySelectorAll('[id]')).forEach(function (el) {
      var id = el.getAttribute('id');
      if (!id) return;
      if (seen[id]) dupes[id] = (dupes[id] || 1) + 1;
      seen[id] = true;
    });
    return Object.keys(dupes).slice(0, 6).map(function (id) {
      var el = document.getElementById(id);
      return hit(el || document.body, 'id "' + id + '" used ' + dupes[id] + ' times \u2014 every reference resolves to the first');
    });
  };

  CHECKS['new-window-no-warning'] = function () {
    // 3.2.5. A link that replaces the context without saying so. Announcing it
    // costs a word; not announcing it loses people who cannot see the new tab
    // appear.
    return all('a[target="_blank"]')
      .filter(function (el) {
        var name = accessibleName(el).toLowerCase();
        if (/new (tab|window)|opens in|external/.test(name)) return false;
        if (el.querySelector('[aria-label*="new tab" i], [aria-label*="new window" i]')) return false;
        return true;
      })
      .slice(0, 5)
      .map(function (el) {
        return hit(el, 'opens a new tab with no warning \u2014 "' + accessibleName(el).slice(0, 40) + '"');
      });
  };

  CHECKS['console-errors'] = function () {
    var errs = window.__redpenErrors || [];
    return errs.slice(0, 8).map(function (e) { return { selector: 'window', excerpt: e }; });
  };
`;

// src/fingerprint/extract.ts
function fingerprintSource() {
  return `() => {
  function visible(el) {
    var s = getComputedStyle(el);
    if (s.display === 'none' || s.visibility === 'hidden') return false;
    var r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }

  function text(el) {
    return (el.textContent || '').replace(/\\s+/g, ' ').trim();
  }

  // Decorative and non-layout nodes are children of body on plenty of pages.
  // Counting them would put noise into the signature, which is the one thing a
  // signature cannot tolerate \u2014 it is compared against other pages.
  var NON_SECTION = { SVG: 1, IMG: 1, SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, CANVAS: 1, TEMPLATE: 1, LINK: 1, DIALOG: 1 };

  function layoutChildren(parent) {
    var kids = Array.prototype.slice.call(parent.children).filter(function (el) {
      if (NON_SECTION[String(el.tagName).toUpperCase()]) return false;
      if (el.getAttribute && el.getAttribute('aria-hidden') === 'true') return false;
      return visible(el);
    });
    var tall = kids.filter(function (el) { return el.getBoundingClientRect().height > 80; });
    // Fall back to every visible child rather than returning nothing: a dense
    // app page can be built entirely from blocks under 80px.
    return tall.length ? tall : kids;
  }

  function sections() {
    var main = document.querySelector('main') || document.body;
    var kids = layoutChildren(main);
    // A single wrapper div is the common case; descend through it once \u2014 but
    // only when it is a layout wrapper. Descending into a list of records
    // turned every row into a "section", and since rows are short they were
    // then all filtered out, leaving an empty rhythm.
    if (kids.length === 1) {
      var only = kids[0];
      var isCollection = /^(UL|OL|TABLE|TBODY|DL|FORM|FIELDSET)$/.test(only.tagName.toUpperCase()) ||
        /^(list|table|grid|feed)$/.test(only.getAttribute('role') || '');
      if (!isCollection && only.children.length > 2) kids = layoutChildren(only);
    }
    return kids;
  }

  /**
   * Is this element part of the page shell rather than its content?
   *
   * The shell is the frame every route shares: masthead, primary nav, footer,
   * side rail, and anything pinned to the viewport. Comparing two pages on
   * their shells says only that they belong to the same product.
   */
  function isShell(el) {
    var tag = el.tagName.toUpperCase();
    if (tag === 'HEADER' || tag === 'FOOTER' || tag === 'NAV' || tag === 'ASIDE') return true;
    if (el.getAttribute && /^(banner|navigation|contentinfo|complementary)$/.test(el.getAttribute('role') || '')) {
      return true;
    }
    var s = getComputedStyle(el);
    // Pinned chrome spanning the viewport is a shell whatever it is called.
    if ((s.position === 'fixed' || s.position === 'sticky') &&
        el.getBoundingClientRect().width > window.innerWidth * 0.8) return true;
    // A wrapper whose only job is to hold the nav.
    if (el.querySelector(':scope > nav') && text(el).length < 200) return true;
    return false;
  }

  /**
   * Classify a section by what it structurally *is*, not what it is called.
   * Class names are unreliable (and often absent); geometry is not.
   */
  function classify(el, index) {
    var tag = el.tagName.toLowerCase();
    if (tag === 'footer') return 'footer';
    if (tag === 'header' || tag === 'nav') return 'nav';

    var r = el.getBoundingClientRect();
    var tall = r.height / window.innerHeight;
    var grids = el.querySelectorAll('*');
    var gridChild = null;
    for (var i = 0; i < grids.length; i++) {
      var gs = getComputedStyle(grids[i]);
      if (gs.display === 'grid' && grids[i].children.length >= 2) { gridChild = grids[i]; break; }
    }

    if (el.querySelector('table')) return 'table';
    if (el.querySelector('form') && el.querySelectorAll('input, textarea').length >= 2) return 'form';

    if (gridChild) {
      var cols = getComputedStyle(gridChild).gridTemplateColumns.split(' ').filter(Boolean).length;
      var cards = gridChild.children.length;
      if (cards >= 6) return 'catalogue';
      return 'card-grid-' + cols;
    }

    var h1 = el.querySelector('h1');
    if (index === 0 || h1) {
      if (tall >= 0.85) return 'hero-full';
      return 'hero';
    }

    var quotes = el.querySelectorAll('blockquote, q, [class*="quote"], [class*="testimonial"]');
    if (quotes.length) return 'quote';

    var stats = Array.prototype.slice.call(el.querySelectorAll('*')).filter(function (n) {
      var t = text(n);
      return t.length < 12 && /^[\\d.,]+[%+xkKmM]?$/.test(t) && parseFloat(getComputedStyle(n).fontSize) > 28;
    });
    if (stats.length >= 3) return 'stat-strip';

    var imgs = el.querySelectorAll('img, video, canvas, picture');
    var chars = text(el).length;
    if (imgs.length >= 1 && chars < 300) return 'media';

    var ctas = el.querySelectorAll('a[class], button');
    if (chars < 240 && ctas.length >= 1 && ctas.length <= 3) return 'cta';

    var details = el.querySelectorAll('details, [class*="accordion"], [class*="faq"]');
    if (details.length >= 2) return 'faq';

    var lists = el.querySelectorAll('ol > li, ul > li');
    if (lists.length >= 4 && chars > 400) return 'index';

    if (chars > 900) return 'prose';
    return 'block';
  }

  /**
   * The macrostructure is the shape of the whole page, named from the rhythm.
   * Deliberately coarse \u2014 two pages should collide here only when they really
   * are the same skeleton.
   */
  function macrostructure(rhythm, els) {
    var body = rhythm.filter(function (r) { return r !== 'nav' && r !== 'footer'; });
    var joined = body.join('|');

    // An app shell: a toolbar and a list, or a page that is one form. The
    // marketing taxonomy below has no bucket for this, and forcing the nearest
    // archetype produced "manifesto" for a work queue \u2014 a wrong label makes a
    // correct sameness finding read as noise.
    var records = 0, forms = 0;
    (els || []).forEach(function (el) {
      var rows = el.querySelectorAll('tbody tr, [role="row"], ul > li, ol > li');
      var acted = 0;
      for (var i = 0; i < rows.length; i++) {
        if (rows[i].querySelector('button, a[class], [role="button"], input, select')) acted++;
      }
      if (acted >= 3) records++;
      if (el.querySelectorAll('label').length >= 4 &&
          el.querySelector('button[type=submit], input[type=submit]')) forms++;
    });
    if (records) return 'record-list';
    if (forms) return 'form-page';
    if (body.length && body.every(function (r) { return r === 'table' || r === 'catalogue'; })) {
      return 'data-table';
    }

    if (/^hero(-full)?\\|card-grid-3/.test(joined)) return 'hero-triptych';
    if (/^hero(-full)?\\|(cta|media)?\\|?stat-strip/.test(joined)) return 'stat-led';
    if (body.filter(function (r) { return r === 'prose'; }).length >= 3) return 'long-document';
    if (body[0] === 'catalogue' || body.filter(function (r) { return r === 'catalogue'; }).length) return 'catalogue';
    if (body[0] === 'stat-strip') return 'stat-led';
    if (body[0] === 'quote') return 'quote-led';
    if (body[0] === 'media') return 'photographic';
    if (body.indexOf('faq') !== -1 && body.length <= 4) return 'conversational-faq';
    if (body.indexOf('table') !== -1) return 'specimen';
    if (body[0] === 'index') return 'index-first';
    if (body.filter(function (r) { return /^card-grid/.test(r); }).length >= 2) return 'feature-stack';
    if (body.length <= 3) return 'manifesto';
    return 'mixed';
  }

  function navShape() {
    // Prefer a real <nav>: counting every anchor under <header> made four text
    // tabs read as a mega-menu.
    var nav = document.querySelector('nav') || document.querySelector('header');
    if (!nav || !visible(nav)) return 'none';
    var s = getComputedStyle(nav);
    var r = nav.getBoundingClientRect();
    var links = nav.querySelectorAll('a, [role="tab"], button').length;
    var radius = parseFloat(s.borderRadius) || 0;
    var current = nav.querySelector('[aria-current], .active, [class*="active"]');

    if (r.height > window.innerHeight * 0.5) return 'side-rail';
    // A short row of peer links with one marked current is app navigation, not
    // a marketing menu \u2014 even when it is pinned.
    if (current && links <= 8) return 'app-tabs';
    if (s.position === 'fixed' || s.position === 'sticky') {
      if (radius > 16 && r.width < window.innerWidth * 0.9) return 'floating-pill';
      return 'sticky-bar';
    }
    if (links <= 3) return 'wordmark-links';
    if (links >= 8) return 'mega-menu';
    return 'bar';
  }

  function heroShape(first) {
    if (!first) return 'none';
    // No h1-bearing opener and no media means there is no hero to name. Calling
    // a toolbar "asymmetric" is a wrong label, not a cautious one.
    if (!first.querySelector('h1, img, video, canvas, picture') &&
        first.getBoundingClientRect().height < window.innerHeight * 0.4) return 'none';
    var r = first.getBoundingClientRect();
    var tall = r.height / window.innerHeight;
    var s = getComputedStyle(first);
    var hasMedia = first.querySelector('img, video, canvas, picture');

    var kids = Array.prototype.slice.call(first.querySelectorAll('h1, h2, p, a, button')).filter(visible);
    var centred = kids.filter(function (el) {
      var kr = el.getBoundingClientRect();
      return Math.abs((kr.left + kr.width / 2) - window.innerWidth / 2) < 8 ||
             getComputedStyle(el).textAlign === 'center';
    });

    if (hasMedia && r.width > window.innerWidth * 0.9 && !centred.length) return 'photographic-fold';
    if (hasMedia && kids.length >= 2 && centred.length < 2) return 'split-diptych';
    if (centred.length >= 4 && tall >= 0.85) return 'centered-full';
    if (centred.length >= 3) return 'centered-narrow';
    if (first.querySelector('blockquote, q')) return 'quote-led';
    return 'asymmetric';
  }

  function typeScale() {
    var sizes = {};
    Array.prototype.slice.call(document.querySelectorAll('*')).forEach(function (el) {
      if (!visible(el)) return;
      var hasText = false;
      for (var i = 0; i < el.childNodes.length; i++) {
        if (el.childNodes[i].nodeType === 3 && el.childNodes[i].textContent.trim().length > 1) hasText = true;
      }
      if (!hasText) return;
      var px = Math.round(parseFloat(getComputedStyle(el).fontSize));
      if (px) sizes[px] = (sizes[px] || 0) + 1;
    });
    // Sizes used once are usually a one-off override, not part of the scale.
    return Object.keys(sizes)
      .map(Number)
      .filter(function (px) { return sizes[px] >= 2; })
      .sort(function (a, b) { return a - b; });
  }

  function families() {
    var out = {};
    Array.prototype.slice.call(document.querySelectorAll('*')).forEach(function (el) {
      if (!visible(el)) return;
      var f = getComputedStyle(el).fontFamily.split(',')[0].replace(/["']/g, '').trim().toLowerCase();
      if (f) out[f] = 1;
    });
    return Object.keys(out).sort();
  }

  function paletteAnchor() {
    function srgbToLinear(c) {
      c = c / 255;
      return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    }
    function oklch(str) {
      var m = /rgba?\\(([^)]+)\\)/.exec(str);
      if (!m) return null;
      var p = m[1].split(/[\\s,\\/]+/).filter(Boolean).map(parseFloat);
      if (p.length < 3) return null;
      var alpha = p.length > 3 ? p[3] : 1;
      if (alpha < 0.5) return null;
      var r = srgbToLinear(p[0]), g = srgbToLinear(p[1]), b = srgbToLinear(p[2]);
      var l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
      var mm = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
      var s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
      var A = 1.9779984951 * l - 2.4285922050 * mm + 0.4505937099 * s;
      var B = 0.0259040371 * l + 0.7827717662 * mm - 0.8086757660 * s;
      var C = Math.sqrt(A * A + B * B);
      var H = (Math.atan2(B, A) * 180) / Math.PI;
      if (H < 0) H += 360;
      return { c: C, h: H };
    }

    // Weight each chromatic colour by the area it covers, then take the hue of
    // the heaviest. Accent colours win over incidental ones this way.
    var buckets = {};
    Array.prototype.slice.call(document.querySelectorAll('*')).forEach(function (el) {
      if (!visible(el)) return;
      var r = el.getBoundingClientRect();
      var a = Math.max(0, r.width) * Math.max(0, r.height);
      if (a <= 0) return;
      var col = oklch(getComputedStyle(el).backgroundColor);
      if (!col || col.c < 0.04) return;
      var bucket = Math.round(col.h / 15) * 15;
      buckets[bucket] = (buckets[bucket] || 0) + a;
    });
    var keys = Object.keys(buckets);
    if (!keys.length) return null;
    var best = keys[0];
    keys.forEach(function (k) { if (buckets[k] > buckets[best]) best = k; });
    return Number(best) % 360;
  }

  var allSecs = sections();
  var shellSecs = allSecs.filter(isShell);
  var secs = allSecs.filter(function (el) { return !isShell(el); });

  var shell = shellSecs.map(classify);
  if (!shell.length && document.querySelector('header, nav')) shell.push('nav');
  if (shell.indexOf('footer') === -1 && document.querySelector('footer')) shell.push('footer');

  // The rhythm compared for sameness is content only.
  var rhythm = secs.map(classify);

  return {
    macrostructure: macrostructure(rhythm, secs),
    sectionRhythm: rhythm,
    shell: shell,
    typeScale: typeScale(),
    families: families(),
    paletteAnchor: paletteAnchor(),
    nav: navShape(),
    hero: heroShape(secs[0]),
    sectionCount: secs.length,
  };
}`;
}

// src/channels/surface.ts
function surfaceSource() {
  return `() => {
  function visible(el) {
    var s = getComputedStyle(el);
    if (s.display === 'none' || s.visibility === 'hidden') return false;
    var r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }
  function all(sel) {
    return Array.prototype.slice.call(document.querySelectorAll(sel)).filter(visible);
  }
  function textLen(el) {
    return ((el || document.body).innerText || '').replace(/\\s+/g, ' ').trim().length;
  }

  var body = document.body;

  // --- operate: the page is a set of controls over data ---
  var inputs   = all('input:not([type=hidden]), select, textarea').length;
  var buttons  = all('button, [role="button"]').length;
  var tables   = all('table, [role="table"], [role="grid"]').length;
  var rows     = all('tbody tr, [role="row"]').length;
  var tabs     = all('[role="tab"], [role="tablist"]').length;
  var menus    = all('[role="menu"], [role="menuitem"], [role="listbox"]').length;
  var toggles  = all('[role="switch"], [role="checkbox"], input[type=checkbox]').length;
  var sidebar  = all('aside, [class*="sidebar"], [class*="side-nav"], nav[aria-orientation="vertical"]').length;
  var toolbars = all('[role="toolbar"], [class*="toolbar"]').length;
  var authish  = all('[class*="avatar"], [class*="account"], [aria-label*="profile" i]').length;

  // A list of records with per-row actions. This is the strongest operate
  // signal there is, and the first version counted it the other way: eight
  // rows each carrying Promote/Drop read as "a landing page repeating its
  // call to action". No marketing page repeats a control cluster per item.
  var recordRows = (function () {
    var best = 0;
    all('*').forEach(function (parent) {
      var kids = Array.prototype.slice.call(parent.children).filter(visible);
      if (kids.length < 3) return;
      // Actions only. Counting inputs and selects made a form's field wrappers
      // \u2014 one label and one input each \u2014 look exactly like record rows, which
      // is why a page with zero rows reported seven of them.
      var ACTIONS = 'button, a[class], a[href], [role="button"]';
      var withControls = kids.filter(function (k) {
        if (!k.querySelector(ACTIONS)) return false;
        // A record carries content of its own, not just a control.
        return (k.textContent || '').replace(/s+/g, ' ').trim().length > 12;
      });
      if (withControls.length < 3) return;

      // Compare structure, not labels. Row actions legitimately differ by
      // state \u2014 Start / Claim / Close \u2014 and matching on text meant a real list
      // with per-row state failed while a uniform form passed.
      var sig = withControls.map(function (k) {
        return Array.prototype.slice.call(k.querySelectorAll(ACTIONS))
          .map(function (c) { return c.tagName; }).sort().join('|');
      });
      var same = sig.filter(function (x) { return x === sig[0]; }).length;
      if (sig[0] && same >= Math.max(3, Math.floor(withControls.length * 0.6))) {
        best = Math.max(best, withControls.length);
      }
    });
    return best;
  })();

  // Controls that are NOT inside a repeated record row. Counting row actions
  // as calls to action is what produced four confident misclassifications.
  var standaloneCtas = all('a[class], button').filter(function (el) {
    var t = (el.textContent || '').trim();
    if (!t.length || t.length >= 32) return false;
    var p = el.parentElement, depth = 0;
    while (p && depth < 4) {
      var sibs = Array.prototype.slice.call(p.children).filter(visible);
      if (sibs.length >= 3 && sibs.filter(function (s2) {
        return s2.querySelector('button, a[class], [role="button"]');
      }).length >= 3) return false;
      p = p.parentElement; depth++;
    }
    return true;
  }).length;

  // Repeated structure with no controls at all. A read-only data list is still
  // a task surface \u2014 controls are one way of showing repetition, not the
  // definition of it. Reported from the field: an 11-row merged queue view with
  // zero buttons scored 0.0 on operate.
  var repeatedShape = (function () {
    var best = 0;
    all('*').forEach(function (parent) {
      var kids = Array.prototype.slice.call(parent.children).filter(visible);
      if (kids.length < 4) return;
      // Signature is the child's own tag skeleton \u2014 same shape repeated is the
      // signal, whatever it contains.
      var sig = kids.map(function (k) {
        return Array.prototype.slice.call(k.children)
          .map(function (c) { return c.tagName; }).join('>') || k.tagName;
      });
      var same = sig.filter(function (x) { return x === sig[0]; }).length;
      // Uniform height as well: a repeated shape that varies wildly in size is
      // a page of sections, not a list of records.
      var heights = kids.map(function (k) { return Math.round(k.getBoundingClientRect().height); });
      var uniform = heights.filter(function (h) { return Math.abs(h - heights[0]) <= 8; }).length;

      // Stacked, not side by side. Without this a five-card feature grid on a
      // marketing page read as five rows of records and classified the page
      // operate at 0.8, switching off 21 rules that exist for exactly that
      // page. Records are a list going down; feature cards sit in a row.
      // Records shown as cards still stack into rows, so each row of them
      // shares a top edge and the count still lands.
      var tops = {};
      kids.forEach(function (k) { tops[Math.round(k.getBoundingClientRect().top)] = 1; });
      var stacked = Object.keys(tops).length >= kids.length * 0.8;

      if (stacked && same >= kids.length * 0.8 && uniform >= kids.length * 0.8) {
        best = Math.max(best, kids.length);
      }
    });
    return best;
  })();

  // A page that is mostly one form is an operate surface even with no rows.
  var labelled = all('label').length;
  var submits  = all('button[type=submit], input[type=submit]').length;

  // --- persuade: the page is selling something ---
  var h1       = all('h1').length;
  var ctas     = standaloneCtas;
  var pricing  = /\\b(pricing|per month|\\/mo\\b|free trial|get started|book a demo|sign up)\\b/i
                   .test(textLen(body) ? body.innerText : '');
  var hero     = (function () {
    var first = body.querySelector('main > *, body > section, body > div > section');
    if (!first || !visible(first)) return false;
    return first.getBoundingClientRect().height / window.innerHeight > 0.6;
  })();
  var testimonial = all('blockquote, [class*="testimonial"], [class*="quote"]').length;
  var logoWall = all('[class*="logo"] img, [class*="logos"] img').length;

  // --- read: the page is prose ---
  var paras    = all('p').length;
  var prose    = all('p').reduce(function (n, p) { return n + textLen(p); }, 0);
  var headings = all('h2, h3').length;
  var lists    = all('article ol, article ul, main ol, main ul').length;
  var article  = all('article, [role="article"], [class*="prose"], [class*="markdown"]').length;
  var codeBlk  = all('pre, pre code').length;
  var toc      = all('[class*="toc"], [class*="table-of-contents"], nav[aria-label*="content" i]').length;
  var total    = textLen(body);

  return {
    inputs: inputs, buttons: buttons, tables: tables, rows: rows, tabs: tabs,
    menus: menus, toggles: toggles, sidebar: sidebar, toolbars: toolbars, authish: authish,
    recordRows: recordRows, repeatedShape: repeatedShape, labelled: labelled, submits: submits,
    h1: h1, ctas: ctas, pricing: pricing, hero: hero, testimonial: testimonial, logoWall: logoWall,
    paras: paras, prose: prose, headings: headings, lists: lists, article: article,
    codeBlk: codeBlk, toc: toc, total: total,
  };
}`;
}
function classify(s) {
  const reasons = { persuade: [], operate: [], read: [] };
  let operate = 0;
  let persuade = 0;
  let read = 0;
  if (s.recordRows >= 3) {
    operate += 4;
    reasons.operate.push(`${s.recordRows} rows with identical per-row controls`);
  }
  if (s.labelled >= 4 && s.submits >= 1) {
    operate += 4;
    reasons.operate.push(`a ${s.labelled}-field labelled form`);
  }
  if (s.recordRows < 3 && s.repeatedShape >= 5) {
    operate += 3.5;
    reasons.operate.push(`${s.repeatedShape} rows of identical structure`);
  }
  if (s.tables > 0 && s.rows >= 5) {
    operate += 3;
    reasons.operate.push(`${s.rows} data rows`);
  }
  if (s.inputs >= 4) {
    operate += 2.5;
    reasons.operate.push(`${s.inputs} form controls`);
  }
  if (s.sidebar > 0) {
    operate += 2;
    reasons.operate.push("side navigation");
  }
  if (s.tabs > 0) {
    operate += 1.5;
    reasons.operate.push("tabs");
  }
  if (s.toolbars > 0) {
    operate += 1.5;
    reasons.operate.push("toolbar");
  }
  if (s.menus >= 2) {
    operate += 1;
    reasons.operate.push("menus");
  }
  if (s.toggles >= 3) {
    operate += 1;
    reasons.operate.push(`${s.toggles} toggles`);
  }
  if (s.authish > 0) {
    operate += 1;
    reasons.operate.push("account chrome");
  }
  if (s.buttons >= 12) {
    operate += 1;
    reasons.operate.push(`${s.buttons} buttons`);
  }
  if (s.hero) {
    persuade += 2.5;
    reasons.persuade.push("full-height opener");
  }
  if (s.pricing) {
    persuade += 2;
    reasons.persuade.push("pricing or signup language");
  }
  if (s.testimonial > 0) {
    persuade += 1.5;
    reasons.persuade.push("testimonial");
  }
  if (s.logoWall >= 3) {
    persuade += 1.5;
    reasons.persuade.push("logo wall");
  }
  if (s.h1 === 1 && s.ctas >= 2 && s.prose < 2500 && s.recordRows < 3 && s.total > 600) {
    persuade += 2;
    reasons.persuade.push("single headline with repeated CTAs and little prose");
  }
  if (s.prose > 4e3) {
    read += 3;
    reasons.read.push(`${Math.round(s.prose / 1e3)}k characters of prose`);
  } else if (s.prose > 2e3) {
    read += 1.5;
    reasons.read.push("substantial prose");
  }
  if (s.article > 0) {
    read += 2;
    reasons.read.push("article or prose container");
  }
  if (s.headings >= 5 && s.paras >= 10) {
    read += 2;
    reasons.read.push("many headings over many paragraphs");
  }
  if (s.toc > 0) {
    read += 1.5;
    reasons.read.push("table of contents");
  }
  if (s.codeBlk >= 3) {
    read += 1;
    reasons.read.push("code blocks");
  }
  const scored = [
    ["operate", operate],
    ["persuade", persuade],
    ["read", read]
  ];
  scored.sort((a, b) => b[1] - a[1]);
  const [winner, top] = scored[0];
  const runnerUp = scored[1][1];
  let confidence = 0;
  if (top > 0) {
    const margin = (top - runnerUp) / top;
    confidence = Math.min(1, top / 6 * 0.5 + margin * 0.5);
    if (winner === "operate" && (s.recordRows >= 3 || s.repeatedShape >= 5 || s.labelled >= 4 && s.submits >= 1)) {
      confidence = Math.max(confidence, 0.8);
    }
  }
  const density = {
    rows: Math.max(s.recordRows, s.repeatedShape, s.rows),
    controls: s.inputs + s.buttons,
    characters: s.total
  };
  const sparse = density.rows < 3 && density.controls < 4 && density.characters < 1200;
  return {
    surface: winner,
    confidence: Number(confidence.toFixed(2)),
    signals: reasons[winner].slice(0, 4),
    density,
    sparse
  };
}
var MIN_SURFACE_CONFIDENCE = 0.6;

// src/channels/render.ts
import { createRequire } from "node:module";
import { join as join3, resolve } from "node:path";
import { pathToFileURL } from "node:url";
function summariseErrors(errors) {
  const byMessage = /* @__PURE__ */ new Map();
  for (const e of errors) {
    const at = e.indexOf(": ");
    const where = at > 0 ? e.slice(0, at) : "";
    const what = at > 0 ? e.slice(at + 2) : e;
    const list = byMessage.get(what) ?? [];
    if (where) list.push(where);
    byMessage.set(what, list);
  }
  return [...byMessage].map(([what, wheres]) => wheres.length ? `${what} (${wheres.join(", ")})` : what).join("; ");
}
async function loadPlaywright(root) {
  const specifier = "playwright";
  try {
    return await import(specifier);
  } catch {
    if (!root) return null;
    try {
      const require2 = createRequire(join3(resolve(root), "noop.js"));
      const entry = require2.resolve(specifier);
      const mod = await import(pathToFileURL(entry).href);
      const ns = "chromium" in mod ? mod : mod.default;
      return ns;
    } catch {
      return null;
    }
  }
}
var ERROR_TRAP = `
  window.__redpenErrors = [];
  window.addEventListener('error', function (e) {
    window.__redpenErrors.push(String(e.message || e.error || 'error'));
  });
  window.addEventListener('unhandledrejection', function (e) {
    window.__redpenErrors.push('unhandled rejection: ' + String(e.reason));
  });
`;
function buildSpecs() {
  return rulesForChannel("render").filter((r) => r.render).map((r) => ({
    ruleId: r.id,
    check: r.render.check,
    params: r.render.params ?? {},
    minHits: r.render.minHits ?? 1
  }));
}
async function scanRender(opts) {
  const empty = {
    findings: [],
    fingerprints: [],
    screenshots: /* @__PURE__ */ new Map(),
    detectedSurfaces: /* @__PURE__ */ new Map(),
    unavailable: null
  };
  if (opts.urls.length === 0) return empty;
  const pw = await loadPlaywright(opts.root);
  if (!pw) {
    return {
      ...empty,
      unavailable: "playwright is not installed \u2014 run `npm i -D playwright && npx playwright install chromium` in the project being scanned, or beside redpen, to enable the render channel"
    };
  }
  const specs = buildSpecs();
  const install = [
    `window.__redpenDetect = ${detectorSource()};`,
    `window.__redpenFingerprint = ${fingerprintSource()};`,
    `window.__redpenSurface = ${surfaceSource()};`
  ].join("\n");
  let browser;
  try {
    browser = await pw.chromium.launch({ headless: true });
  } catch (err) {
    return {
      ...empty,
      unavailable: `could not launch chromium: ${err instanceof Error ? err.message : String(err)}`
    };
  }
  const hits = /* @__PURE__ */ new Map();
  const fingerprints = [];
  const screenshots = /* @__PURE__ */ new Map();
  const detectedSurfaces = /* @__PURE__ */ new Map();
  const detectorErrors = [];
  const widest = Math.max(...opts.viewports);
  let wantsDark = opts.schemes?.includes("dark") ?? false;
  let stamp = null;
  if (opts.schemes === void 0 || opts.autoScheme) {
    const probe = await probeDarkTheme(browser, opts.urls[0]);
    wantsDark = probe.media;
    stamp = probe.stamp;
  }
  const passes = [];
  for (const width of opts.viewports) passes.push({ width, scheme: "light" });
  if (wantsDark) passes.push({ width: widest, scheme: "dark" });
  if (stamp) passes.push({ width: widest, scheme: "light", stamp });
  try {
    for (const url of opts.urls) {
      for (const { width, scheme, stamp: stampFor } of passes) {
        let stampScript = null;
        const context = await browser.newContext({
          viewport: { width, height: 900 },
          deviceScaleFactor: 1,
          reducedMotion: "no-preference",
          colorScheme: scheme
        });
        const page = await context.newPage();
        await page.addInitScript(ERROR_TRAP);
        await page.addInitScript(install);
        if (stampFor) {
          const apply = stampFor.kind === "class" ? `document.documentElement.classList.add(${JSON.stringify(stampFor.value)})` : `document.documentElement.setAttribute(${JSON.stringify(stampFor.name)}, ${JSON.stringify(stampFor.value)})`;
          await page.addInitScript(
            `(function () {
              function set() { if (document.documentElement) { ${apply}; return true; } return false; }
              if (!set()) document.addEventListener('DOMContentLoaded', set);
            })();`
          );
          stampScript = `(function () { ${apply}; })()`;
        }
        try {
          await page.goto(url, { waitUntil: "networkidle", timeout: 3e4 });
        } catch {
          try {
            await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15e3 });
          } catch (err) {
            const detail = (err instanceof Error ? err.message : String(err)).split("\n")[0].trim();
            detectorErrors.push(`${url} @${width}px ${scheme}: ${detail}`);
            await context.close();
            continue;
          }
        }
        let observedStamp = null;
        if (stampFor) {
          if (stampScript) await page.evaluate(stampScript);
          observedStamp = await page.evaluate(
            stampFor.kind === "class" ? `document.documentElement.classList.contains(${JSON.stringify(stampFor.value)}) ? 'class=' + ${JSON.stringify(stampFor.value)} : null` : `document.documentElement.getAttribute(${JSON.stringify(stampFor.name)}) === ${JSON.stringify(stampFor.value)} ? ${JSON.stringify(stampFor.name)} + '=' + ${JSON.stringify(stampFor.value)} : null`
          );
          if (!observedStamp) {
            detectorErrors.push(
              `${url}: could not apply ${stampFor.name}=${stampFor.value} to the page, so the toggled-theme pass was skipped rather than reported under a theme it never entered`
            );
            await page.close();
            await context.close();
            continue;
          }
        }
        await page.waitForTimeout(opts.settleMs ?? 900);
        const found = await page.evaluate(
          `window.__redpenDetect(${JSON.stringify(specs)})`
        );
        for (const h of found ?? []) {
          if (h.ruleId === "__detector_error__") {
            detectorErrors.push(`${h.selector}: ${h.excerpt}`);
            continue;
          }
          const list = hits.get(h.ruleId) ?? [];
          list.push({
            channel: "render",
            location: url,
            selector: h.selector,
            viewport: width,
            scheme: observedStamp ? "dark" : scheme,
            themeStamp: observedStamp ?? void 0,
            excerpt: h.excerpt
          });
          hits.set(h.ruleId, list);
        }
        if (width === widest && scheme === "light" && !stampFor) {
          const signals = await page.evaluate("window.__redpenSurface()");
          if (signals) detectedSurfaces.set(url, classify(signals));
          const raw = await page.evaluate("window.__redpenFingerprint()");
          fingerprints.push({
            page: url,
            recordedAt: (/* @__PURE__ */ new Date()).toISOString(),
            ...raw
          });
          if (opts.screenshotDir) {
            const file = `${opts.screenshotDir}/${slug(url)}.png`;
            await page.screenshot({ path: file, fullPage: true });
            screenshots.set(url, file);
          }
        }
        await page.close();
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }
  const findings = [];
  for (const [ruleId, evidence] of hits) {
    findings.push({ ruleId, channel: "render", evidence: evidence.slice(0, 12) });
  }
  return {
    findings,
    fingerprints,
    screenshots,
    detectedSurfaces,
    unavailable: detectorErrors.length ? summariseErrors(detectorErrors) : null
  };
}
async function probeDarkTheme(browser, url) {
  const read = async (scheme) => {
    const context = await browser.newContext({ colorScheme: scheme });
    const page = await context.newPage();
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15e3 });
      return await page.evaluate(`(function () {
        var declared = false;
        var stamp = null;
        for (var i = 0; i < document.styleSheets.length; i++) {
          try {
            var rules = document.styleSheets[i].cssRules;
            for (var j = 0; j < rules.length; j++) {
              var r = rules[j];
              if (r.conditionText && /prefers-color-scheme/.test(r.conditionText)) declared = true;
              // A theme the page drives itself, rather than one the OS asks for.
              var sel = r.selectorText;
              if (!sel) continue;
              var attr = /\\[data-([\\w-]+)\\s*[~|^$*]?=\\s*["']?(dark|night)["']?\\]/i.exec(sel);
              if (attr && !stamp) stamp = { kind: 'attribute', name: 'data-' + attr[1], value: attr[2] };
              if (!stamp && /(^|[\\s,>+~])(html|:root|body)?\\.dark\\b/.test(sel)) {
                stamp = { kind: 'class', name: 'class', value: 'dark' };
              }
            }
          } catch (e) { /* cross-origin sheet */ }
        }
        var cs = getComputedStyle(document.body);
        return { declared: declared, stamp: stamp, paint: cs.backgroundColor + '|' + cs.color };
      })()`);
    } catch {
      return null;
    } finally {
      await context.close();
    }
  };
  const light = await read("light");
  if (!light) return { media: false, stamp: null };
  if (light.declared) return { media: true, stamp: light.stamp };
  const dark = await read("dark");
  const media = !!dark && dark.paint !== light.paint;
  return { media, stamp: light.stamp };
}
function slug(url) {
  return url.replace(/^https?:\/\//, "").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "page";
}

// src/channels/vision.ts
import { readFileSync as readFileSync3, writeFileSync, mkdirSync } from "node:fs";
import { dirname as dirname2 } from "node:path";
var MIN_CONFIDENCE = 0.7;
var INSTRUCTIONS = [
  "ANSWER ONLY FROM THE SCREENSHOTS. If you built these pages, stop and get someone who did not \u2014 you cannot unsee your own intent, and half these questions are about the impression a page makes on someone meeting it for the first time.",
  "You are being asked to look at some screenshots and say what you see. You are not expected to know this project, and you should not go and read it \u2014 the value of this file is that it can be answered by someone who was not there.",
  'Read "context" first: it says what the product is and what each page is for. Then open each file in "screenshots".',
  'Answer every row in "answers". Each row names a page and a question id; look up the question in "questions" by that id.',
  "present=true means the thing the question describes IS there. Read the direction of each question carefully \u2014 some are phrased as absences.",
  "Answer only from what is visible in the image. Do not infer from what a page like this usually does, and do not open the source.",
  "Set confidence honestly. A question you cannot decide from the image gets a low number, not a guess; answers under 0.7 are discarded, which is the right outcome for an unclear case.",
  'evidence names the specific thing you saw \u2014 "the three cards each open with a rounded icon square" \u2014 not "it looks AI-generated".',
  'A confident "no" counts. It records that the question was asked and cleared.',
  "Leave present as null for anything you did not judge. Null rows are ignored and are not an error.",
  'Do not read "key" before answering. It maps questions to the rules behind them, and knowing which rule you are answering is the one thing that will bias you.',
  "When done: redpen scan <path> --url <url> --answers <this file>"
].join(" ");
var SURFACE_PROSE = {
  persuade: "the visitor is deciding whether to act \u2014 this is a page that has to earn attention",
  operate: "the visitor is completing a task \u2014 this is a tool, and being unremarkable is allowed",
  read: "the visitor is trying to understand something \u2014 this is a page to be read"
};
function scatter(items, keyOf) {
  const hash = (s) => {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  };
  return [...items].sort((a, b) => hash(keyOf(a)) - hash(keyOf(b)));
}
function buildBrief(opts) {
  if (opts.screenshots.size === 0) return null;
  const rules = rulesForChannel("vision").filter(
    (r) => r.vision && !opts.alreadyConfirmed?.has(r.id)
  );
  if (rules.length === 0) return null;
  const scattered = scatter(rules, (r) => r.id);
  const key = {};
  const questions = scattered.map((r, i) => {
    const id = `q${i + 1}`;
    key[id] = r.id;
    return { id, ask: r.vision.ask.replace(/\s+/g, " ").trim() };
  });
  const screenshots = {};
  for (const [url, file] of opts.screenshots) screenshots[url] = file;
  const surface = {};
  for (const url of opts.screenshots.keys()) {
    const s = opts.surfaces?.[url]?.surface;
    surface[url] = s ? SURFACE_PROSE[s] ?? s : "not established \u2014 judge it as you find it";
  }
  const context = {
    product: opts.product?.name ? `${opts.product.name}${opts.product.purpose ? ` \u2014 ${opts.product.purpose}` : ""}` : 'NOT DECLARED. Set "product" in .redpen/config.json. Several questions below cannot be answered fairly without it; leave those null rather than guessing.',
    audience: opts.product?.audience || 'NOT DECLARED. Set "product.audience" in .redpen/config.json.',
    surface
  };
  const answers = [];
  for (const page of opts.screenshots.keys()) {
    for (const q of questions) {
      answers.push({ page, question: q.id, present: null, confidence: 0, evidence: "" });
    }
  }
  return { version: 2, instructions: INSTRUCTIONS, context, screenshots, questions, answers, key };
}
function writeBrief(path2, brief) {
  mkdirSync(dirname2(path2), { recursive: true });
  writeFileSync(path2, JSON.stringify(brief, null, 2) + "\n", "utf8");
}
function readAnswers(path2) {
  const empty = {
    findings: [],
    discarded: [],
    unavailable: null,
    accepted: 0,
    cleared: 0,
    checked: []
  };
  let raw;
  try {
    raw = readFileSync3(path2, "utf8");
  } catch (err) {
    return { ...empty, unavailable: `could not read ${path2}: ${err instanceof Error ? err.message : err}` };
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    return { ...empty, unavailable: `${path2} is not valid JSON \u2014 ${err instanceof Error ? err.message : err}` };
  }
  if (!Array.isArray(parsed.answers)) {
    return { ...empty, unavailable: `${path2} has no "answers" array` };
  }
  if (!parsed.key || typeof parsed.key !== "object") {
    return {
      ...empty,
      unavailable: `${path2} has no "key" \u2014 it maps question ids back to rules, and without it the answers cannot be attributed. Regenerate the brief with --vision.`
    };
  }
  const key = parsed.key;
  const known = new Set(rulesForChannel("vision").map((r) => r.id));
  const hits = /* @__PURE__ */ new Map();
  const discarded = [];
  const checked = /* @__PURE__ */ new Set();
  let accepted = 0;
  let cleared = 0;
  for (const row of parsed.answers) {
    const a = row;
    const answered = a.present !== null && a.present !== void 0;
    const ruleId = typeof a.question === "string" ? key[a.question] : void 0;
    if (!ruleId || !known.has(ruleId)) {
      if (answered) {
        discarded.push(
          `question "${String(a.question)}" is not in this brief's key \u2014 the answers may belong to an older brief`
        );
      }
      continue;
    }
    if (!answered) continue;
    if (typeof a.present !== "boolean") {
      discarded.push(`${a.question}: "present" must be true, false, or null`);
      continue;
    }
    const confidence = typeof a.confidence === "number" ? a.confidence : 0;
    if (confidence < MIN_CONFIDENCE) {
      discarded.push(`${a.question} (${ruleId}): confidence ${confidence} below the ${MIN_CONFIDENCE} floor`);
      continue;
    }
    checked.add(ruleId);
    if (!a.present) {
      cleared++;
      continue;
    }
    const evidence = typeof a.evidence === "string" ? a.evidence.trim() : "";
    if (!evidence) {
      discarded.push(`${a.question} (${ruleId}): answered present with no evidence \u2014 an unevidenced yes is a guess`);
      continue;
    }
    accepted++;
    const list = hits.get(ruleId) ?? [];
    list.push({
      channel: "vision",
      location: typeof a.page === "string" ? a.page : "screenshot",
      excerpt: `${evidence.slice(0, 140)} (confidence ${confidence.toFixed(2)})`
    });
    hits.set(ruleId, list);
  }
  const findings = [];
  for (const [ruleId, evidence] of hits) {
    findings.push({ ruleId, channel: "vision", evidence });
  }
  return { findings, discarded, unavailable: null, accepted, cleared, checked: [...checked] };
}

// src/promote.ts
var AUTHORITATIVE = /* @__PURE__ */ new Set(["render", "fingerprint"]);
function confidenceFor(rule, observed, renderRan) {
  const possible = new Set(rule.channels);
  if (observed.size >= 2) return "confirmed";
  const only = [...observed][0];
  const observableChannels = [...possible].filter((c) => c !== "vision");
  if (observableChannels.length === 1 && observableChannels[0] === only) {
    return "confirmed";
  }
  if (AUTHORITATIVE.has(only)) {
    if (!possible.has("source")) return "confirmed";
    return "likely";
  }
  if (possible.has("render")) {
    return renderRan ? "possible" : "likely";
  }
  return "likely";
}
function promote(raw, opts) {
  const byRule = /* @__PURE__ */ new Map();
  const unknownRules = [];
  for (const f of raw) {
    if (opts.offSurface?.has(f.ruleId)) continue;
    if (!ruleById(f.ruleId)) {
      if (!unknownRules.includes(f.ruleId)) unknownRules.push(f.ruleId);
      continue;
    }
    const list = byRule.get(f.ruleId) ?? [];
    list.push(f);
    byRule.set(f.ruleId, list);
  }
  const findings = [];
  const ignored = [];
  for (const [ruleId, group2] of byRule) {
    const rule = ruleById(ruleId);
    const channels = new Set(group2.map((g) => g.channel));
    const evidence = group2.flatMap((g) => g.evidence);
    const finding = {
      ruleId,
      title: rule.title,
      category: rule.category,
      kind: rule.kind,
      advisory: rule.advisory ?? false,
      severity: rule.severity,
      weight: rule.weight,
      confidence: confidenceFor(rule, channels, opts.renderRan),
      channels: [...channels],
      evidence: evidence.slice(0, 16),
      why: rule.why,
      fix: rule.fix,
      sources: rule.sources
    };
    const suppression = opts.ignored?.get(ruleId);
    if (suppression) {
      if (!suppression.selector && !suppression.scopedTo) {
        ignored.push({ ...finding, ignored: suppression });
        continue;
      }
      const kept = finding.evidence.filter((e) => {
        const bySelector = suppression.selector ? !(e.selector ?? "").includes(suppression.selector) : true;
        const byLocation = suppression.scopedTo ? !e.location.includes(suppression.scopedTo) : true;
        return bySelector && byLocation;
      });
      if (!kept.length) {
        ignored.push({ ...finding, ignored: suppression });
        continue;
      }
      findings.push({ ...finding, evidence: kept });
      continue;
    }
    findings.push(finding);
  }
  findings.sort(rank);
  ignored.sort(rank);
  return { findings, ignored, unknownRules };
}
var CONFIDENCE_ORDER = {
  confirmed: 0,
  likely: 1,
  possible: 2
};
function rank(a, b) {
  const byConfidence = CONFIDENCE_ORDER[a.confidence] - CONFIDENCE_ORDER[b.confidence];
  if (byConfidence !== 0) return byConfidence;
  return b.weight - a.weight;
}
function meetsThreshold(f, min) {
  return CONFIDENCE_ORDER[f.confidence] <= CONFIDENCE_ORDER[min];
}

// src/fingerprint/distance.ts
var WEIGHTS = {
  macrostructure: 0.3,
  sectionRhythm: 0.34,
  hero: 0.14,
  nav: 0.06,
  typeScale: 0.1,
  palette: 0.06
};
var CLASH_THRESHOLD = 0.28;
function rhythmDistance(a, b) {
  if (a.length === 0 && b.length === 0) return 0;
  const rows = a.length + 1;
  const cols = b.length + 1;
  const d = new Array(rows * cols).fill(0);
  for (let i = 0; i < rows; i++) d[i * cols] = i;
  for (let j = 0; j < cols; j++) d[j] = j;
  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const ai = a[i - 1];
      const bj = b[j - 1];
      let cost = 1;
      if (ai === bj) cost = 0;
      else if (family(ai) === family(bj)) cost = 0.4;
      d[i * cols + j] = Math.min(
        d[(i - 1) * cols + j] + 1,
        d[i * cols + (j - 1)] + 1,
        d[(i - 1) * cols + (j - 1)] + cost
      );
    }
  }
  return d[rows * cols - 1] / Math.max(a.length, b.length);
}
function family(kind) {
  if (kind.startsWith("card-grid")) return "card-grid";
  if (kind.startsWith("hero")) return "hero";
  return kind;
}
function scaleDistance(a, b) {
  if (!a.length || !b.length) return 1;
  const setA = new Set(a);
  const setB = new Set(b);
  let shared = 0;
  for (const v of setA) if (setB.has(v)) shared++;
  const union = (/* @__PURE__ */ new Set([...setA, ...setB])).size;
  return 1 - shared / union;
}
function hueDistance(a, b) {
  if (a === null || b === null) return a === b ? 0 : 1;
  const raw = Math.abs(a - b);
  const circular = Math.min(raw, 360 - raw);
  return Math.min(circular / 40, 1);
}
function distance(a, b) {
  return WEIGHTS.macrostructure * (a.macrostructure === b.macrostructure ? 0 : 1) + WEIGHTS.sectionRhythm * rhythmDistance(a.sectionRhythm, b.sectionRhythm) + WEIGHTS.hero * (a.hero === b.hero ? 0 : 1) + WEIGHTS.nav * (a.nav === b.nav ? 0 : 1) + WEIGHTS.typeScale * scaleDistance(a.typeScale, b.typeScale) + WEIGHTS.palette * hueDistance(a.paletteAnchor, b.paletteAnchor);
}
function sharedDimensions(a, b) {
  const shared = [];
  if (a.macrostructure === b.macrostructure) shared.push(`macrostructure (${a.macrostructure})`);
  if (rhythmDistance(a.sectionRhythm, b.sectionRhythm) < 0.2) {
    shared.push(`section rhythm (${a.sectionRhythm.join(" \u2192 ")})`);
  }
  if (a.hero === b.hero) shared.push(`hero (${a.hero})`);
  if (a.nav === b.nav) shared.push(`nav (${a.nav})`);
  if (scaleDistance(a.typeScale, b.typeScale) < 0.2) shared.push("type scale");
  if (hueDistance(a.paletteAnchor, b.paletteAnchor) < 0.25) shared.push("palette anchor");
  return shared;
}
var TEMPLATE_RHYTHM = ["hero-full", "card-grid-3", "cta"];
var APP_SHAPES = /* @__PURE__ */ new Set([
  "record-list",
  "form-page",
  "data-table",
  "workbench"
]);
function isAppShape(print, operatePages) {
  return operatePages?.has(print.page) || APP_SHAPES.has(print.macrostructure);
}
function findClashes(prints, operatePages) {
  const clashes = [];
  for (let i = 0; i < prints.length; i++) {
    for (let j = i + 1; j < prints.length; j++) {
      const a = prints[i];
      const b = prints[j];
      if (isAppShape(a, operatePages) && isAppShape(b, operatePages)) continue;
      const d = distance(a, b);
      if (d < CLASH_THRESHOLD) {
        clashes.push({
          page: a.page,
          against: b.page,
          distance: Number(d.toFixed(3)),
          sharedDimensions: sharedDimensions(a, b)
        });
      }
    }
  }
  return clashes.sort((x, y) => x.distance - y.distance);
}
function fingerprintFindings(prints, clashes, operatePages) {
  const findings = [];
  if (clashes.length) {
    findings.push({
      ruleId: "repeated-macrostructure",
      channel: "fingerprint",
      evidence: clashes.slice(0, 8).map((c) => ({
        channel: "fingerprint",
        location: c.page,
        excerpt: `matches ${c.against} (distance ${c.distance}) \u2014 shares ${c.sharedDimensions.join(", ")}`
      }))
    });
  }
  const templated = prints.filter(
    (p) => !isAppShape(p, operatePages) && rhythmDistance(p.sectionRhythm, TEMPLATE_RHYTHM) < 0.25
  );
  if (templated.length) {
    findings.push({
      ruleId: "template-archetype",
      channel: "fingerprint",
      evidence: templated.map((p) => ({
        channel: "fingerprint",
        location: p.page,
        excerpt: `nav \u2192 hero \u2192 3-card grid \u2192 CTA \u2192 footer (${p.sectionRhythm.join(" \u2192 ")})`
      }))
    });
  }
  const pages = prints.filter((p) => !isAppShape(p, operatePages));
  if (pages.length >= 3) {
    const vocab = new Set(pages.flatMap((p) => p.sectionRhythm.map(family)));
    vocab.delete("nav");
    vocab.delete("footer");
    if (vocab.size <= 3) {
      findings.push({
        ruleId: "single-section-vocabulary",
        channel: "fingerprint",
        evidence: [
          {
            channel: "fingerprint",
            location: `${pages.length} pages`,
            excerpt: `every page built from only: ${[...vocab].join(", ")}`
          }
        ]
      });
    }
    const scaleKeys = new Set(pages.map((p) => p.typeScale.join(",")));
    const familyKeys = new Set(pages.map((p) => p.families.join(",")));
    if (scaleKeys.size === 1 && familyKeys.size === 1 && pages.length >= 3) {
      findings.push({
        ruleId: "uniform-type-scale-across-pages",
        channel: "fingerprint",
        evidence: [
          {
            channel: "fingerprint",
            location: `${pages.length} pages`,
            excerpt: `identical scale ${pages[0].typeScale.join("/")} and identical families on every page`
          }
        ]
      });
    }
    const hues = pages.map((p) => p.paletteAnchor).filter((h) => h !== null);
    if (hues.length === pages.length && new Set(hues).size === 1) {
      findings.push({
        ruleId: "palette-monoculture",
        channel: "fingerprint",
        evidence: [
          {
            channel: "fingerprint",
            location: `${pages.length} pages`,
            excerpt: `every page anchored to hue ${hues[0]}`
          }
        ]
      });
    }
  }
  return findings;
}

// src/fingerprint/store.ts
import { readFileSync as readFileSync5, writeFileSync as writeFileSync3, mkdirSync as mkdirSync3, existsSync as existsSync2 } from "node:fs";
import { join as join5 } from "node:path";

// src/config.ts
import { readFileSync as readFileSync4, writeFileSync as writeFileSync2, mkdirSync as mkdirSync2, existsSync } from "node:fs";
import { join as join4, resolve as resolve2, dirname as dirname3, basename } from "node:path";
import { homedir } from "node:os";
var DEFAULT_CONFIG = {
  urls: [],
  surface: null,
  surfaceByUrl: {},
  viewports: [375, 768, 1440],
  schemes: "auto",
  minConfidence: "likely",
  skipCategories: [],
  tolerance: 0,
  ignore: {},
  capabilities: { javascript: true, externalAssets: true },
  product: { name: "", purpose: "", audience: "" }
};
var DIR = ".redpen";
var CONFIG_FILE = "config.json";
var BASELINE_FILE = "baseline.json";
function stateRoot(scanRoot) {
  const markers = [".git", "package.json", "go.mod", "Cargo.toml", "pyproject.toml", "deno.json"];
  const home = resolve2(homedir());
  const start = resolve2(scanRoot);
  let dir = start;
  for (let i = 0; i < 12; i++) {
    const usable = dir === start || dir !== home && !dir.startsWith(`${home}/.`) && !basename(dir).startsWith(".");
    if (usable && markers.some((m) => existsSync(join4(dir, m)))) return dir;
    const parent = dirname3(dir);
    if (parent === dir || dir === home) break;
    dir = parent;
  }
  return start;
}
function loadConfig(root) {
  const file = join4(stateRoot(root), DIR, CONFIG_FILE);
  if (!existsSync(file)) return { ...DEFAULT_CONFIG };
  try {
    const parsed = JSON.parse(readFileSync4(file, "utf8"));
    return {
      ...DEFAULT_CONFIG,
      ...parsed,
      capabilities: { ...DEFAULT_CONFIG.capabilities, ...parsed.capabilities ?? {} },
      product: { ...DEFAULT_CONFIG.product, ...parsed.product ?? {} }
    };
  } catch (err) {
    throw new Error(`${file} is not valid JSON \u2014 ${err}`);
  }
}
function saveConfig(root, config) {
  mkdirSync2(join4(stateRoot(root), DIR), { recursive: true });
  writeFileSync2(
    join4(stateRoot(root), DIR, CONFIG_FILE),
    JSON.stringify(config, null, 2) + "\n",
    "utf8"
  );
}
function loadBaseline(root) {
  const file = join4(stateRoot(root), DIR, BASELINE_FILE);
  if (!existsSync(file)) return null;
  try {
    return JSON.parse(readFileSync4(file, "utf8"));
  } catch {
    return null;
  }
}
function saveBaseline(root, baseline) {
  mkdirSync2(join4(stateRoot(root), DIR), { recursive: true });
  writeFileSync2(
    join4(stateRoot(root), DIR, BASELINE_FILE),
    JSON.stringify(baseline, null, 2) + "\n",
    "utf8"
  );
}
function configIgnores(config) {
  const map = /* @__PURE__ */ new Map();
  for (const [ruleId, entry] of Object.entries(config.ignore)) {
    const rule = typeof entry === "string" ? { reason: entry } : entry;
    if (!rule?.reason || !rule.reason.trim()) {
      throw new Error(
        `ignore for "${ruleId}" has no reason \u2014 an ignore without a reason is how a rule set stops meaning anything`
      );
    }
    map.set(ruleId, {
      reason: rule.reason,
      location: ".redpen/config.json",
      ...rule.selector ? { selector: rule.selector } : {},
      ...rule.location ? { scopedTo: rule.location } : {}
    });
  }
  return map;
}

// src/fingerprint/store.ts
var DIR2 = ".redpen";
var FILE = "fingerprints.json";
function path(root) {
  return join5(stateRoot(root), DIR2, FILE);
}
function load(root) {
  const file = path(root);
  if (!existsSync2(file)) return [];
  try {
    const parsed = JSON.parse(readFileSync5(file, "utf8"));
    if (parsed.version !== 1) return [];
    return Object.values(parsed.pages);
  } catch {
    return [];
  }
}
function pageId(url) {
  try {
    const u = new URL(url);
    if (u.hostname === "localhost" || u.hostname === "127.0.0.1" || u.hostname === "[::1]" || u.hostname === "::1") {
      u.port = "";
      return u.toString();
    }
    return url;
  } catch {
    return url;
  }
}
function save(root, prints) {
  if (!prints.length) return;
  const dir = join5(stateRoot(root), DIR2);
  mkdirSync3(dir, { recursive: true });
  const existing = load(root);
  const pages = {};
  for (const p of existing) pages[pageId(p.page)] = p;
  for (const p of prints) pages[pageId(p.page)] = p;
  const out = { version: 1, pages };
  writeFileSync3(path(root), JSON.stringify(out, null, 2) + "\n", "utf8");
}
function priorPages(root, currentPages) {
  const current = new Set(currentPages.map(pageId));
  return load(root).filter((p) => !current.has(pageId(p.page)));
}

// src/score.ts
var CONFIDENCE_DISCOUNT = {
  confirmed: 1,
  likely: 0.55,
  possible: 0.25
};
function evidenceMultiplier(count) {
  if (count <= 1) return 1;
  return Math.min(2, 1 + Math.log10(count) / 1.6);
}
function score(findings) {
  const scored = findings.filter((f) => !f.advisory);
  if (!scored.length) return 100;
  let penalty = 0;
  for (const f of scored) {
    const instances = new Set(
      f.evidence.map((e) => `${e.location}:${e.line ?? e.selector ?? ""}`)
    ).size;
    penalty += f.weight / 100 * CONFIDENCE_DISCOUNT[f.confidence] * evidenceMultiplier(instances);
  }
  const result = 100 * Math.exp(-penalty / 6);
  return Math.round(Math.max(0, Math.min(100, result)));
}
function scoreKind(findings, kind) {
  return score(findings.filter((f) => f.kind === kind && !f.advisory));
}
function scoreByCategory(findings) {
  const groups = /* @__PURE__ */ new Map();
  for (const f of findings) {
    const list = groups.get(f.category) ?? [];
    list.push(f);
    groups.set(f.category, list);
  }
  const out = {};
  for (const [cat, list] of groups) out[cat] = score(list);
  return out;
}
function explainScore(findings) {
  const scored = findings.filter((f) => !f.advisory);
  const slop = scoreKind(scored, "slop");
  const quality = scoreKind(scored, "quality");
  const total = headline(slop, quality);
  let totalPenalty = 0;
  for (const f of scored) {
    const n = new Set(f.evidence.map((e) => `${e.location}:${e.line ?? e.selector ?? ""}`)).size;
    totalPenalty += f.weight / 100 * CONFIDENCE_DISCOUNT[f.confidence] * evidenceMultiplier(n);
  }
  const contributions = scored.map((f) => {
    const instances = new Set(
      f.evidence.map((e) => `${e.location}:${e.line ?? e.selector ?? ""}`)
    ).size;
    const penalty = f.weight / 100 * CONFIDENCE_DISCOUNT[f.confidence] * evidenceMultiplier(instances);
    const axis = scored.filter((x) => x.kind === f.kind);
    const without = score(axis.filter((x) => x !== f));
    return {
      ruleId: f.ruleId,
      title: f.title,
      kind: f.kind,
      worth: Number((without - (f.kind === "slop" ? slop : quality)).toFixed(1)),
      penalty: Number(penalty.toFixed(3)),
      share: totalPenalty > 0 ? penalty / totalPenalty : 0,
      instances,
      confidence: f.confidence
    };
  }).sort((a, b) => b.penalty - a.penalty);
  return { score: total, slop, quality, ceiling: 100, contributions };
}
function grade(value) {
  if (value >= 90) return "clean";
  if (value >= 75) return "minor tells";
  if (value >= 55) return "reads as generated";
  if (value >= 35) return "heavily templated";
  return "slop";
}
function qualityGrade(value) {
  if (value >= 90) return "clean";
  if (value >= 75) return "minor defects";
  if (value >= 55) return "visibly rough";
  if (value >= 35) return "broken in places";
  return "broken";
}
function verdict(slop, quality) {
  return quality < slop ? qualityGrade(quality) : grade(slop);
}
function headline(slop, quality) {
  return Math.min(slop, quality);
}

// src/scan.ts
var CODE_CATEGORIES = /* @__PURE__ */ new Set(["craft", "residue"]);
async function runScan(opts) {
  const root = resolve3(opts.root);
  const config = loadConfig(root);
  const urls = opts.urls?.length ? opts.urls : config.urls;
  const viewports = opts.viewports?.length ? opts.viewports : config.viewports;
  const warnings = [];
  const state = stateRoot(root);
  if (!existsSync3(join6(state, ".redpen", "config.json"))) {
    warnings.push(
      `no .redpen/config.json found (looked in ${state}) \u2014 running with defaults, so every capability is assumed available and no surface is declared`
    );
  }
  if (state !== root) {
    opts.onProgress?.(`state: writing .redpen/ to the project root (${state}), not the scanned path`);
  }
  const channelsRun = [];
  const timing = {};
  const raw = [];
  opts.onProgress?.("scanning source");
  const t0 = Date.now();
  const src = scanSource({ root });
  timing.source = Date.now() - t0;
  channelsRun.push("source");
  raw.push(...src.findings);
  opts.onProgress?.(`source: ${src.findings.length} rule(s) hit across ${src.filesScanned} files`);
  if (src.filesScanned === 0) {
    warnings.push(
      `the source channel found no files to read under ${root} \u2014 every source rule was skipped, and findings the render pass could only have confirmed are reported as one-channel. Check the path.`
    );
  }
  let renderRan = false;
  let fingerprints = [];
  let screenshots = /* @__PURE__ */ new Map();
  const surfaces = {};
  if (urls.length && !opts.codeCategories) {
    opts.onProgress?.(`rendering ${urls.length} url(s) at ${viewports.join(", ")}px`);
    const t1 = Date.now();
    const wantShots = opts.screenshots || opts.vision;
    const screenshotDir = wantShots ? resolve3(stateRoot(root), ".redpen", "screenshots") : null;
    if (screenshotDir) mkdirSync4(screenshotDir, { recursive: true });
    const render = await scanRender({
      root,
      urls,
      viewports,
      screenshotDir,
      ...config.schemes === "auto" ? { autoScheme: true } : { schemes: config.schemes }
    });
    timing.render = Date.now() - t1;
    if (render.unavailable && !render.findings.length && !render.fingerprints.length) {
      warnings.push(render.unavailable);
    } else {
      renderRan = true;
      channelsRun.push("render");
      raw.push(...render.findings);
      fingerprints = render.fingerprints;
      screenshots = render.screenshots;
      if (render.unavailable) warnings.push(render.unavailable);
      const schemesSeen = new Set(
        render.findings.flatMap((f) => f.evidence.map((e) => e.scheme).filter(Boolean))
      );
      opts.onProgress?.(
        `render: ${render.findings.length} rule(s) hit` + (schemesSeen.size > 1 ? ` across ${[...schemesSeen].join(" and ")}` : "")
      );
      const darkOnly = render.findings.filter(
        (f) => f.evidence.length && f.evidence.every((e) => e.scheme === "dark")
      );
      if (darkOnly.length) {
        opts.onProgress?.(
          `render: ${darkOnly.length} rule(s) fire only in dark mode \u2014 ${darkOnly.map((f) => f.ruleId).join(", ")}`
        );
      }
      const undecided = [];
      for (const url of urls) {
        const declared = config.surfaceByUrl[url] ?? config.surface ?? null;
        if (declared) {
          surfaces[url] = { surface: declared, declared: true };
          continue;
        }
        const detected = render.detectedSurfaces.get(url);
        if (detected && detected.confidence >= MIN_SURFACE_CONFIDENCE) {
          surfaces[url] = { surface: detected.surface, declared: false };
          opts.onProgress?.(
            `surface: ${url} is "${detected.surface}" (${detected.confidence}) \u2014 ${detected.signals.join(", ")}`
          );
        } else {
          undecided.push(url);
        }
      }
      if (undecided.length && Object.keys(surfaces).length) {
        const tally = /* @__PURE__ */ new Map();
        for (const v of Object.values(surfaces)) {
          tally.set(v.surface, (tally.get(v.surface) ?? 0) + 1);
        }
        const [modal, count] = [...tally].sort((a, b) => b[1] - a[1])[0];
        if (count >= 2 && count >= Object.keys(surfaces).length * 0.6) {
          for (const url of undecided.splice(0)) {
            surfaces[url] = { surface: modal, declared: false, inherited: true };
            const d = render.detectedSurfaces.get(url);
            opts.onProgress?.(
              `surface: ${url} inherited "${modal}" from ${count} sibling route(s)` + (d?.sparse ? ` \u2014 too little on the page to classify (${d.density.rows} rows, ${d.density.controls} controls)` : "")
            );
          }
        }
      }
      for (const url of undecided) {
        const d = render.detectedSurfaces.get(url);
        if (d?.sparse) {
          warnings.push(
            `${url} had too little on it to classify (${d.density.rows} rows, ${d.density.controls} controls, ${d.density.characters} characters). Every rule stayed on. This is usually a thin dev fixture rather than a problem with the page \u2014 scan against fuller data, or declare "surface" in .redpen/config.json.`
          );
        } else {
          warnings.push(
            `could not confidently classify ${url} (best guess "${d?.surface ?? "unknown"}" at ${d?.confidence ?? 0}). Every rule stayed on. Declare "surface" in .redpen/config.json to gate the rules that only hold on one kind of page.`
          );
        }
      }
    }
  } else if (!opts.codeCategories) {
    warnings.push(
      'no urls configured \u2014 the render channel did not run, so every source finding that render could confirm is capped at "possible". Add urls to .redpen/config.json or pass --url.'
    );
  }
  let briefPath = null;
  let visionChecked = 0;
  let visionCleared = 0;
  if (opts.answers) {
    const t2 = Date.now();
    const answers = readAnswers(opts.answers);
    timing.vision = Date.now() - t2;
    if (answers.unavailable) {
      warnings.push(answers.unavailable);
    } else {
      channelsRun.push("vision");
      raw.push(...answers.findings);
      visionChecked = answers.checked.length;
      visionCleared = answers.cleared;
      for (const d of answers.discarded) warnings.push(`vision answer discarded: ${d}`);
      opts.onProgress?.(
        `vision: ${answers.accepted + answers.cleared} answer(s) across ${answers.checked.length} rule(s) \u2014 ${answers.accepted} present, ${answers.cleared} cleared`
      );
    }
  }
  if (opts.vision && screenshots.size) {
    const counts = /* @__PURE__ */ new Map();
    for (const f of raw) counts.set(f.ruleId, (counts.get(f.ruleId) ?? 0) + 1);
    const confirmed = new Set([...counts].filter(([, n]) => n >= 2).map(([id]) => id));
    const brief = buildBrief({
      screenshots,
      alreadyConfirmed: confirmed,
      surfaces,
      product: config.product
    });
    if (!config.product.name) {
      warnings.push(
        'no "product" declared in .redpen/config.json \u2014 the vision brief cannot say what this is, and the questions about specificity are unanswerable without it'
      );
    }
    if (brief) {
      briefPath = resolve3(stateRoot(root), ".redpen", "vision-brief.json");
      writeBrief(briefPath, brief);
      opts.onProgress?.(
        `vision: wrote a brief with ${brief.questions.length} question(s) over ${screenshots.size} screenshot(s)`
      );
    }
  } else if (opts.vision) {
    warnings.push(
      "vision needs screenshots \u2014 pass --url so the render channel can capture them"
    );
  }
  let clashes = [];
  if (fingerprints.length) {
    channelsRun.push("fingerprint");
    const prior = opts.ephemeral ? [] : priorPages(root, fingerprints.map((f) => f.page));
    const all = [...prior, ...fingerprints];
    const operatePages = new Set(
      Object.entries(surfaces).filter(([, v]) => v.surface === "operate").map(([url]) => url)
    );
    clashes = findClashes(all, operatePages);
    raw.push(...fingerprintFindings(all, clashes, operatePages));
    if (!opts.ephemeral) save(root, fingerprints);
    opts.onProgress?.(
      `fingerprint: ${fingerprints.length} page(s) recorded, ${prior.length} prior on file, ${clashes.length} clash(es)`
    );
  }
  if (opts.codeCategories) {
    const unread = unreadLanguages(root);
    if (unread.length) {
      warnings.push(
        `${unread.map(([ext, n]) => `${n} ${ext}`).join(", ")} file(s) were not read \u2014 no rule in this corpus knows that language, so nothing about them is in this score.`
      );
    }
  }
  const activeSurfaces = [...new Set(Object.values(surfaces).map((s) => s.surface))];
  const offSurface = /* @__PURE__ */ new Set();
  const caps = config.capabilities;
  let unactionable = 0;
  for (const rule of loadCorpus()) {
    if (!isActionable(rule, caps)) {
      offSurface.add(rule.id);
      unactionable++;
    }
  }
  if (unactionable) {
    opts.onProgress?.(
      `capabilities: ${unactionable} rule(s) need something this project declares it cannot do`
    );
  }
  if (activeSurfaces.length === 1) {
    const only = activeSurfaces[0];
    for (const rule of loadCorpus()) {
      if (!appliesTo(rule, only)) offSurface.add(rule.id);
    }
    if (offSurface.size) {
      opts.onProgress?.(
        `surface: ${offSurface.size} rule(s) do not apply on a "${only}" surface`
      );
    }
  }
  const ignores = configIgnores(config);
  const promoted = promote(raw, { renderRan, ignored: ignores, offSurface });
  if (promoted.unknownRules.length) {
    warnings.push(`unknown rule ids reported by a channel: ${promoted.unknownRules.join(", ")}`);
  }
  const codeOnly = opts.codeCategories === true;
  let inScope = promoted.findings.filter((f) => !config.skipCategories.includes(f.category)).filter((f) => CODE_CATEGORIES.has(f.category) ? codeOnly : !codeOnly);
  if (opts.only?.length) {
    const wanted = new Set(opts.only);
    const known = new Set(loadCorpus().map((r) => r.category));
    const unknown = [...wanted].filter((c) => !known.has(c));
    if (unknown.length) {
      warnings.push(
        `--only ${unknown.join(", ")}: no such categor${unknown.length === 1 ? "y" : "ies"}. It takes categories, not rule ids \u2014 ${[...known].sort().join(", ")}. Nothing was reported under ${unknown.length === 1 ? "that name" : "those names"}.`
      );
    }
    inScope = inScope.filter((f) => wanted.has(f.category));
  }
  const scored = inScope.filter((f) => meetsThreshold(f, config.minConfidence));
  const advisory = inScope.filter((f) => f.advisory);
  const slopScore = scoreKind(scored, "slop");
  const qualityScore = scoreKind(scored, "quality");
  return {
    score: headline(slopScore, qualityScore),
    slopScore,
    qualityScore,
    surfaces,
    advisory,
    vision: { checked: visionChecked, cleared: visionCleared },
    findings: inScope.filter((f) => !f.advisory),
    ignored: promoted.ignored,
    fingerprints,
    clashes,
    channelsRun,
    timing,
    config,
    warnings,
    briefPath
  };
}
function ruleIds(findings) {
  return [...new Set(findings.map((f) => f.ruleId))].sort();
}

// src/report/terminal.ts
var import_picocolors = __toESM(require_picocolors(), 1);
var CONFIDENCE_LABEL = {
  confirmed: (s) => import_picocolors.default.red(import_picocolors.default.bold(s)),
  likely: (s) => import_picocolors.default.yellow(s),
  possible: (s) => import_picocolors.default.dim(s)
};
var CONFIDENCE_MARK = {
  confirmed: "\u25CF",
  likely: "\u25D0",
  possible: "\u25CB"
};
function mark(c) {
  return CONFIDENCE_LABEL[c](CONFIDENCE_MARK[c]);
}
var DETAIL = {
  confirmed: Number.POSITIVE_INFINITY,
  likely: 5,
  possible: 0
};
function renderTerminal(result, opts) {
  const out = [];
  const { score: value, findings } = result;
  out.push("");
  out.push(scoreLine(value, result.slopScore, result.qualityScore));
  out.push("");
  out.push(kindLine(result));
  out.push("");
  const surfaceNote = surfaceLine(result);
  if (surfaceNote) {
    out.push(surfaceNote);
    out.push("");
  }
  if (result.channelsRun.length < 3) {
    out.push(import_picocolors.default.dim(`  channels: ${result.channelsRun.join(", ")}`));
    const missing = ["source", "render", "vision"].filter(
      (c) => !result.channelsRun.includes(c)
    );
    if (missing.length) {
      out.push(
        import_picocolors.default.dim(
          `  not run: ${missing.join(", ")} \u2014 findings that need them are unconfirmed, not absent`
        )
      );
    }
    out.push("");
  }
  if (!findings.length) {
    out.push(import_picocolors.default.green("  No findings."));
    out.push("");
    return out.join("\n");
  }
  const cats = scoreByCategory(findings);
  out.push(import_picocolors.default.dim("  BY CATEGORY"));
  const items = Object.entries(cats).sort((a, b) => a[1] - b[1]).map(([k, v]) => ({ plain: `${k} ${String(v).padStart(3)}`, shown: `${k} ${colorScore(v)}` }));
  const SEP = "  \xB7  ";
  let row = [];
  let used = 0;
  for (const it of items) {
    const cost = it.plain.length + (row.length ? SEP.length : 0);
    if (row.length && used + cost > MEASURE - 2) {
      out.push(`  ${row.map((r) => r.shown).join(import_picocolors.default.dim(SEP))}`);
      row = [];
      used = 0;
    }
    row.push(it);
    used += it.plain.length + (row.length > 1 ? SEP.length : 0);
  }
  if (row.length) out.push(`  ${row.map((r) => r.shown).join(import_picocolors.default.dim(SEP))}`);
  out.push("");
  const byConfidence = group(findings);
  for (const conf of ["confirmed", "likely", "possible"]) {
    const list = byConfidence.get(conf);
    if (!list?.length) continue;
    out.push(CONFIDENCE_LABEL[conf](`  ${conf.toUpperCase()} (${list.length})`));
    out.push(import_picocolors.default.dim(`  ${wrap(describeConfidence(conf), MEASURE - 2, "  ")}`));
    out.push("");
    const depth = opts.verbose ? list.length : DETAIL[conf];
    for (const f of list.slice(0, depth)) {
      out.push(...renderFinding(f, opts));
    }
    const rest = list.slice(depth);
    if (rest.length) {
      const idWidth = idColumn(rest);
      for (const f of rest) out.push(rosterLine(f, idWidth));
      out.push(
        import_picocolors.default.dim(
          `      ${rest.length} listed, not argued \u2014 \`redpen why <rule-id>\`, or --verbose for all`
        )
      );
      out.push("");
    }
  }
  if (result.clashes.length) {
    out.push(import_picocolors.default.red(import_picocolors.default.bold(`  SAMENESS (${result.clashes.length})`)));
    out.push(import_picocolors.default.dim("  Pages in this project that share a skeleton."));
    out.push("");
    for (const c of result.clashes.slice(0, 6)) {
      out.push(`  ${import_picocolors.default.bold(short(c.page))} ${import_picocolors.default.dim("\u2248")} ${import_picocolors.default.bold(short(c.against))}  ${import_picocolors.default.dim(`distance ${c.distance}`)}`);
      for (const dim of c.sharedDimensions) {
        out.push(import_picocolors.default.dim(`      shares ${dim}`));
      }
      out.push("");
    }
  }
  if (result.advisory.length) {
    out.push(import_picocolors.default.dim(`  ADVISORY (${result.advisory.length}) \u2014 reported, never scored`));
    const advWidth = idColumn(result.advisory);
    for (const f of result.advisory) {
      out.push(
        import_picocolors.default.dim(`         ${f.ruleId.padEnd(advWidth)}  ${f.title}`)
      );
    }
    out.push("");
  }
  if (opts.showIgnored && result.ignored.length) {
    out.push(import_picocolors.default.dim(`  ${result.ignored.length} finding(s) suppressed by redpen-ignore:`));
    for (const f of result.ignored) {
      out.push(import_picocolors.default.dim(`    ${f.ruleId} \u2014 ${f.ignored?.reason ?? "no reason given"}`));
    }
    out.push("");
  }
  return out.join("\n");
}
var MEASURE = 80;
function rosterLine(f, idWidth) {
  const weight = String(f.weight).padStart(3);
  const id = f.ruleId.padEnd(idWidth);
  const room = MEASURE - 4 - weight.length - 2 - id.length - 2;
  const title = f.title.length > room ? `${f.title.slice(0, room - 1)}\u2026` : f.title;
  return `  ${mark(f.confidence)} ${import_picocolors.default.dim(weight)}  ${import_picocolors.default.dim(id)}  ${title}`;
}
var idColumn = (list) => Math.max(...list.map((f) => f.ruleId.length));
function renderFinding(f, opts) {
  const out = [];
  const channels = import_picocolors.default.dim(`[${f.channels.join("+")}]`);
  out.push(`  ${mark(f.confidence)} ${import_picocolors.default.bold(f.title)} ${channels} ${import_picocolors.default.dim(`${f.ruleId} \xB7 ${f.weight}`)}`);
  out.push(`    ${wrap(f.why, MEASURE - 4, "    ")}`);
  out.push(`    ${import_picocolors.default.green("fix")} ${wrap(f.fix, MEASURE - 8, "        ")}`);
  const shown = f.evidence.slice(0, opts.maxEvidence);
  for (const e of shown) {
    out.push(import_picocolors.default.dim(`      ${formatEvidence(e)}`));
  }
  if (f.evidence.length > shown.length) {
    out.push(import_picocolors.default.dim(`      \u2026 and ${f.evidence.length - shown.length} more`));
  }
  if (opts.verbose) {
    out.push(import_picocolors.default.dim(`      from ${f.sources.map((s) => `${s.origin}:${s.ref}`).join(", ")}`));
  }
  out.push("");
  return out;
}
function formatEvidence(e) {
  const where = e.line !== void 0 ? `${e.location}:${e.line}` : e.selector ? `${short(e.location)} ${e.selector}` : short(e.location);
  const vp = e.viewport ? ` @${e.viewport}px` : "";
  const scheme = e.scheme === "dark" ? " dark" : "";
  const head = `${where}${vp}${scheme}`;
  if (!e.excerpt) return head;
  const budget = MEASURE - 6 - head.length - 2;
  const excerpt = budget > 12 && e.excerpt.length > budget ? `${e.excerpt.slice(0, budget - 1)}\u2026` : e.excerpt;
  return `${head}  ${excerpt}`;
}
function describeConfidence(c) {
  switch (c) {
    case "confirmed":
      return "Seen independently by more than one channel, or by the only channel that can see it.";
    case "likely":
      return "Seen by one channel that reads real state. No channel disagreed.";
    case "possible":
      return "Source-only. The render pass checked the same thing and did not confirm it.";
  }
}
function kindLine(result) {
  const slop = result.findings.filter((f) => f.kind === "slop").length;
  const qual = result.findings.filter((f) => f.kind === "quality").length;
  const row = (name, value, n, gloss) => `  ${import_picocolors.default.dim(name)}${" ".repeat(7 - name.length)}  ${colorScore(value)}  ${meter(value, 14)}  ` + import_picocolors.default.dim(`${n} finding${n === 1 ? "" : "s"} \u2014 ${gloss}`);
  return row("slop", result.slopScore, slop, "reads as machine-made") + "\n" + row("quality", result.qualityScore, qual, "broken regardless of taste");
}
function surfaceLine(result) {
  const entries = Object.entries(result.surfaces);
  if (!entries.length) return null;
  const kinds = new Set(entries.map(([, v]) => v.surface));
  const declared = entries.every(([, v]) => v.declared);
  const how = declared ? "declared" : entries.some(([, v]) => v.declared) ? "mixed" : "detected";
  if (kinds.size === 1) {
    return import_picocolors.default.dim(`  surface  ${[...kinds][0]} (${how}) \u2014 rules that only hold elsewhere are off`);
  }
  return import_picocolors.default.dim(`  surface  ${entries.map(([u, v]) => `${short(u)}=${v.surface}`).join(", ")} (${how})`);
}
function scoreLine(value, slop, quality) {
  return `  ${import_picocolors.default.bold("redpen")}  ${colorScore(value)}${import_picocolors.default.dim("/100")}  ${import_picocolors.default.dim(verdict(slop, quality))}`;
}
var BANDS = [
  { floor: 90, paint: (s) => import_picocolors.default.green(s) },
  { floor: 75, paint: (s) => import_picocolors.default.yellow(s) },
  { floor: 55, paint: (s) => import_picocolors.default.yellow(s) },
  { floor: 35, paint: (s) => import_picocolors.default.red(s) },
  { floor: 0, paint: (s) => import_picocolors.default.red(s) }
];
var band = (value) => BANDS.find((b) => value >= b.floor);
function colorScore(value) {
  return band(value).paint(import_picocolors.default.bold(String(value).padStart(3, " ")));
}
function meter(value, width = 24) {
  const filled = Math.round(value / 100 * width);
  return band(value).paint("\u2588".repeat(filled)) + import_picocolors.default.dim("\u2591".repeat(width - filled));
}
function group(findings) {
  const m = /* @__PURE__ */ new Map();
  for (const f of findings) {
    const list = m.get(f.confidence) ?? [];
    list.push(f);
    m.set(f.confidence, list);
  }
  return m;
}
function short(location) {
  return location.replace(/^https?:\/\//, "").replace(/\/$/, "");
}
function wrap(text, width, indent) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = "";
  for (const w of words) {
    if ((line + " " + w).trim().length > width) {
      lines.push(line.trim());
      line = w;
    } else {
      line += " " + w;
    }
  }
  if (line.trim()) lines.push(line.trim());
  return lines.join("\n" + indent);
}

// src/report/markdown.ts
var DETAIL2 = {
  confirmed: Number.POSITIVE_INFINITY,
  likely: 5,
  possible: 0
};
var MARK = { confirmed: "\u25CF", likely: "\u25D0", possible: "\u25CB" };
function renderMarkdown(result) {
  const out = [];
  const { score: score2, findings, clashes } = result;
  out.push(`# redpen \u2014 ${score2}/100 (${verdict(result.slopScore, result.qualityScore)})`);
  out.push("");
  const slopCount = findings.filter((f) => f.kind === "slop").length;
  const qualCount = findings.filter((f) => f.kind === "quality").length;
  out.push(`| Axis | Score | Findings | What it measures |`);
  out.push(`| --- | --- | --- | --- |`);
  out.push(
    `| **slop** | ${result.slopScore} | ${slopCount} | whether it reads as machine-made |`
  );
  out.push(
    `| **quality** | ${result.qualityScore} | ${qualCount} | whether it is broken regardless of taste |`
  );
  out.push("");
  const surfaceEntries = Object.entries(result.surfaces);
  if (surfaceEntries.length) {
    const how = surfaceEntries.every(([, v]) => v.declared) ? "declared" : "detected";
    out.push(
      `Surface: ${surfaceEntries.map(([u, v]) => `\`${u}\` \u2192 **${v.surface}**`).join(", ")} (${how}). Rules that only hold on other surfaces did not run.`
    );
    out.push("");
  }
  out.push(`Channels run: ${result.channelsRun.join(", ")}.`);
  const missing = ["source", "render", "vision"].filter(
    (c) => !result.channelsRun.includes(c)
  );
  if (missing.length) {
    out.push("");
    out.push(
      `> Not run: ${missing.join(", ")}. Findings that depend on those channels are unconfirmed rather than absent.`
    );
  }
  out.push("");
  if (!findings.length && !clashes.length) {
    out.push("No findings.");
    return out.join("\n");
  }
  const cats = scoreByCategory(findings);
  if (Object.keys(cats).length) {
    out.push("| Category | Score |");
    out.push("| --- | --- |");
    for (const [cat, v] of Object.entries(cats).sort((a, b) => a[1] - b[1])) {
      out.push(`| ${cat} | ${v} |`);
    }
    out.push("");
  }
  for (const conf of ["confirmed", "likely", "possible"]) {
    const list = findings.filter((f) => f.confidence === conf);
    if (!list.length) continue;
    out.push(`## ${conf} (${list.length})`);
    out.push("");
    for (const f of list.slice(0, DETAIL2[conf])) out.push(...findingBlock(f));
    const rest = list.slice(DETAIL2[conf]);
    if (rest.length) {
      out.push(`<details><summary>${rest.length} more, listed not argued</summary>`);
      out.push("");
      out.push("| | Weight | Rule | Finding |");
      out.push("| --- | --- | --- | --- |");
      for (const f of rest) {
        out.push(`| ${MARK[f.confidence]} | ${f.weight} | \`${f.ruleId}\` | ${f.title} |`);
      }
      out.push("");
      out.push("</details>");
      out.push("");
    }
  }
  if (clashes.length) {
    out.push("## Sameness");
    out.push("");
    out.push(
      "Pages in this project that share a structural skeleton. Readers register structure, not palette \u2014 two pages this close read as the same page."
    );
    out.push("");
    for (const c of clashes) {
      out.push(`- \`${c.page}\` \u2248 \`${c.against}\` (distance ${c.distance})`);
      for (const d of c.sharedDimensions) out.push(`  - shares ${d}`);
    }
    out.push("");
  }
  if (result.advisory.length) {
    out.push("## Advisory");
    out.push("");
    out.push("Reported but never scored \u2014 tells humans use legitimately often enough that counting them would be noise.");
    out.push("");
    for (const f of result.advisory) out.push(`- \`${f.ruleId}\` \u2014 ${f.title}`);
    out.push("");
  }
  if (result.ignored.length) {
    out.push("## Suppressed");
    out.push("");
    for (const f of result.ignored) {
      out.push(`- \`${f.ruleId}\` \u2014 ${f.ignored?.reason ?? "no reason given"}`);
    }
    out.push("");
  }
  return out.join("\n");
}
function findingBlock(f) {
  const out = [];
  out.push(`### ${f.title}`);
  out.push("");
  out.push(`\`${f.ruleId}\` \xB7 weight ${f.weight} \xB7 seen by ${f.channels.join(" + ")}`);
  out.push("");
  out.push(f.why);
  out.push("");
  out.push(`**Fix.** ${f.fix}`);
  out.push("");
  if (f.evidence.length) {
    out.push("```");
    for (const e of f.evidence.slice(0, 8)) out.push(evidenceLine(e));
    if (f.evidence.length > 8) out.push(`\u2026 and ${f.evidence.length - 8} more`);
    out.push("```");
    out.push("");
  }
  out.push(
    `<sub>from ${f.sources.map((s) => `${s.origin}:${s.ref}`).join(", ")}</sub>`
  );
  out.push("");
  return out;
}
function evidenceLine(e) {
  const where = e.line !== void 0 ? `${e.location}:${e.line}` : `${e.location} ${e.selector ?? ""}`;
  const vp = e.viewport ? ` @${e.viewport}px${e.scheme === "dark" ? " dark" : ""}` : "";
  return `${where.trim()}${vp}${e.excerpt ? `  ${e.excerpt}` : ""}`;
}

// src/cli.ts
var HELP = `
${import_picocolors2.default.bold("redpen")} \u2014 one verdict on your UI

  ${import_picocolors2.default.bold("redpen scan")} [path] [url...]  run every available channel and print the report
  ${import_picocolors2.default.bold("redpen code")} [path]        the source it is written in, not the page it serves
  ${import_picocolors2.default.bold("redpen check")} [path]       same, but exit non-zero when the score drops
  ${import_picocolors2.default.bold("redpen baseline")} [path]    record the current score as the bar to hold
  ${import_picocolors2.default.bold("redpen rules")}              list the merged corpus
  ${import_picocolors2.default.bold("redpen why")} <rule-id>      explain one rule and where it came from
  ${import_picocolors2.default.bold("redpen why-score")} [path]   what the score is made of and what would move it
  ${import_picocolors2.default.bold("redpen sources")}            provenance rollup across upstream catalogues
  ${import_picocolors2.default.bold("redpen fingerprints")}       show recorded page signatures
  ${import_picocolors2.default.bold("redpen brief")} [path]       print the vision brief so nobody has to open JSON
  ${import_picocolors2.default.bold("redpen init")} [path]        write .redpen/config.json

${import_picocolors2.default.dim("Options")}
  --url <u>          page to render (repeatable). Bare urls work too. Without
                     one, render never runs and every source finding is capped.
  --viewport <n>     viewport width (repeatable). Default 375, 768, 1440.
  --json [file]      machine-readable output
  --markdown [file]  markdown report
  --screenshots      capture full-page PNGs to .redpen/screenshots
  --vision           capture screenshots and write .redpen/vision-brief.json
  --answers <file>   fold answered vision questions back into the verdict
  --only <cats>      report only these categories, comma separated
                     (color typography layout depth motion iconography copy
                      usability a11y sameness chrome system composition)
  --min <level>      confidence floor for scoring: confirmed | likely | possible
  --verbose          argue every finding in full, and show rule provenance
  --show-ignored     list findings suppressed by redpen-ignore
  --quiet            suppress progress output

${import_picocolors2.default.dim("Suppressing a finding")}
  Add ${import_picocolors2.default.bold("redpen-ignore <reason>")} in a comment on or above the line, or
  ${import_picocolors2.default.bold("redpen-ignore:<rule-id> <reason>")} to suppress just one rule. The reason is
  required \u2014 an ignore with no reason is how a rule set stops meaning anything.
`;
function parseArgs(argv) {
  const args = {
    command: "scan",
    positional: [],
    urls: [],
    viewports: [],
    json: false,
    markdown: false,
    screenshots: false,
    vision: false,
    answers: null,
    only: [],
    min: null,
    verbose: false,
    showIgnored: false,
    quiet: false
  };
  let first = true;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help" || a === "-h") {
      args.command = "help";
      return args;
    }
    if (a === "--url") {
      args.urls.push(argv[++i]);
      continue;
    }
    if (a === "--viewport") {
      args.viewports.push(Number(argv[++i]));
      continue;
    }
    if (a === "--json") {
      const next = argv[i + 1];
      args.json = next && !next.startsWith("--") ? (i++, next) : true;
      continue;
    }
    if (a === "--markdown") {
      const next = argv[i + 1];
      args.markdown = next && !next.startsWith("--") ? (i++, next) : true;
      continue;
    }
    if (a === "--screenshots") {
      args.screenshots = true;
      continue;
    }
    if (a === "--vision") {
      args.vision = true;
      continue;
    }
    if (a === "--answers") {
      args.answers = argv[++i] ?? null;
      continue;
    }
    if (a === "--only") {
      args.only = (argv[++i] ?? "").split(",").map((x) => x.trim()).filter(Boolean);
      continue;
    }
    if (a === "--min") {
      args.min = argv[++i];
      continue;
    }
    if (a === "--verbose" || a === "-v") {
      args.verbose = true;
      continue;
    }
    if (a === "--show-ignored") {
      args.showIgnored = true;
      continue;
    }
    if (a === "--quiet" || a === "-q") {
      args.quiet = true;
      continue;
    }
    if (a.startsWith("--")) {
      fail(`unknown option ${a}`);
    }
    if (first && ["scan", "code", "check", "baseline", "rules", "why", "sources", "fingerprints", "brief", "init", "why-score", "help"].includes(a)) {
      args.command = a;
      first = false;
      continue;
    }
    first = false;
    if (/^https?:\/\//i.test(a)) {
      args.urls.push(a);
      continue;
    }
    args.positional.push(a);
  }
  return args;
}
function fail(message) {
  process.stderr.write(import_picocolors2.default.red(`redpen: ${message}
`));
  process.exit(2);
}
async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.command === "help") {
    process.stdout.write(HELP);
    return;
  }
  const TAKES_A_PATH = /* @__PURE__ */ new Set(["scan", "code", "check", "baseline", "fingerprints", "brief", "init", "why-score"]);
  const root = resolve4(TAKES_A_PATH.has(args.command) ? args.positional[0] ?? "." : ".");
  if (TAKES_A_PATH.has(args.command) && args.positional[0] && !existsSync4(root)) {
    fail(`no such directory: ${args.positional[0]}`);
  }
  switch (args.command) {
    case "rules":
      return cmdRules(args);
    case "why":
      return cmdWhy(args);
    case "why-score":
      return cmdWhyScore(root, args);
    case "sources":
      return cmdSources();
    case "fingerprints":
      return cmdFingerprints(root);
    case "brief":
      return cmdBrief(root);
    case "init":
      return cmdInit(root);
    case "baseline":
      return cmdBaseline(root, args);
    case "code":
      return cmdScan(root, args, false, true);
    case "check":
      return cmdScan(root, args, true);
    default:
      return cmdScan(root, args, false);
  }
}
async function cmdScan(root, args, gating, code = false) {
  const onProgress = args.quiet ? void 0 : (m) => process.stderr.write(import_picocolors2.default.dim(`  \u2026 ${m}
`));
  const result = await runScan({
    root,
    urls: args.urls,
    viewports: args.viewports,
    screenshots: args.screenshots,
    vision: args.vision,
    answers: args.answers,
    only: args.only,
    ephemeral: gating || code,
    codeCategories: code,
    onProgress
  });
  if (args.min) result.config.minConfidence = args.min;
  for (const w of result.warnings) {
    process.stderr.write(import_picocolors2.default.yellow(`  ! ${w}
`));
  }
  if (args.json) {
    const payload = JSON.stringify(
      {
        score: result.score,
        slopScore: result.slopScore,
        qualityScore: result.qualityScore,
        grade: verdict(result.slopScore, result.qualityScore),
        surfaces: result.surfaces,
        channelsRun: result.channelsRun,
        findings: result.findings,
        advisory: result.advisory,
        ignored: result.ignored,
        clashes: result.clashes,
        fingerprints: result.fingerprints,
        warnings: result.warnings,
        timing: result.timing
      },
      null,
      2
    );
    if (typeof args.json === "string") {
      writeFileSync4(args.json, payload + "\n", "utf8");
      process.stderr.write(import_picocolors2.default.dim(`  wrote ${args.json}
`));
    } else {
      process.stdout.write(payload + "\n");
    }
  }
  if (args.markdown) {
    const md = renderMarkdown(result);
    if (typeof args.markdown === "string") {
      writeFileSync4(args.markdown, md + "\n", "utf8");
      process.stderr.write(import_picocolors2.default.dim(`  wrote ${args.markdown}
`));
    } else {
      process.stdout.write(md + "\n");
    }
  }
  if (!args.json && !args.markdown) {
    process.stdout.write(
      renderTerminal(result, {
        verbose: args.verbose,
        showIgnored: args.showIgnored,
        maxEvidence: args.verbose ? 12 : 3
      })
    );
  }
  if (result.briefPath) {
    process.stderr.write(
      "\n" + import_picocolors2.default.bold("  vision brief ready\n") + import_picocolors2.default.dim(`  ${result.briefPath}
`) + import_picocolors2.default.dim("  Open each screenshot it lists, fill in the pre-built answer rows, then re-run with\n") + import_picocolors2.default.dim(`  --answers ${result.briefPath}
`)
    );
  }
  if (!gating) return;
  const baseline = loadBaseline(root);
  if (!baseline) {
    process.stderr.write(
      import_picocolors2.default.yellow(
        "  ! no baseline recorded \u2014 run `redpen baseline` to set the bar this check holds against\n"
      )
    );
    process.exit(0);
  }
  const ran = new Set(result.channelsRun);
  const missing = (baseline.channels ?? []).filter((c) => !ran.has(c));
  if (missing.length) {
    process.stderr.write(
      import_picocolors2.default.red(
        `
  cannot check: the baseline was recorded with ${baseline.channels.join(", ")} but this run only managed ${result.channelsRun.join(", ")}.
  Missing ${missing.join(", ")} means fewer findings and a higher score, which would pass for the wrong reason.
`
      )
    );
    process.exit(2);
  }
  if (!baseline.channels) {
    process.stderr.write(
      import_picocolors2.default.yellow("\n  ! this baseline predates channel recording, so a partial run cannot be detected.\n    Re-record it with `redpen baseline` to close that hole.\n")
    );
  }
  if (baseline.slop === void 0 || baseline.quality === void 0) {
    process.stderr.write(
      import_picocolors2.default.red(
        "\n  cannot check: this baseline predates the two-axis score, so its number is not\n  the same quantity as this run's. Re-record it with `redpen baseline`.\n"
      )
    );
    process.exit(2);
  }
  const drops = [
    { axis: "slop", was: baseline.slop, now: result.slopScore },
    { axis: "quality", was: baseline.quality, now: result.qualityScore }
  ].map((a) => ({ ...a, drop: a.was - a.now })).filter((a) => a.drop > result.config.tolerance);
  const known = new Set(baseline.knownRules);
  const introduced = ruleIds(result.findings.filter((f) => f.confidence !== "possible")).filter(
    (id) => !known.has(id)
  );
  process.stderr.write("\n");
  for (const a of drops) {
    process.stderr.write(
      import_picocolors2.default.red(
        `  ${a.axis} dropped ${a.drop} point(s), ${a.was} to ${a.now} (tolerance ${result.config.tolerance})
`
      )
    );
  }
  if (introduced.length) {
    process.stderr.write(import_picocolors2.default.red(`  new tells since baseline: ${introduced.join(", ")}
`));
  }
  if (drops.length || introduced.length) {
    process.exit(1);
  }
  process.stderr.write(
    import_picocolors2.default.green(
      `  holding: slop ${result.slopScore} against ${baseline.slop}, quality ${result.qualityScore} against ${baseline.quality}
`
    )
  );
}
async function cmdBaseline(root, args) {
  const result = await runScan({
    root,
    urls: args.urls,
    viewports: args.viewports,
    onProgress: args.quiet ? void 0 : (m) => process.stderr.write(import_picocolors2.default.dim(`  \u2026 ${m}
`))
  });
  for (const warning of result.warnings) {
    process.stderr.write(import_picocolors2.default.yellow(`  ! ${warning}
`));
  }
  saveBaseline(root, {
    score: result.score,
    slop: result.slopScore,
    quality: result.qualityScore,
    recordedAt: (/* @__PURE__ */ new Date()).toISOString(),
    knownRules: ruleIds(result.findings.filter((f) => f.confidence !== "possible")),
    channels: result.channelsRun
  });
  process.stdout.write(
    `
  baseline set at ${import_picocolors2.default.bold(String(result.score))} (${verdict(result.slopScore, result.qualityScore)}) with ${result.findings.length} finding(s) on record
` + import_picocolors2.default.dim(`  channels: ${result.channelsRun.join(", ")}
`) + import_picocolors2.default.dim("  `redpen check` now fails when the score drops or a new tell appears\n\n")
  );
  if (!result.channelsRun.includes("render")) {
    process.stderr.write(
      import_picocolors2.default.yellow("  ! recorded without the render channel \u2014 every later `redpen check` that does\n") + import_picocolors2.default.yellow("    render will see the extra findings as a regression. Re-record with --url.\n")
    );
  }
}
function cmdRules(args) {
  const rules = loadCorpus();
  const filter = args.positional[0]?.toLowerCase();
  const shown = (filter ? rules.filter((r) => r.category === filter || r.id.includes(filter)) : rules).slice().sort((a, b) => a.category.localeCompare(b.category) || b.weight - a.weight);
  process.stdout.write(
    `
  ${import_picocolors2.default.bold(`${rules.length} rules`)}${filter ? import_picocolors2.default.dim(` \xB7 filtered to ${shown.length}`) : ""}

`
  );
  let lastCategory = "";
  for (const r of shown) {
    if (r.category !== lastCategory) {
      process.stdout.write(`  ${import_picocolors2.default.bold(import_picocolors2.default.underline(r.category))}
`);
      lastCategory = r.category;
    }
    const rank2 = r.evidenceRank === 0 ? import_picocolors2.default.green("top") : r.evidenceRank !== null ? import_picocolors2.default.green(`#${String(r.evidenceRank).padEnd(2)}`) : import_picocolors2.default.dim("  \u2014");
    process.stdout.write(
      `    ${String(r.weight).padStart(3)} ${rank2}  ${r.id.padEnd(32)} ${import_picocolors2.default.dim(r.channels.join("+"))}
`
    );
  }
  process.stdout.write(
    import_picocolors2.default.dim(
      '\n  weight = 0-100 \xB7 rank = position in the 3,033-comment Reddit sample\n  "top" = the headline finding (sameness outranked every individual tell)\n  "\u2014"  = never measured against human complaint data; weight is assigned by consequence\n\n'
    )
  );
}
function cmdWhy(args) {
  const id = args.positional[0];
  if (!id) fail("usage: redpen why <rule-id>");
  const rule = ruleById(id);
  if (!rule) fail(`no rule "${id}" \u2014 run \`redpen rules\` to list them`);
  process.stdout.write(`
  ${import_picocolors2.default.bold(rule.title)}  ${import_picocolors2.default.dim(rule.id)}

`);
  process.stdout.write(`  ${import_picocolors2.default.dim("category")}   ${rule.category}
`);
  process.stdout.write(
    `  ${import_picocolors2.default.dim("kind")}       ${rule.kind === "slop" ? "slop \u2014 reads as machine-made" : "quality \u2014 broken regardless of taste"}${rule.advisory ? import_picocolors2.default.yellow("  (advisory: reported, never scored)") : ""}
`
  );
  process.stdout.write(
    `  ${import_picocolors2.default.dim("surfaces")}   ${rule.surfaces ? rule.surfaces.join(", ") + import_picocolors2.default.dim(" only") : "all (persuade, operate, read)"}
`
  );
  process.stdout.write(`  ${import_picocolors2.default.dim("weight")}     ${rule.weight}/100
`);
  process.stdout.write(
    `  ${import_picocolors2.default.dim("evidence")}   ${rule.evidenceRank === 0 ? "the headline finding of the 3,033-comment Reddit sample \u2014 it outranked every individual tell" : rule.evidenceRank !== null ? `rank #${rule.evidenceRank} in the 3,033-comment Reddit sample` : "never measured against human complaint data \u2014 weight is assigned by consequence"}
`
  );
  process.stdout.write(`  ${import_picocolors2.default.dim("channels")}   ${rule.channels.join(", ")}
`);
  process.stdout.write(`  ${import_picocolors2.default.dim("from")}       ${rule.sources.map((s) => `${s.origin}:${s.ref}`).join("\n             ")}

`);
  process.stdout.write(`  ${rule.why}

`);
  process.stdout.write(`  ${import_picocolors2.default.green("fix")}  ${rule.fix}

`);
  if (rule.legitimateWhen) {
    process.stdout.write(import_picocolors2.default.dim(`  legitimate when: ${rule.legitimateWhen}

`));
  }
}
async function cmdWhyScore(root, args) {
  const result = await runScan({
    root,
    urls: args.urls,
    viewports: args.viewports,
    only: args.only,
    ephemeral: true,
    onProgress: args.quiet ? void 0 : (m) => process.stderr.write(import_picocolors2.default.dim(`  \u2026 ${m}
`))
  });
  for (const warning of result.warnings) {
    process.stderr.write(import_picocolors2.default.yellow(`  ! ${warning}
`));
  }
  const scorable = result.findings.filter((f) => meetsThreshold(f, result.config.minConfidence));
  const { score: total, contributions } = explainScore(scorable);
  const excluded = result.findings.length - scorable.length;
  const w = process.stdout.write.bind(process.stdout);
  w(
    `
  ${import_picocolors2.default.bold("redpen")}  ${import_picocolors2.default.bold(String(total))}${import_picocolors2.default.dim("/100")}   ${import_picocolors2.default.dim(verdict(result.slopScore, result.qualityScore))}
`
  );
  w(`  ${import_picocolors2.default.dim("slop")} ${result.slopScore}   ${import_picocolors2.default.dim("quality")} ${result.qualityScore}

`);
  if (!contributions.length) {
    w(import_picocolors2.default.green("  Nothing is costing you anything.\n\n"));
    return;
  }
  w(`  ${import_picocolors2.default.bold("What the score is made of")}
`);
  w(import_picocolors2.default.dim("  share = this finding's portion of the total problem.\n"));
  w(import_picocolors2.default.dim("  +pts  = what the score gains if it goes away, on its own.\n\n"));
  const saturated = contributions.every((c) => c.worth < 1);
  if (saturated && contributions.length > 3) {
    w(import_picocolors2.default.yellow("  The curve is saturated: there is enough here that no single fix\n"));
    w(import_picocolors2.default.yellow("  moves the number much. Work down by share \u2014 the score starts\n"));
    w(import_picocolors2.default.yellow("  responding once the top few are gone.\n\n"));
  }
  for (const c of contributions) {
    const bar = "\u2588".repeat(Math.max(1, Math.round(c.share * 40)));
    const pct = `${(c.share * 100).toFixed(1)}%`.padStart(6);
    const pts = c.worth >= 1 ? import_picocolors2.default.green(`+${c.worth}`.padStart(5)) : import_picocolors2.default.dim(`+${c.worth}`.padStart(5));
    w(`   ${pct} ${pts}  ${c.ruleId.padEnd(28)} ${import_picocolors2.default.dim(`${c.kind} \xB7 ${c.instances}\xD7`)}
`);
    w(`   ${" ".repeat(12)}${c.kind === "slop" ? import_picocolors2.default.yellow(bar) : import_picocolors2.default.red(bar)}
`);
  }
  const best = contributions[0];
  if (best) {
    w(`
  ${import_picocolors2.default.bold("Start here")}  ${best.ruleId} ${import_picocolors2.default.dim(`\u2014 ${(best.share * 100).toFixed(0)}% of the total`)}
`);
    w(import_picocolors2.default.dim(`  ${result.findings.find((f) => f.ruleId === best.ruleId)?.fix ?? ""}
`));
  }
  const advisory = result.advisory.length;
  if (advisory) {
    w(import_picocolors2.default.dim(`
  ${advisory} advisory finding(s) cost nothing and never will.
`));
  }
  if (excluded) {
    w(import_picocolors2.default.dim(
      `  ${excluded} finding(s) below the "${result.config.minConfidence}" floor are not counted here \u2014 the render pass checked them and did not agree.
`
    ));
  }
  w("\n");
}
function cmdSources() {
  const counts = originCounts();
  const total = loadCorpus().length;
  process.stdout.write(`
  ${import_picocolors2.default.bold(`${total} rules`)} merged from:

`);
  for (const [cat, n] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
    process.stdout.write(`    ${String(n).padStart(4)}  ${cat}
`);
  }
  process.stdout.write(
    import_picocolors2.default.dim(
      "\n  Counts exceed the rule total because most rules were named by more than one\n  catalogue \u2014 that overlap is what the merge collapsed. See NOTICE for licences.\n\n"
    )
  );
}
function cmdFingerprints(root) {
  const prints = load(root);
  if (!prints.length) {
    process.stdout.write(
      import_picocolors2.default.dim("\n  no fingerprints on record \u2014 run `redpen scan --url <u>` to record one\n\n")
    );
    return;
  }
  process.stdout.write(`
  ${import_picocolors2.default.bold(`${prints.length} page(s) on record`)}

`);
  for (const p of prints) {
    process.stdout.write(`  ${import_picocolors2.default.bold(p.page)}
`);
    process.stdout.write(`    ${import_picocolors2.default.dim("skeleton")}  ${p.macrostructure}
`);
    process.stdout.write(`    ${import_picocolors2.default.dim("rhythm")}    ${p.sectionRhythm.join(" \u2192 ")}
`);
    process.stdout.write(`    ${import_picocolors2.default.dim("hero/nav")}  ${p.hero} / ${p.nav}
`);
    process.stdout.write(`    ${import_picocolors2.default.dim("type")}      ${p.typeScale.join(", ")}px \xB7 ${p.families.join(", ")}
`);
    process.stdout.write(
      `    ${import_picocolors2.default.dim("anchor")}    ${p.paletteAnchor === null ? "monochrome" : `hue ${p.paletteAnchor}`}

`
    );
  }
}
function cmdBrief(root) {
  const file = join7(stateRoot(root), ".redpen", "vision-brief.json");
  if (!existsSync4(file)) {
    fail(`no brief at ${file} \u2014 run \`redpen scan <path> --url <url> --vision\` first`);
  }
  const brief = JSON.parse(readFileSync6(file, "utf8"));
  const w = process.stdout.write.bind(process.stdout);
  w(`
  ${import_picocolors2.default.bold("Vision brief")}  ${import_picocolors2.default.dim(file)}

`);
  w(`  ${import_picocolors2.default.bold("What this is")}
    ${wrapAt(brief.context.product, 72, "    ")}
`);
  w(`  ${import_picocolors2.default.bold("Who uses it")}
    ${wrapAt(brief.context.audience, 72, "    ")}

`);
  w(`  ${import_picocolors2.default.bold("Pages")}
`);
  for (const [url, shot] of Object.entries(brief.screenshots)) {
    w(`    ${import_picocolors2.default.bold(url)}
      ${import_picocolors2.default.dim(shot)}
      ${import_picocolors2.default.dim(brief.context.surface[url] ?? "")}
`);
  }
  w("\n");
  w(`  ${import_picocolors2.default.bold("Questions")}  ${import_picocolors2.default.dim("yes means the thing described IS there")}
`);
  for (const q of brief.questions) {
    w(`    ${import_picocolors2.default.green(q.id.padEnd(4))} ${wrapAt(q.ask, 70, "         ")}
`);
  }
  const answered = brief.answers.filter((a) => a.present !== null).length;
  w(`
  ${answered}/${brief.answers.length} rows answered.
`);
  w(import_picocolors2.default.dim(`  Open each screenshot, fill in present / confidence / evidence, then:
`));
  w(import_picocolors2.default.dim(`    redpen scan ${root} --url <url> --answers ${file}

`));
}
function wrapAt(text, width, indent) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    if ((line + " " + word).trim().length > width) {
      lines.push(line.trim());
      line = word;
    } else line += " " + word;
  }
  if (line.trim()) lines.push(line.trim());
  return lines.join("\n" + indent);
}
function cmdInit(root) {
  const existing = loadConfig(root);
  saveConfig(root, { ...DEFAULT_CONFIG, ...existing });
  process.stdout.write(
    `
  wrote ${import_picocolors2.default.bold(join7(stateRoot(root), ".redpen", "config.json"))}

` + import_picocolors2.default.dim("  Two fields are worth filling in before anything else:\n\n") + import_picocolors2.default.dim('    "urls"    \u2014 without one the browser pass never runs and every\n') + import_picocolors2.default.dim('                finding it could confirm is capped at "possible".\n') + import_picocolors2.default.dim('    "product" \u2014 name, purpose, audience. The vision brief is meant to\n') + import_picocolors2.default.dim("                be answerable by someone who has not seen the project,\n") + import_picocolors2.default.dim("                and several questions are unfair without it.\n\n") + import_picocolors2.default.dim('  "schemes" defaults to "auto": redpen probes the first page for a dark\n') + import_picocolors2.default.dim('  theme and scans it too if there is one. Set ["light"] to skip that.\n\n')
  );
}
main().catch((err) => {
  process.stderr.write(import_picocolors2.default.red(`redpen: ${err instanceof Error ? err.message : String(err)}
`));
  if (process.env.REDPEN_DEBUG && err instanceof Error) {
    process.stderr.write(import_picocolors2.default.dim(String(err.stack)) + "\n");
  }
  process.exit(2);
});
export {
  parseArgs
};
