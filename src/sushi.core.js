/**
 * Sushi Core
 *
 * @module Sushi
 */
/*global Sushi:true, define:true*/
define('sushi.core',
    [],
    
	/**
	 * Sushi Core
	 *
	 * @namespace Sushi
	 * @class core
	 */
    function() {
    	var root = this,
    	previousSushi = root.Sushi,
    	Sushi = root.Sushi = root.$ = function( selector, context ) {
    		return Sushi.fn( selector, context )
    	},
    	
    	_$ = window.$,
    	
    	VERSION = '1.0',
    	
    	fn = function() {
    		return Sushi;
    	}
    	
    	noConflict = function() {
    		if (root.$ === Sushi) {
    			root.$ = _$;
    		}
    		root.Sushi = previousSushi;
    		return Sushi;
    	},
		/**
		 * A utility that non-destructively defines namespaces
		 *
		 * @method namespace
		 * @param {String} namespaceString Name of namespace to create
		 * @return {Object} Namespaced object
		 */
		namespace = function(namespaceString, global) {   			
			global = (!global) ? Sushi : global;
			
			var parts = namespaceString.split('.'),
				parent = global,
				i;
		
			// Strip redundant leading global
			if (parts[0] === 'Sushi') {
				parts = parts.slice(1);
			}
		
			for (i = 0, len = parts.length; i < len; i+=1) {
				// Create a property if it doesn't exist
				if (typeof parent[parts[i]] === 'undefined') {
					parent[parts[i]] = {};
				}
				parent = parent[parts[i]];
			}
		
			return parent;			
		},
	
		/**
		 * Simple extending (shallow copying) utility.
		 *
		 * @method extend
		 * @param {Object} obj Object to copy properties to
		 * @param {Object} extension Object to copy properties from
		 * @param {Boolean} override Should extend override existing properties?
		 * @return {Object} Extended object
		 */
		extend = function(obj, extension, override) {
			var prop;
			if (override === false) {
				for (prop in extension)
					if (!(prop in obj))
						obj[prop] = extension[prop];
			} else {
				for (prop in extension)
					obj[prop] = extension[prop];
						if (extension.toString !== Object.prototype.toString)
							obj.toString = extension.toString;
			}
			
			return obj;
		},
		
		Class = function() {
			var len = arguments.length,
				body = arguments[len - 1],
				SuperClass = len > 1 ? arguments[0] : null,
				hasImplementClasses = len > 2,
				Class, 
				SuperClassEmpty;
		
			if (body.constructor === Object) {
				Class = function() {};
			} else {
				Class = body.constructor;
				delete body.constructor;
			}
		
			if (SuperClass) {
				SuperClassEmpty = function() {};
				SuperClassEmpty.prototype = SuperClass.prototype;
				Class.prototype = new SuperClassEmpty();
				Class.prototype.constructor = Class;
				Class.Super = SuperClass;
				Sushi.extend(Class, SuperClass, false);
			}
		
			if (hasImplementClasses)
				for (var i = 1; i < len - 1; i++)
					Sushi.extend(Class.prototype, arguments[i].prototype, false);    
		
			Sushi.extendClass(Class, body);
		
			return Class;
		},
		
		/**
		 * @method extendClass
		 * @param {Function} Class the Class to extend
		 * @param {Object} extension Properties to extend the class with
		 * @param {Boolean} override Should override existing properties?
		 * 
		 * Usage:
		 *	 extendClass(Person, {
		 *		  newMethod1: function() {
		 *			...
		 *		  },
		 *		  newMethod2: function() {
		 *			...
		 *		  },
		 *		  newMethod3: function() {
		 *			...
		 *		  }
		 *	});
		 */
		extendClass = function(Class, extension, override) {
			if (extension.STATIC) {
				extend(Class, extension.STATIC, override);
				delete extension.STATIC;
			}
			Sushi.extend(Class.prototype, extension, override)
		}
	
    	// Sync global Sushi variable to namespaced one
    	extend(this.Sushi, {
    		VERSION: VERSION,
    		fn: fn,
    		noConflict: noConflict,
    		namespace: namespace,
    		extend: extend,
    		Class: Class,
    		extendClass: extendClass
    	});
    	
    	return this.Sushi;
    }
);
