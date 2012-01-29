/*
 * Sushi.Store
 *
 */
 define('sushi.Store',
 	// Module dependencies
 	[
 		'sushi.core',
 		'sushi.stores'
 	],

 	/**
 	 * Sushi Store
 	 *
 	 * @namespace Sushi
 	 * @class Store
 	 */
 	function(Sushi, stores) {
        Sushi.namespace('Store', Sushi);
        
        var Store = new Sushi.Class({
        	constructor: function(name) {
        		this.name = name;
        		
        		stores.push(this);
        	},
        	
        	name: 'Default Store'
        })
        
        Sushi.Store = Store;
        return Store;
 	}
 );
