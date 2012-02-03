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