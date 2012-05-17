/*
 * Sushi.ui.alert
 *
 */
 define('sushi.ui.alert',
 	// Module dependencies
 	[
 		'sushi.core',
 		'sushi.$',
 		'sushi.support.transition'
 	],

 	/**
 	 * Sushi ui.alert
 	 *
 	 * @namespace Sushi
 	 * @class ui.alert
 	 */
 	function(Sushi, $, support) {
		/* ==========================================================
		* bootstrap-alert.js v2.0.3
		* http://twitter.github.com/bootstrap/javascript.html#alerts
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
		
		
		/* ALERT CLASS DEFINITION
		* ====================== */
		
		var dismiss = '[data-dismiss="alert"]'
			, Alert = function (el) {
				$(el).on(dismiss, 'click', this.close, $)
			}
		
		Alert.prototype.close = function (e) {
			var $this = $(this)
				, selector = $this.attr('data-target')
				, $parent
			
			if (!selector) {
				selector = $this.attr('href')
				selector = selector && selector.replace(/.*(?=#[^\s]*$)/, '') //strip for ie7
			}
			
			$parent = $(selector)
			
			e && e.preventDefault()
			
			$parent.length || ($parent = $this.hasClass('alert') ? $this : $this.parent())
			
			$parent.trigger('close');
			
			$parent.removeClass('in')
			
			function removeElement() {
				$parent
				.trigger('closed')
				.remove()
			}
			
			support.transition && $parent.hasClass('fade') ?
			$parent.on(support.transition.end, removeElement) :
			removeElement()
		}
		
		
		/* ALERT PLUGIN DEFINITION
		* ======================= */
		
		Sushi.fn.alert = function (option) {
			return this.each(function () {
				var $this = $(this)
					, data = $this.data('alert')
				if (!data) $this.data('alert', (data = new Alert(this)))
				if (typeof option == 'string') data[option].call($this)
			})
		}
		
		Sushi.fn.alert.Constructor = Alert
		
		
		/* ALERT DATA-API
		* ============== */
		
		Sushi.ready(function () {
			$('body').on(dismiss, 'click.alert.data-api', Alert.prototype.close, $)
		})
 	}
 );
