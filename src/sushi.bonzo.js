/*
 * Sushi.bonzo - DOM utility
 *
 */
 define('sushi.bonzo',
 	// Module dependencies
 	[
 		'vendors/bonzo'
    ],

 	/**
 	 * Sushi Bonzo
 	 *
 	 * @namespace Sushi
 	 * @class bonzo
 	 */
 	function(bonzo) {
 		Sushi.namespace('bonzo');
 		Sushi.bonzo = bonzo;
 		
 		return bonzo;
 	}
 );