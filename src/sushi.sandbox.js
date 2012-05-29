/*
 * Sushi.sandbox - Manages a whole widget (collection of modules) lifecycle. Based on Bacbkone Aura (https://github.com/addyosmani/backbone-aura)
 *
 */
define('sushi.sandbox',
	// Module dependencies
	[
		'sushi.core',
		'sushi.utils',
		'sushi.utils.debug',
		'sushi.utils.lang',
		'sushi.$',
		'sushi.mvc',
		'sushi.template'
	],

 	/**
	 * Sushi sandbox
	 *
	 * @namespace Sushi
	 * @class sandbox
	 */
	function(Sushi, utils, console, lang, $, mvc, template) {
		Sushi.namespace('sandbox', Sushi);
		
		var channels 	= {},  			// Loaded modules and their callbacks
			mediator 	= {},      		// Mediator object
			permissions = {},			// Permissions object
			rules 		= {}			// Rules
			baseUrl 	= 'widgets/';	// Base URL to fetch widgets from
		
		/**
		 * Override the default error handling for requirejs
		 * @todo When error messages become part of core, use them instead
		 * @link <a href="http://requirejs.org/docs/api.html#errors">Handling Errors</a>
		 */
		requirejs.onError = function (err) {
			if (err.requireType === 'timeout') {
				console.warn('Could not load module ' + err.requireModules);
			} else {
				// If a timeout hasn't occurred and there was another module 
				// related error, unload the module then throw an error
				var failedId = err.requireModules && err.requireModules[0];
				requirejs.undef(failedId);
		
				throw err;
			}
		};
		
		permissions.extend = function (extended) {
			rules = Sushi.extend({}, extended);
		};
	
		/**
		 * @param {string} subscriber Module name
		 * @param {string} channel Event name
		 */
		permissions.validate = function(subscriber, channel){
			var test = rules[channel][subscriber];
			return test === undefined ? false : test;
		};
		
		
		/**
		 * Subscribe to an event
		 * @param {string} channel Event name
		 * @param {object} subscription Module callback
		 * @param {object} context Context in which to execute the module
		 */
		mediator.subscribe = function (channel, callback, context) {
			channels[channel] = (!channels[channel]) ? [] : channels[channel];
			channels[channel].push(utils.bind(callback, context));
		};
	
		/**
		 * Publish an event, passing arguments to subscribers. Will
		 * call start if the channel is not already registered.
		 * @param {string} channel Event name
		 */
		mediator.publish = function (channel) {
			var i, l, args = [].slice.call(arguments, 1);
			if (!channels[channel]) {
				obj.start.apply(this, arguments);
				return;
			}
	
			for (i = 0, l = channels[channel].length; i < l; i += 1) {
				channels[channel][i].apply(this, args);
			}
		};
		
		
		mediator.start = function(channel) {
			 var i, l,
            args = [].slice.call(arguments, 1),
            file = lang.decamelize(channel);
        
			// If a widget hasn't called subscribe this will fail because it wont
			// be present in the channels object
			require([baseUrl + file + "/main"], function () {
				for (i = 0, l = channels[channel].length; i < l; i += 1) {
					channels[channel][i].apply(mediator, args);
				}
			});
		};
		
		mediator.stop = function(channel) {
			var args = [].slice.call(arguments, 1),
				el = args[0],
				file = lang.decamelize(channel);
	
			// Remove all modules under a widget path (e.g widgets/todos)
			mediator.unload(baseUrl + file);
			
			if (el) {
				// Empty markup associated with the module
				$(el).html('');
			}
		};
		
		/**
		* Undefine/unload a module, resetting the internal state of it in require.js
		* to act like it wasn't loaded. By default require won't cleanup any markup
		* associated with this
		* 
		* The interesting challenge with .stop() is that in order to correctly clean-up
		* one would need to maintain a custom track of dependencies loaded for each 
		* possible channel, including that channels DOM elements per depdendency. 
		*
		* This issue with this is shared dependencies. E.g, say one loaded up a module
		* containing jQuery, others also use jQuery and then the module was unloaded.
		* This would cause jQuery to also be unloaded if the entire tree was being done
		* so.
		*
		* A simpler solution is to just remove those modules that fall under the
		* widget path as we know those dependencies (e.g models, views etc) should only
		* belong to one part of the codebase and shouldn't be depended on by others.
		*
		* @param {string} channel Event name
		*/
		mediator.unload = function(channel){
			var contextMap = requirejs.s.contexts._.urlMap;
			for (key in contextMap) {
				if (contextMap.hasOwnProperty(key) && key.indexOf(channel) !== -1) {
					require.undef(key);
				}
			}
	
		};
		
		mediator.dom = {
			find: function (selector, context) {
				context = context || document;
				return $(context).find(selector);
			},
			data: function (selector, attribute) {
				return $(selector).data(attribute);
			}
		};
		
		Sushi.sandbox = {
			/**
			 * @param {string} subscriber Module name
			 * @param {string} channel Event name
			 * @param {object} callback Module
			 */
			subscribe: function (subscriber, channel, callback) {
				if (permissions.validate(subscriber, channel)) {
					mediator.subscribe(channel, callback, this);
				}
			},
		
			/**
			 * @param {string} channel Event name
			 */
			publish: function (channel) {
				mediator.publish.apply(mediator, arguments);
			},
		
		
			/**
			 * @param {string} channel Event name
			 */
			start: function(channel){
				mediator.start.apply(mediator, arguments);
			},
		
			/**
			 * @param {string} channel Event name
			 */
			stop: function(channel){
				mediator.stop.apply(mediator, arguments);
			},
			
			/**
			 * @param {string} selector CSS selector for the element
			 * @param {string} context CSS selector for the context in which to
			 * search for selector
			 * @returns {object} Found elements or empty array
			 */
			find: function (selector, context) {
				return mediator.dom.find(selector, context);
			},
			
			mvc: mvc,
			
			template: template,
			
			permissions: permissions,
			
			dom: mediator.dom,
			
			setBaseUrl: function(url) {
				baseUrl = url;
			},
			
			getBaseUrl: function() {
				return baseUrl;
			}
		}
		
		return Sushi.sandbox;
	}
);