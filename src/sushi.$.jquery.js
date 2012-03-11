/**
 * Sushi $
 *
 * @module Sushi
 */
/*global Sushi:true, define:true*/
define('sushi.$.jquery',
    [
    	'sushi.core',
    	'vendors/jquery'
    ],
    
	/**
	 * Sushi $
	 *
	 * @namespace Sushi
	 * @class $
	 */
    function(Sushi) {
	    //Sugars
    	Sushi.fn = jQuery;
    	jQuery.noConflict();
    	
    	return jQuery;
    }
);
