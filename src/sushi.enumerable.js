/*
 * Sushi.Enumerable
 *
 */
 define('Sushi.Enumerable',
 	// Module dependencies
 	[
 		'sushi.core',
 		'sushi.utils.collection'
 	],

 	/**
 	 * Sushi Enumerable
 	 *
 	 * @namespace Sushi
 	 * @class Enumerable
 	 */
 	function(Sushi, collection) {
        Sushi.namespace('Enumerable', Sushi);
        
        var Enumerable = new Sushi.Class({
        	constructor: function(value) {
        		this._val = value;
        	},
        	
        	_val: null,
        	
        	get: function() {
        		return this._val;
        	}
        })
        , 	methods = ['each', 'map', 'reduce', 'reduceRight', 'find', 'detect',
			'filter', 'select', 'reject', 'every', 'all', 'some', 'any', 'include',
			'contains', 'invoke', 'max', 'min', 'sortBy', 'sortedIndex', 'toArray', 'size',
			'first', 'rest', 'last', 'without', 'indexOf', 'lastIndexOf', 'isEmpty', 'groupBy'];
			
		collection.each(methods, function(method) {
			Enumerable.prototype[method] = function() {
				return collection[method].apply(Sushi, [this._val].concat(collection.toArray(arguments)));
			};
	  	});
	  	
	  	Sushi.Enumerable = Enumerable;        
        return Enumerable;
 	}
 );
