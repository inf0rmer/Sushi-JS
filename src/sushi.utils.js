/*
 * Sushi.utils - General purpose utility functions for the Sushi JS framework
 *
 */
define(
	// Module dependencies
	['sushi.utils.debug', 'sushi.utils.json', 'sushi.utils.enumerable'],
	
	/**
	 * Sushi Utils
	 *
	 * @namespace Sushi
	 * @class utils
	 */
	function(debug, json, enumerable) {
		var utilsNs = Sushi.namespace('utils'),
			debugNs = Sushi.namespace('utils.debug'),
			jsonNs = Sushi.namespace('utils.json'),
			enumerableNs = Sushi.namespace('utils.enumerable');
			
		
		var utils = {
		    /*
		     *
		     * @method isNumber
		     * @param Value to test
		     * 
		     * @return {Boolean} Whether value is a number or not.
		     */
		    isNumber: function(number) {
		        return (typeof number == "number");
		    }
		};
		
		Sushi.extend(Sushi.utils, utils);
					
		Sushi.extend(Sushi.utils.debug, debug);
		Sushi.extend(Sushi.utils.json, json);
		Sushi.extend(Sushi.utils.enumerable, enumerable);
	}
);