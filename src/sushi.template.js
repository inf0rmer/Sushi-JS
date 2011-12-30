/**
 * Sushi Template
 *
 * @module Sushi
 */
define(
	['sushi.core', 'plugins/handlebars'],

	function() {
		/**
		 * Sushi Template
		 *
		 * @namespace Sushi
		 * @class template
		 */
		Sushi.namespace('template');
		
		var compile = function(string) {
			return Handlebars.compile(string);
		}

		Sushi.extend(Sushi.template, {
			compile: compile
		});
	}
);