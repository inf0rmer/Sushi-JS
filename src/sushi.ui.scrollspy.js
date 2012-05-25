/*
 * Sushi.ui.scrollspy
 *
 */
 define('sushi.ui.scrollspy',
 	// Module dependencies
 	[
 		'sushi.core',
 		'sushi.utils',
 		'sushi.enumerable',
 		'sushi.$'
 	],

 	/**
 	 * Sushi ui.scrollspy
 	 *
 	 * @namespace Sushi
 	 * @class ui.scrollspy
 	 */
 	function(Sushi, utils, Enumerable, $) {
		/* =============================================================
		* bootstrap-scrollspy.js v2.0.3
		* http://twitter.github.com/bootstrap/javascript.html#scrollspy
		* =============================================================
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
		* ============================================================== */
		
		
		
		
		/* SCROLLSPY CLASS DEFINITION
		* ========================== */
		
		function ScrollSpy( element, options) {
			var process = utils.bind(this.process, this)
				, $element = $(element).is('body') ? $(window) : $(element)
				, href
			this.options = {}
			this.options = Sushi.extend(this.options, Sushi.fn.scrollspy.defaults, options);
			this.$scrollElement = $element
			if (this.$scrollElement.get(0) === window) {
				$(document).on('scroll.scroll.data-api', process)
			} else {
				this.$scrollElement.on('scroll.scroll.data-api', process)
			}
			
			this.selector = (this.options.target
			|| ((href = $(element).attr('href')) && href.replace(/.*(?=#[^\s]+$)/, '')) //strip for ie7
			|| '') + ' .nav li > a'
			this.$body = $('body')
			this.refresh()
			this.process()
		}
		
		ScrollSpy.prototype = {
		
			refresh: function () {
				var self = this
					, $targets
				
				this.offsets = new Enumerable([])
				this.targets = new Enumerable([])
				
				$targets = this.$body
				.find(this.selector);
				
				$targets = new Enumerable($targets);
				
				$targets.map(function (target) {
					var $el = $(target)
						, href = $el.data('target') || $el.attr('href')
						, $href = /^#\w/.test(href) && $(href)
						
					if (href === '#') {
						$href = [];
						href = '';
					}
					
					return ( $href
						&& href.length
						&& [[ $href.position().top, href ]] ) || null
				})
				.reject(function(val) {
					return val == null
				})
				.sort(function (a, b) { return a[0] - b[0] })
				.each(function (target) {
					self.offsets.push(target[0][0])
					self.targets.push(target[0][1])
				})
			}
			
			, process: function () {
				var scrollTop = this.$scrollElement.scrollTop() + this.options.offset
					, scrollHeight = this.$scrollElement[0].scrollHeight || this.$body[0].scrollHeight
					, maxScroll = scrollHeight - this.$scrollElement.height()
					, offsets = this.offsets
					, targets = this.targets
					, activeTarget = this.activeTarget
					, i
				
				if (scrollTop >= maxScroll) {
					i = targets.last();
					
					if (!i) i = [];
					
					return activeTarget != ( i )
					&& this.activate ( i )
				}
				
				for (i = offsets.length; i--;) {
					activeTarget != targets[i]
					&& scrollTop >= offsets[i]
					&& (!offsets[i + 1] || scrollTop <= offsets[i + 1])
					&& this.activate( targets[i] )
				}
			}
			
			, activate: function (target) {
				var active
					, selector
				
				this.activeTarget = target
				
				$(this.selector)
					.parent('.active')
					.removeClass('active')
				
				selector = this.selector
					+ '[data-target="' + target + '"],'
					+ this.selector + '[href="' + target + '"]'
				
				active = $(selector)
					.parent('li')
					.addClass('active')
				
				if (active.parent('.dropdown-menu'))  {
					active = active.closest('li.dropdown').addClass('active')
				}
				
				active.trigger('activate')
			}
		
		}
		
		
		/* SCROLLSPY PLUGIN DEFINITION
		* =========================== */
		
		Sushi.fn.scrollspy = function ( option ) {
			return this.each(function () {
				var $this = $(this)
					, data = $this.data('scrollspy')
					, options = typeof option == 'object' && option
				if (!data) $this.data('scrollspy', (data = new ScrollSpy(this, options)))
				if (typeof option == 'string') data[option]()
			})
		}
		
		Sushi.fn.scrollspy.Constructor = ScrollSpy
		
		Sushi.fn.scrollspy.defaults = {
			offset: 10
		}
		
		
		/* SCROLLSPY DATA-API
		* ================== */
		
		Sushi.ready(function () {
			$('[data-spy="scroll"]').each(function () {
				var $spy = $(this)
				$spy.scrollspy($spy.data())
			})
		})

 	}
 );
