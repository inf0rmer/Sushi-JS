/*
 * Sushi.Store
 *
 */
 define('sushi.Store',
 	// Module dependencies
 	[
 		'sushi.core'
 	],

 	/**
 	 * Sushi Store
 	 *
 	 * @namespace Sushi
 	 * @class Store
 	 */
 	function(Sushi) {
        Sushi.namespace('Store', Sushi);
        
        var Store;
        
        Store = new Sushi.Class({
        	constructor: function(name) {
        		if (name) this.name = name;
        		
        		if (Sushi.stores && Sushi.stores.register) Sushi.stores.register(this);
        	},
        	
        	name: 'Default Store',
        	
        	sync: function() {}
        });
        
        Sushi.Store = Store;
        return Store;
 	}
 );
