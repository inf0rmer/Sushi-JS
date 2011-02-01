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
			
			trigger: function(event, args) {
				Sushi.events.publish('change:' + this.mid, args);
			}
			
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
							this.trigger('change', {
													attribute: attr,
													value:val
													});
						}
					}
				});
			}
		});
	}
);