/*
 * Sushi.History - Handles cross-browser history management, based on URL fragments.
 *
 */
 define('sushi.history',
 	// Module dependencies
 	[
 		'sushi.utils',
 		'sushi.$'
    ],

 	/**
 	 * Sushi MVC History
 	 *
 	 * @namespace Sushi
 	 * @class history
 	 */
 	function(utils, $) {
 		Sushi.namespace('History');
 		
 		var hashStrip = /^#*/,
 		isExplorer = /msie [\w.]+/,
 		historyStarted = false;
	  	
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
				  		if (fragment.indexOf(this.options.root) == 0) fragment = fragment.substr(this.options.root.length);
					} else {
				  		fragment = window.location.hash;
					}
			  	}
			  	return decodeURIComponent(fragment.replace(hashStrip, ''));
			},
			
			start : function(options) {
				if (historyStarted) throw new Error("Sushi.history has already been started");
				this.options          = Sushi.extend({}, {root: '/'}, this.options, options);
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
			  	if (this._wantsPushState && !this._hasPushState && !atRoot) {
					this.fragment = this.getFragment(null, true);
					window.location.replace(this.options.root + '#' + this.fragment);
					return true;
			  	} else if (this._wantsPushState && this._hasPushState && atRoot && loc.hash) {
					this.fragment = loc.hash.replace(hashStrip, '');
					window.history.replaceState({}, document.title, loc.protocol + '//' + loc.host + this.options.root + this.fragment);
			  	}
		
			  	if (!this.options.silent) {
					return this.loadUrl();
			  	}
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
			
			navigate : function(fragment, triggerRoute) {
				var frag = (fragment || '').replace(hashStrip, '');
			  	if (this.fragment == frag || this.fragment == decodeURIComponent(frag)) return;
			  	if (this._hasPushState) {
					var loc = window.location;
					if (frag.indexOf(this.options.root) != 0) frag = this.options.root + frag;
					this.fragment = frag;
					window.history.pushState({}, document.title, loc.protocol + '//' + loc.host + frag);
			  	} else {
					window.location.hash = this.fragment = frag;
					if (this.iframe && (frag != this.getFragment(this.iframe.location.hash))) {
				  		this.iframe.document.open().close();
				  		this.iframe.location.hash = frag;
					}
			  	}
			  	if (triggerRoute) this.loadUrl(fragment);
			}
 		});
 		
 		return Sushi.History;
 	}
 );