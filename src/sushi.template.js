/**
 * Sushi Template
 *
 * @module Sushi
 */
define(
	['sushi.core', 'vendors/handlebars'],

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