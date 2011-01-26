define(
    [],
    
    /**
	 * Defines several safe debugging methods
	 *
	 * @return {Object} Public debugging methods
	 */
    function() {	
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
		printHistory = function() {
		    log(_history);
		};
		
		return {
			log: log,
			warn: warn,
			error: error,
			dir: dir,
			printHistory: debugHistory
		};
    }
);