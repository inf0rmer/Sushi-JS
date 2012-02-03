/*
 * Sushi.Router - Routers map faux-URLs to actions, and fire events when routes are matched.
 *
 */
 define('sushi.mvc.router',
 	// Module dependencies
 	[
 		'sushi.event',
 		'sushi.utils',
 		'sushi.history'
    ],

 	/**
 	 * Sushi MVC Router
 	 *
 	 * @namespace Sushi
 	 * @class router
 	 */
 	function(event, utils, History) {
 		Sushi.namespace('Router');
 		
 		var namedParam    = /:\w+/g,
		splatParam    = /\*\w+/g,
	  	escapeRegExp  = /[-[\]{}()+?.,\\^$|#\s]/g,
 		Router = new Sushi.Class({
 			constructor: function(options) {
 				options || (options = {});
 				if (options.routes) this.routes = options.routes;
				this._bindRoutes();
				this.initialize.apply(this, arguments);
 			},
 			
 			/**
 			 * Initialize is an empty function by default. Override it with your own initialization logic.
 			 *
 			 * @method initialize
 			 */
 			initialize : function(){},
 			
 			/**
			 * Manually bind a single named route to a callback
			 *
			 * @method route
			 *
			 * @param {String} route Route expression
			 * @param {String} name Route name
			 * @param {Function} callback Function to run on route match.
			 *
			 */
 			route : function(route, name, callback) {
				Sushi.history || (Sushi.history = new History());
			  	if (!utils.isRegExp(route)) route = this._routeToRegExp(route);
			  	if (!callback) callback = this[name];

			  	Sushi.history.route(route, utils.bind(function(fragment) {
					var args = this._extractParameters(route, fragment);
					callback && callback.apply(this, args);
					this.trigger.apply(this, ['route:' + name].concat(args));
					Sushi.history.trigger('route', this, name, args);
			  	}, this));
			  	
			  	return this;
			},
			
			/**
			 * Simple proxy to Sushi.history to save a fragment into the history.
			 *
			 * @method navigate
			 *
			 * @param {String} fragment
			 * @param {Object} options Options Hash
			 *
			 */
			navigate : function(fragment, options) {
				Sushi.history.navigate(fragment, options);
			},
			
			/**
			 * Bind all defined routes to Backbone.history. 
			 * The order of the routes is reversed to support behavior where the most general routes can be defined at the bottom of the route map.
			 *
			 * @method _bindRoutes
			 */
			_bindRoutes : function() {
				if (!this.routes) return;
			  	var routes = [];
			  	
			  	for (var route in this.routes) {
					routes.unshift([route, this.routes[route]]);
			  	}
			  	
			  	for (var i = 0, l = routes.length; i < l; i++) {
					this.route(routes[i][0], routes[i][1], this[routes[i][1]]);
			  	}
			},
			
			/**
			 * Convert a route string into a regular expression, suitable for matching against the current location hash.
			 *
			 * @method _routeToRegExp
			 */
			_routeToRegExp : function(route) {
				route = route.replace(escapeRegExp, "\\$&")
						.replace(namedParam, "([^\/]*)")
						.replace(splatParam, "(.*?)");
						
			  	return new RegExp('^' + route + '$');
			},
			
			/**
			 * Given a route, and a URL fragment that it matches, return the array of extracted parameters.
			 *
			 * @method _extractParameters
			 */
			_extractParameters : function(route, fragment) {
			  	return route.exec(fragment).slice(1);
			}
 		});
 		
 		Sushi.extendClass(Router, event);
 		
 		Sushi.Router = Router;
 		
 		return Router;
 	}
 );