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
    	var root = this,
			previousSushi = {},
			$S = {},
			Sushi = {
    			VERSION: '0.0.5',
    						
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
	    		 * Simple extending (shallow copying) utility. 
	    		 *
	    		 * @method extend
	    		 * @param {Object} destination Object to copy properties to
	    		 * @param {Object} source Object to copy properties from
	    		 * @return {Object} Extended object
	    		 */
	    		extend: function(destination, source) {			
					for ( var property in source ) {
						destination[property] = source[property];
					}
								
					return destination;
	    		},
				/**
	    		 * noConflict utility. If by some reason, the Sushi's namespace must be used by some other object,
				 * this function will allow to remap the Sushi's namespace to another namespace
	    		 *
	    		 * @method noConflict
	    		 * @param {String} Mandatory. New Namespace where Sushi is going to live 
	    		 * @param {String} Optional. New Sugar syntax to shorthand the Sushi's namespace 
	    		 * @return {Object} Sushi Object
	    		 */
				noConflict: function(name, sugar){
					root[name] = Sushi;
					root.Sushi = previousSushi;
					
					if(sugar){
						root[sugar] = root[name];
					}
					
					return root[name];
				}
	    	};
	
    	// If window.Sushi is defined, merge params
    	if (root.Sushi) {
			previousSushi = root.Sushi;
    	}
	
    	// Sync global Sushi variable to namespaced one
    	root.Sushi = Sushi;
    	root.$S = root.Sushi;
    }
);