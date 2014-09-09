/**
 * Require the given path.
 *
 * @param {String} path
 * @return {Object} exports
 * @api public
 */

function require(path, parent, orig) {
    //	console.log("fmx-ui.js require path=" + path);
    var resolved = require.resolve(path);

    // lookup failed
    if (null == resolved) {
        orig = orig || path;
        parent = parent || 'root';
        var err = new Error('Failed to require "' + orig + '" from "' + parent + '"');
        err.path = orig;
        err.parent = parent;
        err.require = true;
        throw err;
    }

    var module = require.modules[resolved];
    //	console.log("fmx-ui.js require path=" + path + " resolved=" + resolved);

    // perform real require()
    // by invoking the module's
    // registered function
    if (!module._resolving && !module.exports) {
        var mod = {};
        mod.exports = {};
        mod.client = mod.component = true;
        module._resolving = true;
        module.call(this, mod.exports, require.relative(resolved), mod);
        delete module._resolving;
        module.exports = mod.exports;
    }

    return module.exports;
}

/**
 * Registered modules.
 */

require.modules = {};

/**
 * Registered aliases.
 */

require.aliases = {};

/**
 * Resolve `path`.
 *
 * Lookup:
 *
 *   - PATH/index.js
 *   - PATH.js
 *   - PATH
 *
 * @param {String} path
 * @return {String} path or null
 * @api private
 */

require.resolve = function(path) {
    if (path.charAt(0) === '/')
        path = path.slice(1);

    var paths = [path, path + '.js', path + '.json', path + '/index.js', path + '/index.json'];

    for (var i = 0; i < paths.length; i++) {
        var path = paths[i];
        if (require.modules.hasOwnProperty(path))
            return path;
        if (require.aliases.hasOwnProperty(path))
            return require.aliases[path];
    }
};

/**
 * Normalize `path` relative to the current path.
 *
 * @param {String} curr
 * @param {String} path
 * @return {String}
 * @api private
 */

require.normalize = function(curr, path) {
    var segs = [];

    if ('.' != path.charAt(0))
        return path;

    curr = curr.split('/');
    path = path.split('/');

    for (var i = 0; i < path.length; ++i) {
        if ('..' == path[i]) {
            curr.pop();
        } else if ('.' != path[i] && '' != path[i]) {
            segs.push(path[i]);
        }
    }

    return curr.concat(segs).join('/');
};

/**
 * Register module at `path` with callback `definition`.
 *
 * @param {String} path
 * @param {Function} definition
 * @api private
 */

require.register = function(path, definition) {
    require.modules[path] = definition;
};

/**
 * Alias a module definition.
 *
 * @param {String} from
 * @param {String} to
 * @api private
 */

require.alias = function(from, to) {
    if (!require.modules.hasOwnProperty(from)) {
        throw new Error('Failed to alias "' + from + '", it does not exist');
    }
    require.aliases[to] = from;
};

/**
 * Return a require function relative to the `parent` path.
 *
 * @param {String} parent
 * @return {Function}
 * @api private
 */

require.relative = function(parent) {
    var p = require.normalize(parent, '..');

    /**
     * lastIndexOf helper.
     */

    function lastIndexOf(arr, obj) {
        var i = arr.length;
        while (i--) {
            if (arr[i] === obj)
                return i;
        }
        return -1;
    }

    /**
     * The relative require() itself.
     */

    function localRequire(path) {
        var resolved = localRequire.resolve(path);
        return require(resolved, parent, path);
    }

    /**
     * Resolve relative to the parent.
     */

    localRequire.resolve = function(path) {
        var c = path.charAt(0);
        if ('/' == c)
            return path.slice(1);
        if ('.' == c)
            return require.normalize(p, path);

        // resolve deps by returning
        // the dep in the nearest "deps"
        // directory
        var segs = parent.split('/');
        var i = lastIndexOf(segs, 'deps') + 1;
        if (!i)
            i = 0;
        path = segs.slice(0, i + 1).join('/') + '/deps/' + path;
        return path;
    };

    /**
     * Check if module is defined at `path`.
     */

    localRequire.exists = function(path) {
        return require.modules.hasOwnProperty(localRequire.resolve(path));
    };

    return localRequire;
};
require.register("bergie-emitter/index.js", function(exports, require, module) {

    /**
     * Expose `Emitter`.
     */

    module.exports.EventEmitter = Emitter;

    /**
     * Initialize a new `Emitter`.
     *
     * @api public
     */

    function Emitter(obj) {
        if (obj)
            return mixin(obj);
    }
    ;

    /**
     * Mixin the emitter properties.
     *
     * @param {Object} obj
     * @return {Object}
     * @api private
     */

    function mixin(obj) {
        for (var key in Emitter.prototype) {
            obj[key] = Emitter.prototype[key];
        }
        return obj;
    }

    /**
     * Listen on the given `event` with `fn`.
     *
     * @param {String} event
     * @param {Function} fn
     * @return {Emitter}
     * @api public
     */

    Emitter.prototype.on = Emitter.prototype.addEventListener = function(event, fn) {
        this._callbacks = this._callbacks || {};
        (this._callbacks[event] = this._callbacks[event] || []).push(fn);
        return this;
    };

    /**
     * Adds an `event` listener that will be invoked a single
     * time then automatically removed.
     *
     * @param {String} event
     * @param {Function} fn
     * @return {Emitter}
     * @api public
     */

    Emitter.prototype.once = function(event, fn) {
        var self = this;
        this._callbacks = this._callbacks || {};

        function on() {
            self.off(event, on);
            fn.apply(this, arguments);
        }


        on.fn = fn;
        this.on(event, on);
        return this;
    };

    /**
     * Remove the given callback for `event` or all
     * registered callbacks.
     *
     * @param {String} event
     * @param {Function} fn
     * @return {Emitter}
     * @api public
     */

    Emitter.prototype.off = Emitter.prototype.removeListener = Emitter.prototype.removeAllListeners = Emitter.prototype.removeEventListener = function(event, fn) {
        this._callbacks = this._callbacks || {};

        // all
        if (0 == arguments.length) {
            this._callbacks = {};
            return this;
        }

        // specific event
        var callbacks = this._callbacks[event];
        if (!callbacks)
            return this;

        // remove all handlers
        if (1 == arguments.length) {
            delete this._callbacks[event];
            return this;
        }

        // remove specific handler
        var cb;
        for (var i = 0; i < callbacks.length; i++) {
            cb = callbacks[i];
            if (cb === fn || cb.fn === fn) {
                callbacks.splice(i, 1);
                break;
            }
        }
        return this;
    };

    /**
     * Emit `event` with the given args.
     *
     * @param {String} event
     * @param {Mixed} ...
     * @return {Emitter}
     */

    Emitter.prototype.emit = function(event) {
        this._callbacks = this._callbacks || {};
        var args = [].slice.call(arguments, 1), callbacks = this._callbacks[event];

        if (callbacks) {
            callbacks = callbacks.slice(0);
            for (var i = 0, len = callbacks.length; i < len; ++i) {
                callbacks[i].apply(this, args);
            }
        }

        return this;
    };

    /**
     * Return array of callbacks for `event`.
     *
     * @param {String} event
     * @return {Array}
     * @api public
     */

    Emitter.prototype.listeners = function(event) {
        this._callbacks = this._callbacks || {};
        return this._callbacks[event] || [];
    };

    /**
     * Check if this emitter has `event` handlers.
     *
     * @param {String} event
     * @return {Boolean}
     * @api public
     */

    Emitter.prototype.hasListeners = function(event) {
        return !!this.listeners(event).length;
    };

});
require.register("component-underscore/index.js", function(exports, require, module) {
    //     Underscore.js 1.3.3
    //     (c) 2009-2012 Jeremy Ashkenas, DocumentCloud Inc.
    //     Underscore is freely distributable under the MIT license.
    //     Portions of Underscore are inspired or borrowed from Prototype,
    //     Oliver Steele's Functional, and John Resig's Micro-Templating.
    //     For all details and documentation:
    //     http://documentcloud.github.com/underscore

    (function() {

        // Baseline setup
        // --------------

        // Establish the root object, `window` in the browser, or `global` on the server.
        var root = this;

        // Save the previous value of the `_` variable.
        var previousUnderscore = root._;

        // Establish the object that gets returned to break out of a loop iteration.
        var breaker = {};

        // Save bytes in the minified (but not gzipped) version:
        var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

        // Create quick reference variables for speed access to core prototypes.
        var push = ArrayProto.push, slice = ArrayProto.slice, unshift = ArrayProto.unshift, toString = ObjProto.toString, hasOwnProperty = ObjProto.hasOwnProperty;

        // All **ECMAScript 5** native function implementations that we hope to use
        // are declared here.
        var nativeForEach = ArrayProto.forEach, nativeMap = ArrayProto.map, nativeReduce = ArrayProto.reduce, nativeReduceRight = ArrayProto.reduceRight, nativeFilter = ArrayProto.filter, nativeEvery = ArrayProto.every, nativeSome = ArrayProto.some, nativeIndexOf = ArrayProto.indexOf, nativeLastIndexOf = ArrayProto.lastIndexOf, nativeIsArray = Array.isArray, nativeKeys = Object.keys, nativeBind = FuncProto.bind;

        // Create a safe reference to the Underscore object for use below.
        var _ = function(obj) {
            return new wrapper(obj);
        };

        // Export the Underscore object for **Node.js**, with
        // backwards-compatibility for the old `require()` API. If we're in
        // the browser, add `_` as a global object via a string identifier,
        // for Closure Compiler "advanced" mode.
        if (typeof exports !== 'undefined') {
            if (typeof module !== 'undefined' && module.exports) {
                exports = module.exports = _;
            }
            exports._ = _;
        } else {
            root['_'] = _;
        }

        // Current version.
        _.VERSION = '1.3.3';

        // Collection Functions
        // --------------------

        // The cornerstone, an `each` implementation, aka `forEach`.
        // Handles objects with the built-in `forEach`, arrays, and raw objects.
        // Delegates to **ECMAScript 5**'s native `forEach` if available.
        var each = _.each = _.forEach = function(obj, iterator, context) {
            if (obj == null)
                return;
            if (nativeForEach && obj.forEach === nativeForEach) {
                obj.forEach(iterator, context);
            } else if (obj.length === +obj.length) {
                for (var i = 0, l = obj.length; i < l; i++) {
                    if (iterator.call(context, obj[i], i, obj) === breaker)
                        return;
                }
            } else {
                for (var key in obj) {
                    if (_.has(obj, key)) {
                        if (iterator.call(context, obj[key], key, obj) === breaker)
                            return;
                    }
                }
            }
        };

        // Return the results of applying the iterator to each element.
        // Delegates to **ECMAScript 5**'s native `map` if available.
        _.map = _.collect = function(obj, iterator, context) {
            var results = [];
            if (obj == null)
                return results;
            if (nativeMap && obj.map === nativeMap)
                return obj.map(iterator, context);
            each(obj, function(value, index, list) {
                results[results.length] = iterator.call(context, value, index, list);
            });
            return results;
        };

        // **Reduce** builds up a single result from a list of values, aka `inject`,
        // or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.
        _.reduce = _.foldl = _.inject = function(obj, iterator, memo, context) {
            var initial = arguments.length > 2;
            if (obj == null)
                obj = [];
            if (nativeReduce && obj.reduce === nativeReduce) {
                if (context)
                    iterator = _.bind(iterator, context);
                return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
            }
            each(obj, function(value, index, list) {
                if (!initial) {
                    memo = value;
                    initial = true;
                } else {
                    memo = iterator.call(context, memo, value, index, list);
                }
            });
            if (!initial)
                throw new TypeError('Reduce of empty array with no initial value');
            return memo;
        };

        // The right-associative version of reduce, also known as `foldr`.
        // Delegates to **ECMAScript 5**'s native `reduceRight` if available.
        _.reduceRight = _.foldr = function(obj, iterator, memo, context) {
            var initial = arguments.length > 2;
            if (obj == null)
                obj = [];
            if (nativeReduceRight && obj.reduceRight === nativeReduceRight) {
                if (context)
                    iterator = _.bind(iterator, context);
                return initial ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
            }
            var reversed = _.toArray(obj).reverse();
            if (context && !initial)
                iterator = _.bind(iterator, context);
            return initial ? _.reduce(reversed, iterator, memo, context) : _.reduce(reversed, iterator);
        };

        // Return the first value which passes a truth test. Aliased as `detect`.
        _.find = _.detect = function(obj, iterator, context) {
            var result;
            any(obj, function(value, index, list) {
                if (iterator.call(context, value, index, list)) {
                    result = value;
                    return true;
                }
            });
            return result;
        };

        // Return all the elements that pass a truth test.
        // Delegates to **ECMAScript 5**'s native `filter` if available.
        // Aliased as `select`.
        _.filter = _.select = function(obj, iterator, context) {
            var results = [];
            if (obj == null)
                return results;
            if (nativeFilter && obj.filter === nativeFilter)
                return obj.filter(iterator, context);
            each(obj, function(value, index, list) {
                if (iterator.call(context, value, index, list))
                    results[results.length] = value;
            });
            return results;
        };

        // Return all the elements for which a truth test fails.
        _.reject = function(obj, iterator, context) {
            var results = [];
            if (obj == null)
                return results;
            each(obj, function(value, index, list) {
                if (!iterator.call(context, value, index, list))
                    results[results.length] = value;
            });
            return results;
        };

        // Determine whether all of the elements match a truth test.
        // Delegates to **ECMAScript 5**'s native `every` if available.
        // Aliased as `all`.
        _.every = _.all = function(obj, iterator, context) {
            var result = true;
            if (obj == null)
                return result;
            if (nativeEvery && obj.every === nativeEvery)
                return obj.every(iterator, context);
            each(obj, function(value, index, list) {
                if (!(result = result && iterator.call(context, value, index, list)))
                    return breaker;
            });
            return !!result;
        };

        // Determine if at least one element in the object matches a truth test.
        // Delegates to **ECMAScript 5**'s native `some` if available.
        // Aliased as `any`.
        var any = _.some = _.any = function(obj, iterator, context) {
            iterator || (iterator = _.identity);
            var result = false;
            if (obj == null)
                return result;
            if (nativeSome && obj.some === nativeSome)
                return obj.some(iterator, context);
            each(obj, function(value, index, list) {
                if (result || (result = iterator.call(context, value, index, list)))
                    return breaker;
            });
            return !!result;
        };

        // Determine if a given value is included in the array or object using `===`.
        // Aliased as `contains`.
        _.include = _.contains = function(obj, target) {
            var found = false;
            if (obj == null)
                return found;
            if (nativeIndexOf && obj.indexOf === nativeIndexOf)
                return obj.indexOf(target) != -1;
            found = any(obj, function(value) {
                return value === target;
            });
            return found;
        };

        // Invoke a method (with arguments) on every item in a collection.
        _.invoke = function(obj, method) {
            var args = slice.call(arguments, 2);
            return _.map(obj, function(value) {
                return (_.isFunction(method) ? method : value[method]).apply(value, args);
            });
        };

        // Convenience version of a common use case of `map`: fetching a property.
        _.pluck = function(obj, key) {
            return _.map(obj, function(value) {
                return value[key];
            });
        };

        // Return the maximum element or (element-based computation).
        // Can't optimize arrays of integers longer than 65,535 elements.
        // See: https://bugs.webkit.org/show_bug.cgi?id=80797
        _.max = function(obj, iterator, context) {
            if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
                return Math.max.apply(Math, obj);
            }
            if (!iterator && _.isEmpty(obj))
                return -Infinity;
            var result = {
                computed: -Infinity
            };
            each(obj, function(value, index, list) {
                var computed = iterator ? iterator.call(context, value, index, list) : value;
                computed >= result.computed && (result = {
                    value: value,
                    computed: computed
                });
            });
            return result.value;
        };

        // Return the minimum element (or element-based computation).
        _.min = function(obj, iterator, context) {
            if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
                return Math.min.apply(Math, obj);
            }
            if (!iterator && _.isEmpty(obj))
                return Infinity;
            var result = {
                computed: Infinity
            };
            each(obj, function(value, index, list) {
                var computed = iterator ? iterator.call(context, value, index, list) : value;
                computed < result.computed && (result = {
                    value: value,
                    computed: computed
                });
            });
            return result.value;
        };

        // Shuffle an array.
        _.shuffle = function(obj) {
            var rand;
            var index = 0;
            var shuffled = [];
            each(obj, function(value) {
                rand = Math.floor(Math.random() * ++index);
                shuffled[index - 1] = shuffled[rand];
                shuffled[rand] = value;
            });
            return shuffled;
        };

        // Sort the object's values by a criterion produced by an iterator.
        _.sortBy = function(obj, val, context) {
            var iterator = lookupIterator(obj, val);
            return _.pluck(_.map(obj, function(value, index, list) {
                return {
                    value: value,
                    criteria: iterator.call(context, value, index, list)
                };
            }).sort(function(left, right) {
                var a = left.criteria, b = right.criteria;
                if (a ===
                        void 0)
                    return 1;
                if (b ===
                        void 0)
                    return -1;
                return a < b ? -1 : a > b ? 1 : 0;
            }), 'value');
        };

        // An internal function to generate lookup iterators.
        var lookupIterator = function(obj, val) {
            return _.isFunction(val) ? val : function(obj) {
                return obj[val];
            };
        };

        // An internal function used for aggregate "group by" operations.
        var group = function(obj, val, behavior) {
            var result = {};
            var iterator = lookupIterator(obj, val);
            each(obj, function(value, index) {
                var key = iterator(value, index);
                behavior(result, key, value);
            });
            return result;
        };

        // Groups the object's values by a criterion. Pass either a string attribute
        // to group by, or a function that returns the criterion.
        _.groupBy = function(obj, val) {
            return group(obj, val, function(result, key, value) {
                (result[key] || (result[key] = [])).push(value);
            });
        };

        // Counts instances of an object that group by a certain criterion. Pass
        // either a string attribute to count by, or a function that returns the
        // criterion.
        _.countBy = function(obj, val) {
            return group(obj, val, function(result, key, value) {
                result[key] || (result[key] = 0);
                result[key]++;
            });
        };

        // Use a comparator function to figure out the smallest index at which
        // an object should be inserted so as to maintain order. Uses binary search.
        _.sortedIndex = function(array, obj, iterator) {
            iterator || (iterator = _.identity);
            var value = iterator(obj);
            var low = 0, high = array.length;
            while (low < high) {
                var mid = (low + high) >> 1;
                iterator(array[mid]) < value ? low = mid + 1 : high = mid;
            }
            return low;
        };

        // Safely convert anything iterable into a real, live array.
        _.toArray = function(obj) {
            if (!obj)
                return [];
            if (_.isArray(obj))
                return slice.call(obj);
            if (_.isArguments(obj))
                return slice.call(obj);
            if (obj.toArray && _.isFunction(obj.toArray))
                return obj.toArray();
            return _.values(obj);
        };

        // Return the number of elements in an object.
        _.size = function(obj) {
            return _.isArray(obj) ? obj.length : _.keys(obj).length;
        };

        // Array Functions
        // ---------------

        // Get the first element of an array. Passing **n** will return the first N
        // values in the array. Aliased as `head` and `take`. The **guard** check
        // allows it to work with `_.map`.
        _.first = _.head = _.take = function(array, n, guard) {
            return (n != null) && !guard ? slice.call(array, 0, n) : array[0];
        };

        // Returns everything but the last entry of the array. Especially useful on
        // the arguments object. Passing **n** will return all the values in
        // the array, excluding the last N. The **guard** check allows it to work with
        // `_.map`.
        _.initial = function(array, n, guard) {
            return slice.call(array, 0, array.length - ((n == null) || guard ? 1 : n));
        };

        // Get the last element of an array. Passing **n** will return the last N
        // values in the array. The **guard** check allows it to work with `_.map`.
        _.last = function(array, n, guard) {
            if ((n != null) && !guard) {
                return slice.call(array, Math.max(array.length - n, 0));
            } else {
                return array[array.length - 1];
            }
        };

        // Returns everything but the first entry of the array. Aliased as `tail`.
        // Especially useful on the arguments object. Passing an **index** will return
        // the rest of the values in the array from that index onward. The **guard**
        // check allows it to work with `_.map`.
        _.rest = _.tail = function(array, index, guard) {
            return slice.call(array, (index == null) || guard ? 1 : index);
        };

        // Trim out all falsy values from an array.
        _.compact = function(array) {
            return _.filter(array, function(value) {
                return !!value;
            });
        };

        // Internal implementation of a recursive `flatten` function.
        var flatten = function(input, shallow, output) {
            each(input, function(value) {
                if (_.isArray(value)) {
                    shallow ? push.apply(output, value) : flatten(value, shallow, output);
                } else {
                    output.push(value);
                }
            });
            return output;
        };

        // Return a completely flattened version of an array.
        _.flatten = function(array, shallow) {
            return flatten(array, shallow, []);
        };

        // Return a version of the array that does not contain the specified value(s).
        _.without = function(array) {
            return _.difference(array, slice.call(arguments, 1));
        };

        // Produce a duplicate-free version of the array. If the array has already
        // been sorted, you have the option of using a faster algorithm.
        // Aliased as `unique`.
        _.uniq = _.unique = function(array, isSorted, iterator) {
            var initial = iterator ? _.map(array, iterator) : array;
            var results = [];
            _.reduce(initial, function(memo, value, index) {
                if (isSorted ? (_.last(memo) !== value || !memo.length) : !_.include(memo, value)) {
                    memo.push(value);
                    results.push(array[index]);
                }
                return memo;
            }, []);
            return results;
        };

        // Produce an array that contains the union: each distinct element from all of
        // the passed-in arrays.
        _.union = function() {
            return _.uniq(flatten(arguments, true, []));
        };

        // Produce an array that contains every item shared between all the
        // passed-in arrays.
        _.intersection = function(array) {
            var rest = slice.call(arguments, 1);
            return _.filter(_.uniq(array), function(item) {
                return _.every(rest, function(other) {
                    return _.indexOf(other, item) >= 0;
                });
            });
        };

        // Take the difference between one array and a number of other arrays.
        // Only the elements present in just the first array will remain.
        _.difference = function(array) {
            var rest = flatten(slice.call(arguments, 1), true, []);
            return _.filter(array, function(value) {
                return !_.include(rest, value);
            });
        };

        // Zip together multiple lists into a single array -- elements that share
        // an index go together.
        _.zip = function() {
            var args = slice.call(arguments);
            var length = _.max(_.pluck(args, 'length'));
            var results = new Array(length);
            for (var i = 0; i < length; i++) {
                results[i] = _.pluck(args, "" + i);
            }
            return results;
        };

        // Zip together two arrays -- an array of keys and an array of values -- into
        // a single object.
        _.zipObject = function(keys, values) {
            var result = {};
            for (var i = 0, l = keys.length; i < l; i++) {
                result[keys[i]] = values[i];
            }
            return result;
        };

        // If the browser doesn't supply us with indexOf (I'm looking at you, **MSIE**),
        // we need this function. Return the position of the first occurrence of an
        // item in an array, or -1 if the item is not included in the array.
        // Delegates to **ECMAScript 5**'s native `indexOf` if available.
        // If the array is large and already in sort order, pass `true`
        // for **isSorted** to use binary search.
        _.indexOf = function(array, item, isSorted) {
            if (array == null)
                return -1;
            var i, l;
            if (isSorted) {
                i = _.sortedIndex(array, item);
                return array[i] === item ? i : -1;
            }
            if (nativeIndexOf && array.indexOf === nativeIndexOf)
                return array.indexOf(item);
            for (i = 0, l = array.length; i < l; i++)
                if (array[i] === item)
                    return i;
            return -1;
        };

        // Delegates to **ECMAScript 5**'s native `lastIndexOf` if available.
        _.lastIndexOf = function(array, item) {
            if (array == null)
                return -1;
            if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf)
                return array.lastIndexOf(item);
            var i = array.length;
            while (i--)
                if (array[i] === item)
                    return i;
            return -1;
        };

        // Generate an integer Array containing an arithmetic progression. A port of
        // the native Python `range()` function. See
        // [the Python documentation](http://docs.python.org/library/functions.html#range).
        _.range = function(start, stop, step) {
            if (arguments.length <= 1) {
                stop = start || 0;
                start = 0;
            }
            step = arguments[2] || 1;

            var len = Math.max(Math.ceil((stop - start) / step), 0);
            var idx = 0;
            var range = new Array(len);

            while (idx < len) {
                range[idx++] = start;
                start += step;
            }

            return range;
        };

        // Function (ahem) Functions
        // ------------------

        // Reusable constructor function for prototype setting.
        var ctor = function() {
        };

        // Create a function bound to a given object (assigning `this`, and arguments,
        // optionally). Binding with arguments is also known as `curry`.
        // Delegates to **ECMAScript 5**'s native `Function.bind` if available.
        // We check for `func.bind` first, to fail fast when `func` is undefined.
        _.bind = function bind(func, context) {
            var bound, args;
            if (func.bind === nativeBind && nativeBind)
                return nativeBind.apply(func, slice.call(arguments, 1));
            if (!_.isFunction(func))
                throw new TypeError;
            args = slice.call(arguments, 2);
            return bound = function() {
                if (!(this instanceof bound))
                    return func.apply(context, args.concat(slice.call(arguments)));
                ctor.prototype = func.prototype;
                var self = new ctor;
                var result = func.apply(self, args.concat(slice.call(arguments)));
                if (Object(result) === result)
                    return result;
                return self;
            };
        };

        // Bind all of an object's methods to that object. Useful for ensuring that
        // all callbacks defined on an object belong to it.
        _.bindAll = function(obj) {
            var funcs = slice.call(arguments, 1);
            if (funcs.length == 0)
                funcs = _.functions(obj);
            each(funcs, function(f) {
                obj[f] = _.bind(obj[f], obj);
            });
            return obj;
        };

        // Memoize an expensive function by storing its results.
        _.memoize = function(func, hasher) {
            var memo = {};
            hasher || (hasher = _.identity);
            return function() {
                var key = hasher.apply(this, arguments);
                return _.has(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));
            };
        };

        // Delays a function for the given number of milliseconds, and then calls
        // it with the arguments supplied.
        _.delay = function(func, wait) {
            var args = slice.call(arguments, 2);
            return setTimeout(function() {
                return func.apply(null, args);
            }, wait);
        };

        // Defers a function, scheduling it to run after the current call stack has
        // cleared.
        _.defer = function(func) {
            return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
        };

        // Returns a function, that, when invoked, will only be triggered at most once
        // during a given window of time.
        _.throttle = function(func, wait) {
            var context, args, timeout, throttling, more, result;
            var whenDone = _.debounce(function() {
                more = throttling = false;
            }, wait);
            return function() {
                context = this;
                args = arguments;
                var later = function() {
                    timeout = null;
                    if (more)
                        func.apply(context, args);
                    whenDone();
                };
                if (!timeout)
                    timeout = setTimeout(later, wait);
                if (throttling) {
                    more = true;
                } else {
                    throttling = true;
                    result = func.apply(context, args);
                }
                whenDone();
                return result;
            };
        };

        // Returns a function, that, as long as it continues to be invoked, will not
        // be triggered. The function will be called after it stops being called for
        // N milliseconds. If `immediate` is passed, trigger the function on the
        // leading edge, instead of the trailing.
        _.debounce = function(func, wait, immediate) {
            var timeout;
            return function() {
                var context = this, args = arguments;
                var later = function() {
                    timeout = null;
                    if (!immediate)
                        func.apply(context, args);
                };
                var callNow = immediate && !timeout;
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
                if (callNow)
                    func.apply(context, args);
            };
        };

        // Returns a function that will be executed at most one time, no matter how
        // often you call it. Useful for lazy initialization.
        _.once = function(func) {
            var ran = false, memo;
            return function() {
                if (ran)
                    return memo;
                ran = true;
                return memo = func.apply(this, arguments);
            };
        };

        // Returns the first function passed as an argument to the second,
        // allowing you to adjust arguments, run code before and after, and
        // conditionally execute the original function.
        _.wrap = function(func, wrapper) {
            return function() {
                var args = [func].concat(slice.call(arguments, 0));
                return wrapper.apply(this, args);
            };
        };

        // Returns a function that is the composition of a list of functions, each
        // consuming the return value of the function that follows.
        _.compose = function() {
            var funcs = arguments;
            return function() {
                var args = arguments;
                for (var i = funcs.length - 1; i >= 0; i--) {
                    args = [funcs[i].apply(this, args)];
                }
                return args[0];
            };
        };

        // Returns a function that will only be executed after being called N times.
        _.after = function(times, func) {
            if (times <= 0)
                return func();
            return function() {
                if (--times < 1) {
                    return func.apply(this, arguments);
                }
            };
        };

        // Object Functions
        // ----------------

        // Retrieve the names of an object's properties.
        // Delegates to **ECMAScript 5**'s native `Object.keys`
        _.keys = nativeKeys ||
                function(obj) {
                    if (obj !== Object(obj))
                        throw new TypeError('Invalid object');
                    var keys = [];
                    for (var key in obj)
                        if (_.has(obj, key))
                            keys[keys.length] = key;
                    return keys;
                };

        // Retrieve the values of an object's properties.
        _.values = function(obj) {
            return _.map(obj, _.identity);
        };

        // Return a sorted list of the function names available on the object.
        // Aliased as `methods`
        _.functions = _.methods = function(obj) {
            var names = [];
            for (var key in obj) {
                if (_.isFunction(obj[key]))
                    names.push(key);
            }
            return names.sort();
        };

        // Extend a given object with all the properties in passed-in object(s).
        _.extend = function(obj) {
            each(slice.call(arguments, 1), function(source) {
                for (var prop in source) {
                    obj[prop] = source[prop];
                }
            });
            return obj;
        };

        // Return a copy of the object only containing the whitelisted properties.
        _.pick = function(obj) {
            var result = {};
            each(flatten(slice.call(arguments, 1), true, []), function(key) {
                if (key in obj)
                    result[key] = obj[key];
            });
            return result;
        };

        // Fill in a given object with default properties.
        _.defaults = function(obj) {
            each(slice.call(arguments, 1), function(source) {
                for (var prop in source) {
                    if (obj[prop] == null)
                        obj[prop] = source[prop];
                }
            });
            return obj;
        };

        // Create a (shallow-cloned) duplicate of an object.
        _.clone = function(obj) {
            if (!_.isObject(obj))
                return obj;
            return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
        };

        // Invokes interceptor with the obj, and then returns obj.
        // The primary purpose of this method is to "tap into" a method chain, in
        // order to perform operations on intermediate results within the chain.
        _.tap = function(obj, interceptor) {
            interceptor(obj);
            return obj;
        };

        // Internal recursive comparison function for `isEqual`.
        var eq = function(a, b, stack) {
            // Identical objects are equal. `0 === -0`, but they aren't identical.
            // See the Harmony `egal` proposal: http://wiki.ecmascript.org/doku.php?id=harmony:egal.
            if (a === b)
                return a !== 0 || 1 / a == 1 / b;
            // A strict comparison is necessary because `null == undefined`.
            if (a == null || b == null)
                return a === b;
            // Unwrap any wrapped objects.
            if (a._chain)
                a = a._wrapped;
            if (b._chain)
                b = b._wrapped;
            // Invoke a custom `isEqual` method if one is provided.
            if (a.isEqual && _.isFunction(a.isEqual))
                return a.isEqual(b);
            if (b.isEqual && _.isFunction(b.isEqual))
                return b.isEqual(a);
            // Compare `[[Class]]` names.
            var className = toString.call(a);
            if (className != toString.call(b))
                return false;
            switch (className) {
                // Strings, numbers, dates, and booleans are compared by value.
                case '[object String]':
                    // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
                    // equivalent to `new String("5")`.
                    return a == String(b);
                case '[object Number]':
                    // `NaN`s are equivalent, but non-reflexive. An `egal` comparison is performed for
                    // other numeric values.
                    return a != +a ? b != +b : (a == 0 ? 1 / a == 1 / b : a == +b);
                case '[object Date]':
                case '[object Boolean]':
                    // Coerce dates and booleans to numeric primitive values. Dates are compared by their
                    // millisecond representations. Note that invalid dates with millisecond representations
                    // of `NaN` are not equivalent.
                    return +a == +b;
                    // RegExps are compared by their source patterns and flags.
                case '[object RegExp]':
                    return a.source == b.source && a.global == b.global && a.multiline == b.multiline && a.ignoreCase == b.ignoreCase;
            }
            if (typeof a != 'object' || typeof b != 'object')
                return false;
            // Assume equality for cyclic structures. The algorithm for detecting cyclic
            // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
            var length = stack.length;
            while (length--) {
                // Linear search. Performance is inversely proportional to the number of
                // unique nested structures.
                if (stack[length] == a)
                    return true;
            }
            // Add the first object to the stack of traversed objects.
            stack.push(a);
            var size = 0, result = true;
            // Recursively compare objects and arrays.
            if (className == '[object Array]') {
                // Compare array lengths to determine if a deep comparison is necessary.
                size = a.length;
                result = size == b.length;
                if (result) {
                    // Deep compare the contents, ignoring non-numeric properties.
                    while (size--) {
                        // Ensure commutative equality for sparse arrays.
                        if (!(result = size in a == size in b && eq(a[size], b[size], stack)))
                            break;
                    }
                }
            } else {
                // Objects with different constructors are not equivalent.
                if ('constructor' in a != 'constructor' in b || a.constructor != b.constructor)
                    return false;
                // Deep compare objects.
                for (var key in a) {
                    if (_.has(a, key)) {
                        // Count the expected number of properties.
                        size++;
                        // Deep compare each member.
                        if (!(result = _.has(b, key) && eq(a[key], b[key], stack)))
                            break;
                    }
                }
                // Ensure that both objects contain the same number of properties.
                if (result) {
                    for (key in b) {
                        if (_.has(b, key) && !(size--))
                            break;
                    }
                    result = !size;
                }
            }
            // Remove the first object from the stack of traversed objects.
            stack.pop();
            return result;
        };

        // Perform a deep comparison to check if two objects are equal.
        _.isEqual = function(a, b) {
            return eq(a, b, []);
        };

        // Is a given array, string, or object empty?
        // An "empty" object has no enumerable own-properties.
        _.isEmpty = function(obj) {
            if (obj == null)
                return true;
            if (_.isArray(obj) || _.isString(obj))
                return obj.length === 0;
            for (var key in obj)
                if (_.has(obj, key))
                    return false;
            return true;
        };

        // Is a given value a DOM element?
        _.isElement = function(obj) {
            return !!(obj && obj.nodeType == 1);
        };

        // Is a given value an array?
        // Delegates to ECMA5's native Array.isArray
        _.isArray = nativeIsArray ||
                function(obj) {
                    return toString.call(obj) == '[object Array]';
                };

        // Is a given variable an object?
        _.isObject = function(obj) {
            return obj === Object(obj);
        };

        // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp.
        each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'], function(name) {
            _['is' + name] = function(obj) {
                return toString.call(obj) == '[object ' + name + ']';
            };
        });

        // Define a fallback version of the method in browsers (ahem, IE), where
        // there isn't any inspectable "Arguments" type.
        if (!_.isArguments(arguments)) {
            _.isArguments = function(obj) {
                return !!(obj && _.has(obj, 'callee'));
            };
        }

        // Is a given object a finite number?
        _.isFinite = function(obj) {
            return _.isNumber(obj) && isFinite(obj);
        };

        // Is the given value `NaN`?
        _.isNaN = function(obj) {
            // `NaN` is the only value for which `===` is not reflexive.
            return obj !== obj;
        };

        // Is a given value a boolean?
        _.isBoolean = function(obj) {
            return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
        };

        // Is a given value equal to null?
        _.isNull = function(obj) {
            return obj === null;
        };

        // Is a given variable undefined?
        _.isUndefined = function(obj) {
            return obj ===
                    void 0;
        };

        // Shortcut function for checking if an object has a given property directly
        // on itself (in other words, not on a prototype).
        _.has = function(obj, key) {
            return hasOwnProperty.call(obj, key);
        };

        // Utility Functions
        // -----------------

        // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
        // previous owner. Returns a reference to the Underscore object.
        _.noConflict = function() {
            root._ = previousUnderscore;
            return this;
        };

        // Keep the identity function around for default iterators.
        _.identity = function(value) {
            return value;
        };

        // Run a function **n** times.
        _.times = function(n, iterator, context) {
            for (var i = 0; i < n; i++)
                iterator.call(context, i);
        };

        // List of HTML entities for escaping.
        var htmlEscapes = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#x27;',
            '/': '&#x2F;'
        };

        // Regex containing the keys listed immediately above.
        var htmlEscaper = /[&<>"'\/]/g;

        // Escape a string for HTML interpolation.
        _.escape = function(string) {
            return ('' + string).replace(htmlEscaper, function(match) {
                return htmlEscapes[match];
            });
        };

        // If the value of the named property is a function then invoke it;
        // otherwise, return it.
        _.result = function(object, property) {
            if (object == null)
                return null;
            var value = object[property];
            return _.isFunction(value) ? value.call(object) : value;
        };

        // Add your own custom functions to the Underscore object, ensuring that
        // they're correctly added to the OOP wrapper as well.
        _.mixin = function(obj) {
            each(_.functions(obj), function(name) {
                addToWrapper(name, _[name] = obj[name]);
            });
        };

        // Generate a unique integer id (unique within the entire client session).
        // Useful for temporary DOM ids.
        var idCounter = 0;
        _.uniqueId = function(prefix) {
            var id = idCounter++;
            return prefix ? prefix + id : id;
        };

        // By default, Underscore uses ERB-style template delimiters, change the
        // following template settings to use alternative delimiters.
        _.templateSettings = {
            evaluate: /<%([\s\S]+?)%>/g,
            interpolate: /<%=([\s\S]+?)%>/g,
            escape: /<%-([\s\S]+?)%>/g
        };

        // When customizing `templateSettings`, if you don't want to define an
        // interpolation, evaluation or escaping regex, we need one that is
        // guaranteed not to match.
        var noMatch = /.^/;

        // Certain characters need to be escaped so that they can be put into a
        // string literal.
        var escapes = {
            '\\': '\\',
            "'": "'",
            r: '\r',
            n: '\n',
            t: '\t',
            u2028: '\u2028',
            u2029: '\u2029'
        };

        for (var key in escapes)
            escapes[escapes[key]] = key;
        var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;
        var unescaper = /\\(\\|'|r|n|t|u2028|u2029)/g;

        // Within an interpolation, evaluation, or escaping, remove HTML escaping
        // that had been previously added.
        var unescape = function(code) {
            return code.replace(unescaper, function(match, escape) {
                return escapes[escape];
            });
        };

        // JavaScript micro-templating, similar to John Resig's implementation.
        // Underscore templating handles arbitrary delimiters, preserves whitespace,
        // and correctly escapes quotes within interpolated code.
        _.template = function(text, data, settings) {
            settings = _.defaults(settings || {}, _.templateSettings);

            // Compile the template source, taking care to escape characters that
            // cannot be included in a string literal and then unescape them in code
            // blocks.
            var source = "__p+='" + text.replace(escaper, function(match) {
                return '\\' + escapes[match];
            }).replace(settings.escape || noMatch, function(match, code) {
                return "'+\n((__t=(" + unescape(code) + "))==null?'':_.escape(__t))+\n'";
            }).replace(settings.interpolate || noMatch, function(match, code) {
                return "'+\n((__t=(" + unescape(code) + "))==null?'':__t)+\n'";
            }).replace(settings.evaluate || noMatch, function(match, code) {
                return "';\n" + unescape(code) + "\n__p+='";
            }) + "';\n";

            // If a variable is not specified, place data values in local scope.
            if (!settings.variable)
                source = 'with(obj||{}){\n' + source + '}\n';

            source = "var __t,__p='',__j=Array.prototype.join," + "print=function(){__p+=__j.call(arguments,'')};\n" + source + "return __p;\n";

            var render = new Function(settings.variable || 'obj', '_', source);
            if (data)
                return render(data, _);
            var template = function(data) {
                return render.call(this, data, _);
            };

            // Provide the compiled function source as a convenience for precompilation.
            template.source = 'function(' + (settings.variable || 'obj') + '){\n' + source + '}';

            return template;
        };

        // Add a "chain" function, which will delegate to the wrapper.
        _.chain = function(obj) {
            return _(obj).chain();
        };

        // The OOP Wrapper
        // ---------------

        // If Underscore is called as a function, it returns a wrapped object that
        // can be used OO-style. This wrapper holds altered versions of all the
        // underscore functions. Wrapped objects may be chained.
        var wrapper = function(obj) {
            this._wrapped = obj;
        };

        // Expose `wrapper.prototype` as `_.prototype`
        _.prototype = wrapper.prototype;

        // Helper function to continue chaining intermediate results.
        var result = function(obj, chain) {
            return chain ? _(obj).chain() : obj;
        };

        // A method to easily add functions to the OOP wrapper.
        var addToWrapper = function(name, func) {
            wrapper.prototype[name] = function() {
                var args = slice.call(arguments);
                unshift.call(args, this._wrapped);
                return result(func.apply(_, args), this._chain);
            };
        };

        // Add all of the Underscore functions to the wrapper object.
        _.mixin(_);

        // Add all mutator Array functions to the wrapper.
        each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
            var method = ArrayProto[name];
            wrapper.prototype[name] = function() {
                var obj = this._wrapped;
                method.apply(obj, arguments);
                if ((name == 'shift' || name == 'splice') && obj.length === 0)
                    delete obj[0];
                return result(obj, this._chain);
            };
        });

        // Add all accessor Array functions to the wrapper.
        each(['concat', 'join', 'slice'], function(name) {
            var method = ArrayProto[name];
            wrapper.prototype[name] = function() {
                return result(method.apply(this._wrapped, arguments), this._chain);
            };
        });

        // Start chaining a wrapped Underscore object.
        wrapper.prototype.chain = function() {
            this._chain = true;
            return this;
        };

        // Extracts the result from a wrapped and chained object.
        wrapper.prototype.value = function() {
            return this._wrapped;
        };

    }).call(this);

});

require.register("noflo-noflo/src/lib/Graph.js", function(exports, require, module) {
    var EventEmitter, Graph, clone, platform, __hasProp = {}.hasOwnProperty, __extends = function(child, parent) {
        for (var key in parent) {
            if (__hasProp.call(parent, key))
                child[key] = parent[key];
        }
        function ctor() {
            this.constructor = child;
        }


        ctor.prototype = parent.prototype;
        child.prototype = new ctor();
        child.__super__ = parent.prototype;
        return child;
    };

    EventEmitter = require('events').EventEmitter;

    clone = require('./Utils').clone;

    platform = require('./Platform');

    Graph = (function(_super) {
        __extends(Graph, _super);

        Graph.prototype.name = '';

        Graph.prototype.properties = {};

        Graph.prototype.nodes = [];

        Graph.prototype.edges = [];

        Graph.prototype.initializers = [];

        Graph.prototype.exports = [];

        Graph.prototype.inports = {};

        Graph.prototype.outports = {};

        Graph.prototype.groups = [];

        function Graph(name) {
            this.name = name != null ? name : '';
            this.properties = {};
            this.nodes = [];
            this.edges = [];
            this.initializers = [];
            this.exports = [];
            this.inports = {};
            this.outports = {};
            this.groups = [];
            this.transaction = {
                id: null,
                depth: 0
            };
        }


        Graph.prototype.startTransaction = function(id, metadata) {
            if (this.transaction.id) {
                throw Error("Nested transactions not supported");
            }
            this.transaction.id = id;
            this.transaction.depth = 1;
            return this.emit('startTransaction', id, metadata);
        };

        Graph.prototype.endTransaction = function(id, metadata) {
            if (!this.transaction.id) {
                throw Error("Attempted to end non-existing transaction");
            }
            this.transaction.id = null;
            this.transaction.depth = 0;
            return this.emit('endTransaction', id, metadata);
        };

        Graph.prototype.checkTransactionStart = function() {
            if (!this.transaction.id) {
                return this.startTransaction('implicit');
            } else if (this.transaction.id === 'implicit') {
                return this.transaction.depth += 1;
            }
        };

        Graph.prototype.checkTransactionEnd = function() {
            if (this.transaction.id === 'implicit') {
                this.transaction.depth -= 1;
            }
            if (this.transaction.depth === 0) {
                return this.endTransaction('implicit');
            }
        };

        Graph.prototype.setProperties = function(properties) {
            var before, item, val;
            this.checkTransactionStart();
            before = clone(this.properties);
            for (item in properties) {
                val = properties[item];
                this.properties[item] = val;
            }
            this.emit('changeProperties', this.properties, before);
            return this.checkTransactionEnd();
        };

        Graph.prototype.addExport = function(publicPort, nodeKey, portKey, metadata) {
            var exported;
            if (metadata == null) {
                metadata = {
                    x: 0,
                    y: 0
                };
            }
            if (!this.getNode(nodeKey)) {
                return;
            }
            this.checkTransactionStart();
            exported = {
                "public": publicPort,
                process: nodeKey,
                port: portKey,
                metadata: metadata
            };
            this.exports.push(exported);
            this.emit('addExport', exported);
            return this.checkTransactionEnd();
        };

        Graph.prototype.removeExport = function(publicPort) {
            var exported, found, idx, _i, _len, _ref;
            publicPort = publicPort.toLowerCase();
            found = null;
            _ref = this.exports;
            for (idx = _i = 0, _len = _ref.length; _i < _len; idx = ++_i) {
                exported = _ref[idx];
                if (exported["public"] === publicPort) {
                    found = exported;
                }
            }
            if (!found) {
                return;
            }
            this.checkTransactionStart();
            this.exports.splice(this.exports.indexOf(found), 1);
            this.emit('removeExport', found);
            return this.checkTransactionEnd();
        };

        Graph.prototype.addInport = function(publicPort, nodeKey, portKey, metadata) {
            if (!this.getNode(nodeKey)) {
                return;
            }
            this.checkTransactionStart();
            this.inports[publicPort] = {
                process: nodeKey,
                port: portKey,
                metadata: metadata
            };
            this.emit('addInport', publicPort, this.inports[publicPort]);
            return this.checkTransactionEnd();
        };

        Graph.prototype.removeInport = function(publicPort) {
            var port;
            publicPort = publicPort.toLowerCase();
            if (!this.inports[publicPort]) {
                return;
            }
            this.checkTransactionStart();
            port = this.inports[publicPort];
            this.setInportMetadata(publicPort, {});
            delete this.inports[publicPort];
            this.emit('removeInport', publicPort, port);
            return this.checkTransactionEnd();
        };

        Graph.prototype.renameInport = function(oldPort, newPort) {
            if (!this.inports[oldPort]) {
                return;
            }
            this.checkTransactionStart();
            this.inports[newPort] = this.inports[oldPort];
            delete this.inports[oldPort];
            this.emit('renameInport', oldPort, newPort);
            return this.checkTransactionEnd();
        };

        Graph.prototype.setInportMetadata = function(publicPort, metadata) {
            var before, item, val;
            if (!this.inports[publicPort]) {
                return;
            }
            this.checkTransactionStart();
            before = clone(this.inports[publicPort].metadata);
            if (!this.inports[publicPort].metadata) {
                this.inports[publicPort].metadata = {};
            }
            for (item in metadata) {
                val = metadata[item];
                if (val != null) {
                    this.inports[publicPort].metadata[item] = val;
                } else {
                    delete this.inports[publicPort].metadata[item];
                }
            }
            this.emit('changeInport', publicPort, this.inports[publicPort], before);
            return this.checkTransactionEnd();
        };

        Graph.prototype.addOutport = function(publicPort, nodeKey, portKey, metadata) {
            if (!this.getNode(nodeKey)) {
                return;
            }
            this.checkTransactionStart();
            this.outports[publicPort] = {
                process: nodeKey,
                port: portKey,
                metadata: metadata
            };
            this.emit('addOutport', publicPort, this.outports[publicPort]);
            return this.checkTransactionEnd();
        };

        Graph.prototype.removeOutport = function(publicPort) {
            var port;
            publicPort = publicPort.toLowerCase();
            if (!this.outports[publicPort]) {
                return;
            }
            this.checkTransactionStart();
            port = this.outports[publicPort];
            this.setOutportMetadata(publicPort, {});
            delete this.outports[publicPort];
            this.emit('removeOutport', publicPort, port);
            return this.checkTransactionEnd();
        };

        Graph.prototype.renameOutport = function(oldPort, newPort) {
            if (!this.outports[oldPort]) {
                return;
            }
            this.checkTransactionStart();
            this.outports[newPort] = this.outports[oldPort];
            delete this.outports[oldPort];
            this.emit('renameOutport', oldPort, newPort);
            return this.checkTransactionEnd();
        };

        Graph.prototype.setOutportMetadata = function(publicPort, metadata) {
            var before, item, val;
            if (!this.outports[publicPort]) {
                return;
            }
            this.checkTransactionStart();
            before = clone(this.outports[publicPort].metadata);
            if (!this.outports[publicPort].metadata) {
                this.outports[publicPort].metadata = {};
            }
            for (item in metadata) {
                val = metadata[item];
                if (val != null) {
                    this.outports[publicPort].metadata[item] = val;
                } else {
                    delete this.outports[publicPort].metadata[item];
                }
            }
            this.emit('changeOutport', publicPort, this.outports[publicPort], before);
            return this.checkTransactionEnd();
        };

        Graph.prototype.addGroup = function(group, nodes, metadata) {
            var g;
            this.checkTransactionStart();
            g = {
                name: group,
                nodes: nodes,
                metadata: metadata
            };
            this.groups.push(g);
            this.emit('addGroup', g);
            return this.checkTransactionEnd();
        };

        Graph.prototype.renameGroup = function(oldName, newName) {
            var group, _i, _len, _ref;
            this.checkTransactionStart();
            _ref = this.groups;
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                group = _ref[_i];
                if (!group) {
                    continue;
                }
                if (group.name !== oldName) {
                    continue;
                }
                group.name = newName;
                this.emit('renameGroup', oldName, newName);
            }
            return this.checkTransactionEnd();
        };

        Graph.prototype.removeGroup = function(groupName) {
            var group, _i, _len, _ref;
            this.checkTransactionStart();
            _ref = this.groups;
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                group = _ref[_i];
                if (!group) {
                    continue;
                }
                if (group.name !== groupName) {
                    continue;
                }
                this.setGroupMetadata(group.name, {});
                this.groups.splice(this.groups.indexOf(group), 1);
                this.emit('removeGroup', group);
            }
            return this.checkTransactionEnd();
        };

        Graph.prototype.setGroupMetadata = function(groupName, metadata) {
            var before, group, item, val, _i, _len, _ref;
            this.checkTransactionStart();
            _ref = this.groups;
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                group = _ref[_i];
                if (!group) {
                    continue;
                }
                if (group.name !== groupName) {
                    continue;
                }
                before = clone(group.metadata);
                for (item in metadata) {
                    val = metadata[item];
                    if (val != null) {
                        group.metadata[item] = val;
                    } else {
                        delete group.metadata[item];
                    }
                }
                this.emit('changeGroup', group, before);
            }
            return this.checkTransactionEnd();
        };

        Graph.prototype.addNode = function(id, component, metadata) {
            var node;
            this.checkTransactionStart();
            if (!metadata) {
                metadata = {};
            }
            node = {
                id: id,
                component: component,
                metadata: metadata
            };
            this.nodes.push(node);
            this.emit('addNode', node);
            this.checkTransactionEnd();
            return node;
        };

        Graph.prototype.removeNode = function(id) {
            var edge, exported, group, index, initializer, node, priv, pub, toRemove, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _len5, _len6, _len7, _len8, _m, _n, _o, _p, _q, _ref, _ref1, _ref2, _ref3, _ref4, _ref5;
            node = this.getNode(id);
            if (!node) {
                return;
            }
            this.checkTransactionStart();
            toRemove = [];
            _ref = this.edges;
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                edge = _ref[_i];
                if ((edge.from.node === node.id) || (edge.to.node === node.id)) {
                    toRemove.push(edge);
                }
            }
            for (_j = 0, _len1 = toRemove.length; _j < _len1; _j++) {
                edge = toRemove[_j];
                this.removeEdge(edge.from.node, edge.from.port, edge.to.node, edge.to.port);
            }
            toRemove = [];
            _ref1 = this.initializers;
            for (_k = 0, _len2 = _ref1.length; _k < _len2; _k++) {
                initializer = _ref1[_k];
                if (initializer.to.node === node.id) {
                    toRemove.push(initializer);
                }
            }
            for (_l = 0, _len3 = toRemove.length; _l < _len3; _l++) {
                initializer = toRemove[_l];
                this.removeInitial(initializer.to.node, initializer.to.port);
            }
            toRemove = [];
            _ref2 = this.exports;
            for (_m = 0, _len4 = _ref2.length; _m < _len4; _m++) {
                exported = _ref2[_m];
                if (id.toLowerCase() === exported.process) {
                    toRemove.push(exported);
                }
            }
            for (_n = 0, _len5 = toRemove.length; _n < _len5; _n++) {
                exported = toRemove[_n];
                this.removeExports(exported["public"]);
            }
            toRemove = [];
            _ref3 = this.inports;
            for (pub in _ref3) {
                priv = _ref3[pub];
                if (priv.process === id) {
                    toRemove.push(pub);
                }
            }
            for (_o = 0, _len6 = toRemove.length; _o < _len6; _o++) {
                pub = toRemove[_o];
                this.removeInport(pub);
            }
            toRemove = [];
            _ref4 = this.outports;
            for (pub in _ref4) {
                priv = _ref4[pub];
                if (priv.process === id) {
                    toRemove.push(pub);
                }
            }
            for (_p = 0, _len7 = toRemove.length; _p < _len7; _p++) {
                pub = toRemove[_p];
                this.removeOutport(pub);
            }
            _ref5 = this.groups;
            for (_q = 0, _len8 = _ref5.length; _q < _len8; _q++) {
                group = _ref5[_q];
                if (!group) {
                    continue;
                }
                index = group.nodes.indexOf(id);
                if (index === -1) {
                    continue;
                }
                group.nodes.splice(index, 1);
            }
            this.setNodeMetadata(id, {});
            if (-1 !== this.nodes.indexOf(node)) {
                this.nodes.splice(this.nodes.indexOf(node), 1);
            }
            this.emit('removeNode', node);
            return this.checkTransactionEnd();
        };

        Graph.prototype.getNode = function(id) {
            var node, _i, _len, _ref;
            _ref = this.nodes;
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                node = _ref[_i];
                if (!node) {
                    continue;
                }
                if (node.id === id) {
                    return node;
                }
            }
            return null;
        };

        Graph.prototype.renameNode = function(oldId, newId) {
            console.log("renameNode wtf wtf wtf wtf wtf wtf wtf wtf wtf wtf wtf wtf wtf wtf wtf wtf wtf");
            var edge, exported, group, iip, index, node, priv, pub, _i, _j, _k, _l, _len, _len1, _len2, _len3, _ref, _ref1, _ref2, _ref3, _ref4, _ref5;
            this.checkTransactionStart();
            node = this.getNode(oldId);
            if (!node) {
                return;
            }
            node.id = newId;
            _ref = this.edges;
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                edge = _ref[_i];
                if (!edge) {
                    continue;
                }
                if (edge.from.node === oldId) {
                    edge.from.node = newId;
                }
                if (edge.to.node === oldId) {
                    edge.to.node = newId;
                }
            }
            _ref1 = this.initializers;
            for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
                iip = _ref1[_j];
                if (!iip) {
                    continue;
                }
                if (iip.to.node === oldId) {
                    iip.to.node = newId;
                }
            }
            _ref2 = this.inports;
            for (pub in _ref2) {
                priv = _ref2[pub];
                if (priv.process === oldId) {
                    priv.process = newId;
                }
            }
            _ref3 = this.outports;
            for (pub in _ref3) {
                priv = _ref3[pub];
                if (priv.process === oldId) {
                    priv.process = newId;
                }
            }
            _ref4 = this.exports;
            for (_k = 0, _len2 = _ref4.length; _k < _len2; _k++) {
                exported = _ref4[_k];
                if (exported.process === oldId) {
                    exported.process = newId;
                }
            }
            _ref5 = this.groups;
            for (_l = 0, _len3 = _ref5.length; _l < _len3; _l++) {
                group = _ref5[_l];
                if (!group) {
                    continue;
                }
                index = group.nodes.indexOf(oldId);
                if (index === -1) {
                    continue;
                }
                group.nodes[index] = newId;
            }
            this.emit('renameNode', oldId, newId);
            return this.checkTransactionEnd();
        };

        Graph.prototype.setNodeMetadata = function(id, metadata) {
            var before, item, node, val;
            node = this.getNode(id);
            if (!node) {
                return;
            }
            this.checkTransactionStart();
            before = clone(node.metadata);
            if (!node.metadata) {
                node.metadata = {};
            }
            for (item in metadata) {
                val = metadata[item];
                if (val != null) {
                    node.metadata[item] = val;
                } else {
                    delete node.metadata[item];
                }
            }
//            console.log(metadata);
//            console.log(node.metadata);
            this.emit('changeNode', node, before);
            return this.checkTransactionEnd();
        };

        Graph.prototype.setNodeComponent = function(id, component) {
            var before, item, node, val;
            node = this.getNode(id);
            if (!node) {
                return;
            }
            this.checkTransactionStart();
            before = clone(node.component);
            if (!node.component) {
                node.component = {};
            }
            for (item in component) {
                val = component[item];
                if (val != null) {
                    node.component[item] = val;
                } else {
                    delete node.component[item];
                }
            }
            console.log("setNodeComponent finished");
            console.log(node);
            this.emit('changeNode', node, before);
            return this.checkTransactionEnd();
        };

        Graph.prototype.addNodeInport = function(id, portName, portType) {
            var node = this.getNode(id);
            if (!node) {
                return;
            }

            console.log(node);
            var newComponent = clone(node.component);
            var inport = {
                'name': portName,
                'type': portType
            };

            var name = inport.name;
            var resolved = false;

            var trailingNumber = 0;
            while (resolved == false) {
                var foundSameName = false;
                for (var j = 0; j < newComponent.inports.length; j++) {
                    if (newComponent.inports[j].name == name) {
                        trailingNumber++;
                        name = inport.name + '_' + trailingNumber;
                        foundSameName = true;
                    }
                }
                if (foundSameName == false) {
                    resolved = true;
                }
            }
            inport.name = name;

            newComponent.inports.push(inport);
            return this.setNodeComponent(id, newComponent);
        };

        Graph.prototype.addNodeOutport = function(id, portName, portType) {
            var node = this.getNode(id);
            if (!node) {
                return;
            }
            var newComponent = clone(node.component);
            var outport = {
                'name': portName,
                'type': portType
            };

            var name = outport.name;
            var resolved = false;

            var trailingNumber = 0;
            while (resolved == false) {
                var foundSameName = false;
                for (var j = 0; j < newComponent.outports.length; j++) {
                    if (newComponent.outports[j].name == name) {
                        trailingNumber++;
                        name = outport.name + '_' + trailingNumber;
                        foundSameName = true;
                    }
                }
                if (foundSameName == false) {
                    resolved = true;
                }
            }
            outport.name = name;

            newComponent.outports.push(outport);
            return this.setNodeComponent(id, newComponent);
        };

        Graph.prototype.addEdge = function(outNode, outPort, inNode, inPort, metadata) {
            var edge, _i, _len, _ref;
            if (metadata == null) {
                metadata = {};
            }
            _ref = this.edges;
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                edge = _ref[_i];
                if (edge.from.node === outNode && edge.from.port === outPort && edge.to.node === inNode && edge.to.port === inPort) {
                    return;
                }
            }
            if (!this.getNode(outNode)) {
                return;
            }
            if (!this.getNode(inNode)) {
                return;
            }
            this.checkTransactionStart();
            edge = {
                from: {
                    node: outNode,
                    port: outPort
                },
                to: {
                    node: inNode,
                    port: inPort
                },
                metadata: metadata
            };
            console.log("addEdge:");
            console.log(edge);
            
            this.edges.push(edge);
            this.emit('addEdge', edge);
            this.checkTransactionEnd();
            return edge;
        };

        Graph.prototype.addEdgeIndex = function(outNode, outPort, outIndex, inNode, inPort, inIndex, metadata) {
            var edge;
            if (metadata == null) {
                metadata = {};
            }
            if (!this.getNode(outNode)) {
                return;
            }
            if (!this.getNode(inNode)) {
                return;
            }
            if (inIndex === null) {
                inIndex =
                        void 0;
            }
            if (outIndex === null) {
                outIndex =
                        void 0;
            }
            if (!metadata) {
                metadata = {};
            }
            this.checkTransactionStart();
            edge = {
                from: {
                    node: outNode,
                    port: outPort,
                    index: outIndex
                },
                to: {
                    node: inNode,
                    port: inPort,
                    index: inIndex
                },
                metadata: metadata
            };
            this.edges.push(edge);
            this.emit('addEdge', edge);
            this.checkTransactionEnd();
            return edge;
        };

        Graph.prototype.removeEdge = function(node, port, node2, port2) {
            var edge, index, toKeep, toRemove, _i, _j, _k, _len, _len1, _len2, _ref, _ref1;
            this.checkTransactionStart();
            toRemove = [];
            toKeep = [];
            if (node2 && port2) {
                _ref = this.edges;
                for (index = _i = 0, _len = _ref.length; _i < _len; index = ++_i) {
                    edge = _ref[index];
                    if (edge.from.node === node && edge.from.port === port && edge.to.node === node2 && edge.to.port === port2) {
                        this.setEdgeMetadata(edge.from.node, edge.from.port, edge.to.node, edge.to.port, {});
                        toRemove.push(edge);
                    } else {
                        toKeep.push(edge);
                    }
                }
            } else {
                _ref1 = this.edges;
                for (index = _j = 0, _len1 = _ref1.length; _j < _len1; index = ++_j) {
                    edge = _ref1[index];
                    if ((edge.from.node === node && edge.from.port === port) || (edge.to.node === node && edge.to.port === port)) {
                        this.setEdgeMetadata(edge.from.node, edge.from.port, edge.to.node, edge.to.port, {});
                        toRemove.push(edge);
                    } else {
                        toKeep.push(edge);
                    }
                }
            }
            this.edges = toKeep;
            for (_k = 0, _len2 = toRemove.length; _k < _len2; _k++) {
                edge = toRemove[_k];
                this.emit('removeEdge', edge);
            }
            return this.checkTransactionEnd();
        };

        Graph.prototype.getEdge = function(node, port, node2, port2) {
            var edge, index, _i, _len, _ref;
            _ref = this.edges;
            for (index = _i = 0, _len = _ref.length; _i < _len; index = ++_i) {
                edge = _ref[index];
                if (!edge) {
                    continue;
                }
                if (edge.from.node === node && edge.from.port === port) {
                    if (edge.to.node === node2 && edge.to.port === port2) {
                        return edge;
                    }
                }
            }
            return null;
        };

        Graph.prototype.setEdgeMetadata = function(node, port, node2, port2, metadata) {
            var before, edge, item, val;
            edge = this.getEdge(node, port, node2, port2);
            if (!edge) {
                return;
            }
            this.checkTransactionStart();
            before = clone(edge.metadata);
            if (!edge.metadata) {
                edge.metadata = {};
            }
            for (item in metadata) {
                val = metadata[item];
                if (val != null) {
                    edge.metadata[item] = val;
                } else {
                    delete edge.metadata[item];
                }
            }

            var getEdgeId = function(edge) {
                return (edge.from.node + '_' + edge.from.port + '_' + edge.to.node + '_' + edge.to.port).toLowerCase();
            };

            console.log(edge);
            console.log(getEdgeId(edge));

//            fmx.doc.flows.set(getEdgeId(edge), edge);

            this.emit('changeEdge', edge, before);
            return this.checkTransactionEnd();
        };

        Graph.prototype.addInitial = function(data, node, port, metadata) {
            var initializer;
            if (!this.getNode(node)) {
                return;
            }
            this.checkTransactionStart();
            initializer = {
                from: {
                    data: data
                },
                to: {
                    node: node,
                    port: port
                },
                metadata: metadata
            };
            this.initializers.push(initializer);
            this.emit('addInitial', initializer);
            this.checkTransactionEnd();
            return initializer;
        };

        Graph.prototype.addInitialIndex = function(data, node, port, index, metadata) {
            var initializer;
            if (!this.getNode(node)) {
                return;
            }
            if (index === null) {
                index =
                        void 0;
            }
            this.checkTransactionStart();
            initializer = {
                from: {
                    data: data
                },
                to: {
                    node: node,
                    port: port,
                    index: index
                },
                metadata: metadata
            };
            this.initializers.push(initializer);
            this.emit('addInitial', initializer);
            this.checkTransactionEnd();
            return initializer;
        };

        Graph.prototype.removeInitial = function(node, port) {
            var edge, index, toKeep, toRemove, _i, _j, _len, _len1, _ref;
            this.checkTransactionStart();
            toRemove = [];
            toKeep = [];
            _ref = this.initializers;
            for (index = _i = 0, _len = _ref.length; _i < _len; index = ++_i) {
                edge = _ref[index];
                if (edge.to.node === node && edge.to.port === port) {
                    toRemove.push(edge);
                } else {
                    toKeep.push(edge);
                }
            }
            this.initializers = toKeep;
            for (_j = 0, _len1 = toRemove.length; _j < _len1; _j++) {
                edge = toRemove[_j];
                this.emit('removeInitial', edge);
            }
            return this.checkTransactionEnd();
        };

        Graph.prototype.toDOT = function() {
            var cleanID, cleanPort, data, dot, edge, id, initializer, node, _i, _j, _k, _len, _len1, _len2, _ref, _ref1, _ref2;
            cleanID = function(id) {
                return id.replace(/\s*/g, "");
            };
            cleanPort = function(port) {
                return port.replace(/\./g, "");
            };
            dot = "digraph {\n";
            _ref = this.nodes;
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                node = _ref[_i];
                dot += "    " + (cleanID(node.id)) + " [label=" + node.id + " shape=box]\n";
            }
            _ref1 = this.initializers;
            for (id = _j = 0, _len1 = _ref1.length; _j < _len1; id = ++_j) {
                initializer = _ref1[id];
                if (typeof initializer.from.data === 'function') {
                    data = 'Function';
                } else {
                    data = initializer.from.data;
                }
                dot += "    data" + id + " [label=\"'" + data + "'\" shape=plaintext]\n";
                dot += "    data" + id + " -> " + (cleanID(initializer.to.node)) + "[headlabel=" + (cleanPort(initializer.to.port)) + " labelfontcolor=blue labelfontsize=8.0]\n";
            }
            _ref2 = this.edges;
            for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
                edge = _ref2[_k];
                dot += "    " + (cleanID(edge.from.node)) + " -> " + (cleanID(edge.to.node)) + "[taillabel=" + (cleanPort(edge.from.port)) + " headlabel=" + (cleanPort(edge.to.port)) + " labelfontcolor=blue labelfontsize=8.0]\n";
            }
            dot += "}";
            return dot;
        };

        Graph.prototype.toYUML = function() {
            var edge, initializer, yuml, _i, _j, _len, _len1, _ref, _ref1;
            yuml = [];
            _ref = this.initializers;
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                initializer = _ref[_i];
                yuml.push("(start)[" + initializer.to.port + "]->(" + initializer.to.node + ")");
            }
            _ref1 = this.edges;
            for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
                edge = _ref1[_j];
                yuml.push("(" + edge.from.node + ")[" + edge.from.port + "]->(" + edge.to.node + ")");
            }
            return yuml.join(",");
        };

        Graph.prototype.toJSON = function() {
            var connection, edge, exported, group, groupData, initializer, json, node, priv, property, pub, value, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _m, _ref, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7;
            json = {
                properties: {},
                inports: {},
                outports: {},
                groups: [],
                tasks: {},
                flows: []
            };
            if (this.name) {
                json.properties.name = this.name;
            }
            _ref = this.properties;
            for (property in _ref) {
                value = _ref[property];
                json.properties[property] = value;
            }
            _ref1 = this.inports;
            for (pub in _ref1) {
                priv = _ref1[pub];
                json.inports[pub] = priv;
            }
            _ref2 = this.outports;
            for (pub in _ref2) {
                priv = _ref2[pub];
                json.outports[pub] = priv;
            }
            _ref3 = this.exports;
            for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
                exported = _ref3[_i];
                if (!json.exports) {
                    json.exports = [];
                }
                json.exports.push(exported);
            }
            _ref4 = this.groups;
            for (_j = 0, _len1 = _ref4.length; _j < _len1; _j++) {
                group = _ref4[_j];
                groupData = {
                    name: group.name,
                    nodes: group.nodes
                };
                if (Object.keys(group.metadata).length) {
                    groupData.metadata = group.metadata;
                }
                json.groups.push(groupData);
            }
            _ref5 = this.nodes;
            for (_k = 0, _len2 = _ref5.length; _k < _len2; _k++) {
                node = _ref5[_k];
                json.tasks[node.id] = {
                    component: node.component
                };
                if (node.metadata) {
                    json.tasks[node.id].metadata = node.metadata;
                }
            }
            _ref6 = this.edges;
            for (_l = 0, _len3 = _ref6.length; _l < _len3; _l++) {
                edge = _ref6[_l];
                connection = {
                    from: {
                        process: edge.from.node,
                        port: edge.from.port,
                        index: edge.from.index
                    },
                    to: {
                        process: edge.to.node,
                        port: edge.to.port,
                        index: edge.to.index
                    }
                };
                if (Object.keys(edge.metadata).length) {
                    connection.metadata = edge.metadata;
                }
                json.flows.push(connection);
            }
            _ref7 = this.initializers;
            for (_m = 0, _len4 = _ref7.length; _m < _len4; _m++) {
                initializer = _ref7[_m];
                json.flows.push({
                    data: initializer.from.data,
                    to: {
                        process: initializer.to.node,
                        port: initializer.to.port,
                        index: initializer.to.index
                    }
                });
            }
            return json;
        };

        Graph.prototype.save = function(file, success) {
            var json;
            json = JSON.stringify(this.toJSON(), null, 4);
            return require('fs').writeFile("" + file + ".json", json, "utf-8", function(err, data) {
                if (err) {
                    throw err;
                }
                return success(file);
            });
        };

        return Graph;

    })(EventEmitter);

    exports.Graph = Graph;

    exports.createGraph = function(name) {
        return new Graph(name);
    };

    exports.loadJSON = function(definition, success, metadata) {
        var conn, def, exported, graph, group, id, portId, priv, processId, properties, property, pub, split, value, _i, _j, _k, _len, _len1, _len2, _ref, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6;
        if (metadata == null) {
            metadata = {};
        }
        if (!definition.properties) {
            definition.properties = {};
        }
        if (!definition.tasks) {
            definition.tasks = {};
        }
        if (!definition.flows) {
            definition.flows = [];
        }
        graph = new Graph(definition.properties.name);
        graph.startTransaction('loadJSON', metadata);
        properties = {};
        _ref = definition.properties;
        for (property in _ref) {
            value = _ref[property];
            if (property === 'name') {
                continue;
            }
            properties[property] = value;
        }
        graph.setProperties(properties);
        _ref1 = definition.tasks;
        for (id in _ref1) {
            def = _ref1[id];
            if (!def.metadata) {
                def.metadata = {};
            }
            graph.addNode(id, def.component, def.metadata);
        }
        _ref2 = definition.flows;
        for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
            conn = _ref2[_i];
            metadata = conn.metadata ? conn.metadata : {};
            if (conn.data !==
                    void 0) {
                if (typeof conn.to.index === 'number') {
                    graph.addInitialIndex(conn.data, conn.to.process, conn.to.port.toLowerCase(), conn.to.index, metadata);
                }
                graph.addInitial(conn.data, conn.to.process, conn.to.port.toLowerCase(), metadata);
                continue;
            }
            if (typeof conn.from.index === 'number' || typeof conn.to.index === 'number') {
                graph.addEdgeIndex(conn.from.process, conn.from.port.toLowerCase(), conn.from.index, conn.to.process, conn.to.port.toLowerCase(), conn.to.index, metadata);
                continue;
            }
            graph.addEdge(conn.from.process, conn.from.port.toLowerCase(), conn.to.process, conn.to.port.toLowerCase(), metadata);
        }
        if (definition.exports && definition.exports.length) {
            _ref3 = definition.exports;
            for (_j = 0, _len1 = _ref3.length; _j < _len1; _j++) {
                exported = _ref3[_j];
                if (exported["private"]) {
                    split = exported["private"].split('.');
                    if (split.length !== 2) {
                        continue;
                    }
                    processId = split[0];
                    portId = split[1];
                    for (id in definition.tasks) {
                        if (id.toLowerCase() === processId.toLowerCase()) {
                            processId = id;
                        }
                    }
                } else {
                    processId = exported.process;
                    portId = exported.port;
                }
                graph.addExport(exported["public"], processId, portId, exported.metadata);
            }
        }
        if (definition.inports) {
            _ref4 = definition.inports;
            for (pub in _ref4) {
                priv = _ref4[pub];
                graph.addInport(pub, priv.process, priv.port, priv.metadata);
            }
        }
        if (definition.outports) {
            _ref5 = definition.outports;
            for (pub in _ref5) {
                priv = _ref5[pub];
                graph.addOutport(pub, priv.process, priv.port, priv.metadata);
            }
        }
        if (definition.groups) {
            _ref6 = definition.groups;
            for (_k = 0, _len2 = _ref6.length; _k < _len2; _k++) {
                group = _ref6[_k];
                graph.addGroup(group.name, group.nodes, group.metadata || {});
            }
        }
        graph.endTransaction('loadJSON');
        return success(graph);
    };

    exports.loadFBP = function(fbpData, success) {
        var definition;
        definition = require('fbp').parse(fbpData);
        return exports.loadJSON(definition, success);
    };

    exports.loadHTTP = function(url, success) {
        var req;
        req = new XMLHttpRequest;
        req.onreadystatechange = function() {
            if (req.readyState !== 4) {
                return;
            }
            if (req.status !== 200) {
                return success();
            }
            return success(req.responseText);
        };
        req.open('GET', url, true);
        return req.send();
    };

    exports.loadFile = function(file, success, metadata) {
        var definition, e;
        if (metadata == null) {
            metadata = {};
        }
        if (platform.isBrowser()) {
            try {
                definition = require(file);
            } catch (_error) {
                e = _error;
                exports.loadHTTP(file, function(data) {
                    if (!data) {
                        throw new Error("Failed to load graph " + file);
                        return;
                    }
                    if (file.split('.').pop() === 'fbp') {
                        return exports.loadFBP(data, success, metadata);
                    }
                    definition = JSON.parse(data);
                    return exports.loadJSON(definition, success, metadata);
                });
                return;
            }
            exports.loadJSON(definition, success, metadata);
            return;
        }
        return require('fs').readFile(file, "utf-8", function(err, data) {
            if (err) {
                throw err;
            }
            if (file.split('.').pop() === 'fbp') {
                return exports.loadFBP(data, success);
            }
            definition = JSON.parse(data);
            return exports.loadJSON(definition, success);
        });
    };

});
require.register("noflo-noflo/src/lib/BasePort.js", function(exports, require, module) {
    var BasePort, EventEmitter, validTypes, __hasProp = {}.hasOwnProperty, __extends = function(child, parent) {
        for (var key in parent) {
            if (__hasProp.call(parent, key))
                child[key] = parent[key];
        }
        function ctor() {
            this.constructor = child;
        }


        ctor.prototype = parent.prototype;
        child.prototype = new ctor();
        child.__super__ = parent.prototype;
        return child;
    };

    EventEmitter = require('events').EventEmitter;

    validTypes = ['all', 'string', 'number', 'int', 'object', 'array', 'boolean', 'color', 'date', 'bang', 'function', 'buffer'];

    BasePort = (function(_super) {
        __extends(BasePort, _super);

        function BasePort(options) {
            this.handleOptions(options);
            this.sockets = [];
            this.node = null;
            this.name = null;
        }


        BasePort.prototype.handleOptions = function(options) {
            if (!options) {
                options = {};
            }
            if (!options.datatype) {
                options.datatype = 'all';
            }
            if (options.required ===
                    void 0) {
                options.required = true;
            }
            if (options.datatype === 'integer') {
                options.datatype = 'int';
            }
            if (validTypes.indexOf(options.datatype) === -1) {
                throw new Error("Invalid port datatype '" + options.datatype + "' specified, valid are " + (validTypes.join(', ')));
            }
            if (options.type && options.type.indexOf('/') === -1) {
                throw new Error("Invalid port type '" + options.type + "' specified. Should be URL or MIME type");
            }
            return this.options = options;
        };

        BasePort.prototype.getId = function() {
            if (!(this.node && this.name)) {
                return 'Port';
            }
            return "" + this.node + " " + (this.name.toUpperCase());
        };

        BasePort.prototype.getDataType = function() {
            return this.options.datatype;
        };

        BasePort.prototype.getDescription = function() {
            return this.options.description;
        };

        BasePort.prototype.attach = function(socket, index) {
            if (index == null) {
                index = null;
            }
            if (!this.isAddressable() || index === null) {
                index = this.sockets.length;
            }
            this.sockets[index] = socket;
            this.attachSocket(socket, index);
            if (this.isAddressable()) {
                this.emit('attach', socket, index);
                return;
            }
            return this.emit('attach', socket);
        };

        BasePort.prototype.attachSocket = function() {
        };

        BasePort.prototype.detach = function(socket) {
            var index;
            index = this.sockets.indexOf(socket);
            if (index === -1) {
                return;
            }
            this.sockets[index] =
                    void 0;
            if (this.isAddressable()) {
                this.emit('detach', socket, index);
                return;
            }
            return this.emit('detach', socket);
        };

        BasePort.prototype.isAddressable = function() {
            if (this.options.addressable) {
                return true;
            }
            return false;
        };

        BasePort.prototype.isBuffered = function() {
            if (this.options.buffered) {
                return true;
            }
            return false;
        };

        BasePort.prototype.isRequired = function() {
            if (this.options.required) {
                return true;
            }
            return false;
        };

        BasePort.prototype.isAttached = function(socketId) {
            if (socketId == null) {
                socketId = null;
            }
            if (this.isAddressable() && socketId !== null) {
                if (this.sockets[socketId]) {
                    return true;
                }
                return false;
            }
            if (this.sockets.length) {
                return true;
            }
            return false;
        };

        BasePort.prototype.listAttached = function() {
            var attached, idx, socket, _i, _len, _ref;
            attached = [];
            _ref = this.sockets;
            for (idx = _i = 0, _len = _ref.length; _i < _len; idx = ++_i) {
                socket = _ref[idx];
                if (!socket) {
                    continue;
                }
                attached.push(idx);
            }
            return attached;
        };

        BasePort.prototype.isConnected = function(socketId) {
            var connected;
            if (socketId == null) {
                socketId = null;
            }
            if (this.isAddressable()) {
                if (socketId === null) {
                    throw new Error("" + (this.getId()) + ": Socket ID required");
                }
                if (!this.sockets[socketId]) {
                    throw new Error("" + (this.getId()) + ": Socket " + socketId + " not available");
                }
                return this.sockets[socketId].isConnected();
            }
            connected = false;
            this.sockets.forEach((function(_this) {
                return function(socket) {
                    if (socket.isConnected()) {
                        return connected = true;
                    }
                };
            })(this));
            return connected;
        };

        BasePort.prototype.canAttach = function() {
            return true;
        };

        return BasePort;

    })(EventEmitter);

    module.exports = BasePort;

});

require.register("noflo-noflo/src/lib/Ports.js", function(exports, require, module) {
    var EventEmitter, InPort, Ports, __hasProp = {}.hasOwnProperty, __extends = function(child, parent) {
        for (var key in parent) {
            if (__hasProp.call(parent, key))
                child[key] = parent[key];
        }
        function ctor() {
            this.constructor = child;
        }


        ctor.prototype = parent.prototype;
        child.prototype = new ctor();
        child.__super__ = parent.prototype;
        return child;
    };

    EventEmitter = require('events').EventEmitter;

    Ports = (function(_super) {
        __extends(Ports, _super);

        Ports.prototype.model = InPort;

        function Ports(ports) {
            var name, options;
            this.ports = {};
            if (!ports) {
                return;
            }
            for (name in ports) {
                options = ports[name];
                this.add(name, options);
            }
        }


        Ports.prototype.add = function(name, options, process) {
            if (name === 'add' || name === 'remove') {
                throw new Error('Add and remove are restricted port names');
            }
            if (this.ports[name]) {
                this.remove(name);
            }
            if (typeof options === 'object' && options.canAttach) {
                this.ports[name] = options;
            } else {
                this.ports[name] = new this.model(options, process);
            }
            this[name] = this.ports[name];
            return this.emit('add', name);
        };

        Ports.prototype.remove = function(name) {
            if (!this.ports[name]) {
                throw new Error("Port " + name + " not defined");
            }
            delete this.ports[name];
            delete this[name];
            return this.emit('remove', name);
        };

        return Ports;

    })(EventEmitter);

});
require.register("noflo-noflo/src/lib/Port.js", function(exports, require, module) {
    var EventEmitter, Port, __hasProp = {}.hasOwnProperty, __extends = function(child, parent) {
        for (var key in parent) {
            if (__hasProp.call(parent, key))
                child[key] = parent[key];
        }
        function ctor() {
            this.constructor = child;
        }


        ctor.prototype = parent.prototype;
        child.prototype = new ctor();
        child.__super__ = parent.prototype;
        return child;
    };

    EventEmitter = require('events').EventEmitter;

    Port = (function(_super) {
        __extends(Port, _super);

        Port.prototype.description = '';

        Port.prototype.required = true;

        function Port(type) {
            this.type = type;
            if (!this.type) {
                this.type = 'all';
            }
            if (this.type === 'integer') {
                this.type = 'int';
            }
            this.sockets = [];
            this.from = null;
            this.node = null;
            this.name = null;
        }


        Port.prototype.getId = function() {
            if (!(this.node && this.name)) {
                return 'Port';
            }
            return "" + this.node + " " + (this.name.toUpperCase());
        };

        Port.prototype.getDataType = function() {
            return this.type;
        };

        Port.prototype.getDescription = function() {
            return this.description;
        };

        Port.prototype.attach = function(socket) {
            this.sockets.push(socket);
            return this.attachSocket(socket);
        };

        Port.prototype.attachSocket = function(socket, localId) {
            if (localId == null) {
                localId = null;
            }
            this.emit("attach", socket, localId);
            this.from = socket.from;
            if (socket.setMaxListeners) {
                socket.setMaxListeners(0);
            }
            socket.on("connect", (function(_this) {
                return function() {
                    return _this.emit("connect", socket, localId);
                };
            })(this));
            socket.on("begingroup", (function(_this) {
                return function(group) {
                    return _this.emit("begingroup", group, localId);
                };
            })(this));
            socket.on("data", (function(_this) {
                return function(data) {
                    return _this.emit("data", data, localId);
                };
            })(this));
            socket.on("endgroup", (function(_this) {
                return function(group) {
                    return _this.emit("endgroup", group, localId);
                };
            })(this));
            return socket.on("disconnect", (function(_this) {
                return function() {
                    return _this.emit("disconnect", socket, localId);
                };
            })(this));
        };

        Port.prototype.connect = function() {
            var socket, _i, _len, _ref, _results;
            if (this.sockets.length === 0) {
                throw new Error("" + (this.getId()) + ": No flows available");
            }
            _ref = this.sockets;
            _results = [];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                socket = _ref[_i];
                _results.push(socket.connect());
            }
            return _results;
        };

        Port.prototype.beginGroup = function(group) {
            if (this.sockets.length === 0) {
                throw new Error("" + (this.getId()) + ": No flows available");
            }
            return this.sockets.forEach(function(socket) {
                if (socket.isConnected()) {
                    return socket.beginGroup(group);
                }
                socket.once('connect', function() {
                    return socket.beginGroup(group);
                });
                return socket.connect();
            });
        };

        Port.prototype.send = function(data) {
            if (this.sockets.length === 0) {
                throw new Error("" + (this.getId()) + ": No flows available");
            }
            return this.sockets.forEach(function(socket) {
                if (socket.isConnected()) {
                    return socket.send(data);
                }
                socket.once('connect', function() {
                    return socket.send(data);
                });
                return socket.connect();
            });
        };

        Port.prototype.endGroup = function() {
            var socket, _i, _len, _ref, _results;
            if (this.sockets.length === 0) {
                throw new Error("" + (this.getId()) + ": No flows available");
            }
            _ref = this.sockets;
            _results = [];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                socket = _ref[_i];
                _results.push(socket.endGroup());
            }
            return _results;
        };

        Port.prototype.disconnect = function() {
            var socket, _i, _len, _ref, _results;
            if (this.sockets.length === 0) {
                throw new Error("" + (this.getId()) + ": No flows available");
            }
            _ref = this.sockets;
            _results = [];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                socket = _ref[_i];
                _results.push(socket.disconnect());
            }
            return _results;
        };

        Port.prototype.detach = function(socket) {
            var index;
            if (this.sockets.length === 0) {
                return;
            }
            if (!socket) {
                socket = this.sockets[0];
            }
            index = this.sockets.indexOf(socket);
            if (index === -1) {
                return;
            }
            if (this.isAddressable()) {
                this.sockets[index] =
                        void 0;
                this.emit('detach', socket, index);
                return;
            }
            this.sockets.splice(index, 1);
            return this.emit("detach", socket);
        };

        Port.prototype.isConnected = function() {
            var connected;
            connected = false;
            this.sockets.forEach((function(_this) {
                return function(socket) {
                    if (socket.isConnected()) {
                        return connected = true;
                    }
                };
            })(this));
            return connected;
        };

        Port.prototype.isAddressable = function() {
            return false;
        };

        Port.prototype.isRequired = function() {
            return this.required;
        };

        Port.prototype.isAttached = function() {
            if (this.sockets.length > 0) {
                return true;
            }
            return false;
        };

        Port.prototype.listAttached = function() {
            var attached, idx, socket, _i, _len, _ref;
            attached = [];
            _ref = this.sockets;
            for (idx = _i = 0, _len = _ref.length; _i < _len; idx = ++_i) {
                socket = _ref[idx];
                if (!socket) {
                    continue;
                }
                attached.push(idx);
            }
            return attached;
        };

        Port.prototype.canAttach = function() {
            return true;
        };

        return Port;

    })(EventEmitter);

    exports.Port = Port;

});

require.register("noflo-noflo/src/lib/Component.js", function(exports, require, module) {
    var Component, EventEmitter, ports, __bind = function(fn, me) {
        return function() {
            return fn.apply(me, arguments);
        };
    }, __hasProp = {}.hasOwnProperty, __extends = function(child, parent) {
        for (var key in parent) {
            if (__hasProp.call(parent, key))
                child[key] = parent[key];
        }
        function ctor() {
            this.constructor = child;
        }


        ctor.prototype = parent.prototype;
        child.prototype = new ctor();
        child.__super__ = parent.prototype;
        return child;
    };

    EventEmitter = require('events').EventEmitter;

    ports = require('./Ports');

    Component = (function(_super) {
        __extends(Component, _super);

        Component.prototype.description = '';

        Component.prototype.icon = null;

        function Component(options) {
            this.error = __bind(this.error, this);
            if (!options) {
                options = {};
            }
            if (!options.inPorts) {
                options.inPorts = {};
            }
            if (options.inPorts instanceof ports.InPorts) {
                this.inPorts = options.inPorts;
            } else {
                this.inPorts = new ports.InPorts(options.inPorts);
            }
            if (!options.outPorts) {
                options.outPorts = {};
            }
            if (options.outPorts instanceof ports.OutPorts) {
                this.outPorts = options.outPorts;
            } else {
                this.outPorts = new ports.OutPorts(options.outPorts);
            }
        }


        Component.prototype.getDescription = function() {
            return this.description;
        };

        Component.prototype.isReady = function() {
            return true;
        };

        Component.prototype.isSubgraph = function() {
            return false;
        };

        Component.prototype.setIcon = function(icon) {
            this.icon = icon;
            return this.emit('icon', this.icon);
        };

        Component.prototype.getIcon = function() {
            return this.icon;
        };

        Component.prototype.error = function(e, groups, errorPort) {
            var group, _i, _j, _len, _len1;
            if (groups == null) {
                groups = [];
            }
            if (errorPort == null) {
                errorPort = 'error';
            }
            if (this.outPorts[errorPort] && (this.outPorts[errorPort].isAttached() || !this.outPorts[errorPort].isRequired())) {
                for (_i = 0, _len = groups.length; _i < _len; _i++) {
                    group = groups[_i];
                    this.outPorts[errorPort].beginGroup(group);
                }
                this.outPorts[errorPort].send(e);
                for (_j = 0, _len1 = groups.length; _j < _len1; _j++) {
                    group = groups[_j];
                    this.outPorts[errorPort].endGroup();
                }
                this.outPorts[errorPort].disconnect();
                return;
            }
            throw e;
        };

        Component.prototype.shutdown = function() {
        };

        return Component;

    })(EventEmitter);

    exports.Component = Component;

});

require.register("noflo-noflo/src/lib/ComponentLoader.js", function(exports, require, module) {
    var ComponentLoader, EventEmitter, nofloGraph, utils, __hasProp = {}.hasOwnProperty, __extends = function(child, parent) {
        for (var key in parent) {
            if (__hasProp.call(parent, key))
                child[key] = parent[key];
        }
        function ctor() {
            this.constructor = child;
        }


        ctor.prototype = parent.prototype;
        child.prototype = new ctor();
        child.__super__ = parent.prototype;
        return child;
    };

    nofloGraph = require('./Graph');

    utils = require('./Utils');

    EventEmitter = require('events').EventEmitter;

    ComponentLoader = (function(_super) {
        __extends(ComponentLoader, _super);

        function ComponentLoader(baseDir) {
            this.baseDir = baseDir;
            this.components = null;
            this.checked = [];
            this.revalidate = false;
            this.libraryIcons = {};
            this.processing = false;
            this.ready = false;
        }


        ComponentLoader.prototype.getModulePrefix = function(name) {
            if (!name) {
                return '';
            }
            if (name === 'noflo') {
                return '';
            }
            return name.replace('noflo-', '');
        };

        ComponentLoader.prototype.getModuleComponents = function(moduleName) {
            var cPath, definition, dependency, e, loader, name, prefix, _ref, _ref1, _results;
            if (this.checked.indexOf(moduleName) !== -1) {
                return;
            }
            this.checked.push(moduleName);
            try {
                definition = require("/" + moduleName + "/component.json");
            } catch (_error) {
                e = _error;
                if (moduleName.substr(0, 1) === '/') {
                    return this.getModuleComponents("noflo-" + (moduleName.substr(1)));
                }
                return;
            }
            for (dependency in definition.dependencies) {
                this.getModuleComponents(dependency.replace('/', '-'));
            }
            if (!definition.noflo) {
                return;
            }
            prefix = this.getModulePrefix(definition.name);
            if (definition.noflo.icon) {
                this.libraryIcons[prefix] = definition.noflo.icon;
            }
            if (moduleName[0] === '/') {
                moduleName = moduleName.substr(1);
            }
            if (definition.noflo.loader) {
                loader = require("/" + moduleName + "/" + definition.noflo.loader);
                this.registerLoader(loader, function() {
                });
            }
            if (definition.noflo.components) {
                _ref = definition.noflo.components;
                for (name in _ref) {
                    cPath = _ref[name];
                    if (cPath.indexOf('.js') !== -1) {
                        cPath = cPath.replace('.js', '.js');
                    }
                    if (cPath.substr(0, 2) === './') {
                        cPath = cPath.substr(2);
                    }
                    this.registerComponent(prefix, name, "/" + moduleName + "/" + cPath);
                }
            }
            if (definition.noflo.graphs) {
                _ref1 = definition.noflo.graphs;
                _results = [];
                for (name in _ref1) {
                    cPath = _ref1[name];
                    _results.push(this.registerGraph(prefix, name, "/" + moduleName + "/" + cPath));
                }
                return _results;
            }
        };

        ComponentLoader.prototype.listComponents = function(callback) {
            if (this.processing) {
                this.once('ready', (function(_this) {
                    return function() {
                        return callback(_this.components);
                    };
                })(this));
                return;
            }
            if (this.components) {
                return callback(this.components);
            }
            this.ready = false;
            this.processing = true;
            return setTimeout((function(_this) {
                return function() {
                    _this.components = {};
                    _this.getModuleComponents(_this.baseDir);
                    _this.processing = false;
                    _this.ready = true;
                    _this.emit('ready', true);
                    if (callback) {
                        return callback(_this.components);
                    }
                };
            })(this), 1);
        };

        ComponentLoader.prototype.load = function(name, callback, delayed, metadata) {
            var component, componentName, implementation, instance;
            if (!this.ready) {
                this.listComponents((function(_this) {
                    return function() {
                        return _this.load(name, callback, delayed, metadata);
                    };
                })(this));
                return;
            }
            component = this.components[name];
            if (!component) {
                for (componentName in this.components) {
                    if (componentName.split('/')[1] === name) {
                        component = this.components[componentName];
                        break;
                    }
                }
                if (!component) {
                    throw new Error("Component " + name + " not available with base " + this.baseDir);
                    return;
                }
            }
            if (this.isGraph(component)) {
                if (typeof process !== 'undefined' && process.execPath && process.execPath.indexOf('node') !== -1) {
                    process.nextTick((function(_this) {
                        return function() {
                            return _this.loadGraph(name, component, callback, delayed, metadata);
                        };
                    })(this));
                } else {
                    setTimeout((function(_this) {
                        return function() {
                            return _this.loadGraph(name, component, callback, delayed, metadata);
                        };
                    })(this), 0);
                }
                return;
            }
            if (typeof component === 'function') {
                implementation = component;
                if (component.getComponent && typeof component.getComponent === 'function') {
                    instance = component.getComponent(metadata);
                } else {
                    instance = component(metadata);
                }
            } else if (typeof component === 'object' && typeof component.getComponent === 'function') {
                instance = component.getComponent(metadata);
            } else {
                implementation = require(component);
                if (implementation.getComponent && typeof implementation.getComponent === 'function') {
                    instance = implementation.getComponent(metadata);
                } else {
                    if (typeof implementation !== 'function') {
                        throw new Error("Component " + name + " is npt loadable");
                    }
                    instance = implementation(metadata);
                }
            }
            if (name === 'Graph') {
                instance.baseDir = this.baseDir;
            }
            this.setIcon(name, instance);
            return callback(instance);
        };

        ComponentLoader.prototype.isGraph = function(cPath) {
            if (typeof cPath === 'object' && cPath instanceof nofloGraph.Graph) {
                return true;
            }
            if (typeof cPath !== 'string') {
                return false;
            }
            return cPath.indexOf('.fbp') !== -1 || cPath.indexOf('.json') !== -1;
        };

        ComponentLoader.prototype.loadGraph = function(name, component, callback, delayed, metadata) {
            var graph, graphImplementation;
            graphImplementation = require(this.components['Graph']);
            graph = graphImplementation.getComponent(metadata);
            graph.loader = this;
            graph.baseDir = this.baseDir;
            graph.inPorts.remove('graph');
            graph.inPorts.remove('start');
            this.setIcon(name, graph);
            return callback(graph);
        };

        ComponentLoader.prototype.setIcon = function(name, instance) {
            var componentName, library, _ref;
            if (!instance.getIcon || instance.getIcon()) {
                return;
            }
            _ref = name.split('/'), library = _ref[0], componentName = _ref[1];
            if (componentName && this.getLibraryIcon(library)) {
                instance.setIcon(this.getLibraryIcon(library));
                return;
            }
            if (instance.isSubgraph()) {
                instance.setIcon('sitemap');
                return;
            }
            instance.setIcon('square');
        };

        ComponentLoader.prototype.getLibraryIcon = function(prefix) {
            if (this.libraryIcons[prefix]) {
                return this.libraryIcons[prefix];
            }
            return null;
        };

        ComponentLoader.prototype.normalizeName = function(packageId, name) {
            var fullName, prefix;
            prefix = this.getModulePrefix(packageId);
            fullName = "" + prefix + "/" + name;
            if (!packageId) {
                fullName = name;
            }
            return fullName;
        };

        ComponentLoader.prototype.registerComponent = function(packageId, name, cPath, callback) {
            var fullName;
            fullName = this.normalizeName(packageId, name);
            this.components[fullName] = cPath;
            if (callback) {
                return callback();
            }
        };

        ComponentLoader.prototype.registerGraph = function(packageId, name, gPath, callback) {
            return this.registerComponent(packageId, name, gPath, callback);
        };

        ComponentLoader.prototype.registerLoader = function(loader, callback) {
            return loader(this, callback);
        };

        ComponentLoader.prototype.setSource = function(packageId, name, source, language, callback) {
            var e, implementation;
            if (!this.ready) {
                this.listComponents((function(_this) {
                    return function() {
                        return _this.setSource(packageId, name, source, language, callback);
                    };
                })(this));
                return;
            }
            if (language === 'coffeescript') {
                if (!window.CoffeeScript) {
                    return callback(new Error('CoffeeScript compiler not available'));
                }
                try {
                    source = CoffeeScript.compile(source, {
                        bare: true
                    });
                } catch (_error) {
                    e = _error;
                    return callback(e);
                }
            }
            try {
                source = source.replace("require('noflo')", "require('./NoFlo')");
                source = source.replace('require("noflo")', 'require("./NoFlo")');
                implementation = eval("(function () { var exports = {}; " + source + "; return exports; })()");
            } catch (_error) {
                e = _error;
                return callback(e);
            }
            if (!(implementation || implementation.getComponent)) {
                return callback(new Error('Provided source failed to create a runnable component'));
            }
            return this.registerComponent(packageId, name, implementation, function() {
                return callback(null);
            });
        };

        ComponentLoader.prototype.getSource = function(name, callback) {
            var component, componentName, nameParts, path;
            if (!this.ready) {
                this.listComponents((function(_this) {
                    return function() {
                        return _this.getSource(name, callback);
                    };
                })(this));
                return;
            }
            component = this.components[name];
            if (!component) {
                for (componentName in this.components) {
                    if (componentName.split('/')[1] === name) {
                        component = this.components[componentName];
                        name = componentName;
                        break;
                    }
                }
                if (!component) {
                    return callback(new Error("Component " + name + " not installed"));
                }
            }
            if (typeof component !== 'string') {
                return callback(new Error("Can't provide source for " + name + ". Not a file"));
            }
            path = window.require.resolve(component);
            if (!path) {
                return callback(new Error("Component " + name + " is not resolvable to a path"));
            }
            nameParts = name.split('/');
            if (nameParts.length === 1) {
                nameParts[1] = nameParts[0];
                nameParts[0] = '';
            }
            return callback(null, {
                name: nameParts[1],
                library: nameParts[0],
                code: window.require.modules[path].toString(),
                language: utils.guessLanguageFromFilename(component)
            });
        };

        ComponentLoader.prototype.clear = function() {
            this.components = null;
            this.checked = [];
            this.revalidate = true;
            this.ready = false;
            return this.processing = false;
        };

        return ComponentLoader;

    })(EventEmitter);

    exports.ComponentLoader = ComponentLoader;

});
require.register("noflo-noflo/src/lib/NoFlo.js", function(exports, require, module) {
    var ports;

    exports.graph = require('./Graph');

    exports.Graph = exports.graph.Graph;

    exports.Network = require('./Network').Network;

    exports.isBrowser = require('./Platform').isBrowser;

    if (!exports.isBrowser()) {
        exports.ComponentLoader = require('./nodejs/ComponentLoader').ComponentLoader;
    } else {
        exports.ComponentLoader = require('./ComponentLoader').ComponentLoader;
    }

    exports.Component = require('./Component').Component;

    exports.helpers = require('./Helpers');

    ports = require('./Ports');

    exports.Port = require('./Port').Port;

    exports.createNetwork = function(graph, callback, delay) {
        var network, networkReady;
        network = new exports.Network(graph);
        networkReady = function(network) {
            if (callback != null) {
                callback(network);
            }
            return network.start();
        };
        network.loader.listComponents(function() {
            if (graph.nodes.length === 0) {
                return networkReady(network);
            }
            if (delay) {
                if (callback != null) {
                    callback(network);
                }
                return;
            }
            return network.connect(function() {
                return networkReady(network);
            });
        });
        return network;
    };

    exports.loadFile = function(file, baseDir, callback) {
        if (!callback) {
            callback = baseDir;
            baseDir = null;
        }
        return exports.graph.loadFile(file, function(net) {
            if (baseDir) {
                net.baseDir = baseDir;
            }
            return exports.createNetwork(net, callback);
        });
    };

    exports.saveFile = function(graph, file, callback) {
        return exports.graph.save(file, function() {
            return callback(file);
        });
    };

});
require.register("noflo-noflo/src/lib/Network.js", function(exports, require, module) {
    var EventEmitter, Network, componentLoader, graph, _, __hasProp = {}.hasOwnProperty, __extends = function(child, parent) {
        for (var key in parent) {
            if (__hasProp.call(parent, key))
                child[key] = parent[key];
        }
        function ctor() {
            this.constructor = child;
        }


        ctor.prototype = parent.prototype;
        child.prototype = new ctor();
        child.__super__ = parent.prototype;
        return child;
    };

    _ = require("underscore");

    graph = require("./Graph");

    EventEmitter = require('events').EventEmitter;

    if (!require('./Platform').isBrowser()) {
        componentLoader = require("./nodejs/ComponentLoader");
    } else {
        componentLoader = require('./ComponentLoader');
    }
});
require.register("noflo-noflo/src/lib/Platform.js", function(exports, require, module) {
    exports.isBrowser = function() {
        if (typeof process !== 'undefined' && process.execPath && process.execPath.indexOf('node') !== -1) {
            return false;
        }
        return true;
    };

});

require.register("noflo-noflo/src/lib/Utils.js", function(exports, require, module) {
    var clone, guessLanguageFromFilename;

    clone = function(obj) {
        var flags, key, newInstance;
        if ((obj == null) || typeof obj !== 'object') {
            return obj;
        }
        if (obj instanceof Date) {
            return new Date(obj.getTime());
        }
        if (obj instanceof RegExp) {
            flags = '';
            if (obj.global != null) {
                flags += 'g';
            }
            if (obj.ignoreCase != null) {
                flags += 'i';
            }
            if (obj.multiline != null) {
                flags += 'm';
            }
            if (obj.sticky != null) {
                flags += 'y';
            }
            return new RegExp(obj.source, flags);
        }
        newInstance = new obj.constructor();
        for (key in obj) {
            newInstance[key] = clone(obj[key]);
        }
        return newInstance;
    };

    guessLanguageFromFilename = function(filename) {
        if (/.*\.coffee$/.test(filename)) {
            return 'coffeescript';
        }
        return 'javascript';
    };

    exports.clone = clone;

    exports.guessLanguageFromFilename = guessLanguageFromFilename;

});
require.register("noflo-noflo/src/lib/Helpers.js", function(exports, require, module) {
    var AtomicSender;

    exports.MapComponent = function(component, func, config) {
        var groups, inPort, outPort;
        if (!config) {
            config = {};
        }
        if (!config.inPort) {
            config.inPort = 'in';
        }
        if (!config.outPort) {
            config.outPort = 'out';
        }
        inPort = component.inPorts[config.inPort];
        outPort = component.outPorts[config.outPort];
        groups = [];
        return inPort.process = function(event, payload) {
            switch (event) {
                case 'connect':
                    return outPort.connect();
                case 'begingroup':
                    groups.push(payload);
                    return outPort.beginGroup(payload);
                case 'data':
                    return func(payload, groups, outPort);
                case 'endgroup':
                    groups.pop();
                    return outPort.endGroup();
                case 'disconnect':
                    groups = [];
                    return outPort.disconnect();
            }
        };
    };

    AtomicSender = (function() {
        function AtomicSender(port, groups) {
            this.port = port;
            this.groups = groups;
        }


        AtomicSender.prototype.beginGroup = function(group) {
            return this.port.beginGroup(group);
        };

        AtomicSender.prototype.endGroup = function() {
            return this.port.endGroup();
        };

        AtomicSender.prototype.connect = function() {
            return this.port.connect();
        };

        AtomicSender.prototype.disconnect = function() {
            return this.port.disconnect();
        };

        AtomicSender.prototype.send = function(packet) {
            var group, _i, _j, _len, _len1, _ref, _ref1, _results;
            _ref = this.groups;
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                group = _ref[_i];
                this.port.beginGroup(group);
            }
            this.port.send(packet);
            _ref1 = this.groups;
            _results = [];
            for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
                group = _ref1[_j];
                _results.push(this.port.endGroup());
            }
            return _results;
        };

        return AtomicSender;

    })();

    exports.GroupComponent = function(component, func, inPorts, outPort, config) {
        var groupedData, name, out, port, _i, _j, _len, _len1, _results;
        if (inPorts == null) {
            inPorts = 'in';
        }
        if (outPort == null) {
            outPort = 'out';
        }
        if (config == null) {
            config = {};
        }
        if (Object.prototype.toString.call(inPorts) !== '[object Array]') {
            inPorts = [inPorts];
        }
        if (!('async' in config)) {
            config.async = false;
        }
        if (!('group' in config)) {
            config.group = false;
        }
        if (!('field' in config)) {
            config.field = null;
        }
        for (_i = 0, _len = inPorts.length; _i < _len; _i++) {
            name = inPorts[_i];
            if (!component.inPorts[name]) {
                throw new Error("no inPort named '" + name + "'");
            }
        }
        if (!component.outPorts[outPort]) {
            throw new Error("no outPort named '" + outPort + "'");
        }
        groupedData = {};
        out = component.outPorts[outPort];
        _results = [];
        for (_j = 0, _len1 = inPorts.length; _j < _len1; _j++) {
            port = inPorts[_j];
            _results.push((function(port) {
                var inPort;
                inPort = component.inPorts[port];
                inPort.groups = [];
                return inPort.process = function(event, payload) {
                    var atomicOut, callback, groups, key, requiredLength;
                    switch (event) {
                        case 'begingroup':
                            return inPort.groups.push(payload);
                        case 'data':
                            key = '';
                            if (config.group && inPort.groups.length > 0) {
                                key = inPort.groups.toString();
                            } else if (config.field && typeof payload === 'object' && config.field in payload) {
                                key = payload[config.field];
                            }
                            if (!(key in groupedData)) {
                                groupedData[key] = {};
                            }
                            if (config.field) {
                                groupedData[key][config.field] = key;
                            }
                            groupedData[key][port] = payload;
                            requiredLength = config.field ? inPorts.length + 1 : inPorts.length;
                            if (Object.keys(groupedData[key]).length === requiredLength) {
                                groups = inPort.groups;
                                atomicOut = new AtomicSender(out, groups);
                                callback = function(err) {
                                    if (err) {
                                        component.error(err, groups);
                                        if (typeof component.fail === 'function') {
                                            component.fail();
                                        }
                                    }
                                    out.disconnect();
                                    return
                                    delete groupedData[key];
                                };
                                if (config.async) {
                                    return func(groupedData[key], groups, atomicOut, callback);
                                } else {
                                    func(groupedData[key], inPort.groups, atomicOut);
                                    return callback();
                                }
                            }
                            break;
                        case 'endgroup':
                            return inPort.groups.pop();
                    }
                };
            })(port));
        }
        return _results;
    };

});
require.register("noflo-noflo/src/components/Graph.js", function(exports, require, module) {
    var Graph, noflo, __hasProp = {}.hasOwnProperty, __extends = function(child, parent) {
        for (var key in parent) {
            if (__hasProp.call(parent, key))
                child[key] = parent[key];
        }
        function ctor() {
            this.constructor = child;
        }


        ctor.prototype = parent.prototype;
        child.prototype = new ctor();
        child.__super__ = parent.prototype;
        return child;
    };

    if (typeof process !== 'undefined' && process.execPath && process.execPath.indexOf('node') !== -1) {
        noflo = require("../../lib/NoFlo");
    } else {
        noflo = require('../lib/NoFlo');
    }

    Graph = (function(_super) {
        __extends(Graph, _super);

        function Graph(metadata) {
            this.metadata = metadata;
            this.network = null;
            this.ready = true;
            this.started = false;
            this.baseDir = null;
            this.loader = null;
            this.inPorts = new noflo.InPorts({
                graph: {
                    datatype: 'all',
                    description: 'NoFlo graph definition to be used with the subgraph component',
                    required: true,
                    immediate: true
                },
                start: {
                    datatype: 'bang',
                    description: 'if attached, the network will only be started when receiving a start message',
                    required: false
                }
            });
            this.outPorts = new noflo.OutPorts;
            this.inPorts.on('graph', 'data', (function(_this) {
                return function(data) {
                    return _this.setGraph(data);
                };
            })(this));
            this.inPorts.on('start', 'data', (function(_this) {
                return function() {
                    return _this.start();
                };
            })(this));
        }


        Graph.prototype.setGraph = function(graph) {
            this.ready = false;
            if (typeof graph === 'object') {
                if (typeof graph.addNode === 'function') {
                    return this.createNetwork(graph);
                }
                noflo.graph.loadJSON(graph, (function(_this) {
                    return function(instance) {
                        instance.baseDir = _this.baseDir;
                        return _this.createNetwork(instance);
                    };
                })(this));
                return;
            }
            if (graph.substr(0, 1) !== "/" && graph.substr(1, 1) !== ":" && process && process.cwd) {
                graph = "" + (process.cwd()) + "/" + graph;
            }
            return graph = noflo.graph.loadFile(graph, (function(_this) {
                return function(instance) {
                    instance.baseDir = _this.baseDir;
                    return _this.createNetwork(instance);
                };
            })(this));
        };

        Graph.prototype.createNetwork = function(graph) {
            this.description = graph.properties.description || '';
            graph.componentLoader = this.loader;
            return noflo.createNetwork(graph, (function(_this) {
                return function(network) {
                    _this.network = network;
                    _this.emit('network', _this.network);
                    return _this.network.connect(function() {
                        var name, notReady, process, _ref, _ref1;
                        notReady = false;
                        _ref = _this.network.tasks;
                        for (name in _ref) {
                            process = _ref[name];
                            if (!_this.checkComponent(name, process)) {
                                notReady = true;
                            }
                        }
                        if (!notReady) {
                            _this.setToReady();
                        }
                        if (((_ref1 = _this.inPorts.start) != null ? _ref1.isAttached() :
                                void 0) && !_this.started) {
                            return;
                        }
                        return _this.start(graph);
                    });
                };
            })(this), true);
        };

        Graph.prototype.start = function(graph) {
            this.started = true;
            if (!this.network) {
                return;
            }
            this.network.sendInitials();
            if (!graph) {
                return;
            }
            return graph.on('addInitial', (function(_this) {
                return function() {
                    return _this.network.sendInitials();
                };
            })(this));
        };

        Graph.prototype.checkComponent = function(name, process) {
            if (!process.component.isReady()) {
                process.component.once("ready", (function(_this) {
                    return function() {
                        _this.checkComponent(name, process);
                        return _this.setToReady();
                    };
                })(this));
                return false;
            }
            this.findEdgePorts(name, process);
            return true;
        };

        Graph.prototype.isExportedInport = function(port, nodeName, portName) {
            var exported, priv, pub, _i, _len, _ref, _ref1;
            _ref = this.network.graph.inports;
            for (pub in _ref) {
                priv = _ref[pub];
                if (!(priv.process === nodeName && priv.port === portName)) {
                    continue;
                }
                return pub;
            }
            _ref1 = this.network.graph.exports;
            for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
                exported = _ref1[_i];
                if (!(exported.process === nodeName && exported.port === portName)) {
                    continue;
                }
                this.network.graph.checkTransactionStart();
                this.network.graph.removeExport(exported["public"]);
                this.network.graph.addInport(exported["public"], exported.process, exported.port, exported.metadata);
                this.network.graph.checkTransactionEnd();
                return exported["public"];
            }
            if (Object.keys(this.network.graph.inports).length > 0) {
                return false;
            }
            if (port.isAttached()) {
                return false;
            }
            return (nodeName + '.' + portName).toLowerCase();
        };

        Graph.prototype.isExportedOutport = function(port, nodeName, portName) {
            var exported, priv, pub, _i, _len, _ref, _ref1;
            _ref = this.network.graph.outports;
            for (pub in _ref) {
                priv = _ref[pub];
                if (!(priv.process === nodeName && priv.port === portName)) {
                    continue;
                }
                return pub;
            }
            _ref1 = this.network.graph.exports;
            for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
                exported = _ref1[_i];
                if (!(exported.process === nodeName && exported.port === portName)) {
                    continue;
                }
                this.network.graph.checkTransactionStart();
                this.network.graph.removeExport(exported["public"]);
                this.network.graph.addOutport(exported["public"], exported.process, exported.port, exported.metadata);
                this.network.graph.checkTransactionEnd();
                return exported["public"];
            }
            if (Object.keys(this.network.graph.outports).length > 0) {
                return false;
            }
            if (port.isAttached()) {
                return false;
            }
            return (nodeName + '.' + portName).toLowerCase();
        };

        Graph.prototype.setToReady = function() {
            if (typeof process !== 'undefined' && process.execPath && process.execPath.indexOf('node') !== -1) {
                return process.nextTick((function(_this) {
                    return function() {
                        _this.ready = true;
                        return _this.emit('ready');
                    };
                })(this));
            } else {
                return setTimeout((function(_this) {
                    return function() {
                        _this.ready = true;
                        return _this.emit('ready');
                    };
                })(this), 0);
            }
        };

        Graph.prototype.findEdgePorts = function(name, process) {
            var port, portName, targetPortName, _ref, _ref1;
            _ref = process.component.inPorts;
            for (portName in _ref) {
                port = _ref[portName];
                if (!port || typeof port === 'function' || !port.canAttach) {
                    continue;
                }
                targetPortName = this.isExportedInport(port, name, portName);
                if (targetPortName === false) {
                    continue;
                }
                this.inPorts.add(targetPortName, port);
            }
            _ref1 = process.component.outPorts;
            for (portName in _ref1) {
                port = _ref1[portName];
                if (!port || typeof port === 'function' || !port.canAttach) {
                    continue;
                }
                targetPortName = this.isExportedOutport(port, name, portName);
                if (targetPortName === false) {
                    continue;
                }
                this.outPorts.add(targetPortName, port);
            }
            return true;
        };

        Graph.prototype.isReady = function() {
            return this.ready;
        };

        Graph.prototype.isSubgraph = function() {
            return true;
        };

        Graph.prototype.shutdown = function() {
            if (!this.network) {
                return;
            }
            return this.network.stop();
        };

        return Graph;

    })(noflo.Component);

    exports.getComponent = function(metadata) {
        return new Graph(metadata);
    };

});

require.register("broofa-node-uuid/uuid.js", function(exports, require, module) {
    //     uuid.js
    //
    //     Copyright (c) 2010-2012 Robert Kieffer
    //     MIT License - http://opensource.org/licenses/mit-license.php

    (function() {
        var _global = this;

        // Unique ID creation requires a high quality random # generator.  We feature
        // detect to determine the best RNG source, normalizing to a function that
        // returns 128-bits of randomness, since that's what's usually required
        var _rng;

        // Node.js crypto-based RNG - http://nodejs.org/docs/v0.6.2/api/crypto.html
        //
        // Moderately fast, high quality
        if (typeof (_global.require) == 'function') {
            try {
                var _rb = _global.require('crypto').randomBytes;
                _rng = _rb &&
                        function() {
                            return _rb(16);
                        };
            } catch (e) {
            }
        }

        if (!_rng && _global.crypto && crypto.getRandomValues) {
            // WHATWG crypto-based RNG - http://wiki.whatwg.org/wiki/Crypto
            //
            // Moderately fast, high quality
            var _rnds8 = new Uint8Array(16);
            _rng = function whatwgRNG() {
                crypto.getRandomValues(_rnds8);
                return _rnds8;
            };
        }

        if (!_rng) {
            // Math.random()-based (RNG)
            //
            // If all else fails, use Math.random().  It's fast, but is of unspecified
            // quality.
            var _rnds = new Array(16);
            _rng = function() {
                for (var i = 0, r; i < 16; i++) {
                    if ((i & 0x03) === 0)
                        r = Math.random() * 0x100000000;
                    _rnds[i] = r >>> ((i & 0x03) << 3) & 0xff;
                }

                return _rnds;
            };
        }

        // Buffer class to use
        var BufferClass = typeof (_global.Buffer) == 'function' ? _global.Buffer : Array;

        // Maps for number <-> hex string conversion
        var _byteToHex = [];
        var _hexToByte = {};
        for (var i = 0; i < 256; i++) {
            _byteToHex[i] = (i + 0x100).toString(16).substr(1);
            _hexToByte[_byteToHex[i]] = i;
        }

        // **`parse()` - Parse a UUID into it's component bytes**
        function parse(s, buf, offset) {
            var i = (buf && offset) || 0, ii = 0;

            buf = buf || [];
            s.toLowerCase().replace(/[0-9a-f]{2}/g, function(oct) {
                if (ii < 16) {// Don't overflow!
                    buf[i + ii++] = _hexToByte[oct];
                }
            });

            // Zero out remaining bytes if string was short
            while (ii < 16) {
                buf[i + ii++] = 0;
            }

            return buf;
        }

        // **`unparse()` - Convert UUID byte array (ala parse()) into a string**
        function unparse(buf, offset) {
            var i = offset || 0, bth = _byteToHex;
            return bth[buf[i++]] + bth[buf[i++]] + bth[buf[i++]] + bth[buf[i++]] + '-' + bth[buf[i++]] + bth[buf[i++]] + '-' + bth[buf[i++]] + bth[buf[i++]] + '-' + bth[buf[i++]] + bth[buf[i++]] + '-' + bth[buf[i++]] + bth[buf[i++]] + bth[buf[i++]] + bth[buf[i++]] + bth[buf[i++]] + bth[buf[i++]];
        }

        // **`v1()` - Generate time-based UUID**
        //
        // Inspired by https://github.com/LiosK/UUID.js
        // and http://docs.python.org/library/uuid.html

        // random #'s we need to init node and clockseq
        var _seedBytes = _rng();

        // Per 4.5, create and 48-bit node id, (47 random bits + multicast bit = 1)
        var _nodeId = [_seedBytes[0] | 0x01, _seedBytes[1], _seedBytes[2], _seedBytes[3], _seedBytes[4], _seedBytes[5]];

        // Per 4.2.2, randomize (14 bit) clockseq
        var _clockseq = (_seedBytes[6] << 8 | _seedBytes[7]) & 0x3fff;

        // Previous uuid creation time
        var _lastMSecs = 0, _lastNSecs = 0;

        // See https://github.com/broofa/node-uuid for API details
        function v1(options, buf, offset) {
            var i = buf && offset || 0;
            var b = buf || [];

            options = options || {};

            var clockseq = options.clockseq != null ? options.clockseq : _clockseq;

            // UUID timestamps are 100 nano-second units since the Gregorian epoch,
            // (1582-10-15 00:00).  JSNumbers aren't precise enough for this, so
            // time is handled internally as 'msecs' (integer milliseconds) and 'nsecs'
            // (100-nanoseconds offset from msecs) since unix epoch, 1970-01-01 00:00.
            var msecs = options.msecs != null ? options.msecs : new Date().getTime();

            // Per 4.2.1.2, use count of uuid's generated during the current clock
            // cycle to simulate higher resolution clock
            var nsecs = options.nsecs != null ? options.nsecs : _lastNSecs + 1;

            // Time since last uuid creation (in msecs)
            var dt = (msecs - _lastMSecs) + (nsecs - _lastNSecs) / 10000;

            // Per 4.2.1.2, Bump clockseq on clock regression
            if (dt < 0 && options.clockseq == null) {
                clockseq = clockseq + 1 & 0x3fff;
            }

            // Reset nsecs if clock regresses (new clockseq) or we've moved onto a new
            // time interval
            if ((dt < 0 || msecs > _lastMSecs) && options.nsecs == null) {
                nsecs = 0;
            }

            // Per 4.2.1.2 Throw error if too many uuids are requested
            if (nsecs >= 10000) {
                throw new Error('uuid.v1(): Can\'t create more than 10M uuids/sec');
            }

            _lastMSecs = msecs;
            _lastNSecs = nsecs;
            _clockseq = clockseq;

            // Per 4.1.4 - Convert from unix epoch to Gregorian epoch
            msecs += 12219292800000;

            // `time_low`
            var tl = ((msecs & 0xfffffff) * 10000 + nsecs) % 0x100000000;
            b[i++] = tl >>> 24 & 0xff;
            b[i++] = tl >>> 16 & 0xff;
            b[i++] = tl >>> 8 & 0xff;
            b[i++] = tl & 0xff;

            // `time_mid`
            var tmh = (msecs / 0x100000000 * 10000) & 0xfffffff;
            b[i++] = tmh >>> 8 & 0xff;
            b[i++] = tmh & 0xff;

            // `time_high_and_version`
            b[i++] = tmh >>> 24 & 0xf | 0x10;
            // include version
            b[i++] = tmh >>> 16 & 0xff;

            // `clock_seq_hi_and_reserved` (Per 4.2.2 - include variant)
            b[i++] = clockseq >>> 8 | 0x80;

            // `clock_seq_low`
            b[i++] = clockseq & 0xff;

            // `node`
            var node = options.node || _nodeId;
            for (var n = 0; n < 6; n++) {
                b[i + n] = node[n];
            }

            return buf ? buf : unparse(b);
        }

        // **`v4()` - Generate random UUID**

        // See https://github.com/broofa/node-uuid for API details
        function v4(options, buf, offset) {
            // Deprecated - 'format' argument, as supported in v1.2
            var i = buf && offset || 0;

            if (typeof (options) == 'string') {
                buf = options == 'binary' ? new BufferClass(16) : null;
                options = null;
            }
            options = options || {};

            var rnds = options.random || (options.rng || _rng)();

            // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`
            rnds[6] = (rnds[6] & 0x0f) | 0x40;
            rnds[8] = (rnds[8] & 0x3f) | 0x80;

            // Copy bytes to buffer, if provided
            if (buf) {
                for (var ii = 0; ii < 16; ii++) {
                    buf[i + ii] = rnds[ii];
                }
            }

            return buf || unparse(rnds);
        }

        // Export public API
        var uuid = v4;
        uuid.v1 = v1;
        uuid.v4 = v4;
        uuid.parse = parse;
        uuid.unparse = unparse;
        uuid.BufferClass = BufferClass;

        if (typeof define === 'function' && define.amd) {
            // Publish as AMD module
            define(function() {
                return uuid;
            });
        } else if (typeof (module) != 'undefined' && module.exports) {
            // Publish as node.js module
            module.exports = uuid;
        } else {
            // Publish as global (in browsers)
            var _previousRoot = _global.uuid;

            // **`noConflict()` - (browser only) to reset global 'uuid' var**
            uuid.noConflict = function() {
                _global.uuid = _previousRoot;
                return uuid;
            };

            _global.uuid = uuid;
        }
    }).call(this);

});

require.register("noflo-noflo-polymer/index.js", function(exports, require, module) {
    /*
     * This file can be used for general library features of noflo-polymer.
     *
     * The library features can be made available as CommonJS modules that the
     * components in this project utilize.
     */

});

require.register("component-emitter/index.js", function(exports, require, module) {

    /**
     * Expose `Emitter`.
     */

    module.exports = Emitter;

    /**
     * Initialize a new `Emitter`.
     *
     * @api public
     */

    function Emitter(obj) {
        if (obj)
            return mixin(obj);
    }
    ;

    /**
     * Mixin the emitter properties.
     *
     * @param {Object} obj
     * @return {Object}
     * @api private
     */

    function mixin(obj) {
        for (var key in Emitter.prototype) {
            obj[key] = Emitter.prototype[key];
        }
        return obj;
    }

    /**
     * Listen on the given `event` with `fn`.
     *
     * @param {String} event
     * @param {Function} fn
     * @return {Emitter}
     * @api public
     */

    Emitter.prototype.on = Emitter.prototype.addEventListener = function(event, fn) {
        this._callbacks = this._callbacks || {};
        (this._callbacks[event] = this._callbacks[event] || []).push(fn);
        return this;
    };

    /**
     * Adds an `event` listener that will be invoked a single
     * time then automatically removed.
     *
     * @param {String} event
     * @param {Function} fn
     * @return {Emitter}
     * @api public
     */

    Emitter.prototype.once = function(event, fn) {
        var self = this;
        this._callbacks = this._callbacks || {};

        function on() {
            self.off(event, on);
            fn.apply(this, arguments);
        }


        on.fn = fn;
        this.on(event, on);
        return this;
    };

    /**
     * Remove the given callback for `event` or all
     * registered callbacks.
     *
     * @param {String} event
     * @param {Function} fn
     * @return {Emitter}
     * @api public
     */

    Emitter.prototype.off = Emitter.prototype.removeListener = Emitter.prototype.removeAllListeners = Emitter.prototype.removeEventListener = function(event, fn) {
        this._callbacks = this._callbacks || {};

        // all
        if (0 == arguments.length) {
            this._callbacks = {};
            return this;
        }

        // specific event
        var callbacks = this._callbacks[event];
        if (!callbacks)
            return this;

        // remove all handlers
        if (1 == arguments.length) {
            delete this._callbacks[event];
            return this;
        }

        // remove specific handler
        var cb;
        for (var i = 0; i < callbacks.length; i++) {
            cb = callbacks[i];
            if (cb === fn || cb.fn === fn) {
                callbacks.splice(i, 1);
                break;
            }
        }
        return this;
    };

    /**
     * Emit `event` with the given args.
     *
     * @param {String} event
     * @param {Mixed} ...
     * @return {Emitter}
     */

    Emitter.prototype.emit = function(event) {
        this._callbacks = this._callbacks || {};
        var args = [].slice.call(arguments, 1), callbacks = this._callbacks[event];

        if (callbacks) {
            callbacks = callbacks.slice(0);
            for (var i = 0, len = callbacks.length; i < len; ++i) {
                callbacks[i].apply(this, args);
            }
        }

        return this;
    };

    /**
     * Return array of callbacks for `event`.
     *
     * @param {String} event
     * @return {Array}
     * @api public
     */

    Emitter.prototype.listeners = function(event) {
        this._callbacks = this._callbacks || {};
        return this._callbacks[event] || [];
    };

    /**
     * Check if this emitter has `event` handlers.
     *
     * @param {String} event
     * @return {Boolean}
     * @api public
     */

    Emitter.prototype.hasListeners = function(event) {
        return !!this.listeners(event).length;
    };

});
require.register("component-reduce/index.js", function(exports, require, module) {

    /**
     * Reduce `arr` with `fn`.
     *
     * @param {Array} arr
     * @param {Function} fn
     * @param {Mixed} initial
     *
     * TODO: combatible error handling?
     */

    module.exports = function(arr, fn, initial) {
        var idx = 0;
        var len = arr.length;
        var curr = arguments.length == 3 ? initial : arr[idx++];

        while (idx < len) {
            curr = fn.call(null, curr, arr[idx], ++idx, arr);
        }

        return curr;
    };
});
require.register("visionmedia-superagent/lib/client.js", function(exports, require, module) {
    /**
     * Module dependencies.
     */

    var Emitter = require('emitter');
    var reduce = require('reduce');

    /**
     * Root reference for iframes.
     */

    var root = 'undefined' == typeof window ? this : window;

    /**
     * Noop.
     */

    function noop() {
    }
    ;

    /**
     * Check if `obj` is a host object,
     * we don't want to serialize these :)
     *
     * TODO: future proof, move to compoent land
     *
     * @param {Object} obj
     * @return {Boolean}
     * @api private
     */

    function isHost(obj) {
        var str = {}.toString.call(obj);

        switch (str) {
            case '[object File]':
            case '[object Blob]':
            case '[object FormData]':
                return true;
            default:
                return false;
        }
    }

    /**
     * Determine XHR.
     */

    function getXHR() {
        if (root.XMLHttpRequest && ('file:' != root.location.protocol || !root.ActiveXObject)) {
            return new XMLHttpRequest;
        } else {
            try {
                return new ActiveXObject('Microsoft.XMLHTTP');
            } catch (e) {
            }
            try {
                return new ActiveXObject('Msxml2.XMLHTTP.6.0');
            } catch (e) {
            }
            try {
                return new ActiveXObject('Msxml2.XMLHTTP.3.0');
            } catch (e) {
            }
            try {
                return new ActiveXObject('Msxml2.XMLHTTP');
            } catch (e) {
            }
        }
        return false;
    }

    /**
     * Removes leading and trailing whitespace, added to support IE.
     *
     * @param {String} s
     * @return {String}
     * @api private
     */

    var trim = ''.trim ? function(s) {
        return s.trim();
    } : function(s) {
        return s.replace(/(^\s*|\s*$)/g, '');
    };

    /**
     * Check if `obj` is an object.
     *
     * @param {Object} obj
     * @return {Boolean}
     * @api private
     */

    function isObject(obj) {
        return obj === Object(obj);
    }

    /**
     * Serialize the given `obj`.
     *
     * @param {Object} obj
     * @return {String}
     * @api private
     */

    function serialize(obj) {
        if (!isObject(obj))
            return obj;
        var pairs = [];
        for (var key in obj) {
            if (null != obj[key]) {
                pairs.push(encodeURIComponent(key) + '=' + encodeURIComponent(obj[key]));
            }
        }
        return pairs.join('&');
    }

    /**
     * Expose serialization method.
     */

    request.serializeObject = serialize;

    /**
     * Parse the given x-www-form-urlencoded `str`.
     *
     * @param {String} str
     * @return {Object}
     * @api private
     */

    function parseString(str) {
        var obj = {};
        var pairs = str.split('&');
        var parts;
        var pair;

        for (var i = 0, len = pairs.length; i < len; ++i) {
            pair = pairs[i];
            parts = pair.split('=');
            obj[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1]);
        }

        return obj;
    }

    /**
     * Expose parser.
     */

    request.parseString = parseString;

    /**
     * Default MIME type map.
     *
     *     superagent.types.xml = 'application/xml';
     *
     */

    request.types = {
        html: 'text/html',
        json: 'application/json',
        xml: 'application/xml',
        urlencoded: 'application/x-www-form-urlencoded',
        'form': 'application/x-www-form-urlencoded',
        'form-data': 'application/x-www-form-urlencoded'
    };

    /**
     * Default serialization map.
     *
     *     superagent.serialize['application/xml'] = function(obj){
     *       return 'generated xml here';
     *     };
     *
     */

    request.serialize = {
        'application/x-www-form-urlencoded': serialize,
        'application/json': JSON.stringify
    };

    /**
     * Default parsers.
     *
     *     superagent.parse['application/xml'] = function(str){
     *       return { object parsed from str };
     *     };
     *
     */

    request.parse = {
        'application/x-www-form-urlencoded': parseString,
        'application/json': JSON.parse
    };

    /**
     * Parse the given header `str` into
     * an object containing the mapped fields.
     *
     * @param {String} str
     * @return {Object}
     * @api private
     */

    function parseHeader(str) {
        var lines = str.split(/\r?\n/);
        var fields = {};
        var index;
        var line;
        var field;
        var val;

        lines.pop();
        // trailing CRLF

        for (var i = 0, len = lines.length; i < len; ++i) {
            line = lines[i];
            index = line.indexOf(':');
            field = line.slice(0, index).toLowerCase();
            val = trim(line.slice(index + 1));
            fields[field] = val;
        }

        return fields;
    }

    /**
     * Return the mime type for the given `str`.
     *
     * @param {String} str
     * @return {String}
     * @api private
     */

    function type(str) {
        return str.split(/ *; */).shift();
    }
    ;

    /**
     * Return header field parameters.
     *
     * @param {String} str
     * @return {Object}
     * @api private
     */

    function params(str) {
        return reduce(str.split(/ *; */), function(obj, str) {
            var parts = str.split(/ *= */), key = parts.shift(), val = parts.shift();

            if (key && val)
                obj[key] = val;
            return obj;
        }, {});
    }
    ;

    /**
     * Initialize a new `Response` with the given `xhr`.
     *
     *  - set flags (.ok, .error, etc)
     *  - parse header
     *
     * Examples:
     *
     *  Aliasing `superagent` as `request` is nice:
     *
     *      request = superagent;
     *
     *  We can use the promise-like API, or pass callbacks:
     *
     *      request.get('/').end(function(res){});
     *      request.get('/', function(res){});
     *
     *  Sending data can be chained:
     *
     *      request
     *        .post('/user')
     *        .send({ name: 'tj' })
     *        .end(function(res){});
     *
     *  Or passed to `.send()`:
     *
     *      request
     *        .post('/user')
     *        .send({ name: 'tj' }, function(res){});
     *
     *  Or passed to `.post()`:
     *
     *      request
     *        .post('/user', { name: 'tj' })
     *        .end(function(res){});
     *
     * Or further reduced to a single call for simple cases:
     *
     *      request
     *        .post('/user', { name: 'tj' }, function(res){});
     *
     * @param {XMLHTTPRequest} xhr
     * @param {Object} options
     * @api private
     */

    function Response(req, options) {
        options = options || {};
        this.req = req;
        this.xhr = this.req.xhr;
        this.text = this.xhr.responseText;
        this.setStatusProperties(this.xhr.status);
        this.header = this.headers = parseHeader(this.xhr.getAllResponseHeaders());
        // getAllResponseHeaders sometimes falsely returns "" for CORS requests, but
        // getResponseHeader still works. so we get content-type even if getting
        // other headers fails.
        this.header['content-type'] = this.xhr.getResponseHeader('content-type');
        this.setHeaderProperties(this.header);
        this.body = this.req.method != 'HEAD' ? this.parseBody(this.text) : null;
    }

    /**
     * Get case-insensitive `field` value.
     *
     * @param {String} field
     * @return {String}
     * @api public
     */

    Response.prototype.get = function(field) {
        return this.header[field.toLowerCase()];
    };

    /**
     * Set header related properties:
     *
     *   - `.type` the content type without params
     *
     * A response of "Content-Type: text/plain; charset=utf-8"
     * will provide you with a `.type` of "text/plain".
     *
     * @param {Object} header
     * @api private
     */

    Response.prototype.setHeaderProperties = function(header) {
        // content-type
        var ct = this.header['content-type'] || '';
        this.type = type(ct);

        // params
        var obj = params(ct);
        for (var key in obj)
            this[key] = obj[key];
    };

    /**
     * Parse the given body `str`.
     *
     * Used for auto-parsing of bodies. Parsers
     * are defined on the `superagent.parse` object.
     *
     * @param {String} str
     * @return {Mixed}
     * @api private
     */

    Response.prototype.parseBody = function(str) {
        var parse = request.parse[this.type];
        return parse ? parse(str) : null;
    };

    /**
     * Set flags such as `.ok` based on `status`.
     *
     * For example a 2xx response will give you a `.ok` of __true__
     * whereas 5xx will be __false__ and `.error` will be __true__. The
     * `.clientError` and `.serverError` are also available to be more
     * specific, and `.statusType` is the class of error ranging from 1..5
     * sometimes useful for mapping respond colors etc.
     *
     * "sugar" properties are also defined for common cases. Currently providing:
     *
     *   - .noContent
     *   - .badRequest
     *   - .unauthorized
     *   - .notAcceptable
     *   - .notFound
     *
     * @param {Number} status
     * @api private
     */

    Response.prototype.setStatusProperties = function(status) {
        var type = status / 100 | 0;

        // status / class
        this.status = status;
        this.statusType = type;

        // basics
        this.info = 1 == type;
        this.ok = 2 == type;
        this.clientError = 4 == type;
        this.serverError = 5 == type;
        this.error = (4 == type || 5 == type) ? this.toError() : false;

        // sugar
        this.accepted = 202 == status;
        this.noContent = 204 == status || 1223 == status;
        this.badRequest = 400 == status;
        this.unauthorized = 401 == status;
        this.notAcceptable = 406 == status;
        this.notFound = 404 == status;
        this.forbidden = 403 == status;
    };

    /**
     * Return an `Error` representative of this response.
     *
     * @return {Error}
     * @api public
     */

    Response.prototype.toError = function() {
        var req = this.req;
        var method = req.method;
        var url = req.url;

        var msg = 'cannot ' + method + ' ' + url + ' (' + this.status + ')';
        var err = new Error(msg);
        err.status = this.status;
        err.method = method;
        err.url = url;

        return err;
    };

    /**
     * Expose `Response`.
     */

    request.Response = Response;

    /**
     * Initialize a new `Request` with the given `method` and `url`.
     *
     * @param {String} method
     * @param {String} url
     * @api public
     */

    function Request(method, url) {
        var self = this;
        Emitter.call(this);
        this._query = this._query || [];
        this.method = method;
        this.url = url;
        this.header = {};
        this._header = {};
        this.on('end', function() {
            var res = new Response(self);
            if ('HEAD' == method)
                res.text = null;
            self.callback(null, res);
        });
    }

    /**
     * Mixin `Emitter`.
     */

    Emitter(Request.prototype);

    /**
     * Allow for extension
     */

    Request.prototype.use = function(fn) {
        fn(this);
        return this;
    }
    /**
     * Set timeout to `ms`.
     *
     * @param {Number} ms
     * @return {Request} for chaining
     * @api public
     */

    Request.prototype.timeout = function(ms) {
        this._timeout = ms;
        return this;
    };

    /**
     * Clear previous timeout.
     *
     * @return {Request} for chaining
     * @api public
     */

    Request.prototype.clearTimeout = function() {
        this._timeout = 0;
        clearTimeout(this._timer);
        return this;
    };

    /**
     * Abort the request, and clear potential timeout.
     *
     * @return {Request}
     * @api public
     */

    Request.prototype.abort = function() {
        if (this.aborted)
            return;
        this.aborted = true;
        this.xhr.abort();
        this.clearTimeout();
        this.emit('abort');
        return this;
    };

    /**
     * Set header `field` to `val`, or multiple fields with one object.
     *
     * Examples:
     *
     *      req.get('/')
     *        .set('Accept', 'application/json')
     *        .set('X-API-Key', 'foobar')
     *        .end(callback);
     *
     *      req.get('/')
     *        .set({ Accept: 'application/json', 'X-API-Key': 'foobar' })
     *        .end(callback);
     *
     * @param {String|Object} field
     * @param {String} val
     * @return {Request} for chaining
     * @api public
     */

    Request.prototype.set = function(field, val) {
        if (isObject(field)) {
            for (var key in field) {
                this.set(key, field[key]);
            }
            return this;
        }
        this._header[field.toLowerCase()] = val;
        this.header[field] = val;
        return this;
    };

    /**
     * Get case-insensitive header `field` value.
     *
     * @param {String} field
     * @return {String}
     * @api private
     */

    Request.prototype.getHeader = function(field) {
        return this._header[field.toLowerCase()];
    };

    /**
     * Set Content-Type to `type`, mapping values from `request.types`.
     *
     * Examples:
     *
     *      superagent.types.xml = 'application/xml';
     *
     *      request.post('/')
     *        .type('xml')
     *        .send(xmlstring)
     *        .end(callback);
     *
     *      request.post('/')
     *        .type('application/xml')
     *        .send(xmlstring)
     *        .end(callback);
     *
     * @param {String} type
     * @return {Request} for chaining
     * @api public
     */

    Request.prototype.type = function(type) {
        this.set('Content-Type', request.types[type] || type);
        return this;
    };

    /**
     * Set Accept to `type`, mapping values from `request.types`.
     *
     * Examples:
     *
     *      superagent.types.json = 'application/json';
     *
     *      request.get('/agent')
     *        .accept('json')
     *        .end(callback);
     *
     *      request.get('/agent')
     *        .accept('application/json')
     *        .end(callback);
     *
     * @param {String} accept
     * @return {Request} for chaining
     * @api public
     */

    Request.prototype.accept = function(type) {
        this.set('Accept', request.types[type] || type);
        return this;
    };

    /**
     * Set Authorization field value with `user` and `pass`.
     *
     * @param {String} user
     * @param {String} pass
     * @return {Request} for chaining
     * @api public
     */

    Request.prototype.auth = function(user, pass) {
        var str = btoa(user + ':' + pass);
        this.set('Authorization', 'Basic ' + str);
        return this;
    };

    /**
     * Add query-string `val`.
     *
     * Examples:
     *
     *   request.get('/shoes')
     *     .query('size=10')
     *     .query({ color: 'blue' })
     *
     * @param {Object|String} val
     * @return {Request} for chaining
     * @api public
     */

    Request.prototype.query = function(val) {
        if ('string' != typeof val)
            val = serialize(val);
        if (val)
            this._query.push(val);
        return this;
    };

    /**
     * Write the field `name` and `val` for "multipart/form-data"
     * request bodies.
     *
     * ``` js
     * request.post('/upload')
     *   .field('foo', 'bar')
     *   .end(callback);
     * ```
     *
     * @param {String} name
     * @param {String|Blob|File} val
     * @return {Request} for chaining
     * @api public
     */

    Request.prototype.field = function(name, val) {
        if (!this._formData)
            this._formData = new FormData();
        this._formData.append(name, val);
        return this;
    };

    /**
     * Queue the given `file` as an attachment to the specified `field`,
     * with optional `filename`.
     *
     * ``` js
     * request.post('/upload')
     *   .attach(new Blob(['<a id="a"><b id="b">hey!</b></a>'], { type: "text/html"}))
     *   .end(callback);
     * ```
     *
     * @param {String} field
     * @param {Blob|File} file
     * @param {String} filename
     * @return {Request} for chaining
     * @api public
     */

    Request.prototype.attach = function(field, file, filename) {
        if (!this._formData)
            this._formData = new FormData();
        this._formData.append(field, file, filename);
        return this;
    };

    /**
     * Send `data`, defaulting the `.type()` to "json" when
     * an object is given.
     *
     * Examples:
     *
     *       // querystring
     *       request.get('/search')
     *         .end(callback)
     *
     *       // multiple data "writes"
     *       request.get('/search')
     *         .send({ search: 'query' })
     *         .send({ range: '1..5' })
     *         .send({ order: 'desc' })
     *         .end(callback)
     *
     *       // manual json
     *       request.post('/user')
     *         .type('json')
     *         .send('{"name":"tj"})
     *         .end(callback)
     *
     *       // auto json
     *       request.post('/user')
     *         .send({ name: 'tj' })
     *         .end(callback)
     *
     *       // manual x-www-form-urlencoded
     *       request.post('/user')
     *         .type('form')
     *         .send('name=tj')
     *         .end(callback)
     *
     *       // auto x-www-form-urlencoded
     *       request.post('/user')
     *         .type('form')
     *         .send({ name: 'tj' })
     *         .end(callback)
     *
     *       // defaults to x-www-form-urlencoded
     *      request.post('/user')
     *        .send('name=tobi')
     *        .send('species=ferret')
     *        .end(callback)
     *
     * @param {String|Object} data
     * @return {Request} for chaining
     * @api public
     */

    Request.prototype.send = function(data) {
        var obj = isObject(data);
        var type = this.getHeader('Content-Type');

        // merge
        if (obj && isObject(this._data)) {
            for (var key in data) {
                this._data[key] = data[key];
            }
        } else if ('string' == typeof data) {
            if (!type)
                this.type('form');
            type = this.getHeader('Content-Type');
            if ('application/x-www-form-urlencoded' == type) {
                this._data = this._data ? this._data + '&' + data : data;
            } else {
                this._data = (this._data || '') + data;
            }
        } else {
            this._data = data;
        }

        if (!obj)
            return this;
        if (!type)
            this.type('json');
        return this;
    };

    /**
     * Invoke the callback with `err` and `res`
     * and handle arity check.
     *
     * @param {Error} err
     * @param {Response} res
     * @api private
     */

    Request.prototype.callback = function(err, res) {
        var fn = this._callback;
        if (2 == fn.length)
            return fn(err, res);
        if (err)
            return this.emit('error', err);
        fn(res);
    };

    /**
     * Invoke callback with x-domain error.
     *
     * @api private
     */

    Request.prototype.crossDomainError = function() {
        var err = new Error('Origin is not allowed by Access-Control-Allow-Origin');
        err.crossDomain = true;
        this.callback(err);
    };

    /**
     * Invoke callback with timeout error.
     *
     * @api private
     */

    Request.prototype.timeoutError = function() {
        var timeout = this._timeout;
        var err = new Error('timeout of ' + timeout + 'ms exceeded');
        err.timeout = timeout;
        this.callback(err);
    };

    /**
     * Enable transmission of cookies with x-domain requests.
     *
     * Note that for this to work the origin must not be
     * using "Access-Control-Allow-Origin" with a wildcard,
     * and also must set "Access-Control-Allow-Credentials"
     * to "true".
     *
     * @api public
     */

    Request.prototype.withCredentials = function() {
        this._withCredentials = true;
        return this;
    };

    /**
     * Initiate request, invoking callback `fn(res)`
     * with an instanceof `Response`.
     *
     * @param {Function} fn
     * @return {Request} for chaining
     * @api public
     */

    Request.prototype.end = function(fn) {
        var self = this;
        var xhr = this.xhr = getXHR();
        var query = this._query.join('&');
        var timeout = this._timeout;
        var data = this._formData || this._data;

        // store callback
        this._callback = fn || noop;

        // state change
        xhr.onreadystatechange = function() {
            if (4 != xhr.readyState)
                return;
            if (0 == xhr.status) {
                if (self.aborted)
                    return self.timeoutError();
                return self.crossDomainError();
            }
            self.emit('end');
        };

        // progress
        if (xhr.upload) {
            xhr.upload.onprogress = function(e) {
                e.percent = e.loaded / e.total * 100;
                self.emit('progress', e);
            };
        }

        // timeout
        if (timeout && !this._timer) {
            this._timer = setTimeout(function() {
                self.abort();
            }, timeout);
        }

        // querystring
        if (query) {
            query = request.serializeObject(query);
            this.url += ~this.url.indexOf('?') ? '&' + query : '?' + query;
        }

        // initiate request
        xhr.open(this.method, this.url, true);

        // CORS
        if (this._withCredentials)
            xhr.withCredentials = true;

        // body
        if ('GET' != this.method && 'HEAD' != this.method && 'string' != typeof data && !isHost(data)) {
            // serialize stuff
            var serialize = request.serialize[this.getHeader('Content-Type')];
            if (serialize)
                data = serialize(data);
        }

        // set header fields
        for (var field in this.header) {
            if (null == this.header[field])
                continue;
            xhr.setRequestHeader(field, this.header[field]);
        }

        // send stuff
        this.emit('request', this);
        xhr.send(data);
        return this;
    };

    /**
     * Expose `Request`.
     */

    request.Request = Request;

    /**
     * Issue a request:
     *
     * Examples:
     *
     *    request('GET', '/users').end(callback)
     *    request('/users').end(callback)
     *    request('/users', callback)
     *
     * @param {String} method
     * @param {String|Function} url or callback
     * @return {Request}
     * @api public
     */

    function request(method, url) {
        // callback
        if ('function' == typeof url) {
            return new Request('GET', method).end(url);
        }

        // url first
        if (1 == arguments.length) {
            return new Request('GET', method);
        }

        return new Request(method, url);
    }

    /**
     * GET `url` with optional callback `fn(res)`.
     *
     * @param {String} url
     * @param {Mixed|Function} data or fn
     * @param {Function} fn
     * @return {Request}
     * @api public
     */

    request.get = function(url, data, fn) {
        var req = request('GET', url);
        if ('function' == typeof data)
            fn = data, data = null;
        if (data)
            req.query(data);
        if (fn)
            req.end(fn);
        return req;
    };

    /**
     * HEAD `url` with optional callback `fn(res)`.
     *
     * @param {String} url
     * @param {Mixed|Function} data or fn
     * @param {Function} fn
     * @return {Request}
     * @api public
     */

    request.head = function(url, data, fn) {
        var req = request('HEAD', url);
        if ('function' == typeof data)
            fn = data, data = null;
        if (data)
            req.send(data);
        if (fn)
            req.end(fn);
        return req;
    };

    /**
     * DELETE `url` with optional callback `fn(res)`.
     *
     * @param {String} url
     * @param {Function} fn
     * @return {Request}
     * @api public
     */

    request.del = function(url, fn) {
        var req = request('DELETE', url);
        if (fn)
            req.end(fn);
        return req;
    };

    /**
     * PATCH `url` with optional `data` and callback `fn(res)`.
     *
     * @param {String} url
     * @param {Mixed} data
     * @param {Function} fn
     * @return {Request}
     * @api public
     */

    request.patch = function(url, data, fn) {
        var req = request('PATCH', url);
        if ('function' == typeof data)
            fn = data, data = null;
        if (data)
            req.send(data);
        if (fn)
            req.end(fn);
        return req;
    };

    /**
     * POST `url` with optional `data` and callback `fn(res)`.
     *
     * @param {String} url
     * @param {Mixed} data
     * @param {Function} fn
     * @return {Request}
     * @api public
     */

    request.post = function(url, data, fn) {
        var req = request('POST', url);
        if ('function' == typeof data)
            fn = data, data = null;
        if (data)
            req.send(data);
        if (fn)
            req.end(fn);
        return req;
    };

    /**
     * PUT `url` with optional `data` and callback `fn(res)`.
     *
     * @param {String} url
     * @param {Mixed|Function} data or fn
     * @param {Function} fn
     * @return {Request}
     * @api public
     */

    request.put = function(url, data, fn) {
        var req = request('PUT', url);
        if ('function' == typeof data)
            fn = data, data = null;
        if (data)
            req.send(data);
        if (fn)
            req.end(fn);
        return req;
    };

    /**
     * Expose `request`.
     */

    module.exports = request;

});
require.register("bergie-octo/octo.js", function(exports, require, module) {
    /*!
     * octo.js
     * Copyright (c) 2012 Justin Palmer <justin@labratrevenge.com>
     * MIT Licensed
     */

    (function() {

        if (typeof superagent === 'undefined' && require) {
            superagent = require('superagent');
            if (typeof process !== 'undefined' && process.execPath && process.execPath.indexOf('node') !== -1) {
                btoa = require('btoa');
            }
        }

        var octo = {}

        // The main entry point for interacting with the GitHub API v3.
        //
        //      var gh = octo.api()
        //      gh.get('/events').on('success', function(events) {
        //        console.log(events);
        //      })
        //
        octo.api = function() {
            var host = 'https://api.github.com', agent = superagent, limit, remaining, username, password, token

            function api() {
            }

            function pager(method, path, params) {
                var page = 1, perpage = 30, hasnext = false, hasprev = false, headers = {}, callbacks = {}

                var request = function() {
                    var req = superagent[method](api.host() + path)

                    var complete = function(res) {
                        limit = ~~res.header['x-ratelimit-limit']
                        remaining = ~~res.header['x-ratelimit-remaining']

                        var link = res.header['link']
                        hasnext = (/rel=\"next\"/i).test(link)
                        hasprev = (/rel=\"next\"/).test(link)

                        pager.trigger('end', res)
                        if (res.ok)
                            pager.trigger('success', res)
                        if (res.error)
                            pager.trigger('error', res)
                    }
                    if (token)
                        req.set('Authorization', 'token ' + token)

                    if (!token && username && password)
                        req.set('Authorization', 'Basic ' + btoa(username + ':' + password))

                    req.set(headers).query({
                        page: page,
                        per_page: perpage
                    }).send(params).end(complete)
                }
                // ### Paging
                // Each subsequent request for additional pages can easily share the same callbacks and properties.
                //
                //      var events = api.get('/events').on('end', function(response) {
                //        console.log(response.body);
                //        events.next()
                //        console.log(events.page());
                //      })
                //
                //      events()
                //
                function pager() {
                    request()
                }

                // Sets or gets the current page
                //
                // Returns the pager
                pager.page = function(v) {
                    if (!arguments.length)
                        return page
                    page = v

                    return pager
                }
                // Sets or gets the items returned per page
                //
                // Returns the pager
                pager.perpage = function(v) {
                    if (!arguments.length)
                        return perpage
                    perpage = v

                    return pager
                }
                // Increments the page number by one and fires a requests for the next page
                //
                // Returns the pager
                pager.next = function() {
                    page += 1
                    request()

                    return pager
                }
                // Decrements the page number by one and fires a request for the previous page
                //
                // Returns the pager
                pager.prev = function() {
                    page -= 1
                    request()

                    return pager
                }
                // Determines if the server is reporting a next page of results
                pager.hasnext = function() {
                    return hasnext;
                }
                // Determines if the server is reporting a previous page of results
                pager.hasprev = function() {
                    return hasprev;
                }
                // Registers a callback for an event
                //
                //  Supported events:
                //
                // * `success` - Request was successful
                // * `error` - Request returned an error
                // * `end` - Request is complete
                //
                // Returns a pager
                pager.on = function(event, callback) {
                    if (typeof callbacks[event] == 'undefined')
                        callbacks[event] = []

                    callbacks[event].push(callback)

                    return pager
                }
                // Unregisters a previously registered callback
                pager.off = function(event, callback) {
                    if (callbacks[event] instanceof Array) {
                        var cbacks = callbacks[event], i = 0
                        for (i; i < cbacks.length; i++) {
                            if (cbacks[i] === callback) {
                                cbacks.splice(i, 1)
                                break
                            }
                        }
                    }

                    return pager
                }
                // Triggers a custom event
                pager.trigger = function(event, data) {
                    if (callbacks[event] instanceof Array) {
                        callbacks[event].forEach(function(callback) {
                            callback.call(pager, data)
                        })
                    }

                    return pager
                }
                // Sets a request header
                pager.set = function(key, val) {
                    headers[key] = val
                    return pager
                }

                return pager
            }

            // Sets or gets the GitHub API host
            // Uses https://api.github.com by default
            //
            //      var gh = octo.api().host('https://api.github.com')
            //
            // Returns the api
            api.host = function(val) {
                if (!arguments.length)
                    return host
                host = val
                return api
            }
            // Initializes a GET request to GitHub API v3
            // Returns a pager
            api.get = function(path, params) {
                return new pager('get', path)
            }
            // Initializes a POST request to GitHub API v3
            // Returns a pager
            api.post = function(path, params) {
                return new pager('post', path, params)
            }
            // Initializes a PATCH request to GitHub API v3
            // Returns a pager
            api.patch = function(path, params) {
                return new pager('patch', path, params)
            }
            // Initializes a PUT request to GitHub API v3
            // Returns a pager
            api.put = function(path, params) {
                return new pager('put', path, params)
            }
            // Initializes a DELETE request to GitHub API v3
            // Returns a pager
            api.
                    delete =
                    function(path, params) {
                        return new pager('delete', path, params)
                    }

            // Returns the API rate limit as reported by GitHub
            api.limit = function() {
                return limit
            }
            // Returns the number of requests that can be made before the `limit` is reached
            api.remaining = function() {
                return remaining;
            }
            // Sets or gets the Basic Auth username
            // Returns the api
            api.username = function(v) {
                if (!arguments.length)
                    return username;
                username = v

                return api
            }
            // Sets or gets the Basic Auth password
            // Returns the api
            api.password = function(v) {
                if (!arguments.length)
                    return password;
                password = v

                return api
            }
            // Sets or gets an OAuth two token.  You can temporarily use Basic Auth to create a
            // GitHub Authorization which will grant you an OAuth token.  You can use this token in
            // your scripts
            // Returns the api
            api.token = function(v) {
                if (!arguments.length)
                    return token;
                token = v

                return api
            }

            return api
        }
        if ("undefined" != typeof exports)
            module.exports = octo
        else
            window.octo = octo

    })()

});

require.register("noflo-noflo-graph/index.js", function(exports, require, module) {
    /*
     * This file can be used for general library features of noflo-graph.
     *
     * The library features can be made available as CommonJS modules that the
     * components in this project utilize.
     */

});
require.register("noflo-noflo-graph/component.json", function(exports, require, module) {
    module.exports = JSON.parse('{"name":"noflo-graph","description":"NoFlo components for NoFlo Graph manipulation","author":"Henri Bergius <henri.bergius@iki.fi>","repo":"noflo/noflo-graph","version":"0.1.0","keywords":[],"dependencies":{"noflo/noflo":"*"},"scripts":["components/CreateGraph.js","components/ListenChanges.js","components/LoadGraph.js","components/LoadJson.js","components/SetPropertyValue.js","index.js"],"json":["component.json"],"noflo":{"components":{"CreateGraph":"components/CreateGraph.js","ListenChanges":"components/ListenChanges.js","LoadGraph":"components/LoadGraph.js","LoadJson":"components/LoadJson.js","SetPropertyValue":"components/SetPropertyValue.js"}}}');
});
require.register("noflo-noflo-graph/components/CreateGraph.js", function(exports, require, module) {
    var CreateGraph, noflo, __hasProp = {}.hasOwnProperty, __extends = function(child, parent) {
        for (var key in parent) {
            if (__hasProp.call(parent, key))
                child[key] = parent[key];
        }
        function ctor() {
            this.constructor = child;
        }


        ctor.prototype = parent.prototype;
        child.prototype = new ctor();
        child.__super__ = parent.prototype;
        return child;
    };

    noflo = require('noflo');

    CreateGraph = (function(_super) {
        __extends(CreateGraph, _super);

        CreateGraph.prototype.description = 'Create a NoFlo Graph instance';

        function CreateGraph() {
            this.inPorts = {
                details: new noflo.Port('object')
            };
            this.outPorts = {
                out: new noflo.Port('object')
            };
            this.inPorts.details.on('data', (function(_this) {
                return function(details) {
                    var graph;
                    graph = new noflo.Graph(details.name);
                    graph.setProperties(_this.normalizeProps(details));
                    return _this.outPorts.out.send(graph);
                };
            })(this));
            this.inPorts.details.on('disconnect', (function(_this) {
                return function() {
                    return _this.outPorts.out.disconnect();
                };
            })(this));
        }


        CreateGraph.prototype.normalizeProps = function(details) {
            if (details.type) {
                details.environment = {
                    type: details.type
                };
                delete details.type;
            }
            return details;
        };

        return CreateGraph;

    })(noflo.Component);

    exports.getComponent = function() {
        return new CreateGraph;
    };

});
require.register("noflo-noflo-graph/components/ListenChanges.js", function(exports, require, module) {
    var noflo;

    noflo = require('noflo');

    exports.getComponent = function() {
        var c, listenTransactions, unsubscribe;
        c = new noflo.Component;
        c.description = 'Listen for finished change transctions on a graph';
        listenTransactions = function() {
            return c.outPorts.out.send(c.graph);
        };
        unsubscribe = function() {
            if (c.graph) {
                c.graph.removeListener('endTransaction', listenTransactions);
            }
            return c.outPorts.out.disconnect();
        };
        c.inPorts.add('in', function(event, payload) {
            if (event !== 'data') {
                return;
            }
            unsubscribe();
            c.graph = payload;
            return c.graph.on('endTransaction', listenTransactions);
        });
        c.outPorts.add('out');
        c.shutdown = unsubscribe;
        return c;
    };

});
require.register("noflo-noflo-graph/components/LoadGraph.js", function(exports, require, module) {
    var LoadGraph, noflo, __hasProp = {}.hasOwnProperty, __extends = function(child, parent) {
        for (var key in parent) {
            if (__hasProp.call(parent, key))
                child[key] = parent[key];
        }
        function ctor() {
            this.constructor = child;
        }


        ctor.prototype = parent.prototype;
        child.prototype = new ctor();
        child.__super__ = parent.prototype;
        return child;
    };

    noflo = require('noflo');

    LoadGraph = (function(_super) {
        __extends(LoadGraph, _super);

        LoadGraph.prototype.description = 'Load a JSON or FBP string into a NoFlo graph';

        function LoadGraph() {
            this.inPorts = new noflo.InPorts({
                "in": {
                    datatype: 'string',
                    required: true
                }
            });
            this.outPorts = new noflo.OutPorts({
                out: {
                    datatype: 'object',
                    required: true
                },
                error: {
                    datatype: 'object',
                    required: 'false'
                }
            });
            this.inPorts["in"].on('data', (function(_this) {
                return function(data) {
                    return _this.toGraph(data);
                };
            })(this));
            this.inPorts["in"].on('disconnect', (function(_this) {
                return function() {
                    return _this.outPorts.out.disconnect();
                };
            })(this));
        }


        LoadGraph.prototype.toGraph = function(data) {
            var e;
            if (data.indexOf('->') !== -1) {
                try {
                    noflo.graph.loadFBP(data, (function(_this) {
                        return function(graph) {
                            return _this.outPorts.out.send(graph);
                        };
                    })(this));
                } catch (_error) {
                    e = _error;
                    this.outPorts.error.send(e);
                    this.outPorts.error.disconnect();
                }
                return;
            }
            try {
                return noflo.graph.loadJSON(data, (function(_this) {
                    return function(graph) {
                        return _this.outPorts.out.send(graph);
                    };
                })(this));
            } catch (_error) {
                e = _error;
                this.outPorts.error.send(e);
                return this.outPorts.error.disconnect();
            }
        };

        return LoadGraph;

    })(noflo.Component);

    exports.getComponent = function() {
        return new LoadGraph;
    };

});
require.register("noflo-noflo-graph/components/LoadJson.js", function(exports, require, module) {
    var LoadJson, noflo, __hasProp = {}.hasOwnProperty, __extends = function(child, parent) {
        for (var key in parent) {
            if (__hasProp.call(parent, key))
                child[key] = parent[key];
        }
        function ctor() {
            this.constructor = child;
        }


        ctor.prototype = parent.prototype;
        child.prototype = new ctor();
        child.__super__ = parent.prototype;
        return child;
    };

    noflo = require('noflo');

    LoadJson = (function(_super) {
        __extends(LoadJson, _super);

        LoadJson.prototype.description = 'Convert a Graph JSON structure into a NoFlo Graph';

        function LoadJson() {
            this.inPorts = {
                "in": new noflo.Port('object')
            };
            this.outPorts = {
                out: new noflo.Port('object')
            };
            this.inPorts["in"].on('data', (function(_this) {
                return function(data) {
                    return noflo.graph.loadJSON(data, function(graph) {
                        if ((data.id && graph.properties.id !== data.id) || (data.project && graph.properties.project !== data.project)) {
                            graph.setProperties({
                                id: data.id,
                                project: data.project
                            });
                        }
                        return _this.outPorts.out.send(graph);
                    });
                };
            })(this));
            this.inPorts["in"].on('disconnect', (function(_this) {
                return function() {
                    return _this.outPorts.out.disconnect();
                };
            })(this));
        }

        return LoadJson;

    })(noflo.Component);

    exports.getComponent = function() {
        return new LoadJson;
    };

});
require.register("noflo-noflo-graph/components/SetPropertyValue.js", function(exports, require, module) {
    var SetPropertyValue, noflo, __hasProp = {}.hasOwnProperty, __extends = function(child, parent) {
        for (var key in parent) {
            if (__hasProp.call(parent, key))
                child[key] = parent[key];
        }
        function ctor() {
            this.constructor = child;
        }


        ctor.prototype = parent.prototype;
        child.prototype = new ctor();
        child.__super__ = parent.prototype;
        return child;
    };

    noflo = require('noflo');

    SetPropertyValue = (function(_super) {
        __extends(SetPropertyValue, _super);

        function SetPropertyValue() {
            this.property = null;
            this.value = null;
            this.data = [];
            this.groups = [];
            this.keep = null;
            this.inPorts = {
                property: new noflo.Port('string'),
                value: new noflo.Port('all'),
                "in": new noflo.Port('object'),
                keep: new noflo.Port('boolean')
            };
            this.outPorts = {
                out: new noflo.Port('object')
            };
            this.inPorts.keep.on('data', (function(_this) {
                return function(keep) {
                    return _this.keep = String(keep) === 'true';
                };
            })(this));
            this.inPorts.property.on('data', (function(_this) {
                return function(data) {
                    _this.property = data;
                    if (_this.value && _this.data.length) {
                        return _this.addProperties();
                    }
                };
            })(this));
            this.inPorts.value.on('data', (function(_this) {
                return function(data) {
                    _this.value = data;
                    if (_this.property && _this.data.length) {
                        return _this.addProperties();
                    }
                };
            })(this));
            this.inPorts["in"].on('begingroup', (function(_this) {
                return function(group) {
                    return _this.groups.push(group);
                };
            })(this));
            this.inPorts["in"].on('data', (function(_this) {
                return function(data) {
                    if (_this.property && _this.value) {
                        _this.addProperty({
                            data: data,
                            group: _this.groups.slice(0)
                        });
                        return;
                    }
                    return _this.data.push({
                        data: data,
                        group: _this.groups.slice(0)
                    });
                };
            })(this));
            this.inPorts["in"].on('endgroup', (function(_this) {
                return function() {
                    return _this.groups.pop();
                };
            })(this));
            this.inPorts["in"].on('disconnect', (function(_this) {
                return function() {
                    if (_this.property && _this.value) {
                        _this.outPorts.out.disconnect();
                    }
                    if (!_this.keep) {
                        return _this.value = null;
                    }
                };
            })(this));
        }


        SetPropertyValue.prototype.addProperty = function(object) {
            var group, props, _i, _j, _len, _len1, _ref, _ref1, _results;
            props = {};
            props[this.property] = this.value;
            object.data.setProperties(props);
            _ref = object.group;
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                group = _ref[_i];
                this.outPorts.out.beginGroup(group);
            }
            this.outPorts.out.send(object.data);
            _ref1 = object.group;
            _results = [];
            for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
                group = _ref1[_j];
                _results.push(this.outPorts.out.endGroup());
            }
            return _results;
        };

        SetPropertyValue.prototype.addProperties = function() {
            var object, _i, _len, _ref;
            _ref = this.data;
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                object = _ref[_i];
                this.addProperty(object);
            }
            this.data = [];
            return this.outPorts.out.disconnect();
        };

        return SetPropertyValue;

    })(noflo.Component);

    exports.getComponent = function() {
        return new SetPropertyValue;
    };

});

require.register("gjohnson-uuid/index.js", function(exports, require, module) {

    /**
     * Taken straight from jed's gist: https://gist.github.com/982883
     *
     * Returns a random v4 UUID of the form xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx,
     * where each x is replaced with a random hexadecimal digit from 0 to f, and
     * y is replaced with a random hexadecimal digit from 8 to b.
     */

    module.exports = function uuid(a) {
        return a// if the placeholder was passed, return
                ? (// a random number from 0 to 15
                        a ^ // unless b is 8,
                        Math.random()// in which case
                        * 16// a random number from
                        >> a / 4 // 8 to 11
                        ).toString(16)// in hexadecimal
                : (// or otherwise a concatenated string:
                        [1e7] + // 10000000 +
                        -1e3 + // -1000 +
                        -4e3 + // -4000 +
                        -8e3 + // -80000000 +
                        -1e11 // -100000000000,
                        ).replace(// replacing
                /[018]/g, // zeroes, ones, and eights with
                uuid // random hex digits
                )
    };
});
require.register("noflo-ui/component.json", function(exports, require, module) {
    module.exports = JSON.parse('{"name":"noflo-ui","description":"NoFlo Development Environment","author":"Henri Bergius <henri.bergius@iki.fi>","repo":"noflo/noflo-ui","version":"0.1.8","keywords":["fbp","noflo","graph","visual","dataflow"],"dependencies":{"noflo/noflo":"*","noflo/noflo-strings":"*","noflo/noflo-ajax":"*","noflo/noflo-localstorage":"*","noflo/noflo-interaction":"*","noflo/noflo-objects":"*","noflo/noflo-groups":"*","noflo/noflo-dom":"*","noflo/noflo-core":"*","noflo/noflo-polymer":"*","noflo/noflo-indexeddb":"*","noflo/noflo-github":"*","noflo/noflo-graph":"*","noflo/noflo-runtime":"*","the-grid/flowhub-registry":"*","gjohnson/uuid":"*"},"noflo":{"components":{"GenerateId":"components/GenerateId.js","GetNode":"components/GetNode.js"}},"scripts":["components/GenerateId.js","components/GetNode.js"],"json":["component.json"],"files":["css/noflo-ui.css"]}');
});

require.register("noflo-ui/components/GenerateId.js", function(exports, require, module) {
    var GenerateId, noflo, __hasProp = {}.hasOwnProperty, __extends = function(child, parent) {
        for (var key in parent) {
            if (__hasProp.call(parent, key))
                child[key] = parent[key];
        }
        function ctor() {
            this.constructor = child;
        }


        ctor.prototype = parent.prototype;
        child.prototype = new ctor();
        child.__super__ = parent.prototype;
        return child;
    };

    noflo = require('noflo');

    GenerateId = (function(_super) {
        __extends(GenerateId, _super);

        function GenerateId() {
            this.inPorts = {
                start: new noflo.Port('object')
            };
            this.outPorts = {
                out: new noflo.Port('string')
            };
            this.inPorts.start.on('data', (function(_this) {
                return function(data) {
                    var id;
                    id = _this.randomString();
                    if (data.id) {
                        id = data.id;
                    }
                    if (data.properties && data.properties.id) {
                        id = data.properties.id;
                    }
                    _this.outPorts.out.send(id);
                    return _this.outPorts.out.disconnect();
                };
            })(this));
        }


        GenerateId.prototype.randomString = function(num) {
            if (num == null) {
                num = 60466176;
            }
            num = Math.floor(Math.random() * num);
            return num.toString(36);
        };

        return GenerateId;

    })(noflo.Component);

    exports.getComponent = function() {
        return new GenerateId;
    };

});

require.register("noflo-ui/components/GetNode.js", function(exports, require, module) {
    var GetNode, noflo, __hasProp = {}.hasOwnProperty, __extends = function(child, parent) {
        for (var key in parent) {
            if (__hasProp.call(parent, key))
                child[key] = parent[key];
        }
        function ctor() {
            this.constructor = child;
        }


        ctor.prototype = parent.prototype;
        child.prototype = new ctor();
        child.__super__ = parent.prototype;
        return child;
    };

    noflo = require('noflo');

    GetNode = (function(_super) {
        __extends(GetNode, _super);

        function GetNode() {
            this.projects = [];
            this.inPorts = new noflo.InPorts({
                route: {
                    datatype: 'object',
                    description: 'A route object'
                },
                projects: {
                    datatype: 'array',
                    description: 'Set of NoFlo UI projects'
                }
            });
            this.outPorts = new noflo.OutPorts({
                project: {
                    datatype: 'object'
                },
                graph: {
                    datatype: 'object'
                },
                component: {
                    datatype: 'object'
                },
                example: {
                    datatype: 'string'
                },
                runtime: {
                    datatype: 'string'
                }
            });
            this.inPorts.projects.on('data', (function(_this) {
                return function(projects) {
                    _this.projects = projects;
                };
            })(this));
            this.inPorts.route.on('data', (function(_this) {
                return function(route) {
                    return _this.getNodes(route);
                };
            })(this));
            this.inPorts.route.on('disconnect', (function(_this) {
                return function() {
                    _this.outPorts.project.disconnect();
                    _this.outPorts.graph.disconnect();
                    _this.outPorts.component.disconnect();
                    _this.outPorts.runtime.disconnect();
                    return _this.outPorts.example.disconnect();
                };
            })(this));
        }


        GetNode.prototype.getGraph = function(project, id) {
            var graph, _i, _len, _ref;
            if (!project.graphs) {
                return;
            }
            _ref = project.graphs;
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                graph = _ref[_i];
                if (graph.properties.id === id) {
                    return graph;
                }
            }
        };

        GetNode.prototype.getComponent = function(project, id) {
            var component, _i, _len, _ref;
            if (!project.components) {
                return;
            }
            _ref = project.components;
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                component = _ref[_i];
                if (component.name === id) {
                    return component;
                }
            }
        };

        GetNode.prototype.getByComponent = function(project, componentName) {
            var component, graph, library, name, _ref;
            _ref = componentName.split('/'), library = _ref[0], name = _ref[1];
            if (!name) {
                name = library;
                library =
                        void 0;
            }
            graph = this.getGraph(project, name);
            if (graph) {
                return ['graph', graph];
            }
            component = this.getComponent(project, name);
            if (component) {
                return ['component', component];
            }
            return ['runtime', componentName];
        };

        GetNode.prototype.findLocal = function(project, route) {
            var component, currentGraph, currentNode, nodeId, type, _ref;
            if (route.route === 'component') {
                component = this.getComponent(project, route.component);
                if (!component) {
                    return;
                }
                this.outPorts.component.send(component);
                return;
            }
            currentGraph = this.getGraph(project, route.graph);
            if (!currentGraph) {
                return;
            }
            this.outPorts.graph.send(currentGraph);
            while (route.nodes.length) {
                nodeId = decodeURIComponent(route.nodes.shift());
                currentNode = currentGraph.getNode(nodeId);
                if (!(currentNode && currentNode.component)) {
                    return;
                }
                _ref = this.getByComponent(project, currentNode.component), type = _ref[0], currentGraph = _ref[1];
                if (!currentGraph) {
                    return;
                }
                if (type === 'component') {
                    this.outPorts.component.send(currentGraph);
                    return;
                }
                if (type === 'runtime') {
                    this.outPorts.runtime.send(currentGraph);
                    return;
                }
                this.outPorts.graph.send(currentGraph);
            }
        };

        GetNode.prototype.getNodes = function(route) {
            var p, project, _i, _len, _ref;
            this.outPorts.component.send(null);
            switch (route.route) {
                case 'main':
                    this.outPorts.project.send(null);
                    return;
                case 'example':
                    this.outPorts.project.send(null);
                    this.outPorts.example.send(route.graphs[0]);
                    return;
            }
            if (!route.project) {
                return;
            }
            if (!this.projects.length) {
                return;
            }
            project = null;
            _ref = this.projects;
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                p = _ref[_i];
                if (p.id === decodeURIComponent(route.project)) {
                    project = p;
                }
            }
            if (!project) {
                return;
            }
            this.outPorts.project.send(project);
            return this.findLocal(project, route);
        };

        return GetNode;

    })(noflo.Component);

    exports.getComponent = function() {
        return new GetNode;
    };

});

require.alias("bergie-emitter/index.js", "noflo-noflo/deps/events/index.js");
require.alias("bergie-octo/octo.js", "bergie-octo/index.js");
require.alias("broofa-node-uuid/uuid.js", "broofa-node-uuid/index.js");
require.alias("component-emitter/index.js", "visionmedia-superagent/deps/emitter/index.js");
require.alias("component-reduce/index.js", "visionmedia-superagent/deps/reduce/index.js");
require.alias("component-underscore/index.js", "noflo-noflo/deps/underscore/index.js");
require.alias("gjohnson-uuid/index.js", "noflo-ui/deps/uuid/index.js");
require.alias("gjohnson-uuid/index.js", "uuid/index.js");
require.alias("noflo-noflo/src/components/Graph.js", "noflo-ui/deps/noflo/src/components/Graph.js");
require.alias("noflo-noflo/src/lib/BasePort.js", "noflo-ui/deps/noflo/src/lib/BasePort.js");
require.alias("noflo-noflo/src/lib/Component.js", "noflo-ui/deps/noflo/src/lib/Component.js");
require.alias("noflo-noflo/src/lib/ComponentLoader.js", "noflo-ui/deps/noflo/src/lib/ComponentLoader.js");
require.alias("noflo-noflo/src/lib/Graph.js", "noflo-ui/deps/noflo/src/lib/Graph.js");
require.alias("noflo-noflo/src/lib/Helpers.js", "noflo-ui/deps/noflo/src/lib/Helpers.js");
require.alias("noflo-noflo/src/lib/NoFlo.js", "noflo-noflo/index.js");
require.alias("noflo-noflo/src/lib/NoFlo.js", "noflo-ui/deps/noflo/index.js");
require.alias("noflo-noflo/src/lib/NoFlo.js", "noflo-ui/deps/noflo/src/lib/NoFlo.js");
require.alias("noflo-noflo/src/lib/NoFlo.js", "noflo/index.js");
require.alias("noflo-noflo/src/lib/Platform.js", "noflo-ui/deps/noflo/src/lib/Platform.js");
require.alias("noflo-noflo/src/lib/Port.js", "noflo-ui/deps/noflo/src/lib/Port.js");
require.alias("noflo-noflo/src/lib/Ports.js", "noflo-ui/deps/noflo/src/lib/Ports.js");
require.alias("noflo-noflo/src/lib/Utils.js", "noflo-ui/deps/noflo/src/lib/Utils.js");
require.alias("visionmedia-superagent/lib/client.js", "bergie-octo/deps/superagent/index.js");
require.alias("visionmedia-superagent/lib/client.js", "bergie-octo/deps/superagent/lib/client.js");
require.alias("visionmedia-superagent/lib/client.js", "visionmedia-superagent/index.js");