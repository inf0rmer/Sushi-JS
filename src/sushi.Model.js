define(
	[],
	
	function() {
		var Model = function(attributes, options) {
			attributes || (attributes = {});
			
			if (this.defaults) {
				attributes = Sushi.extend(this.defaults, attributes);
			}
			
			this.attributes = {};
			this.set(attributes, {silent : true});
			this._previousAttributes = Sushi.extend(this.attributes);
			this.init(attributes);
			this.mid = Sushi.utils.uniqueId('m');
		}
		
		Sushi.extend(Model.prototype, {
			_previousAttributes: null,
			
			_changed: false,
			
			initialize: function() {},
			
			copyAttributes: function() {
				return Sushi.extend({}, this.attributes);
			},
			
			get: function(attr) {
				return this.attributes[attr];
			},
			
			set: function(attrs, options) {
				
				options || (options = {});
				
				if (!attrs) {
					return this;
				}
				
				if (attrs.attributes) {
					attrs = attrs.attributes;
				}
				
				var now = this.attributes;
				
				//Run validation...
				
				// Check for changes of id
				if ('id' in attrs) {
					this.id = attrs.id;
				}
				
				// Update the attributes
				Sushi.each(attrs, function(attr) {
					var val = attrs[attr];

					if (!Sushi.utils.isEqual(now[attr], val)) {
						now[attr] = val;
						
						if (!options.silent) {
							this._changed = true;
						}
					}
				});
				
				// Fire a change event in case model was changed
				if (this._changed) {
				    this.change()
				}
				
				return this;
			},
			
			fetch: function() {
			    
			},
			
			save: function() {
			    
			},
			
			destroy: function() {
			    
			},
			
			parse: function(resp) {
			    return resp;
			}
			
			change: function() {
			    // TODO: fire change event
			    this._previousAttributes = Sushi.extend(this.attributes);
			    this._changed = false;
			},
			
			hasChanged: function(attr) {
			    if (attr) {
			        return (this._previousAttributes[attr] != this.attributes[attr]);
			        return this._changed;
			    }
			},
			
			changedAttributes: function() {
			    var now = this.attributes,
			    old = this._previousAttributes,
			    changed = false;
			    
			    Sushi.each(now, function(attr){
                    if (!Sushi.utils.isEqual(old[attr], now[attr])) {
                        changed = changed || {};
                        changed[attr] = now[attr];
                    }
			    });
			    
			    return changed;
			},
			
			previous: function(attr) {
			    if (!attr || !this._previousAttributes) {
			        return null
			    }
			    
			    return this._previousAttributes[attr];
			},
			
			previousAttributes: function() {
			    return Sushi.extend(this._previousAttributes);
			}
		});
		
		return Model;
	}
);