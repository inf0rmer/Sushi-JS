/*
 * Sushi.ui.popover
 *
 */
 define('sushi.ui.popover',
 	// Module dependencies
 	[
 		'sushi.core',
 		'sushi.$',
 		'sushi.utils',
 		'sushi.support',
 		'sushi.support.transition',
 		'sushi.ui.tooltip'
 	],

 	/**
 	 * Sushi ui.popover
 	 *
 	 * @namespace Sushi
 	 * @class ui.popover
 	 */
 	function(Sushi, $, utils, support) {
		/* ===========================================================
		 * bootstrap-popover.js v2.0.3
		 * http://twitter.github.com/bootstrap/javascript.html#popovers
		 * ===========================================================
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
		 * =========================================================== */
		
	 	/* POPOVER PUBLIC CLASS DEFINITION
	  	 * =============================== */
		
		var Popover = function ( element, options ) {
			this.init('popover', element, options)
		}
		
		
		/* NOTE: POPOVER EXTENDS SUSHI.UI.TOOLTIP.js
		   ========================================== */
		Popover.prototype = {}
		Sushi.extend(Popover.prototype, Sushi.fn.tooltip.Constructor.prototype)
		
		Sushi.extend(Popover.prototype, {
		
			constructor: Popover
		
		  , setContent: function () {
				var $tip = this.tip()
				, title = this.getTitle()
				, content = this.getContent()
		
				$tip.find('.popover-title')[this.isHTML(title) ? 'html' : 'text'](title)
				$tip.find('.popover-content > *')[this.isHTML(content) ? 'html' : 'text'](content)
		
				$tip.removeClass('fade top bottom left right in')
			}
		
		  , hasContent: function () {
				return this.getTitle() || this.getContent()
			}
		
		  , getContent: function () {
				var content
				, $e = this.$element
				, o = this.options
		
				content = $e.attr('data-content')
					|| (typeof o.content == 'function' ? o.content.call($e[0]) :  o.content)

				return content
			}
		
		  , tip: function () {
				if (!this.$tip) {
					this.$tip = $(this.options.template)
				}
				return this.$tip
			}
		
		  });
		
		
		/* POPOVER PLUGIN DEFINITION
		 * ======================= */
	
		Sushi.fn.popover = function (option) {
			return this.each(function () {
				var $this = $(this)
					, data = $this.data('popover')
					, options = typeof option == 'object' && option
				
				if (!data) $this.data('popover', (data = new Popover(this, options)))
				if (typeof option == 'string') data[option]()
			})
		}
		
		Sushi.fn.popover.Constructor = Popover
		
		Sushi.fn.popover.defaults = {}
		Sushi.extend(Sushi.fn.popover.defaults, Sushi.fn.tooltip.defaults)
		
		Sushi.extend(Sushi.fn.popover.defaults, {
			placement: 'right'
		  , content: ''
		  , template: '<div class="popover"><div class="arrow"></div><div class="popover-inner"><h3 class="popover-title"></h3><div class="popover-content"><p></p></div></div></div>'
		})
	}
 );
