/*
 * Sushi.ajax
 *
 */
 define('sushi.ajax',
 	// Module dependencies
 	[
 		'sushi.core',
 		'vendors/reqwest'
 	],

 	/**
 	 * Sushi ajax
 	 *
 	 * @namespace Sushi
 	 * @class ajax
 	 */
 	function(Sushi, reqwest) {
        Sushi.namespace('ajax', Sushi);
        
        Sushi.ajax = reqwest;
        
        // Alias to Sushi.$.ajax
        if (Sushi.$ && !Sushi.$.ajax) Sushi.$.ajax = reqwest;
        
        return reqwest;
 	}
 );
