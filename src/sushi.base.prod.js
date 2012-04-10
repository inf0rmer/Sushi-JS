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
	'sushi.utils.json',
	'sushi.mvc.model',
	'sushi.mvc.view',
	'sushi.mvc.collection',
	'sushi.mvc.router',
	'sushi.template',
	'sushi.$',
	'sushi.event',
	'sushi.error',
	'sushi.enumerable',
	'sushi.stores.RemoteStore',
	'sushi.ajax',
	'sushi.utils.performance',
  'sushi.utils.performance.worker'
	], 
	function(){
});
