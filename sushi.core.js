/**
 * Sushi Core
 * Copyright (C) 2011 Bruno Abrantes
 * MIT Licensed
 *
 * @module Sushi
 */


 // Defining a private namespace inside the closure
(function( window ) {
	// Set up global namespace and config
	var Sushi = {
		VERSION: '0.0.1',
		//modules to load
		uses: [
			'sushi.utils'
		],
		/**
		 * A utility that non-destructively defines namespaces
		 *
		 * @method namespace
		 * @param {String} Name of namespace to create
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
		}
	},
	// Set localized '$' var to jQuery for convenience
	$ = jQuery;
	
	// If window.Sushi is defined, merge params
	if (window.Sushi) {
		$.extend(Sushi, window.Sushi);
	}
	
	// Check if Sushi.uses is an array
	if (!$.isArray(Sushi.uses)) {
		throw new Error('Sushi.uses must be in array format.');
	}
	
	// Require library-wide dependencies, not in requirejs module format
	// TODO: move this to Sushi.plugins so we can load whatever plugins we wish
	require(['plugins/pubsub.js', 'plugins/mustache.js', 'plugins/Stateful.js'], function() {
		// require Sushi modules in requirejs format
		require(Sushi.uses, function(){
			
		});
	});    
	
	// Sync global Sushi variable to namespaced one
	window.Sushi = Sushi;
	
})( typeof window === 'undefined' ? this : window );