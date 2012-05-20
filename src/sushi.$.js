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
    	'sushi.utils.collection',
    	'sushi.support',
    	'sushi.qwery',
    	'sushi.bonzo',
    	'sushi.bean',
    	'sushi.morpheus',
    	'sushi.ajax'
    ],
    
	/**
	 * Sushi $
	 *
	 * @namespace Sushi
	 * @class $
	 */
    function(Sushi, utils, collection, support, qwery, bonzo, bean, morpheus, ajax) {    	
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
    		rroot = /^(?:body|html)$/i,
    		element;
    		
    		// If selector is a function, handle it as being domReady - support $(function(){})
    		if (utils.isFunction(selector)) {
    			return Sushi.ready( selector );
    		}
    		
    		if (selector === '#' || selector === '.') selector = '';
				
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
    				var theArgs = arguments,
    					args = _slice.call(theArgs, 0);
    				
    				bonzo(context).each(function() {
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
			
			Sushi.extend(bonzoed, {
				isVisible: function() {
					var elem = this.get(0),
						width = elem.offsetWidth,
						height = elem.offsetHeight;	
					return !( width === 0 && height === 0 ) || (!support.reliableHiddenOffsets && ((elem.style && elem.style.display) || $(this).css( "display" )) === "none");
				}
			});
			
			// extend plugins
			for (var plugin in Sushi.fn) {
				bonzoed[plugin] = Sushi.fn[plugin];
			}
    		
    		Sushi.extend(bonzoed, {
    		
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
					return $(bonzo(this).next()[0]);
				},
				
				offset: function () {
					return bonzo(this).offset()
				},
			
			  	previous: function () {
					return $(bonzo(this).previous()[0]);
				},
			
			  	appendTo: function (t) {
					return $(bonzo(this.selector).appendTo(t, this).get(0))
				},
			
			  	prependTo: function (t) {
					return $(bonzo(this.selector).prependTo(t, this).get(0))
				},
			
			  	insertAfter: function (t) {
					return $(bonzo(this.selector).insertAfter(t, this).get(0))
				},
			
			  	insertBefore: function (t) {
				  	return $(bonzo(this.selector).insertBefore(t, this).get(0))
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
				  	return dimension.call(this, 'height', v)
				},
			
			  	width: function (v) {
				  	return dimension.call(this, 'width', v)
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
			  	
			  	position: function() {
					if ( !this[0] ) {
						return null;
					}
			
					var elem = this[0],
						// Get *real* offsetParent
						offsetParent = this.offsetParent()[0],
						// Get correct offsets
						offset       = this.offset(),
						parentOffset = rroot.test(offsetParent[0].nodeName) ? { top: 0, left: 0 } : offsetParent.offset();
					
					// Subtract element margins
					// note: when an element has margin: auto the offsetLeft and marginLeft
					// are the same in Safari causing offset.left to incorrectly be 0
					offset.top  -= parseFloat( $(elem).css("marginTop") ) || 0;
					offset.left -= parseFloat( $(elem).css("marginLeft") ) || 0;
			
					// Add offsetParent borders
					parentOffset.top  += parseFloat( $(offsetParent[0]).css("borderTopWidth") ) || 0;
					parentOffset.left += parseFloat( $(offsetParent[0]).css("borderLeftWidth") ) || 0;
			
					// Subtract the two offsets
					return {
						top:  offset.top  - parentOffset.top,
						left: offset.left - parentOffset.left
					};
				},
			
				offsetParent: function() {
					return collection.map(this, function(elem) {
						var offsetParent = elem.offsetParent || document.body;
						while ( offsetParent && (!rroot.test(offsetParent.nodeName) && $(offsetParent).css("position") === "static") ) {
							offsetParent = offsetParent.offsetParent;
						}
						return $(offsetParent);
					});
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
    		
    		// Aliases
    		bonzoed.prev = bonzoed.previous;
    		
    		return bonzoed;
    	};
    	
    	// Helpers
    	function dimension(type, v) {
    		var elem = this;
    		if (this.get(0) === document || this.get(0) === window) elem = $(document.body)
			return typeof v == 'undefined'
			  ? bonzo(elem).dim()[type]
			  : elem.css(type, v)
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
    	
    	return Sushi;
    } 
);
