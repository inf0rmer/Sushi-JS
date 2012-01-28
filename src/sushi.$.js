/**
 * Sushi $
 *
 * @module Sushi
 */
/*global Sushi:true, define:true*/
define('sushi.$',
    [
    	'vendors/qwery',
    	'vendors/bonzo',
    	'vendors/bean',
    	'sushi.utils',
    ],
    
	/**
	 * Sushi $
	 *
	 * @namespace Sushi
	 * @class $
	 */
    function(qwery, bonzo, bean) {
    	Sushi.namespace('$');
    	
    	bonzo.setQueryEngine(qwery);
    	
    	Sushi.$ = function(selector, context) {
    		var q = qwery(selector, context),
    		element;
    		if (q.length) {
    			element = bonzo(q);
    		} else {		
	    		element = bonzo.create(selector);
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
    	};
    	
    	//Sugar
    	if (!window.$) window.$ = Sushi.$;
    	
    	return Sushi.$;
    } 
);
