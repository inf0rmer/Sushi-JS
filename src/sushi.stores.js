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
 		'sushi.error',
 		'sushi.template'
 	],

 	/**
 	 * Sushi stores
 	 *
 	 * @namespace Sushi
 	 * @class stores
 	 */
 	function(Sushi, utils, Enumerable, SushiError, template) {
        Sushi.namespace('stores', Sushi);
        
        var stores = new Enumerable([]);
        
        Sushi.extend(stores, {
        	register: function(store) {
        		if (typeof store !== 'Sushi.Store') {
					throw new SushiError('Not a valid Sushi.Store.');
					return false;
				}
				
				if (utils.isUndefined(store.name) || utils.isEmpty(store.name)) {
					throw new SushiError('Store must have a name.');
					return false;
				}
        		
        		this.push({id: store.name, store: store});
        	},
        	
        	unregister: function(store) {
        		var _toRemove = this.find(function(current) {
        			return (current.name === store.name);
        		});
        		Sushi.log(this.indexOf(_toRemove));
        		//this.remove({id: store.name, store: store});
        	},
        	
        	syncAll: function() {
        		this.each(function(store) {
        			if (typeof store !== 'Sushi.Store') {
        				throw new SushiError('Not a valid Sushi.Store.');
        				return false;
        			}
        			
        			return store.sync();        			
        		});
        	}
        });
        
        Sushi.stores = stores;
        return stores;
 	}
 );