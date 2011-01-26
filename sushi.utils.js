/*
 * Sushi.utils - General purpose utility functions for the Sushi JS framework
 *
 * @namespace Sushi
 * @class utils
 */
define(
	// Module dependencies
	['sushi.utils.debug'],
	
	function(debug) {
		Sushi.namespace('utils');
				
		// Extend Sushi.utils with the temporary debug object
		Sushi.extend(Sushi.utils, debug);
	}
);