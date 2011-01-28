define(
	[],
	
	/**
	 * Sushi Enumerable
	 *
	 * @namespace Sushi.utils
	 * @class enumerable
	 */
	function() {
	    var _enumerable = this,
	    _ArrayProto = Array.prototype,
	    _nativeForEach = _ArrayProto.forEach,
		_nativeFilter = _ArrayProto.filter,
		_nativeReduce = _ArrayProto.reduce,
		_nativeReduceRight = _ArrayProto.reduceRight,
		_nativeMap = _ArrayProto.map
	    _breaker = {},
	    
	    /**
    	 * Cornerstone each (forEach) implementation.
    	 * Handles objects implementing forEach, arrays, and raw objects. 
    	 * Delegates to ECMAScript 5's native forEach if available.
    	 * Based on the Underscore JS implementation.
    	 *
    	 * @namespace Sushi
    	 * @class utils
    	 */
	    each = function(obj, iterator, context) {
            var value;
            if (obj === null) return;
            
            if (_nativeForEach && obj.forEach === _nativeForEach) {
                obj.forEach(iterator, context);
            } else if (Sushi.utils.isNumber(obj.length)) {
                for (var i = 0, l = obj.length; i < l; i++) {
                    if (iterator.call(context, obj[i], i, obj) === _breaker) return;
                }
            } else {
                for (var key in obj) {
                    if (hasOwnProperty.call(obj, key)) {
                        if (iterator.call(context, obj[key], key, obj) === _breaker) return;
                    }
                }
            }
        },

		filter = function(obj, callback) {
			
		},
		
		reduce = function(obj, iterator, memo, context) {
			var initial = memo !== void 0;
			
			if (obj == null) obj = [];
			
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
		
		    if (!initial) throw new TypeError("Reduce of empty array with no initial value");
		
		    return memo;
		},
		
		reduceRight = function() {
			
		},
		
		map = function(obj, iterator, context) {
			var results = [];
			
			if (obj == null) return results;
			
			// Delegate to ECMAScript 5 native map()
		    if (_nativeMap && obj.map === _nativeMap) return obj.map(iterator, context);
			
		    each(obj, function(value, index, list) {
		      results[results.length] = iterator.call(context, value, index, list);
		    });
		
		    return results;
		}
        
        return {
            each: each,
			filter: filter,
			reduce: reduce,
			reduceRight: reduceRight
			map: map
        };
	}
);