/**
 * Sushi $
 *
 * @module Sushi
 */
/*global Sushi:true, define:true*/
define('sushi.$',
    [
    	'sushi.core',
    	'vendors/qwery',
    	'vendors/bonzo',
    	'vendors/bean',
    	'sushi.utils',
    	'vendors/morpheus'
    ],
    
	/**
	 * Sushi $
	 *
	 * @namespace Sushi
	 * @class $
	 */
    function(qwery, bonzo, bean) {
    function(Sushi, qwery, bonzo, bean, morpheus) {
    	Sushi.namespace('$');
    	
    	bonzo.setQueryEngine(qwery);
    	
    	Sushi.$ = function(selector, context) {
    		var q = qwery(selector, context),
    	function _parseAnimationDuration(d) {
    		if (typeof d === 'string') {
				switch (d) {
					case 'fast':
						d = 500;
						break;
					
					case 'normal':
						d = 1000;
						break;
					
					case 'slow':
						d = 2000;
						break;
					
					default:
						d = 1000;
						break;
				}
			}
			
			return d;
    	}
    	
    	$ = function(selector, context) {
    		var q,
    		element;
    		if (q.length) {
    			element = bonzo(q);
    		} else {		
	    		element = bonzo.create(selector);
	    	}
    		
    		// If the selector is a tag-like string, create it instead of qwerying it.
    		if (/^<(\w+)\s*\/?>(?:<\/\1>)?$/.test(selector)) {
    			element = bonzo.create(selector);
    		} else {
    			element = bonzo(qwery(selector, context))
    		}
    		
    		var _slice = Array.prototype.slice,
    		_bind = function(fn, context) {
    			return function() {
    				var args = _slice.call(arguments, 0);
    				args.unshift(bonzo(context).get(0));
					fn.apply(context, args);
					
					return bonzo(context);
				}
    		},
    		methods = {
				on: bean.add,
				addListener: bean.add,
				bind: bean.add,
				listen: bean.add,
				delegate: bean.add,
			
				unbind: bean.remove,
				unlisten: bean.remove,
				removeListener: bean.remove,
				undelegate: bean.remove,
			
				emit: bean.fire,
				trigger: bean.fire,
				trigger: bean.fire
				/*
				hover: function (enter, leave) {
				  for (var i = 0, l = this.elements.length; i < l; i++) {
					b.add.call(this, this.elements[i], 'mouseenter', enter);
					b.add.call(this, this.elements[i], 'mouseleave', leave);
				  }
				  return this;
				}
				*/
			};
			
			for (var method in methods) {
				methods[method] = _bind(methods[method], element);
			}
    		
    		return Sushi.extend(bonzo(element), methods);
    		var bonzoed = Sushi.extend(bonzo(element), methods);
    		
    		return Sushi.extend(bonzoed, {
    			animate: function (options) {
    				if (options && options.duration) {
    					options.duration = _parseAnimationDuration(options.duration);
    				}
    				
				  	return morpheus(this, options)
				},
			  	
			  	fadeIn: function (d, fn) {			  		
				  	return morpheus(this, {
					  	duration: _parseAnimationDuration(d),
						opacity: 1,
						complete: fn
				  	})
				},
				
				fadeOut: function (d, fn) {
				  	return morpheus(this, {
					  	duration: _parseAnimationDuration(d),
						opacity: 0,
						complete: fn
				  	})
				}
    		});
    	};
    	
    	//Sugar
    	if (!window.$) window.$ = Sushi.$;
    	
    	return Sushi.$;
    } 
);
