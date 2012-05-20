/*
 * Sushi.browser
 *
 * Because sometimes life is evil, we need to write browser-specific code.
 * Avoid at all costs! Sushi.support is a much better (and hipper!) alternative.
 *
 */
 define('sushi.browser',
 	// Module dependencies
 	[
 		'sushi.core'
 	],

 	/**
 	 * Sushi browser
 	 *
 	 * @namespace Sushi
 	 * @class browser
 	 */
 	function(Sushi) {
        Sushi.namespace('browser', Sushi);
        Sushi.namespace('uaMatch', Sushi);
        
        var browser = {},
        	// Useragent RegExp
        	rwebkit = /(webkit)[ \/]([\w.]+)/,
			ropera = /(opera)(?:.*version)?[ \/]([\w.]+)/,
			rmsie = /(msie) ([\w.]+)/,
			rmozilla = /(mozilla)(?:.*? rv:([\w.]+))?/,
			// Keep a UserAgent string for use with Sushi.browser
			userAgent = navigator.userAgent,
		
			// For matching the engine and version of the browser
			browserMatch,
			
			uaMatch = function( ua ) {
				ua = ua.toLowerCase();
		
				var match = rwebkit.exec( ua ) ||
					ropera.exec( ua ) ||
					rmsie.exec( ua ) ||
					ua.indexOf("compatible") < 0 && rmozilla.exec( ua ) ||
					[];
		
				return { browser: match[1] || "", version: match[2] || "0" };
			};

        
        browserMatch = uaMatch( userAgent );
		if ( browserMatch.browser ) {
			browser[ browserMatch.browser ] = true;
			browser.version = browserMatch.version;
		}
		
		Sushi.browser = browser;
		Sushi.uaMatch = uaMatch;
        
        return browser;
 	}
 );
