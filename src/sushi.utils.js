/*
 * Sushi.utils - General purpose utility functions for the Sushi JS framework
 *
 */
define('sushi.utils',
	// Module dependencies
	['sushi.core'],
	
	/**
	 * General purpose utility functions for the Sushi JS framework
	 *
	 * @namespace Sushi
	 * @class utils
	 */
	function() {
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
			isEqual: function(a, b) {
				// Check object identity.
				if (a === b) { return true; }
				
			    // Different types?
			    var atype = typeof(a), 
			    btype = typeof(b);
			    if (atype != btype) { return false; }
			    
			    // Basic equality test (watch out for coercions).
			    if (a == b) { return true; }
			    
			    // One is falsy and the other truthy.
			    if ((!a && b) || (a && !b)) { return false; }
			    
			    // One of them implements an isEqual()?
			    if (a.isEqual) { return a.isEqual(b); }
			    
			    // Check dates' integer values.
			    if (this.isDate(a) && this.isDate(b)) { return ( a.getTime() === b.getTime() ); }
			    
			    // Both are NaN?
			    if (this.isNaN(a) && this.isNaN(b)) { return false; }
			    
			    // Compare regular expressions.
			    if (this.isRegExp(a) && this.isRegExp(b)) {
			      return a.source     === b.source &&
			             a.global     === b.global &&
			             a.ignoreCase === b.ignoreCase &&
			             a.multiline  === b.multiline;
			    }
			    
			    // If a is not an object by this point, we can't handle it.
			    if (atype !== 'object') { return false; }
			    
			    // Check for different array lengths before comparing contents.
			    if (a.length && (a.length !== b.length)) { return false; }
			    
			    // Nothing else worked, deep compare the contents.
			    var aKeys = this.keys(a), bKeys = this.keys(b);
			    // Different object sizes?
			    if (aKeys.length != bKeys.length) { return false; }
			    // Recursive comparison of contents.
			    for (var key in a) {
			        if (!(key in b) || !this.isEqual(a[key], b[key])) { return false; }
			    }
			    return true;
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