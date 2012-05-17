/*
 * Sushi.ui.tab
 *
 */
 define('sushi.ui.tab',
 	// Module dependencies
 	[
 		'sushi.core',
 		'sushi.$',
 		'sushi.support.transition'
 	],

 	/**
 	 * Sushi ui.tab
 	 *
 	 * @namespace Sushi
 	 * @class ui.tab
 	 */
 	function(Sushi, $, support) {
		/* ========================================================
		 * bootstrap-tab.js v2.0.3
		 * http://twitter.github.com/bootstrap/javascript.html#tabs
		 * ========================================================
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
		 * ======================================================== */
		
		
		/* TAB CLASS DEFINITION
		 * ==================== */
		
		var Tab = function ( element ) {
			this.element = $(element)
		}
		
		Tab.prototype = {
		
			Constructor: Tab
		
			, show: function () {
				var $this = this.element,
					$ul = $this.closest('ul:not(.dropdown-menu)'),
					selector = $this.attr('data-target'),
					previous,
					$target,
					e;
				
				if (!selector) {
					selector = $this.attr('href')
					selector = selector && selector.replace(/.*(?=#[^\s]*$)/, '') //strip for ie7
				}
				
				if ( $this.parent('li').hasClass('active') ) return
				
				previous = $ul.find('.active a').last()[0]
				
				$this.trigger('show', [{
					relatedTarget: previous
				}])
				
				//if (e.isDefaultPrevented()) return
				
				$target = $(selector)
				
				this.activate($this.parent('li'), $ul)
				this.activate($target, $target.parent(), function () {
					$this.trigger('shown', [{
						relatedTarget: previous
					}])
				})
			},
		
			activate: function ( element, container, callback) {
				var $active = container.find('> .active'),
					transition = callback 
						&& support.transition 
						&& $active.hasClass('fade');
				
				function next() {
					$active
						.removeClass('active')
						.find('> .dropdown-menu > .active')
						.removeClass('active')
					
					element.addClass('active')

					if (transition) {
						element[0].offsetWidth // reflow for transition
						element.addClass('in')
					} else {
						element.removeClass('fade')
					}
					
					if ( element.parent('.dropdown-menu') ) {
						element.closest('li.dropdown').addClass('active')
					}
					
					callback && callback()
				}
				
				transition ?
					$active.one(support.transition.end, next):
					next()
				
				$active.removeClass('in')
			}
		}
		
		
		/* TAB PLUGIN DEFINITION
		 * ===================== */
		
		Sushi.fn.tab = function ( option ) {
			return this.each(function () {
				var $this = $(this),
					data = $this.data('tab')
				if (!data) $this.data('tab', (data = new Tab(this)))
				if (typeof option == 'string') data[option]()
			})
		}
		
		Sushi.fn.tab.Constructor = Tab
		
		
		/* TAB DATA-API
		 * ============ */
		
		Sushi.ready(function () {
			$('body').on('[data-toggle="tab"], [data-toggle="pill"]', 'click.tab.data-api', function (e) {
				e.preventDefault()
				$(this).tab('show')
			})
		})
 	}
 );
