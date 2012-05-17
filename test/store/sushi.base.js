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
	'sushi.mvc.collection',
	'sushi.stores.LocalStore',
	'sushi.stores.RemoteStore',
	'sushi.Enumerable'
	], 
	function(){
});