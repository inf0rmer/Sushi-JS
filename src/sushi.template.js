/**
 * Sushi Template
 *
 * @module Sushi
 */
define('sushi.template',
	['sushi.core', 'vendors/handlebars'],

	function(Sushi) {
		/**
		 * Sushi Template
		 *
		 * @namespace Sushi
		 * @class template
		 */
		Sushi.namespace('template');
		
		var compile = function(string) {
			return Handlebars.compile(string);
		},
		
		registerHelper = function(name, fn) {
			return Handlebars.registerHelper(name, fn);
		}

		Sushi.extend(Sushi.template, {
			compile: compile,
			registerHelper: registerHelper,
			helpers: Handlebars.helpers
		});
		
		return Sushi.template;
	}
);