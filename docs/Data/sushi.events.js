/*
 * Sushi.Events - Event management functions
 *
 */
 define(
 	// Module dependencies
 	['sushi.events.pubsub'],

 	/**
 	 * Sushi Events
 	 *
 	 * @namespace Sushi
 	 * @class Events
 	 */
 	function(pubsub) {
        Sushi.namespace('events');
        
 		Sushi.extend(Sushi.events, pubsub);
 	}
 );