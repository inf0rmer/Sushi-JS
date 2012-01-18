/*
 * Sushi.qwery - CSS3 querySelectorAll utility
 *
 */
 define('sushi.qwery'
 	// Module dependencies
 	[
 		'vendors/qwery'
    ],

 	/**
 	 * Sushi Qwery
 	 *
 	 * @namespace Sushi
 	 * @class qwery
 	 */
 	function(qwery) {
 		Sushi.namespace('qwery');
 		Sushi.qwery = qwery;
 	}
 );