/**
 * Sushi MVC - View
 *
 * @module Sushi.mvc
 */
define('sushi.mvc.view',
	[
		'sushi.core', 
		'sushi.event', 
		'sushi.utils', 
		'sushi.$'
	],

	function(Sushi, event, utils, $) {
		/**
		 * Sushi MVC - View
		 * Heavily based on Backbone.View
		 *
		 * @namespace Sushi
		 * @class View
		 */
		Sushi.namespace('View');
		
		var	eventSplitter = /^(\S+)\s*(.*)$/,
  			viewOptions = ['model', 'collection', 'el', 'id', 'attributes', 'className', 'tagName'],
  			getValue = function(object, prop) {	
				if (!(object && object[prop])) return null;	
				return utils.isFunction(object[prop]) ? object[prop]() : object[prop];
			};
		
		Sushi.View = Sushi.Class({
			constructor: function(options) {				
				this.cid = utils.uniqueId('view');
				this._configure(options || {});
				this._ensureElement();
				this.initialize.apply(this, arguments);
				this.delegateEvents();
			},
			
			$: function(selector) {
			  	return this.$el.find(selector);
			},
			
			tagName: 'div',
			
			initialize: function() {},
			
			render: function() {
				return this;
			},
			
			remove: function() {
				this.$el.remove();
				return this;
			},
			
			setElement: function(element, delegate) {
				this.$el = $(element);
			  	this.el = this.$el.get(0);
			  	if (delegate !== false) this.delegateEvents();
			  	return this;
			},
			
			delegateEvents: function(events) {
			  	if (!(events || (events = getValue(this, 'events')))) return;
			  	
			  	this.undelegateEvents();
			  	
			  	for (var key in events) {
					var method = this[events[key]];
					if (!utils.isFunction(method)) method = this[events[key]];
					if (!method) throw new Error('Event "' + events[key] + '" does not exist');
					
					var match = key.match(eventSplitter);
					var eventName = match[1], selector = match[2];
					
					method = utils.bind(method, this);
					eventName += '.delegateEvents' + this.cid;
					
					if (selector === '') {
				  		this.$el.delegate(eventName, method);
					} else {
						this.$el.delegate(selector, eventName, method, $);
					}
			  	}
			},
			
			undelegateEvents: function() {
			  	this.$el.unbind('.delegateEvents' + this.cid);
			},
			
			dealloc: function() {
				if (!this.el) return false;
				this.undelegateEvents();
				this.$el.remove();
			},
			
			make : function(tagName, attributes, content) {
			  	var el = document.createElement(tagName);
			  	if (attributes) $(el).attr(attributes);
			  	if (content) $(el).html(content);
			  	return el;
			},
			
			_configure: function(options) {
			  	if (this.options) options = Sushi.extend({}, this.options, options);
			  	
			  	for (var i = 0, l = viewOptions.length; i < l; i++) {
					var attr = viewOptions[i];
					if (options[attr]) this[attr] = options[attr];
			  	}
			  	
			  	this.options = options;
			},
			
			_ensureElement: function() {
			  	if (!this.el) {
					var attrs = this.attributes || {};
					if (this.id) attrs.id = this.id;
					if (this.className) attrs['class'] = this.className;
					this.setElement(this.make(this.tagName, attrs));
			  	} else {
					this.setElement(this.el, false);
			  	}
			}
		});
		
		Sushi.extendClass(Sushi.View, event);
		
		return Sushi.View;
	}
);