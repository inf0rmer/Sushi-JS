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
			langNs = Sushi.namespace('utils.lang');
			
		
	    /**
	     * Detects whether a value is a number
	     *
	     * @method isNumber
	     * @param number Value to test
	     * 
	     * @return {Boolean} Whether value is a number or not.
	     */
	    utilsNs.isNumber = function(number) {
	        return (typeof number == "number");
	    };
	    
	    /**
	     * Default iterator object
	     *
	     * @method identity
	     * @param value Value to test
	     *
	     * @return Value passed in to the function
	     */
	    utilsNs.identity = function(value) {
	        return value;
	    };	
	    
		Sushi.extend(Sushi.utils.debug, debug);
		Sushi.extend(Sushi.utils.json, json);
		Sushi.extend(Sushi.utils.collection, collection);
		Sushi.extend(Sushi.utils.lang, lang);
	}
);