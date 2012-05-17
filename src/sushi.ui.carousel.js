/*
 * Sushi.ui.carousel
 *
 */
 define('sushi.ui.carousel',
 	// Module dependencies
 	[
 		'sushi.core',
 		'sushi.utils',
 		'sushi.$',
 		'sushi.support.transition'
 	],

 	/**
 	 * Sushi ui.carousel
 	 *
 	 * @namespace Sushi
 	 * @class ui.carousel
 	 */
 	function(Sushi, utils, $, support) {
		/* ==========================================================
		* bootstrap-carousel.js v2.0.3
		* http://twitter.github.com/bootstrap/javascript.html#carousel
		* ==========================================================
		* Copyright 2012 Twitter, Inc.
		*
		* Licensed under the Apache License, Version 2.0 (the "License");
		* you may not use this file except in compliance with the License.
		* You may obtain a copy of the License at
		*
		* http://www.apache.org/licenses/LICENSE-2.0
		*
		* Unless required by applicable law or agreed to in writing, software
		* distributed under the License is distributed on an "AS IS" BASIS,
		* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
		* See the License for the specific language governing permissions and
		* limitations under the License.
		* ========================================================== */
		
		
		/* CAROUSEL CLASS DEFINITION
		* ========================= */
		
		var Carousel = function (element, options) {
			this.$element = $(element)
			this.options = options
			this.options.slide && this.slide(this.options.slide)
			this.options.pause == 'hover' && this.$element
				.on('mouseenter', utils.bind(this.pause, this))
				.on('mouseleave', utils.bind(this.cycle, this))
		}
		
		Carousel.prototype = {
		
			cycle: function (e) {
				if (!e) this.paused = false
				this.options.interval
				&& !this.paused
				&& (this.interval = setInterval(utils.bind(this.next, this), this.options.interval))
				return this
			}
		
			, to: function (pos) {
				var $active = this.$element.find('.active')
					, children = $active.parent().children()
					, activePos = children.index($active)
					, that = this
				
				if (pos > (children.length - 1) || pos < 0) return
				
				if (this.sliding) {
					return this.$element.one('slid', function () {
						that.to(pos)
					})
				}
		
				if (activePos == pos) {
					return this.pause().cycle()
				}
				
				return this.slide(pos > activePos ? 'next' : 'previous', $(children[pos]))
			}
		
			, pause: function (e) {
				if (!e) this.paused = true
				clearInterval(this.interval)
				this.interval = null
				return this
			}
		
			, next: function () {
				if (this.sliding) return
				return this.slide('next')
			}
		
			, previous: function () {
				if (this.sliding) return
				return this.slide('previous')
			}
		
			, slide: function (type, next) {
				var $active = this.$element.find('.active')
					, $next = next || $active[type]()
					, isCycling = this.interval
					, direction = type == 'next' ? 'left' : 'right'
					, fallback  = type == 'next' ? 'first' : 'last'
					, that = this
					, e = 'slide'
				
				this.sliding = true
				
				isCycling && this.pause()
				
				$next = $next.length ? $next : this.$element.find('.item')[fallback]()
				
				if ($next.hasClass('active')) return
				
				if (support.transition && this.$element.hasClass('slide')) {
					this.$element.trigger(e)
					$next.addClass(type)
					$next[0].offsetWidth // force reflow
					$active.addClass(direction)
					$next.addClass(direction)
					this.$element.one($.support.transition.end, function () {
						$next.removeClass([type, direction].join(' ')).addClass('active')
						$active.removeClass(['active', direction].join(' '))
						that.sliding = false
						setTimeout(function () { that.$element.trigger('slid') }, 0)
					})
				} else {
					this.$element.trigger(e)
					$active.removeClass('active')
					$next.addClass('active')
					this.sliding = false
					this.$element.trigger('slid')
				}
				
				isCycling && this.cycle()
				
				return this
			}
		
		}
		
		
		/* CAROUSEL PLUGIN DEFINITION
		* ========================== */
		
		Sushi.fn.carousel = function (option) {
			return this.each(function () {
				var $this = $(this)
					, data = $this.data('carousel')
					, options = (function(){
						var opts = {};
						Sushi.extend(opts, Sushi.fn.carousel.defaults);
						Sushi.extend(opts, typeof option == 'object' && option);
						return opts;
					}());	
					
				if (!data) $this.data('carousel', (data = new Carousel(this, options)))
				if (typeof option == 'number') data.to(option)
				else if (typeof option == 'string' || (option = options.slide)) data[option]()
				else if (options.interval) data.cycle()
			})
		}
		
		Sushi.fn.carousel.defaults = {
			interval: 5000
			, pause: 'hover'
		}
		
		Sushi.fn.carousel.Constructor = Carousel
		
		
		/* CAROUSEL DATA-API
		* ================= */
		
		Sushi.ready(function () {
			$('body').on('[data-slide]', 'click.carousel.data-api', function ( e ) {
				var $this = $(this), href
				, $target = $($this.attr('data-target') || (href = $this.attr('href')) && href.replace(/.*(?=#[^\s]+$)/, '')) //strip for ie7
				, options = (function() {
					var opts = {};
					if (!$target.data('modal')) {
						Sushi.extend(opts, $target.data());
						Sushi.extend(opts, $this.data());
					}
					return opts;
				}());
				
				$target.carousel(options)
				e.preventDefault()
			})
		})
 	}
 );
