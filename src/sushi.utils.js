/*
 * Sushi.utils - General purpose utility functions for the Sushi JS framework
 *
 */
define(
	// Module dependencies
	['sushi.utils.debug', 'sushi.utils.json', 'sushi.utils.collection', 'sushi.utils.lang'],
	
	/**
	 * Sushi Utils
	 *
	 * @namespace Sushi
	 * @class utils
	 */
	function(debug, json, collection, lang) {
		var utilsNs = Sushi.namespace('utils'),
			debugNs = Sushi.namespace('utils.debug'),
			jsonNs = Sushi.namespace('utils.json'),
			collectionNs = Sushi.namespace('utils.collection'),
			langNs = Sushi.namespace('utils.lang'),
			_ArrayProto = Array.prototype,
			_nativeIsArray = _ArrayProto.isArray,
			idCounter = 0;
			
		
		
		// Generic utility methods
		Sushi.extend(utilsNs, {
			/**
		     * Generates a unique integer ID (within the client session)
		     *
		     * @method uniqueId
		     * @param prefix Optional prefix to prepend to the unique ID
		     *
		     * @return Unique ID
		     */
			uniqueId = function(prefix) {
				var id = idCounter++;
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
			identity = function(value) {
				return value
			}
		});	
		
		// Utility "is" methods. Lifted from Underscore.js
		Sushi.extend(utilsNs, {
			/**
			 * Checks if an object is empty
			 *
			 * @method isEmpty
			 * @param obj Object to test
			 *
			 * @return {Boolean} Whether argument is empty or not
			 */
			isEmpty = function(obj) {
				if (_.isArray(obj) || _.isString(obj)) { return obj.length === 0 };
				
				for (var key in obj) {
					if (hasOwnProperty.call(obj, key)) { return false };
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
			isElement = function(obj) {
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
			isFunction = function(obj) {
				return !!(obj && obj.constructor && obj.call && obj.apply);
			},

			// Is a given value a string?
			isString = function(obj) {
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
			isNumber = function(number) {
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
			isArray = function(array) {
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
			isArguments = function(obj) {
	            return !!(obj && hasOwnProperty.call(obj, 'callee'));
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
			isEqual = function(a, b) {
				// Check object identity.
				if (a === b) return true;
			    // Different types?
			    var atype = typeof(a), btype = typeof(b);
			    if (atype != btype) return false;
			    // Basic equality test (watch out for coercions).
			    if (a == b) return true;
			    // One is falsy and the other truthy.
			    if ((!a && b) || (a && !b)) return false;
			    // Unwrap any wrapped objects.
			    if (a._chain) a = a._wrapped;
			    if (b._chain) b = b._wrapped;
			    // One of them implements an isEqual()?
			    if (a.isEqual) return a.isEqual(b);
			    // Check dates' integer values.
			    if (_.isDate(a) && _.isDate(b)) return a.getTime() === b.getTime();
			    // Both are NaN?
			    if (_.isNaN(a) && _.isNaN(b)) return false;
			    // Compare regular expressions.
			    if (_.isRegExp(a) && _.isRegExp(b))
			      return a.source     === b.source &&
			             a.global     === b.global &&
			             a.ignoreCase === b.ignoreCase &&
			             a.multiline  === b.multiline;
			    // If a is not an object by this point, we can't handle it.
			    if (atype !== 'object') return false;
			    // Check for different array lengths before comparing contents.
			    if (a.length && (a.length !== b.length)) return false;
			    // Nothing else worked, deep compare the contents.
			    var aKeys = _.keys(a), bKeys = _.keys(b);
			    // Different object sizes?
			    if (aKeys.length != bKeys.length) return false;
			    // Recursive comparison of contents.
			    for (var key in a) if (!(key in b) || !_.isEqual(a[key], b[key])) return false;
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
			isNaN = function(obj) {
				return obj !== obj;
			},
			
			/**
			 * Checks if an object is a Regular Expression
			 *
			 * @method isRegExp
			 * @param obj Object to test
			 *
			 * @return {Boolean} Whether argument is a RegExp or not
			 */
			isRegExp = function(obj) {
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
			isNull = function(obj) {
				return obj === null;
			};

			/**
			 * Checks if an object is equal to undefined
			 *
			 * @method isUndefined
			 * @param obj Object to test
			 *
			 * @return {Boolean} Whether argument is equal to undefined or not
			 */
			isUndefined = function(obj) {
				return obj === void 0;
			};
		});
	    
		Sushi.extend(Sushi.utils.debug, debug);
		Sushi.extend(Sushi.utils.json, json);
		Sushi.extend(Sushi.utils.collection, collection);
		Sushi.extend(Sushi.utils.lang, lang);
		
		//Shortcuts
		Sushi.each = Sushi.utils.collection.each;
	}
);