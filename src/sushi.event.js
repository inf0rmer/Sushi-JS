/*
 * Sushi.event - Event management functions
 *
 */
 define('sushi.event',
 	// Module dependencies
 	['sushi.core', 'sushi.utils.collection'],

 	/**
 	 * Sushi Events
 	 *
 	 * @namespace Sushi
 	 * @class events
 	 */
 	function(pubsub) {
        Sushi.namespace('pubsub');
        Sushi.namespace('Events');
        
        Sushi.extend(Sushi.Events, {
        	bind : function(ev, callback, context) {
			  	var calls = this._callbacks || (this._callbacks = {}),
			  	list  = calls[ev] || (calls[ev] = []);
			  	list.push([callback, context]);
			  	return this;
			},
			unbind : function(ev, callback) {
			  	var calls;
			  	if (!ev) {
					this._callbacks = {};
			  	} else if (calls = this._callbacks) {
					if (!callback) {
				 		calls[ev] = [];
					} else {
				  		var list = calls[ev];
				  		if (!list) return this;
				  		
				  		for (var i = 0, l = list.length; i < l; i++) {
							if (list[i] && callback === list[i][0]) {
					  			list[i] = null;
					  			break;
							}
				  		}
					}
			  	}
			  	return this;
			},
			
			trigger : function(eventName) {
			  	var list, calls, ev, callback, args,
			  	both = 2;
			  	
			  	if (!(calls = this._callbacks)) return this;
			  		
			  		while (both--) {
						ev = both ? eventName : 'all';
						if (list = calls[ev]) {
				  			for (var i = 0, l = list.length; i < l; i++) {
								if (!(callback = list[i])) {
					  				list.splice(i, 1); i--; l--;
								} else {
					  				args = both ? Array.prototype.slice.call(arguments, 1) : arguments;
					  				callback[0].apply(callback[1] || this, args);
								}
				  			}
						}
			  		}
			  	return this;
			}
        });
        
 		Sushi.extend(Sushi.pubsub, (function() {
    	    // the topic/subscription hash
        	var _cache = {},

            /**
             * Publish data on a named topic
             * 
             * Example:
             * Sushi.pubsub.publish("/some/topic", "a","b","c");
             *
             * @method publish
             * @param {String} topic The channel to publish on
     		 *
             */
        	publish = function(topic){
        		args = Array.prototype.slice.call(arguments, 1);
        		_cache[topic] && Sushi.utils.each(_cache[topic], function(callback){
        			callback.apply(Sushi.pubsub, args || []);
        		});
        	},

            /**
             * Register a callback on a named topic
             *
             * Example:
             * Sushi.pubsub.subscribe("/some/topic", function(a, b, c){ //handle data});
             *
             * @method subscribe
             * @param {String}   topic     The channel to subscribe to
             * @param {Function} callback  The handler event. Anytime something is Sushi.pubsub.publish'ed on a 
     		 *		                       subscribed channel, the callback will be called with the
     		 *		                       published array as ordered arguments.
     		 * 
     		 * @return {Array} A handle which can be used to unsubscribe this particular subscription
             */
        	subscribe = function(topic, callback){
         		if(!_cache[topic]){
        			_cache[topic] = [];
        		}
        		_cache[topic].push(callback);
        		return [topic, callback];
        	},

            /**
             * Disconnect a subscribed function for a topic
             * Example:
             * var handle = Sushi.pubsub.subscribe("/some/topic", function(a, b, c){ //handle data});
             * Sushi.pubsub.unsubscribe(handle);
             *
             * @method unsubscribe
             * @param {Array} handle The return value from a Sushi.pubsub.subscribe call
             *
             */
        	unsubscribe = function(handle){
        		var t = handle[0];
        		_cache[t] && Sushi.utils.each(_cache[t], function(idx){
        			if(this == handle[1]){
        				_cache[t].slice(idx, 1);
        			}
        		});
        	};

        	return {
        	    publish: publish,
        	    subscribe: subscribe,
        	    unsubscribe: unsubscribe
        	};
        })());
 	}
 );