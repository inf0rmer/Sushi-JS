/*
 * Sushi.stores.RemoteStore
 *
 */
 define('sushi.stores.RemoteStore',
 	// Module dependencies
 	[
 		'sushi.core',
 		'sushi.utils',
 		'sushi.Store',
 		'sushi.stores',
 		'sushi.utils.json',
 		'sushi.error',
 		'sushi.ajax'
 	],

 	/**
 	 * Sushi stores.RemoteStore
 	 *
 	 * @namespace Sushi
 	 * @class stores.RemoteStore
 	 */
 	function(Sushi, utils, Store, SushiStores, JSON, SushiError, AJAX) {
        var RemoteStore
        , 	methodMap
        ,	getUrl = function(object) {
				if (!(object && object.url)) return null;
				return utils.isFunction(object.url) ? object.url() : object.url;
			}
		,	urlError = function() {
				throw new SushiError('A "url" property or function must be specified');
			}

        methodMap = {
			'create': 'POST',
			'update': 'PUT',
			'delete': 'DELETE',
			'read'  : 'GET'
		};

        RemoteStore = new Sushi.Class(Store, {
        	constructor: function(name) {
        		RemoteStore.Super.call(this, name || 'RemoteStore');
        	},

        	emulateJSON: false,

        	emulateHTTP: false
        });

        Sushi.extendClass(RemoteStore, {
        	sync: function(method, model, options) {
        		var type,
					params,
					lastXHR = model._lastXHR && model._lastXHR[method];

				if ((lastXHR && lastXHR.state && lastXHR.state() === 'pending') && (options && options.safe !== false))
					lastXHR.abort();

				if (!model._lastXHR)
					model._lastXHR = {};

        		type = methodMap[method]

        		// Default request options
        		params = Sushi.extend({}, {
					type: type,
					dataType: 'json'
				}, options);

				// Ensure there's a URL
				if (!params.url) {
					params.url = getUrl(model) || urlError();
				}

				// Ensure that we have the appropriate request data.
				if (!params.data && model && (method == 'create' || method == 'update')) {
				  	params.contentType = 'application/json';
				  	params.data = JSON.stringify(model.toJSON());
				}

				// For older servers, emulate JSON by encoding the request into an HTML-form.
				if (this.emulateJSON) {
				  	params.contentType = 'application/x-www-form-urlencoded';
				  	params.data        = params.data ? {model : params.data} : {};
				}

				if (this.emulateHTTP) {
				  	if (type === 'PUT' || type === 'DELETE') {
						if (this.emulateJSON) params.data._method = type;
							params.type = 'POST';
							params.beforeSend = function(xhr) {
							xhr.setRequestHeader('X-HTTP-Method-Override', type);
						};
				  	}
				}

				// Don't process data on a non-GET request.
				if (params.type !== 'GET' && ! this.emulateJSON) {
					params.processData = false;
				}

				return model._lastXHR[method] = AJAX(params);
			}
        });

        Sushi.extend(SushiStores, {RemoteStore: RemoteStore});

        // Automatically set a RemoteStore as the default Sushi Store
        SushiStores.def = new RemoteStore();

        return RemoteStore;
 	}
 );
