/*
 * Sushi.events - Event management functions
 *
 */
 define(
 	// Module dependencies
 	['sushi.events.pubsub'],

 	/**
 	 * Sushi Events
 	 *
 	 * @namespace Sushi
 	 * @class events
 	 */
 	function(pubsub) {
        Sushi.namespace('events');
        
 		Sushi.extend(Sushi.events, pubsub);
 	}
 );