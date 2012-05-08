/*
 * Sushi.Collection - 
 *
 */
 define('sushi.mvc.collection',
 	// Module dependencies
 	[
 		'sushi.core',
 		'sushi.event',
 		'sushi.utils',
 		'sushi.utils.collection',
 		'sushi.mvc.model',
 		'sushi.stores',
 		'sushi.error'
    ],

 	/**
 	 * Sushi MVC Collection
 	 *
 	 * @namespace Sushi
 	 * @class Collection
 	 */
 	function(Sushi, event, utils, collection, Model, stores, SushiError) {
 		Sushi.namespace('Collection');
 		
 		var Collection,
 			wrapError = function(onError, model, options) {
				return function(resp) {
					if (onError) {
						onError(model, resp, options);
					} else {
						model.trigger('error', model, resp, options);
					}
				};
		  	},
		  	splice = Array.prototype.splice;
 		
 		Collection = new Sushi.Class({
 			constructor: function(models, options) {
 				options || (options = {});
				if (options.comparator) this.comparator = options.comparator;
				this._reset();
				if (models) this.reset(models, {silent: true});				
				this.initialize.apply(this, arguments);
 			},
 			
 			store: {},
 			
 			model: Model,
 			
 			initialize: function() {},
 			
 			toJSON: function() {
 				return this.map(function(model){ return model.toJSON(); });
 			},
 			
 			add: function(models, options) {
 				var i, index, length, model, cid, id, cids = {}, ids = {};
				options || (options = {});
				models = utils.isArray(models) ? models.slice() : [models];
				
				//Begin by turning bare objects into model references, and preventing invalid models or duplicate models from being added.
				for (i = 0, length = models.length; i < length; i++) {
					if (!(model = models[i] = this._prepareModel(models[i], options))) {
				  		throw new SushiError("Can't add an invalid model to a collection");
					}
					if (cids[cid = model.cid] || this._byCid[cid] ||
				  		(((id = model.id) != null) && (ids[id] || this._byId[id]))) {
				  		throw new SushiError("Can't add the same model to a collection twice");
					}
					cids[cid] = ids[id] = model;
			 	}
			 	
			 	//Listen to added models' events, and index models for lookup by id and by cid.
			 	for (i = 0; i < length; i++) {
					(model = models[i]).bind('all', this._onModelEvent, this);
					this._byCid[model.cid] = model;
					if (model.id != null) this._byId[model.id] = model;
			  	}
			  	
			  	//Insert models into the collection, re-sorting if needed, and triggering add events unless silenced.
			  	this.length += length;
				index = options.at != null ? options.at : this.models.length;
				splice.apply(this.models, [index, 0].concat(models));
				if (this.comparator) this.sort({silent: true});
				if (options.silent) return this;
				for (i = 0, length = this.models.length; i < length; i++) {
					if (!cids[(model = this.models[i]).cid]) continue;
					options.index = i;
					model.trigger('add', model, this, options);
				}
				return this;
			},
			
			remove: function(models, options) {
				var i, l, index, model;
				options || (options = {});
				models = utils.isArray(models) ? models.slice() : [models];
				for (i = 0, l = models.length; i < l; i++) {
					model = this.getByCid(models[i]) || this.get(models[i]);
					if (!model) continue;
					delete this._byId[model.id];
					delete this._byCid[model.cid];
					index = this.indexOf(model);
					this.models.splice(index, 1);
					this.length--;
					if (!options.silent) {
					  options.index = index;
					  model.trigger('remove', model, this, options);
				}
					this._removeReference(model);
				}
				
				return this;
			},
			
			get: function(id) {
				if (id == null) return null;
			  	return this._byId[id.id != null ? id.id : id];
			},
			
			getByCid: function(cid) {
			  	return cid && this._byCid[cid.cid || cid];
			},
			
			at: function(index) {
			  	return this.models[index];
			},
			
			sort: function(options) {
			  	options || (options = {});
			  	if (!this.comparator) throw new SushiError('Cannot sort a set without a comparator');
			  	
			  	var boundComparator = utils.bind(this.comparator, this);
				if (this.comparator.length == 1) {
					this.models = this.sortBy(boundComparator);
				} else {
					this.models.sort(boundComparator);
				}
				
				if (!options.silent) this.trigger('reset', this, options);
				return this;
			},
			
			pluck: function(attr) {
			  	return Sushi.utils.map(this.models, function(model){ return model.get(attr); });
			},
			
			reset: function(models, options) {
			  	models  || (models = []);
				options || (options = {});
				for (var i = 0, l = this.models.length; i < l; i++) {
					this._removeReference(this.models[i]);
				}
				this._reset();
				this.add(models, {silent: true, parse: options.parse});
				if (!options.silent) this.trigger('reset', this, options);
				return this;
			},
			
			fetch: function(options) {
			  	options = options ? collection.clone(options) : {};
      			if (options.parse === undefined) options.parse = true;
			  	
			  	var coll = this
			  	, 	success = options.success;
			  	
			  	options.success = function(resp, status, xhr) {
					coll[options.add ? 'add' : 'reset'](coll.parse(resp, xhr), options);
					if (success) success(collection, resp);
			  	};
			  	
			  	options.error = wrapError(options.error, coll, options);
			  	return (this.sync || this.store.sync || stores.def.sync).call(this, 'read', this, options);
			},
			
			create: function(model, options) {
			  	var coll = this;
				options = options ? utils.clone(options) : {};
				model = this._prepareModel(model, options);
				if (!model) return false;
				if (!options.wait) coll.add(model, options);
				var success = options.success;
				options.success = function(nextModel, resp, xhr) {
					if (options.wait) coll.add(nextModel, options);
					if (success) {
					  	success(nextModel, resp);
					} else {
					  	nextModel.trigger('sync', model, resp, options);
					}
				};
				model.save(null, options);
				return model;
			},
			
			parse: function(resp, xhr) {
				return resp;
			},
			
			next: function(model) {
				var i = this.at(this.indexOf(model));
				if (undefined === i || i < 0) return false;
				return this.at(this.indexOf(model) + 1);
			},
			
			prev: function(model) {
				if (undefined === i || i < 1) return false;
				return this.at(this.indexOf(model) - 1);
			},
			
			_reset: function(options) {
			  	this.length = 0;
			  	this.models = [];
			  	this._byId  = {};
			  	this._byCid = {};
			},
			
			_prepareModel: function(model, options) {
			  	if (!(model instanceof Model)) {
					var attrs = model;
					options.collection = this;
					model = new this.model(attrs, options);
					if (!model._validate(model.attributes, options)) model = false;
			  	} else if (!model.collection) {
					model.collection = this;
			  	}
			  return model;
			},
			
			_removeReference : function(model) {
			  	if (this == model.collection) {
					delete model.collection;
			  	}
			  	model.unbind('all', this._onModelEvent);
			},
			
			_onModelEvent : function(ev, model, collection, options) {
			  	if ((ev == 'add' || ev == 'remove') && collection != this) return;
			  	if (ev == 'destroy') {
					this._remove(model, options);
			  	}
			  	if (model && ev === 'change:' + model.idAttribute) {
					delete this._byId[model.previous(model.idAttribute)];
					this._byId[model.id] = model;
				}
				this.trigger.apply(this, arguments);
			}
 		});
 		
 		var methods = ['each', 'map', 'reduce', 'reduceRight', 'find', 'detect',
			'filter', 'select', 'reject', 'every', 'all', 'some', 'any', 'include',
			'contains', 'invoke', 'max', 'min', 'sortBy', 'sortedIndex', 'toArray', 'size',
			'first', 'rest', 'last', 'without', 'indexOf', 'lastIndexOf', 'isEmpty', 'groupBy'];
			
		utils.each(methods, function(method) {
			Collection.prototype[method] = function() {
			  	return collection[method].apply(Sushi, [this.models].concat(collection.toArray(arguments)));
			};
	  	});
 		
 		Sushi.extendClass(Collection, event);
 		
 		Sushi.Collection = Collection;
 		return Collection;
 	}
 );