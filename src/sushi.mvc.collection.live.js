/*
 * Sushi.mvc.collection.live
 *
 */
 define('sushi.mvc.collection.live',
 	// Module dependencies
 	[
 		'sushi.core',
 		'sushi.utils',
 		'sushi.utils.collection',
 		'sushi.mvc.collection'
 	],

 	/**
 	 * Sushi mvc.collection.live
 	 *
 	 * @namespace Sushi
 	 * @class mvc.collection.live
 	 */
 	function(Sushi, utils, collectionUtils, Collection) {
		Sushi.namespace('LiveCollection');
        
		// Define a Backbone Collection handling the details of running a "live"
		// collection. Live collections are expected to handle fetching their own
		// data, rather than being composed from separate models.
		// They typically add new models instead of resetting the collection.
		// A custom add comparison makes sure that duplicate models are not
		// added. End result: only new elements will be added, instead
		// of redrawing the whole collection.
		//
		//    myCollection.fetch({ diff: true }); // adds and avoids duplicates
		//    myCollection.fetch(); // resets
		//
		// Thanks to this Bocoup article:
		// <http://weblog.bocoup.com/backbone-live-collections>
		var LiveCollection = new Sushi.Class(Collection, {
			constructor: function(models, options) {
				LiveCollection.Super.call(this, models, options);
			},
			
			// A specialized fetch that can add new models and remove
			// outdated ones. Models in response that are already in the
			// collection are left alone. Usage:
			//
			//    myCollection.fetch({ diff: true });
			fetch: function (options) {
			  options = options || {};
			  
			  if (options.diff) {
				var success = options.success,
					prune = utils.bind(this.prune, this);
			  
				// Add new models, rather than resetting.
				options.add = true;
				
				// Wrap the success callback, adding a pruning
				// step after fetching.
				options.success = function (collection, resp) {
				  prune(collection, resp);
				  if (success) success(collection, resp);
				};
			  }
			  
			  // Delegate to original fetch method.
			  LiveCollection.Super.prototype.fetch.call(this, options);
			},
			
			// A custom add function that can prevent models with duplicate IDs
			// from being added to the collection. Usage:
			// 
			//    myCollection.add({ unique: true });
			add: function(models, options) {
			  var modelsToAdd = models;
			  
			  // If a single model is passed in, convert it to an
			  // array so we can use the same logic for both cases
			  // below.
			  if (!utils.isArray(models)) models = [models];
			  
			  options = Sushi.extend({
				unique: true
			  }, options);
			  
			  // If unique option is set, don't add duplicate IDs.
			  if (options.unique) {
				modelsToAdd = [];
				collectionUtils.each(models, function(model) {
				  if ( utils.isUndefined( this.get(model.id) ) ) {
					modelsToAdd.push(model);
				  }
				}, this);
			  }
			
			  return LiveCollection.Super.prototype.add.call(this, modelsToAdd, options);
			},
			
			// Weed out old models in collection, that are no longer being returned
			// by the endpoint. Typically used as a callback for this.fetch's
			// success option.
			prune: function (collection, resp) {
			  // Process response -- we get the raw
			  // results directly from Backbone.sync.
			  var parsedResp = this.parse(resp),
				  modelToID = function (model) { return model.id; },
				  respIDs, collectionIDs, oldModels;
			  
			  // Convert array of JSON model objects to array of IDs.
			  respIDs = collectionUtils.map(parsedResp, modelToID);
			  collectionIDs = collectionUtils.map(collection.toJSON(), modelToID);
			  
			  // Find the difference between the two...
			  oldModels = collectionUtils.difference(collectionIDs, respIDs);
			  
			  // ...and remove it from the collection
			  // (remove can take IDs or objects).
			  collection.remove(oldModels);
			},
			
			// Poll this collection's endpoint.
			// Options:
			// 
			// * `interval`: time between polls, in milliseconds.
			// * `tries`: the maximum number of polls for this stream.
			stream: function(options) {
			  var polledCount = 0;
			  
			  // Cancel any potential previous stream.
			  this.unstream();
			  
			  var update = utils.bind(function() {
				// Make a shallow copy of the options object.
				// `Backbone.collection.fetch` wraps the success function
				// in an outer function (line `527`), replacing options.success. 
				// That means if we don't copy the object every poll, we'll end 
				// up modifying the reference object and creating callback inception.
				// 
				// Furthermore, since the sync success wrapper
				// that wraps and replaces options.success has a different arguments
				// order, you'll end up getting the wrong arguments.
				var opts = collectionUtils.clone(options);
				
				if (!opts.tries || polledCount < opts.tries) {
				  polledCount = polledCount + 1;
				  
				  this.fetch(opts);
				  this.pollTimeout = setTimeout(update, opts.interval || 1000);
				}
			  }, this);
			
			  update();
			},
			
			// Stop polling.
			unstream: function() {
			  clearTimeout(this.pollTimeout);
			  delete this.pollTimeout;
			},
			
			isStreaming : function() {
			  return utils.isUndefined(this.pollTimeout);
			}
		});
		
		Sushi.LiveCollection = LiveCollection;
        
        return LiveCollection;
 	}
 );
