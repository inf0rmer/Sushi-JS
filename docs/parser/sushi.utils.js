/*
 * Sushi.utils - General purpose utility functions for the Sushi JS framework
 *
 */
define(
	// Module dependencies
	['sushi.utils.debug', 'sushi.utils.json'],
	
	/**
	 * Sushi Utils
	 *
	 * @namespace Sushi
	 * @class utils
	 */
	function(debug, json) {
		var utilsNs = Sushi.namespace('utils'),
			debugNs = Sushi.namespace('utils.debug'),
			jsonNS = Sushi.namespace('utils.json');
		
		Sushi.extend(Sushi.utils.debug, debug);
		Sushi.extend(Sushi.utils.json, json);
	}
);