define(
	['sushi.core', 'sushi.utils', 'sushi.utils.collection'],
	
	function() {
		var Model = function(attributes, options) {
			attributes || (attributes = {});
			
			if (this.defaults) {
				attributes = Sushi.extend(this.defaults, attributes);
			}
			
			this.attributes = {};
			this.set(attributes, {silent : true});
			this._previousAttributes = Sushi.extend(this.attributes);
			this.mid = Sushi.utils.uniqueId('m');
		    this.topic = 'model_' + this.mid + '/';
			this.initialize(attributes, options);
		};
		
		Sushi.extend(Model.prototype, (function() {
			var _previousAttributes = null,
			
			_changed = false,
			
			_trigger = function(evt, args) {
			    if (!evt) {
			        return false;
			    }
			    
			    Sushi.event.publish(this.topic + ':' + evt, args);
			    
			    return this;
			},
			
			_performValidation = function(attrs, options) {
			    var error = this.validate(attrs);
			    
			    if (error) {
			        if (options.error) {
			            options.error.call(this, error);
			        } else {
			            this._trigger('error', error);
			        }
			        
			        return false;
			    }
			    
			    return true;
			},
			
			initialize = function() {},
			
			copyAttributes = function() {
				return Sushi.extend({}, this.attributes);
			},
			
			get = function(attr) {
				return this.attributes[attr];
			},
			
			set = function(attrs, options) {
				
				options || (options = {});
				
				if (!attrs) {
					return this;
				}
				
				if (attrs.attributes) {
					attrs = attrs.attributes;
				}
				
				var now = this.attributes;
				
				//Run validation...
				if (!options.silent && this.validate && !this._performValidation(attrs, options)) {
				    return false;
				}
				
				// Check for changes of id
				if ('id' in attrs) {
					this.id = attrs.id;
				}
				
				// Update the attributes
				Sushi.utils.each(attrs, function(attr) {
					var val = attrs[attr];

					if (!Sushi.utils.isEqual(now[attr], val)) {
						now[attr] = val;
						
						if (!options.silent) {
							this._changed = true;
						    this._trigger('change:' + attr, val);
						}
					}
				});
				
				// Fire a change event in case model was changed
				if (!options.silent && this._changed) {
    				this.change();
				}
				
				return this;
			},
			
			unset = function(attr, options) {
			    options || (options = {});
			    var value = this.attributes[attr],
			        validObj = {};
			        
			    validObj[attr] = undefined;
			    if (!options.silent && this.validate && !this._performValidation(validObj, options)) {
			        return false;
			    }			    
			    
			    // Remove the attribute
			    delete this.attributes[attr];
			    
			    // Fire changed if options.silent was not set
			    if (!options.silent) {
			        this._changed = true;
			        
			        this._trigger('change:' + attr, undefined);
			        this.change();
			    }
			    
			    return this;
			},
			
			clear = function(options) {
			    options || (options = {});
			    
			    var old = this.attributes,
			        validObj = {};
			    
			    Sushi.utils.each(old, function(attr){
			        validObj[attr] = undefined;
			    });
			    		    
			    if (!options.silent && this.validate && !this._performValidation(validObj, options)) {
			        return false;
			    }
			    
			    this.attributes = {};
			    
			    // Fire change event if options.silent was not set 
			    if (!options.silent) {
			        this._changed = true;
			        Sushi.utils.each(old, function(attr){
			            this._trigger('change:' + attr, undefined);
			        });
			        
			        this.change();
			    }
			    
			    return this;
			},
			
			fetch = function() {
			    return true;
			},
			
			save = function() {
			    return true;
			},
			
			destroy = function() {
			    return true;
			},
			
			parse = function(resp) {
			    return resp;
			},
			
			change = function() {
			    this._previousAttributes = Sushi.extend(this.attributes);
			    this._changed = false;
			},
			
			hasChanged = function(attr) {
			    if (attr) {
			        if (this._previousAttributes[attr] != this.attributes[attr]) {
			            return false;
			        }
			        
			        return this._changed;
			    }
			},
			
			changedAttributes = function() {
			    var now = this.attributes,
			    old = this._previousAttributes,
			    changed = false;
			    
			    Sushi.utils.each(now, function(attr){
                    if (!Sushi.utils.isEqual(old[attr], now[attr])) {
                        changed = changed || {};
                        changed[attr] = now[attr];
                    }
			    });
			    
			    return changed;
			},
			
			previous = function(attr) {
			    if (!attr || !this._previousAttributes) {
			        return null;
			    }
			    
			    return this._previousAttributes[attr];
			},
			
			previousAttributes = function() {
			    return Sushi.extend(this._previousAttributes);
			};
			
			return {
			    initialize: initialize,
			    copyAttributes: copyAttributes,
			    get: get,
			    set: set,
			    unset: unset,
			    clear: clear,
			    fetch: fetch,
			    save: save,
			    destroy: destroy,
			    parse: parse,
			    change: change,
			    hasChanged: hasChanged,
			    changedAttributes: changedAttributes,
			    previous: previous,
			    previousAttributes: previousAttributes
			};
					
		})());
		
		return Model;
	}
);