/**
 * Sushi MVC - Model
 *
 * @module Sushi.mvc
 */
define('sushi.mvc.model',
	[
		'sushi.core', 
		'sushi.event', 
		'sushi.utils',
		'sushi.utils.collection',
		'sushi.Store.RemoteStore',
		'sushi.error'
	],

	function(Sushi, event, utils, collection, Store, SushiError) {
		/**
		 * Sushi MVC - Model
		 * Heavily based on Backbone.Model
		 *
		 * @namespace Sushi
		 * @class Model
		 */
		Sushi.namespace('Model');
		
		var escapeHTML = function(string) {
			return string.replace(/&(?!\w+;|#\d+;|#x[\da-f]+;)/gi, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;').replace(/\//g,'&#x2F;');
			
		},
		
		wrapError = function(onError, model, options) {
			return function(resp) {
				if (onError) {
					onError(model, resp, options);
				} else {
					model.trigger('error', model, resp, options);
				}
			};
		},
		
		getUrl = function(object) {
    		if (!(object && object.url)) return null;
    		return utils.isFunction(object.url) ? object.url() : object.url;
  		},
  		
		urlError = function() {
			throw new SushiError('A "url" property or function must be specified');
		}
		
		var Model = Sushi.Class({
			constructor: function(attributes, options) {
				var defaults;
				attributes || (attributes = {});
				if (defaults = this.defaults) {
					if (utils.isFunction(defaults)) defaults = defaults.call(this);
				  	
				  	attributes = Sushi.extend(defaults, attributes, true);
				}
				
				this.attributes = {};
				this._escapedAttributes = {};
				this.cid = utils.uniqueId('c');
				this.set(attributes, {silent : true});
				this._changed = false;
				this._previousAttributes = collection.clone(this.attributes);
				
				if (options && options.collection) this.collection = options.collection;
				
				this.initialize(attributes, options);
			},
			
			_previousAttributes: null,
			
			_changed: false,
			
			idAttribute: 'id',
			
			// Override with own initialization logic
			initialize: function(){},
			
			/**
			 * Return a copy of the model's attributes object.
			 *
			 * @method toJSON
			 *
			 * @return {Object} Copy of the model's attributes.
			 */
			toJSON: function() {
				return collection.clone(this.attributes);
			},
			
			/**
			 * Get the value of an attribute.
			 *
			 * @method get
			 * @param {String} attr Name of the attribute.
			 *
			 * @return {mixed} Value of the attribute.
			 */
			get: function(attr) {
				return this.attributes[attr];
			},
			
			/**
			 * Get the HTML-escaped value of an attribute.
			 *
			 * @method get
			 * @param {String} attr Name of the attribute.
			 *
			 * @return {mixed} Value of the attribute.
			 */
			escape: function(attr) {
				var html,
					val;
					
				if (html = this._escapedAttributes[attr]) return html;
				
				val = this.attributes[attr];
				return this._escapedAttributes[attr] = escapeHTML(val == null ? '' : '' + val);
			},
			
			/**
			 * Returns true if the attribute contains a value that is not null or undefined.
			 *
			 * @method has
			 * @param {String} attr Name of the attribute.
			 *
			 * @return {Boolean}
			 */
			has: function(attr) {
				return this.attributes[attr] != null;
			},
			
			/**
			 * Set a hash of model attributes on the object, firing "change" unless you choose to silence it.
			 *
			 * @method set
			 * @param {Object} attrs Hash of the model's new attributes
			 * @param {Object} options 
			 *
			 * @return {Model} Model instance.
			 */
			set: function(attrs, options) {
				var now,
					escaped,
					alreadyChanging,
					val;
					
				options || (options = {});
				if (!attrs) return this;
				if (attrs.attributes) attrs = attrs.attributes;
				
				now = this.attributes; 
				escaped = this._escapedAttributes;
				
				if (!options.silent && this.validate && !this._performValidation(attrs, options)) return false;
				
				if (this.idAttribute in attrs) this.id = attrs[this.idAttribute];
				
				alreadyChanging = this._changing;
      			this._changing = true;
      			
      			for (var attr in attrs) {
					val = attrs[attr];
					
					if (!utils.isEqual(now[attr], val)) {
				  		now[attr] = val;
				  		delete escaped[attr];
				  		this._changed = true;
				  		
				  		if (!options.silent) this.trigger('change:' + attr, this, val, options);
					}
			  	}
			  	
			  	if (!alreadyChanging && !options.silent && this._changed) this.change(options);
				this._changing = false;
				
				return this;
			},
			
			/**
			 * Remove an attribute from the model, firing "change" unless you choose to silence it. unset is a noop if the attribute doesn't exist.
			 *
			 * @method unset
			 * @param {Object} attr Name of the attribute to remove.
			 * @param {Object} options 
			 *
			 * @return {Model} Model instance.
			 */
			unset: function(attr, options) {
				var value,
					validObj = {};
				
				if (!(attr in this.attributes)) return this;
				options || (options = {});
				value = this.attributes[attr];
				
				// Run validation
				validObj[attr] = void 0;
				if (!options.silent && this.validate && !this._performValidation(validObj, options)) return false;
				
				// Remove the attribute
				delete this.attributes[attr];
				delete this._escapedAttributes[attr];
				
				if (attr == this.idAttribute) delete this.id;
				this._changed = true;
				if (!options.silent) {
					this.trigger('change:' + attr, this, void 0, options);
					this.change(options);
				}
				
				return this;
			},
			
			/**
			 * Clear all attributes on the model, firing "change" unless you choose to silence it.
			 *
			 * @method clear
			 * @param {Object} options 
			 *
			 * @return {Model} Model instance.
			 */
			clear: function(options) {
				options || (options = {});
     			var attr,
			    	old = this.attributes,
			    	validObj = {};
				
				// Run validation
				for (attr in old) validObj[attr] = void 0;
				
				if (!options.silent && this.validate && !this._performValidation(validObj, options)) return false;
				
				this.attributes = {};
				this._escapedAttributes = {};
				this._changed = true;
					
				if (!options.silent) {
					for (attr in old) {
					  	this.trigger('change:' + attr, this, void 0, options);
					}
					this.change(options);
				}
					
				return this;
			},
			
			fetch: function(options) {
				options || (options = {});
				var model = this
				,	success = options.success;
				
				options.success = function(resp, status, xhr) {
					if (!model.set(model.parse(resp, xhr), options)) return false;
					if (success) success(model, resp);
				};
				
				options.error = wrapError(options.error, model, options);
				return (this.sync || new Store().sync).call(this, 'read', this, options);
			},
			
			save: function(attrs, options) {
				options || (options = {});
				if (attrs && !this.set(attrs, options)) return false;
				
				var model = this
			  	,	success = options.success
				,  	method = this.isNew() ? 'create' : 'update';
			  	
			  	options.success = function(resp, status, xhr) {
					if (!model.set(model.parse(resp, xhr), options)) return false;
					if (success) success(model, resp, xhr);
			  	};
			  	
			  	options.error = wrapError(options.error, model, options);

			  	return (this.sync || new Store().sync).call(this, method, this, options);
			},
			
			/**
			 * Destroy this model on the server if it was already persisted. Upon success, the model is removed from its collection, if it has one.
			 *
			 * @method clear
			 * @param {Object} options 
			 *
			 * @return {Model} Model instance.
			 */
			destroy: function() {
				options || (options = {});
		  		if (this.isNew()) return this.trigger('destroy', this, this.collection, options);
		  		
		  		var model = this
		  		,	success = options.success;
		  		
		  		model.trigger('destroy', model, model.collection, options);
		  		
		  		options.success = function(resp) {
					model.trigger('destroy', model, model.collection, options);
					if (success) success(model, resp);
		  		};
		  		options.error = wrapError(options.error, model, options);
		  		return (this.sync || new Store().sync).call(this, 'delete', this, options);
			},
			
			url: function() {
				var base = getUrl(this.collection) || this.urlRoot || urlError();
			  	if (this.isNew()) return base;
			  	return base + (base.charAt(base.length - 1) == '/' ? '' : '/') + encodeURIComponent(this.id);
			},
			
			/**
			 * Convert a response into the hash of attributes to be set on the model
			 *
			 * @method parse
			 * @param {Object} resp Response
			 * @param {XMLHttpRequest} xhr Request object
			 *
			 * @return {Object} Parsed response
			 */
			parse: function(resp, xhr) {
				return resp;
			},
			
			/**
			 * Create a new model with identical attributes to this one.
			 *
			 * @method clone
			 *
			 * @return {Model} Clone of this Model's instance
			 */
			clone: function() {
				return new this.constructor(this);
			},
			
			/**
			 * A model is new if it has never been saved to the server, and lacks an id.
			 *
			 * @method isNew
			 *
			 * @return {Boolean}
			 */
			isNew: function() {
				return this.id == null;
			},
			
			/**
			 * Manually fire a change event for this model. Calling this will cause all objects observing the model to update.
			 *
			 * @method change
			 *
			 */
			change: function(options) {
				this.trigger('change', this, options);
      			this._previousAttributes = collection.clone(this.attributes);
      			this._changed = false;
			},
			
			/**
			 * Determine if the model has changed since the last "change" event. If you specify an attribute name, determine if that attribute has changed.
			 *
			 * @method hasChanged
			 * @param {String} attr Attribute name
			 *
			 * @return {Boolean}
			 */
			hasChanged: function(attr) {
				if (attr) return this._previousAttributes[attr] != this.attributes[attr];
      			return this._changed;
			},
			
			/**
			 * Return an object containing all the attributes that have changed, or false if there are no changed attributes.
			 *
			 * @method changedAttributes
			 * @param {Object} now New attributes to compare to
			 *
			 * @return {Object|Boolean}
			 */
			changedAttributes: function(now) {
				now || (now = this.attributes);
				var old = this._previousAttributes;
				var changed = false;
				for (var attr in now) {
					if (!utils.isEqual(old[attr], now[attr])) {
					  	changed = changed || {};
					  	changed[attr] = now[attr];
					}
				}
				
				return changed;
			},
			
			/**
			 * Get the previous value of an attribute, recorded at the time the last "change" event was fired.
			 *
			 * @method previous
			 *
			 * @return {mixed} Previous attribute value
			 */
			previous: function(attr) {
				if (!attr || !this._previousAttributes) return null;
      			return this._previousAttributes[attr];
			},
			
			/**
			 * Get all of the attributes of the model at the time of the previous "change" event.
			 *
			 * @method previousAttributes
			 *
			 * @return {Object} Model's previous attributes
			 */
			previousAttributes: function() {
				return collection.clone(this._previousAttributes);
			},
			
			/**
			 * Run validation against a set of incoming attributes, returning true if all is well. If a specific error callback has been passed, call that instead of firing the general "error" event.
			 *
			 * @method _performValidation
			 * @param {Object} attrs Hash of attributes to validate
			 * @param {Object} options
			 *
			 * @return {Boolean}
			 */
			_performValidation: function(attrs, options) {
				var error = this.validate(attrs);
				if (error) {
					if (options.error) {
					  	options.error(this, error, options);
					} else {
					  	this.trigger('error', this, error, options);
					}
					
					return false;
				}
				
				return true;
			}
		});
		
		Sushi.extendClass(Model, event);
		Sushi.Model = Model;
		return Model;
	}
);