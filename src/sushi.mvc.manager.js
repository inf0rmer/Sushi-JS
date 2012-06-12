/*
 * Sushi.mvc.manager - based on Gbone.js (https://github.com/gobhi/gbone.js/)
 *
 */
 define('sushi.mvc.manager',
 	// Module dependencies
 	[
 		'sushi.core',
 		'sushi.utils',
 		'sushi.utils.collection',
 		'sushi.$',
 		'sushi.event',
 		'sushi.template',
 		'sushi.error',
 		'sushi.mvc',
 	],

 	/**
 	 * Sushi mvc.manager
 	 *
 	 * @namespace Sushi
 	 * @class mvc.manager
 	 */
	function(Sushi, utils, collection, $, Events, template, SushiError, MVC) {
        Sushi.namespace('manager', Sushi);
        
         //Initial Setup
  
			// Mixins
		var observer, 
			cleanup, 
			transitions, 
			state,
			// State machine for Panel Views.
			Manager,
			Stage,
			Panel;
		  
		// Mixins
		// -----------------
		// Each mixin operates on an object's `prototype`.
		
		// The observer mixin contains behavior for binding to events in a fashion
		// that can be cleaned up later.
		//      `this.bindTo(this.collection, 'change', this.render);`
		//      `this.unbindFromAll();`
		//
		observer = function (obj) {
		
			// On top of binding `event` to `source`, keeps track of all the event
			// handlers that are bound.  A single call to `unbindFromAll()` will
			// unbind them.
			obj.bindTo = function (source, event, callback) {
				source.bind(event, callback, this);
				this.bindings = this.bindings || [];
				this.bindings.push({ source: source, event: event, callback: callback });
			};
			
			// Unbind all events.
			obj.unbindFromAll = function () {
				utils.each(this.bindings, function (binding) {
					binding.source.unbind(binding.event, binding.callback);
				});
				this.bindings = [];
			};
		};
		
		// The cleanup mixin contains set of helpers for adding/managing
		// immediate child Views, cleaning up and housekeeping.  Used with the
		// observer mixin.  Maintains an internal array of child Views.
		//
		cleanup = function (obj) {
		
			// Cleanup child Views, DOM events, Model/Collection events
			// and events from this View.
			obj.cleanup = function () {
				this.unbind();
				if (this.unbindFromAll) this.unbindFromAll();
				this._cleanupChildren();
				this.removeFromParent();
				this.remove();
			};
			
			// Append a child View into the given `view`.
			obj.appendChild = function (view) {
				this._addChild(view);
				$(this.el).append(view.el);
			};
			
			// Append a child View into a specific `container` element in the
			// given `view`.
			obj.appendChildInto = function (view, container) {
				this._addChild(view);
				this.$(container).append(view.el);
			};
			
			obj._addChild = function (view) {
				this.children = this.children || [];
				this.children.push(view);
				view.parent = this;
			};
			
			obj._cleanupChildren = function () {
				utils.each(this.children, function (view) {
					if (view.cleanup) view.cleanup();
			  	});
			};
			
			// Remove this View from its parent View.
			obj.removeFromParent = function () {
				this.parent && this.parent.removeChild(this);
			};
			
			// Remove the given child View `view` from this View.
			obj.removeChild = function (view) {
				var index = collection.indexOf(this.children, view);
			 	this.children.splice(index, 1);
			};
		};
		
		// The transitions mixin contains functions and objects needed for
		// doing transition effects when Panel Views are activated/deactivated.
		// There are default transitions provided, but you can add your own
		// by using the `addTransition` method.  When adding a new transition,
		// it must have a definition under `effects` and `reverseEffects` objects
		// of the Panel.  It must also take in an arugment `callback`, which
		// is a function that will be called once the transition is complete.
		// Check out the default transitions code below for an example of how to setup
		// your own transitions.  
		// Note that if jQuery is used, the default transitions  
		// require GFX (http://maccman.github.com/gfx/), or if Zepto is used then
		// Zepto-GFX (https://github.com/gobhi/zepto-gfx).
		//
		transitions = function (obj) {
		
			// Animation options for the default transitions.
			var effectOptions = {
				duration: 450,
				easing: 'cubic-bezier(.25, .1, .25, 1)'
			},
		
			// Helper function to handle the transitions for the default 
			// effects.
			handleTransition = function (that, anim, options, callback) {
			  
				var l = that.transitionBindings.length,
					// Helper function to animate a single element.
					animate = function (container, ops, index) {
			
						if (!$.fn[anim]) throw new SushiError('$.fn.' + anim + ' is not available');
					
						// Using Zepto-GFX.  Only call the callback function if this is 
						// the last animation.
						(index === l-1) ? container[anim](ops, callback) : container[anim](ops);
					};
			  
				// Animate each element.
				collection.each(that.transitionBindings, function(elm, index) {
					var container = that.$(elm);
					if (container.length === 0)
				  		throw new SushiError('The container element to animate is not availabe in this view.');
				
					animate(container, options, index);
			  	});
			};
		
			// The default element(s) in the Panel to animate for the transitions.
			// An array of elements/selectors of the form 
			// `['.header', '.container', '.footer', ...]`.  Each element/selector
			// in the `transitionBindings` array represents a child DOM element
			// within the Panel that is to be animated.  If `transitionBindings`
			// is not overridden, the default child element that will be animated
			// in the Panel View is `.container`.
			obj.transitionBindings = ['.container'];
		
			// Transition effects for activation.
			obj.effects = {
			  
				// Slide in from the left.
				left: function (callback) {
					var $el = $(this.el),
						options = Sushi.extend({}, effectOptions, {direction: 'left'})
				  
					handleTransition(this, 'gfxSlideIn', options, callback);
				},
			
				// Slide in from the right.
				right: function (callback) {
					var $el = $(this.el),
						options = Sushi.extend({}, effectOptions, {direction: 'right'});
				   
					handleTransition(this, 'gfxSlideIn', options, callback);
				}
			};
		
		
			// Transition effects for deactivation.
			obj.reverseEffects = { 
				// Reverse transition for the slide in from 
				// left: slide out to the right.
				left: function (callback) {
					var $el = $(this.el),
						options = Sushi.extend({}, effectOptions, {direction: 'right'});
				 
					handleTransition(this, 'gfxSlideOut', options, callback);
			  	},
			  
			  	// Reverse transition for the slide in from 
			  	// right: slide out to the left.
			  	right: function (callback) {
					var $el = $(this.el),
						options = Sushi.extend({}, effectOptions, {direction: 'left'});
				 
					handleTransition(this, 'gfxSlideOut', options, callback);
				}
			};
		
			// Add a new transition.  The `transition` argument is an object as follows:
			// `transition.effects` - Object that contains the activation transitions to be added.
			// `transition.reverseEffects` - Object that contains the deactivation transitions.
			// See the default transition effects defined above for an example.
			obj.addTransition = function (transition) {
				  if (!transition.effects) throw new SushiError('transition.effects is not set.');
				  if (!transition.reverseEffects) throw new SushiError('transition.reverseEffects is not set.');
				  Sushi.extend(this.effects, transition.effects);
				  Sushi.extend(this.reverseEffects, transition.reverseEffects);
			};
		
		};
		
		
		// The state mixin contains methods used by the Manager to handle
		// activating/deactivating the Views it manages.
		//
		state = function (obj) {
		
			obj.active = function () {
				// Add in `active` as the first argument.
				Array.prototype.unshift.call(arguments, 'active');
				this.trigger.apply(this, arguments);
			};
			
			obj.isActive = function () {
				return $(this.el).hasClass('active');
			};
			
			obj._activate = function (params) {
				var that = this;
			  
				$(this.el).addClass('active').show();
			
				// Once the transition is completed (if any), trigger the activated
			 	// event.
				if (params && params.trans && this.effects && 
					this.effects[params.trans]) {
					this.effects[params.trans].call(this, function() {
						that.trigger('activated');
					});
				} else {
					this.trigger('activated');
				}
			};
			
			obj._deactivate = function (params) {
				if (!this.isActive()) return;
			
				var that = this,
					callback = function () {
						$(that.el).removeClass('active').hide();
						that.trigger('deactivated');
					};
			
				if (params && params.trans && this.reverseEffects && this.reverseEffects[params.trans]) {
					this.reverseEffects[params.trans].call(this, callback);
				} else {
					callback();
				}
			};
		};
		
		// Manager
		// -----------------
		
		// The Manager class is a state machine for managing Views.
		//
		Manager = function () {
			this._setup.apply(this, arguments);
		};
		
		Sushi.extend(Manager.prototype, Events, {
		
			_setup: function () {
				this.views = [];
				this.bind('change', this._change, this);
				this.add.apply(this, arguments);
			},
		
			// Add one or more Views.
			//      `add(panel1, panel2, ...)`
			add: function () {
				collection.each(Array.prototype.slice.call(arguments), function (view) {
					this.addOne(view);
				}, this);
			},
		
			// Add a View.
			addOne: function (view) {
				view.bind('active', function () {
					Array.prototype.unshift.call(arguments, view);
					Array.prototype.unshift.call(arguments, 'change');
					this.trigger.apply(this, arguments);
				}, this);
		
				this.views.push(view);
			},
		
			// Deactivate all managed Views.
			deactivateAll: function () {
				Array.prototype.unshift.call(arguments, false);
				Array.prototype.unshift.call(arguments, 'change');
				this.trigger.apply(this, arguments);
			},
		
			// For the View passed in - `current`, check if it's available in the
			// internal Views array, activate it and deactivate the others.
			_change: function (current) {
				var args = Array.prototype.slice.call(arguments, 1);
		
				collection.each(this.views, function (view) {
					if (view === current) {
						view._activate.apply(view, args);
					} else {
						view._deactivate.apply(view, args);
					}
				}, this);
			}
		});
		
		// Stage
		// -----------------
		
		// A Stage is a essentially a View that covers the 
		// entire viewport. It has a default `template` (that can be 
		// overridden), transition support and contains Panel views
		// that it manages using Manager.
		// Stages generally cover the entire viewport. Panels are nested
		// in a Stage and can be transitioned.
		// An application usually displays one Stage and Panel at a time.
		// The Stage's Panels can then transition in and out to show
		// different parts of the application.
		//
		Stage = new Sushi.Class(MVC.View, {
			constructor: function(options) {
				this._setup(options, 'stage');
				Stage.Super.call(this, options);
			}
		});
		
		Sushi.extend(Stage.prototype, {
		
			// The default html `skeleton` template to be used by the Stage.
			// It's important that the class `viewport` be set in an element
			// in the `skeleton`. This element will be used by the Stage to append its
			// Panel Views.
			skeleton: template.compile('<header></header><article class="viewport"></article><footer></footer>'),
			  
			// Add Panel(s) to this Stage.
			add: function () {
				this._manager = this._manager || new Manager();
				this._manager.add.apply(this._manager, arguments);
				this._append.apply(this, arguments);
			},
			
			// Retrieve a Panel with a name of `name` in this Stage (if any).
			getPanel: function(name) {
				// This Stage doesn't have any Panels.
				if (!this._manager) return null;
			
				var views = this._manager.views;
				return collection.find(this._manager.views, function (panel) {
					return panel.name === name;
			  	});
			},
			
			// Append Panel(s) to this Stage.
			_append: function () {
				if (this.$('.viewport').length === 0) {
					throw new SushiError('The Stage must have an element with class \'viewport\' that will be used to append the Panels to.');
			  	}
			  
				utils.each(Array.prototype.slice.call(arguments), function (panel) {
					if (panel.stage !== this) panel.stage = this;
					this.appendChildInto(panel, '.viewport');
				}, this);
			},
			
			// Called in the constructor during initialization.
			_setup: function (options) {
				collection.bindAll(this);
			
				options.el ? this.el = options.el : this._ensureElement();
			  
				// If a `name` is not provided, create one. The name is used
				// primarily for setting up the routes.
				this.name = options.name || utils.uniqueId('stage-');
			
				$(this.el).addClass('stage').html(this.skeleton());
			  
				// Create a Router if one is not provided.
				this.router = options.router || new MVC.Router();
			}
		});
		
		observer(Stage.prototype);
		cleanup(Stage.prototype);
		
		
		// Panel
		// -----------------
		
		// Similar to a Stage, a Panel is just a View with transition
		// support whenever it is activated/deactivated. A Panel's
		// parent is a Stage and that Stage is responsible for
		// managing and activating/deactivating the Panel.
		// Usually only one Panel is shown in the application at one time.
		//
		Panel = new Sushi.Class(MVC.View, {
			constructor: function(options) {
				this._setup(options, 'panel');
				Panel.Super.call(this, options);
			}
		});
		
		Sushi.extend(Panel.prototype, {
			 
			 // The default html `skeleton` to be used by the Panel. This can be overridden
			 // when extending the Panel View.
			 skeleton: template.compile('<div class="container"><header></header><article></article></div>'),
		
			 // Setup the routing for the Panel.
			 // The route for a Panel is as follows: `[stage name]/[panel name]/trans-:trans`
			 // where `trans-:trans` is optional and is used to set the transition effect.
			 // The `callback` gets called after the routing happens. Within the callback you
			 // should activate the Panel by calling the `active` method on it and/or 
			 // `render`etc...
			routePanel: function (callback) {
				if (this.stage) {
					this.stage.router.route(this.stage.name + '/' + this.name + '/trans-:trans', this.name, callback);
					this.stage.router.route(this.stage.name + '/' + this.name, this.name, callback);
				} else {
					throw new SushiError('A Stage for this Panel is not available.');
				}
			},
			
			// Called in the constructor during initialization.   
			_setup: function (options) {
				collection.bindAll(this);
			
				options.el ? this.el = options.el : this._ensureElement();
			
				// If a `name` is not provided, create one. The `name` is used
				// primarily for setting up the routes.
				this.name = options.name || utils.uniqueId('panel-');
			
				$(this.el).addClass('panel').html(this.skeleton());
			
				if (options.stage) {
					this.stage = options.stage;
					this.stage.add(this);
				}
			}
		});
		
		observer(Panel.prototype);
		state(Panel.prototype);
		cleanup(Panel.prototype);
		transitions(Panel.prototype);
		
		Sushi.manager = {
			Stage: Stage,
			Panel: Panel
		}
        
        return Sushi.manager;
 	}
 );
