define(
    ['sushi.debug'],
    
    /**
	 * Defines several safe debugging methods
	 *
	 * @namespace Sushi.utils.debug
	 * @class IE
	 *	@extends Sushi.utils.debug
	 */
    function() {
		/**
		*	Forces IE to run it's Garbage Collector
		*/
		garbageCollect = function(){
			if (typeof(CollectGarbage) == "function"){
			    CollectGarbage();
			}
		}
		
		return {
			garbageCollect: garbageCollect
		};
    }
);