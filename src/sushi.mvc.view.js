/**
 * Sushi MVC - View
 *
 * @module Sushi.mvc
 */
define(
	['sushi.core', 'sushi.event', 'sushi.utils', 'sushi.$'],

	function() {
		/**
		 * Sushi MVC - View
		 * Heavily based on Backbone.View
		 *
		 * @namespace Sushi
		 * @class View
		 */
		Sushi.namespace('View');
		
		var utils = Sushi.utils,
			$ = Sushi.$,
			selectorDelegate = function(selector) {
    			return $(selector, this.el);
  			},
  			eventSplitter = /^(\S+)\s*(.*)$/,
  			viewOptions = ['model', 'collection', 'el', 'id', 'attributes', 'className', 'tagName'];
		
		Sushi.View = Sushi.Class({
			constructor: function(options) {				
				this.cid = utils.uniqueId('view');
				this._configure(options || {});
				this._ensureElement();
				this.delegateEvents();
				this.initialize.apply(this, arguments);
			},
			
			$: selectorDelegate,
			
			tagName: 'div',
			
			initialize: function() {},
			
			render: function() {
				return this;
			},
			
			remove: function() {
				$(this.el).remove();
				return this;
			},
			
			delegateEvents: function(events) {
			  	if (!(events || (events = this.events))) return;
			  	if (utils.isFunction(events)) events = events.call(this);
			  	
			  	$(this.el).unbind('.delegateEvents' + this.cid);
			  	
			  	for (var key in events) {
					var method = this[events[key]];
					if (!method) throw new Error('Event "' + events[key] + '" does not exist');
					
					var match = key.match(eventSplitter);
					var eventName = match[1], selector = match[2];
					
					method = Sushi.utils.bind(method, this);
					eventName += '.delegateEvents' + this.cid;
					
					if (selector === '') {
				  		$(this.el).delegate(eventName, method);
					} else {
						$(this.el).delegate(selector, eventName, method, Sushi.$);
					}
			  }
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
					this.el = this.make(this.tagName, attrs);
			  	} else if (utils.isString(this.el)) {
					this.el = $(this.el).get(0);
			  	}
			}
		});
		
		Sushi.extendClass(Sushi.View, Sushi.Events);
	}
);