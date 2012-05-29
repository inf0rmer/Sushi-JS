/*
 * Sushi.mvc
 *
 */
 define('sushi.mvc',
 	// Module dependencies
 	[
 		'sushi.core',
 		'sushi.mvc.model',
 		'sushi.mvc.view',
 		'sushi.mvc.collection',
 		'sushi.mvc.router',
 		'sushi.mvc.view.bindings'
 	],

 	/**
 	 * Sushi mvc
 	 *
 	 * @namespace Sushi
 	 * @class mvc
 	 */
 	function(Sushi, Model, View, Collection, Router) {
        
        var mvc = {
        	Model: Model,
        	View: View,
        	Collection: Collection,
        	Router: Router
        }
        
        return mvc;
 	}
 );
