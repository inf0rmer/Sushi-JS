/*
 * Sushi.ui.dropdown
 *
 */
 define('sushi.ui.dropdown',
 	// Module dependencies
 	[
 		'sushi.core',
 		'sushi.$'
 	],

 	/**
 	 * Sushi ui.dropdown
 	 *
 	 * @namespace Sushi
 	 * @class ui.dropdown
 	 */
 	function(Sushi, $) {
        /* ============================================================
		 * bootstrap-dropdown.js v2.0.3
		 * http://twitter.github.com/bootstrap/javascript.html#dropdowns
		 * ============================================================
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
		 * ============================================================ */
		
		
		 /* DROPDOWN CLASS DEFINITION
		  * ========================= */
		
		  var toggle = '[data-toggle="dropdown"]'
			, Dropdown = function (element) {
				var $el = $(element).on('click.dropdown.data-api', this.toggle)
				$('html').on('click.dropdown.data-api', function () {
				  $el.parent().removeClass('open')
				})
			  }
		
			Dropdown.prototype = {
			
				constructor: Dropdown,
			
				toggle: function (e) {
					var $this = $(this)
						, $parent
						, selector
						, isActive
					
					if ($this.is('.disabled') === true || $this.attr('disabled') != null) return

					selector = $this.attr('data-target')
					
					if (!selector) {
						selector = $this.attr('href')
						selector = selector && selector.replace(/.*(?=#[^\s]*$)/, '') //strip for ie7
						if (selector === '#' || selector === '.') selector = null;
					}
					
					$parent = $(selector)
					$parent.length || ($parent = $this.parent())
					
					isActive = $parent.hasClass('open')
					
					
					clearMenus()
					
					if (!isActive) $parent.toggleClass('open')
					
					e.preventDefault();
					
					return false
				}
			
			}
		
			function clearMenus() {
				$(toggle).parent().removeClass('open')
			}
		
		
		  	/* DROPDOWN PLUGIN DEFINITION
		   	 * ========================== */
		
			Sushi.fn.dropdown = function (option) {
				return this.each(function () {
					var $this = $(this)
						, data = $this.data('dropdown')
						
						if (!data) $this.data('dropdown', (data = new Dropdown(this)))
						if (typeof option == 'string') data[option].call($this)
				});
			}
		
		  	$.fn.dropdown.Constructor = Dropdown
		
		
			/* APPLY TO STANDARD DROPDOWN ELEMENTS
			 * =================================== */
		
			Sushi.ready(function () {
				$('html').on('click.dropdown.data-api', clearMenus)
				$('html')
				  .on('.dropdown form', 'click.dropdown', function (e) { e.stopPropagation() })
				  .on(toggle, 'click.dropdown.data-api', Dropdown.prototype.toggle)
			});
 	}
 );
