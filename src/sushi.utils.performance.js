define('sushi.utils.performance',
	['sushi.core', 'sushi.utils'],
	
	/**
	 * Performance utility functions
	 *
	 * @namespace Sushi
	 * @class utils
	 */
	function() {
		var utils = Sushi.namespace('utils'),
		
		/*
	     * Creates and returns a throttled version of the passed-in function. When invoked repeatedly, 
	     * the actual function will only be called once per every wait milliseconds.
	     *
	     * @method throttle
	     * @param func {Function} Function to throttle
	     * @param wait {Number} Wait time in milliseconds
	     *
	     * @return {Function} Throttled function
	     */
		throttle = function(func, wait) {
    		var context, args, timeout, throttling, more;
    		var whenDone = debounce(function(){ more = throttling = false; }, wait);
    		
    		return function() {
      			context = this; args = arguments;
      			var later = function() {
        			timeout = null;
        			if (more) func.apply(context, args);
        			whenDone();
      			};
      			
      			if (!timeout) timeout = setTimeout(later, wait);
      			if (throttling) {
        			more = true;
      			} else {
        			func.apply(context, args);
      			}
      			whenDone();
      			throttling = true;
    		};
  		},
  		
  		/*
	     * Creates and returns a debounced version of the passed-in function. 
	     * The actual function's execution will be postponed until after wait milliseconds have elapsed.
	     *
	     * @method debounce
	     * @param func {Function} Function to debounce
	     * @param wait {Number} Wait time in milliseconds
	     *
	     * @return {Function} Debounced function
	     */
  		debounce = function(func, wait) {
			var timeout;
			return function() {
		  		var context = this, args = arguments;
		  		var later = function() {
					timeout = null;
					func.apply(context, args);
		  		};
		  		clearTimeout(timeout);
		  		timeout = setTimeout(later, wait);
			};
	  	};
		
		
		Sushi.extend(utils, {
			throttle: throttle,
			debounce: debounce
		});
		
	}
);