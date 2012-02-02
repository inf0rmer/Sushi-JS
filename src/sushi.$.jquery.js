/**
 * Sushi $
 *
 * @module Sushi
 */
/*global Sushi:true, define:true*/
define('sushi.$.jquery',
    [
    	'vendors/jquery'
    ],
    
	/**
	 * Sushi $
	 *
	 * @namespace Sushi
	 * @class $
	 */
    function(jQuery) {
	    //Sugars
    	Sushi.fn = $;
    	jQuery.noConflict();
    	
    	return jQuery;
    }
);
