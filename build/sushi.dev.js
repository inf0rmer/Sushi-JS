(function () {
/**
 * almond 0.0.3 Copyright (c) 2011, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/almond for details
 */
/*jslint strict: false, plusplus: false */
/*global setTimeout: false */

var requirejs, require, define;
(function (undef) {

    var defined = {},
        waiting = {},
        aps = [].slice,
        main, req;

    if (typeof define === "function") {
        //If a define is already in play via another AMD loader,
        //do not overwrite.
        return;
    }

    /**
     * Given a relative module name, like ./something, normalize it to
     * a real name that can be mapped to a path.
     * @param {String} name the relative name
     * @param {String} baseName a real name that the name arg is relative
     * to.
     * @returns {String} normalized name
     */
    function normalize(name, baseName) {
        //Adjust any relative paths.
        if (name && name.charAt(0) === ".") {
            //If have a base name, try to normalize against it,
            //otherwise, assume it is a top-level require that will
            //be relative to baseUrl in the end.
            if (baseName) {
                //Convert baseName to array, and lop off the last part,
                //so that . matches that "directory" and not name of the baseName's
                //module. For instance, baseName of "one/two/three", maps to
                //"one/two/three.js", but we want the directory, "one/two" for
                //this normalization.
                baseName = baseName.split("/");
                baseName = baseName.slice(0, baseName.length - 1);

                name = baseName.concat(name.split("/"));

                //start trimDots
                var i, part;
                for (i = 0; (part = name[i]); i++) {
                    if (part === ".") {
                        name.splice(i, 1);
                        i -= 1;
                    } else if (part === "..") {
                        if (i === 1 && (name[2] === '..' || name[0] === '..')) {
                            //End of the line. Keep at least one non-dot
                            //path segment at the front so it can be mapped
                            //correctly to disk. Otherwise, there is likely
                            //no path mapping for a path starting with '..'.
                            //This can still fail, but catches the most reasonable
                            //uses of ..
                            break;
                        } else if (i > 0) {
                            name.splice(i - 1, 2);
                            i -= 2;
                        }
                    }
                }
                //end trimDots

                name = name.join("/");
            }
        }
        return name;
    }

    function makeRequire(relName, forceSync) {
        return function () {
            //A version of a require function that passes a moduleName
            //value for items that may need to
            //look up paths relative to the moduleName
            return req.apply(undef, aps.call(arguments, 0).concat([relName, forceSync]));
        };
    }

    function makeNormalize(relName) {
        return function (name) {
            return normalize(name, relName);
        };
    }

    function makeLoad(depName) {
        return function (value) {
            defined[depName] = value;
        };
    }

    function callDep(name) {
        if (waiting.hasOwnProperty(name)) {
            var args = waiting[name];
            delete waiting[name];
            main.apply(undef, args);
        }
        return defined[name];
    }

    /**
     * Makes a name map, normalizing the name, and using a plugin
     * for normalization if necessary. Grabs a ref to plugin
     * too, as an optimization.
     */
    function makeMap(name, relName) {
        var prefix, plugin,
            index = name.indexOf('!');

        if (index !== -1) {
            prefix = normalize(name.slice(0, index), relName);
            name = name.slice(index + 1);
            plugin = callDep(prefix);

            //Normalize according
            if (plugin && plugin.normalize) {
                name = plugin.normalize(name, makeNormalize(relName));
            } else {
                name = normalize(name, relName);
            }
        } else {
            name = normalize(name, relName);
        }

        //Using ridiculous property names for space reasons
        return {
            f: prefix ? prefix + '!' + name : name, //fullName
            n: name,
            p: plugin
        };
    }

    main = function (name, deps, callback, relName) {
        var args = [],
            usingExports,
            cjsModule, depName, i, ret, map;

        //Use name if no relName
        if (!relName) {
            relName = name;
        }

        //Call the callback to define the module, if necessary.
        if (typeof callback === 'function') {

            //Default to require, exports, module if no deps if
            //the factory arg has any arguments specified.
            if (!deps.length && callback.length) {
                deps = ['require', 'exports', 'module'];
            }

            //Pull out the defined dependencies and pass the ordered
            //values to the callback.
            for (i = 0; i < deps.length; i++) {
                map = makeMap(deps[i], relName);
                depName = map.f;

                //Fast path CommonJS standard dependencies.
                if (depName === "require") {
                    args[i] = makeRequire(name);
                } else if (depName === "exports") {
                    //CommonJS module spec 1.1
                    args[i] = defined[name] = {};
                    usingExports = true;
                } else if (depName === "module") {
                    //CommonJS module spec 1.1
                    cjsModule = args[i] = {
                        id: name,
                        uri: '',
                        exports: defined[name]
                    };
                } else if (defined.hasOwnProperty(depName) || waiting.hasOwnProperty(depName)) {
                    args[i] = callDep(depName);
                } else if (map.p) {
                    map.p.load(map.n, makeRequire(relName, true), makeLoad(depName), {});
                    args[i] = defined[depName];
                } else {
                    throw name + ' missing ' + depName;
                }
            }

            ret = callback.apply(defined[name], args);

            if (name) {
                //If setting exports via "module" is in play,
                //favor that over return value and exports. After that,
                //favor a non-undefined return value over exports use.
                if (cjsModule && cjsModule.exports !== undef) {
                    defined[name] = cjsModule.exports;
                } else if (!usingExports) {
                    //Use the return value from the function.
                    defined[name] = ret;
                }
            }
        } else if (name) {
            //May just be an object definition for the module. Only
            //worry about defining if have a module name.
            defined[name] = callback;
        }
    };

    requirejs = req = function (deps, callback, relName, forceSync) {
        if (typeof deps === "string") {

            //Just return the module wanted. In this scenario, the
            //deps arg is the module name, and second arg (if passed)
            //is just the relName.
            //Normalize module name, if it contains . or ..
            return callDep(makeMap(deps, callback).f);
        } else if (!deps.splice) {
            //deps is a config object, not an array.
            //Drop the config stuff on the ground.
            if (callback.splice) {
                //callback is an array, which means it is a dependency list.
                //Adjust args if there are dependencies
                deps = callback;
                callback = arguments[2];
            } else {
                deps = [];
            }
        }

        //Simulate async callback;
        if (forceSync) {
            main(undef, deps, callback, relName);
        } else {
            setTimeout(function () {
                main(undef, deps, callback, relName);
            }, 15);
        }

        return req;
    };

    /**
     * Just drops the config on the floor, but returns req in case
     * the config return value is used.
     */
    req.config = function () {
        return req;
    };

    /**
     * Export require as a global, but only if it does not already exist.
     */
    if (!require) {
        require = req;
    }

    define = function (name, deps, callback) {

        //This module may not have dependencies
        if (!deps.splice) {
            //deps is not an array, so probably means
            //an object literal or factory function for
            //the value. Adjust args.
            callback = deps;
            deps = [];
        }

        if (define.unordered) {
            waiting[name] = [name, deps, callback];
        } else {
            main(name, deps, callback);
        }
    };

    define.amd = {
        jQuery: true
    };
}());
define("almond.js", function(){});

/**
 * Sushi Core
 *
 * @module Sushi
 */
/*global Sushi:true, define:true*/
define('sushi.core',
    [],
    
	/**
	 * Sushi Core
	 *
	 * @namespace Sushi
	 * @class core
	 */
    function() {
    	var root = this,
    	previousSushi = root.Sushi,
    	Sushi = root.Sushi = root.$ = function( selector, context ) {
    		return Sushi.fn( selector, context )
    	},
    	
    	_$ = window.$,
    	
    	VERSION = '1.0',
    	
    	fn = function() {
    		return Sushi;
    	}
    	
    	noConflict = function() {
    		if (root.$ === Sushi) {
    			root.$ = _$;
    		}
    		root.Sushi = previousSushi;
    		return Sushi;
    	},
		/**
		 * A utility that non-destructively defines namespaces
		 *
		 * @method namespace
		 * @param {String} namespaceString Name of namespace to create
		 * @return {Object} Namespaced object
		 */
		namespace = function(namespaceString, global) {   			
			global = (!global) ? Sushi : global;
			
			var parts = namespaceString.split('.'),
				parent = global,
				i;
		
			// Strip redundant leading global
			if (parts[0] === 'Sushi') {
				parts = parts.slice(1);
			}
		
			for (i = 0, len = parts.length; i < len; i+=1) {
				// Create a property if it doesn't exist
				if (typeof parent[parts[i]] === 'undefined') {
					parent[parts[i]] = {};
				}
				parent = parent[parts[i]];
			}
		
			return parent;			
		},
	
		/**
		 * Simple extending (shallow copying) utility.
		 *
		 * @method extend
		 * @param {Object} obj Object to copy properties to
		 * @param {Object} extension Object to copy properties from
		 * @param {Boolean} override Should extend override existing properties?
		 * @return {Object} Extended object
		 */
		extend = function(obj, extension, override) {
			obj = obj || {};
			extension = extension || {};
			var prop;
			if (override === false) {
				for (prop in extension)
					if (!(prop in obj))
						obj[prop] = extension[prop];
			} else {
				for (prop in extension)
					obj[prop] = extension[prop];
						if (extension.toString !== Object.prototype.toString)
							obj.toString = extension.toString;
			}
			
			return obj;
		},
		
		Class = function() {
			var len = arguments.length,
				body = arguments[len - 1],
				SuperClass = len > 1 ? arguments[0] : null,
				hasImplementClasses = len > 2,
				Class, 
				SuperClassEmpty;
		
			if (body.constructor === Object) {
				Class = function() {};
			} else {
				Class = body.constructor;
				delete body.constructor;
			}
		
			if (SuperClass) {
				SuperClassEmpty = function() {};
				SuperClassEmpty.prototype = SuperClass.prototype;
				Class.prototype = new SuperClassEmpty();
				Class.prototype.constructor = Class;
				Class.Super = SuperClass;
				Sushi.extend(Class, SuperClass, false);
			}
		
			if (hasImplementClasses)
				for (var i = 1; i < len - 1; i++)
					Sushi.extend(Class.prototype, arguments[i].prototype, false);    
		
			Sushi.extendClass(Class, body);
		
			return Class;
		},
		
		/**
		 * @method extendClass
		 * @param {Function} Class the Class to extend
		 * @param {Object} extension Properties to extend the class with
		 * @param {Boolean} override Should override existing properties?
		 * 
		 * Usage:
		 *	 extendClass(Person, {
		 *		  newMethod1: function() {
		 *			...
		 *		  },
		 *		  newMethod2: function() {
		 *			...
		 *		  },
		 *		  newMethod3: function() {
		 *			...
		 *		  }
		 *	});
		 */
		extendClass = function(Class, extension, override) {
			if (extension.STATIC) {
				extend(Class, extension.STATIC, override);
				delete extension.STATIC;
			}
			Sushi.extend(Class.prototype, extension, override)
		}
	
    	// Sync global Sushi variable to namespaced one
    	extend(this.Sushi, {
    		VERSION: VERSION,
    		fn: fn,
    		noConflict: noConflict,
    		namespace: namespace,
    		extend: extend,
    		Class: Class,
    		extendClass: extendClass
    	});
    	
    	return this.Sushi;
    }
);

/*
 * Sushi.utils - General purpose utility functions for the Sushi JS framework
 *
 */
define('sushi.utils',
	// Module dependencies
	[
		'sushi.core'
	],
	
	/**
	 * General purpose utility functions for the Sushi JS framework
	 *
	 * @namespace Sushi
	 * @class utils
	 */
	function(Sushi, collection) {
		var _utilsNs = Sushi.namespace('utils'),
		    _ArrayProto = Array.prototype,
		    _FuncProto = Function.prototype,
		    _nativeIsArray = _ArrayProto.isArray,
		    _nativeBind = _FuncProto.bind,
		    hasOwnProperty = Object.prototype.hasOwnProperty,
		    ctor = function(){},
		    _idCounter = 0;

		// Generic utility methods
		Sushi.extend(Sushi.utils, {
			/**
		     * Generates a unique integer ID (within the client session)
		     *
		     * @method uniqueId
		     * @param prefix Optional prefix to prepend to the unique ID
		     *
		     * @return Unique ID
		     */
			uniqueId: function(prefix) {
				var id = _idCounter++;
				return prefix ? prefix + id : id;
			},
			
			/**
		     * Default iterator object
		     *
		     * @method identity
		     * @param value Value to return
		     *
		     * @return Value passed in to the function
		     */
			identity: function(value) {
				return value;
			},
			
			// Function methods
			/**
			 * Create a function bound to a given object (assigning this, and arguments, optionally).
			 * Delegates to ECMAScript 5's native Function.bind if available.
			 *
			 * @method bind
			 * @param {Function} func Function to be bound
			 * @param {Object} context The value of "this" inside the function
			 *
			 * @return {Function} Bound function
			 */ 
			bind: function bind(func, context) {
				var bound, args;
				if (func.bind === _nativeBind && _nativeBind) return _nativeBind.apply(func, _ArrayProto.slice.call(arguments, 1));
				if (!Sushi.utils.isFunction(func)) throw new TypeError;
				args = _ArrayProto.slice.call(arguments, 2);
				
				return bound = function() {
				  	if (!(this instanceof bound)) return func.apply(context, args.concat(_ArrayProto.slice.call(arguments)));
				  	ctor.prototype = func.prototype;
				  	var self = new ctor;
				  	var result = func.apply(self, args.concat(slice.call(arguments)));
				  	if (Object(result) === result) return result;
				  	return self;
				};
			},
			
			/**
			* Alias for hasOwnProperty
			*
			*/
			has: function(obj, key) {
				return hasOwnProperty.call(obj, key);
			},
			
			// Utility "is" methods. Lifted from Underscore.js
			/**
			 * Checks if an object is empty
			 *
			 * @method isEmpty
			 * @param obj Object to test
			 *
			 * @return {Boolean} Whether argument is empty or not
			 */
			isEmpty: function(obj) {
				if (this.isArray(obj) || this.isString(obj)) { return (obj.length === 0); }
				
				for (var key in obj) {
					if (hasOwnProperty.call(obj, key)) { return false; }
				}
				
				return true;
			},
			
			/**
			 * Checks if an object is a DOM node
			 *
			 * @method isElement
			 * @param obj Object to test
			 *
			 * @return {Boolean} Whether argument is a DOM node or not
			 */
			isElement: function(obj) {
			    return !!(obj && obj.nodeType == 1);
			},
			
			/**
			 * Checks if an object is a function
			 *
			 * @method isFunction
			 * @param obj Object to test
			 *
			 * @return {Boolean} Whether argument is a function or not
			 */
			isFunction: function(obj) {
				return !!(obj && obj.constructor && obj.call && obj.apply);
			},

			// Is a given value a string?
			isString: function(obj) {
				return !!(obj === '' || (obj && obj.charCodeAt && obj.substr));
			},
			
			/**
		     * Detects whether a value is a number
		     *
		     * @method isNumber
		     * @param number Value to test
		     * 
		     * @return {Boolean} Whether value is a number or not.
		     */
			isNumber: function(number) {
		        return (typeof number == "number");
		    },
		
			/**
			 * Checks for array-ness
			 *
			 * @method isArray
			 * @param array Argument to test
			 *
			 * @return {Boolean} Whether argument is an array or not
			 */
			isArray: function(array) {
			    if (_nativeIsArray && Array.isArray === _nativeIsArray) {
			        return Array.isArray.call(array);
			    } else {
			        return (Object.prototype.toString.call(array) === "[object Array]");
			    }
			},

			/**
			 * Checks whether a given variable is an arguments object
			 *
			 * @method isArguments
			 * @param obj Variable to test
			 *
			 * @return {Boolean} Whether variable is an arguments object
			 */
			isArguments: function(obj) {
	            return !!(obj && hasOwnProperty.call(obj, 'callee'));
	        },
	        
	        /**
			 * Checks whether a given variable is a date
			 *
			 * @method isDate
			 * @param obj Variable to test
			 *
			 * @return {Boolean} Whether variable is a date
			 */
	        isDate: function(obj) {
                return !!(obj && obj.getTimezoneOffset && obj.setUTCFullYear);
            },
			
			/**
			 * Performs a deep comparison to check if two objects are equal.
			 *
			 * @method isEqual
			 * @param a First object
			 * @param b Second object
			 *
			 * @return {Boolean} Whether objects are equal or not
			 */
			isEqual: function(a, b, stack) {
				if (this.isUndefined(stack)) stack = [];
				// Identical objects are equal. `0 === -0`, but they aren't identical.
				// See the Harmony `egal` proposal: http://wiki.ecmascript.org/doku.php?id=harmony:egal.
				if (a === b) return a !== 0 || 1 / a == 1 / b;
				// A strict comparison is necessary because `null == undefined`.
				if (a == null || b == null) return a === b;
				// Unwrap any wrapped objects.
				if (a._chain) a = a._wrapped;
				if (b._chain) b = b._wrapped;
				// Invoke a custom `isEqual` method if one is provided.
				if (this.isFunction(a.isEqual)) return a.isEqual(b);
				if (this.isFunction(b.isEqual)) return b.isEqual(a);
				// Compare `[[Class]]` names.
				var className = toString.call(a);
				if (className != toString.call(b)) return false;
				switch (className) {
				  	// Strings, numbers, dates, and booleans are compared by value.
				  	case '[object String]':
						// Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
						// equivalent to `new String("5")`.
						return String(a) == String(b);
				  	case '[object Number]':
						a = +a;
						b = +b;
						// `NaN`s are equivalent, but non-reflexive. An `egal` comparison is performed for
						// other numeric values.
						return a != a ? b != b : (a == 0 ? 1 / a == 1 / b : a == b);
				  	case '[object Date]':
				  	case '[object Boolean]':
						// Coerce dates and booleans to numeric primitive values. Dates are compared by their
						// millisecond representations. Note that invalid dates with millisecond representations
						// of `NaN` are not equivalent.
						return +a == +b;
				  	// RegExps are compared by their source patterns and flags.
				  	case '[object RegExp]':
						return a.source == b.source &&
						   a.global == b.global &&
						   a.multiline == b.multiline &&
						   a.ignoreCase == b.ignoreCase;
				}
				
				if (typeof a != 'object' || typeof b != 'object') return false;
				// Assume equality for cyclic structures. The algorithm for detecting cyclic
				// structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
				var length = stack.length;
				while (length--) {
				 	// Linear search. Performance is inversely proportional to the number of
				  	// unique nested structures.
				  	if (stack[length] == a) return true;
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
					  		if (!(result = size in a == size in b && this.isEqual(a[size], b[size], stack))) break;
						}
				  	}
				} else {
				  	// Objects with different constructors are not equivalent.
				  	if ("constructor" in a != "constructor" in b || a.constructor != b.constructor) return false;
				  	// Deep compare objects.
				  	for (var key in a) {
						if (hasOwnProperty.call(a, key)) {
					  	// Count the expected number of properties.
					  	size++;
					  	// Deep compare each member.
					  	if (!(result = hasOwnProperty.call(b, key) && this.isEqual(a[key], b[key], stack))) break;
					}
					}
				
					// Ensure that both objects contain the same number of properties.
					if (result) {
						for (key in b) {
							if (hasOwnProperty.call(b, key) && !(size--)) break;
						}
						result = !size;
					}
				}
				// Remove the first object from the stack of traversed objects.
				stack.pop();
				return result;
			},
			
			/**
			 * Checks if an object is NaN
			 * NaN happens to be the only object in Javascript that is not equal to itself.
			 *
			 * @method isNaN
			 * @param obj Object to test
			 *
			 * @return {Boolean} Whether argument is NaN or not
			 */
			isNaN: function(obj) {
			    /*jsl:ignore*/
				return obj !== obj;
				/*jsl:end*/
			},
			
			/**
			 * Checks if an object is a Regular Expression
			 *
			 * @method isRegExp
			 * @param obj Object to test
			 *
			 * @return {Boolean} Whether argument is a RegExp or not
			 */
			isRegExp: function(obj) {
				return !!(obj && obj.test && obj.exec && (obj.ignoreCase || obj.ignoreCase === false));
			},
			
			/**
			 * Checks if an object's value is equal to null
			 *
			 * @method isNull
			 * @param obj Object to test
			 *
			 * @return {Boolean} Whether argument is equal to null or not
			 */
			isNull: function(obj) {
				return obj === null;
			},

			/**
			 * Checks if an object is equal to undefined
			 *
			 * @method isUndefined
			 * @param obj Object to test
			 *
			 * @return {Boolean} Whether argument is equal to undefined or not
			 */
			isUndefined: function(obj) {
				return (obj === undefined);
			},
			
			/**
			 * Checks if parameter is an object
			 *
			 * @method isObject
			 * @param {mixed} obj Object to test
			 *
			 * @return {Boolean}
			 */
			isObject: function(obj) {
				return obj === Object(obj);
		  	}
		});
		
		return Sushi.utils;
	}
);
define('sushi.utils.debug',
    ['sushi.core', 'sushi.utils'],
    
    /**
	 * Defines several safe debugging methods
	 */
    function(Sushi, utils) {
		// Cached logging history
		var _history = [],
		
		/**
		 * Returns the debugging methods the environment supports
		 *
		 * @returns {Object} Supported debugging methods
		 */
		_supports = (function(){
			return {
				log: window.console.log || false,
				warn: window.console.warn || false,
				error: window.console.error || false,
				dir: window.console.dir || false
			};
		})(),
		
		// Local ref for easy converting to real arrays
		_slice = Array.prototype.slice,
		
		/**
		 * Logs comma-separated arguments to the console using console.log()
		 *
		 * @param Values to be logged
		 */
		log = function() {
			// Turn the arguments object into a real array
			var args = _slice.call(arguments);
			
		    if (_supports.log) {
		    	for (var i = 0, len = args.length; i < len; i++) {
		    		_history.push(args[i]);
					console.log(args[i]);
				}
		    }
		},
		
		/**
		 * Logs comma-separated arguments to the console using console.error()
		 *
		 * @param Values to be logged
		 */
		error = function() {
			// Turn the arguments object into a real array
			var args = _slice.call(arguments);
			
		    if (_supports.error) {
		    	for (var i = 0, len = args.length; i < len; i++) {
		    		_history.push(args[i]);
					console.error(args[i]);
				}
		    }
		},
		
		/**
		 * Logs comma-separated arguments to the console using console.warn()
		 *
		 * @param Values to be logged
		 */
		warn = function() {
			// Turn the arguments object into a real array
			var args = _slice.call(arguments);
			
		    if (_supports.warn) {
		    	for (var i = 0, len = args.length; i < len; i++) {
		    		_history.push(args[i]);
					console.warn(args[i]);
				}
		    }
		},
		
		/**
		 * Logs comma-separated arguments to the console using console.dir()
		 *
		 * @param Values to be logged
		 */
		dir = function() {
			// Turn the arguments object into a real array
			var args = _slice.call(arguments);
			
		    if (_supports.dir) {
		    	for (var i = 0, len = args.length; i < len; i++) {
		    		_history.push(args[i]);
					console.dir(args[i]);
				}
		    }
		},
		
		/**
		 * Prints the whole cached debug history to the console
		 *
		 */
		logHistory = function() {
		    log(_history);
		},
		
		_publicAPI = {
			log: log,
			warn: warn,
			error: error,
			dir: dir,
			logHistory: logHistory
		};
		
		Sushi.extend(Sushi, _publicAPI);
		
		return _publicAPI;
    }
);
define('vendors/polyfills.json',["require", "exports", "module"], function(require, exports, module) {
/*
    http://www.JSON.org/json2.js
    2010-11-17

    Public Domain.

    NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

    See http://www.JSON.org/js.html


    This code should be minified before deployment.
    See http://javascript.crockford.com/jsmin.html

    USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
    NOT CONTROL.


    This file creates a global JSON object containing two methods: stringify
    and parse.

        JSON.stringify(value, replacer, space)
            value       any JavaScript value, usually an object or array.

            replacer    an optional parameter that determines how object
                        values are stringified for objects. It can be a
                        function or an array of strings.

            space       an optional parameter that specifies the indentation
                        of nested structures. If it is omitted, the text will
                        be packed without extra whitespace. If it is a number,
                        it will specify the number of spaces to indent at each
                        level. If it is a string (such as '\t' or '&nbsp;'),
                        it contains the characters used to indent at each level.

            This method produces a JSON text from a JavaScript value.

            When an object value is found, if the object contains a toJSON
            method, its toJSON method will be called and the result will be
            stringified. A toJSON method does not serialize: it returns the
            value represented by the name/value pair that should be serialized,
            or undefined if nothing should be serialized. The toJSON method
            will be passed the key associated with the value, and this will be
            bound to the value

            For example, this would serialize Dates as ISO strings.

                Date.prototype.toJSON = function (key) {
                    function f(n) {
                        // Format integers to have at least two digits.
                        return n < 10 ? '0' + n : n;
                    }

                    return this.getUTCFullYear()   + '-' +
                         f(this.getUTCMonth() + 1) + '-' +
                         f(this.getUTCDate())      + 'T' +
                         f(this.getUTCHours())     + ':' +
                         f(this.getUTCMinutes())   + ':' +
                         f(this.getUTCSeconds())   + 'Z';
                };

            You can provide an optional replacer method. It will be passed the
            key and value of each member, with this bound to the containing
            object. The value that is returned from your method will be
            serialized. If your method returns undefined, then the member will
            be excluded from the serialization.

            If the replacer parameter is an array of strings, then it will be
            used to select the members to be serialized. It filters the results
            such that only members with keys listed in the replacer array are
            stringified.

            Values that do not have JSON representations, such as undefined or
            functions, will not be serialized. Such values in objects will be
            dropped; in arrays they will be replaced with null. You can use
            a replacer function to replace those with JSON values.
            JSON.stringify(undefined) returns undefined.

            The optional space parameter produces a stringification of the
            value that is filled with line breaks and indentation to make it
            easier to read.

            If the space parameter is a non-empty string, then that string will
            be used for indentation. If the space parameter is a number, then
            the indentation will be that many spaces.

            Example:

            text = JSON.stringify(['e', {pluribus: 'unum'}]);
            // text is '["e",{"pluribus":"unum"}]'


            text = JSON.stringify(['e', {pluribus: 'unum'}], null, '\t');
            // text is '[\n\t"e",\n\t{\n\t\t"pluribus": "unum"\n\t}\n]'

            text = JSON.stringify([new Date()], function (key, value) {
                return this[key] instanceof Date ?
                    'Date(' + this[key] + ')' : value;
            });
            // text is '["Date(---current time---)"]'


        JSON.parse(text, reviver)
            This method parses a JSON text to produce an object or array.
            It can throw a SyntaxError exception.

            The optional reviver parameter is a function that can filter and
            transform the results. It receives each of the keys and values,
            and its return value is used instead of the original value.
            If it returns what it received, then the structure is not modified.
            If it returns undefined then the member is deleted.

            Example:

            // Parse the text. Values that look like ISO date strings will
            // be converted to Date objects.

            myData = JSON.parse(text, function (key, value) {
                var a;
                if (typeof value === 'string') {
                    a =
/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value);
                    if (a) {
                        return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4],
                            +a[5], +a[6]));
                    }
                }
                return value;
            });

            myData = JSON.parse('["Date(09/09/2001)"]', function (key, value) {
                var d;
                if (typeof value === 'string' &&
                        value.slice(0, 5) === 'Date(' &&
                        value.slice(-1) === ')') {
                    d = new Date(value.slice(5, -1));
                    if (d) {
                        return d;
                    }
                }
                return value;
            });


    This is a reference implementation. You are free to copy, modify, or
    redistribute.
*/

/*jslint evil: true, strict: false, regexp: false */

/*members "", "\b", "\t", "\n", "\f", "\r", "\"", JSON, "\\", apply,
    call, charCodeAt, getUTCDate, getUTCFullYear, getUTCHours,
    getUTCMinutes, getUTCMonth, getUTCSeconds, hasOwnProperty, join,
    lastIndex, length, parse, prototype, push, replace, slice, stringify,
    test, toJSON, toString, valueOf
*/

(function () {
    
    
    if (typeof JSON === 'undefined') {
    	JSON = {}
    }

    function f(n) {
        // Format integers to have at least two digits.
        return n < 10 ? '0' + n : n;
    }

    if (typeof Date.prototype.toJSON !== 'function') {

        Date.prototype.toJSON = function (key) {

            return isFinite(this.valueOf()) ?
                   this.getUTCFullYear()   + '-' +
                 f(this.getUTCMonth() + 1) + '-' +
                 f(this.getUTCDate())      + 'T' +
                 f(this.getUTCHours())     + ':' +
                 f(this.getUTCMinutes())   + ':' +
                 f(this.getUTCSeconds())   + 'Z' : null;
        };

        String.prototype.toJSON =
        Number.prototype.toJSON =
        Boolean.prototype.toJSON = function (key) {
            return this.valueOf();
        };
    }

    var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        gap,
        indent,
        meta = {    // table of character substitutions
            '\b': '\\b',
            '\t': '\\t',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '"' : '\\"',
            '\\': '\\\\'
        },
        rep;


    function quote(string) {

// If the string contains no control characters, no quote characters, and no
// backslash characters, then we can safely slap some quotes around it.
// Otherwise we must also replace the offending characters with safe escape
// sequences.

        escapable.lastIndex = 0;
        return escapable.test(string) ?
            '"' + string.replace(escapable, function (a) {
                var c = meta[a];
                return typeof c === 'string' ? c :
                    '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
            }) + '"' :
            '"' + string + '"';
    }


    function str(key, holder) {

// Produce a string from holder[key].

        var i,          // The loop counter.
            k,          // The member key.
            v,          // The member value.
            length,
            mind = gap,
            partial,
            value = holder[key];

// If the value has a toJSON method, call it to obtain a replacement value.

        if (value && typeof value === 'object' &&
                typeof value.toJSON === 'function') {
            value = value.toJSON(key);
        }

// If we were called with a replacer function, then call the replacer to
// obtain a replacement value.

        if (typeof rep === 'function') {
            value = rep.call(holder, key, value);
        }

// What happens next depends on the value's type.

        switch (typeof value) {
        case 'string':
            return quote(value);

        case 'number':

// JSON numbers must be finite. Encode non-finite numbers as null.

            return isFinite(value) ? String(value) : 'null';

        case 'boolean':
        case 'null':

// If the value is a boolean or null, convert it to a string. Note:
// typeof null does not produce 'null'. The case is included here in
// the remote chance that this gets fixed someday.

            return String(value);

// If the type is 'object', we might be dealing with an object or an array or
// null.

        case 'object':

// Due to a specification blunder in ECMAScript, typeof null is 'object',
// so watch out for that case.

            if (!value) {
                return 'null';
            }

// Make an array to hold the partial results of stringifying this object value.

            gap += indent;
            partial = [];

// Is the value an array?

            if (Object.prototype.toString.apply(value) === '[object Array]') {

// The value is an array. Stringify every element. Use null as a placeholder
// for non-JSON values.

                length = value.length;
                for (i = 0; i < length; i += 1) {
                    partial[i] = str(i, value) || 'null';
                }

// Join all of the elements together, separated with commas, and wrap them in
// brackets.

                v = partial.length === 0 ? '[]' :
                    gap ? '[\n' + gap +
                            partial.join(',\n' + gap) + '\n' +
                                mind + ']' :
                          '[' + partial.join(',') + ']';
                gap = mind;
                return v;
            }

// If the replacer is an array, use it to select the members to be stringified.

            if (rep && typeof rep === 'object') {
                length = rep.length;
                for (i = 0; i < length; i += 1) {
                    k = rep[i];
                    if (typeof k === 'string') {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            } else {

// Otherwise, iterate through all of the keys in the object.

                for (k in value) {
                    if (Object.hasOwnProperty.call(value, k)) {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            }

// Join all of the member texts together, separated with commas,
// and wrap them in braces.

            v = partial.length === 0 ? '{}' :
                gap ? '{\n' + gap + partial.join(',\n' + gap) + '\n' +
                        mind + '}' : '{' + partial.join(',') + '}';
            gap = mind;
            return v;
        }
    }

// If the JSON object does not yet have a stringify method, give it one.

    if (typeof JSON.stringify !== 'function') {
        JSON.stringify = function (value, replacer, space) {

// The stringify method takes a value and an optional replacer, and an optional
// space parameter, and returns a JSON text. The replacer can be a function
// that can replace values, or an array of strings that will select the keys.
// A default replacer method can be provided. Use of the space parameter can
// produce text that is more easily readable.

            var i;
            gap = '';
            indent = '';

// If the space parameter is a number, make an indent string containing that
// many spaces.

            if (typeof space === 'number') {
                for (i = 0; i < space; i += 1) {
                    indent += ' ';
                }

// If the space parameter is a string, it will be used as the indent string.

            } else if (typeof space === 'string') {
                indent = space;
            }

// If there is a replacer, it must be a function or an array.
// Otherwise, throw an error.

            rep = replacer;
            if (replacer && typeof replacer !== 'function' &&
                    (typeof replacer !== 'object' ||
                     typeof replacer.length !== 'number')) {
                throw new Error('JSON.stringify');
            }

// Make a fake root object containing our value under the key of ''.
// Return the result of stringifying the value.

            return str('', {'': value});
        };
    }


// If the JSON object does not yet have a parse method, give it one.

    if (typeof JSON.parse !== 'function') {
        JSON.parse = function (text, reviver) {

// The parse method takes a text and an optional reviver function, and returns
// a JavaScript value if the text is a valid JSON text.

            var j;

            function walk(holder, key) {

// The walk method is used to recursively walk the resulting structure so
// that modifications can be made.

                var k, v, value = holder[key];
                if (value && typeof value === 'object') {
                    for (k in value) {
                        if (Object.hasOwnProperty.call(value, k)) {
                            v = walk(value, k);
                            if (v !== undefined) {
                                value[k] = v;
                            } else {
                                delete value[k];
                            }
                        }
                    }
                }
                return reviver.call(holder, key, value);
            }


// Parsing happens in four stages. In the first stage, we replace certain
// Unicode characters with escape sequences. JavaScript handles many characters
// incorrectly, either silently deleting them, or treating them as line endings.

            text = String(text);
            cx.lastIndex = 0;
            if (cx.test(text)) {
                text = text.replace(cx, function (a) {
                    return '\\u' +
                        ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
                });
            }

// In the second stage, we run the text against regular expressions that look
// for non-JSON patterns. We are especially concerned with '()' and 'new'
// because they can cause invocation, and '=' because it can cause mutation.
// But just to be safe, we want to reject all unexpected forms.

// We split the second stage into 4 regexp operations in order to work around
// crippling inefficiencies in IE's and Safari's regexp engines. First we
// replace the JSON backslash pairs with '@' (a non-JSON character). Second, we
// replace all simple value tokens with ']' characters. Third, we delete all
// open brackets that follow a colon or comma or that begin the text. Finally,
// we look to see that the remaining characters are only whitespace or ']' or
// ',' or ':' or '{' or '}'. If that is so, then the text is safe for eval.

            if (/^[\],:{}\s]*$/
.test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@')
.replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']')
.replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {

// In the third stage we use the eval function to compile the text into a
// JavaScript structure. The '{' operator is subject to a syntactic ambiguity
// in JavaScript: it can begin a block or an object literal. We wrap the text
// in parens to eliminate the ambiguity.

                j = eval('(' + text + ')');

// In the optional fourth stage, we recursively walk the new structure, passing
// each name/value pair to a reviver function for possible transformation.

                return typeof reviver === 'function' ?
                    walk({'': j}, '') : j;
            }

// If the text is not JSON parseable, then a SyntaxError is thrown.

            throw new SyntaxError('JSON.parse');
        };
    }
}());
});

define('sushi.utils.json',
	[
		'sushi.core', 
		'sushi.utils',
		'vendors/polyfills.json'
	],
	
	/**
	 * JSON handling functions
	 */
	function(Sushi, utils) {
		/**
		 * Converts a JSON-formatted string into a Javascript literal object
		 *
		 * @param {String} string JSON-formatted string
		 * @return {Object} Well formatted JS literal
		 */
		var parse = function(string) {
			return window.JSON.parse(string);
		},
		
		/**
		 * Converts a Javascript literal object into a well formatted JSON string
		 *
		 * @param {Object} literal Literal Notated Javascript Object
		 * @return {String} Well formatted JSON string
		 */
		stringify = function(literal) {
			return window.JSON.stringify(literal);
		},
		
		_publicAPI = {
			parse: parse,
			stringify: stringify
		};
		
		Sushi.namespace('utils.json');
		Sushi.extend(Sushi.utils.json, _publicAPI);
		
		return _publicAPI;		
	}
);
define('sushi.utils.url',
	['sushi.core', 'sushi.utils'],

	/**
	 * Language handling functions
	 */
	function() {
		/**
		 * Converts every accented letter in a string with its non-accented equivalent.
		 * Currently WIP, trying to squeeze this function as much as possible. 
		 * (≈3ms per string, with 2 calls ≈ 1.5ms per call)
		 *
		 * @param {String} string with accented characters
		 * @return {String} string without accented characters in lower case
		 */
		var querystring = function (name) {
		   var tmp = ( location.search.substring(1) ),
		   i = tmp.toUpperCase().indexOf(name.toUpperCase()+"=");
		
		   if ( i >= 0 ) {
			  tmp = tmp.substring( name.length+i+1 );
			  i = tmp.indexOf("&");
			  return unescape( tmp = tmp.substring( 0, (i>=0) ? i : tmp.length ));
		   }
		   return("");
		},
		
		setQuerystringOption = function (replaceParam, newVal) {
			var oldURL = window.location.href,
				iStart,
				iEnd,
				sEnd,
				sStart,
				newURL;
			
			iStart = oldURL.indexOf(replaceParam  + '='),
			iEnd = oldURL.substring(iStart + 1).indexOf('&'),
			sEnd = oldURL.substring(iStart + iEnd + 1),
			sStart = oldURL.substring(0, iStart),
			newURL = sStart + replaceParam + '=' + newVal;
			
			if (iEnd > 0) {
			    newURL += sEnd;
			}
			
			return (oldURL.indexOf('?') == -1) ? oldURL + '?' + newURL : newURL;
		},
		
		_publicAPI = {
			querystring: querystring,
			setQuerystringOption: setQuerystringOption
		};

		Sushi.extend(Sushi.utils, _publicAPI);
		
		return _publicAPI;
	}
);
/*
 * Sushi.Store
 *
 */
 define('sushi.Store',
 	// Module dependencies
 	[
 		'sushi.core'
 	],

 	/**
 	 * Sushi Store
 	 *
 	 * @namespace Sushi
 	 * @class Store
 	 */
 	function(Sushi) {
        Sushi.namespace('Store', Sushi);
        
        var Store;
        
        Store = new Sushi.Class({
        	constructor: function(name) {
        		if (name) this.name = name;
        		
        		if (Sushi.stores && Sushi.stores.register) Sushi.stores.register(this);
        	},
        	
        	name: 'Default Store',
        	
        	sync: function() {}
        });
        
        Sushi.Store = Store;
        return Store;
 	}
 );

// lib/handlebars/base.js
var Handlebars = {};

Handlebars.VERSION = "1.0.beta.6";

Handlebars.helpers  = {};
Handlebars.partials = {};

Handlebars.registerHelper = function(name, fn, inverse) {
  if(inverse) { fn.not = inverse; }
  this.helpers[name] = fn;
};

Handlebars.registerPartial = function(name, str) {
  this.partials[name] = str;
};

Handlebars.registerHelper('helperMissing', function(arg) {
  if(arguments.length === 2) {
    return undefined;
  } else {
    throw new Error("Could not find property '" + arg + "'");
  }
});

var toString = Object.prototype.toString, functionType = "[object Function]";

Handlebars.registerHelper('blockHelperMissing', function(context, options) {
  var inverse = options.inverse || function() {}, fn = options.fn;


  var ret = "";
  var type = toString.call(context);

  if(type === functionType) { context = context.call(this); }

  if(context === true) {
    return fn(this);
  } else if(context === false || context == null) {
    return inverse(this);
  } else if(type === "[object Array]") {
    if(context.length > 0) {
      for(var i=0, j=context.length; i<j; i++) {
        ret = ret + fn(context[i]);
      }
    } else {
      ret = inverse(this);
    }
    return ret;
  } else {
    return fn(context);
  }
});

Handlebars.registerHelper('each', function(context, options) {
  var fn = options.fn, inverse = options.inverse;
  var ret = "";

  if(context && context.length > 0) {
    for(var i=0, j=context.length; i<j; i++) {
      ret = ret + fn(context[i]);
    }
  } else {
    ret = inverse(this);
  }
  return ret;
});

Handlebars.registerHelper('if', function(context, options) {
  var type = toString.call(context);
  if(type === functionType) { context = context.call(this); }

  if(!context || Handlebars.Utils.isEmpty(context)) {
    return options.inverse(this);
  } else {
    return options.fn(this);
  }
});

Handlebars.registerHelper('unless', function(context, options) {
  var fn = options.fn, inverse = options.inverse;
  options.fn = inverse;
  options.inverse = fn;

  return Handlebars.helpers['if'].call(this, context, options);
});

Handlebars.registerHelper('with', function(context, options) {
  return options.fn(context);
});

Handlebars.registerHelper('log', function(context) {
  Handlebars.log(context);
});
;
// lib/handlebars/compiler/parser.js
/* Jison generated parser */
var handlebars = (function(){

var parser = {trace: function trace() { },
yy: {},
symbols_: {"error":2,"root":3,"program":4,"EOF":5,"statements":6,"simpleInverse":7,"statement":8,"openInverse":9,"closeBlock":10,"openBlock":11,"mustache":12,"partial":13,"CONTENT":14,"COMMENT":15,"OPEN_BLOCK":16,"inMustache":17,"CLOSE":18,"OPEN_INVERSE":19,"OPEN_ENDBLOCK":20,"path":21,"OPEN":22,"OPEN_UNESCAPED":23,"OPEN_PARTIAL":24,"params":25,"hash":26,"param":27,"STRING":28,"INTEGER":29,"BOOLEAN":30,"hashSegments":31,"hashSegment":32,"ID":33,"EQUALS":34,"pathSegments":35,"SEP":36,"$accept":0,"$end":1},
terminals_: {2:"error",5:"EOF",14:"CONTENT",15:"COMMENT",16:"OPEN_BLOCK",18:"CLOSE",19:"OPEN_INVERSE",20:"OPEN_ENDBLOCK",22:"OPEN",23:"OPEN_UNESCAPED",24:"OPEN_PARTIAL",28:"STRING",29:"INTEGER",30:"BOOLEAN",33:"ID",34:"EQUALS",36:"SEP"},
productions_: [0,[3,2],[4,3],[4,1],[4,0],[6,1],[6,2],[8,3],[8,3],[8,1],[8,1],[8,1],[8,1],[11,3],[9,3],[10,3],[12,3],[12,3],[13,3],[13,4],[7,2],[17,3],[17,2],[17,2],[17,1],[25,2],[25,1],[27,1],[27,1],[27,1],[27,1],[26,1],[31,2],[31,1],[32,3],[32,3],[32,3],[32,3],[21,1],[35,3],[35,1]],
performAction: function anonymous(yytext,yyleng,yylineno,yy,yystate,$$,_$) {

var $0 = $$.length - 1;
switch (yystate) {
case 1: return $$[$0-1] 
break;
case 2: this.$ = new yy.ProgramNode($$[$0-2], $$[$0]) 
break;
case 3: this.$ = new yy.ProgramNode($$[$0]) 
break;
case 4: this.$ = new yy.ProgramNode([]) 
break;
case 5: this.$ = [$$[$0]] 
break;
case 6: $$[$0-1].push($$[$0]); this.$ = $$[$0-1] 
break;
case 7: this.$ = new yy.InverseNode($$[$0-2], $$[$0-1], $$[$0]) 
break;
case 8: this.$ = new yy.BlockNode($$[$0-2], $$[$0-1], $$[$0]) 
break;
case 9: this.$ = $$[$0] 
break;
case 10: this.$ = $$[$0] 
break;
case 11: this.$ = new yy.ContentNode($$[$0]) 
break;
case 12: this.$ = new yy.CommentNode($$[$0]) 
break;
case 13: this.$ = new yy.MustacheNode($$[$0-1][0], $$[$0-1][1]) 
break;
case 14: this.$ = new yy.MustacheNode($$[$0-1][0], $$[$0-1][1]) 
break;
case 15: this.$ = $$[$0-1] 
break;
case 16: this.$ = new yy.MustacheNode($$[$0-1][0], $$[$0-1][1]) 
break;
case 17: this.$ = new yy.MustacheNode($$[$0-1][0], $$[$0-1][1], true) 
break;
case 18: this.$ = new yy.PartialNode($$[$0-1]) 
break;
case 19: this.$ = new yy.PartialNode($$[$0-2], $$[$0-1]) 
break;
case 20: 
break;
case 21: this.$ = [[$$[$0-2]].concat($$[$0-1]), $$[$0]] 
break;
case 22: this.$ = [[$$[$0-1]].concat($$[$0]), null] 
break;
case 23: this.$ = [[$$[$0-1]], $$[$0]] 
break;
case 24: this.$ = [[$$[$0]], null] 
break;
case 25: $$[$0-1].push($$[$0]); this.$ = $$[$0-1]; 
break;
case 26: this.$ = [$$[$0]] 
break;
case 27: this.$ = $$[$0] 
break;
case 28: this.$ = new yy.StringNode($$[$0]) 
break;
case 29: this.$ = new yy.IntegerNode($$[$0]) 
break;
case 30: this.$ = new yy.BooleanNode($$[$0]) 
break;
case 31: this.$ = new yy.HashNode($$[$0]) 
break;
case 32: $$[$0-1].push($$[$0]); this.$ = $$[$0-1] 
break;
case 33: this.$ = [$$[$0]] 
break;
case 34: this.$ = [$$[$0-2], $$[$0]] 
break;
case 35: this.$ = [$$[$0-2], new yy.StringNode($$[$0])] 
break;
case 36: this.$ = [$$[$0-2], new yy.IntegerNode($$[$0])] 
break;
case 37: this.$ = [$$[$0-2], new yy.BooleanNode($$[$0])] 
break;
case 38: this.$ = new yy.IdNode($$[$0]) 
break;
case 39: $$[$0-2].push($$[$0]); this.$ = $$[$0-2]; 
break;
case 40: this.$ = [$$[$0]] 
break;
}
},
table: [{3:1,4:2,5:[2,4],6:3,8:4,9:5,11:6,12:7,13:8,14:[1,9],15:[1,10],16:[1,12],19:[1,11],22:[1,13],23:[1,14],24:[1,15]},{1:[3]},{5:[1,16]},{5:[2,3],7:17,8:18,9:5,11:6,12:7,13:8,14:[1,9],15:[1,10],16:[1,12],19:[1,19],20:[2,3],22:[1,13],23:[1,14],24:[1,15]},{5:[2,5],14:[2,5],15:[2,5],16:[2,5],19:[2,5],20:[2,5],22:[2,5],23:[2,5],24:[2,5]},{4:20,6:3,8:4,9:5,11:6,12:7,13:8,14:[1,9],15:[1,10],16:[1,12],19:[1,11],20:[2,4],22:[1,13],23:[1,14],24:[1,15]},{4:21,6:3,8:4,9:5,11:6,12:7,13:8,14:[1,9],15:[1,10],16:[1,12],19:[1,11],20:[2,4],22:[1,13],23:[1,14],24:[1,15]},{5:[2,9],14:[2,9],15:[2,9],16:[2,9],19:[2,9],20:[2,9],22:[2,9],23:[2,9],24:[2,9]},{5:[2,10],14:[2,10],15:[2,10],16:[2,10],19:[2,10],20:[2,10],22:[2,10],23:[2,10],24:[2,10]},{5:[2,11],14:[2,11],15:[2,11],16:[2,11],19:[2,11],20:[2,11],22:[2,11],23:[2,11],24:[2,11]},{5:[2,12],14:[2,12],15:[2,12],16:[2,12],19:[2,12],20:[2,12],22:[2,12],23:[2,12],24:[2,12]},{17:22,21:23,33:[1,25],35:24},{17:26,21:23,33:[1,25],35:24},{17:27,21:23,33:[1,25],35:24},{17:28,21:23,33:[1,25],35:24},{21:29,33:[1,25],35:24},{1:[2,1]},{6:30,8:4,9:5,11:6,12:7,13:8,14:[1,9],15:[1,10],16:[1,12],19:[1,11],22:[1,13],23:[1,14],24:[1,15]},{5:[2,6],14:[2,6],15:[2,6],16:[2,6],19:[2,6],20:[2,6],22:[2,6],23:[2,6],24:[2,6]},{17:22,18:[1,31],21:23,33:[1,25],35:24},{10:32,20:[1,33]},{10:34,20:[1,33]},{18:[1,35]},{18:[2,24],21:40,25:36,26:37,27:38,28:[1,41],29:[1,42],30:[1,43],31:39,32:44,33:[1,45],35:24},{18:[2,38],28:[2,38],29:[2,38],30:[2,38],33:[2,38],36:[1,46]},{18:[2,40],28:[2,40],29:[2,40],30:[2,40],33:[2,40],36:[2,40]},{18:[1,47]},{18:[1,48]},{18:[1,49]},{18:[1,50],21:51,33:[1,25],35:24},{5:[2,2],8:18,9:5,11:6,12:7,13:8,14:[1,9],15:[1,10],16:[1,12],19:[1,11],20:[2,2],22:[1,13],23:[1,14],24:[1,15]},{14:[2,20],15:[2,20],16:[2,20],19:[2,20],22:[2,20],23:[2,20],24:[2,20]},{5:[2,7],14:[2,7],15:[2,7],16:[2,7],19:[2,7],20:[2,7],22:[2,7],23:[2,7],24:[2,7]},{21:52,33:[1,25],35:24},{5:[2,8],14:[2,8],15:[2,8],16:[2,8],19:[2,8],20:[2,8],22:[2,8],23:[2,8],24:[2,8]},{14:[2,14],15:[2,14],16:[2,14],19:[2,14],20:[2,14],22:[2,14],23:[2,14],24:[2,14]},{18:[2,22],21:40,26:53,27:54,28:[1,41],29:[1,42],30:[1,43],31:39,32:44,33:[1,45],35:24},{18:[2,23]},{18:[2,26],28:[2,26],29:[2,26],30:[2,26],33:[2,26]},{18:[2,31],32:55,33:[1,56]},{18:[2,27],28:[2,27],29:[2,27],30:[2,27],33:[2,27]},{18:[2,28],28:[2,28],29:[2,28],30:[2,28],33:[2,28]},{18:[2,29],28:[2,29],29:[2,29],30:[2,29],33:[2,29]},{18:[2,30],28:[2,30],29:[2,30],30:[2,30],33:[2,30]},{18:[2,33],33:[2,33]},{18:[2,40],28:[2,40],29:[2,40],30:[2,40],33:[2,40],34:[1,57],36:[2,40]},{33:[1,58]},{14:[2,13],15:[2,13],16:[2,13],19:[2,13],20:[2,13],22:[2,13],23:[2,13],24:[2,13]},{5:[2,16],14:[2,16],15:[2,16],16:[2,16],19:[2,16],20:[2,16],22:[2,16],23:[2,16],24:[2,16]},{5:[2,17],14:[2,17],15:[2,17],16:[2,17],19:[2,17],20:[2,17],22:[2,17],23:[2,17],24:[2,17]},{5:[2,18],14:[2,18],15:[2,18],16:[2,18],19:[2,18],20:[2,18],22:[2,18],23:[2,18],24:[2,18]},{18:[1,59]},{18:[1,60]},{18:[2,21]},{18:[2,25],28:[2,25],29:[2,25],30:[2,25],33:[2,25]},{18:[2,32],33:[2,32]},{34:[1,57]},{21:61,28:[1,62],29:[1,63],30:[1,64],33:[1,25],35:24},{18:[2,39],28:[2,39],29:[2,39],30:[2,39],33:[2,39],36:[2,39]},{5:[2,19],14:[2,19],15:[2,19],16:[2,19],19:[2,19],20:[2,19],22:[2,19],23:[2,19],24:[2,19]},{5:[2,15],14:[2,15],15:[2,15],16:[2,15],19:[2,15],20:[2,15],22:[2,15],23:[2,15],24:[2,15]},{18:[2,34],33:[2,34]},{18:[2,35],33:[2,35]},{18:[2,36],33:[2,36]},{18:[2,37],33:[2,37]}],
defaultActions: {16:[2,1],37:[2,23],53:[2,21]},
parseError: function parseError(str, hash) {
    throw new Error(str);
},
parse: function parse(input) {
    var self = this, stack = [0], vstack = [null], lstack = [], table = this.table, yytext = "", yylineno = 0, yyleng = 0, recovering = 0, TERROR = 2, EOF = 1;
    this.lexer.setInput(input);
    this.lexer.yy = this.yy;
    this.yy.lexer = this.lexer;
    if (typeof this.lexer.yylloc == "undefined")
        this.lexer.yylloc = {};
    var yyloc = this.lexer.yylloc;
    lstack.push(yyloc);
    if (typeof this.yy.parseError === "function")
        this.parseError = this.yy.parseError;
    function popStack(n) {
        stack.length = stack.length - 2 * n;
        vstack.length = vstack.length - n;
        lstack.length = lstack.length - n;
    }
    function lex() {
        var token;
        token = self.lexer.lex() || 1;
        if (typeof token !== "number") {
            token = self.symbols_[token] || token;
        }
        return token;
    }
    var symbol, preErrorSymbol, state, action, a, r, yyval = {}, p, len, newState, expected;
    while (true) {
        state = stack[stack.length - 1];
        if (this.defaultActions[state]) {
            action = this.defaultActions[state];
        } else {
            if (symbol == null)
                symbol = lex();
            action = table[state] && table[state][symbol];
        }
        if (typeof action === "undefined" || !action.length || !action[0]) {
            if (!recovering) {
                expected = [];
                for (p in table[state])
                    if (this.terminals_[p] && p > 2) {
                        expected.push("'" + this.terminals_[p] + "'");
                    }
                var errStr = "";
                if (this.lexer.showPosition) {
                    errStr = "Parse error on line " + (yylineno + 1) + ":\n" + this.lexer.showPosition() + "\nExpecting " + expected.join(", ") + ", got '" + this.terminals_[symbol] + "'";
                } else {
                    errStr = "Parse error on line " + (yylineno + 1) + ": Unexpected " + (symbol == 1?"end of input":"'" + (this.terminals_[symbol] || symbol) + "'");
                }
                this.parseError(errStr, {text: this.lexer.match, token: this.terminals_[symbol] || symbol, line: this.lexer.yylineno, loc: yyloc, expected: expected});
            }
        }
        if (action[0] instanceof Array && action.length > 1) {
            throw new Error("Parse Error: multiple actions possible at state: " + state + ", token: " + symbol);
        }
        switch (action[0]) {
        case 1:
            stack.push(symbol);
            vstack.push(this.lexer.yytext);
            lstack.push(this.lexer.yylloc);
            stack.push(action[1]);
            symbol = null;
            if (!preErrorSymbol) {
                yyleng = this.lexer.yyleng;
                yytext = this.lexer.yytext;
                yylineno = this.lexer.yylineno;
                yyloc = this.lexer.yylloc;
                if (recovering > 0)
                    recovering--;
            } else {
                symbol = preErrorSymbol;
                preErrorSymbol = null;
            }
            break;
        case 2:
            len = this.productions_[action[1]][1];
            yyval.$ = vstack[vstack.length - len];
            yyval._$ = {first_line: lstack[lstack.length - (len || 1)].first_line, last_line: lstack[lstack.length - 1].last_line, first_column: lstack[lstack.length - (len || 1)].first_column, last_column: lstack[lstack.length - 1].last_column};
            r = this.performAction.call(yyval, yytext, yyleng, yylineno, this.yy, action[1], vstack, lstack);
            if (typeof r !== "undefined") {
                return r;
            }
            if (len) {
                stack = stack.slice(0, -1 * len * 2);
                vstack = vstack.slice(0, -1 * len);
                lstack = lstack.slice(0, -1 * len);
            }
            stack.push(this.productions_[action[1]][0]);
            vstack.push(yyval.$);
            lstack.push(yyval._$);
            newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
            stack.push(newState);
            break;
        case 3:
            return true;
        }
    }
    return true;
}
};/* Jison generated lexer */
var lexer = (function(){

var lexer = ({EOF:1,
parseError:function parseError(str, hash) {
        if (this.yy.parseError) {
            this.yy.parseError(str, hash);
        } else {
            throw new Error(str);
        }
    },
setInput:function (input) {
        this._input = input;
        this._more = this._less = this.done = false;
        this.yylineno = this.yyleng = 0;
        this.yytext = this.matched = this.match = '';
        this.conditionStack = ['INITIAL'];
        this.yylloc = {first_line:1,first_column:0,last_line:1,last_column:0};
        return this;
    },
input:function () {
        var ch = this._input[0];
        this.yytext+=ch;
        this.yyleng++;
        this.match+=ch;
        this.matched+=ch;
        var lines = ch.match(/\n/);
        if (lines) this.yylineno++;
        this._input = this._input.slice(1);
        return ch;
    },
unput:function (ch) {
        this._input = ch + this._input;
        return this;
    },
more:function () {
        this._more = true;
        return this;
    },
pastInput:function () {
        var past = this.matched.substr(0, this.matched.length - this.match.length);
        return (past.length > 20 ? '...':'') + past.substr(-20).replace(/\n/g, "");
    },
upcomingInput:function () {
        var next = this.match;
        if (next.length < 20) {
            next += this._input.substr(0, 20-next.length);
        }
        return (next.substr(0,20)+(next.length > 20 ? '...':'')).replace(/\n/g, "");
    },
showPosition:function () {
        var pre = this.pastInput();
        var c = new Array(pre.length + 1).join("-");
        return pre + this.upcomingInput() + "\n" + c+"^";
    },
next:function () {
        if (this.done) {
            return this.EOF;
        }
        if (!this._input) this.done = true;

        var token,
            match,
            col,
            lines;
        if (!this._more) {
            this.yytext = '';
            this.match = '';
        }
        var rules = this._currentRules();
        for (var i=0;i < rules.length; i++) {
            match = this._input.match(this.rules[rules[i]]);
            if (match) {
                lines = match[0].match(/\n.*/g);
                if (lines) this.yylineno += lines.length;
                this.yylloc = {first_line: this.yylloc.last_line,
                               last_line: this.yylineno+1,
                               first_column: this.yylloc.last_column,
                               last_column: lines ? lines[lines.length-1].length-1 : this.yylloc.last_column + match[0].length}
                this.yytext += match[0];
                this.match += match[0];
                this.matches = match;
                this.yyleng = this.yytext.length;
                this._more = false;
                this._input = this._input.slice(match[0].length);
                this.matched += match[0];
                token = this.performAction.call(this, this.yy, this, rules[i],this.conditionStack[this.conditionStack.length-1]);
                if (token) return token;
                else return;
            }
        }
        if (this._input === "") {
            return this.EOF;
        } else {
            this.parseError('Lexical error on line '+(this.yylineno+1)+'. Unrecognized text.\n'+this.showPosition(), 
                    {text: "", token: null, line: this.yylineno});
        }
    },
lex:function lex() {
        var r = this.next();
        if (typeof r !== 'undefined') {
            return r;
        } else {
            return this.lex();
        }
    },
begin:function begin(condition) {
        this.conditionStack.push(condition);
    },
popState:function popState() {
        return this.conditionStack.pop();
    },
_currentRules:function _currentRules() {
        return this.conditions[this.conditionStack[this.conditionStack.length-1]].rules;
    },
topState:function () {
        return this.conditionStack[this.conditionStack.length-2];
    },
pushState:function begin(condition) {
        this.begin(condition);
    }});
lexer.performAction = function anonymous(yy,yy_,$avoiding_name_collisions,YY_START) {

var YYSTATE=YY_START
switch($avoiding_name_collisions) {
case 0:
                                   if(yy_.yytext.slice(-1) !== "\\") this.begin("mu");
                                   if(yy_.yytext.slice(-1) === "\\") yy_.yytext = yy_.yytext.substr(0,yy_.yyleng-1), this.begin("emu");
                                   if(yy_.yytext) return 14;
                                 
break;
case 1: return 14; 
break;
case 2: this.popState(); return 14; 
break;
case 3: return 24; 
break;
case 4: return 16; 
break;
case 5: return 20; 
break;
case 6: return 19; 
break;
case 7: return 19; 
break;
case 8: return 23; 
break;
case 9: return 23; 
break;
case 10: yy_.yytext = yy_.yytext.substr(3,yy_.yyleng-5); this.popState(); return 15; 
break;
case 11: return 22; 
break;
case 12: return 34; 
break;
case 13: return 33; 
break;
case 14: return 33; 
break;
case 15: return 36; 
break;
case 16: /*ignore whitespace*/ 
break;
case 17: this.popState(); return 18; 
break;
case 18: this.popState(); return 18; 
break;
case 19: yy_.yytext = yy_.yytext.substr(1,yy_.yyleng-2).replace(/\\"/g,'"'); return 28; 
break;
case 20: return 30; 
break;
case 21: return 30; 
break;
case 22: return 29; 
break;
case 23: return 33; 
break;
case 24: yy_.yytext = yy_.yytext.substr(1, yy_.yyleng-2); return 33; 
break;
case 25: return 'INVALID'; 
break;
case 26: return 5; 
break;
}
};
lexer.rules = [/^[^\x00]*?(?=(\{\{))/,/^[^\x00]+/,/^[^\x00]{2,}?(?=(\{\{))/,/^\{\{>/,/^\{\{#/,/^\{\{\//,/^\{\{\^/,/^\{\{\s*else\b/,/^\{\{\{/,/^\{\{&/,/^\{\{![\s\S]*?\}\}/,/^\{\{/,/^=/,/^\.(?=[} ])/,/^\.\./,/^[\/.]/,/^\s+/,/^\}\}\}/,/^\}\}/,/^"(\\["]|[^"])*"/,/^true(?=[}\s])/,/^false(?=[}\s])/,/^[0-9]+(?=[}\s])/,/^[a-zA-Z0-9_$-]+(?=[=}\s\/.])/,/^\[[^\]]*\]/,/^./,/^$/];
lexer.conditions = {"mu":{"rules":[3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26],"inclusive":false},"emu":{"rules":[2],"inclusive":false},"INITIAL":{"rules":[0,1,26],"inclusive":true}};return lexer;})()
parser.lexer = lexer;
return parser;
})();
if (typeof require !== 'undefined' && typeof exports !== 'undefined') {
exports.parser = handlebars;
exports.parse = function () { return handlebars.parse.apply(handlebars, arguments); }
exports.main = function commonjsMain(args) {
    if (!args[1])
        throw new Error('Usage: '+args[0]+' FILE');
    if (typeof process !== 'undefined') {
        var source = require('fs').readFileSync(require('path').join(process.cwd(), args[1]), "utf8");
    } else {
        var cwd = require("file").path(require("file").cwd());
        var source = cwd.join(args[1]).read({charset: "utf-8"});
    }
    return exports.parser.parse(source);
}
if (typeof module !== 'undefined' && require.main === module) {
  exports.main(typeof process !== 'undefined' ? process.argv.slice(1) : require("system").args);
}
};
;
// lib/handlebars/compiler/base.js
Handlebars.Parser = handlebars;

Handlebars.parse = function(string) {
  Handlebars.Parser.yy = Handlebars.AST;
  return Handlebars.Parser.parse(string);
};

Handlebars.print = function(ast) {
  return new Handlebars.PrintVisitor().accept(ast);
};

Handlebars.logger = {
  DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3, level: 3,

  // override in the host environment
  log: function(level, str) {}
};

Handlebars.log = function(level, str) { Handlebars.logger.log(level, str); };
;
// lib/handlebars/compiler/ast.js
(function() {

  Handlebars.AST = {};

  Handlebars.AST.ProgramNode = function(statements, inverse) {
    this.type = "program";
    this.statements = statements;
    if(inverse) { this.inverse = new Handlebars.AST.ProgramNode(inverse); }
  };

  Handlebars.AST.MustacheNode = function(params, hash, unescaped) {
    this.type = "mustache";
    this.id = params[0];
    this.params = params.slice(1);
    this.hash = hash;
    this.escaped = !unescaped;
  };

  Handlebars.AST.PartialNode = function(id, context) {
    this.type    = "partial";

    // TODO: disallow complex IDs

    this.id      = id;
    this.context = context;
  };

  var verifyMatch = function(open, close) {
    if(open.original !== close.original) {
      throw new Handlebars.Exception(open.original + " doesn't match " + close.original);
    }
  };

  Handlebars.AST.BlockNode = function(mustache, program, close) {
    verifyMatch(mustache.id, close);
    this.type = "block";
    this.mustache = mustache;
    this.program  = program;
  };

  Handlebars.AST.InverseNode = function(mustache, program, close) {
    verifyMatch(mustache.id, close);
    this.type = "inverse";
    this.mustache = mustache;
    this.program  = program;
  };

  Handlebars.AST.ContentNode = function(string) {
    this.type = "content";
    this.string = string;
  };

  Handlebars.AST.HashNode = function(pairs) {
    this.type = "hash";
    this.pairs = pairs;
  };

  Handlebars.AST.IdNode = function(parts) {
    this.type = "ID";
    this.original = parts.join(".");

    var dig = [], depth = 0;

    for(var i=0,l=parts.length; i<l; i++) {
      var part = parts[i];

      if(part === "..") { depth++; }
      else if(part === "." || part === "this") { this.isScoped = true; }
      else { dig.push(part); }
    }

    this.parts    = dig;
    this.string   = dig.join('.');
    this.depth    = depth;
    this.isSimple = (dig.length === 1) && (depth === 0);
  };

  Handlebars.AST.StringNode = function(string) {
    this.type = "STRING";
    this.string = string;
  };

  Handlebars.AST.IntegerNode = function(integer) {
    this.type = "INTEGER";
    this.integer = integer;
  };

  Handlebars.AST.BooleanNode = function(bool) {
    this.type = "BOOLEAN";
    this.bool = bool;
  };

  Handlebars.AST.CommentNode = function(comment) {
    this.type = "comment";
    this.comment = comment;
  };

})();;
// lib/handlebars/utils.js
Handlebars.Exception = function(message) {
  var tmp = Error.prototype.constructor.apply(this, arguments);

  for (var p in tmp) {
    if (tmp.hasOwnProperty(p)) { this[p] = tmp[p]; }
  }

  this.message = tmp.message;
};
Handlebars.Exception.prototype = new Error;

// Build out our basic SafeString type
Handlebars.SafeString = function(string) {
  this.string = string;
};
Handlebars.SafeString.prototype.toString = function() {
  return this.string.toString();
};

(function() {
  var escape = {
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "`": "&#x60;"
  };

  var badChars = /&(?!\w+;)|[<>"'`]/g;
  var possible = /[&<>"'`]/;

  var escapeChar = function(chr) {
    return escape[chr] || "&amp;";
  };

  Handlebars.Utils = {
    escapeExpression: function(string) {
      // don't escape SafeStrings, since they're already safe
      if (string instanceof Handlebars.SafeString) {
        return string.toString();
      } else if (string == null || string === false) {
        return "";
      }

      if(!possible.test(string)) { return string; }
      return string.replace(badChars, escapeChar);
    },

    isEmpty: function(value) {
      if (typeof value === "undefined") {
        return true;
      } else if (value === null) {
        return true;
      } else if (value === false) {
        return true;
      } else if(Object.prototype.toString.call(value) === "[object Array]" && value.length === 0) {
        return true;
      } else {
        return false;
      }
    }
  };
})();;
// lib/handlebars/compiler/compiler.js
Handlebars.Compiler = function() {};
Handlebars.JavaScriptCompiler = function() {};

(function(Compiler, JavaScriptCompiler) {
  Compiler.OPCODE_MAP = {
    appendContent: 1,
    getContext: 2,
    lookupWithHelpers: 3,
    lookup: 4,
    append: 5,
    invokeMustache: 6,
    appendEscaped: 7,
    pushString: 8,
    truthyOrFallback: 9,
    functionOrFallback: 10,
    invokeProgram: 11,
    invokePartial: 12,
    push: 13,
    assignToHash: 15,
    pushStringParam: 16
  };

  Compiler.MULTI_PARAM_OPCODES = {
    appendContent: 1,
    getContext: 1,
    lookupWithHelpers: 2,
    lookup: 1,
    invokeMustache: 3,
    pushString: 1,
    truthyOrFallback: 1,
    functionOrFallback: 1,
    invokeProgram: 3,
    invokePartial: 1,
    push: 1,
    assignToHash: 1,
    pushStringParam: 1
  };

  Compiler.DISASSEMBLE_MAP = {};

  for(var prop in Compiler.OPCODE_MAP) {
    var value = Compiler.OPCODE_MAP[prop];
    Compiler.DISASSEMBLE_MAP[value] = prop;
  }

  Compiler.multiParamSize = function(code) {
    return Compiler.MULTI_PARAM_OPCODES[Compiler.DISASSEMBLE_MAP[code]];
  };

  Compiler.prototype = {
    compiler: Compiler,

    disassemble: function() {
      var opcodes = this.opcodes, opcode, nextCode;
      var out = [], str, name, value;

      for(var i=0, l=opcodes.length; i<l; i++) {
        opcode = opcodes[i];

        if(opcode === 'DECLARE') {
          name = opcodes[++i];
          value = opcodes[++i];
          out.push("DECLARE " + name + " = " + value);
        } else {
          str = Compiler.DISASSEMBLE_MAP[opcode];

          var extraParams = Compiler.multiParamSize(opcode);
          var codes = [];

          for(var j=0; j<extraParams; j++) {
            nextCode = opcodes[++i];

            if(typeof nextCode === "string") {
              nextCode = "\"" + nextCode.replace("\n", "\\n") + "\"";
            }

            codes.push(nextCode);
          }

          str = str + " " + codes.join(" ");

          out.push(str);
        }
      }

      return out.join("\n");
    },

    guid: 0,

    compile: function(program, options) {
      this.children = [];
      this.depths = {list: []};
      this.options = options;

      // These changes will propagate to the other compiler components
      var knownHelpers = this.options.knownHelpers;
      this.options.knownHelpers = {
        'helperMissing': true,
        'blockHelperMissing': true,
        'each': true,
        'if': true,
        'unless': true,
        'with': true,
        'log': true
      };
      if (knownHelpers) {
        for (var name in knownHelpers) {
          this.options.knownHelpers[name] = knownHelpers[name];
        }
      }

      return this.program(program);
    },

    accept: function(node) {
      return this[node.type](node);
    },

    program: function(program) {
      var statements = program.statements, statement;
      this.opcodes = [];

      for(var i=0, l=statements.length; i<l; i++) {
        statement = statements[i];
        this[statement.type](statement);
      }
      this.isSimple = l === 1;

      this.depths.list = this.depths.list.sort(function(a, b) {
        return a - b;
      });

      return this;
    },

    compileProgram: function(program) {
      var result = new this.compiler().compile(program, this.options);
      var guid = this.guid++;

      this.usePartial = this.usePartial || result.usePartial;

      this.children[guid] = result;

      for(var i=0, l=result.depths.list.length; i<l; i++) {
        depth = result.depths.list[i];

        if(depth < 2) { continue; }
        else { this.addDepth(depth - 1); }
      }

      return guid;
    },

    block: function(block) {
      var mustache = block.mustache;
      var depth, child, inverse, inverseGuid;

      var params = this.setupStackForMustache(mustache);

      var programGuid = this.compileProgram(block.program);

      if(block.program.inverse) {
        inverseGuid = this.compileProgram(block.program.inverse);
        this.declare('inverse', inverseGuid);
      }

      this.opcode('invokeProgram', programGuid, params.length, !!mustache.hash);
      this.declare('inverse', null);
      this.opcode('append');
    },

    inverse: function(block) {
      var params = this.setupStackForMustache(block.mustache);

      var programGuid = this.compileProgram(block.program);

      this.declare('inverse', programGuid);

      this.opcode('invokeProgram', null, params.length, !!block.mustache.hash);
      this.declare('inverse', null);
      this.opcode('append');
    },

    hash: function(hash) {
      var pairs = hash.pairs, pair, val;

      this.opcode('push', '{}');

      for(var i=0, l=pairs.length; i<l; i++) {
        pair = pairs[i];
        val  = pair[1];

        this.accept(val);
        this.opcode('assignToHash', pair[0]);
      }
    },

    partial: function(partial) {
      var id = partial.id;
      this.usePartial = true;

      if(partial.context) {
        this.ID(partial.context);
      } else {
        this.opcode('push', 'depth0');
      }

      this.opcode('invokePartial', id.original);
      this.opcode('append');
    },

    content: function(content) {
      this.opcode('appendContent', content.string);
    },

    mustache: function(mustache) {
      var params = this.setupStackForMustache(mustache);

      this.opcode('invokeMustache', params.length, mustache.id.original, !!mustache.hash);

      if(mustache.escaped && !this.options.noEscape) {
        this.opcode('appendEscaped');
      } else {
        this.opcode('append');
      }
    },

    ID: function(id) {
      this.addDepth(id.depth);

      this.opcode('getContext', id.depth);

      this.opcode('lookupWithHelpers', id.parts[0] || null, id.isScoped || false);

      for(var i=1, l=id.parts.length; i<l; i++) {
        this.opcode('lookup', id.parts[i]);
      }
    },

    STRING: function(string) {
      this.opcode('pushString', string.string);
    },

    INTEGER: function(integer) {
      this.opcode('push', integer.integer);
    },

    BOOLEAN: function(bool) {
      this.opcode('push', bool.bool);
    },

    comment: function() {},

    // HELPERS
    pushParams: function(params) {
      var i = params.length, param;

      while(i--) {
        param = params[i];

        if(this.options.stringParams) {
          if(param.depth) {
            this.addDepth(param.depth);
          }

          this.opcode('getContext', param.depth || 0);
          this.opcode('pushStringParam', param.string);
        } else {
          this[param.type](param);
        }
      }
    },

    opcode: function(name, val1, val2, val3) {
      this.opcodes.push(Compiler.OPCODE_MAP[name]);
      if(val1 !== undefined) { this.opcodes.push(val1); }
      if(val2 !== undefined) { this.opcodes.push(val2); }
      if(val3 !== undefined) { this.opcodes.push(val3); }
    },

    declare: function(name, value) {
      this.opcodes.push('DECLARE');
      this.opcodes.push(name);
      this.opcodes.push(value);
    },

    addDepth: function(depth) {
      if(depth === 0) { return; }

      if(!this.depths[depth]) {
        this.depths[depth] = true;
        this.depths.list.push(depth);
      }
    },

    setupStackForMustache: function(mustache) {
      var params = mustache.params;

      this.pushParams(params);

      if(mustache.hash) {
        this.hash(mustache.hash);
      }

      this.ID(mustache.id);

      return params;
    }
  };

  JavaScriptCompiler.prototype = {
    // PUBLIC API: You can override these methods in a subclass to provide
    // alternative compiled forms for name lookup and buffering semantics
    nameLookup: function(parent, name, type) {
			if (/^[0-9]+$/.test(name)) {
        return parent + "[" + name + "]";
      } else if (JavaScriptCompiler.isValidJavaScriptVariableName(name)) {
	    	return parent + "." + name;
			}
			else {
				return parent + "['" + name + "']";
      }
    },

    appendToBuffer: function(string) {
      if (this.environment.isSimple) {
        return "return " + string + ";";
      } else {
        return "buffer += " + string + ";";
      }
    },

    initializeBuffer: function() {
      return this.quotedString("");
    },

    namespace: "Handlebars",
    // END PUBLIC API

    compile: function(environment, options, context, asObject) {
      this.environment = environment;
      this.options = options || {};

      this.name = this.environment.name;
      this.isChild = !!context;
      this.context = context || {
        programs: [],
        aliases: { self: 'this' },
        registers: {list: []}
      };

      this.preamble();

      this.stackSlot = 0;
      this.stackVars = [];

      this.compileChildren(environment, options);

      var opcodes = environment.opcodes, opcode;

      this.i = 0;

      for(l=opcodes.length; this.i<l; this.i++) {
        opcode = this.nextOpcode(0);

        if(opcode[0] === 'DECLARE') {
          this.i = this.i + 2;
          this[opcode[1]] = opcode[2];
        } else {
          this.i = this.i + opcode[1].length;
          this[opcode[0]].apply(this, opcode[1]);
        }
      }

      return this.createFunctionContext(asObject);
    },

    nextOpcode: function(n) {
      var opcodes = this.environment.opcodes, opcode = opcodes[this.i + n], name, val;
      var extraParams, codes;

      if(opcode === 'DECLARE') {
        name = opcodes[this.i + 1];
        val  = opcodes[this.i + 2];
        return ['DECLARE', name, val];
      } else {
        name = Compiler.DISASSEMBLE_MAP[opcode];

        extraParams = Compiler.multiParamSize(opcode);
        codes = [];

        for(var j=0; j<extraParams; j++) {
          codes.push(opcodes[this.i + j + 1 + n]);
        }

        return [name, codes];
      }
    },

    eat: function(opcode) {
      this.i = this.i + opcode.length;
    },

    preamble: function() {
      var out = [];

      // this register will disambiguate helper lookup from finding a function in
      // a context. This is necessary for mustache compatibility, which requires
      // that context functions in blocks are evaluated by blockHelperMissing, and
      // then proceed as if the resulting value was provided to blockHelperMissing.
      this.useRegister('foundHelper');

      if (!this.isChild) {
        var namespace = this.namespace;
        var copies = "helpers = helpers || " + namespace + ".helpers;";
        if(this.environment.usePartial) { copies = copies + " partials = partials || " + namespace + ".partials;"; }
        out.push(copies);
      } else {
        out.push('');
      }

      if (!this.environment.isSimple) {
        out.push(", buffer = " + this.initializeBuffer());
      } else {
        out.push("");
      }

      // track the last context pushed into place to allow skipping the
      // getContext opcode when it would be a noop
      this.lastContext = 0;
      this.source = out;
    },

    createFunctionContext: function(asObject) {
      var locals = this.stackVars;
      if (!this.isChild) {
        locals = locals.concat(this.context.registers.list);
      }

      if(locals.length > 0) {
        this.source[1] = this.source[1] + ", " + locals.join(", ");
      }

      // Generate minimizer alias mappings
      if (!this.isChild) {
        var aliases = []
        for (var alias in this.context.aliases) {
          this.source[1] = this.source[1] + ', ' + alias + '=' + this.context.aliases[alias];
        }
      }

      if (this.source[1]) {
        this.source[1] = "var " + this.source[1].substring(2) + ";";
      }

      // Merge children
      if (!this.isChild) {
        this.source[1] += '\n' + this.context.programs.join('\n') + '\n';
      }

      if (!this.environment.isSimple) {
        this.source.push("return buffer;");
      }

      var params = this.isChild ? ["depth0", "data"] : ["Handlebars", "depth0", "helpers", "partials", "data"];

      for(var i=0, l=this.environment.depths.list.length; i<l; i++) {
        params.push("depth" + this.environment.depths.list[i]);
      }

      if (asObject) {
        params.push(this.source.join("\n  "));

        return Function.apply(this, params);
      } else {
        var functionSource = 'function ' + (this.name || '') + '(' + params.join(',') + ') {\n  ' + this.source.join("\n  ") + '}';
        Handlebars.log(Handlebars.logger.DEBUG, functionSource + "\n\n");
        return functionSource;
      }
    },

    appendContent: function(content) {
      this.source.push(this.appendToBuffer(this.quotedString(content)));
    },

    append: function() {
      var local = this.popStack();
      this.source.push("if(" + local + " || " + local + " === 0) { " + this.appendToBuffer(local) + " }");
      if (this.environment.isSimple) {
        this.source.push("else { " + this.appendToBuffer("''") + " }");
      }
    },

    appendEscaped: function() {
      var opcode = this.nextOpcode(1), extra = "";
      this.context.aliases.escapeExpression = 'this.escapeExpression';

      if(opcode[0] === 'appendContent') {
        extra = " + " + this.quotedString(opcode[1][0]);
        this.eat(opcode);
      }

      this.source.push(this.appendToBuffer("escapeExpression(" + this.popStack() + ")" + extra));
    },

    getContext: function(depth) {
      if(this.lastContext !== depth) {
        this.lastContext = depth;
      }
    },

    lookupWithHelpers: function(name, isScoped) {
      if(name) {
        var topStack = this.nextStack();

        this.usingKnownHelper = false;

        var toPush;
        if (!isScoped && this.options.knownHelpers[name]) {
          toPush = topStack + " = " + this.nameLookup('helpers', name, 'helper');
          this.usingKnownHelper = true;
        } else if (isScoped || this.options.knownHelpersOnly) {
          toPush = topStack + " = " + this.nameLookup('depth' + this.lastContext, name, 'context');
        } else {
          this.register('foundHelper', this.nameLookup('helpers', name, 'helper'));
          toPush = topStack + " = foundHelper || " + this.nameLookup('depth' + this.lastContext, name, 'context');
        }

        toPush += ';';
        this.source.push(toPush);
      } else {
        this.pushStack('depth' + this.lastContext);
      }
    },

    lookup: function(name) {
      var topStack = this.topStack();
      this.source.push(topStack + " = (" + topStack + " === null || " + topStack + " === undefined || " + topStack + " === false ? " +
 				topStack + " : " + this.nameLookup(topStack, name, 'context') + ");");
    },

    pushStringParam: function(string) {
      this.pushStack('depth' + this.lastContext);
      this.pushString(string);
    },

    pushString: function(string) {
      this.pushStack(this.quotedString(string));
    },

    push: function(name) {
      this.pushStack(name);
    },

    invokeMustache: function(paramSize, original, hasHash) {
      this.populateParams(paramSize, this.quotedString(original), "{}", null, hasHash, function(nextStack, helperMissingString, id) {
        if (!this.usingKnownHelper) {
          this.context.aliases.helperMissing = 'helpers.helperMissing';
          this.context.aliases.undef = 'void 0';
          this.source.push("else if(" + id + "=== undef) { " + nextStack + " = helperMissing.call(" + helperMissingString + "); }");
          if (nextStack !== id) {
            this.source.push("else { " + nextStack + " = " + id + "; }");
          }
        }
      });
    },

    invokeProgram: function(guid, paramSize, hasHash) {
      var inverse = this.programExpression(this.inverse);
      var mainProgram = this.programExpression(guid);

      this.populateParams(paramSize, null, mainProgram, inverse, hasHash, function(nextStack, helperMissingString, id) {
        if (!this.usingKnownHelper) {
          this.context.aliases.blockHelperMissing = 'helpers.blockHelperMissing';
          this.source.push("else { " + nextStack + " = blockHelperMissing.call(" + helperMissingString + "); }");
        }
      });
    },

    populateParams: function(paramSize, helperId, program, inverse, hasHash, fn) {
      var needsRegister = hasHash || this.options.stringParams || inverse || this.options.data;
      var id = this.popStack(), nextStack;
      var params = [], param, stringParam, stringOptions;

      if (needsRegister) {
        this.register('tmp1', program);
        stringOptions = 'tmp1';
      } else {
        stringOptions = '{ hash: {} }';
      }

      if (needsRegister) {
        var hash = (hasHash ? this.popStack() : '{}');
        this.source.push('tmp1.hash = ' + hash + ';');
      }

      if(this.options.stringParams) {
        this.source.push('tmp1.contexts = [];');
      }

      for(var i=0; i<paramSize; i++) {
        param = this.popStack();
        params.push(param);

        if(this.options.stringParams) {
          this.source.push('tmp1.contexts.push(' + this.popStack() + ');');
        }
      }

      if(inverse) {
        this.source.push('tmp1.fn = tmp1;');
        this.source.push('tmp1.inverse = ' + inverse + ';');
      }

      if(this.options.data) {
        this.source.push('tmp1.data = data;');
      }

      params.push(stringOptions);

      this.populateCall(params, id, helperId || id, fn, program !== '{}');
    },

    populateCall: function(params, id, helperId, fn, program) {
      var paramString = ["depth0"].concat(params).join(", ");
      var helperMissingString = ["depth0"].concat(helperId).concat(params).join(", ");

      var nextStack = this.nextStack();

      if (this.usingKnownHelper) {
        this.source.push(nextStack + " = " + id + ".call(" + paramString + ");");
      } else {
        this.context.aliases.functionType = '"function"';
        var condition = program ? "foundHelper && " : ""
        this.source.push("if(" + condition + "typeof " + id + " === functionType) { " + nextStack + " = " + id + ".call(" + paramString + "); }");
      }
      fn.call(this, nextStack, helperMissingString, id);
      this.usingKnownHelper = false;
    },

    invokePartial: function(context) {
      params = [this.nameLookup('partials', context, 'partial'), "'" + context + "'", this.popStack(), "helpers", "partials"];

      if (this.options.data) {
        params.push("data");
      }

      this.pushStack("self.invokePartial(" + params.join(", ") + ");");
    },

    assignToHash: function(key) {
      var value = this.popStack();
      var hash = this.topStack();

      this.source.push(hash + "['" + key + "'] = " + value + ";");
    },

    // HELPERS

    compiler: JavaScriptCompiler,

    compileChildren: function(environment, options) {
      var children = environment.children, child, compiler;

      for(var i=0, l=children.length; i<l; i++) {
        child = children[i];
        compiler = new this.compiler();

        this.context.programs.push('');     // Placeholder to prevent name conflicts for nested children
        var index = this.context.programs.length;
        child.index = index;
        child.name = 'program' + index;
        this.context.programs[index] = compiler.compile(child, options, this.context);
      }
    },

    programExpression: function(guid) {
      if(guid == null) { return "self.noop"; }

      var child = this.environment.children[guid],
          depths = child.depths.list;
      var programParams = [child.index, child.name, "data"];

      for(var i=0, l = depths.length; i<l; i++) {
        depth = depths[i];

        if(depth === 1) { programParams.push("depth0"); }
        else { programParams.push("depth" + (depth - 1)); }
      }

      if(depths.length === 0) {
        return "self.program(" + programParams.join(", ") + ")";
      } else {
        programParams.shift();
        return "self.programWithDepth(" + programParams.join(", ") + ")";
      }
    },

    register: function(name, val) {
      this.useRegister(name);
      this.source.push(name + " = " + val + ";");
    },

    useRegister: function(name) {
      if(!this.context.registers[name]) {
        this.context.registers[name] = true;
        this.context.registers.list.push(name);
      }
    },

    pushStack: function(item) {
      this.source.push(this.nextStack() + " = " + item + ";");
      return "stack" + this.stackSlot;
    },

    nextStack: function() {
      this.stackSlot++;
      if(this.stackSlot > this.stackVars.length) { this.stackVars.push("stack" + this.stackSlot); }
      return "stack" + this.stackSlot;
    },

    popStack: function() {
      return "stack" + this.stackSlot--;
    },

    topStack: function() {
      return "stack" + this.stackSlot;
    },

    quotedString: function(str) {
      return '"' + str
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r') + '"';
    }
  };

  var reservedWords = (
    "break else new var" +
    " case finally return void" +
    " catch for switch while" +
    " continue function this with" +
    " default if throw" +
    " delete in try" +
    " do instanceof typeof" +
    " abstract enum int short" +
    " boolean export interface static" +
    " byte extends long super" +
    " char final native synchronized" +
    " class float package throws" +
    " const goto private transient" +
    " debugger implements protected volatile" +
    " double import public let yield"
  ).split(" ");

  var compilerWords = JavaScriptCompiler.RESERVED_WORDS = {};

  for(var i=0, l=reservedWords.length; i<l; i++) {
    compilerWords[reservedWords[i]] = true;
  }

	JavaScriptCompiler.isValidJavaScriptVariableName = function(name) {
		if(!JavaScriptCompiler.RESERVED_WORDS[name] && /^[a-zA-Z_$][0-9a-zA-Z_$]+$/.test(name)) {
			return true;
		}
		return false;
	}

})(Handlebars.Compiler, Handlebars.JavaScriptCompiler);

Handlebars.precompile = function(string, options) {
  options = options || {};

  var ast = Handlebars.parse(string);
  var environment = new Handlebars.Compiler().compile(ast, options);
  return new Handlebars.JavaScriptCompiler().compile(environment, options);
};

Handlebars.compile = function(string, options) {
  options = options || {};

  var compiled;
  function compile() {
    var ast = Handlebars.parse(string);
    var environment = new Handlebars.Compiler().compile(ast, options);
    var templateSpec = new Handlebars.JavaScriptCompiler().compile(environment, options, undefined, true);
    return Handlebars.template(templateSpec);
  }

  // Template is only compiled on first use and cached after that point.
  return function(context, options) {
    if (!compiled) {
      compiled = compile();
    }
    return compiled.call(this, context, options);
  };
};
;
// lib/handlebars/runtime.js
Handlebars.VM = {
  template: function(templateSpec) {
    // Just add water
    var container = {
      escapeExpression: Handlebars.Utils.escapeExpression,
      invokePartial: Handlebars.VM.invokePartial,
      programs: [],
      program: function(i, fn, data) {
        var programWrapper = this.programs[i];
        if(data) {
          return Handlebars.VM.program(fn, data);
        } else if(programWrapper) {
          return programWrapper;
        } else {
          programWrapper = this.programs[i] = Handlebars.VM.program(fn);
          return programWrapper;
        }
      },
      programWithDepth: Handlebars.VM.programWithDepth,
      noop: Handlebars.VM.noop
    };

    return function(context, options) {
      options = options || {};
      return templateSpec.call(container, Handlebars, context, options.helpers, options.partials, options.data);
    };
  },

  programWithDepth: function(fn, data, $depth) {
    var args = Array.prototype.slice.call(arguments, 2);

    return function(context, options) {
      options = options || {};

      return fn.apply(this, [context, options.data || data].concat(args));
    };
  },
  program: function(fn, data) {
    return function(context, options) {
      options = options || {};

      return fn(context, options.data || data);
    };
  },
  noop: function() { return ""; },
  invokePartial: function(partial, name, context, helpers, partials, data) {
    options = { helpers: helpers, partials: partials, data: data };

    if(partial === undefined) {
      throw new Handlebars.Exception("The partial " + name + " could not be found");
    } else if(partial instanceof Function) {
      return partial(context, options);
    } else if (!Handlebars.compile) {
      throw new Handlebars.Exception("The partial " + name + " could not be compiled when running in runtime-only mode");
    } else {
      partials[name] = Handlebars.compile(partial);
      return partials[name](context, options);
    }
  }
};

Handlebars.template = Handlebars.VM.template;
;
define("vendors/handlebars", function(){});

/**
 * Sushi Template
 *
 * @module Sushi
 */
define('sushi.template',
	['sushi.core', 'vendors/handlebars'],

	function(Sushi) {
		/**
		 * Sushi Template
		 *
		 * @namespace Sushi
		 * @class template
		 */
		Sushi.namespace('template');
		
		var compile = function(string) {
			return Handlebars.compile(string);
		}

		Sushi.extend(Sushi.template, {
			compile: compile
		});
		
		return Sushi.template;
	}
);
define('vendors/qwery',["require", "exports", "module"], function(require, exports, module) {
/*!
  * Qwery - A Blazing Fast query selector engine
  * https://github.com/ded/qwery
  * copyright Dustin Diaz & Jacob Thornton 2011
  * MIT License
  */

!function (name, definition) {
  if (typeof module != 'undefined') module.exports = definition()
  else if (typeof define == 'function' && typeof define.amd == 'object') define(definition)
  else this[name] = definition()
}('qwery', function () {
  var context = this
    , doc = document
    , old = context.qwery
    , html = doc.documentElement
    , byClass = 'getElementsByClassName'
    , byTag = 'getElementsByTagName'
    , qSA = 'querySelectorAll'
    , id = /#([\w\-]+)/
    , clas = /\.[\w\-]+/g
    , idOnly = /^#([\w\-]+)$/
    , classOnly = /^\.([\w\-]+)$/
    , tagOnly = /^([\w\-]+)$/
    , tagAndOrClass = /^([\w]+)?\.([\w\-]+)$/
    , easy = new RegExp(idOnly.source + '|' + tagOnly.source + '|' + classOnly.source)
    , splittable = /(^|,)\s*[>~+]/
    , normalizr = /^\s+|\s*([,\s\+\~>]|$)\s*/g
    , splitters = /[\s\>\+\~]/
    , splittersMore = /(?![\s\w\-\/\?\&\=\:\.\(\)\!,@#%<>\{\}\$\*\^'"]*\]|[\s\w\+\-]*\))/
    , specialChars = /([.*+?\^=!:${}()|\[\]\/\\])/g
    , simple = /^(\*|[a-z0-9]+)?(?:([\.\#]+[\w\-\.#]+)?)/
    , attr = /\[([\w\-]+)(?:([\|\^\$\*\~]?\=)['"]?([ \w\-\/\?\&\=\:\.\(\)\!,@#%<>\{\}\$\*\^]+)["']?)?\]/
    , pseudo = /:([\w\-]+)(\(['"]?([\s\w\+\-]+)['"]?\))?/
    , dividers = new RegExp('(' + splitters.source + ')' + splittersMore.source, 'g')
    , tokenizr = new RegExp(splitters.source + splittersMore.source)
    , chunker = new RegExp(simple.source + '(' + attr.source + ')?' + '(' + pseudo.source + ')?')
      // check if we can pass a selector to a non-CSS3 compatible qSA.
      // *not* suitable for validating a selector, it's too lose; it's the users' responsibility to pass valid selectors
      // this regex must be kept in sync with the one in tests.js
    , css2 = /^(([\w\-]*[#\.]?[\w\-]+|\*)?(\[[\w\-]+([\~\|]?=['"][ \w\-\/\?\&\=\:\.\(\)\!,@#%<>\{\}\$\*\^]+["'])?\])?(\:(link|visited|active|hover))?([\s>+~\.,]|(?:$)))+$/
    , walker = {
        ' ': function (node) {
          return node && node !== html && node.parentNode
        }
      , '>': function (node, contestant) {
          return node && node.parentNode == contestant.parentNode && node.parentNode
        }
      , '~': function (node) {
          return node && node.previousSibling
        }
      , '+': function (node, contestant, p1, p2) {
          if (!node) return false
          return (p1 = previous(node)) && (p2 = previous(contestant)) && p1 == p2 && p1
        }
      }

  function cache() {
    this.c = {}
  }
  cache.prototype = {
    g: function (k) {
      return this.c[k] || undefined
    }
  , s: function (k, v) {
      return (this.c[k] = v)
    }
  }

  var classCache = new cache()
    , cleanCache = new cache()
    , attrCache = new cache()
    , tokenCache = new cache()

  function classRegex(c) {
    return classCache.g(c) || classCache.s(c, new RegExp('(^|\\s+)' + c + '(\\s+|$)'));
  }

  // not quite as fast as inline loops in older browsers so don't use liberally
  function each(a, fn) {
    var i = 0, l = a.length
    for (; i < l; i++) fn.call(null, a[i])
  }

  function flatten(ar) {
    for (var r = [], i = 0, l = ar.length; i < l; ++i) arrayLike(ar[i]) ? (r = r.concat(ar[i])) : (r[r.length] = ar[i])
    return r
  }

  function arrayify(ar) {
    var i = 0, l = ar.length, r = []
    for (; i < l; i++) r[i] = ar[i]
    return r
  }

  function previous(n) {
    while (n = n.previousSibling) if (n.nodeType == 1) break;
    return n
  }

  function q(query) {
    return query.match(chunker)
  }

  // called using `this` as element and arguments from regex group results.
  // given => div.hello[title="world"]:foo('bar')
  // div.hello[title="world"]:foo('bar'), div, .hello, [title="world"], title, =, world, :foo('bar'), foo, ('bar'), bar]
  function interpret(whole, tag, idsAndClasses, wholeAttribute, attribute, qualifier, value, wholePseudo, pseudo, wholePseudoVal, pseudoVal) {
    var i, m, k, o, classes
    if (this.nodeType !== 1) return false
    if (tag && tag !== '*' && this.tagName && this.tagName.toLowerCase() !== tag) return false
    if (idsAndClasses && (m = idsAndClasses.match(id)) && m[1] !== this.id) return false
    if (idsAndClasses && (classes = idsAndClasses.match(clas))) {
      for (i = classes.length; i--;) {
        if (!classRegex(classes[i].slice(1)).test(this.className)) return false
      }
    }
    if (pseudo && qwery.pseudos[pseudo] && !qwery.pseudos[pseudo](this, pseudoVal)) {
      return false
    }
    if (wholeAttribute && !value) { // select is just for existance of attrib
      o = this.attributes
      for (k in o) {
        if (Object.prototype.hasOwnProperty.call(o, k) && (o[k].name || k) == attribute) {
          return this
        }
      }
    }
    if (wholeAttribute && !checkAttr(qualifier, getAttr(this, attribute) || '', value)) {
      // select is for attrib equality
      return false
    }
    return this
  }

  function clean(s) {
    return cleanCache.g(s) || cleanCache.s(s, s.replace(specialChars, '\\$1'))
  }

  function checkAttr(qualify, actual, val) {
    switch (qualify) {
    case '=':
      return actual == val
    case '^=':
      return actual.match(attrCache.g('^=' + val) || attrCache.s('^=' + val, new RegExp('^' + clean(val))))
    case '$=':
      return actual.match(attrCache.g('$=' + val) || attrCache.s('$=' + val, new RegExp(clean(val) + '$')))
    case '*=':
      return actual.match(attrCache.g(val) || attrCache.s(val, new RegExp(clean(val))))
    case '~=':
      return actual.match(attrCache.g('~=' + val) || attrCache.s('~=' + val, new RegExp('(?:^|\\s+)' + clean(val) + '(?:\\s+|$)')))
    case '|=':
      return actual.match(attrCache.g('|=' + val) || attrCache.s('|=' + val, new RegExp('^' + clean(val) + '(-|$)')))
    }
    return 0
  }

  // given a selector, first check for simple cases then collect all base candidate matches and filter
  function _qwery(selector, _root) {
    var r = [], ret = [], i, l, m, token, tag, els, intr, item, root = _root
      , tokens = tokenCache.g(selector) || tokenCache.s(selector, selector.split(tokenizr))
      , dividedTokens = selector.match(dividers)

    if (!tokens.length) return r

    token = (tokens = tokens.slice(0)).pop() // copy cached tokens, take the last one
    if (tokens.length && (m = tokens[tokens.length - 1].match(idOnly))) root = byId(_root, m[1])
    if (!root) return r

    intr = q(token)
    // collect base candidates to filter
    els = root !== _root && root.nodeType !== 9 && dividedTokens && /^[+~]$/.test(dividedTokens[dividedTokens.length - 1]) ?
      function (r) {
        while (root = root.nextSibling) {
          root.nodeType == 1 && (intr[1] ? intr[1] == root.tagName.toLowerCase() : 1) && (r[r.length] = root)
        }
        return r
      }([]) :
      root[byTag](intr[1] || '*')
    // filter elements according to the right-most part of the selector
    for (i = 0, l = els.length; i < l; i++) {
      if (item = interpret.apply(els[i], intr)) r[r.length] = item
    }
    if (!tokens.length) return r

    // filter further according to the rest of the selector (the left side)
    each(r, function(e) { if (ancestorMatch(e, tokens, dividedTokens)) ret[ret.length] = e })
    return ret
  }

  // compare element to a selector
  function is(el, selector, root) {
    if (isNode(selector)) return el == selector
    if (arrayLike(selector)) return !!~flatten(selector).indexOf(el) // if selector is an array, is el a member?

    var selectors = selector.split(','), tokens, dividedTokens
    while (selector = selectors.pop()) {
      tokens = tokenCache.g(selector) || tokenCache.s(selector, selector.split(tokenizr))
      dividedTokens = selector.match(dividers)
      tokens = tokens.slice(0) // copy array
      if (interpret.apply(el, q(tokens.pop())) && (!tokens.length || ancestorMatch(el, tokens, dividedTokens, root))) {
        return true
      }
    }
    return false
  }

  // given elements matching the right-most part of a selector, filter out any that don't match the rest
  function ancestorMatch(el, tokens, dividedTokens, root) {
    var cand
    // recursively work backwards through the tokens and up the dom, covering all options
    function crawl(e, i, p) {
      while (p = walker[dividedTokens[i]](p, e)) {
        if (isNode(p) && (found = interpret.apply(p, q(tokens[i])))) {
          if (i) {
            if (cand = crawl(p, i - 1, p)) return cand
          } else return p
        }
      }
    }
    return (cand = crawl(el, tokens.length - 1, el)) && (!root || isAncestor(cand, root))
  }

  function isNode(el, t) {
    return el && typeof el === 'object' && (t = el.nodeType) && (t == 1 || t == 9)
  }

  function uniq(ar) {
    var a = [], i, j
    o: for (i = 0; i < ar.length; ++i) {
      for (j = 0; j < a.length; ++j) {
        if (a[j] == ar[i]) {
          continue o
        }
      }
      a[a.length] = ar[i]
    }
    return a
  }

  function arrayLike(o) {
    return (typeof o === 'object' && isFinite(o.length))
  }

  function normalizeRoot(root) {
    if (!root) return doc
    if (typeof root == 'string') return qwery(root)[0]
    if (!root.nodeType && arrayLike(root)) return root[0]
    return root
  }

  function byId(root, id, el) {
    // if doc, query on it, else query the parent doc or if a detached fragment rewrite the query and run on the fragment
    return root.nodeType === 9 ? root.getElementById(id) :
      root.ownerDocument &&
        (((el = root.ownerDocument.getElementById(id)) && isAncestor(el, root) && el) ||
          (!isAncestor(root, root.ownerDocument) && select('[id="' + id + '"]', root)[0]))
  }

  function qwery(selector, _root) {
    var m, el, root = normalizeRoot(_root)

    // easy, fast cases that we can dispatch with simple DOM calls
    if (!root || !selector) return []
    if (selector === window || isNode(selector)) {
      return !_root || (selector !== window && isNode(root) && isAncestor(selector, root)) ? [selector] : []
    }
    if (selector && arrayLike(selector)) return flatten(selector)
    if (m = selector.match(easy)) {
      if (m[1]) return (el = byId(root, m[1])) ? [el] : []
      if (m[2]) return arrayify(root[byTag](m[2]))
      if (supportsCSS3 && m[3]) return arrayify(root[byClass](m[3]))
    }

    return select(selector, root)
  }

  // where the root is not document and a relationship selector is first we have to
  // do some awkward adjustments to get it to work, even with qSA
  function collectSelector(root, collector) {
    return function(s) {
      var oid, nid
      if (splittable.test(s)) {
        if (root.nodeType !== 9) {
         // make sure the el has an id, rewrite the query, set root to doc and run it
         if (!(nid = oid = root.getAttribute('id'))) root.setAttribute('id', nid = '__qwerymeupscotty')
         s = '[id="' + nid + '"]' + s // avoid byId and allow us to match context element
         collector(root.parentNode || root, s, true)
         oid || root.removeAttribute('id')
        }
        return;
      }
      s.length && collector(root, s, false)
    }
  }

  var isAncestor = 'compareDocumentPosition' in html ?
    function (element, container) {
      return (container.compareDocumentPosition(element) & 16) == 16
    } : 'contains' in html ?
    function (element, container) {
      container = container.nodeType === 9 || container == window ? html : container
      return container !== element && container.contains(element)
    } :
    function (element, container) {
      while (element = element.parentNode) if (element === container) return 1
      return 0
    }
  , getAttr = function() {
      // detect buggy IE src/href getAttribute() call
      var e = doc.createElement('p')
      return ((e.innerHTML = '<a href="#x">x</a>') && e.firstChild.getAttribute('href') != '#x') ?
        function(e, a) {
          return a === 'class' ? e.className : (a === 'href' || a === 'src') ?
            e.getAttribute(a, 2) : e.getAttribute(a)
        } :
        function(e, a) { return e.getAttribute(a) }
   }()
    // does native qSA support CSS3 level selectors
  , supportsCSS3 = function () {
      if (doc[byClass] && doc.querySelector && doc[qSA]) {
        try {
          var p = doc.createElement('p')
          p.innerHTML = '<a/>'
          return p[qSA](':nth-of-type(1)').length
        } catch (e) { }
      }
      return false
    }()
    // native support for CSS3 selectors
  , selectCSS3 = function (selector, root) {
      var result = [], ss, e
      try {
        if (root.nodeType === 9 || !splittable.test(selector)) {
          // most work is done right here, defer to qSA
          return arrayify(root[qSA](selector))
        }
        // special case where we need the services of `collectSelector()`
        each(ss = selector.split(','), collectSelector(root, function(ctx, s) {
          e = ctx[qSA](s)
          if (e.length == 1) result[result.length] = e.item(0)
          else if (e.length) result = result.concat(arrayify(e))
        }))
        return ss.length > 1 && result.length > 1 ? uniq(result) : result
      } catch(ex) { }
      return selectNonNative(selector, root)
    }
    // native support for CSS2 selectors only
  , selectCSS2qSA = function (selector, root) {
      var i, r, l, ss, result = []
      selector = selector.replace(normalizr, '$1')
      // safe to pass whole selector to qSA
      if (!splittable.test(selector) && css2.test(selector)) return arrayify(root[qSA](selector))
      each(ss = selector.split(','), collectSelector(root, function(ctx, s, rewrite) {
        // use native qSA if selector is compatile, otherwise use _qwery()
        r = css2.test(s) ? ctx[qSA](s) : _qwery(s, ctx)
        for (i = 0, l = r.length; i < l; i++) {
          if (ctx.nodeType === 9 || rewrite || isAncestor(r[i], root)) result[result.length] = r[i]
        }
      }))
      return ss.length > 1 && result.length > 1 ? uniq(result) : result
    }
    // no native selector support
  , selectNonNative = function (selector, root) {
      var result = [], items, m, i, l, r, ss
      selector = selector.replace(normalizr, '$1')
      if (m = selector.match(tagAndOrClass)) {
        r = classRegex(m[2])
        items = root[byTag](m[1] || '*')
        for (i = 0, l = items.length; i < l; i++) {
          if (r.test(items[i].className)) result[result.length] = items[i]
        }
        return result
      }
      // more complex selector, get `_qwery()` to do the work for us
      each(ss = selector.split(','), collectSelector(root, function(ctx, s, rewrite) {
        r = _qwery(s, ctx)
        for (i = 0, l = r.length; i < l; i++) {
          if (ctx.nodeType === 9 || rewrite || isAncestor(r[i], root)) result[result.length] = r[i]
        }
      }))
      return ss.length > 1 && result.length > 1 ? uniq(result) : result
    }
  , select = supportsCSS3 ? selectCSS3 : doc[qSA] ? selectCSS2qSA : selectNonNative

  qwery.uniq = uniq
  qwery.is = is
  qwery.pseudos = {}

  qwery.noConflict = function () {
    context.qwery = old
    return this
  }

  return qwery
})

});

define('vendors/bonzo',["require", "exports", "module"], function(require, exports, module) {
/*!
  * Bonzo: DOM Utility (c) Dustin Diaz 2011
  * https://github.com/ded/bonzo
  * License MIT
  */
!function (name, definition) {
  if (typeof module != 'undefined') module.exports = definition()
  else if (typeof define == 'function' && define.amd) define(name, definition)
  else this[name] = definition()
}('bonzo', function() {
  var context = this
    , old = context.bonzo
    , win = window
    , doc = win.document
    , html = doc.documentElement
    , parentNode = 'parentNode'
    , query = null
    , specialAttributes = /^checked|value|selected$/
    , specialTags = /select|fieldset|table|tbody|tfoot|td|tr|colgroup/i
    , table = [ '<table>', '</table>', 1 ]
    , td = [ '<table><tbody><tr>', '</tr></tbody></table>', 3 ]
    , option = [ '<select>', '</select>', 1 ]
    , tagMap = {
        thead: table, tbody: table, tfoot: table, colgroup: table, caption: table
        , tr: [ '<table><tbody>', '</tbody></table>', 2 ]
        , th: td , td: td
        , col: [ '<table><colgroup>', '</colgroup></table>', 2 ]
        , fieldset: [ '<form>', '</form>', 1 ]
        , legend: [ '<form><fieldset>', '</fieldset></form>', 2 ]
        , option: option
        , optgroup: option }
    , stateAttributes = /^checked|selected$/
    , ie = /msie/i.test(navigator.userAgent)
    , uidMap = {}
    , uuids = 0
    , digit = /^-?[\d\.]+$/
    , dattr = /^data-(.+)$/
    , px = 'px'
    , setAttribute = 'setAttribute'
    , getAttribute = 'getAttribute'
    , byTag = 'getElementsByTagName'
    , features = function() {
        var e = doc.createElement('p')
        e.innerHTML = '<a href="#x">x</a><table style="float:left;"></table>'
        return {
          hrefExtended: e[byTag]('a')[0][getAttribute]('href') != '#x' // IE < 8
          , autoTbody: e[byTag]('tbody').length !== 0 // IE < 8
          , computedStyle: doc.defaultView && doc.defaultView.getComputedStyle
          , cssFloat: e[byTag]('table')[0].style.styleFloat ? 'styleFloat' : 'cssFloat'
          , transform: function () {
              var props = ['webkitTransform', 'MozTransform', 'OTransform', 'msTransform', 'Transform'], i
              for (i = 0; i < props.length; i++) {
                if (props[i] in e.style) return props[i]
              }
            }()
        }
      }()
    , trimReplace = /(^\s*|\s*$)/g
    , unitless = { lineHeight: 1, zoom: 1, zIndex: 1, opacity: 1 }
    , trim = String.prototype.trim ?
        function (s) {
          return s.trim()
        } :
        function (s) {
          return s.replace(trimReplace, '')
        }

  function classReg(c) {
    return new RegExp("(^|\\s+)" + c + "(\\s+|$)")
  }

  function each(ar, fn, scope) {
    for (var i = 0, l = ar.length; i < l; i++) fn.call(scope || ar[i], ar[i], i, ar)
    return ar
  }

  function deepEach(ar, fn, scope) {
    for (var i = 0, l = ar.length; i < l; i++) {
      if (isNode(ar[i])) {
        deepEach(ar[i].childNodes, fn, scope);
        fn.call(scope || ar[i], ar[i], i, ar);
      }
    }
    return ar;
  }

  function camelize(s) {
    return s.replace(/-(.)/g, function (m, m1) {
      return m1.toUpperCase()
    })
  }

  function decamelize(s) {
    return s ? s.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase() : s
  }

  function data(el) {
    el[getAttribute]('data-node-uid') || el[setAttribute]('data-node-uid', ++uuids)
    uid = el[getAttribute]('data-node-uid')
    return uidMap[uid] || (uidMap[uid] = {})
  }

  function clearData(el) {
    uid = el[getAttribute]('data-node-uid')
    uid && (delete uidMap[uid])
  }

  function dataValue(d) {
    try {
      return d === 'true' ? true : d === 'false' ? false : d === 'null' ? null : !isNaN(d) ? parseFloat(d) : d;
    } catch(e) {}
    return undefined
  }

  function isNode(node) {
    return node && node.nodeName && node.nodeType == 1
  }

  function some(ar, fn, scope, i) {
    for (i = 0, j = ar.length; i < j; ++i) if (fn.call(scope, ar[i], i, ar)) return true
    return false
  }

  function styleProperty(p) {
      (p == 'transform' && (p = features.transform)) ||
        (/^transform-?[Oo]rigin$/.test(p) && (p = features.transform + "Origin")) ||
        (p == 'float' && (p = features.cssFloat))
      return p ? camelize(p) : null
  }

  var getStyle = features.computedStyle ?
    function (el, property) {
      var value = null
        , computed = doc.defaultView.getComputedStyle(el, '')
      computed && (value = computed[property])
      return el.style[property] || value
    } :

    (ie && html.currentStyle) ?

    function (el, property) {
      if (property == 'opacity') {
        var val = 100
        try {
          val = el.filters['DXImageTransform.Microsoft.Alpha'].opacity
        } catch (e1) {
          try {
            val = el.filters('alpha').opacity
          } catch (e2) {}
        }
        return val / 100
      }
      var value = el.currentStyle ? el.currentStyle[property] : null
      return el.style[property] || value
    } :

    function (el, property) {
      return el.style[property]
    }

  // this insert method is intense
  function insert(target, host, fn) {
    var i = 0, self = host || this, r = []
      // target nodes could be a css selector if it's a string and a selector engine is present
      // otherwise, just use target
      , nodes = query && typeof target == 'string' && target.charAt(0) != '<' ? query(target) : target
    // normalize each node in case it's still a string and we need to create nodes on the fly
    each(normalize(nodes), function (t) {
      each(self, function (el) {
        var n = !el[parentNode] || (el[parentNode] && !el[parentNode][parentNode]) ?
          function () {
            var c = el.cloneNode(true)
            // check for existence of an event cloner
            // preferably https://github.com/fat/bean
            // otherwise Bonzo won't do this for you
            self.$ && self.cloneEvents && self.$(c).cloneEvents(el)
            return c
          }() : el
        fn(t, n)
        r[i] = n
        i++
      })
    }, this)
    each(r, function (e, i) {
      self[i] = e
    })
    self.length = i
    return self
  }

  function xy(el, x, y) {
    var $el = bonzo(el)
      , style = $el.css('position')
      , offset = $el.offset()
      , rel = 'relative'
      , isRel = style == rel
      , delta = [parseInt($el.css('left'), 10), parseInt($el.css('top'), 10)]

    if (style == 'static') {
      $el.css('position', rel)
      style = rel
    }

    isNaN(delta[0]) && (delta[0] = isRel ? 0 : el.offsetLeft)
    isNaN(delta[1]) && (delta[1] = isRel ? 0 : el.offsetTop)

    x != null && (el.style.left = x - offset.left + delta[0] + px)
    y != null && (el.style.top = y - offset.top + delta[1] + px)

  }

  function hasClass(el, c) {
    return classReg(c).test(el.className)
  }
  function addClass(el, c) {
    el.className = trim(el.className + ' ' + c)
  }
  function removeClass(el, c) {
    el.className = trim(el.className.replace(classReg(c), ' '))
  }

  // this allows method calling for setting values
  // example:

  // bonzo(elements).css('color', function (el) {
  //   return el.getAttribute('data-original-color')
  // })

  function setter(el, v) {
    return typeof v == 'function' ? v(el) : v
  }

  function Bonzo(elements) {
    this.length = 0
    if (elements) {
      elements = typeof elements !== 'string' &&
        !elements.nodeType &&
        typeof elements.length !== 'undefined' ?
          elements :
          [elements]
      this.length = elements.length
      for (var i = 0; i < elements.length; i++) {
        this[i] = elements[i]
      }
    }
  }

  Bonzo.prototype = {

      get: function (index) {
        return this[index]
      }

    , each: function (fn, scope) {
        return each(this, fn, scope)
      }

    , deepEach: function (fn, scope) {
        return deepEach(this, fn, scope)
      }

    , map: function (fn, reject) {
        var m = [], n, i
        for (i = 0; i < this.length; i++) {
          n = fn.call(this, this[i], i)
          reject ? (reject(n) && m.push(n)) : m.push(n)
        }
        return m
      }

    , first: function () {
        return bonzo(this.length ? this[0] : [])
      }

    , last: function () {
        return bonzo(this.length ? this[this.length - 1] : [])
      }

    , html: function (h, text) {
        var method = text ?
          html.textContent === undefined ?
            'innerText' :
            'textContent' :
          'innerHTML', m;
        function append(el) {
          each(normalize(h), function (node) {
            el.appendChild(node)
          })
        }
        return typeof h !== 'undefined' ?
            this.empty().each(function (el) {
              !text && (m = el.tagName.match(specialTags)) ?
                append(el, m[0]) :
                (el[method] = h)
            }) :
          this[0] ? this[0][method] : ''
      }

    , text: function (text) {
        return this.html(text, 1)
      }

    , addClass: function (c) {
        return this.each(function (el) {
          hasClass(el, setter(el, c)) || addClass(el, setter(el, c))
        })
      }

    , removeClass: function (c) {
        return this.each(function (el) {
          hasClass(el, setter(el, c)) && removeClass(el, setter(el, c))
        })
      }

    , hasClass: function (c) {
        return some(this, function (el) {
          return hasClass(el, c)
        })
      }

    , toggleClass: function (c, condition) {
        return this.each(function (el) {
          typeof condition !== 'undefined' ?
            condition ? addClass(el, c) : removeClass(el, c) :
            hasClass(el, c) ? removeClass(el, c) : addClass(el, c)
        })
      }

    , show: function (type) {
        return this.each(function (el) {
          el.style.display = type || ''
        })
      }

    , hide: function () {
        return this.each(function (el) {
          el.style.display = 'none'
        })
      }

    , append: function (node) {
        return this.each(function (el) {
          each(normalize(node), function (i) {
            el.appendChild(i)
          })
        })
      }

    , prepend: function (node) {
        return this.each(function (el) {
          var first = el.firstChild
          each(normalize(node), function (i) {
            el.insertBefore(i, first)
          })
        })
      }

    , appendTo: function (target, host) {
        return insert.call(this, target, host, function (t, el) {
          t.appendChild(el)
        })
      }

    , prependTo: function (target, host) {
        return insert.call(this, target, host, function (t, el) {
          t.insertBefore(el, t.firstChild)
        })
      }

    , next: function () {
        return this.related('nextSibling')
      }

    , previous: function () {
        return this.related('previousSibling')
      }

    , related: function (method) {
        return this.map(
          function (el) {
            el = el[method]
            while (el && el.nodeType !== 1) {
              el = el[method]
            }
            return el || 0
          },
          function (el) {
            return el
          }
        )
      }

    , before: function (node) {
        return this.each(function (el) {
          each(bonzo.create(node), function (i) {
            el[parentNode].insertBefore(i, el)
          })
        })
      }

    , after: function (node) {
        return this.each(function (el) {
          each(bonzo.create(node), function (i) {
            el[parentNode].insertBefore(i, el.nextSibling)
          })
        })
      }

    , insertBefore: function (target, host) {
        return insert.call(this, target, host, function (t, el) {
          t[parentNode].insertBefore(el, t)
        })
      }

    , insertAfter: function (target, host) {
        return insert.call(this, target, host, function (t, el) {
          var sibling = t.nextSibling
          if (sibling) {
            t[parentNode].insertBefore(el, sibling);
          }
          else {
            t[parentNode].appendChild(el)
          }
        })
      }

    , replaceWith: function(html) {
        this.deepEach(clearData)

        return this.each(function (el) {
          el.parentNode.replaceChild(bonzo.create(html)[0], el)
        })
      }

    , focus: function () {
        return this.each(function (el) {
          el.focus()
        })
      }

    , blur: function () {
        return this.each(function (el) {
          el.blur()
        })
      }

    , css: function (o, v, p) {
        // is this a request for just getting a style?
        if (v === undefined && typeof o == 'string') {
          // repurpose 'v'
          v = this[0]
          if (!v) {
            return null
          }
          if (v === doc || v === win) {
            p = (v === doc) ? bonzo.doc() : bonzo.viewport()
            return o == 'width' ? p.width : o == 'height' ? p.height : ''
          }
          return (o = styleProperty(o)) ? getStyle(v, o) : null
        }
        var iter = o
        if (typeof o == 'string') {
          iter = {}
          iter[o] = v
        }

        if (ie && iter.opacity) {
          // oh this 'ol gamut
          iter.filter = 'alpha(opacity=' + (iter.opacity * 100) + ')'
          // give it layout
          iter.zoom = o.zoom || 1;
          delete iter.opacity;
        }

        function fn(el, p, v) {
          for (var k in iter) {
            if (iter.hasOwnProperty(k)) {
              v = iter[k];
              // change "5" to "5px" - unless you're line-height, which is allowed
              (p = styleProperty(k)) && digit.test(v) && !(p in unitless) && (v += px)
              el.style[p] = setter(el, v)
            }
          }
        }
        return this.each(fn)
      }

    , offset: function (x, y) {
        if (typeof x == 'number' || typeof y == 'number') {
          return this.each(function (el) {
            xy(el, x, y)
          })
        }
        if (!this[0]) return {
            top: 0
          , left: 0
          , height: 0
          , width: 0
        }
        var el = this[0]
          , width = el.offsetWidth
          , height = el.offsetHeight
          , top = el.offsetTop
          , left = el.offsetLeft
        while (el = el.offsetParent) {
          top = top + el.offsetTop
          left = left + el.offsetLeft
        }

        return {
            top: top
          , left: left
          , height: height
          , width: width
        }
      }

    , dim: function () {
        var el = this[0]
          , orig = !el.offsetWidth && !el.offsetHeight ?
             // el isn't visible, can't be measured properly, so fix that
             function (t, s) {
                s = {
                    position: el.style.position || ''
                  , visibility: el.style.visibility || ''
                  , display: el.style.display || ''
                }
                t.first().css({
                    position: 'absolute'
                  , visibility: 'hidden'
                  , display: 'block'
                })
                return s
              }(this) : null
          , width = el.offsetWidth
          , height = el.offsetHeight

        orig && this.first().css(orig)
        return {
            height: height
          , width: width
        }
      }

    , attr: function (k, v) {
        var el = this[0]
        if (typeof k != 'string' && !(k instanceof String)) {
          for (var n in k) {
            k.hasOwnProperty(n) && this.attr(n, k[n])
          }
          return this
        }
        return typeof v == 'undefined' ?
          specialAttributes.test(k) ?
            stateAttributes.test(k) && typeof el[k] == 'string' ?
              true : el[k] : (k == 'href' || k =='src') && features.hrefExtended ?
                el[getAttribute](k, 2) : el[getAttribute](k) :
          this.each(function (el) {
            specialAttributes.test(k) ? (el[k] = setter(el, v)) : el[setAttribute](k, setter(el, v))
          })
      }

    , val: function (s) {
        return (typeof s == 'string') ? this.attr('value', s) : this[0].value
      }

    , removeAttr: function (k) {
        return this.each(function (el) {
          stateAttributes.test(k) ? (el[k] = false) : el.removeAttribute(k)
        })
      }

    , data: function (k, v) {
        var el = this[0], uid, o, m
        if (typeof v === 'undefined') {
          o = data(el)
          if (typeof k === 'undefined') {
            each(el.attributes, function(a) {
              (m = (''+a.name).match(dattr)) && (o[camelize(m[1])] = dataValue(a.value))
            })
            return o
          } else {
            return typeof o[k] === 'undefined' ?
              (o[k] = dataValue(this.attr('data-' + decamelize(k)))) : o[k]
          }
        } else {
          return this.each(function (el) { data(el)[k] = v })
        }
      }

    , remove: function () {
        this.deepEach(clearData)

        return this.each(function (el) {
          el[parentNode] && el[parentNode].removeChild(el)
        })
      }

    , empty: function () {
        return this.each(function (el) {
          deepEach(el.childNodes, clearData)

          while (el.firstChild) {
            el.removeChild(el.firstChild)
          }
        })
      }

    , detach: function () {
        return this.map(function (el) {
          return el[parentNode].removeChild(el)
        })
      }

    , scrollTop: function (y) {
        return scroll.call(this, null, y, 'y')
      }

    , scrollLeft: function (x) {
        return scroll.call(this, x, null, 'x')
      }

    , toggle: function (callback, type) {
        this.each(function (el) {
          el.style.display = (el.offsetWidth || el.offsetHeight) ? 'none' : type || ''
        })
        callback && callback()
        return this
      }
  }

  function normalize(node) {
    return typeof node == 'string' ? bonzo.create(node) : isNode(node) ? [node] : node // assume [nodes]
  }

  function scroll(x, y, type) {
    var el = this[0]
    if (x == null && y == null) {
      return (isBody(el) ? getWindowScroll() : { x: el.scrollLeft, y: el.scrollTop })[type]
    }
    if (isBody(el)) {
      win.scrollTo(x, y)
    } else {
      x != null && (el.scrollLeft = x)
      y != null && (el.scrollTop = y)
    }
    return this
  }

  function isBody(element) {
    return element === win || (/^(?:body|html)$/i).test(element.tagName)
  }

  function getWindowScroll() {
    return { x: win.pageXOffset || html.scrollLeft, y: win.pageYOffset || html.scrollTop }
  }

  function bonzo(els, host) {
    return new Bonzo(els, host)
  }

  bonzo.setQueryEngine = function (q) {
    query = q;
    delete bonzo.setQueryEngine
  }

  bonzo.aug = function (o, target) {
    for (var k in o) {
      o.hasOwnProperty(k) && ((target || Bonzo.prototype)[k] = o[k])
    }
  }

  bonzo.create = function (node) {
    return typeof node == 'string' && node !== '' ?
      function () {
        var tag = /^\s*<([^\s>]+)/.exec(node)
          , el = doc.createElement('div')
          , els = []
          , p = tag ? tagMap[tag[1].toLowerCase()] : null
          , dep = p ? p[2] + 1 : 1
          , pn = parentNode
          , tb = features.autoTbody && p && p[0] == '<table>' && !(/<tbody/i).test(node)

        el.innerHTML = p ? (p[0] + node + p[1]) : node
        while (dep--) el = el.firstChild
        do {
          // tbody special case for IE<8, creates tbody on any empty table
          // we don't want it if we're just after a <thead>, <caption>, etc.
          if ((!tag || el.nodeType == 1) && (!tb || el.tagName.toLowerCase() != 'tbody')) {
            els.push(el)
          }
        } while (el = el.nextSibling)
        // IE < 9 gives us a parentNode which messes up insert() check for cloning
        // `dep` > 1 can also cause problems with the insert() check (must do this last)
        each(els, function(el) { el[pn] && el[pn].removeChild(el) })
        return els

      }() : isNode(node) ? [node.cloneNode(true)] : []
  }

  bonzo.doc = function () {
    var vp = bonzo.viewport()
    return {
        width: Math.max(doc.body.scrollWidth, html.scrollWidth, vp.width)
      , height: Math.max(doc.body.scrollHeight, html.scrollHeight, vp.height)
    }
  }

  bonzo.firstChild = function (el) {
    for (var c = el.childNodes, i = 0, j = (c && c.length) || 0, e; i < j; i++) {
      if (c[i].nodeType === 1) e = c[j = i]
    }
    return e
  }

  bonzo.viewport = function () {
    return {
        width: ie ? html.clientWidth : self.innerWidth
      , height: ie ? html.clientHeight : self.innerHeight
    }
  }

  bonzo.isAncestor = 'compareDocumentPosition' in html ?
    function (container, element) {
      return (container.compareDocumentPosition(element) & 16) == 16
    } : 'contains' in html ?
    function (container, element) {
      return container !== element && container.contains(element);
    } :
    function (container, element) {
      while (element = element[parentNode]) {
        if (element === container) {
          return true
        }
      }
      return false
    }

  bonzo.noConflict = function () {
    context.bonzo = old
    return this
  }

  return bonzo
})

});

define('vendors/bean',["require", "exports", "module"], function(require, exports, module) {
/*!
  * bean.js - copyright Jacob Thornton 2011
  * https://github.com/fat/bean
  * MIT License
  * special thanks to:
  * dean edwards: http://dean.edwards.name/
  * dperini: https://github.com/dperini/nwevents
  * the entire mootools team: github.com/mootools/mootools-core
  */
/*global module:true, define:true*/
!function (name, context, definition) {
  if (typeof module !== 'undefined') module.exports = definition(name, context);
  else if (typeof define === 'function' && typeof define.amd  === 'object') define(definition);
  else context[name] = definition(name, context);
}('bean', this, function (name, context) {
  var win = window
    , old = context[name]
    , overOut = /over|out/
    , namespaceRegex = /[^\.]*(?=\..*)\.|.*/
    , nameRegex = /\..*/
    , addEvent = 'addEventListener'
    , attachEvent = 'attachEvent'
    , removeEvent = 'removeEventListener'
    , detachEvent = 'detachEvent'
    , doc = document || {}
    , root = doc.documentElement || {}
    , W3C_MODEL = root[addEvent]
    , eventSupport = W3C_MODEL ? addEvent : attachEvent
    , slice = Array.prototype.slice
    , ONE = { one: 1 } // singleton for quick matching making add() do one()

    , nativeEvents = (function (hash, events, i) {
        for (i = 0; i < events.length; i++)
          hash[events[i]] = 1
        return hash
      })({}, (
          'click dblclick mouseup mousedown contextmenu ' +                  // mouse buttons
          'mousewheel DOMMouseScroll ' +                                     // mouse wheel
          'mouseover mouseout mousemove selectstart selectend ' +            // mouse movement
          'keydown keypress keyup ' +                                        // keyboard
          'orientationchange ' +                                             // mobile
          'touchstart touchmove touchend touchcancel ' +                     // touch
          'gesturestart gesturechange gestureend ' +                         // gesture
          'focus blur change reset select submit ' +                         // form elements
          'load unload beforeunload resize move DOMContentLoaded readystatechange ' + // window
          'error abort scroll ' +                                            // misc
          (W3C_MODEL ? // element.fireEvent('onXYZ'... is not forgiving if we try to fire an event
                       // that doesn't actually exist, so make sure we only do these on newer browsers
            'show ' +                                                          // mouse buttons
            'input invalid ' +                                                 // form elements
            'message readystatechange pageshow pagehide popstate ' +           // window
            'hashchange offline online ' +                                     // window
            'afterprint beforeprint ' +                                        // printing
            'dragstart dragenter dragover dragleave drag drop dragend ' +      // dnd
            'loadstart progress suspend emptied stalled loadmetadata ' +       // media
            'loadeddata canplay canplaythrough playing waiting seeking ' +     // media
            'seeked ended durationchange timeupdate play pause ratechange ' +  // media
            'volumechange cuechange ' +                                        // media
            'checking noupdate downloading cached updateready obsolete ' +     // appcache
            '' : '')
        ).split(' ')
      )

    , customEvents = (function () {
        function isDescendant(parent, node) {
          while ((node = node.parentNode) !== null) {
            if (node === parent) return true
          }
          return false
        }

        function check(event) {
          var related = event.relatedTarget
          if (!related) return related === null
          return (related !== this && related.prefix !== 'xul' && !/document/.test(this.toString()) && !isDescendant(this, related))
        }

        return {
            mouseenter: { base: 'mouseover', condition: check }
          , mouseleave: { base: 'mouseout', condition: check }
          , mousewheel: { base: /Firefox/.test(navigator.userAgent) ? 'DOMMouseScroll' : 'mousewheel' }
        }
      })()

    , fixEvent = (function () {
        var commonProps = 'altKey attrChange attrName bubbles cancelable ctrlKey currentTarget detail eventPhase getModifierState isTrusted metaKey relatedNode relatedTarget shiftKey srcElement target timeStamp type view which'.split(' ')
          , mouseProps = commonProps.concat('button buttons clientX clientY dataTransfer fromElement offsetX offsetY pageX pageY screenX screenY toElement'.split(' '))
          , keyProps = commonProps.concat('char charCode key keyCode'.split(' '))
          , preventDefault = 'preventDefault'
          , createPreventDefault = function (e) {
              return function () {
                if (e[preventDefault])
                  e[preventDefault]()
                else
                  e.returnValue = false
              }
            }
          , stopPropagation = 'stopPropagation'
          , createStopPropagation = function (e) {
              return function () {
                if (e[stopPropagation])
                  e[stopPropagation]()
                else
                  e.cancelBubble = true
              }
            }
          , createStop = function (e) {
              return function () {
                e[preventDefault]()
                e[stopPropagation]()
                e.stopped = true
              }
            }
          , copyProps = function (event, result, props) {
              var i, p
              for (i = props.length; i--;) {
                p = props[i]
                if (!(p in result) && p in event) result[p] = event[p]
              }
            }

        return function (event, isNative) {
          var result = { originalEvent: event, isNative: isNative }
          if (!event)
            return result

          var props
            , type = event.type
            , target = event.target || event.srcElement

          result[preventDefault] = createPreventDefault(event)
          result[stopPropagation] = createStopPropagation(event)
          result.stop = createStop(event)
          result.target = target && target.nodeType === 3 ? target.parentNode : target

          if (isNative) { // we only need basic augmentation on custom events, the rest is too expensive
            if (type.indexOf('key') !== -1) {
              props = keyProps
              result.keyCode = event.which || event.keyCode
            } else if ((/click|mouse|menu/i).test(type)) {
              props = mouseProps
              result.rightClick = event.which === 3 || event.button === 2
              result.pos = { x: 0, y: 0 }
              if (event.pageX || event.pageY) {
                result.clientX = event.pageX
                result.clientY = event.pageY
              } else if (event.clientX || event.clientY) {
                result.clientX = event.clientX + doc.body.scrollLeft + root.scrollLeft
                result.clientY = event.clientY + doc.body.scrollTop + root.scrollTop
              }
              if (overOut.test(type))
                result.relatedTarget = event.relatedTarget || event[(type === 'mouseover' ? 'from' : 'to') + 'Element']
            }
            copyProps(event, result, props || commonProps)
          }
          return result
        }
      })()

      // if we're in old IE we can't do onpropertychange on doc or win so we use doc.documentElement for both
    , targetElement = function (element, isNative) {
        return !W3C_MODEL && !isNative && (element === doc || element === win) ? root : element
      }

      // we use one of these per listener, of any type
    , RegEntry = (function () {
        function entry(element, type, handler, original, namespaces) {
          this.element = element
          this.type = type
          this.handler = handler
          this.original = original
          this.namespaces = namespaces
          this.custom = customEvents[type]
          this.isNative = nativeEvents[type] && element[eventSupport]
          this.eventType = W3C_MODEL || this.isNative ? type : 'propertychange'
          this.customType = !W3C_MODEL && !this.isNative && type
          this.target = targetElement(element, this.isNative)
          this.eventSupport = this.target[eventSupport]
        }

        entry.prototype = {
            // given a list of namespaces, is our entry in any of them?
            inNamespaces: function (checkNamespaces) {
              var i, j
              if (!checkNamespaces)
                return true
              if (!this.namespaces)
                return false
              for (i = checkNamespaces.length; i--;) {
                for (j = this.namespaces.length; j--;) {
                  if (checkNamespaces[i] === this.namespaces[j])
                    return true
                }
              }
              return false
            }

            // match by element, original fn (opt), handler fn (opt)
          , matches: function (checkElement, checkOriginal, checkHandler) {
              return this.element === checkElement &&
                (!checkOriginal || this.original === checkOriginal) &&
                (!checkHandler || this.handler === checkHandler)
            }
        }

        return entry
      })()

    , registry = (function () {
        // our map stores arrays by event type, just because it's better than storing
        // everything in a single array
        var map = {}

          // generic functional search of our registry for matching listeners,
          // `fn` returns false to break out of the loop
          , forAll = function (element, type, original, handler, fn) {
              if (!type || type === '*') {
                // search the whole registry
                for (var t in map) {
                  if (map.hasOwnProperty(t))
                    forAll(element, t, original, handler, fn)
                }
              } else {
                var i = 0, l, list = map[type], all = element === '*'
                if (!list)
                  return
                for (l = list.length; i < l; i++) {
                  if (all || list[i].matches(element, original, handler))
                    if (!fn(list[i], list, i, type))
                      return
                }
              }
            }

          , has = function (element, type, original) {
              // we're not using forAll here simply because it's a bit slower and this
              // needs to be fast
              var i, list = map[type]
              if (list) {
                for (i = list.length; i--;) {
                  if (list[i].matches(element, original, null))
                    return true
                }
              }
              return false
            }

          , get = function (element, type, original) {
              var entries = []
              forAll(element, type, original, null, function (entry) { return entries.push(entry) })
              return entries
            }

          , put = function (entry) {
              (map[entry.type] || (map[entry.type] = [])).push(entry)
              return entry
            }

          , del = function (entry) {
              forAll(entry.element, entry.type, null, entry.handler, function (entry, list, i) {
                list.splice(i, 1)
                return false
              })
            }

            // dump all entries, used for onunload
          , entries = function () {
              var t, entries = []
              for (t in map) {
                if (map.hasOwnProperty(t))
                  entries = entries.concat(map[t])
              }
              return entries
            }

        return { has: has, get: get, put: put, del: del, entries: entries }
      })()

      // add and remove listeners to DOM elements
    , listener = W3C_MODEL ? function (element, type, fn, add) {
        element[add ? addEvent : removeEvent](type, fn, false)
      } : function (element, type, fn, add, custom) {
        if (custom && add && element['_on' + custom] === null)
          element['_on' + custom] = 0
        element[add ? attachEvent : detachEvent]('on' + type, fn)
      }

    , nativeHandler = function (element, fn, args) {
        return function (event) {
          event = fixEvent(event || ((this.ownerDocument || this.document || this).parentWindow || win).event, true)
          return fn.apply(element, [event].concat(args))
        }
      }

    , customHandler = function (element, fn, type, condition, args, isNative) {
        return function (event) {
          if (condition ? condition.apply(this, arguments) : W3C_MODEL ? true : event && event.propertyName === '_on' + type || !event) {
            if (event)
              event = fixEvent(event || ((this.ownerDocument || this.document || this).parentWindow || win).event, isNative)
            fn.apply(element, event && (!args || args.length === 0) ? arguments : slice.call(arguments, event ? 0 : 1).concat(args))
          }
        }
      }

    , once = function (rm, element, type, fn, originalFn) {
        // wrap the handler in a handler that does a remove as well
        return function () {
          rm(element, type, originalFn)
          fn.apply(this, arguments)
        }
      }

    , removeListener = function (element, orgType, handler, namespaces) {
        var i, l, entry
          , type = (orgType && orgType.replace(nameRegex, ''))
          , handlers = registry.get(element, type, handler)

        for (i = 0, l = handlers.length; i < l; i++) {
          if (handlers[i].inNamespaces(namespaces)) {
            if ((entry = handlers[i]).eventSupport)
              listener(entry.target, entry.eventType, entry.handler, false, entry.type)
            // TODO: this is problematic, we have a registry.get() and registry.del() that
            // both do registry searches so we waste cycles doing this. Needs to be rolled into
            // a single registry.forAll(fn) that removes while finding, but the catch is that
            // we'll be splicing the arrays that we're iterating over. Needs extra tests to
            // make sure we don't screw it up. @rvagg
            registry.del(entry)
          }
        }
      }

    , addListener = function (element, orgType, fn, originalFn, args) {
        var entry
          , type = orgType.replace(nameRegex, '')
          , namespaces = orgType.replace(namespaceRegex, '').split('.')

        if (registry.has(element, type, fn))
          return element // no dupe
        if (type === 'unload')
          fn = once(removeListener, element, type, fn, originalFn) // self clean-up
        if (customEvents[type]) {
          if (customEvents[type].condition)
            fn = customHandler(element, fn, type, customEvents[type].condition, true)
          type = customEvents[type].base || type
        }
        entry = registry.put(new RegEntry(element, type, fn, originalFn, namespaces[0] && namespaces))
        entry.handler = entry.isNative ?
          nativeHandler(element, entry.handler, args) :
          customHandler(element, entry.handler, type, false, args, false)
        if (entry.eventSupport)
          listener(entry.target, entry.eventType, entry.handler, true, entry.customType)
      }

    , del = function (selector, fn, $) {
        return function (e) {
          var target, i, array = typeof selector === 'string' ? $(selector, this) : selector
          for (target = e.target; target && target !== this; target = target.parentNode) {
            for (i = array.length; i--;) {
              if (array[i] === target) {
                return fn.apply(target, arguments)
              }
            }
          }
        }
      }

    , remove = function (element, typeSpec, fn) {
        var k, m, type, namespaces, i
          , rm = removeListener
          , isString = typeSpec && typeof typeSpec === 'string'

        if (isString && typeSpec.indexOf(' ') > 0) {
          // remove(el, 't1 t2 t3', fn) or remove(el, 't1 t2 t3')
          typeSpec = typeSpec.split(' ')
          for (i = typeSpec.length; i--;)
            remove(element, typeSpec[i], fn)
          return element
        }
        type = isString && typeSpec.replace(nameRegex, '')
        if (type && customEvents[type])
          type = customEvents[type].type
        if (!typeSpec || isString) {
          // remove(el) or remove(el, t1.ns) or remove(el, .ns) or remove(el, .ns1.ns2.ns3)
          if (namespaces = isString && typeSpec.replace(namespaceRegex, ''))
            namespaces = namespaces.split('.')
          rm(element, type, fn, namespaces)
        } else if (typeof typeSpec === 'function') {
          // remove(el, fn)
          rm(element, null, typeSpec)
        } else {
          // remove(el, { t1: fn1, t2, fn2 })
          for (k in typeSpec) {
            if (typeSpec.hasOwnProperty(k))
              remove(element, k, typeSpec[k])
          }
        }
        return element
      }

    , add = function (element, events, fn, delfn, $) {
        var type, types, i, args
          , originalFn = fn
          , isDel = fn && typeof fn === 'string'

        if (events && !fn && typeof events === 'object') {
          for (type in events) {
            if (events.hasOwnProperty(type))
              add.apply(this, [ element, type, events[type] ])
          }
        } else {
          args = arguments.length > 3 ? slice.call(arguments, 3) : []
          types = (isDel ? fn : events).split(' ')
          isDel && (fn = del(events, (originalFn = delfn), $)) && (args = slice.call(args, 1))
          // special case for one()
          this === ONE && (fn = once(remove, element, events, fn, originalFn))
          for (i = types.length; i--;) addListener(element, types[i], fn, originalFn, args)
        }
        return element
      }

    , one = function () {
        return add.apply(ONE, arguments)
      }

    , fireListener = W3C_MODEL ? function (isNative, type, element) {
        var evt = doc.createEvent(isNative ? 'HTMLEvents' : 'UIEvents')
        evt[isNative ? 'initEvent' : 'initUIEvent'](type, true, true, win, 1)
        element.dispatchEvent(evt)
      } : function (isNative, type, element) {
        element = targetElement(element, isNative)
        // if not-native then we're using onpropertychange so we just increment a custom property
        isNative ? element.fireEvent('on' + type, doc.createEventObject()) : element['_on' + type]++
      }

    , fire = function (element, type, args) {
        var i, j, l, names, handlers
          , types = type.split(' ')

        for (i = types.length; i--;) {
          type = types[i].replace(nameRegex, '')
          if (names = types[i].replace(namespaceRegex, ''))
            names = names.split('.')
          if (!names && !args && element[eventSupport]) {
            fireListener(nativeEvents[type], type, element)
          } else {
            // non-native event, either because of a namespace, arguments or a non DOM element
            // iterate over all listeners and manually 'fire'
            handlers = registry.get(element, type)
            args = [false].concat(args)
            for (j = 0, l = handlers.length; j < l; j++) {
              if (handlers[j].inNamespaces(names))
                handlers[j].handler.apply(element, args)
            }
          }
        }
        return element
      }

    , clone = function (element, from, type) {
        var i = 0
          , handlers = registry.get(from, type)
          , l = handlers.length

        for (;i < l; i++)
          handlers[i].original && add(element, handlers[i].type, handlers[i].original)
        return element
      }

    , bean = {
          add: add
        , one: one
        , remove: remove
        , clone: clone
        , fire: fire
        , noConflict: function () {
            context[name] = old
            return this
          }
      }

  if (win[attachEvent]) {
    // for IE, clean up on unload to avoid leaks
    var cleanup = function () {
      var i, entries = registry.entries()
      for (i in entries) {
        if (entries[i].type && entries[i].type !== 'unload')
          remove(entries[i].element, entries[i].type)
      }
      win[detachEvent]('onunload', cleanup)
      win.CollectGarbage && win.CollectGarbage()
    }
    win[attachEvent]('onunload', cleanup)
  }

  return bean
})

});

define('vendors/morpheus',["require", "exports", "module"], function(require, exports, module) {
/*!
  * Morpheus - A Brilliant Animator
  * https://github.com/ded/morpheus - (c) Dustin Diaz 2011
  * License MIT
  */
!function (context, doc, win) {

  var html = doc.documentElement,
      rgbOhex = /^rgb\(|#/,
      relVal = /^([+\-])=([\d\.]+)/,
      numUnit = /^(?:[\+\-]=)?\d+(?:\.\d+)?(%|in|cm|mm|em|ex|pt|pc|px)$/,
      // does this browser support the opacity property?
      opasity = function () {
        return typeof doc.createElement('a').style.opacity !== 'undefined';
      }(),
      // these elements do not require 'px'
      unitless = { lineHeight: 1, zoom: 1, zIndex: 1, opacity: 1 },

      // initial style is determined by the elements themselves
      getStyle = doc.defaultView && doc.defaultView.getComputedStyle ?
        function (el, property) {
          var value = null;
          var computed = doc.defaultView.getComputedStyle(el, '');
          computed && (value = computed[camelize(property)]);
          return el.style[property] || value;
        } : html.currentStyle ?

        function (el, property) {
          property = camelize(property);

          if (property == 'opacity') {
            var val = 100;
            try {
              val = el.filters['DXImageTransform.Microsoft.Alpha'].opacity;
            } catch (e1) {
              try {
                val = el.filters('alpha').opacity;
              } catch (e2) {}
            }
            return val / 100;
          }
          var value = el.currentStyle ? el.currentStyle[property] : null;
          return el.style[property] || value;
        } :

        function (el, property) {
          return el.style[camelize(property)];
        },

      rgb = function (r, g, b) {
        return '#' + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1);
      },

      // convert rgb and short hex to long hex
      toHex = function (c) {
        var m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(c);
        return (m ? rgb(m[1], m[2], m[3]) : c)
        .replace(/#(\w)(\w)(\w)$/, '#$1$1$2$2$3$3'); // short to long
      },

      // change font-size => fontSize etc.
      camelize = function (s) {
        return s.replace(/-(.)/g, function (m, m1) {
          return m1.toUpperCase();
        });
      },

      fun = function (f) {
        return typeof f == 'function';
      },

      frame = function () {
        // native animation frames
        // http://webstuff.nfshost.com/anim-timing/Overview.html
        // http://dev.chromium.org/developers/design-documents/requestanimationframe-implementation
        return win.requestAnimationFrame  ||
          win.webkitRequestAnimationFrame ||
          win.mozRequestAnimationFrame    ||
          win.oRequestAnimationFrame      ||
          win.msRequestAnimationFrame     ||
          function (callback) {
            win.setTimeout(function () {
              callback(+new Date());
            }, 10);
          };
      }();

  /**
    * Core tween method that requests each frame
    * @param duration: time in milliseconds. defaults to 1000
    * @param fn: tween frame callback function receiving 'position'
    * @param done {optional}: complete callback function
    * @param ease {optional}: easing method. defaults to easeOut
    * @param from {optional}: integer to start from
    * @param to {optional}: integer to end at
    * @returns method to stop the animation
    */
  function tween(duration, fn, done, ease, from, to) {
    ease = ease || function (t) {
      // default to a pleasant-to-the-eye easeOut (like native animations)
      return Math.sin(t * Math.PI / 2)
    };
    var time = duration || 1000,
        diff = to - from,
        start = +new Date(),
        stop = 0,
        end = 0;
    frame(run);

    function run(t) {
      var delta = t - start;
      if (delta > time || stop) {
        to = isFinite(to) ? to : 1;
        stop ? end && fn(to) : fn(to);
        done && done();
        return;
      }
      // if you don't specify a 'to' you can use tween as a generic delta tweener
      // cool, eh?
      isFinite(to) ?
        fn((diff * ease(delta / time)) + from) :
        fn(ease(delta / time));
      frame(run);
    }
    return {
      stop: function (jump) {
        stop = 1;
        end = jump; // jump to end of animation?
      }
    }
  }

  /**
    * generic bezier method for animating x|y coordinates
    * minimum of 2 points required (start and end).
    * first point start, last point end
    * additional control points are optional (but why else would you use this anyway ;)
    * @param points: array containing control points
       [[0, 0], [100, 200], [200, 100]]
    * @param pos: current be(tween) position represented as float  0 - 1
    * @return [x, y]
    */
  function bezier(points, pos) {
    var n = points.length, r = [], i, j;
    for (i = 0; i < n; ++i) {
      r[i] = [points[i][0], points[i][1]];
    }
    for (j = 1; j < n; ++j) {
      for (i = 0; i < n - j; ++i) {
        r[i][0] = (1 - pos) * r[i][0] + pos * r[parseInt(i + 1, 10)][0];
        r[i][1] = (1 - pos) * r[i][1] + pos * r[parseInt(i + 1, 10)][1];
      }
    }
    return [r[0][0], r[0][1]];
  }

  // this gets you the next hex in line according to a 'position'
  function nextColor(pos, start, finish) {
    var r = [], i, e;
    for (i = 0; i < 6; i++) {
      from = Math.min(15, parseInt(start.charAt(i),  16));
      to   = Math.min(15, parseInt(finish.charAt(i), 16));
      e = Math.floor((to - from) * pos + from);
      e = e > 15 ? 15 : e < 0 ? 0 : e;
      r[i] = e.toString(16);
    }
    return '#' + r.join('');
  }

  // this retreives the frame value within a sequence
  function getTweenVal(pos, units, begin, end, k, i, v) {
    if (typeof begin[i][k] == 'string') {
      return nextColor(pos, begin[i][k], end[i][k]);
    } else {
      // round so we don't get crazy long floats
      v = Math.round(((end[i][k] - begin[i][k]) * pos + begin[i][k]) * 1000) / 1000;
      // some css properties don't require a unit (like zIndex, lineHeight, opacity)
      !(k in unitless) && (v += units[i][k] || 'px');
      return v;
    }
  }

  // support for relative movement via '+=n' or '-=n'
  function by(val, start, m, r, i) {
    return (m = relVal.exec(val)) ?
      (i = parseFloat(m[2])) && (r = (start + i)) && m[1] == '+' ?
      r : start - i :
      parseFloat(val);
  }

  /**
    * morpheus:
    * @param element(s): HTMLElement(s)
    * @param options: mixed bag between CSS Style properties & animation options
    *  - {n} CSS properties|values
    *     - value can be strings, integers,
    *     - or callback function that receives element to be animated. method must return value to be tweened
    *     - relative animations start with += or -= followed by integer
    *  - duration: time in ms - defaults to 1000(ms)
    *  - easing: a transition method - defaults to an 'easeOut' algorithm
    *  - complete: a callback method for when all elements have finished
    *  - bezier: array of arrays containing x|y coordinates that define the bezier points. defaults to none
    *     - this may also be a function that receives element to be animated. it must return a value
    */
  function morpheus(elements, options) {
    var els = elements ? (els = isFinite(elements.length) ? elements : [elements]) : [], i,
        complete = options.complete,
        duration = options.duration,
        ease = options.easing,
        points = options.bezier,
        begin = [],
        end = [],
        units = [],
        bez = [],
        originalLeft,
        originalTop;

    delete options.complete;
    delete options.duration;
    delete options.easing;
    delete options.bezier;

    if (points) {
      // remember the original values for top|left
      originalLeft = options.left;
      originalTop = options.top;
      delete options.right;
      delete options.bottom;
      delete options.left;
      delete options.top;
    }

    for (i = els.length; i--;) {

      // record beginning and end states to calculate positions
      begin[i] = {};
      end[i] = {};
      units[i] = {};

      // are we 'moving'?
      if (points) {

        var left = getStyle(els[i], 'left'),
            top = getStyle(els[i], 'top'),
            xy = [by(fun(originalLeft) ? originalLeft(els[i]) : originalLeft || 0, parseFloat(left)),
                  by(fun(originalTop) ? originalTop(els[i]) : originalTop || 0, parseFloat(top))];

        bez[i] = fun(points) ? points(els[i], xy) : points;
        bez[i].push(xy);
        bez[i].unshift([
          parseInt(left, 10),
          parseInt(top, 10)
        ]);
      }

      for (var k in options) {
        var v = getStyle(els[i], k), unit,
            tmp = fun(options[k]) ? options[k](els[i]) : options[k]
        if (typeof tmp == 'string' &&
            rgbOhex.test(tmp) &&
            !rgbOhex.test(v)) {
          delete options[k]; // remove key :(
          continue; // cannot animate colors like 'orange' or 'transparent'
                    // only #xxx, #xxxxxx, rgb(n,n,n)
        }

        begin[i][k] = typeof tmp == 'string' && rgbOhex.test(tmp) ?
          toHex(v).slice(1) :
          parseFloat(v);
        end[i][k] = typeof tmp == 'string' && tmp.charAt(0) == '#' ?
          toHex(tmp).slice(1) :
          by(tmp, parseFloat(v));
        // record original unit
        typeof tmp == 'string' && (unit = tmp.match(numUnit)) && (units[i][k] = unit[1]);
      }
    }
    // ONE TWEEN TO RULE THEM ALL
    return tween(duration, function (pos, v, xy) {
      // normally not a fan of optimizing for() loops, but we want something
      // fast for animating
      for (i = els.length; i--;) {
        if (points) {
          xy = bezier(bez[i], pos);
          els[i].style.left = xy[0] + 'px';
          els[i].style.top = xy[1] + 'px';
        }
        for (var k in options) {
          v = getTweenVal(pos, units, begin, end, k, i);
          k == 'opacity' && !opasity ?
            (els[i].style.filter = 'alpha(opacity=' + (v * 100) + ')') :
            (els[i].style[camelize(k)] = v);
        }
      }
    }, complete, ease);
  }

  // expose useful methods
  morpheus.tween = tween;
  morpheus.getStyle = getStyle;
  morpheus.bezier = bezier;

  typeof module !== 'undefined' && module.exports &&
    (module.exports = morpheus);
  context['morpheus'] = morpheus;

}(this, document, window);
});

/**
 * Sushi $
 *
 * @module Sushi
 */
/*global Sushi:true, define:true*/
define('sushi.$',
    [
    	'sushi.core',
    	'vendors/qwery',
    	'vendors/bonzo',
    	'vendors/bean',
    	'vendors/morpheus'
    ],
    
	/**
	 * Sushi $
	 *
	 * @namespace Sushi
	 * @class $
	 */
    function(Sushi, qwery, bonzo, bean, morpheus) {    	
    	var $;
    	
    	bonzo.setQueryEngine(qwery);
    	
    	function _parseAnimationDuration(d) {
    		if (typeof d === 'string') {
				switch (d) {
					case 'fast':
						d = 500;
						break;
					
					case 'normal':
						d = 1000;
						break;
					
					case 'slow':
						d = 2000;
						break;
					
					default:
						d = 1000;
						break;
				}
			}
			
			return d;
    	}
    	
    	$ = function(selector, context) {
    		var q,
    		element;
    		
    		// If the selector is a tag-like string, create it instead of qwerying it.
    		if (/^<(\w+)\s*\/?>(?:<\/\1>)?$/.test(selector)) {
    			element = bonzo.create(selector);
    		} else {
    			element = bonzo(qwery(selector, context))
    		}
    		
    		var _slice = Array.prototype.slice,
    		_bind = function(fn, context) {
    			return function() {
    				var theArgs = arguments;
    				
    				bonzo(context).each(function() {
						args = _slice.call(theArgs, 0);
						args.unshift(bonzo(this).get(0));
						fn.apply(context, args);
					});
					
					return bonzo(context);
				}
    		},
    		methods = {
				on: bean.add,
				addListener: bean.add,
				bind: bean.add,
				listen: bean.add,
				delegate: bean.add,
			
				unbind: bean.remove,
				unlisten: bean.remove,
				removeListener: bean.remove,
				undelegate: bean.remove,
			
				emit: bean.fire,
				trigger: bean.fire
			};
			
			for (var method in methods) {
				methods[method] = _bind(methods[method], element);
			}
    		
    		var bonzoed = Sushi.extend(bonzo(element), methods);
    		
    		return Sushi.extend(bonzoed, {
    			
    			parents: function (selector, closest) {
					var collection = $(selector), j, k, p, r = []
					for (j = 0, k = this.length; j < k; j++) {
						p = this[j]
						while (p = p.parentNode) {
						  if (~indexOf(collection, p)) {
							r.push(p)
							if (closest) break;
						  }
						}
					}
					return $(uniq(r))
				},
			
			  	parent: function() {
					return $(uniq(bonzo(this).parent()))
				},
			
			  	closest: function (selector) {
					return this.parents(selector, true)
				},
			
			  	first: function () {
					return $(this.length ? this[0] : this)
				},
			
			  	last: function () {
					return $(this.length ? this[this.length - 1] : [])
				},
			
			  	next: function () {
					return $(bonzo(this).next())
				},
			
			  	previous: function () {
					return $(bonzo(this).previous())
				},
			
			  	appendTo: function (t) {
					return bonzo(this.selector).appendTo(t, this)
				},
			
			  	prependTo: function (t) {
					return bonzo(this.selector).prependTo(t, this)
				},
			
			  	insertAfter: function (t) {
					return bonzo(this.selector).insertAfter(t, this)
				},
			
			  	insertBefore: function (t) {
				  	return bonzo(this.selector).insertBefore(t, this)
				},
			
				siblings: function () {
				  	var i, l, p, r = []
				  	for (i = 0, l = this.length; i < l; i++) {
						p = this[i]
						while (p = p.previousSibling) p.nodeType == 1 && r.push(p)
						p = this[i]
						while (p = p.nextSibling) p.nodeType == 1 && r.push(p)
					}
				  	return $(r)
				},
			
			  	children: function () {
				  	var i, el, r = []
				  	for (i = 0, l = this.length; i < l; i++) {
						if (!(el = bonzo.firstChild(this[i]))) continue;
						r.push(el)
						while (el = el.nextSibling) el.nodeType == 1 && r.push(el)
				  	}
				  	return $(uniq(r))
				},
			
			  	height: function (v) {
				  	return dimension(v, this, 'height')
				},
			
			  	width: function (v) {
				  	return dimension(v, this, 'width')
				},
    			
    			find: function (s) {
					var r = [], i, l, j, k, els;
					for (i = 0, l = this.length; i < l; i++) {
				 	 	els = qwery(s, this[i]);
						for (j = 0, k = els.length; j < k; j++) {
							r.push(els[j]);
						}
					}
					return $(qwery.uniq(r));
			  	},
			  	
    			animate: function (options) {
    				if (options && options.duration) {
    					options.duration = _parseAnimationDuration(options.duration);
    				}
    				
				  	return morpheus(this, options)
				},
			  	
			  	fadeIn: function (d, fn) {
			  		$(this).show().css({opacity: 0})
				  	return morpheus(this, {
					  	duration: _parseAnimationDuration(d),
						opacity: 1,
						complete: fn
				  	})
				},
				
				fadeOut: function (d, fn) {
					var $self = $(this);
				  	return morpheus(this, {
					  	duration: _parseAnimationDuration(d),
						opacity: 0,
						complete: function() {
							$self.hide()
						}
				  	})
				}
    		});
    	};
    	
    	// Helpers
    	function dimension(v, self, which) {
			return v ?
			self.css(which, v) :
			function (r) {
				if (!self[0]) return 0
				r = parseInt(self.css(which), 10);
				return isNaN(r) ? self[0]['offset' + which.replace(/^\w/, function (m) {return m.toUpperCase()})] : r
			}()
		}
		
		function indexOf(ar, val) {
			for (var i = 0; i < ar.length; i++) if (ar[i] === val) return i
			return -1
	  	}
	
		function uniq(ar) {
			var r = [], i = 0, j = 0, k, item, inIt
			for (; item = ar[i]; ++i) {
			  	inIt = false
			  	for (k = 0; k < r.length; ++k) {
					if (r[k] === item) {
				  		inIt = true; break
					}
			  	}
			  	if (!inIt) r[j++] = item
			}
			return r
		}
    	
    	//Sugars
    	Sushi.fn = $;
    	
    	// Make raw objects available
    	Sushi.morpheus = morpheus;
    	Sushi.bonzo = bonzo;
    	Sushi.qwery = qwery;
    	Sushi.bean = bean;
    	
    	return $;
    } 
);

/*
 * Sushi.event - Event management functions
 *
 */
 define('sushi.event',
 	// Module dependencies
 	['sushi.core'],

 	/**
 	 * Sushi event
 	 *
 	 * @namespace Sushi
 	 * @class event
 	 */
 	function(Sushi) {
        Sushi.namespace('event');
        
        Sushi.event = {
        	bind : function(ev, callback, context) {
			  	var calls = this._callbacks || (this._callbacks = {}),
			  	list  = calls[ev] || (calls[ev] = []);
			  	list.push([callback, context]);
			  	return this;
			},
			
			unbind : function(ev, callback) {
			  	var calls;
			  	if (!ev) {
					this._callbacks = {};
			  	} else if (calls = this._callbacks) {
					if (!callback) {
				 		calls[ev] = [];
					} else {
				  		var list = calls[ev];
				  		if (!list) return this;
				  		
				  		for (var i = 0, l = list.length; i < l; i++) {
							if (list[i] && callback === list[i][0]) {
					  			list[i] = null;
					  			break;
							}
				  		}
					}
			  	}
			  	return this;
			},
			
			trigger : function(eventName) {
			  	var list, calls, ev, callback, args,
			  	both = 2;
			  	
			  	if (!(calls = this._callbacks)) return this;
			  		
			  		while (both--) {
						ev = both ? eventName : 'all';
						if (list = calls[ev]) {
				  			for (var i = 0, l = list.length; i < l; i++) {
								if (!(callback = list[i])) {
					  				list.splice(i, 1); i--; l--;
								} else {
					  				args = both ? Array.prototype.slice.call(arguments, 1) : arguments;
					  				callback[0].apply(callback[1] || this, args);
								}
				  			}
						}
			  		}
			  	return this;
			}
        }
        
        // Aliases for backwards compatibility
        Sushi.extend(Sushi.event, {
        	subscribe: Sushi.event.bind,
        	unsubscribe: Sushi.event.unbind,
        	publish: Sushi.event.trigger
        });
        
        return Sushi.event;
 	}
 );
/**
 * Sushi MVC - View
 *
 * @module Sushi.mvc
 */
define('sushi.mvc.view',
	[
		'sushi.core', 
		'sushi.event', 
		'sushi.utils', 
		'sushi.$'
	],

	function(Sushi, event, utils, $) {
		/**
		 * Sushi MVC - View
		 * Heavily based on Backbone.View
		 *
		 * @namespace Sushi
		 * @class View
		 */
		Sushi.namespace('View');
		
		var	eventSplitter = /^(\S+)\s*(.*)$/,
  			viewOptions = ['model', 'collection', 'el', 'id', 'attributes', 'className', 'tagName'],
  			getValue = function(object, prop) {	
				if (!(object && object[prop])) return null;	
				return utils.isFunction(object[prop]) ? object[prop]() : object[prop];
			};
		
		Sushi.View = Sushi.Class({
			constructor: function(options) {				
				this.cid = utils.uniqueId('view');
				this._configure(options || {});
				this._ensureElement();
				this.initialize.apply(this, arguments);
				this.delegateEvents();
			},
			
			$: function(selector) {
			  	return this.$el.find(selector);
			},
			
			tagName: 'div',
			
			initialize: function() {},
			
			render: function() {
				return this;
			},
			
			remove: function() {
				this.$el.remove();
				return this;
			},
			
			setElement: function(element, delegate) {
				this.$el = $(element);
			  	this.el = this.$el[0];
			  	if (delegate !== false) this.delegateEvents();
			  	return this;
			},
			
			delegateEvents: function(events) {
			  	if (!(events || (events = getValue(this, 'events')))) return;
			  	
			  	this.undelegateEvents();
			  	
			  	for (var key in events) {
					var method = this[events[key]];
					if (!utils.isFunction(method)) method = this[events[key]];
					if (!method) throw new Error('Event "' + events[key] + '" does not exist');
					
					var match = key.match(eventSplitter);
					var eventName = match[1], selector = match[2];
					
					method = utils.bind(method, this);
					eventName += '.delegateEvents' + this.cid;
					
					if (selector === '') {
				  		this.$el.delegate(eventName, method);
					} else {
						this.$el.delegate(selector, eventName, method, $);
					}
			  	}
			},
			
			undelegateEvents: function() {
			  	this.$el.unbind('.delegateEvents' + this.cid);
			},
			
			dealloc: function() {
				if (!this.el) return false;
				this.$el.unbind('.delegateEvents' + this.cid);
				this.$el.remove();
			},
			
			make : function(tagName, attributes, content) {
			  	var el = document.createElement(tagName);
			  	if (attributes) $(el).attr(attributes);
			  	if (content) $(el).html(content);
			  	return el;
			},
			
			_configure: function(options) {
			  	if (this.options) options = Sushi.extend({}, this.options, options);
			  	
			  	for (var i = 0, l = viewOptions.length; i < l; i++) {
					var attr = viewOptions[i];
					if (options[attr]) this[attr] = options[attr];
			  	}
			  	
			  	this.options = options;
			},
			
			_ensureElement: function() {
			  	if (!this.el) {
					var attrs = this.attributes || {};
					if (this.id) attrs.id = this.id;
					if (this.className) attrs['class'] = this.className;
					this.setElement(this.make(this.tagName, attrs));
			  	} else if (utils.isString(this.el)) {
					this.setElement(this.el, false);
			  	}
			}
		});
		
		Sushi.extendClass(Sushi.View, event);
		
		return Sushi.View;
	}
);
/**
 * Sushi Error
 *
 * @module Sushi
 */
/*global Sushi:true, define:true*/
define('sushi.error',
    [
    	'sushi.core'
    ],
    
    function(Sushi) {    	
    	function SushiError (msg) {
    		Error.call(this);
    		Error.captureStackTrace(this, arguments.callee);
    		this.message = msg;
    		this.name = 'SushiError';
    	}
    	
    	SushiError.prototype.__proto__ = Error.prototype;
    	
    	Sushi.namespace('Error');
    	Sushi.Error = SushiError;
    	
    	return SushiError;
    }
);

define('sushi.utils.collection',
	['sushi.core', 'sushi.utils', 'sushi.error'],
	
	/**
     * Sushi Collection
     */
     
	function(Sushi, utils, SushiError) {
	    var _collection = this,
	    _ArrayProto = Array.prototype,
		_nativeKeys = Object.keys,
	    _nativeForEach = _ArrayProto.forEach,
		_nativeFilter = _ArrayProto.filter,
		_nativeReduce = _ArrayProto.reduce,
		_nativeReduceRight = _ArrayProto.reduceRight,
		_nativeMap = _ArrayProto.map,
		_nativeIndexOf = _ArrayProto.indexOf,
		_nativeLastIndexOf = _ArrayProto.lastIndexOf,
		_nativeSome = _ArrayProto.some,
		_nativeEvery = _ArrayProto.every,
		_slice = _ArrayProto.slice,
	    _breaker = {},
	    
	    /*
	     * Retrieve the values of an object's properties.
	     *
	     * @method values
	     * @param obj Object to retrieve properties from
	     *
	     * @return {Array} Object properties in array format
	     */
	    values = function(obj) {
            return map(obj, utils.identity);
        },

		/**
	     * Retrieve the names of an object's properties.
	     * Defaults to ECMAScript 5's native Object.keys. Lifted from Underscore JS.
	     *
	     * @method keys
	     * @param obj Object to retrieve keys from
	     *
	     * @return Array containing the object's key names.
	     */
		keys = function(obj) {
		    if (_nativeKeys) {
		        return _nativeKeys(obj);
		    }
		    
            if (this.isArray(obj)) {
                return utils.range(0, obj.length);
            }
            
            var keys = [];                
            for (var key in obj) {
                if (utils.utils.hasOwnProperty.call(obj, key)) {
                    keys[keys.length] = key;
                }
            }                
            return keys;
        },
        
        /**
		 * Bind all of an object's methods to that object. Useful for ensuring that all callbacks defined on an object belong to it.
		 *
		 * @method bindAll
		 * @param {Object} obj
		 *
		 * @return {Object}
		 */
		bindAll = function(obj) {
			var funcs = _slice.call(arguments, 1);
			if (funcs.length == 0) funcs = utils.functions(obj);
			utils.each(funcs, function(f) { obj[f] = utils.bind(obj[f], obj); });
			return obj;
		},
		   
		/**
		 * Safely convert anything iterable into a real, live array.
		 *
		 * @method toArray
		 * @param iterable Variable to convert to an array
		 *
		 * @return {Array} Old variable in array format
		 */
		toArray = function(iterable) {
            if (!iterable) {                         return []; }
            if (iterable.toArray) {                  return iterable.toArray(); }
            if (utils.isArray(iterable)) {     return iterable; }
            if (utils.isArguments(iterable)) { return _slice.call(iterable); }
            
            return values(iterable);
        },
	    
	    /**
    	 * Cornerstone each (forEach) implementation.
    	 * Handles objects implementing forEach, arrays, and raw objects. 
    	 * Delegates to ECMAScript 5's native forEach if available.
    	 * Based on the Underscore JS implementation.
    	 *
    	 * @method each
    	 *
    	 * @param obj Object to loop through
    	 * @param {Function} iterator Function to callback for each element
    	 * @param {Object} context Object to use as "this" when executing iterator
    	 */
	    each = function(obj, iterator, context) {
            var value;
            if (obj === null) { return; }
            
            if (_nativeForEach && obj.forEach === _nativeForEach) {
                obj.forEach(iterator, context);
            } else if (utils.isNumber(obj.length)) {
                for (var i = 0, l = obj.length; i < l; i++) {
                    if (iterator.call(context, obj[i], i, obj) === _breaker) { return; }
                }
            } else {
                for (var key in obj) {
                    if (utils.hasOwnProperty.call(obj, key)) {
                        if (iterator.call(context, obj[key], key, obj) === _breaker) { return; }
                    }
                }
            }
        },
        
        /**
		 * Return a sorted list of the function names available on the object. 
		 *
		 * @method functions
		 * @param {Object} obj
		 *
		 * @return {Array} Sorted function name list
		 */
		functions = function(obj) {
			var names = [];
			for (var key in obj) {
				if (utils.isFunction(obj[key])) names.push(key);
			}
			return names.sort();
		}, 
        
        /**
		 * Determine if a given value is included in the array or object using ===.
		 *
		 * @method contains
		 *
		 * @param {Object} heystack Object or Array to search in.
		 * @param {String} needle 	Value to search heystack for
		 *
		 * @return {Boolean} True if needle is present.
		 */        
        contains = function(heystack, needle) {
            var found = false;
            if (heystack === null) { return found; }
            
            if (_nativeIndexOf && heystack.indexOf === _nativeIndexOf) {
                return heystack.indexOf(needle) != -1; 
            }
            some(heystack, function(value) {
                if (value === needle) { found = true; return true; }
            });
            
            return found;
        },
        
        /**
		 * Return all the elements that pass a truth test.
		 * Delegates to ECMAScript 5's native filter if available. 
		 *
		 * @method filter
		 *
		 * @param {Array} obj Array to filter.
		 * @param {Function} iterator Function to execute on each value in the array.
		 * @param context Object to use as the first argument to the first call of the callback.
		 *
		 * @return {Array} Filtered Array
		 */
		filter = function(obj, iterator, context) {
			var results = [];
			
            if (obj === null) { return results; }
            
            if (_nativeFilter && obj.filter === _nativeFilter) { return obj.filter(iterator, context); }
            
            each(obj, function(value, index, list) {
                if (iterator.call(context, value, index, list)) { 
                    results[results.length] = value; 
                }
            });
            
            return results;
		},
		
		/**
		 * Return all the elements that fail a truth test.
		 *
		 * @method reject
		 *
		 * @param {Array} obj Array to filter.
		 * @param {Function} iterator Function to execute on each value in the array.
		 * @param context Object to use as the first argument to the first call of the callback.
		 *
		 * @return {Array} Results Array
		 */
		reject = function(obj, iterator, context) {
			var results = [];
			if (obj == null) return results;
			each(obj, function(value, index, list) {
			  if (!iterator.call(context, value, index, list)) results[results.length] = value;
			});
			return results;
		},
		
		/**
		 * Reduce builds up a single result from a list of values 
		 * from left-to-right.
		 * Delegates to ECMAScript 5's native reduce if available. 
		 *
		 * @method reduce
		 *
		 * @param {Array} obj Array to reduce.
		 * @param {Function} iterator Function to execute on each value in the array.
		 * @param memo Object to use as the first argument to the first call of the callback.
		 *
		 * @return {Array} Reduced Array
		 */		
		reduce = function(obj, iterator, memo) {
			var initial = memo !== undefined;
			obj = (obj === null) ? [] : obj;
			
		    if (_nativeReduce && obj.reduce === _nativeReduce) {
		    	//if (context) { iterator = _.bind(iterator, context); }		
		    	return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
		    }
		
		    each(obj, function(value, index, list) {
		    	if (!initial && index === 0) {
		        	memo = value;
		        	initial = true;
		      	} else {
		        	memo = iterator.call(context, memo, value, index, list);
		      	}
		    });
		
		    if (!initial) {
		        throw new SushiError("Reduce of empty array with no initial value");
		    }
		
		    return memo;
		},
		
		/**
		 * Reduce builds up a single result from a list of values (from right-to-left). 
		 * Delegates to ECMAScript 5's native reduceRight if available. 
		 *
		 * @method reduceRight
		 *
		 * @param {Array} Array to reduce.
		 * @param {Function} Function to execute on each value in the array.
		 * @param memo Object to use as the first argument to the first call of the callback.
		 *
		 * @return {Array} Reduced Array
		 *
		 */
		reduceRight = function(obj, iterator, memo) {
		    if (obj === null) { obj = []; }
		    
            if (_nativeReduceRight && obj.reduceRight === _nativeReduceRight) {
                //if (context) iterator = _.bind(iterator, context);
                return memo !== undefined ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
            }
            
            var reversed = (utils.isArray(obj) ? obj.slice() : _collection.toArray(obj)).reverse();
           
            return _collection.reduce(reversed, iterator, memo);
		},
		
		/**
		 * Creates a new array with the results of calling a provided function 
		 * on every element in this array.
		 * Delegates to ECMAScript 5's native map if available. 
		 *
		 * @method map
		 *
		 * @param {Array} obj Original array.
		 * @param {Function} iterator Function that produces an element of the new Array from an element of the current one.
		 * @param {Object} context Object to use as "this" when executing iterator
		 *
		 * @return {Array} Reduced Array
		 *
		 */
		map = function(obj, iterator, context) {
			var results = [];
			
			if (obj === null) { return results; }
			
			// Delegate to ECMAScript 5 native map()
		    if (_nativeMap && obj.map === _nativeMap) { return obj.map(iterator, context); }
			
		    each(obj, function(value, index, list) {
		        results[results.length] = iterator.call(context, value, index, list);
		    });
		
		    return results;
		},
		
		/**
		 * Convenience method for utils.map to get a property from an object.
		 *
		 * @method pluck
		 *
		 * @param {Object} obj Object to search through
		 * @param key Property key to look for
		 *
		 * @return {Object} Property in object
		 *
		 */
		pluck = function(obj, key) {
		    return map(obj, function(value) { return value[key]; });
		},

		/**
		 * Determine if at least one element in the object matches a truth test.
		 * Delegates to ECMAScript 5's native some if available. 
		 *
		 * @method some
		 *
		 * @param {Object} obj Object to search through
		 * @param {Function} iterator Function that produces an element of the new Array from an element of the current one.
		 * @param {Object} context Object to use as "this" when executing iterator
		 *
		 * @return {Booelan} True if an object matches the truth test.
		 *
		 */
		some = function(obj, iterator, context) {
		    iterator = iterator || utils.identity;
            var result = false;
            
            if (obj === null) { return result; }
            
            if (_nativeSome && obj.some === _nativeSome) {
                return obj.some(iterator, context);
            }
            
            each(obj, function(value, index, list) {
                result = iterator.call(context, value, index, list);
                if (result) {
                    return _breaker;
                }
            });
            
            return result;
		},
		
		/**
		 * Determine whether all elements in the object match a truth test.
		 * Delegates to ECMAScript 5's native every if available. 
		 *
		 * @method every
		 *
		 * @param {Object} obj Object to search through
		 * @param {Function} iterator Function that produces an element of the new Array from an element of the current one.
		 * @param {Object} context Object to use as "this" when executing iterator
		 *
		 * @return {Booelan} True if an object matches the truth test.
		 *
		 */
		every = function(obj, iterator, context) {
			var result = true;
			if (obj == null) return result;
			if (_nativeEvery && obj.every === _nativeEvery) return obj.every(iterator, context);
			each(obj, function(value, index, list) {
				if (!(result = result && iterator.call(context, value, index, list))) return breaker;
			});
			return result;
		},
		
		/**
		 * Remove a value from an array
		 *
		 * @method remove
		 *
		 * @param {Array} array
		 * @param {mixed} value
		 *
		 * @return {Array} Array without the removed value
		 *
		 */
		remove = function(array, value) {
			if (!utils.isArray(array)) {
				throw new SushiError('Value must be an Array')
				return false;
			}
			
			var from = array.indexOf(value),
				to = from;
			
			var rest = array.slice((to || from) + 1 || array.length);
			array.length = from < 0 ? array.length + from : from;
			return array.push.apply(array, rest);
		},
		
		/**
		 * Shuffle an array.
		 *
		 * @method shuffle
		 *
		 * @param {Array} array Array to shuffle
		 *
		 * @return {Array} Shuffled array
		 *
		 */
		shuffle = function(array) {
		    var m = array.length, t, i;
			// While there remain elements to shuffle…
			while (m) {
				// Pick a remaining element…
				i = Math.floor(Math.random() * m);
			
				// And swap it with the current element.
				t = array[--m];
				array[m] = array[i];
				array[i] = t;
			}
			return array;
		},
		
		/**
		 * Create a (shallow-cloned) duplicate of an object.
		 *
		 * @method clone
		 *
		 * @param {Object} obj Object to duplicate
		 *
		 * @return {Object} Duplicate of obj
		 *
		 */
		clone = function(obj) {
    		if (!utils.isObject(obj)) return obj;
    		return utils.isArray(obj) ? obj.slice() : Sushi.extend({}, obj);
  		},
  		
  		/**
		 * Return the first value which passes a truth test.
		 *
		 * @method find
		 *
		 * @param {Object} obj Object to search through
		 * @param {Function} iterator Function that produces an element of the new Array from an element of the current one.
		 * @param {Object} context Object to use as "this" when executing iterator
		 *
		 * @return {mixed} Value which passes the test first.
		 */
  		find = function(obj, iterator, context) {
			var result;
			some(obj, function(value, index, list) {
			  if (iterator.call(context, value, index, list)) {
				result = value;
				return true;
			  }
			});
			return result;
		},
		
		/**
		 * Invoke a method (with arguments) on every item in a collection.
		 *
		 * @method invoke
		 *
		 * @param {Object} obj Object to search through
		 * @param {Function} method Function to apply
		 *
		 *
		 */
		invoke = function(obj, method) {
			var args = _slice.call(arguments, 2);
			return map(obj, function(value) {
			  	return (utils.isFunction(method) ? method || value : value[method]).apply(value, args);
			});
		},
		
		/**
		 * Return the maximum element or (element-based computation).
		 *
		 * @method max
		 *
		 * @param {Object} obj Object to search through
		 * @param {Function} iterator Function that produces an element of the new Array from an element of the current one.
		 * @param {Object} context Object to use as "this" when executing iterator
		 *
		 * @return Maximum element
		 *
		 */
		max = function(obj, iterator, context) {
			if (!iterator && utils.isArray(obj)) return Math.max.apply(Math, obj);
			if (!iterator && utils.isEmpty(obj)) return -Infinity;
			var result = {computed : -Infinity};
			each(obj, function(value, index, list) {
			  	var computed = iterator ? iterator.call(context, value, index, list) : value;
			  	computed >= result.computed && (result = {value : value, computed : computed});
			});
			return result.value;
		},
		
		/**
		 * Return the minimum element or (element-based computation).
		 *
		 * @method min
		 *
		 * @param {Object} obj Object to search through
		 * @param {Function} iterator Function that produces an element of the new Array from an element of the current one.
		 * @param {Object} context Object to use as "this" when executing iterator
		 *
		 * @return Minimum element
		 *
		 */
		min = function(obj, iterator, context) {
			if (!iterator && _.isArray(obj)) return Math.min.apply(Math, obj);
			if (!iterator && _.isEmpty(obj)) return Infinity;
			var result = {computed : Infinity};
			each(obj, function(value, index, list) {
			  var computed = iterator ? iterator.call(context, value, index, list) : value;
			  computed < result.computed && (result = {value : value, computed : computed});
			});
			return result.value;
		},
		
		/**
		 * Sort the object's values by a criterion produced by an iterator.
		 *
		 * @method sort
		 *
		 * @param {Object} obj Object to sort
		 * @param {Function} iterator Function that produces an element of the new Array from an element of the current one.
		 * @param {Object} context Object to use as "this" when executing iterator
		 *
		 * @return Sorted object
		 *
		 */
		sortBy = function(obj, iterator, context) {
			return pluck(map(obj, function(value, index, list) {
				return {
					value : value,
					criteria : iterator.call(context, value, index, list)
				};
			}).sort(function(left, right) {
			  	var a = left.criteria, b = right.criteria;
			  	return a < b ? -1 : a > b ? 1 : 0;
			}), 'value');
		},
		
		/**
		 * Use a comparator function to figure out at what index an object should be inserted so as to maintain order. Uses binary search.
		 *
		 * @method sortedIndex
		 *
		 * @param {Array} array Array to insert object into
 		 * @param {Object} obj Object to insert in array.
		 * @param {Function} iterator Function that produces an element of the new Array from an element of the current one.
		 *
		 * @return {Number} Index object should be inserted in
		 *
		 */
		sortedIndex = function(array, obj, iterator) {
			iterator || (iterator = _.identity);
			var low = 0, high = array.length;
			while (low < high) {
			  var mid = (low + high) >> 1;
			  iterator(array[mid]) < iterator(obj) ? low = mid + 1 : high = mid;
			}
			return low;
		},
		
		/**
		 * Groups the object's values by a criterion. Pass either a string attribute to group by, or a function that returns the criterion.
		 *
		 * @method groupBy
		 *
		 * @param {Object} obj Object to be grouped
 		 * @param {String|Function} val Criterion by which to group the object.
		 *
		 * @return {Object} Grouped object
		 *
		 */
		groupBy = function(obj, val) {
			var result = {};
			var iterator = utils.isFunction(val) ? val : function(obj) { return obj[val]; };
			each(obj, function(value, index) {
			  var key = iterator(value, index);
			  (result[key] || (result[key] = [])).push(value);
			});
			return result;
		},
		
		/**
		 * Return the number of elements in an object.
		 *
		 * @method size
		 *
		 * @param {Object} obj
		 *
		 * @return {Number} Length of obj
		 *
		 */
		size = function(obj) {
			return toArray(obj).length;
	  	},
	  	
	  	/**
		 * Get the first element of an array. Passing n will return the first N values in the array. The guard check allows it to work with map.
		 *
		 * @method first
		 *
		 * @param {Array} array
 		 * @param {Number} n
 		 * @param {Boolean} guard
		 *
		 * @return {mixed}
		 *
		 */
	  	first = function(array, n, guard) {
			return (n != null) && !guard ? _slice.call(array, 0, n) : array[0];
	  	},
	  	
	  	/**
		 * Returns everything but the last entry of the array. Especcialy useful on the arguments object. 
		 * Passing n will return all the values in the array, excluding the last N. The guard check allows it to work with map.
		 *
		 * @method initial
		 *
		 * @param {Array} array
 		 * @param {Number} n
 		 * @param {Boolean} guard
		 *
		 * @return {mixed}
		 *
		 */
	  	initial = function(array, n, guard) {
			return _slice.call(array, 0, array.length - ((n == null) || guard ? 1 : n));
	  	},
	  	
	  	/**
		 * Get the last element of an array. Passing n will return the last N values in the array. The guard check allows it to work with map.
		 *
		 * @method last
		 *
		 * @param {Array} array
 		 * @param {Number} n
 		 * @param {Boolean} guard
		 *
		 * @return {mixed}
		 *
		 */
	  	last = function(array, n, guard) {
			if ((n != null) && !guard) {
			  return _slice.call(array, Math.max(array.length - n, 0));
			} else {
			  return array[array.length - 1];
			}
		},
		
		/**
		 * Returns everything but the first entry of the array. Aliased as tail. Especially useful on the arguments object. 
		 * Passing an index will return the rest of the values in the array from that index onward. The guard check allows it to work with map.
		 *
		 * @method rest
		 *
		 * @param {Array} array
 		 * @param {Number} n
 		 * @param {Boolean} guard
		 *
		 * @return {mixed}
		 *
		 */
		rest = function(array, index, guard) {
			return _slice.call(array, (index == null) || guard ? 1 : index);
		},
		
		/**
		 * Trim out all falsy values from an array.
		 *
		 * @method compact
		 *
		 * @param {Array} array
		 *
		 * @return {Array} Trimmed array
		 *
		 */
		compact = function(array) {
			return filter(array, function(value){ return !!value; });
		},
		
		/**
		 * Return a completely flattened version of an array.
		 *
		 * @method flatten
		 *
		 * @param {Array} array
		 * @param {Boolean} shallow Pass true to only flatten 1 level deep
		 *
		 * @return {Array} Flattened array
		 *
		 */
		flatten = function(array, shallow) {
			return reduce(array, function(memo, value) {
				if (utils.isArray(value)) return memo.concat(shallow ? value : flatten(value));
			  	memo[memo.length] = value;
			  	return memo;
			}, []);
		},
		
		/**
		 * Return a version of the array that does not contain the specified value(s).
		 *
		 * @method without
		 *
		 * @param {Array} array
		 *
		 * @return {Array} Filtered array
		 *
		 */
		without = function(array) {
			return difference(array, _slice.call(arguments, 1));
		},
		
		/**
		 * Produce a duplicate-free version of the array. If the array has already been sorted, you have the option of using a faster algorithm.
		 *
		 * @method unique
		 *
		 * @param {Array} array
		 * @param {Boolean} isSorted
		 * @param {Function} iterator Function that produces an element of the new Array from an element of the current one.
		 *
		 * @return {Array} Filtered array
		 *
		 */
		unique = function(array, isSorted, iterator) {
			var initial = iterator ? map(array, iterator) : array;
			var result = [];
			reduce(initial, function(memo, el, i) {
			 	if (0 == i || (isSorted === true ? last(memo) != el : !contains(memo, el))) {
					memo[memo.length] = el;
					result[result.length] = array[i];
			  	}
			  	return memo;
			}, []);
			return result;
		},
		
		/**
		 * Produce an array that contains the union: each distinct element from all of the passed-in arrays.
		 *
		 * @method union
		 *
		 * @return {Array}
		 *
		 */
		union = function() {
			return unique(flatten(arguments, true));
		},
		
		/**
		 * Produce an array that contains every item shared between all the passed-in arrays.
		 *
		 * @method intersection
		 *
		 * @return {Array}
		 *
		 */
		intersection = function(array) {
			var rest = _slice.call(arguments, 1);
			return filter(uniq(array), function(item) {
			  	return every(rest, function(other) {
					return indexOf(other, item) >= 0;
			  	});
			});
		},
		
		/**
		 * Take the difference between one array and a number of other arrays. Only the elements present in just the first array will remain.
		 *
		 * @method difference
		 *
		 * @param {Array} array
		 *
		 * @return {Array}
		 *
		 */
		difference = function(array) {
			var rest = flatten(_slice.call(arguments, 1));
			return filter(array, function(value){ return !contains(rest, value); });
		},
		
		/**
		 * Zip together multiple lists into a single array -- elements that share an index go together.
		 *
		 * @method zip
		 *
		 * @return {Array}
		 *
		 */
		zip = function() {
			var args = _slice.call(arguments);
			var length = max(pluck(args, 'length'));
			var results = new Array(length);
			for (var i = 0; i < length; i++) results[i] = pluck(args, "" + i);
			return results;
		},
		
		/**
		 * If the browser doesn't supply us with indexOf (I'm looking at you, MSIE), we need this function. 
		 * Return the position of the first occurrence of an item in an array, or -1 if the item is not included in the array.
		 * Delegates to ECMAScript 5's native indexOf if available. 
		 * If the array is large and already in sort order, pass true for isSorted to use binary search.
		 *
		 * @method indexOf
		 *
		 * @param {Array} array Array to search in
		 * @param {mixed} item Item to search for
		 * @param {Boolean} isSorted
		 *
		 * @return {Number}
		 *
		 */
		indexOf = function(array, item, isSorted) {
			if (array == null) return -1;
			var i, l;
			if (isSorted) {
			  i = sortedIndex(array, item);
			  return array[i] === item ? i : -1;
			}
			if (_nativeIndexOf && array.indexOf === _nativeIndexOf) return array.indexOf(item);
			for (i = 0, l = array.length; i < l; i++) if (i in array && array[i] === item) return i;
			return -1;
	  	},
	  	
	  	/**
		 * Returns the last index of an item in an array. Useful in case there are duplicated indices.
		 *
		 * @method lastIndexOf
		 *
		 * @param {Array} array Array to search in
		 * @param {mixed} item Item to search for
		 *
		 * @return {Number}
		 *
		 */
	  	lastIndexOf = function(array, item) {
			if (array == null) return -1;
			if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) return array.lastIndexOf(item);
			var i = array.length;
			while (i--) if (i in array && array[i] === item) return i;
			return -1;
		},
		
		/**
		 * Generate an integer Array containing an arithmetic progression.
		 * A port of the native Python range(). Lifted from Underscore JS.
		 * See http://docs.python.org/library/functions.html#range for more info.
		 *
		 * @method range
		 * @param start Value to start progression from. Defaults to 0
		 * @param stop Value to stop progression at
		 * @param step Value to increment progression by. Defaults to 1
		 *
		 * @return Array containing the progression.
		 */
		range = function(start, stop, step) {
			var args  = _slice.call(arguments),
				solo  = args.length <= 1,
				start = solo ? 0 : args[0],
				stop  = solo ? args[0] : args[1],
				step  = args[2] || 1,
				len   = Math.max(Math.ceil((stop - start) / step), 0),
				idx   = 0,
				range = new Array(len);
				
			while (idx < len) {
				range[idx++] = start;
				start += step;
			}
			
			return range;
		},
		
		_publicAPI = {
            values: values,
            find: find,
            detect: find,
			keys: keys,
			bindAll: bindAll,
            toArray: toArray,
            each: each,
            functions: functions,
			contains: contains,
			include: contains,
			reduce: reduce,
			reduceRight: reduceRight,
			map: map,
			filter: filter,
			select: filter,
			reject: reject,
			some: some,
			any: some,
			every: every,
			all: every,
			pluck: pluck,
			remove: remove,
			shuffle: shuffle,
			clone: clone,
			max: max,
			min: min,
			invoke: invoke,
			sortBy: sortBy,
			sortedIndex: sortedIndex,
			groupBy: groupBy,
			size: size,
			first: first,
			head: first,
			initial: initial,
			last: last,
			rest: rest,
			tail: rest,
			compact: compact,
			flatten: flatten,
			without: without,
			unique: unique,
			union: union,
			intersection: intersection,
			intersect: intersection,
			difference: difference,
			zip: zip,
			indexOf: indexOf,
			lastIndexOf: lastIndexOf,
			range: range
        };
        
        Sushi.extend(utils, _publicAPI);
        
        return _publicAPI;
	}
);

/*
 * Sushi.Enumerable
 *
 */
 define('sushi.Enumerable',
 	// Module dependencies
 	[
 		'sushi.core',
 		'sushi.utils',
 		'sushi.utils.collection'
 	],

 	/**
 	 * Sushi Enumerable
 	 *
 	 * @namespace Sushi
 	 * @class Enumerable
 	 */
 	function(Sushi, utils, collection) {
        Sushi.namespace('Enumerable', Sushi);
        
        var Enumerable = function(value) {
        	Sushi.extend(value, Enumerable.prototype);
        	return value;
        };
        
        var	methods = ['each', 'map', 'reduce', 'reduceRight', 'find', 'detect', 'remove',
			'filter', 'select', 'reject', 'every', 'all', 'some', 'any', 'include',
			'contains', 'invoke', 'max', 'min', 'sortBy', 'sortedIndex', 'toArray', 'size',
			'first', 'rest', 'last', 'without', 'indexOf', 'lastIndexOf', 'isEmpty', 'groupBy'];
			
		collection.each(methods, function(method) {
			Enumerable.prototype[method] = function() {
				return collection[method].apply(Sushi, [this].concat(collection.toArray(arguments)));
			};
	  	});
	  	
	  	Sushi.Enumerable = Enumerable;  
        return Enumerable;
 	}
 );

/*
 * Sushi.stores
 *
 */
 define('sushi.stores',
 	// Module dependencies
 	[
 		'sushi.core',
 		'sushi.utils',
 		'sushi.Enumerable',
 		'sushi.Store',
 		'sushi.error'
 	],

 	/**
 	 * Sushi stores
 	 *
 	 * @namespace Sushi
 	 * @class stores
 	 */
 	function(Sushi, utils, Enumerable, Store, SushiError) {
        Sushi.namespace('stores', Sushi);
        
        var stores = new Enumerable([]);
        
        Sushi.extend(stores, {
        	register: function(store) {        						
				if (utils.isUndefined(store.name) || utils.isEmpty(store.name)) throw new SushiError('Store must have a name.');
        		
        		this.push({id: store.name, store: store});
        	},
        	
        	def: new Store()
        });
        
        Sushi.stores = stores;
        return stores;
 	}
 );
/**
 * Sushi MVC - Model
 *
 * @module Sushi.mvc
 */
define('sushi.mvc.model',
	[
		'sushi.core', 
		'sushi.event', 
		'sushi.utils',
		'sushi.utils.collection',
		'sushi.stores',
		'sushi.error',
		'sushi.Enumerable'
	],

	function(Sushi, event, utils, collection, stores, SushiError, Enumerable) {
		/**
		 * Sushi MVC - Model
		 * Heavily based on Backbone.Model
		 *
		 * @namespace Sushi
		 * @class Model
		 */
		Sushi.namespace('Model');
		
		var escapeHTML = function(string) {
			return string.replace(/&(?!\w+;|#\d+;|#x[\da-f]+;)/gi, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;').replace(/\//g,'&#x2F;');
			
		},
		
		wrapError = function(onError, model, options) {
			return function(resp) {
				if (onError) {
					onError(model, resp, options);
				} else {
					model.trigger('error', model, resp, options);
				}
			};
		},
		
		getValue = function(object, prop) {	
			if (!(object && object[prop])) return null;	
			return utils.isFunction(object[prop]) ? object[prop]() : object[prop];
		},
  		
		urlError = function() {
			throw new SushiError('A "url" property or function must be specified');
		}
		
		var Model = new Sushi.Class({
			constructor: function(attributes, options) {
				var defaults;
				attributes || (attributes = {});
				if (options && options.parse) attributes = this.parse(attributes);
				
				if (defaults = getValue(this, 'defaults')) {				  	
				  	Sushi.extend(attributes, defaults, false);
				}
				
				this.attributes = {};
				this._escapedAttributes = {};
				this.cid = utils.uniqueId('c');
				this._changed = {};
				if (!this.set(attributes, {silent: true})) {
					throw new SushiError("Can't create an invalid model");
				}
				
				this._previousAttributes = collection.clone(this.attributes);
				
				if (options && options.collection) this.collection = options.collection;
				
				if (this.collection && this.collection.store) this.store = this.collection.store;
				
				this.initialize.apply(this, arguments);
			},
			
			_previousAttributes: null,
			
			_changed: false,
			
			store: {},
			
			idAttribute: 'id',
			
			// Override with own initialization logic
			initialize: function(){},
			
			/**
			 * Return a copy of the model's attributes object.
			 *
			 * @method toJSON
			 *
			 * @return {Object} Copy of the model's attributes.
			 */
			toJSON: function() {
				return collection.clone(this.attributes);
			},
			
			/**
			 * Get the value of an attribute.
			 *
			 * @method get
			 * @param {String} attr Name of the attribute.
			 *
			 * @return {mixed} Value of the attribute.
			 */
			get: function(attr) {
				return this.attributes[attr];
			},
			
			/**
			 * Get the HTML-escaped value of an attribute.
			 *
			 * @method get
			 * @param {String} attr Name of the attribute.
			 *
			 * @return {mixed} Value of the attribute.
			 */
			escape: function(attr) {
				var html,
					val;
					
				if (html = this._escapedAttributes[attr]) return html;
				
				val = this.attributes[attr];
				return this._escapedAttributes[attr] = escapeHTML(val == null ? '' : '' + val);
			},
			
			/**
			 * Returns true if the attribute contains a value that is not null or undefined.
			 *
			 * @method has
			 * @param {String} attr Name of the attribute.
			 *
			 * @return {Boolean}
			 */
			has: function(attr) {
				return this.attributes[attr] != null;
			},
			
			/**
			 * Set a hash of model attributes on the object, firing "change" unless you choose to silence it.
			 *
			 * @method set
			 * @param {Object} attrs Hash of the model's new attributes
			 * @param {Object} options 
			 *
			 * @return {Model} Model instance.
			 */
			set: function(key, value, options) {
				var now,
					attrs,
					attr,
					escaped,
					prev,
					alreadySetting,
					val;
					
				if (utils.isObject(key) || key == null) {
					attrs = key;
					options = value;
				} else {
					attrs = {};
					attrs[key] = value;
				}
					
				options || (options = {});
				if (!attrs) return this;
				if (attrs instanceof Model) attrs = attrs.attributes;
				if (options.unset) for (var attr in attrs) attrs[attr] = void 0;
				
				if (!this._validate(attrs, options)) return false;
				if (this.idAttribute in attrs) this.id = attrs[this.idAttribute];
				
				now = this.attributes; 
				escaped = this._escapedAttributes;
				prev = this._previousAttributes || {};
				alreadySetting = this._setting;
				this._changed || (this._changed = {});
      			this._setting = true;
      			
      			for (var attr in attrs) {
					val = attrs[attr];
					
					if (!utils.isEqual(now[attr], val)) delete escaped[attr];

					options.unset ? delete now[attr] : now[attr] = val;
		
					if (this._changing && !utils.isEqual(this._changed[attr], val)) {
						this.trigger('change:' + attr, this, val, options);
						this._moreChanges = true;
					}
					delete this._changed[attr];
				  	
				  	if (!utils.isEqual(prev[attr], val) || (utils.has(now, attr) != utils.has(prev, attr))) {
						this._changed[attr] = val;
					}
			  	}
			  	
			  	if (!alreadySetting) {
					if (!options.silent && this.hasChanged()) this.change(options);
					this._setting = false;
			  }
				
				return this;
			},
			
			/**
			 * Remove an attribute from the model, firing "change" unless you choose to silence it. unset is a noop if the attribute doesn't exist.
			 *
			 * @method unset
			 * @param {Object} attr Name of the attribute to remove.
			 * @param {Object} options 
			 *
			 * @return {Model} Model instance.
			 */
			unset: function(attr, options) {
				(options || (options = {})).unset = true;
      			return this.set(attr, null, options);
			},
			
			/**
			 * Clear all attributes on the model, firing "change" unless you choose to silence it.
			 *
			 * @method clear
			 * @param {Object} options 
			 *
			 * @return {Model} Model instance.
			 */
			clear: function(options) {
				(options || (options = {})).unset = true;
      			return this.set(collection.clone(this.attributes), options);
			},
			
			fetch: function(options) {
				options = options ? collection.clone(options) : {};
				var model = this
				,	success = options.success;
				
				options.success = function(resp, status, xhr) {
					if (!model.set(model.parse(resp, xhr), options)) return false;
					if (success) success(model, resp);
				};
				
				options.error = wrapError(options.error, model, options);
				return (this.sync || this.store.sync || stores.def.sync).call(this, 'read', this, options);
			},
			
			save: function(key, value, options) {
				var attrs, current;
				if (utils.isObject(key) || key == null) {
					attrs = key;
					options = value;
				} else {
					attrs = {};
					attrs[key] = value;
				}
				
				options = options ? collection.clone(options) : {};
				if (options.wait) current = collection.clone(this.attributes);
				var silentOptions = Sushi.extend(options, {silent: true});
				
				if (attrs && !this.set(attrs, options.wait ? silentOptions : options)) {
					return false;
			  	}
				
				var model = this
			  	,	success = options.success
				,  	method = this.isNew() ? 'create' : 'update';
			  	
			  	options.success = function(resp, status, xhr) {
					var serverAttrs = model.parse(resp, xhr);
					if (options.wait) serverAttrs = Sushi.extend(attrs || {}, serverAttrs);
					if (!model.set(serverAttrs, options)) return false;
					if (success) {
					  	success(model, resp);
					} else {
					  	model.trigger('sync', model, resp, options);
					}
			  	};
			  	
			  	options.error = wrapError(options.error, model, options);
				var method = this.isNew() ? 'create' : 'update';
				var xhr = (this.sync || this.store.sync || stores.def.sync).call(this, method, this, options);
				if (options.wait) this.set(current, silentOptions);
				return xhr;
			},
			
			/**
			 * Destroy this model on the server if it was already persisted. Optimistically removes the model from its collection, if it has one. 
			 * If wait: true is passed, waits for the server to respond before removal.
			 *
			 * @method clear
			 * @param {Object} options 
			 *
			 * @return {Model} Model instance.
			 */
			destroy: function(options) {
				options = options ? collection.clone(options) : {};
				var model = this
			  	, 	
			  	success = options.success
			  	, 	
			  	triggerDestroy = function() {
						model.trigger('destroy', model, model.collection, options);
			  	};
			  	
		  		if (this.isNew()) return triggerDestroy();
		  		
		  		model.trigger('destroy', model, model.collection, options);
		  		
		  		options.success = function(resp) {
					if (options.wait) triggerDestroy();
					if (success) {
					  	success(model, resp);
					} else {
					  	model.trigger('sync', model, resp, options);
					}
		  		};
		  		
		  		options.error = wrapError(options.error, model, options);
		  		var xhr = (this.sync || this.store.sync || stores.def.sync).call(this, 'delete', this, options);
		  		if (!options.wait) triggerDestroy();
      			return xhr;
			},
			
			url: function() {
				var base = getValue(this.collection, 'url') || getValue(this, 'urlRoot') || urlError();
			  	if (this.isNew()) return base;
			  	return base + (base.charAt(base.length - 1) == '/' ? '' : '/') + encodeURIComponent(this.id);
			},
			
			/**
			 * Convert a response into the hash of attributes to be set on the model
			 *
			 * @method parse
			 * @param {Object} resp Response
			 * @param {XMLHttpRequest} xhr Request object
			 *
			 * @return {Object} Parsed response
			 */
			parse: function(resp, xhr) {
				return resp;
			},
			
			/**
			 * Create a new model with identical attributes to this one.
			 *
			 * @method clone
			 *
			 * @return {Model} Clone of this Model's instance
			 */
			clone: function() {
				return new this.constructor(this);
			},
			
			/**
			 * A model is new if it has never been saved to the server, and lacks an id.
			 *
			 * @method isNew
			 *
			 * @return {Boolean}
			 */
			isNew: function() {
				return this.id == null;
			},
			
			/**
			 * Manually fire a change event for this model. Calling this will cause all objects observing the model to update.
			 *
			 * @method change
			 *
			 */
			change: function(options) {
				if (this._changing || !this.hasChanged()) return this;
				this._changing = true;
				this._moreChanges = true;
				for (var attr in this._changed) {
					this.trigger('change:' + attr, this, this._changed[attr], options);
				}
				while (this._moreChanges) {
					this._moreChanges = false;
					this.trigger('change', this, options);
				}
				this._previousAttributes = collection.clone(this.attributes);
				delete this._changed;
				this._changing = false;
				return this;
			},
			
			/**
			 * Determine if the model has changed since the last "change" event. If you specify an attribute name, determine if that attribute has changed.
			 *
			 * @method hasChanged
			 * @param {String} attr Attribute name
			 *
			 * @return {Boolean}
			 */
			hasChanged: function(attr) {
				if (!arguments.length) return !utils.isEmpty(this._changed);
      			return this._changed && utils.has(this._changed, attr);
			},
			
			/**
			 * Return an object containing all the attributes that have changed, or false if there are no changed attributes.
			 *
			 * @method changedAttributes
			 * @param {Object} now New attributes to compare to
			 *
			 * @return {Object|Boolean}
			 */
			changedAttributes: function(diff) {
				if (!diff) return this.hasChanged() ? collection.clone(this._changed) : false;
				var val, changed = false, old = this._previousAttributes;
				
				for (var attr in diff) {
					if (utils.isEqual(old[attr], (val = diff[attr]))) continue;
					(changed || (changed = {}))[attr] = val;
				}
				
				return changed;
			},
			
			/**
			 * Get the previous value of an attribute, recorded at the time the last "change" event was fired.
			 *
			 * @method previous
			 *
			 * @return {mixed} Previous attribute value
			 */
			previous: function(attr) {
				if (!attr || !this._previousAttributes) return null;
      			return this._previousAttributes[attr];
			},
			
			/**
			 * Get all of the attributes of the model at the time of the previous "change" event.
			 *
			 * @method previousAttributes
			 *
			 * @return {Object} Model's previous attributes
			 */
			previousAttributes: function() {
				return collection.clone(this._previousAttributes);
			},
			
			/**
			 * Run validation against a set of incoming attributes, returning true if all is well. If a specific error callback has been passed, call that instead of firing the general "error" event.
			 *
			 * @method _validate
			 * @param {Object} attrs Hash of attributes to validate
			 * @param {Object} options
			 *
			 * @return {Boolean}
			 */
			_validate: function(attrs, options) {
			  	if (options.silent || !this.validate) return true;
			  	attrs = Sushi.extend(this.attributes, attrs);
			  	
			  	var error = this.validate(attrs, options);
			  	if (!error) return true;
			  	
			  	if (options && options.error) {
					options.error(this, error, options);
			  	} else {
					this.trigger('error', this, error, options);
			  	}
			  	
			  	return false;
			}
		});
		
		Sushi.extendClass(Model, event);
		Sushi.Model = Model;
		return Model;
	}
);
/*
 * Sushi.Collection - 
 *
 */
 define('sushi.mvc.collection',
 	// Module dependencies
 	[
 		'sushi.core',
 		'sushi.event',
 		'sushi.utils',
 		'sushi.utils.collection',
 		'sushi.mvc.model',
 		'sushi.stores',
 		'sushi.error'
    ],

 	/**
 	 * Sushi MVC Collection
 	 *
 	 * @namespace Sushi
 	 * @class Collection
 	 */
 	function(Sushi, event, utils, collection, Model, stores, SushiError) {
 		Sushi.namespace('Collection');
 		
 		var Collection,
 			wrapError = function(onError, model, options) {
				return function(resp) {
					if (onError) {
						onError(model, resp, options);
					} else {
						model.trigger('error', model, resp, options);
					}
				};
		  	},
		  	splice = Array.prototype.splice;
 		
 		Collection = new Sushi.Class({
 			constructor: function(models, options) {
 				options || (options = {});
				if (options.comparator) this.comparator = options.comparator;
				this._reset();
				if (models) this.reset(models, {silent: true});				
				this.initialize.apply(this, arguments);
 			},
 			
 			store: {},
 			
 			model: Model,
 			
 			initialize: function() {},
 			
 			toJSON: function() {
 				return this.map(function(model){ return model.toJSON(); });
 			},
 			
 			add: function(models, options) {
 				var i, index, length, model, cid, id, cids = {}, ids = {};
				options || (options = {});
				models = utils.isArray(models) ? models.slice() : [models];
				
				//Begin by turning bare objects into model references, and preventing invalid models or duplicate models from being added.
				for (i = 0, length = models.length; i < length; i++) {
					if (!(model = models[i] = this._prepareModel(models[i], options))) {
				  		throw new SushiError("Can't add an invalid model to a collection");
					}
					if (cids[cid = model.cid] || this._byCid[cid] ||
				  		(((id = model.id) != null) && (ids[id] || this._byId[id]))) {
				  		throw new SushiError("Can't add the same model to a collection twice");
					}
					cids[cid] = ids[id] = model;
			 	}
			 	
			 	//Listen to added models' events, and index models for lookup by id and by cid.
			 	for (i = 0; i < length; i++) {
					(model = models[i]).bind('all', this._onModelEvent, this);
					this._byCid[model.cid] = model;
					if (model.id != null) this._byId[model.id] = model;
			  	}
			  	
			  	//Insert models into the collection, re-sorting if needed, and triggering add events unless silenced.
			  	this.length += length;
				index = options.at != null ? options.at : this.models.length;
				splice.apply(this.models, [index, 0].concat(models));
				if (this.comparator) this.sort({silent: true});
				if (options.silent) return this;
				for (i = 0, length = this.models.length; i < length; i++) {
					if (!cids[(model = this.models[i]).cid]) continue;
					options.index = i;
					model.trigger('add', model, this, options);
				}
				return this;
			},
			
			remove: function(models, options) {
				var i, l, index, model;
				options || (options = {});
				models = utils.isArray(models) ? models.slice() : [models];
				for (i = 0, l = models.length; i < l; i++) {
					model = this.getByCid(models[i]) || this.get(models[i]);
					if (!model) continue;
					delete this._byId[model.id];
					delete this._byCid[model.cid];
					index = this.indexOf(model);
					this.models.splice(index, 1);
					this.length--;
					if (!options.silent) {
					  options.index = index;
					  model.trigger('remove', model, this, options);
				}
					this._removeReference(model);
				}
				
				return this;
			},
			
			get: function(id) {
				if (id == null) return null;
			  	return this._byId[id.id != null ? id.id : id];
			},
			
			getByCid: function(cid) {
			  	return cid && this._byCid[cid.cid || cid];
			},
			
			at: function(index) {
			  	return this.models[index];
			},
			
			sort: function(options) {
			  	options || (options = {});
			  	if (!this.comparator) throw new SushiError('Cannot sort a set without a comparator');
			  	
			  	var boundComparator = utils.bind(this.comparator, this);
				if (this.comparator.length == 1) {
					this.models = this.sortBy(boundComparator);
				} else {
					this.models.sort(boundComparator);
				}
				
				if (!options.silent) this.trigger('reset', this, options);
				return this;
			},
			
			pluck: function(attr) {
			  	return Sushi.utils.map(this.models, function(model){ return model.get(attr); });
			},
			
			reset: function(models, options) {
			  	models  || (models = []);
				options || (options = {});
				for (var i = 0, l = this.models.length; i < l; i++) {
					this._removeReference(this.models[i]);
				}
				this._reset();
				this.add(models, {silent: true, parse: options.parse});
				if (!options.silent) this.trigger('reset', this, options);
				return this;
			},
			
			fetch: function(options) {
			  	options = options ? collection.clone(options) : {};
      			if (options.parse === undefined) options.parse = true;
			  	
			  	var coll = this
			  	, 	success = options.success;
			  	
			  	options.success = function(resp, status, xhr) {
					coll[options.add ? 'add' : 'reset'](coll.parse(resp, xhr), options);
					if (success) success(collection, resp);
			  	};
			  	
			  	options.error = wrapError(options.error, coll, options);
			  	return (this.sync || this.store.sync || stores.def.sync).call(this, 'read', this, options);
			},
			
			create: function(model, options) {
			  	var coll = this;
				options = options ? _.clone(options) : {};
				model = this._prepareModel(model, options);
				if (!model) return false;
				if (!options.wait) coll.add(model, options);
				var success = options.success;
				options.success = function(nextModel, resp, xhr) {
					if (options.wait) coll.add(nextModel, options);
					if (success) {
					  	success(nextModel, resp);
					} else {
					  	nextModel.trigger('sync', model, resp, options);
					}
				};
				model.save(null, options);
				return model;
			},
			
			parse: function(resp, xhr) {
				return resp;
			},
			
			next: function(model) {
				var i = this.at(this.indexOf(model));
				if (undefined === i || i < 0) return false;
				return this.at(this.indexOf(model) + 1);
			},
			
			prev: function(model) {
				if (undefined === i || i < 1) return false;
				return this.at(this.indexOf(model) - 1);
			},
			
			_reset: function(options) {
			  	this.length = 0;
			  	this.models = [];
			  	this._byId  = {};
			  	this._byCid = {};
			},
			
			_prepareModel: function(model, options) {
			  	if (!(model instanceof Model)) {
					var attrs = model;
					options.collection = this;
					model = new this.model(attrs, options);
					if (!model._validate(model.attributes, options)) model = false;
			  	} else if (!model.collection) {
					model.collection = this;
			  	}
			  return model;
			},
			
			_removeReference : function(model) {
			  	if (this == model.collection) {
					delete model.collection;
			  	}
			  	model.unbind('all', this._onModelEvent);
			},
			
			_onModelEvent : function(ev, model, collection, options) {
			  	if ((ev == 'add' || ev == 'remove') && collection != this) return;
			  	if (ev == 'destroy') {
					this._remove(model, options);
			  	}
			  	if (model && ev === 'change:' + model.idAttribute) {
					delete this._byId[model.previous(model.idAttribute)];
					this._byId[model.id] = model;
				}
				this.trigger.apply(this, arguments);
			}
 		});
 		
 		var methods = ['each', 'map', 'reduce', 'reduceRight', 'find', 'detect',
			'filter', 'select', 'reject', 'every', 'all', 'some', 'any', 'include',
			'contains', 'invoke', 'max', 'min', 'sortBy', 'sortedIndex', 'toArray', 'size',
			'first', 'rest', 'last', 'without', 'indexOf', 'lastIndexOf', 'isEmpty', 'groupBy'];
			
		utils.each(methods, function(method) {
			Collection.prototype[method] = function() {
			  	return collection[method].apply(Sushi, [this.models].concat(collection.toArray(arguments)));
			};
	  	});
 		
 		Sushi.extendClass(Collection, event);
 		
 		Sushi.Collection = Collection;
 		return Collection;
 	}
 );
/*
 * Sushi.History - Handles cross-browser history management, based on URL fragments.
 *
 */
 define('sushi.history',
 	// Module dependencies
 	[
 		'sushi.utils',
 		'sushi.event',
 		'sushi.error'
    ],

 	/**
 	 * Sushi MVC History
 	 *
 	 * @namespace Sushi
 	 * @class history
 	 */
 	function(utils, event, SushiError) {
 		Sushi.namespace('History');
 		
 		var routeStripper = /^[#\/]/,
 		isExplorer = /msie [\w.]+/,
 		historyStarted = false,
 		_updateHash = function(location, fragment, replace) {
		  	if (replace) {
				location.replace(location.toString().replace(/(javascript:|#).*$/, '') + '#' + fragment);
		  	} else {
				location.hash = fragment;
		  	}
		}
	  	
 		Sushi.History = function() {
			this.handlers = [];
 			utils.bindAll(this, 'checkUrl');
 		}
 		
 		Sushi.extend(Sushi.History.prototype, {	
 			interval: 50,
 			
 			getFragment : function(fragment, forcePushState) {
				if (fragment == null) {
					if (this._hasPushState || forcePushState) {
				  		fragment = window.location.pathname;
				  		var search = window.location.search;
				  		if (search) fragment += search;
					} else {
				  		fragment = window.location.hash;
					}
			  	}
			  	fragment = decodeURIComponent(fragment);
			  	if (fragment.indexOf(this.options.root) == 0) fragment = fragment.substr(this.options.root.length);
			  	return fragment.replace(routeStripper, '');
			},
			
			start : function(options) {
				if (historyStarted) throw new SushiError("Sushi.history has already been started");
				this.options          = Sushi.extend({root: '/'}, Sushi.extend(this.options, options), true);
				this._wantsHashChange = this.options.hashChange !== false;
				this._wantsPushState  = !!this.options.pushState;
				this._hasPushState    = !!(this.options.pushState && window.history && window.history.pushState);
				var fragment          = this.getFragment();
				var docMode           = document.documentMode;
				var oldIE             = (isExplorer.exec(navigator.userAgent.toLowerCase()) && (!docMode || docMode <= 7));
				if (oldIE) {
					this.iframe = $('<iframe>').attr({src: 'javascript:0', tabindex:'-1'}).hide().appendTo('body')[0].contentWindow;
					this.navigate(fragment);
				}
				
				if (this._hasPushState) {
					$(window).bind('popstate', this.checkUrl);
				} else if (this._wantsHashChange && ('onhashchange' in window) && !oldIE) {
					$(window).bind('hashchange', this.checkUrl);
				} else if (this._wantsHashChange) {
					this._checkUrlInterval = setInterval(this.checkUrl, this.interval);
				}
				
				this.fragment = fragment;
			  	historyStarted = true;
			  	var loc = window.location;
			  	var atRoot  = loc.pathname == this.options.root;
			  	
			  	if (this._wantsHashChange && this._wantsPushState && !this._hasPushState && !atRoot) {
					this.fragment = this.getFragment(null, true);
					window.location.replace(this.options.root + '#' + this.fragment);
					
					return true;
				} else if (this._wantsPushState && this._hasPushState && atRoot && loc.hash) {
					this.fragment = loc.hash.replace(routeStripper, '');
					window.history.replaceState({}, document.title, loc.protocol + '//' + loc.host + this.options.root + this.fragment);
				}
		
			  	if (!this.options.silent) {
					return this.loadUrl();
			  	}
			},
			
			stop: function() {
				$(window).unbind('popstate', this.checkUrl).unbind('hashchange', this.checkUrl);
				clearInterval(this._checkUrlInterval);
				historyStarted = false;
			},
			
			route : function(route, callback) {
				this.handlers.unshift({route : route, callback : callback});
			},
			
			checkUrl : function(e) {
				var current = this.getFragment();
			  	if (current == this.fragment && this.iframe) current = this.getFragment(this.iframe.location.hash);
			  	if (current == this.fragment || current == decodeURIComponent(this.fragment)) return false;
			  	if (this.iframe) this.navigate(current);
			  	this.loadUrl() || this.loadUrl(window.location.hash);
			},
			
			loadUrl : function(fragmentOverride) {
				var fragment = this.fragment = this.getFragment(fragmentOverride),
			  	matched = utils.any(this.handlers, function(handler) {
					if (handler.route.test(fragment)) {
				  		handler.callback(fragment);
				  		return true;
					}
			  	});
			  	return matched;
			},
			
			navigate : function(fragment, options) {
				if (!historyStarted) return false;
				if (!options || options === true) options = {trigger: options};
				var frag = (fragment || '').replace(routeStripper, '');
				
			  	if (this.fragment == frag || this.fragment == decodeURIComponent(frag)) return;
			  	
			  	if (this._hasPushState) {
					if (frag.indexOf(this.options.root) != 0) frag = this.options.root + frag;
					this.fragment = frag;
					window.history[options.replace ? 'replaceState' : 'pushState']({}, document.title, frag);
			  	} else if (this._wantsHashChange) {
					this.fragment = frag;
					_updateHash(window.location, frag, options.replace);
					if (this.iframe && (frag != this.getFragment(this.iframe.location.hash))) {
						if(!options.replace) this.iframe.document.open().close();
			          	_updateHash(this.iframe.location, frag, options.replace);
			        }
			  	} else {
			  		window.location.assign(this.options.root + fragment);
			  	}
			  	if (options.trigger) this.loadUrl(fragment);
			}
 		});
 		
 		Sushi.extend(Sushi.History.prototype, event);
 		
 		return Sushi.History;
 	}
 );
/*
 * Sushi.Router - Routers map faux-URLs to actions, and fire events when routes are matched.
 *
 */
 define('sushi.mvc.router',
 	// Module dependencies
 	[
 		'sushi.event',
 		'sushi.utils',
 		'sushi.history'
    ],

 	/**
 	 * Sushi MVC Router
 	 *
 	 * @namespace Sushi
 	 * @class router
 	 */
 	function(event, utils, History) {
 		Sushi.namespace('Router');
 		
 		var namedParam    = /:\w+/g,
		splatParam    = /\*\w+/g,
	  	escapeRegExp  = /[-[\]{}()+?.,\\^$|#\s]/g,
 		Router = new Sushi.Class({
 			constructor: function(options) {
 				options || (options = {});
 				if (options.routes) this.routes = options.routes;
				this._bindRoutes();
				this.initialize.apply(this, arguments);
 			},
 			
 			/**
 			 * Initialize is an empty function by default. Override it with your own initialization logic.
 			 *
 			 * @method initialize
 			 */
 			initialize : function(){},
 			
 			/**
			 * Manually bind a single named route to a callback
			 *
			 * @method route
			 *
			 * @param {String} route Route expression
			 * @param {String} name Route name
			 * @param {Function} callback Function to run on route match.
			 *
			 */
 			route : function(route, name, callback) {
				Sushi.history || (Sushi.history = new History());
			  	if (!utils.isRegExp(route)) route = this._routeToRegExp(route);
			  	if (!callback) callback = this[name];

			  	Sushi.history.route(route, utils.bind(function(fragment) {
					var args = this._extractParameters(route, fragment);
					callback && callback.apply(this, args);
					this.trigger.apply(this, ['route:' + name].concat(args));
					Sushi.history.trigger('route', this, name, args);
			  	}, this));
			  	
			  	return this;
			},
			
			/**
			 * Simple proxy to Sushi.history to save a fragment into the history.
			 *
			 * @method navigate
			 *
			 * @param {String} fragment
			 * @param {Object} options Options Hash
			 *
			 */
			navigate : function(fragment, options) {
				Sushi.history.navigate(fragment, options);
			},
			
			/**
			 * Bind all defined routes to Backbone.history. 
			 * The order of the routes is reversed to support behavior where the most general routes can be defined at the bottom of the route map.
			 *
			 * @method _bindRoutes
			 */
			_bindRoutes : function() {
				if (!this.routes) return;
			  	var routes = [];
			  	
			  	for (var route in this.routes) {
					routes.unshift([route, this.routes[route]]);
			  	}
			  	
			  	for (var i = 0, l = routes.length; i < l; i++) {
					this.route(routes[i][0], routes[i][1], this[routes[i][1]]);
			  	}
			},
			
			/**
			 * Convert a route string into a regular expression, suitable for matching against the current location hash.
			 *
			 * @method _routeToRegExp
			 */
			_routeToRegExp : function(route) {
				route = route.replace(escapeRegExp, "\\$&")
						.replace(namedParam, "([^\/]*)")
						.replace(splatParam, "(.*?)");
						
			  	return new RegExp('^' + route + '$');
			},
			
			/**
			 * Given a route, and a URL fragment that it matches, return the array of extracted parameters.
			 *
			 * @method _extractParameters
			 */
			_extractParameters : function(route, fragment) {
			  	return route.exec(fragment).slice(1);
			}
 		});
 		
 		Sushi.extendClass(Router, event);
 		
 		Sushi.Router = Router;
 		
 		return Router;
 	}
 );
/*
 * Sushi.Enumerable
 *
 */
 define('sushi.Enumerable',
 	// Module dependencies
 	[
 		'sushi.core',
 		'sushi.utils',
 		'sushi.utils.collection'
 	],

 	/**
 	 * Sushi Enumerable
 	 *
 	 * @namespace Sushi
 	 * @class Enumerable
 	 */
 	function(Sushi, utils, collection) {
        Sushi.namespace('Enumerable', Sushi);
        
        var Enumerable = function(value) {
        	Sushi.extend(value, Enumerable.prototype);
        	return value;
        };
        
        var	methods = ['each', 'map', 'reduce', 'reduceRight', 'find', 'detect', 'remove',
			'filter', 'select', 'reject', 'every', 'all', 'some', 'any', 'include',
			'contains', 'invoke', 'max', 'min', 'sortBy', 'sortedIndex', 'toArray', 'size',
			'first', 'rest', 'last', 'without', 'indexOf', 'lastIndexOf', 'isEmpty', 'groupBy'];
			
		collection.each(methods, function(method) {
			Enumerable.prototype[method] = function() {
				return collection[method].apply(Sushi, [this].concat(collection.toArray(arguments)));
			};
	  	});
	  	
	  	Sushi.Enumerable = Enumerable;  
        return Enumerable;
 	}
 );

define("sushi.enumerable", function(){});

define('vendors/polyfills.localstorage',["require", "exports", "module"], function(require, exports, module) {
if (typeof window.localStorage === 'undefined' || typeof window.sessionStorage === 'undefined') (function () {

var Storage = function (type) {
  function createCookie(name, value, days) {
    var date, expires;

    if (days) {
      date = new Date();
      date.setTime(date.getTime()+(days*24*60*60*1000));
      expires = "; expires="+date.toGMTString();
    } else {
      expires = "";
    }
    document.cookie = name+"="+value+expires+"; path=/";
  }

  function readCookie(name) {
    var nameEQ = name + "=",
        ca = document.cookie.split(';'),
        i, c;

    for (i=0; i < ca.length; i++) {
      c = ca[i];
      while (c.charAt(0)==' ') {
        c = c.substring(1,c.length);
      }

      if (c.indexOf(nameEQ) == 0) {
        return c.substring(nameEQ.length,c.length);
      }
    }
    return null;
  }
  
  function setData(data) {
    data = JSON.stringify(data);
    if (type == 'session') {
      window.name = data;
    } else {
      createCookie('localStorage', data, 365);
    }
  }
  
  function clearData() {
    if (type == 'session') {
      window.name = '';
    } else {
      createCookie('localStorage', '', 365);
    }
  }
  
  function getData() {
    var data = type == 'session' ? window.name : readCookie('localStorage');
    return data ? JSON.parse(data) : {};
  }


  // initialise if there's already data
  var data = getData();

  return {
    length: 0,
    clear: function () {
      data = {};
      this.length = 0;
      clearData();
    },
    getItem: function (key) {
      return data[key] === undefined ? null : data[key];
    },
    key: function (i) {
      // not perfect, but works
      var ctr = 0;
      for (var k in data) {
        if (ctr == i) return k;
        else ctr++;
      }
      return null;
    },
    removeItem: function (key) {
      delete data[key];
      this.length--;
      setData(data);
    },
    setItem: function (key, value) {
      data[key] = value+''; // forces the value to a string
      this.length++;
      setData(data);
    }
  };
};

if (typeof window.localStorage == 'undefined') window.localStorage = new Storage('local');
if (typeof window.sessionStorage == 'undefined') window.sessionStorage = new Storage('session');

})();
});

/*
 * Sushi.stores.LocalStore
 * Based on the Backbone.localStorage implementation: https://github.com/jeromegn/Backbone.localStorage
 *
 */
 define('sushi.stores.LocalStore',
 	// Module dependencies
 	[
 		'sushi.core',
 		'sushi.Store',
 		'sushi.stores',
 		'sushi.Enumerable',
 		'sushi.utils.json',
 		'sushi.error',
 		'vendors/polyfills.localstorage'
 	],

 	/**
 	 * Sushi stores.LocalStore
 	 *
 	 * @namespace Sushi
 	 * @class stores.LocalStore
 	 */
 	function(Sushi, Store, SushiStores, Enumerable, JSON, SushiError) {        
        var LocalStore
        	, localStorage = window.localStorage;
        
        // Generate four random hex digits.
		function S4() {
		   return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
		};
		
		// Generate a pseudo-GUID by concatenating random hexadecimal.
		function guid() {
		   return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
		};
		
		LocalStore = new Sushi.Class(Store, {
			constructor: function(name) {
				var store;
				
				LocalStore.Super.call(this, name);

				this.name = name;
				store = localStorage.getItem(this.name);
				this.records = (store && store.split(",")) || [];
				this.records = new Enumerable(this.records);
			}
		});
		
		Sushi.extendClass(LocalStore, {
			// Save the current state of the **Store** to *localStorage*.
			save: function() {
				localStorage.setItem(this.name, this.records.join(","));
			},
			
			// Add a model, giving it a (hopefully)-unique GUID, if it doesn't already
			// have an id of it's own.
			create: function(model) {
				if (!model.id) {
					model.id = guid();
					
					if (model.attributes) model.attributes.id = model.id;
				}
				if (this.records && this.records.length && this.records.contains(model.id)) return false;
				
				localStorage.setItem(this.name+"-"+model.id, JSON.stringify(model));
				this.records.push(model.id.toString());
				this.save();
				return model;
			},
			
			// Update a model by replacing its copy in `this.data`.
			update: function(model) {
				localStorage.setItem(this.name+"-"+model.id, JSON.stringify(model));
				if (!this.records.include(model.id.toString())) this.records.push(model.id.toString()); this.save();
				return model;
			},
			
			// Retrieve a model from `this.data` by id.
			find: function(model) {
				if (!model.id) throw new SushiError('Object needs an id attribute.')
				return JSON.parse(localStorage.getItem(this.name+"-"+model.id));
			},
			
			findById: function(id) {
				if (!id) throw new SushiError('id is required.');
				return JSON.parse(localStorage.getItem(this.name+"-"+id));
			},
			
			// Return the array of all models currently in storage.
			findAll: function() {
				return this.records.map(function(id){return JSON.parse(localStorage.getItem(this.name+"-"+id));}, this);
			},
			
			empty: function() {
				this.records.map(function(id) {
					this.records = new Enumerable(this.records).reject(function(record_id){return record_id == id.toString();});
					localStorage.removeItem(this.name+"-"+id);
				}, this);

				this.save();
				return this;
			},
			
			// Delete a model from `this.data`, returning it.
			destroy: function(model) {
				localStorage.removeItem(this.name+"-"+model.id);
				this.records = new Enumerable(this.records).reject(function(record_id){return record_id == model.id.toString();});
				this.save();
				return model;
			},
			
			sync: function(method, model, options, error) {
				var resp
				,	store = model.store || model.collection.store;
				
				if (!store) throw new SushiError('A LocalStore instance must exist.');	
				
				switch (method) {
					case "read":    resp = model.id != undefined ? store.find(model) : store.findAll(); break;
					case "create":  resp = store.create(model);                            break;
					case "update":  resp = store.update(model);                            break;
					case "delete":  resp = store.destroy(model);                           break;
				}
				
				if (resp) {
					options.success(resp);
				} else {
					options.error("Record not found");
				}
			}
		});
        
        Sushi.extend(SushiStores, {LocalStore: LocalStore});

        return LocalStore;
 	}
 );

define('vendors/reqwest',["require", "exports", "module"], function(require, exports, module) {
/*!
  * Reqwest! A general purpose XHR connection manager
  * (c) Dustin Diaz 2011
  * https://github.com/ded/reqwest
  * license MIT
  */
!function (name, definition) {
  if (typeof module != 'undefined') module.exports = definition()
  else if (typeof define == 'function' && define.amd) define(name, definition)
  else this[name] = definition()
}('reqwest', function () {

  var context = this
    , win = window
    , doc = document
    , old = context.reqwest
    , twoHundo = /^20\d$/
    , byTag = 'getElementsByTagName'
    , readyState = 'readyState'
    , contentType = 'Content-Type'
    , requestedWith = 'X-Requested-With'
    , head = doc[byTag]('head')[0]
    , uniqid = 0
    , lastValue // data stored by the most recent JSONP callback
    , xmlHttpRequest = 'XMLHttpRequest'
    , defaultHeaders = {
          contentType: 'application/x-www-form-urlencoded'
        , accept: {
              '*':  'text/javascript, text/html, application/xml, text/xml, */*'
            , xml:  'application/xml, text/xml'
            , html: 'text/html'
            , text: 'text/plain'
            , json: 'application/json, text/javascript'
            , js:   'application/javascript, text/javascript'
          }
        , requestedWith: xmlHttpRequest
      }
    , xhr = (xmlHttpRequest in win) ?
        function () {
          return new XMLHttpRequest()
        } :
        function () {
          return new ActiveXObject('Microsoft.XMLHTTP')
        }

  function handleReadyState(o, success, error) {
    return function () {
      if (o && o[readyState] == 4) {
        if (twoHundo.test(o.status)) {
          success(o)
        } else {
          error(o)
        }
      }
    }
  }

  function setHeaders(http, o) {
    var headers = o.headers || {}
    headers.Accept = headers.Accept || defaultHeaders.accept[o.type] || defaultHeaders.accept['*']
    // breaks cross-origin requests with legacy browsers
    if (!o.crossOrigin && !headers[requestedWith]) headers[requestedWith] = defaultHeaders.requestedWith
    if (!headers[contentType]) headers[contentType] = o.contentType || defaultHeaders.contentType
    for (var h in headers) {
      headers.hasOwnProperty(h) && http.setRequestHeader(h, headers[h])
    }
  }

  function generalCallback(data) {
    lastValue = data
  }

  function urlappend(url, s) {
    return url + (/\?/.test(url) ? '&' : '?') + s
  }

  function handleJsonp(o, fn, err, url) {
    var reqId = uniqid++
      , cbkey = o.jsonpCallback || 'callback' // the 'callback' key
      , cbval = o.jsonpCallbackName || ('reqwest_' + reqId) // the 'callback' value
      , cbreg = new RegExp('((^|\\?|&)' + cbkey + ')=([^&]+)')
      , match = url.match(cbreg)
      , script = doc.createElement('script')
      , loaded = 0

    if (match) {
      if (match[3] === '?') {
        url = url.replace(cbreg, '$1=' + cbval) // wildcard callback func name
      } else {
        cbval = match[3] // provided callback func name
      }
    } else {
      url = urlappend(url, cbkey + '=' + cbval) // no callback details, add 'em
    }

    win[cbval] = generalCallback

    script.type = 'text/javascript'
    script.src = url
    script.async = true
    if (typeof script.onreadystatechange !== 'undefined') {
        // need this for IE due to out-of-order onreadystatechange(), binding script
        // execution to an event listener gives us control over when the script
        // is executed. See http://jaubourg.net/2010/07/loading-script-as-onclick-handler-of.html
        script.event = 'onclick'
        script.htmlFor = script.id = '_reqwest_' + reqId
    }

    script.onload = script.onreadystatechange = function () {
      if ((script[readyState] && script[readyState] !== 'complete' && script[readyState] !== 'loaded') || loaded) {
        return false
      }
      script.onload = script.onreadystatechange = null
      script.onclick && script.onclick()
      // Call the user callback with the last value stored and clean up values and scripts.
      o.success && o.success(lastValue)
      lastValue = undefined
      head.removeChild(script)
      loaded = 1
    }

    // Add the script to the DOM head
    head.appendChild(script)
  }

  function getRequest(o, fn, err) {
    var method = (o.method || 'GET').toUpperCase()
      , url = typeof o === 'string' ? o : o.url
      // convert non-string objects to query-string form unless o.processData is false
      , data = (o.processData !== false && o.data && typeof o.data !== 'string')
        ? reqwest.toQueryString(o.data)
        : (o.data || null);

    // if we're working on a GET request and we have data then we should append
    // query string to end of URL and not post data
    (o.type == 'jsonp' || method == 'GET')
      && data
      && (url = urlappend(url, data))
      && (data = null)

    if (o.type == 'jsonp') return handleJsonp(o, fn, err, url)

    var http = xhr()
    http.open(method, url, true)
    setHeaders(http, o)
    http.onreadystatechange = handleReadyState(http, fn, err)
    o.before && o.before(http)
    http.send(data)
    return http
  }

  function Reqwest(o, fn) {
    this.o = o
    this.fn = fn
    init.apply(this, arguments)
  }

  function setType(url) {
    var m = url.match(/\.(json|jsonp|html|xml)(\?|$)/)
    return m ? m[1] : 'js'
  }

  function init(o, fn) {
    this.url = typeof o == 'string' ? o : o.url
    this.timeout = null
    var type = o.type || setType(this.url)
      , self = this
    fn = fn || function () {}

    if (o.timeout) {
      this.timeout = setTimeout(function () {
        self.abort()
      }, o.timeout)
    }

    function complete(resp) {
      o.timeout && clearTimeout(self.timeout)
      self.timeout = null
      o.complete && o.complete(resp)
    }

    function success(resp) {
      var r = resp.responseText
      if (r) {
        switch (type) {
        case 'json':
          try {
            resp = win.JSON ? win.JSON.parse(r) : eval('(' + r + ')')
          } catch(err) {
            return error(resp, 'Could not parse JSON in response', err)
          }
          break;
        case 'js':
          resp = eval(r)
          break;
        case 'html':
          resp = r
          break;
        }
      }

      fn(resp)
      o.success && o.success(resp)

      complete(resp)
    }

    function error(resp, msg, t) {
      o.error && o.error(resp, msg, t)
      complete(resp)
    }

    this.request = getRequest(o, success, error)
  }

  Reqwest.prototype = {
    abort: function () {
      this.request.abort()
    }

  , retry: function () {
      init.call(this, this.o, this.fn)
    }
  }

  function reqwest(o, fn) {
    return new Reqwest(o, fn)
  }

  // normalize newline variants according to spec -> CRLF
  function normalize(s) {
    return s ? s.replace(/\r?\n/g, '\r\n') : ''
  }

  var isArray = typeof Array.isArray == 'function' ? Array.isArray : function(a) {
    return a instanceof Array
  }

  function serial(el, cb) {
    var n = el.name
      , t = el.tagName.toLowerCase()
      , optCb = function(o) {
          // IE gives value="" even where there is no value attribute
          // 'specified' ref: http://www.w3.org/TR/DOM-Level-3-Core/core.html#ID-862529273
          if (o && !o.disabled)
            cb(n, normalize(o.attributes.value && o.attributes.value.specified ? o.value : o.text))
        }

    // don't serialize elements that are disabled or without a name
    if (el.disabled || !n) return;

    switch (t) {
    case 'input':
      if (!/reset|button|image|file/i.test(el.type)) {
        var ch = /checkbox/i.test(el.type)
          , ra = /radio/i.test(el.type)
          , val = el.value;
        // WebKit gives us "" instead of "on" if a checkbox has no value, so correct it here
        (!(ch || ra) || el.checked) && cb(n, normalize(ch && val === '' ? 'on' : val))
      }
      break;
    case 'textarea':
      cb(n, normalize(el.value))
      break;
    case 'select':
      if (el.type.toLowerCase() === 'select-one') {
        optCb(el.selectedIndex >= 0 ? el.options[el.selectedIndex] : null)
      } else {
        for (var i = 0; el.length && i < el.length; i++) {
          el.options[i].selected && optCb(el.options[i])
        }
      }
      break;
    }
  }

  // collect up all form elements found from the passed argument elements all
  // the way down to child elements; pass a '<form>' or form fields.
  // called with 'this'=callback to use for serial() on each element
  function eachFormElement() {
    var cb = this
      , e, i, j
      , serializeSubtags = function(e, tags) {
        for (var i = 0; i < tags.length; i++) {
          var fa = e[byTag](tags[i])
          for (j = 0; j < fa.length; j++) serial(fa[j], cb)
        }
      }

    for (i = 0; i < arguments.length; i++) {
      e = arguments[i]
      if (/input|select|textarea/i.test(e.tagName)) serial(e, cb)
      serializeSubtags(e, [ 'input', 'select', 'textarea' ])
    }
  }

  // standard query string style serialization
  function serializeQueryString() {
    return reqwest.toQueryString(reqwest.serializeArray.apply(null, arguments))
  }

  // { 'name': 'value', ... } style serialization
  function serializeHash() {
    var hash = {}
    eachFormElement.apply(function (name, value) {
      if (name in hash) {
        hash[name] && !isArray(hash[name]) && (hash[name] = [hash[name]])
        hash[name].push(value)
      } else hash[name] = value
    }, arguments)
    return hash
  }

  // [ { name: 'name', value: 'value' }, ... ] style serialization
  reqwest.serializeArray = function () {
    var arr = []
    eachFormElement.apply(function(name, value) {
      arr.push({name: name, value: value})
    }, arguments)
    return arr
  }

  reqwest.serialize = function () {
    if (arguments.length === 0) return ''
    var opt, fn
      , args = Array.prototype.slice.call(arguments, 0)

    opt = args.pop()
    opt && opt.nodeType && args.push(opt) && (opt = null)
    opt && (opt = opt.type)

    if (opt == 'map') fn = serializeHash
    else if (opt == 'array') fn = reqwest.serializeArray
    else fn = serializeQueryString

    return fn.apply(null, args)
  }

  reqwest.toQueryString = function (o) {
    var qs = '', i
      , enc = encodeURIComponent
      , push = function (k, v) {
          qs += enc(k) + '=' + enc(v) + '&'
        }

    if (isArray(o)) {
      for (i = 0; o && i < o.length; i++) push(o[i].name, o[i].value)
    } else {
      for (var k in o) {
        if (!Object.hasOwnProperty.call(o, k)) continue;
        var v = o[k]
        if (isArray(v)) {
          for (i = 0; i < v.length; i++) push(k, v[i])
        } else push(k, o[k])
      }
    }

    // spaces should be + according to spec
    return qs.replace(/&$/, '').replace(/%20/g,'+')
  }

  // jQuery and Zepto compatibility, differences can be remapped here so you can call
  // .ajax.compat(options, callback)
  reqwest.compat = function (o, fn) {
    if (o) {
      o.type && (o.method = o.type) && delete o.type
      o.dataType && (o.type = o.dataType)
      o.jsonpCallback && (o.jsonpCallbackName = o.jsonpCallback) && delete o.jsonpCallback
      o.jsonp && (o.jsonpCallback = o.jsonp)
    }
    return new Reqwest(o, fn)
  }

  reqwest.noConflict = function () {
    context.reqwest = old
    return this
  }

  return reqwest
})

});

/*
 * Sushi.ajax
 *
 */
 define('sushi.ajax',
 	// Module dependencies
 	[
 		'sushi.core',
 		'sushi.error',
 		'sushi.utils',
 		'vendors/reqwest'
 	],

 	/**
 	 * Sushi ajax
 	 *
 	 * @namespace Sushi
 	 * @class ajax
 	 */
 	function(Sushi, SushiError, utils, reqwest) {
        Sushi.namespace('ajax', Sushi);
        
        var ajax = function(options) {
        	// Convert to jquery-like API
        	options.method = options.type
        	options.type = options.dataType
        	
        	return reqwest(options);
        };
        
        Sushi.ajax = ajax;
        
        // Extend with facade API
        Sushi.extend(ajax, {       	
        	serialize: reqwest.serialize,
        	
        	serializeArray: reqwest.serializeArray,
        	
        	get: function(url, data, callback, dataType) {
        		if (!url) throw new SushiError('url is required');
        		
        		// Shift arguments if data is not present
        		if (utils.isFunction(data)) {
        			dataType = dataType || callback;
        			callback = data;
        			data = undefined;
        		}
        		
        		return Sushi.ajax({
        			url: url,
        			dataType: dataType,
        			data: data,
        			success: callback,
        			type: 'get'
        		});
        	},
        	
        	getJSON: function(url, data, callback) {
        		if (!url) throw new SushiError('url is required');
        		
        		// Shift arguments if data is not present
        		if (utils.isFunction(data)) {
        			callback = data;
        			data = undefined;
        		}
        		
        		return Sushi.ajax({
        			url: url,
        			dataType: 'json',
        			data: data,
        			success: callback,
        			type: 'get'
        		});
        	},
        	
        	getScript: function(url, data, callback) {
        		if (!url) throw new SushiError('url is required');
        		
        		// Shift arguments if data is not present
        		if (utils.isFunction(data)) {
        			callback = data;
        			data = undefined;
        		}
        		
        		return Sushi.ajax({
        			url: url,
        			type: 'js',
        			data: data,
        			success: callback,
        			type: 'get'
        		});
        	},
        	
        	post: function(url, data, callback, dataType) {
        		if (!url) throw new SushiError('url is required');
        		
        		// Shift arguments if data is not present
        		if (utils.isFunction(data)) {
        			dataType = dataType || callback;
        			callback = data;
        			data = undefined;
        		}
        		
        		return Sushi.ajax({
        			url: url,
        			dataType: dataType,
        			data: data,
        			success: callback,
        			type: 'post'
        		});
        	}
        });
        
        return ajax;
 	}
 );

/*
 * Sushi.stores.RemoteStore
 *
 */
 define('sushi.stores.RemoteStore',
 	// Module dependencies
 	[
 		'sushi.core',
 		'sushi.utils',
 		'sushi.Store',
 		'sushi.stores',
 		'sushi.utils.json',
 		'sushi.error',
 		'sushi.ajax'
 	],

 	/**
 	 * Sushi stores.RemoteStore
 	 *
 	 * @namespace Sushi
 	 * @class stores.RemoteStore
 	 */
 	function(Sushi, utils, Store, SushiStores, JSON, SushiError, AJAX) {        
        var RemoteStore
        , 	methodMap
        ,	getUrl = function(object) {
				if (!(object && object.url)) return null;
				return utils.isFunction(object.url) ? object.url() : object.url;
			}
		,	urlError = function() {
				throw new SushiError('A "url" property or function must be specified');
			}
        
        methodMap = {
			'create': 'POST',
			'update': 'PUT',
			'delete': 'DELETE',
			'read'  : 'GET'
		};
        
        RemoteStore = new Sushi.Class(Store, {
        	constructor: function(name) {
        		RemoteStore.Super.call(this, name || 'RemoteStore');
        	},
        	
        	emulateJSON: false,
        	
        	emulateHTTP: false
        });
        
        Sushi.extendClass(RemoteStore, {
        	sync: function(method, model, options) {
        		var type
        		,	params
        		;
        		
        		type = methodMap[method]
        		
        		// Default request options
        		params = Sushi.extend(options, {
					type: type,
					dataType: 'json'
				}, false);
				
				// Ensure there's a URL
				if (!params.url) {
					params.url = getUrl(model) || urlError();
				}
				
				// Ensure that we have the appropriate request data.
				if (!params.data && model && (method == 'create' || method == 'update')) {
				  	params.contentType = 'application/json';
				  	params.data = JSON.stringify(model.toJSON());
				}
				
				// For older servers, emulate JSON by encoding the request into an HTML-form.
				if (this.emulateJSON) {
				  	params.contentType = 'application/x-www-form-urlencoded';
				  	params.data        = params.data ? {model : params.data} : {};
				}
				
				if (this.emulateHTTP) {
				  	if (type === 'PUT' || type === 'DELETE') {
						if (this.emulateJSON) params.data._method = type;
							params.type = 'POST';
							params.beforeSend = function(xhr) {
							xhr.setRequestHeader('X-HTTP-Method-Override', type);
						};
				  	}
				}
				
				// Don't process data on a non-GET request.
				if (params.type !== 'GET' && ! this.emulateJSON) {
					params.processData = false;
				}
				
				AJAX(params);
			}
        });
        
        Sushi.extend(SushiStores, {RemoteStore: RemoteStore});
        
        // Automatically set a RemoteStore as the default Sushi Store
        SushiStores.def = new RemoteStore();
                
        return RemoteStore;
 	}
 );

define('sushi.utils.performance',
	['sushi.core', 'sushi.utils'],
	
	/**
	 * Performance utility functions
	 *
	 * @namespace Sushi
	 * @class utils
	 */
	function() {
		var utils = Sushi.namespace('utils'),
		
		/*
	     * Creates and returns a throttled version of the passed-in function. When invoked repeatedly, 
	     * the actual function will only be called once per every wait milliseconds.
	     *
	     * @method throttle
	     * @param func {Function} Function to throttle
	     * @param wait {Number} Wait time in milliseconds
	     *
	     * @return {Function} Throttled function
	     */
		throttle = function(func, wait) {
    		var context, args, timeout, throttling, more;
    		var whenDone = debounce(function(){ more = throttling = false; }, wait);
    		
    		return function() {
      			context = this; args = arguments;
      			var later = function() {
        			timeout = null;
        			if (more) func.apply(context, args);
        			whenDone();
      			};
      			
      			if (!timeout) timeout = setTimeout(later, wait);
      			if (throttling) {
        			more = true;
      			} else {
        			func.apply(context, args);
      			}
      			whenDone();
      			throttling = true;
    		};
  		},
  		
  		/*
	     * Creates and returns a debounced version of the passed-in function. 
	     * The actual function's execution will be postponed until after wait milliseconds have elapsed.
	     *
	     * @method debounce
	     * @param func {Function} Function to debounce
	     * @param wait {Number} Wait time in milliseconds
	     *
	     * @return {Function} Debounced function
	     */
  		debounce = function(func, wait) {
			var timeout;
			return function() {
		  		var context = this, args = arguments;
		  		var later = function() {
					timeout = null;
					func.apply(context, args);
		  		};
		  		clearTimeout(timeout);
		  		timeout = setTimeout(later, wait);
			};
	  	},
	  	
	  	/*
	     * Executes an array of functions one at a time,
	     * at predefined intervals
	     *
	     * @method multistep
	     * @param steps {Array} Array of tasks to perform
	     * @param args {Array} Array of arguments to feed each task
	     * @param callback {Function} Function to run when all tasks are done
	     * @param time {Number} Interval between each task
	     *
	     */
	  	multistep = function(steps, args, callback, time) {
			var tasks = steps.slice(0); //clone array
			
			time = time || 25;
			
			setTimeout(function() {
				var task;
				//execute next task
				task = tasks.shift();
				task.apply(null, args || []);
				
				//determine if there are more tasks
				if (tasks.length) {
					setTimeout(arguments.callee, time);
				} else {
					if (typeof callback == 'function') callback();
				}
			}, time);
		},
	  	
	  	_publicAPI = {
			throttle: throttle,
			debounce: debounce,
			multistep: multistep
		};		
		
		Sushi.extend(utils, _publicAPI);
		
		return _publicAPI;
	}
);
define('sushi.utils.performance.worker',
	['sushi.core', 'sushi.utils'],
	
	/**
	 * Web Worker shim
	 *
	 * @namespace Sushi
	 * @class utils
	 */
	function(core, utils) {
		var global = window,
		index = 0;
		
		if (!("Worker" in global)) {
			global.Worker = function(src){
				var publicAPI,
					worker,
					worker_idx = index++,
					queue = []
				;
	
				// set up the fake worker environment instance
				Worker["__"+worker_idx] = worker = {
					postMessage: function(msg) {
						var fn = function(){ publicAPI.onmessage(msg); };
						if (queue===false) setTimeout(fn,0);
						else queue.push(fn);
					},
					onmessage: function(){}
				};
	
				var xhr = (XMLHttpRequest ? new XMLHttpRequest() : global.ActiveXObject("Microsoft.XMLHTTP"));
				xhr.onreadystatechange = function() {
					if (xhr.readyState == 4) {
						var script_src = "(function(self,importScripts){\n" + xhr.responseText + "\n})(Worker['__"+worker_idx+"'],function(){});",
							script = document.createElement("script"), fn
						;
						script.text = script_src;
						(document.body || document.getElementsByTagName("body")[0]).appendChild(script);
	
						while (fn = queue.shift()) fn();
						queue = true;
					}
				};
				xhr.open("GET",src);
				xhr.send("");
	
				publicAPI = {
					postMessage: function(msg) {
						var fn = function(){ worker.onmessage(msg); };
						if (queue !== true) queue.push(fn);
						else setTimeout(fn,0);
					},
					onmessage: function(){},
					terminate: function(){}
				};
	
				return publicAPI;
			};
		}
		else {
			Worker = global.Worker;
		}
		
		Sushi.extend(utils, {
			Worker: Worker
		});
		
		return utils.Worker;		
	}
);
define("sushi.utils.performance.Worker", function(){});

/**
 * Sushi Date
 *
 * @module Sushi
 */
/*global Sushi:true, define:true*/
define('sushi.date',
    [
    	'sushi.core'
    ],
    
	/**
	 * Sushi Date - Date Handling functions
	 *
	 * @namespace Sushi
	 * @class date
	 */
    function(Sushi) {
    	Sushi.namespace('date');
    	
    	var ext = {},
    		locale = "en-GB";
    	
		ext.util = {};
		ext.util.xPad = function (x, pad, r) {
			if (typeof (r) == "undefined") {
				r = 10
			}
			for (; parseInt(x, 10) < r && r > 1; r /= 10) {
				x = pad.toString() + x
			}
			return x.toString()
		};
		
		if (document.getElementsByTagName("html") && document.getElementsByTagName("html")[0].lang) {
			locale = document.getElementsByTagName("html")[0].lang
		}
		
		ext.locales = {};
		ext.locales.en = {
			a: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
			A: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
			b: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
			B: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
			c: "%a %d %b %Y %T %Z",
			p: ["AM", "PM"],
			P: ["am", "pm"],
			x: "%d/%m/%y",
			X: "%T"
		};
		ext.locales["en-US"] = ext.locales.en;
		ext.locales["en-US"].c = "%a %d %b %Y %r %Z";
		ext.locales["en-US"].x = "%D";
		ext.locales["en-US"].X = "%r";
		ext.locales["en-GB"] = ext.locales.en;
		ext.locales["en-AU"] = ext.locales["en-GB"];
		ext.formats = {
			a: function (d) {
				return ext.locales[d.locale].a[d.getDay()]
			},
			A: function (d) {
				return ext.locales[d.locale].A[d.getDay()]
			},
			b: function (d) {
				return ext.locales[d.locale].b[d.getMonth()]
			},
			B: function (d) {
				return ext.locales[d.locale].B[d.getMonth()]
			},
			c: "toLocaleString",
			C: function (d) {
				return ext.util.xPad(parseInt(d.getFullYear() / 100, 10), 0)
			},
			d: ["getDate", "0"],
			e: ["getDate", " "],
			g: function (d) {
				return ext.util.xPad(parseInt(ext.util.G(d) / 100, 10), 0)
			},
			G: function (d) {
				var y = d.getFullYear();
				var V = parseInt(ext.formats.V(d), 10);
				var W = parseInt(ext.formats.W(d), 10);
				if (W > V) {
					y++
				} else {
					if (W === 0 && V >= 52) {
						y--
					}
				}
				return y
			},
			H: ["getHours", "0"],
			I: function (d) {
				var I = d.getHours() % 12;
				return ext.util.xPad(I === 0 ? 12 : I, 0)
			},
			j: function (d) {
				var ms = d - new Date("" + d.getFullYear() + "/1/1 GMT");
				ms += d.getTimezoneOffset() * 60000;
				var doy = parseInt(ms / 60000 / 60 / 24, 10) + 1;
				return ext.util.xPad(doy, 0, 100)
			},
			m: function (d) {
				return ext.util.xPad(d.getMonth() + 1, 0)
			},
			M: ["getMinutes", "0"],
			p: function (d) {
				return ext.locales[d.locale].p[d.getHours() >= 12 ? 1 : 0]
			},
			P: function (d) {
				return ext.locales[d.locale].P[d.getHours() >= 12 ? 1 : 0]
			},
			S: ["getSeconds", "0"],
			u: function (d) {
				var dow = d.getDay();
				return dow === 0 ? 7 : dow
			},
			U: function (d) {
				var doy = parseInt(ext.formats.j(d), 10);
				var rdow = 6 - d.getDay();
				var woy = parseInt((doy + rdow) / 7, 10);
				return ext.util.xPad(woy, 0)
			},
			V: function (d) {
				var woy = parseInt(ext.formats.W(d), 10);
				var dow1_1 = (new Date("" + d.getFullYear() + "/1/1")).getDay();
				var idow = woy + (dow1_1 > 4 || dow1_1 <= 1 ? 0 : 1);
				if (idow == 53 && (new Date("" + d.getFullYear() + "/12/31")).getDay() < 4) {
					idow = 1
				} else {
					if (idow === 0) {
						idow = ext.formats.V(new Date("" + (d.getFullYear() - 1) + "/12/31"))
					}
				}
				return ext.util.xPad(idow, 0)
			},
			w: "getDay",
			W: function (d) {
				var doy = parseInt(ext.formats.j(d), 10);
				var rdow = 7 - ext.formats.u(d);
				var woy = parseInt((doy + rdow) / 7, 10);
				return ext.util.xPad(woy, 0, 10)
			},
			y: function (d) {
				return ext.util.xPad(d.getFullYear() % 100, 0)
			},
			Y: "getFullYear",
			z: function (d) {
				var o = d.getTimezoneOffset();
				var H = ext.util.xPad(parseInt(Math.abs(o / 60), 10), 0);
				var M = ext.util.xPad(o % 60, 0);
				return (o > 0 ? "-" : "+") + H + M
			},
			Z: function (d) {
				return d.toString().replace(/^.*\(([^)]+)\)$/, "$1")
			},
			"%": function (d) {
				return "%"
			}
		};
		ext.aggregates = {
			c: "locale",
			D: "%m/%d/%y",
			h: "%b",
			n: "\n",
			r: "%I:%M:%S %p",
			R: "%H:%M",
			t: "\t",
			T: "%H:%M:%S",
			x: "locale",
			X: "locale"
		};
		ext.aggregates.z = ext.formats.z(new Date());
		ext.aggregates.Z = ext.formats.Z(new Date());
		ext.unsupported = {};
		
		
		var toRelativeTime = (function() {
		
			var _ = function(date, options) {
				var opts = processOptions(options),
					now = opts.now || new Date(),
					delta = now - date,
					future = (delta <= 0),
					units = null;
				
				delta = Math.abs(delta);
				
				// special cases controlled by options
				if (delta <= opts.nowThreshold) {
					return future ? {time: 'Right now'} : {time: 'Just now'};
				}
				if (opts.smartDays && delta <= 6 * MS_IN_DAY) {
					return toSmartDays(this, now);
				}
				
				for (var key in CONVERSIONS) {
					if (delta < CONVERSIONS[key])
						break;
					units = key; // keeps track of the selected key over the iteration
					delta = delta / CONVERSIONS[key];
				}
				
				// pluralize a unit when the difference is greater than 1.
				delta = Math.floor(delta);
				var plural = (delta !== 1);
				return {
					delta: delta,
					units: units,
					future: future,
					plural: plural
				}
			};
		
			var processOptions = function(arg) {
				if (!arg) arg = 0;
				if (typeof arg === 'string') {
			  		arg = parseInt(arg, 10);
				}
				if (typeof arg === 'number') {
			  		if (isNaN(arg)) arg = 0;
			  		return {nowThreshold: arg};
				}
				return arg;
		  	};
		
		  	var toSmartDays = function(date, now) {
				var day;
				var weekday = date.getDay(),
				dayDiff = weekday - now.getDay();
				if (dayDiff == 0)       day = 'Today';
				else if (dayDiff == -1) day = 'Yesterday';
				else if (dayDiff == 1)  day = 'Tomorrow';
				else                    day = WEEKDAYS[weekday];
				//return day + " at " + date.toLocaleTimeString();
				return {
					day: day,
					date: date.toLocaleTimeString()
				}
		  	};
		
		 	var CONVERSIONS = {
				millisecond: 1, // ms    -> ms
				second: 1000,   // ms    -> sec
				minute: 60,     // sec   -> min
				hour:   60,     // min   -> hour
				day:    24,     // hour  -> day
				month:  30,     // day   -> month (roughly)
				year:   12      // month -> year
		  	};
		  	var MS_IN_DAY = (CONVERSIONS.millisecond * CONVERSIONS.second * CONVERSIONS.minute * CONVERSIONS.hour * CONVERSIONS.day);
		
		  	var WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
		
		  	return _;
		
		})();
		
		
		
		/*
		 * Wraps up a common pattern used with this plugin whereby you take a String
		 * representation of a Date, and want back a date object.
		 */
		var fromString = function(str) {
			return new Date(Date.parse(str));
		};
		
		Sushi.extend(Sushi.date, {
			fromString: fromString,
			
			toRelativeTime: toRelativeTime,
			
			strftime: function (d, fmt) {
				if (!(locale in ext.locales)) {
					if (locale.replace(/-[a-zA-Z]+$/, "") in ext.locales) {
						locale = locale.replace(/-[a-zA-Z]+$/, "")
					} else {
						locale = "en-GB"
					}
				}
				while (fmt.match(/%[cDhnrRtTxXzZ]/)) {
					fmt = fmt.replace(/%([cDhnrRtTxXzZ])/g, function (m0, m1) {
						var f = ext.aggregates[m1];
						return (f == "locale" ? ext.locales[d.locale][m1] : f)
					})
				}
				var str = fmt.replace(/%([aAbBCdegGHIjmMpPSuUVwWyY%])/g, function (m0, m1) {
					var f = ext.formats[m1];
					if (typeof (f) == "string") {
						return d[f]()
					} else {
						if (typeof (f) == "function") {
							return f.call(d, d)
						} else {
							if (typeof (f) == "object" && typeof (f[0]) == "string") {
								return ext.util.xPad(d[f[0]](), f[1])
							} else {
								return m1
							}
						}
					}
				});
				d = null;
				return str
			},
			
			setLocale: function(newLocale) {
				if (newLocale in ext.locales) locale = newLocale;
			}
		});
		
		return Sushi.date;
    }
);

/**
 * Sushi JS
 * Copyright (C) 2011 Bruno Abrantes
 * MIT Licensed
 *
 * @namespace Sushi
 * @class base
 */
// require Sushi modules in requirejs format
require([
	'sushi.core', 
	'sushi.utils', 
	'sushi.utils.collection', 
	'sushi.utils.debug', 
	'sushi.utils.json',
	'sushi.utils.url',
	'sushi.mvc.model',
	'sushi.mvc.view',
	'sushi.mvc.collection',
	'sushi.mvc.router',
	'sushi.template',
	'sushi.$',
	'sushi.event',
	'sushi.error',
	'sushi.enumerable',
	'sushi.stores.LocalStore',
	'sushi.stores.RemoteStore',
	'sushi.ajax',
	'sushi.utils.performance',
	'sushi.utils.performance.Worker',
	'sushi.date'
	], 
	function(){
});
define("sushi.base", function(){});
}());