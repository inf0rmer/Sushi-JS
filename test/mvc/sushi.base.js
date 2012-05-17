/**
 * Sushi JS
 * Copyright (C) 2011 Bruno Abrantes
 * MIT Licensed
 *
 * @namespace Sushi
 * @class base
 */
// require Sushi modules in requirejs format
require.config({
	baseUrl: '../../src'
});

require([
	'sushi.mvc.model',
	'sushi.mvc.view',
	'sushi.mvc.view.bindings',
	'sushi.mvc.collection',
	'sushi.mvc.router',
	'sushi.template',
	'sushi.utils.json'
	], 
	function(){
});