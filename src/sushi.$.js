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
    	'vendors/morpheus'
    ],
    
	/**
	 * Sushi $
	 *
	 * @namespace Sushi
	 * @class $
	 */
    function(Sushi, qwery, bonzo, bean, morpheus) {    	
    	var $;
    	
    	bonzo.setQueryEngine(qwery);
    	
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
    		
    		// If the selector is a tag-like string, create it instead of qwerying it.
    		if (/^<(\w+)\s*\/?>(?:<\/\1>)?$/.test(selector)) {
    			element = bonzo.create(selector);
    		} else {
    			element = bonzo(qwery(selector, context))
    		}
    		
    		var _slice = Array.prototype.slice,
    		_bind = function(fn, context) {
    			return function() {
    				var theArgs = arguments;
    				
    				bonzo(context).each(function() {
						args = _slice.call(theArgs, 0);
						args.unshift(bonzo(this).get(0));
						fn.apply(context, args);
					});
					
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
				trigger: bean.fire
			};
			
			for (var method in methods) {
				methods[method] = _bind(methods[method], element);
			}
    		
    		var bonzoed = Sushi.extend(bonzo(element), methods);
    		
    		return Sushi.extend(bonzoed, {
    			find: function (s) {
					var r = [], i, l, j, k, els;
					for (i = 0, l = this.length; i < l; i++) {
				 	 	els = qwery(s, this[i]);
						for (j = 0, k = els.length; j < k; j++) {
							r.push(els[j]);
						}
					}
					return $(qwery.uniq(r));
			  	},
			  	
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
    	
    	//Sugars
    	Sushi.fn = $;
    	
    	// Make raw objects available
    	Sushi.morpheus = morpheus;
    	Sushi.bonzo = bonzo;
    	Sushi.qwery = qwery;
    	Sushi.bean = bean;
    	
    	return $;
    } 
);
