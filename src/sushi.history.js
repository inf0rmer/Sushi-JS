/*
 * Sushi.History - Handles cross-browser history management, based on URL fragments.
 *
 */
 define('sushi.history',
 	// Module dependencies
 	[
 		'sushi.utils',
 		'sushi.event',
 		'sushi.$',
 		'sushi.error'
    ],

 	/**
 	 * Sushi MVC History
 	 *
 	 * @namespace Sushi
 	 * @class history
 	 */
 	function(utils, event, $, SushiError) {
 		Sushi.namespace('History');
 		
 		var routeStripper = /^[#\/]/,
 		isExplorer = /msie [\w.]+/,
 		historyStarted = false,
 		_updateHash = function(location, fragment, replace) {
		  	if (replace) {
				location.replace(location.toString().replace(/(javascript:|#).*$/, '') + '#' + fragment);
		  	} else {
				location.hash = fragment;
		  	}
		}
	  	
 		Sushi.History = function() {
			this.handlers = [];
 			utils.bindAll(this, 'checkUrl');
 		}
 		
 		Sushi.extend(Sushi.History.prototype, {	
 			interval: 50,
 			
 			getFragment : function(fragment, forcePushState) {
				if (fragment == null) {
					if (this._hasPushState || forcePushState) {
				  		fragment = window.location.pathname;
				  		var search = window.location.search;
				  		if (search) fragment += search;
					} else {
				  		fragment = window.location.hash;
					}
			  	}
			  	fragment = decodeURIComponent(fragment);
			  	if (fragment.indexOf(this.options.root) == 0) fragment = fragment.substr(this.options.root.length);
			  	return fragment.replace(routeStripper, '');
			},
			
			start : function(options) {
				if (historyStarted) throw new SushiError("Sushi.history has already been started");
				this.options          = Sushi.extend({root: '/'}, Sushi.extend(this.options, options), true);
				this._wantsPushState  = !!this.options.pushState;
				this._hasPushState    = !!(this.options.pushState && window.history && window.history.pushState);
				var fragment          = this.getFragment();
				var docMode           = document.documentMode;
				var oldIE             = (isExplorer.exec(navigator.userAgent.toLowerCase()) && (!docMode || docMode <= 7));
				if (oldIE) {
					this.iframe = $('<iframe>').attr({src: 'javascript:0', tabindex:'-1'}).hide().appendTo('body')[0].contentWindow;
					this.navigate(fragment);
				}
				
				if (this._hasPushState) {
					$(window).bind('popstate', this.checkUrl);
				} else if ('onhashchange' in window && !oldIE) {
					$(window).bind('hashchange', this.checkUrl);
				} else {
					setInterval(this.checkUrl, this.interval);
				}
				
				this.fragment = fragment;
			  	historyStarted = true;
			  	var loc = window.location;
			  	var atRoot  = loc.pathname == this.options.root;
			  	
			  	if (this._wantsHashChange && this._wantsPushState && !this._hasPushState && !atRoot) {
					this.fragment = this.getFragment(null, true);
					window.location.replace(this.options.root + '#' + this.fragment);
					
					return true;
				} else if (this._wantsPushState && this._hasPushState && atRoot && loc.hash) {
					this.fragment = loc.hash.replace(routeStripper, '');
					window.history.replaceState({}, document.title, loc.protocol + '//' + loc.host + this.options.root + this.fragment);
				}
		
			  	if (!this.options.silent) {
					return this.loadUrl();
			  	}
			},
			
			stop: function() {
				$(window).unbind('popstate', this.checkUrl).unbind('hashchange', this.checkUrl);
				clearInterval(this._checkUrlInterval);
				historyStarted = false;
			},
			
			route : function(route, callback) {
				this.handlers.unshift({route : route, callback : callback});
			},
			
			checkUrl : function(e) {
				var current = this.getFragment();
			  	if (current == this.fragment && this.iframe) current = this.getFragment(this.iframe.location.hash);
			  	if (current == this.fragment || current == decodeURIComponent(this.fragment)) return false;
			  	if (this.iframe) this.navigate(current);
			  	this.loadUrl() || this.loadUrl(window.location.hash);
			},
			
			loadUrl : function(fragmentOverride) {
				var fragment = this.fragment = this.getFragment(fragmentOverride),
			  	matched = utils.any(this.handlers, function(handler) {
					if (handler.route.test(fragment)) {
				  		handler.callback(fragment);
				  		return true;
					}
			  	});
			  	return matched;
			},
			
			navigate : function(fragment, options) {
				if (!historyStarted) return false;
				if (!options || options === true) options = {trigger: options};
				var frag = (fragment || '').replace(routeStripper, '');
				
			  	if (this.fragment == frag || this.fragment == decodeURIComponent(frag)) return;
			  	
			  	if (this._hasPushState) {
					if (frag.indexOf(this.options.root) != 0) frag = this.options.root + frag;
					this.fragment = frag;
					window.history[options.replace ? 'replaceState' : 'pushState']({}, document.title, frag);
			  	} else if (this._wantsHashChange) {
					this.fragment = frag;
					_updateHash(window.location, frag, options.replace);
					if (this.iframe && (frag != this.getFragment(this.iframe.location.hash))) {
						if(!options.replace) this.iframe.document.open().close();
			          	_updateHash(this.iframe.location, frag, options.replace);
			        }
			  	} else {
			  		window.location.assign(this.options.root + fragment);
			  	}
			  	if (options.trigger) this.loadUrl(fragment);
			}
 		});
 		
 		Sushi.extend(Sushi.History.prototype, event);
 		
 		return Sushi.History;
 	}
 );