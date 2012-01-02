/*
 * Sushi CoreData - smart data management lib
 *
 */
 define('sushi.CoreDataObject',
 	// Module dependencies
 	[
		'sushi.core',
		'sushi.event',
		'sushi.utils'
	],

 	/**
 	 * Sushi CoreData
 	 *
 	 * @namespace Sushi
 	 * @class coreData
 	 */
 	function() {
        Sushi.namespace('CoreDataObject');

		Sushi.CoreDataObject = function(value) {
			this.set(value, true);
			this.boundTo = [];
			this.original = (Sushi.utils.isArray(value)) ? value.slice(0) : value;
			this._cid = Sushi.utils.uniqueId();
			this.event = 'coredata/' + this._cid;
		};
		
		Sushi.CoreDataObject.prototype = {
			value 	: null,
			boundTo : [],
			original: null,
			
			/**
			 * Resets a CoreData variable to its original state
             * 
             * Example: variable.reset()
             *
             * @method reset
			 *
			 * @returns The CoreData variable instance.
             */
			reset : function() {
				this.set((Sushi.utils.isArray(this.original)) ? this.original.slice(0) : this.original, false);
				
				return this;
			},
			
			/**
             * Gets the value of a CoreData variable 
             * 
             * Example: variable.get(true)
             *
             * @method get
			 * @param {Boolean} Pass value through a preprocessor function before returning it?
			 *
			 * @returns {Object} the variable's value
             */
        	get : function(process){
				return (process && typeof this.preProcess == 'function') ? this.preProcess(this.value) : this.value;
        	},

			/**
             * Preprocesses the value of a CoreData variable.
			 * This method is called on get() and is used to make modifications to
			 * the value in store.
             * 
             *
             * @method preProcess
     		 *
			 * @returns {Object} the variable's value
             */
        	preProcess : function(value){
				return value;
        	},

			/**
             * Sets the value of a CoreData variable.
			 * All currently living subscribers get notified.
             * 
             * Example:
             *
             * @method set
             * @param {Object} 	value 	The new value to set
			 * @param {Boolean} process	Whether to use processing functions
     		 *
     		 * @returns The CoreData variable instance.
             */
        	set : function(value, process){        		
				this.value = (process && typeof this.postProcess == 'function') ? this.postProcess(value) : value;
				
				// Notify all subscribers to this object
				//for (var i=this.boundTo.length; i--; ) {
				Sushi.pubsub.publish(this.event, this.get(true));
				//}
				
				return this;
        	},
        	
        	/**
             * Adds a new value to the CoreData variable if it is a collection
			 * All currently living subscribers get notified.
             * 
             * Example:
             *
             * @method add
             * @param {Object} 	value 	The new value to add
			 * @param {Boolean} process	Whether to use processing functions
     		 *
     		 * @returns The CoreData variable instance.
             */
        	add: function(value, process) {
        		if (!Sushi.utils.isArray(this.value)) { return false; }
        		
        		this.value.push( (process && typeof this.postProcess == 'function') ? this.postProcess(value) : value );
				
				// Notify all subscribers to this object
				//for (var i=this.boundTo.length; i--; ) {
				Sushi.pubsub.publish(this.event, this.get(true));
				//}
				
				return this;
        	},
        	
        	/**
             * Removes a new value to the CoreData variable if it is a collection
			 * All currently living subscribers get notified.
             * 
             * Example:
             *
             * @method add
             * @param {Object} 	value 	The value to remove
			 * @param {Boolean} process	Whether to use processing functions
     		 *
     		 * @returns The CoreData variable instance.
             */
        	remove: function(value, process) {
        		if (!Sushi.utils.isArray(this.value)) { return false; }
        		Sushi.utils.removeFromArray( this.value, (process && typeof this.postProcess == 'function') ? this.postProcess(value) : value );
				
				// Notify all subscribers to this object
				//for (var i=this.boundTo.length; i--; ) {
				Sushi.pubsub.publish(this.event, this.get(true));
				//}
				
				return this;
        	},

			/**
             * Postprocesses the value of a CoreData variable.
			 * This method is called on set() and is used to make modifications to
			 * the value to store.
             * 
             *
             * @method postProcess
     		 *
			 * @returns {Object} the variable's value
             */
        	postProcess : function(value){
				return value;
        	},

			/**
             * Binds a CoreData variable to a function.
			 * This subscribes the DOM element passed in to the CoreData variable topic
			 * When the CoreData variable is set() the UI widget is automatically updated
			 * after passing through an optional preprocess function.
             * 
             * Example:
             *
             * @method bind
			 * @param {Function}		updateFunc Update function to execute when the object is changed
     		 *
     		 * @returns The CoreData variable instance.
             */
        	bind : function(updateFunc, syncOnBind){
				if (typeof updateFunc != 'function') return false;
				
				//this.boundTo.push(elementID);
				
				// Subscribe this elementID to the passed-in update event
				Sushi.pubsub.subscribe(this.event, updateFunc);
				
				// Run the updateFunc the first-time, so everything is synced on bindTo
				if (syncOnBind) updateFunc(this.get(true));
				
				return this;
        	},
        	
        	/**
             * Bind a CoreData variable to a UI widget.
			 * This is a pub-sub based sugar to automatically update a UI widget when
			 * the CoreData variable changes
             * 
             * Example:
             *
             * @method bindToElement
             * @param {DOMElement} 	elementID 	The element to bind this variable to
             * @param {String} 		property 	The property to update.
             * 									Available properties:
             *									- text
             *									- classname
             * @param {Object}		opts		Options object
             *
             * @returns The CoreData variable instance.
     		 *
             */
        	bindToElement : function(element, property, opts) {
        		
        		if (!Sushi.utils.isElement(element)) { return false }
        		
        		function renderFunc(value) {
        			var newValue = value;
        			
        			opts = opts || {};
        			
        			if (Sushi.utils.isArray(value)) {
        				if (!opts.count) {   				
	        				newValue = value.join( opts.separator || ', ' );
	        			} else {
	        				newValue = value.length;
	        			}        				
        			}
        		
        			if (property == 'text') {
        				element.innerHTML = newValue;
        			}
        			
        			if (property == 'classname') {
        				if (element.className.search(newValue) == -1) {
        					element.className += ' ' + newValue;
        				}
        			}
        		}
        		
        		Sushi.pubsub.subscribe(this.event, function(value) {
        			renderFunc(value);
        		});
        		
        		renderFunc(this.get(true));
        		
        		return this;
        	},

			/**
             * Unbind a CoreData variable from a UI widget.
			 * This unsubscribes the DOM element passed in to the CoreData variable topic
             * 
             * Example:
             *
             * @method unbindFromElement
             * @param {DOMElement} elementID The element to unbind this variable from
     		 *
     		 * @returns The CoreData variable instance.
             */
        	unbindFromElement : function(elementID){
				
				return this;
			}
		}
 	}
 );