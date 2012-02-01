define('sushi.utils.debug',
    ['sushi.core', 'sushi.utils'],
    
    /**
	 * Defines several safe debugging methods
	 */
    function(Sushi, utils) {
		// Cached logging history
		var _history = [],
		
		/**
		 * Returns the debugging methods the environment supports
		 *
		 * @returns {Object} Supported debugging methods
		 */
		_supports = (function(){
			return {
				log: window.console.log || false,
				warn: window.console.warn || false,
				error: window.console.error || false,
				dir: window.console.dir || false
			};
		})(),
		
		// Local ref for easy converting to real arrays
		_slice = Array.prototype.slice,
		
		/**
		 * Logs comma-separated arguments to the console using console.log()
		 *
		 * @param Values to be logged
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
		 * @param Values to be logged
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
		 * @param Values to be logged
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
		 * @param Values to be logged
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
		},
		
		/**
		 * Prints the whole cached debug history to the console
		 *
		 */
		logHistory = function() {
		    log(_history);
		},
		
		_publicAPI = {
			log: log,
			warn: warn,
			error: error,
			dir: dir,
			logHistory: logHistory
		};
		
		Sushi.extend(Sushi, _publicAPI);
		
		return _publicAPI;
    }
);