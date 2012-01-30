/*
 * Sushi.stores.LocalStore
 * Based on the Backbone.localStorage implementation: https://github.com/jeromegn/Backbone.localStorage
 *
 */
 define('sushi.stores.LocalStore',
 	// Module dependencies
 	[
 		'sushi.core',
 		'sushi.Store',
 		'sushi.stores',
 		'sushi.Enumerable',
 		'sushi.utils.json',
 		'sushi.error',
 		'vendors/polyfills.localstorage'
 	],

 	/**
 	 * Sushi stores.LocalStore
 	 *
 	 * @namespace Sushi
 	 * @class stores.LocalStore
 	 */
 	function(Sushi, Store, SushiStores, Enumerable, JSON, SushiError) {        
        var LocalStore
        	, localStorage = window.localStorage;
        
        // Generate four random hex digits.
		function S4() {
		   return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
		};
		
		// Generate a pseudo-GUID by concatenating random hexadecimal.
		function guid() {
		   return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
		};
		
		LocalStore = new Sushi.Class(Store, {
			constructor: function(name) {
				LocalStore.Super.call(this, name);
				
				var store = localStorage.getItem(name);

				this.name = name;
				this.records = (store && store.split(",")) || [];
				this.records = new Enumerable(this.records);
			}
		});
		
		Sushi.extendClass(LocalStore, {
			// Save the current state of the **Store** to *localStorage*.
			save: function() {
				localStorage.setItem(this.name, this.records.join(","));
			},
			
			// Add a model, giving it a (hopefully)-unique GUID, if it doesn't already
			// have an id of it's own.
			create: function(model) {
				if (!model.id) {
					model.id = guid();
					
					if (model.attributes) model.attributes.id = model.id;
				}
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
				if (!model.id) throw new SushiError('Object needs an id attribute.')
				return JSON.parse(localStorage.getItem(this.name+"-"+model.id));
			},
			
			findById: function(id) {
				if (!id) throw new SushiError('id is required.');
				return JSON.parse(localStorage.getItem(this.name+"-"+id));
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
			},
			
			sync: function(method, model, options, error) {
				var resp
				,	store = model.localStorage || model.collection.localStorage;
				
				if (!store) throw new SushiError('A LocalStore instance must exist.');
				
				switch (method) {
					case "read":    resp = model.id != undefined ? store.find(model) : store.findAll(); break;
					case "create":  resp = store.create(model);                            break;
					case "update":  resp = store.update(model);                            break;
					case "delete":  resp = store.destroy(model);                           break;
				}
				
				if (resp) {
					options.success(resp);
				} else {
					options.error("Record not found");
				}
			}
		});
        
        Sushi.extend(SushiStores, {LocalStore: LocalStore})
        return LocalStore;
 	}
 );
