define(
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
		var querystring = function (name) {
		   var tmp = ( location.search.substring(1) ),
		   i = tmp.toUpperCase().indexOf(name.toUpperCase()+"=");
		
		   if ( i >= 0 ) {
			  tmp = tmp.substring( name.length+i+1 );
			  i = tmp.indexOf("&");
			  return unescape( tmp = tmp.substring( 0, (i>=0) ? i : tmp.length ));
		   }
		   return("");
		}
		
				

		Sushi.extend(Sushi.utils, {
			querystring: querystring
		});
	}
);