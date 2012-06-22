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
	'sushi.ui.tooltip',
	'sushi.ui.modal',
	'sushi.ui.dropdown',
	'sushi.ui.popover',
	'sushi.ui.tab',
	'sushi.ui.alert',
	'sushi.ui.button',
	'sushi.ui.collapse',
	'sushi.ui.carousel',
	'sushi.ui.typeahead',
	'sushi.ui.scrollspy',
	'sushi.ui.listable',
	'sushi.ui.notifier',
	'sushi.ui.scrollable'
	],
	function(Sushi) {
		window.runTests(Sushi);
	}
);