define(
	['sushi.core', 'sushi.utils'],
	
	/**
     * Sushi Collection
     */
     
	function() {
	    var _collection = this,
	    _ArrayProto = Array.prototype,
		_nativeKeys = Object.keys,
	    _nativeForEach = _ArrayProto.forEach,
		_nativeFilter = _ArrayProto.filter,
		_nativeReduce = _ArrayProto.reduce,
		_nativeReduceRight = _ArrayProto.reduceRight,
		_nativeMap = _ArrayProto.map,
		_nativeIndexOf = _ArrayProto.indexOf,
		_nativeSome = _ArrayProto.some,
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
            return map(obj, Sushi.utils.identity);
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
            if (Sushi.utils.isArray(iterable)) {     return iterable; }
            if (Sushi.utils.isArguments(iterable)) { return _slice.call(iterable); }
            
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
            } else if (Sushi.utils.isNumber(obj.length)) {
                for (var i = 0, l = obj.length; i < l; i++) {
                    if (iterator.call(context, obj[i], i, obj) === _breaker) { return; }
                }
            } else {
                for (var key in obj) {
                    if (hasOwnProperty.call(obj, key)) {
                        if (iterator.call(context, obj[key], key, obj) === _breaker) { return; }
                    }
                }
            }
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
                if (found = value === needle) { return true; }
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
		 * @param memo Object to use as the first argument to the first call of the callback.
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
		        throw new TypeError("Reduce of empty array with no initial value");
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
            
            var reversed = (Sushi.utils.isArray(obj) ? obj.slice() : _collection.toArray(obj)).reverse();
           
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
		 * Convenience method for Sushi.utils.map to get a property from an object.
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
		    iterator = iterator || Sushi.utils.identity;
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
		
		every = function() {
		    //TODO: Add every logic
		},
		
		// Cake Set::extract
		extract = function() {
		    //TODO: Add extract logic
		},
		
		remove = function(array, value) {
			if (!Sushi.utils.isArray(array)) return false;
			
			var from = array.indexOf(value),
				to = from;
			
			var rest = array.slice((to || from) + 1 || array.length);
			array.length = from < 0 ? array.length + from : from;
			return array.push.apply(array, rest);
		};
        
        Sushi.extend(Sushi.utils, {
            values: values,
			keys: keys,
            toArray: toArray,
            each: each,
			contains: contains,
			reduce: reduce,
			reduceRight: reduceRight,
			map: map,
			filter: filter,
			some: some,
			pluck: pluck,
			removeFromArray: remove
        });
	}
);
