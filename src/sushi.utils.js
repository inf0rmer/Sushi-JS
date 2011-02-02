/*
 * Sushi.utils - General purpose utility functions for the Sushi JS framework
 *
 */
define(
	// Module dependencies
	[],
	
	/**
	 * General purpose utility functions for the Sushi JS framework
	 *
	 * @namespace Sushi
	 * @class utils
	 */
	function() {
		var _utilsNs = Sushi.namespace('utils'),
		    _ArrayProto = Array.prototype,
		    _nativeIsArray = _ArrayProto.isArray,
		    _nativeKeys = Object.keys;

		// Generic utility methods
		Sushi.extend(Sushi.utils, {
		    _idCounter: 0,
			/**
		     * Generates a unique integer ID (within the client session)
		     *
		     * @method uniqueId
		     * @param prefix Optional prefix to prepend to the unique ID
		     *
		     * @return Unique ID
		     */
			uniqueId: function(prefix) {
				var id = this._idCounter++;
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
			
			// Utility object methods
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
			range: function(start, stop, step) {
                var args  = Array.prototype.slice.call(arguments),
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
            
            /**
		     * Retrieve the names of an object's properties.
		     * Defaults to ECMAScript 5's native Object.keys. Lifted from Underscore JS.
		     *
		     * @method keys
		     * @param obj Object to retrieve keys from
		     *
		     * @return Array containing the object's key names.
		     */
			keys: function(obj) {
			    if (_nativeKeys) {
			        return _nativeKeys(obj);
			    }
			    
                if (this.isArray(obj)) {
                    return this.range(0, obj.length);
                }
                
                var keys = [];                
                for (var key in obj) {
                    if (hasOwnProperty.call(obj, key)) {
                        keys[keys.length] = key;
                    }
                }                
                return keys;
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
			}
		});
	}
);