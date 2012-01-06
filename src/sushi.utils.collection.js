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
                return Sushi.utils.range(0, obj.length);
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
		 * Bind all of an object's methods to that object. Useful for ensuring that all callbacks defined on an object belong to it.
		 *
		 * @method bindAll
		 * @param {Object} obj
		 *
		 * @return {Object}
		 */
		bindAll = function(obj) {
			var funcs = _slice.call(arguments, 1);
			if (funcs.length == 0) funcs = Sushi.utils.functions(obj);
			Sushi.utils.each(funcs, function(f) { obj[f] = Sushi.utils.bind(obj[f], obj); });
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
				if (Sushi.utils.isFunction(obj[key])) names.push(key);
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
		
		remove = function(array, value) {
			if (!Sushi.utils.isArray(array)) return false;
			
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
		 * @param {Array} obj Array to shuffle
		 *
		 * @return {Array} Shuffled array
		 *
		 */
		shuffle = function(obj) {
		    var shuffled = [], rand;
		    each(obj, function(value, index, list) {
		      if (index == 0) {
		        shuffled[0] = value;
		      } else {
		        rand = Math.floor(Math.random() * (index + 1));
		        shuffled[index] = shuffled[rand];
		        shuffled[rand] = value;
		      }
		    });
		    return shuffled;  
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
    		if (!Sushi.utils.isObject(obj)) return obj;
    		return Sushi.utils.isArray(obj) ? obj.slice() : Sushi.extend({}, obj);
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
			any(obj, function(value, index, list) {
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
			  	return (Sushi.utils.isFunction(method) ? method || value : value[method]).apply(value, args);
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
			if (!iterator && Sushi.utils.isArray(obj)) return Math.max.apply(Math, obj);
			if (!iterator && Sushi.utils.isEmpty(obj)) return -Infinity;
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
			var iterator = Sushi.utils.isFunction(val) ? val : function(obj) { return obj[val]; };
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
				if (Sushi.utils.isArray(value)) return memo.concat(shallow ? value : flatten(value));
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
		};
        
        Sushi.extend(Sushi.utils, {
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
			removeFromArray: remove,
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
        });
	}
);
