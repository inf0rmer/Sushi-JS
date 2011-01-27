define(
	['../plugins/JSON.js'],
	
	/**
	 * JSON handling functions
	 *
	 * @namespace Sushi.utils
	 * @class json
	 */
	function() {	
		/**
		 * Converts a JSON-formatted string into a Javascript literal object
		 *
		 * @return {Object} Well formatted JS literal
		 */
		var parse = function(string) {
			return window.JSON.parse(string);
		},
		
		/**
		 * Converts a Javascript literal object into a well formatted JSON string
		 *
		 * @return {String} Well formatted JSON string
		 */
		stringify = function(literal) {
			return window.JSON.stringify(literal);
		};
		
		return {
			parse: parse,
			stringify: stringify
		};
		
	}
);