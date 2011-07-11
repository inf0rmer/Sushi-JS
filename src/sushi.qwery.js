/*
 * Sushi.qwery - CSS-style querying
 *
 */
 define(
 	// Module dependencies
 	[
        'sushi.core',
        '../plugins/qwery.min'
    ],

 	/**
 	 * Sushi Qwery
 	 *
 	 * @namespace Sushi
 	 * @class qwery
 	 */
 	function() {
        Sushi.namespace('qwery');
        
 		Sushi.extend(Sushi.qwery, (function() {
        	Sushi.q = window.qwery;
        })());
 	}
 );