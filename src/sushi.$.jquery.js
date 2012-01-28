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
    function($) {
    	Sushi.namespace('$');
    	Sushi.$ = require('jquery');
    	jQuery.noConflict();
    	
    	return Sushi.$;
    }
);
