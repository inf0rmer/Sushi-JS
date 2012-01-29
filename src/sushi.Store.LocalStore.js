/*
 * Sushi.Store.LocalStore
 * Based on the Backbone.localStorage implementation: https://github.com/jeromegn/Backbone.localStorage
 *
 */
 define('sushi.Store.LocalStore',
 	// Module dependencies
 	[
 		'sushi.core',
 		'sushi.Store',
 		'sushi.stores',
 		'sushi.Enumerable',
 		'sushi.utils.json'
 	],

 	/**
 	 * Sushi Store.LocalStore
 	 *
 	 * @namespace Sushi
 	 * @class Store.LocalStore
 	 */
 	function(Sushi, Store, SushiStores, Enumerable, JSON) {
        Sushi.namespace('Store.LocalStore', Sushi);
        
        var localStore
        	, localStorage = window.localStorage;
        
        // Generate four random hex digits.
		function S4() {
		   return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
		};
		
		// Generate a pseudo-GUID by concatenating random hexadecimal.
		function guid() {
		   return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
		};
		
		localStore = function(name) {
			var store = localStorage.getItem(name);
			
			this.store = new Store(name);
			this.name = name;
			this.records = (store && store.split(",")) || [];
			this.records = new Enumerable(this.records);
		}
		
		Sushi.extend(localStore.prototype, {
			// Save the current state of the **Store** to *localStorage*.
			save: function() {
				localStorage.setItem(this.name, this.records.join(","));
			},
			
			// Add a model, giving it a (hopefully)-unique GUID, if it doesn't already
			// have an id of it's own.
			create: function(model) {
				if (!model.id) model.id = model.attributes.id = guid();
				localStorage.setItem(this.name+"-"+model.id, JSON.stringify(model));
				this.records.push(model.id.toString());
				this.save();
				return model;
			},
			
			// Update a model by replacing its copy in `this.data`.
			update: function(model) {
				localStorage.setItem(this.name+"-"+model.id, JSON.stringify(model));
				if (!this.records.include(model.id.toString())) this.records.push(model.id.toString()); this.save();
				return model;
			},
			
			// Retrieve a model from `this.data` by id.
			find: function(model) {
				return JSON.parse(localStorage.getItem(this.name+"-"+model.id));
			},
			
			// Return the array of all models currently in storage.
			findAll: function() {
				return this.records.map(function(id){return JSON.parse(localStorage.getItem(this.name+"-"+id));}, this);
			},
			
			// Delete a model from `this.data`, returning it.
			destroy: function(model) {
				localStorage.removeItem(this.name+"-"+model.id);
				this.records = this.records.reject(function(record_id){return record_id == model.id.toString();});
				this.save();
				return model;
			}
		});
        
        //Sushi.Store.LocalStore = localStore;
        Sushi.extend(SushiStores, {localStore: localStore})
        return localStore;
 	}
 );
