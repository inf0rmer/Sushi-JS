/**
 * Sushi $
 *
 * @module Sushi
 */
/*global Sushi:true, define:true*/
define('sushi.$',
    [
    	'sushi.core',
    	'sushi.utils',
    	'vendors/qwery',
    	'vendors/bonzo',
    	'vendors/bean',
    	'vendors/morpheus',
    	'sushi.ajax'
    ],
    
	/**
	 * Sushi $
	 *
	 * @namespace Sushi
	 * @class $
	 */
    function(Sushi, utils, qwery, bonzo, bean, morpheus, ajax) {    	
    	var $;
    	
    	bonzo.setQueryEngine(qwery);
    	bean.setSelectorEngine(qwery);
    	
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
    		match,
    		quickExpr = /^(?:[^#<]*(<[\w\W]+>)[^>]*$|#([\w\-]*)$)/,
    		element;
    		
    		// If selector is a function, handle it as being domReady - support $(function(){})
    		if (utils.isFunction(selector)) {
    			return Sushi.ready( selector );
    		}
    		
				
    		// If the selector is a tag-like string, create it instead of qwerying it.
    		match = quickExpr.exec(selector);
    		
    		if (match && match[1]) {
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
					
					return $(context);
				}
    		},
    		methods = {
				on: bean.add,
				addListener: bean.add,
				bind: bean.add,
				listen: bean.add,
				delegate: bean.add,
				one: bean.one,
			
				unbind: bean.remove,
				off: bean.remove,
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
			
			// extend plugins
			for (var plugin in Sushi.fn) {
				bonzoed[plugin] = Sushi.fn[plugin];
			}
    		
    		return Sushi.extend(bonzoed, {
    		
    			is: function(s, r) {
					var i, l
					for (i = 0, l = this.length; i < l; i++) {
						if (qwery.is(this[i], s, r)) {
							return true
						}
					}
					return false
				},
    			
    			parents: function (selector, closest) {
					var collection = $(selector), j, k, p, r = []
					for (j = 0, k = this.length; j < k; j++) {
						p = this[j]
						while (p = p.parentNode) {
						  if (~indexOf(collection, p)) {
							r.push(p)
							if (closest) break;
						  }
						}
					}
					return $(uniq(r))
				},
			
			  	parent: function() {
					return $(uniq(bonzo(this).parent()))
				},
			
			  	closest: function (selector) {
					return this.parents(selector, true)
				},
			
			  	first: function () {
					return $(this.length ? this[0] : this)
				},
			
			  	last: function () {
					return $(this.length ? this[this.length - 1] : [])
				},
			
			  	next: function () {
					return $(bonzo(this).next())
				},
			
			  	previous: function () {
					return $(bonzo(this).previous())
				},
			
			  	appendTo: function (t) {
					return bonzo(this.selector).appendTo(t, this)
				},
			
			  	prependTo: function (t) {
					return bonzo(this.selector).prependTo(t, this)
				},
			
			  	insertAfter: function (t) {
					return bonzo(this.selector).insertAfter(t, this)
				},
			
			  	insertBefore: function (t) {
				  	return bonzo(this.selector).insertBefore(t, this)
				},
			
				siblings: function () {
				  	var i, l, p, r = []
				  	for (i = 0, l = this.length; i < l; i++) {
						p = this[i]
						while (p = p.previousSibling) p.nodeType == 1 && r.push(p)
						p = this[i]
						while (p = p.nextSibling) p.nodeType == 1 && r.push(p)
					}
				  	return $(r)
				},
			
			  	children: function () {
				  	var i, el, r = []
				  	for (i = 0, l = this.length; i < l; i++) {
						if (!(el = bonzo.firstChild(this[i]))) continue;
						r.push(el)
						while (el = el.nextSibling) el.nodeType == 1 && r.push(el)
				  	}
				  	return $(uniq(r))
				},
			
			  	height: function (v) {
				  	return dimension(v, this, 'height')
				},
			
			  	width: function (v) {
				  	return dimension(v, this, 'width')
				},
    			
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
			  		$(this).show().css({opacity: 0})
				  	return morpheus(this, {
					  	duration: _parseAnimationDuration(d),
						opacity: 1,
						complete: fn
				  	})
				},
				
				fadeOut: function (d, fn) {
					var $self = $(this);
				  	return morpheus(this, {
					  	duration: _parseAnimationDuration(d),
						opacity: 0,
						complete: function() {
							$self.hide()
						}
				  	})
				}
    		});
    	};
    	
    	// Helpers
    	function dimension(v, self, which) {
			return v ?
			self.css(which, v) :
			function (r) {
				if (!self[0]) return 0
				r = parseInt(self.css(which), 10);
				return isNaN(r) ? self[0]['offset' + which.replace(/^\w/, function (m) {return m.toUpperCase()})] : r
			}()
		}
		
		function indexOf(ar, val) {
			for (var i = 0; i < ar.length; i++) if (ar[i] === val) return i
			return -1
	  	}
	
		function uniq(ar) {
			var r = [], i = 0, j = 0, k, item, inIt
			for (; item = ar[i]; ++i) {
			  	inIt = false
			  	for (k = 0; k < r.length; ++k) {
					if (r[k] === item) {
				  		inIt = true; break
					}
			  	}
			  	if (!inIt) r[j++] = item
			}
			return r
		}
    	
    	//Sugars
    	Sushi.fn = $;
    	
    	// Make raw objects available
    	Sushi.morpheus = morpheus;
    	Sushi.bonzo = bonzo;
    	Sushi.qwery = qwery;
    	Sushi.bean = bean;
    	
    	return Sushi;
    } 
);
