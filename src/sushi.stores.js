/*
 * Sushi.stores
 *
 */
 define('sushi.stores',
 	// Module dependencies
 	[
 		'sushi.core',
 		'sushi.utils',
 		'sushi.Enumerable',
 		'sushi.Store',
 		'sushi.error'
 	],

 	/**
 	 * Sushi stores
 	 *
 	 * @namespace Sushi
 	 * @class stores
 	 */
 	function(Sushi, utils, Enumerable, Store, SushiError) {
        Sushi.namespace('stores', Sushi);
        
        var stores = new Enumerable([]);
        
        Sushi.extend(stores, {
        	register: function(store) {        						
				if (utils.isUndefined(store.name) || utils.isEmpty(store.name)) throw new SushiError('Store must have a name.');
        		
        		this.push({id: store.name, store: store});
        	},
        	
        	default: new Store()
        });
        
        Sushi.stores = stores;
        return stores;
 	}
 );