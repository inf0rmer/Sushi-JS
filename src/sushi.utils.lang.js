define('sushi.utils.lang',
	['sushi.core', 'sushi.utils'],

	/**
	 * Language handling functions
	 */
	function() {
		/**
		 * Converts every accented letter in a string with its non-accented equivalent.
		 * Currently WIP, trying to squeeze this function as much as possible. 
		 * (≈3ms per string, with 2 calls ≈ 1.5ms per call)
		 *
		 * @param {String} string with accented characters
		 * @return {String} string without accented characters in lower case
		 */
		var replaceAccents = (function() {
            var charList = /[àáâãçèéêìíîòóôõùúû]/gi,
            lookupTable = {
			    "à": "a", "á": "a",	"â": "a", "ã": "a",
    			"ç": "c", "è": "e",	"é": "e", "ê": "e",
    			"í": "i", "ì": "i",	"î": "i", "ó": "o",
    			"ò": "o", "ô": "o",	"õ": "o", "ù": "u",
    			"ú": "u", "û": "u",	"À": "A", "Á": "A",
    			"Â": "A", "Ã": "A",	"Ç": "C", "È": "E",
    			"É": "E", "Ê": "E",	"Í": "I", "Ì": "I",
    			"Î": "I", "Ó": "O",	"Ò": "O", "Ô": "O",
    			"Õ": "O", "Ù": "U",	"Ú": "U", "Û": "U" 
            };
		
            return function(s) {
                return s.replace(charList, function(match) { 
                    return lookupTable[match]; 
                });
		    };
		})(),
		
		camelCase = function(str) {
			return str.replace(/(\-[a-z])/g, function($1){return $1.toUpperCase().replace('-','');});
		},
		
		decamelize = function(str, delimiter) {
			delimiter = (delimiter === undefined) ? "_" : delimiter;
            return str.replace(/([A-Z])/g, delimiter + '$1').toLowerCase();
		},
		
		_publicAPI = {
			replaceAccents: replaceAccents,
			camelCase: camelCase,
			decamelize: decamelize
		};

		Sushi.extend(Sushi.utils, _publicAPI);
		
		return _publicAPI;
	}
);