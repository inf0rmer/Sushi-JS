/*
 * Sushi.support.transition
 * 
 * CSS transition support (http://www.modernizr.com)
 *
 */
define('sushi.support.transition',
 	// Module dependencies
 	[
 		'sushi.core',
 		'sushi.support'
 	],

 	/**
 	 * Sushi support.transition
 	 *
 	 * @namespace Sushi
 	 * @class support.transition
 	 */
 	function(Sushi, support) {
 		
 		support.transition = (function () {

		  	var transitionEnd = (function () {
	
				var el = document.createElement('bootstrap')
					, transEndEventNames = {
						   'WebkitTransition' : 'webkitTransitionEnd'
						,  'MozTransition'    : 'transitionend'
						,  'OTransition'      : 'oTransitionEnd'
						,  'msTransition'     : 'MSTransitionEnd'
						,  'transition'       : 'transitionend'
					}
				  	, name
		
				for (name in transEndEventNames) {
					if (el.style[name] !== undefined) {
						return transEndEventNames[name]
					}
				}
			}());
	
			return transitionEnd && {
				end: transitionEnd
			}
		})();
        
        return support;
 	}
);
