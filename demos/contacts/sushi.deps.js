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
	'sushi.mvc.model',
	'sushi.mvc.view',
	'sushi.mvc.collection',
	'sushi.mvc.router',
	'sushi.stores.LocalStore',
	'sushi.utils.debug',
	'sushi.template'
	], 
	function(){
		return Sushi;
});