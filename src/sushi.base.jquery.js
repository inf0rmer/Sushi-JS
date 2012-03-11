/**
 * Sushi JS
 * Copyright (C) 2011 Bruno Abrantes
 * MIT Licensed
 *
 * @namespace Sushi
 * @class base
 */
// require Sushi modules in requirejs format
require([
	'sushi.core', 
	'sushi.utils', 
	'sushi.utils.collection', 
	'sushi.utils.debug', 
	'sushi.utils.json',
	'sushi.$.jquery',
	'sushi.event',
	'sushi.error',
	'sushi.enumerable',
	'sushi.utils.performance',
	'sushi.utils.performance.worker'
	], 
	function(){
});