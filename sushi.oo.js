Sushi.oo = function() {		
	Class = function() {
		return _create.apply(this, arguments);
	},
	
	_create = function() {
		var methods = null,
		    parent  = undefined,
	        klass   = function() {
	        	this.$super = function( method, args ) { return _super( this._parent, this, method, args ); };
	        	this.init.apply( this, arguments );
	        };

	    if ( typeof arguments[0] === 'function' ) {
	    	parent = arguments[0];
	    	methods = arguments[1];
	    } else {
	    	methods = arguments[0];
	    }

	    if ( typeof parent !== 'undefined' ) {
	      	_extend(klass.prototype, parent.prototype);
	      	klass.prototype._parent = parent.prototype;
	    }

	    _mixin( klass, methods );
	    _extend( klass.prototype, methods );
	    klass.prototype.constructor = klass;

	    if ( !klass.prototype.init ) {
	      	klass.prototype.init = function(){};
		}
		
	    return klass;
	},
	
	_super = function( parentClass, instance, method, args ) {
		return parentClass[method].apply(instance, args);
	},
	
	_mixin = function( klass, methods ) {
		if ( typeof methods.include !== 'undefined' ) {
			if ( typeof methods.include === 'function' ) {
		    	_extend(klass.prototype, methods.include.prototype);
		    } else {
		        for ( var i = 0; i < methods.include.length; i++ ) {
		          	_extend( klass.prototype, methods.include[i].prototype );
		        }
		    }
		}
	},
	
	_extend = function( destination, source ) {
		for ( var property in source ) {
			destination[property] = source[property];
		}
		return destination;
	};
	
	return {
		Class: Class
	};
}();