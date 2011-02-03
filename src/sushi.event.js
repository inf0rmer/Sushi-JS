/*
 * Sushi.events - Event management functions
 *
 */
 define(
 	// Module dependencies
 	['sushi.utils.collection'],

 	/**
 	 * Sushi Events
 	 *
 	 * @namespace Sushi
 	 * @class events
 	 */
 	function(pubsub) {
        Sushi.namespace('event');
        
 		Sushi.extend(Sushi.event, (function() {
    	    // the topic/subscription hash
        	var _cache = {},

            /**
             * Publish data on a named topic
             * 
             * Example:
             * Sushi.events.publish("/some/topic", ["a","b","c"]);
             *
             * @method publish
             * @param {String} topic The channel to publish on
             * @param {Array}  args  The data to publish. Each array item is converted into an ordered
     		 *		                 arguments on the subscribed functions.
     		 *
             */
        	publish = function(topic, args){
        		_cache[topic] && Sushi.utils.each(_cache[topic], function(callback){
        			callback.apply(Sushi.events, args || []);
        		});
        	},

            /**
             * Register a callback on a named topic
             *
             * Example:
             * Sushi.events.subscribe("/some/topic", function(a, b, c){ //handle data});
             *
             * @method subscribe
             * @param {String}   topic     The channel to subscribe to
             * @param {Function} callback  The handler event. Anytime something is Sushi.events.publish'ed on a 
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
             * var handle = Sushi.events.subscribe("/some/topic", function(a, b, c){ //handle data});
             * Sushi.events.unsubscribe(handle);
             *
             * @method unsubscribe
             * @param {Array} handle The return value from a Sushi.events.subscribe call
             *
             */
        	unsubscribe = function(handle){
        		var t = handle[0];
        		_cache[t] && Sushi.utils.each(_cache[t], function(idx){
        			if(this == handle[1]){
        				_cache[t].splice(idx, 1);
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