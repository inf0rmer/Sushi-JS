define('sushi.utils.json',
	[
		'sushi.core', 
		'sushi.utils',
		'vendors/polyfills.json'
	],
	
	/**
	 * JSON handling functions
	 */
	function(Sushi, utils) {
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
		},
		
		_publicAPI = {
			parse: parse,
			stringify: stringify
		};
		
		Sushi.namespace('utils.json');
		Sushi.extend(Sushi.utils.json, _publicAPI);
		
		return _publicAPI;		
	}
);