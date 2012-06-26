/*
 * Sushi.ajax
 *
 */
define('sushi.ajax',
        // Module dependencies
        [
                'sushi.core',
                'sushi.error',
                'sushi.utils',
                'vendors/reqwest'
        ],

	/**
	 * Sushi ajax
	 *
	 * @namespace Sushi
	 * @class ajax
	 */
	function(Sushi, SushiError, utils, reqwest) {
		Sushi.namespace('ajax', Sushi);
		
		var ajax = function(options) {
			// Convert to jquery-like API
			options.method = options.type;
			options.type = options.dataType;
			
			return reqwest(options);
		};
		
		Sushi.ajax = ajax;
		
		// Extend with facade API
		Sushi.extend(ajax, {
			serialize: reqwest.serialize,
			
			serializeArray: reqwest.serializeArray,
			
			get: function(url, data, callback, dataType) {
				if (!url) throw new SushiError('url is required');
				
				// Shift arguments if data is not present
				if (utils.isFunction(data)) {
					dataType = dataType || callback;
					callback = data;
					data = undefined;
				}
				
				return Sushi.ajax({
					url: url,
					dataType: dataType,
					data: data,
					success: callback,
					type: 'get'
				});
			},
			
			getJSON: function(url, data, callback) {
				if (!url) throw new SushiError('url is required');
				
				// Shift arguments if data is not present
				if (utils.isFunction(data)) {
					callback = data;
					data = undefined;
				}
				
				return Sushi.ajax({
					url: url,
					dataType: 'json',
					data: data,
					success: callback,
					type: 'get'
				});
			},
			
			getScript: function(url, data, callback) {
				if (!url) throw new SushiError('url is required');
				
				// Shift arguments if data is not present
				if (utils.isFunction(data)) {
					callback = data;
					data = undefined;
				}
				
				return Sushi.ajax({
					url: url,
					dataType: 'js',
					data: data,
					success: callback,
					type: 'get'
				});
			},
			
			post: function(url, data, callback, dataType) {
				if (!url) throw new SushiError('url is required');
				
				// Shift arguments if data is not present
				if (utils.isFunction(data)) {
					dataType = dataType || callback;
					callback = data;
					data = undefined;
				}
				
				return Sushi.ajax({
					url: url,
					dataType: dataType,
					data: data,
					success: callback,
					type: 'post'
				});
			}
		});
		
		return ajax;
	}
 );
