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
        	return reqwest(options);
        };
        
        Sushi.ajax = ajax;
        
        // Extend with facade API
        Sushi.extend(ajax, {       	
        	serialize: reqwest.serialize,
        	
        	serializeArray: reqwest.serializeArray,
        	
        	get: function(url, data, callback, type) {
        		if (!url) throw new SushiError('url is required');
        		
        		// Shift arguments if data is not present
        		if (utils.isFunction(data)) {
        			type = type || callback;
        			callback = data;
        			data = undefined;
        		}
        		
        		return Sushi.ajax({
        			url: url,
        			type: type,
        			data: data,
        			success: callback,
        			method: 'get'
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
        			type: 'json',
        			data: data,
        			success: callback,
        			method: 'get'
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
        			type: 'js',
        			data: data,
        			success: callback,
        			method: 'get'
        		});
        	},
        	
        	post: function(url, data, callback, type) {
        		if (!url) throw new SushiError('url is required');
        		
        		// Shift arguments if data is not present
        		if (utils.isFunction(data)) {
        			type = type || callback;
        			callback = data;
        			data = undefined;
        		}
        		
        		return Sushi.ajax({
        			url: url,
        			type: type,
        			data: data,
        			success: callback,
        			method: 'post'
        		});
        	}
        });
        
        return ajax;
 	}
 );
