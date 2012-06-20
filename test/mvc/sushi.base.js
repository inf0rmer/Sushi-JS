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
	'sushi.mvc.collection.live',
	'sushi.mvc.router',
	'sushi.mvc.manager',
	'sushi.template',
	'sushi.utils.json'
	], 
	runTests
);