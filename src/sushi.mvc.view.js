/**
 * Sushi MVC - View
 *
 * @module Sushi.mvc
 */
define(
	['sushi.core', 'sushi.event', 'sushi.utils'],

	function() {
		/**
		 * Sushi MVC - View
		 * Heavily based on Backbone.View
		 *
		 * @namespace Sushi
		 * @class View
		 */
		Sushi.namespace('View');
		
		var utils = Sushi.utils;
		
		Sushi.Model = Sushi.Class({
			constructor: function(options) {
				this.cid = utils.uniqueId('view');
				this._configure(options || {});
				this._ensureElement();
				this.delegateEvents();
				this.initialize.apply(this, arguments);
			},
		});	
	}
);