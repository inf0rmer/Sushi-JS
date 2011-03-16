/**
 * Sushi Core
 *
 * @module Sushi
 */
define(
    [],
    
	/**
	 * Sushi Core
	 *
	 * @namespace Sushi
	 * @class core
	 */
    function() {
    	var $s = Sushi = {
    		VERSION: '0.0.5',
    		_nativeExtend = Object.create,
				
    		/**
    		 * A utility that non-destructively defines namespaces
    		 *
    		 * @method namespace
    		 * @param {String} namespaceString Name of namespace to create
    		 * @return {Object} Namespaced object
    		 */
    		namespace: function(namespaceString) {
    			var parts = namespaceString.split('.'),
    				parent = Sushi,
    				i;
			
    			// Strip redundant leading global
    			if (parts[0] === 'Sushi') {
    				parts = parts.slice(1);
    			}
			
    			for (i = 0, len = parts.length; i < len; i+=1) {
    				// Create a property if it doesn't exist
    				if (typeof parent[parts[i]] === 'undefined') {
    					parent[parts[i]] = {};
    				}
    				parent = parent[parts[i]];
    			}
			
    			return parent;			
    		},
		
    		/**
    		 * Simple extending (shallow copying) utility. Delegates to 
    		 * native Object.create() if available.
    		 *
    		 * @method extend
    		 * @param {Object} destination Object to copy properties to
    		 * @param {Object} source Object to copy properties from
    		 * @return {Object} Extended object
    		 */
    		extend: function(destination, source) {
    		    if (_nativeExtend) {
    		        return Object.create({destination}, source);
    		    }
    		    
    		    for ( var property in source ) {
        			destination[property] = source[property];
        		}
        		return destination;
    		}
    	};
	
    	// If window.Sushi is defined, merge params
    	if (window.Sushi) {
    		Sushi.extend(Sushi, window.Sushi);
    	}
	
    	// Sync global Sushi variable to namespaced one
    	window.Sushi = Sushi;
    	window.$S = Sushi;
    }
);