/*
 * Sushi.naturalize
 *
 */
 define('sushi.naturalize',
 	// Module dependencies
 	[
 		'sushi.core'
 	],

 	/**
 	 * Sushi naturalize
 	 *
 	 * @namespace Sushi
 	 * @class naturalize
 	 */
 	function(Sushi) {
        Sushi.namespace('naturalize', Sushi);
        
        // Helpers
        
        var _numberFormat = function( number, decimals, dec_point, thousands_sep ) {
			// http://kevin.vanzonneveld.net
			// +   original by: Jonas Raoni Soares Silva (http://www.jsfromhell.com)
			// +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
			// +	 bugfix by: Michael White (http://crestidg.com)
			// +	 bugfix by: Benjamin Lupton
			// +	 bugfix by: Allan Jensen (http://www.winternet.no)
			// +	revised by: Jonas Raoni Soares Silva (http://www.jsfromhell.com)	
			// *	 example 1: number_format(1234.5678, 2, '.', '');
			// *	 returns 1: 1234.57	 
		 
			var n = number, c = isNaN(decimals = Math.abs(decimals)) ? 2 : decimals,
				d = dec_point == undefined ? "," : dec_point,
				t = thousands_sep == undefined ? "." : thousands_sep, s = n < 0 ? "-" : "",
				i = parseInt(n = Math.abs(+n || 0).toFixed(c)) + "", j = (j = i.length) > 3 ? j % 3 : 0;
		 
			return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
		},
		
		// Public API
		
		/**
		 * Converts a big integer to a friendly text representation. Works best for numbers above 1 million.
		 * 
		 * @param {Number} number
		 * @param {Object} strings Optional object containing translated strings
		 *
		 * @return {String}
		 */
		intToWord = function( number, strings ) {
			defaults = {
				hundred: 'hundred',
				thousand: 'thousand',
				hundredThousand: 'hundred thousand',
				million: 'million',
				billion: 'billion',
				trillion: 'trillion'
			}
			
			if (strings === undefined) {
				strings = {}
			}
			
			strings = Sushi.extend( strings, defaults );
			
			number = parseInt( number );
			if( number < 1000000 ) {
				return number;
			} else if( number < 100 ) {
				return separateNumber(number, 1 );
			} else if( number < 1000 ) {
				return separateNumber( number / 100, 1 ) + " " + strings.hundred;
			} else if( number < 100000 ) {
				return separateNumber( number / 1000.0, 1 ) + " " + strings.thousand;
			} else if( number < 1000000 ) {
				return separateNumber( number / 100000.0, 1 ) + " " + strings.hundredThousand;
			} else if( number < 1000000000 ) {
				return separateNumber( number / 1000000.0, 1 ) + " " + strings.million;
			} else if( number < 1000000000000 ) { //senseless on a 32 bit system probably.
				return separateNumber( number / 1000000000.0, 1 ) + " " + strings.billion;
			} else if( number < 1000000000000000 ) {
				return separateNumber( number / 1000000000000.0, 1 ) + " " + strings.trillion;
			} 
			return "" + number;	// too big.
		},

		
		/**
		 * Converts an integer to a string containing a separator character every three digits.
		 * 
		 * @param {Number} number
		 * @param {Number} decimals Number of decimal cases
		 * @param {String} decimalsSeparator Separator character for decimals
		 * @param {String} thousandsSeparator Separator character for thousands
		 *
		 * @return {String}
		 */
		separateNumber = function( number, decimals, decimalsSeparator, thousandsSeparator ) {
			decimals = (decimals === undefined) ? 0 : decimals;
			thousandsSeparator = (thousandsSeparator != undefined) ? thousandsSeparator: ',';
			decimalsSeparator = (decimalsSeparator != undefined) ? decimalsSeparator: '.';
			
			return _numberFormat( number, decimals, decimalsSeparator, thousandsSeparator );
		},
		
		/*
		 * For numbers 1-9, returns the number spelled out. Otherwise, returns the number.
		 * 
		 * @param {Number} n
		 * @param {Array} strings Array of number words
		 *
		 * @return {String}
		 */
		numberToWord = function( n, strings ) {
			var strings = (strings != undefined) ? strings : [ 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine' ],
			result = strings[ parseInt( n ) -1 ];
			
			return result !== undefined ? result : n;
		},
		
		/**
		 * Converts an integer to its ordinal as a string.
		 *
		 * @param {Number|String} Number to convert
		 *
		 * @return {String} Converted number
		 */
		ordinal = function( value ) {
			var number = parseInt( value ),
				specialCase,
				leastSignificant,
				end;
			
			if( number === 0 ) {
				return value; 	// could be a bad string or just a 0.
			}
		
			specialCase = number % 100;
			if ( specialCase === 11 || specialCase === 12 || specialCase === 13) {
				return number + "th";
			}
		
			leastSignificant = number % 10;
			end = '';
			
			switch( leastSignificant ) {
				case 1:
					end = "st";
				break;
				case 2: 
					end = "nd";
				break;
				case 3:
					end = "rd";
				break;
				default:
					end = "th";
				break;
			}	
			return number + end;
		},
		
		/*
         * Formats the value like a 'human-readable' file size (i.e. '13 KB', '4.1 MB', '102 bytes', etc).
         *
         * Example: formatFileSize(123456789) -> 117.7 MB
         *
         * @param {Number} File size in bytes
         *
         * @return {String}
         */
        formatFileSize = function(filesize) {
			if (filesize >= 1073741824) {
				 filesize = _numberFormat(filesize / 1073741824, 2, '.', '') + ' GB';
			} else { 
				if (filesize >= 1048576) {
					filesize = _numberFormat(filesize / 1048576, 2, '.', '') + ' MB';
			} else { 
					if (filesize >= 1024) {
					filesize = _numberFormat(filesize / 1024, 0) + ' KB';
				} else {
					filesize = _numberFormat(filesize, 0) + ' bytes';
					};
				};
			};
			return filesize;
		},
        
        /**
		 * Returns a plural suffix if the value is not 1. By default, this suffix is 's'.
		 *
		 * @method pluralize
		 * @param {Number} number Number of items
		 * @param {String} pluralSuffix Suffix to use when pluralizing
		 * @param {String} singularSuffix Suffix to use if the singular doesn't use a simple prefix (e.g cherr(y) and cherr(ies))
		 *
		 * @return {String} Pluralized string
		 */
        pluralize = function( number, pluralSuffix, singularSuffix ) {
			var singular = '', plural = 's';
			if ( singularSuffix !== undefined ) {
				singular = singularSuffix;
				plural = pluralSuffix;
			} else if ( pluralSuffix !== undefined ) {
				plural = pluralSuffix;
			}
			
			return parseInt( number ) === 1 ? singular : plural;
		},
        
        /**
		 * Truncates a string if it is longer than the specified number of characters. Truncated strings will end with a translatable ellipsis sequence ("…").
		 *
		 * @method truncateChars
		 * @param {String} string String to truncate
		 * @param {Number} length Number of characters to truncate after
		 *
		 * @return {String} Truncated string
		 */
		truncateChars = function( string, length ) {
			if ( string.length > length ) {
				return string.substr( 0,length -1 ) + '…';
			} else {
				return string;
			}
		},
        
    	/**
		 * Truncates a string after a certain number of words.
		 * Newlines within the string will be removed.
		 *
		 * @method truncateWords
		 * @param {String} string String to truncate
		 * @param {Number} length Number of words to truncate after
		 *
		 * @return {String} Truncated string
		 */
		truncateWords = function( string, length ) {
			var array = string.split( ' ' );
			var result = '';
			for ( var i = 0; i < length; i++ ) {
				if ( array[ i ] === undefined) {
					break;
				}
				result += array[ i ];
				result += ' ';
			}
			if ( array.length > length ) {
				result += '…';
			}
			return result;
		};
		
		Sushi.extend(Sushi.naturalize, {
			truncateWords: truncateWords,
			truncateChars: truncateChars,
			formatFileSize: formatFileSize,
			pluralize: pluralize,
			ordinal: ordinal,
			numberToWord: numberToWord,
			separateNumber: separateNumber,
			intToWord: intToWord
		});
        
        return Sushi.naturalize;
        
        return Sushi.naturalize;
 	}
 );
