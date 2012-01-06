/*
 * Sushi.Collection - 
 *
 */
 define(
 	// Module dependencies
 	[
 		'sushi.core',
 		'sushi.event',
 		'sushi.utils',
 		'sushi.mvc.model'
    ],

 	/**
 	 * Sushi MVC Collection
 	 *
 	 * @namespace Sushi
 	 * @class Collection
 	 */
 	function() {
 		Sushi.namespace('Collection');
 		
 		var Collection,
 			utils = Sushi.utils,
 			wrapError = function(onError, model, options) {
				return function(resp) {
					if (onError) {
						onError(model, resp, options);
					} else {
						model.trigger('error', model, resp, options);
					}
				};
		  	};
 		
 		Collection = new Sushi.Class({
 			constructor: function(models, options) {
 				options || (options = {});
				if (options.comparator) this.comparator = options.comparator;
				utils.bindAll(this, '_onModelEvent', '_removeReference');
				this._reset();
				if (models) this.reset(models, {silent: true});
				this.initialize.apply(this, arguments);
 			},
 			
 			model: new Sushi.Model(),
 			
 			initialize: function() {},
 			
 			toJSON: function() {
 				return this.map(function(model){ return model.toJSON(); });
 			},
 			
 			add: function(models, options) {
			  	if (utils.isArray(models)) {
					for (var i = 0, l = models.length; i < l; i++) {
				  		this._add(models[i], options);
					}
			  	} else {
					this._add(models, options);
			  	}
			  	return this;
			},
			
			remove : function(models, options) {
				if (utils.isArray(models)) {
					for (var i = 0, l = models.length; i < l; i++) {
				  		this._remove(models[i], options);
					}
			 	} else {
					this._remove(models, options);
			  	}
			  	return this;
			},
			
			get : function(id) {
				if (id == null) return null;
			  	return this._byId[id.id != null ? id.id : id];
			},
			
			getByCid : function(cid) {
			  	return cid && this._byCid[cid.cid || cid];
			},
			
			at: function(index) {
			  	return this.models[index];
			},
			
			sort : function(options) {
			  	options || (options = {});
			  	if (!this.comparator) throw new Error('Cannot sort a set without a comparator');
			  	this.models = this.sortBy(this.comparator);
			  	if (!options.silent) this.trigger('reset', this, options);
			  	return this;
			},
			
			pluck : function(attr) {
			  	return Sushi.utils.map(this.models, function(model){ return model.get(attr); });
			},
			
			reset : function(models, options) {
			  	models  || (models = []);
			  	options || (options = {});
			  	this.each(this._removeReference);
			  	this._reset();
			  	this.add(models, {silent: true});
			  	if (!options.silent) this.trigger('reset', this, options);
			  	return this;
			},
			
			/*
			fetch : function(options) {
			  	options || (options = {});
			  	var collection = this;
			  	var success = options.success;
			  	options.success = function(resp, status, xhr) {
					collection[options.add ? 'add' : 'reset'](collection.parse(resp, xhr), options);
					if (success) success(collection, resp);
			  	};
			  	options.error = wrapError(options.error, collection, options);
			  	return (this.sync || Backbone.sync).call(this, 'read', this, options);
			},
			*/
			
			create : function(model, options) {
			  	var coll = this;
			  	options || (options = {});
			  	model = this._prepareModel(model, options);
			  	if (!model) return false;
			  	var success = options.success;
			  	options.success = function(nextModel, resp, xhr) {
					coll.add(nextModel, options);
					if (success) success(nextModel, resp, xhr);
			  	};
			  	model.save(null, options);
			  	return model;
			},
			
			parse : function(resp, xhr) {
				return resp;
			},
			
			_reset : function(options) {
			  	this.length = 0;
			  	this.models = [];
			  	this._byId  = {};
			  	this._byCid = {};
			},
			
			_prepareModel: function(model, options) {
			  	if (!(model instanceof Sushi.Model)) {
					var attrs = model;
					model = new this.model(attrs, {collection: this});
					if (model.validate && !model._performValidation(attrs, options)) model = false;
			  	} else if (!model.collection) {
					model.collection = this;
			  	}
			  	return model;
			},
			
			_add : function(model, options) {
			  	options || (options = {});
			  	model = this._prepareModel(model, options);
			  	if (!model) return false;
			  	var already = this.getByCid(model);
			  	if (already) throw new Error(["Can't add the same model to a set twice", already.id]);
			  	this._byId[model.id] = model;
			  	this._byCid[model.cid] = model;
			  	var index = options.at != null ? options.at :
						  this.comparator ? this.sortedIndex(model, this.comparator) :
						  this.length;
			  	this.models.splice(index, 0, model);
			  	model.bind('all', this._onModelEvent);
			  	this.length++;
			  	if (!options.silent) model.trigger('add', model, this, options);
			  	return model;
			},
			
			_remove : function(model, options) {
			  	options || (options = {});
			  	model = this.getByCid(model) || this.get(model);
			  	if (!model) return null;
			  	delete this._byId[model.id];
			  	delete this._byCid[model.cid];
			  	this.models.splice(this.indexOf(model), 1);
			  	this.length--;
			  	if (!options.silent) model.trigger('remove', model, this, options);
			  	this._removeReference(model);
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
			  return utils[method].apply(Sushi, [this.models].concat(utils.toArray(arguments)));
			};
	  	});
 		
 		Sushi.extendClass(Collection, Sushi.Events);
 		
 		Sushi.Collection = Collection;
 	}
 );