/**
 * Sushi JS
 * Copyright (C) 2011 Bruno Abrantes
 * MIT Licensed
 *
 * @namespace Sushi
 * @class base
 */
// Require library-wide dependencies, not in requirejs module format
require([], function() {
	// require Sushi modules in requirejs format
	require(['sushi.core', 'sushi.utils', 'sushi.events'], function(){
	});
});