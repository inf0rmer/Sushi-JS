/*
 * Sushi.qwery - CSS3 querySelectorAll
 *
 */
 define('sushi.qwery',
 	// Module dependencies
 	[
 		'vendors/qwery'
    ],

 	/**
 	 * Sushi qwery
 	 *
 	 * @namespace Sushi
 	 * @class qwery
 	 */
 	function(qwery) {
 		Sushi.namespace('qwery');
 		Sushi.qwery = qwery;
 		
 		return qwery;
 	}
 );