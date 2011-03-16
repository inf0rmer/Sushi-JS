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
	require(['sushi.core', 'sushi.campus', 'sushi.utils', 'sushi.utils.collection', 'sushi.utils.debug', 'sushi.utils.json', 'sushi.utils.lang', 'sushi.event', 'sushi.utils.HTML5'], function(){});
});