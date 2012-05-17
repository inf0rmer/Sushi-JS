/*
 * Sushi.Enumerable
 *
 */
 define('sushi.enumerable',
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
        
        function Enumerable(value) {
        	Sushi.extend(value, Enumerable.prototype);
        	return value;
        };
        
        Enumerable.prototype = {
        	Constructor: Enumerable
        }
        
        var	methods = ['each', 'map', 'reduce', 'reduceRight', 'find', 'detect', 'remove',
			'filter', 'select', 'reject', 'every', 'all', 'some', 'any', 'include',
			'contains', 'invoke', 'max', 'min', 'sortBy', 'sortedIndex', 'toArray', 'size',
			'first', 'rest', 'last', 'without', 'indexOf', 'lastIndexOf', 'isEmpty', 'groupBy'];
			
		collection.each(methods, function(method) {
			Enumerable.prototype[method] = function() {
				return new Enumerable(collection[method].apply(Sushi, [this].concat(collection.toArray(arguments))));
			};
	  	});
	  	
	  	Sushi.Enumerable = Enumerable;
        return Enumerable;
 	}
 );
