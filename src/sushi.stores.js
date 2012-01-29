/*
 * Sushi.stores
 *
 */
 define('sushi.stores',
 	// Module dependencies
 	[
 		'sushi.core',
 		'sushi.Enumerable',
 		'sushi.error'
 	],

 	/**
 	 * Sushi stores
 	 *
 	 * @namespace Sushi
 	 * @class stores
 	 */
 	function(Sushi, Enumerable, SushiError) {
        Sushi.namespace('stores', Sushi);
        
        var stores = new Enumerable([]);
        
        Sushi.extend(stores, {
        	register: function(store) {        						
				if (utils.isUndefined(store.name) || utils.isEmpty(store.name)) throw new SushiError('Store must have a name.');
        		
        		this.push({id: store.name, store: store});
        	}
        });
        
        Sushi.stores = stores;
        return stores;
 	}
 );