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
	'sushi.core',
	'sushi.gfx',
	'sushi.gfx.flip',
	'sushi.gfx.cube'
	],
	window.runTests
);