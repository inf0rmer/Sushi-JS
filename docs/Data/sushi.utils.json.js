define(
	['sushi.core', '../plugins/JSON', 'sushi.utils'],
	
	/**
	 * JSON handling functions
	 * @namespace Sushi.utils
	 * @class JSON
	 * @extends Sushi.utils
	 */
	function() {	
		/**
		 * Converts a JSON-formatted string into a Javascript literal object
		 *
		 * @param {String} string JSON-formatted string
		 * @return {Object} Well formatted JS literal
		 */
		var parse = function(string) {
			return window.JSON.parse(string);
		},
		
		/**
		 * Converts a Javascript literal object into a well formatted JSON string
		 *
		 * @param {Object} literal Literal Notated Javascript Object
		 * @return {String} Well formatted JSON string
		 */
		stringify = function(literal) {
			return window.JSON.stringify(literal);
		};
		
		Sushi.namespace('utils.JSON');
		
		Sushi.extend(Sushi.utils.JSON, {
			parse: parse,
			stringify: stringify
		});
		
	}
);