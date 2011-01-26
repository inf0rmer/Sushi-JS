/*
 * Sushi.utils - General purpose utility functions for the Sushi JS framework
 *
 * @namespace Sushi
 * @class utils
 */
define(
	// Module dependencies
	[],
	
	function() {
		Sushi.namespace('utils');
		
		/**
		 * Defines several safe debugging methods
		 *
		 * @return {Object} Public debugging methods
		 */
		var debug = (function() {			
			// Cached logging history
			var _history = [],
			
			/**
			 * Returns the debugging methods the environment supports
			 *
			 * @return {Object} Supported debugging methods
			 */
			_supports = (function(){
				return {
					log: window.console.log || false,
					warn: window.console.warn || false,
					error: window.console.error || false,
					dir: window.console.dir || false
				}
			})(),
			
			// Local ref for easy converting to real arrays
			_slice = Array.prototype.slice,
			
			/**
			 * Logs comma-separated arguments to the console using console.log()
			 *
			 * @param Value to be logged
			 */
			log = function() {
				// Turn the arguments object into a real array
				var args = _slice.call(arguments);
				
			    if (_supports.log) {
			    	for (var i = 0, len = args.length; i < len; i++) {
			    		_history.push(args[i]);
						console.log(args[i]);
					}
			    }
			},
			
			/**
			 * Logs comma-separated arguments to the console using console.error()
			 *
			 * @param Value to be logged
			 */
			error = function() {
				// Turn the arguments object into a real array
				var args = _slice.call(arguments);
				
			    if (_supports.error) {
			    	for (var i = 0, len = args.length; i < len; i++) {
			    		_history.push(args[i]);
						console.error(args[i]);
					}
			    }
			},
			
			/**
			 * Logs comma-separated arguments to the console using console.warn()
			 *
			 * @param Value to be logged
			 */
			warn = function() {
				// Turn the arguments object into a real array
				var args = _slice.call(arguments);
				
			    if (_supports.warn) {
			    	for (var i = 0, len = args.length; i < len; i++) {
			    		_history.push(args[i]);
						console.warn(args[i]);
					}
			    }
			},
			
			/**
			 * Logs comma-separated arguments to the console using console.dir()
			 *
			 * @param Value to be logged
			 */
			dir = function() {
				// Turn the arguments object into a real array
				var args = _slice.call(arguments);
				
			    if (_supports.dir) {
			    	for (var i = 0, len = args.length; i < len; i++) {
			    		_history.push(args[i]);
						console.dir(args[i]);
					}
			    }
			}
			
			return {
				log: log,
				warn: warn,
				error: error,
				dir: dir
			}
		})();
		
		// Extend Sushi.utils with the temporary debug object
		$.extend(Sushi.utils, debug);
		debug = null;
	}
);