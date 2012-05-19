/*
 * Sushi.morpheus - DOM animator
 *
 */
 define('sushi.morpheus',
 	// Module dependencies
 	[
 		'vendors/morpheus'
    ],

 	/**
 	 * Sushi Morpheus
 	 *
 	 * @namespace Sushi
 	 * @class morpheus
 	 */
 	function(morpheus) {
 		Sushi.namespace('morpheus');
 		Sushi.morpheus = morpheus;
 		
 		return morpheus;
 	}
 );