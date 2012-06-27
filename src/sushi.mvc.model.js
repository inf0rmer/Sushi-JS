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
		'sushi.stores',
		'sushi.error'
	],

	function(Sushi, event, utils, collection, stores, SushiError) {
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

		getValue = function(object, prop) {
			if (!(object && object[prop])) return null;
			return utils.isFunction(object[prop]) ? object[prop]() : object[prop];
		},

		urlError = function() {
			throw new SushiError('A "url" property or function must be specified');
		};

		var Model = new Sushi.Class({
			constructor: function(attributes, options) {
				var defaults;
				attributes || (attributes = {});
				if (options && options.parse) attributes = this.parse(attributes);

				if (defaults = getValue(this, 'defaults')) {
					attributes = Sushi.extend({}, defaults, attributes);
				}

				this.attributes = {};
				this._escapedAttributes = {};
				this.cid = utils.uniqueId('c');
				this._changed = {};
				if (!this.set(attributes, {silent: true})) {
					throw new SushiError("Can't create an invalid model");
				}

				this._previousAttributes = collection.clone(this.attributes);

				if (options && options.collection) this.collection = options.collection;

				if (this.collection && this.collection.store) this.store = this.collection.store;

				this.initialize.apply(this, arguments);
			},

			_previousAttributes: null,

			_changed: false,

			store: {},

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
			 * Get the value of an attribute. You can use dot notation to access deep attributes.
			 *
			 * @method get
			 * @param {String} key Name of the attribute.
			 *
			 * @return {mixed} Value of the attribute.
			 */
			get: function(key) {
				// Patched from this: https://github.com/amccloud/backbone-dotattr
				// to allow deep getting()
				return collection.reduce(key.split('.'), function(attr, key) {
					if (attr instanceof Sushi.Model)
						return attr.attributes[key];

					return attr[key];
				}, this.attributes);
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
				return this._escapedAttributes[attr] = escapeHTML(val === null ? '' : '' + val);
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
				return this.attributes[attr] !== null;
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
			set: function(key, value, options) {
				var now,
					attrs,
					attr,
					escaped,
					prev,
					alreadySetting,
					val;

				if (utils.isObject(key) || key === null) {
					attrs = key;
					options = value;
				} else {
					attrs = {};
					attrs[key] = value;
				}

				options || (options = {});
				if (!attrs) return this;
				if (attrs instanceof Model) attrs = attrs.attributes;
				if (options.unset) for (attr in attrs) attrs[attr] = void 0;

				if (!this._validate(attrs, options)) return false;
				if (this.idAttribute in attrs) this.id = attrs[this.idAttribute];

				now = this.attributes;
				escaped = this._escapedAttributes;
				prev = this._previousAttributes || {};
				alreadySetting = this._setting;
				this._changed || (this._changed = {});
				this._setting = true;

				for (attr in attrs) {
					val = attrs[attr];

					if (!utils.isEqual(now[attr], val)) delete escaped[attr];

					options.unset ? delete now[attr] : now[attr] = val;

					if (this._changing && !utils.isEqual(this._changed[attr], val)) {
						this.trigger('change:' + attr, this, val, options);
						this._moreChanges = true;
					}
					delete this._changed[attr];

					if (!utils.isEqual(prev[attr], val) || (utils.has(now, attr) != utils.has(prev, attr))) {
						this._changed[attr] = val;
					}
				}

				if (!alreadySetting) {
					if (!options.silent && this.hasChanged()) this.change(options);
					this._setting = false;
				}

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
				(options || (options = {})).unset = true;
				return this.set(attr, null, options);
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
				(options || (options = {})).unset = true;
				return this.set(collection.clone(this.attributes), options);
			},

			fetch: function(options) {
				options = options ? collection.clone(options) : {};
				var model = this,
				success = options.success;

				options.success = function(resp, status, xhr) {
					if (!model.set(model.parse(resp, xhr), options)) return false;
					if (success) success(model, resp);
				};

				options.error = wrapError(options.error, model, options);
				return (this.sync || this.store.sync || stores.def.sync).call(this, 'read', this, options);
			},

			save: function(key, value, options) {
				var attrs, current;
				if (utils.isObject(key) || key === null) {
					attrs = key;
					options = value;
				} else {
					attrs = {};
					attrs[key] = value;
				}

				options = options ? collection.clone(options) : {};
				if (options.wait) current = collection.clone(this.attributes);
				var silentOptions = Sushi.extend({}, options, {silent: true});

				if (attrs && !this.set(attrs, options.wait ? silentOptions : options)) {
					return false;
				}

				var model = this,
				success = options.success,
				method = this.isNew() ? 'create' : 'update';

				options.success = function(resp, status, xhr) {
					var serverAttrs = model.parse(resp, xhr);
					if (options.wait) {
						delete options.wait;
						serverAttrs = Sushi.extend(attrs || {}, serverAttrs);
					}
					if (!model.set(serverAttrs, options)) return false;
					if (success) {
						success(model, resp);
					} else {
						model.trigger('sync', model, resp, options);
					}
				};

				options.error = wrapError(options.error, model, options);
				var xhr = (this.sync || this.store.sync || stores.def.sync).call(this, method, this, options);
				if (options.wait) this.set(current, silentOptions);
				return xhr;
			},

			/**
			 * Destroy this model on the server if it was already persisted. Optimistically removes the model from its collection, if it has one.
			 * If wait: true is passed, waits for the server to respond before removal.
			 *
			 * @method clear
			 * @param {Object} options
			 *
			 * @return {Model} Model instance.
			 */
			destroy: function(options) {
				options = options ? collection.clone(options) : {};
				var model = this,
				success = options.success,
				triggerDestroy = function() {
					model.trigger('destroy', model, model.collection, options);
				};

				if (this.isNew()) return triggerDestroy();
				model.trigger('destroy', model, model.collection, options);

				options.success = function(resp) {
					if (options.wait) triggerDestroy();
					if (success) {
						success(model, resp);
					} else {
						model.trigger('sync', model, resp, options);
					}
				};

				options.error = wrapError(options.error, model, options);
				var xhr = (this.sync || this.store.sync || stores.def.sync).call(this, 'delete', this, options);
				if (!options.wait) triggerDestroy();
				return xhr;
			},

			url: function() {
				var base = getValue(this.collection, 'url') || getValue(this, 'urlRoot') || urlError();
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
				return new this.constructor(this.attributes);
			},

			/**
			 * A model is new if it has never been saved to the server, and lacks an id.
			 *
			 * @method isNew
			 *
			 * @return {Boolean}
			 */
			isNew: function() {
				return this.id === null;
			},

			/**
			 * Manually fire a change event for this model. Calling this will cause all objects observing the model to update.
			 *
			 * @method change
			 *
			 */
			change: function(options) {
				if (this._changing || !this.hasChanged()) return this;
				this._changing = true;
				this._moreChanges = true;
				for (var attr in this._changed) {
					this.trigger('change:' + attr, this, this._changed[attr], options);
				}
				while (this._moreChanges) {
					this._moreChanges = false;
					this.trigger('change', this, options);
				}
				this._previousAttributes = collection.clone(this.attributes);
				delete this._changed;
				this._changing = false;
				return this;
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
				if (!arguments.length) return !utils.isEmpty(this._changed);
				return this._changed && utils.has(this._changed, attr);
			},

			/**
			 * Return an object containing all the attributes that have changed, or false if there are no changed attributes.
			 *
			 * @method changedAttributes
			 * @param {Object} now New attributes to compare to
			 *
			 * @return {Object|Boolean}
			 */
			changedAttributes: function(diff) {
				if (!diff) return this.hasChanged() ? collection.clone(this._changed) : false;
				var val, changed = false, old = this._previousAttributes;

				for (var attr in diff) {
					if (utils.isEqual(old[attr], (val = diff[attr]))) continue;
					(changed || (changed = {}))[attr] = val;
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
			 * @method _validate
			 * @param {Object} attrs Hash of attributes to validate
			 * @param {Object} options
			 *
			 * @return {Boolean}
			 */
			_validate: function(attrs, options) {
				if (options.silent || !this.validate) return true;
				attrs = Sushi.extend({}, this.attributes, attrs);

				var error = this.validate(attrs, options);
				if (!error) return true;

				if (options && options.error) {
					options.error(this, error, options);
				} else {
					this.trigger('error', this, error, options);
				}

				return false;
			}
		});

		Sushi.extendClass(Model, event);
		Sushi.Model = Model;
		return Model;
	}
);