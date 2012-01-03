/*
 * Sushi.Router - Routers map faux-URLs to actions, and fire events when routes are matched.
 *
 */
 define(
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
 	function() {
 		Sushi.namespace('Router');
 		
 		var namedParam    = /:([\w\d]+)/g,
		splatParam    = /\*([\w\d]+)/g,
	  	escapeRegExp  = /[-[\]{}()+?.,\\^$|#\s]/g,
	  	utils = Sushi.utils,
 		Router = new Sushi.Class({
 			constructor: function(options) {
 				options || (options = {});
 				if (options.routes) this.routes = options.routes;
				this._bindRoutes();
				this.initialize.apply(this, arguments);
 			},
 			
 			initialize : function(){},
 			
 			route : function(route, name, callback) {
				Sushi.history || (Sushi.history = new Sushi.History());
			  	if (!utils.isRegExp(route)) route = this._routeToRegExp(route);
			  	
			  	Sushi.history.route(route, utils.bind(function(fragment) {
					var args = this._extractParameters(route, fragment);
					callback.apply(this, args);
					this.trigger.apply(this, ['route:' + name].concat(args));
			  	}, this));
			},
			
			navigate : function(fragment, triggerRoute) {
				Sushi.history.navigate(fragment, triggerRoute);
			},
			
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
			
			_routeToRegExp : function(route) {
				route = route.replace(escapeRegExp, "\\$&")
						.replace(namedParam, "([^\/]*)")
						.replace(splatParam, "(.*?)");
						
			  	return new RegExp('^' + route + '$');
			},
			
			_extractParameters : function(route, fragment) {
			  	return route.exec(fragment).slice(1);
			}
 		});
 		
 		Sushi.extendClass(Router, Sushi.Events);
 		
 		Sushi.Router = Router;
 	}
 );