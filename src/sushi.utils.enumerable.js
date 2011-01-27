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
            if (obj == null) return;
            
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
        };
        
        return {
            each: each
        };
	}
);