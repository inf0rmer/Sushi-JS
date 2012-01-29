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
        		stores.register(this);
        	},
        	
        	name: 'Default Store',
        	
        	sync: function() {}
        })
        
        Sushi.Store = Store;
        return Store;
 	}
 );
