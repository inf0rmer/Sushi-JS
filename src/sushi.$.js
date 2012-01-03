/**
 * Sushi $
 *
 * @module Sushi
 */
/*global Sushi:true, define:true*/
define(
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
    	
    	Sushi.$ = function(selector, context) {
    		var element = bonzo(
    			qwery(selector, context)
    		),
    		_slice = Array.prototype.slice,
    		_bind = function(fn) {
    			return function() {
    				var args = _slice.call(arguments, 0);
    				args.unshift(element.get(0));
					fn.apply(this, args);
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
				methods[method] = _bind(methods[method]);
			}
    		
    		return Sushi.extend(element, methods);
    	}
    } 
);
