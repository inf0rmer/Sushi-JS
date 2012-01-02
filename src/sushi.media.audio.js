/**
 * Sushi Audio
 *
 * @module Sushi
 */
define(
	['sushi.core', 'sushi.utils', 'sushi.event', 'sushi.utils.collection', 'sushi.template', 'lib/jquery', 'sushi.utils.debug'],

	/**
	 * Sushi HTML5 Audio Manager
	 *
	 * @namespace Sushi
	 * @class audio
	 */
	function() {
		Sushi.namespace('media.audio');
		
		// An object holds all Audio objects created
		var _cache = {},
		
		cid = 0,
		
		// Player object defaults
		defaults = {
			autoplay: false,
			preload: true,
			controls: false,
			template: '<audio id="{{id}}" {{#if options.controls}} controls {{/if}} {{#if options.preload}} preload="auto" {{/if}}> {{#sources}}<source src="{{file}}" type="audio/{{format}}" />{{/sources}}</audio>'
		},
		
		//Constructor object
		Player = function(id, sources, settings) {
			this.id = 'audio-' + id;
			this.options = Sushi.extend(defaults, settings || {});
			this.element = null;
			this.setSources(sources);
			this.setTemplate(this.options.template);
			
			this.render();
			
			var element = this.element;
			
			//if (this.options.preload) element.load();
			
			if ((element.buffered != undefined)) {
				$(element).bind('progress', function() {
					if (!element.duration) return false;
					
					var loaded = parseInt(((element.buffered.end(0) / element.duration) * 100), 10);
					if (loaded >= 100) Sushi.pubsub.publish('audio/loaded', id);
				});
			}
		},
		
		// Module methods
		create = function(sources, settings) {
			var id = cid++;
			player = new Player(id, sources, settings);
			// Add it to the cache
			_cache[id] = player;
			
			return player;
		},
		
		playAll = function() {
			Sushi.utils.each(_cache, function(player) {
				player.play();
			});
		},
		
		stopAll = function() {
			Sushi.utils.each(_cache, function(player) {
				player.stop();
			});
		},
		
		removeAll = function() {
			Sushi.utils.each(_cache, function(player) {
				player.dealloc();
			});
		};
		
		// Class methods
		Player.prototype = {			
			setSources: function(sources) {
				var objectified = [];
				
				Sushi.utils.each(sources, function(source){
					objectified.push({
						file: source,
						format: /[^.]+$/.exec(source)[0]
					});
				});
				
				this.sources = objectified;
			},
			
			getSources: function() {
				return this.sources;
			},
			
			setTemplate: function(string) {
				this.template = Sushi.template.compile(string);
			},
			
			getTemplate: function() {
				return this.template;
			},
			
			setOptions: function(options) {
				this.options = options;
			},
			
			getOptions: function() {
				return this.options;
			},
			
			resetOptions: function() {
				this.setOptions(defaults);
			},
			
			setOption: function(option, value) {
				if (this.options[option] === undefined) return 'Invalid option!';
				
				this.options[option] = value;
				
				// Search the dom for this element and update the option
				var $element = jQuery('#' + this.id);
				
				if ($element.length) {
					$element.attr(option, value);
				}
			},
			
			getOption: function(option) {
				if (!this.option) return 'Invalid option!';
				
				return this.option;
			},
			
			render: function() {
				if (typeof this.template != 'function') return 'No valid template';
				
				var data = {
					sources: this.sources,
					options: this.options,
					id: this.id
				};
				
				this.element = jQuery(this.template(data)).get(0);
				
				return this.element;
			},
			
			play: function() {
				if (!this.element || !this.element.play) throw new Error('Player has no DOM element!');
				
				return this.element.play();
			},
			
			stop: function() {
				if (!this.element || !this.element.pause) throw new Error('Player has no DOM element!');
				
				this.element.pause();
				
				if (this.element.currentTime) this.element.currentTime = 0;
				return true;
			},
			
			pause: function() {
				if (!this.element || !this.element.pause) throw new Error('Player has no DOM element!');
				
				return this.element.pause();
			},
			
			getCurrentTime: function() {
				if (!this.element) return 'Player has no DOM element!';
				
				return this.element.currentTime;
			},
			
			dealloc: function() {
				$(this.element).remove();
				delete _cache[this.id];
			}
		}
		
		Sushi.extend(Sushi.media.audio, {
			create: create,
			playAll: playAll,
			stopAll: stopAll,
			removeAll: removeAll
		});
	}
);