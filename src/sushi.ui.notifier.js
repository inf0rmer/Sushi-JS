/*
 * Sushi.ui.notifier
 *
 */
 define('sushi.ui.notifier',
 	// Module dependencies
 	[
 		'sushi.core',
 		'sushi.$',
 		'sushi.utils',
 		'sushi.ui.alert',
 		'sushi.support',
 		'sushi.support.transition',
 		'sushi.fx',
 		'sushi.gfx'
 	],

 	/**
 	 * Sushi ui.notifier
 	 *
 	 * @namespace Sushi
 	 * @class ui.notifier
 	 */
 	function(Sushi, $, utils, alert, support) {
 		
 		var Notification = function (element, options) {
			var self = this;
			
			// Element collection
			this.$element = $(element);
			this.$note    = $('<div class="alert"></div>');
			this.options  = Sushi.extend({}, Sushi.fn.notify.defaults, options);
			
			// Setup from options
			if (this.options.transition === 'fade') {
				this.$note.addClass('in').addClass(this.options.transition);
			} else {
				this.$note.addClass(this.options.transition);
			}
			
			this.$note.addClass('alert-' + this.options.type);
			
			this.$note.html(this.options.message);
			
			if (this.options.closable) {
				this.$note.prepend($('<a class="close pull-right" data-dismiss="alert" href="#">&times;</a>'))
			}
			
			if (this.options.pauseOnHover) {
				this.$note.on('mouseenter', function() {
					if (self.fadeTimer) {
						clearTimeout(self.fadeTimer);
						self.fadeTimer = null;
					}
				});
				
				this.$note.on('mouseout', function() {
					self._fadeOut({
						delay: 250
					})
				});
			}
			
			return this;
		}
		
		Notification.prototype._fadeOut = function(options) {
			if (!options) options = {}
			var self = this;
			self.fadeTimer = setTimeout(function() {
				self.$note.gfxFadeOut(function () {
					self.options.onClose()
					$(this).remove()
					self.options.onClosed()
				});
			}, options.delay || this.options.fadeOut.delay || 3000);
		}
			
		Notification.prototype.show = function () {
			var self = this;
			
			if (this.options.fadeOut.enabled) this._fadeOut();
				
			this.$element.append(this.$note)
			this.$note.alert();
		}
			
		Notification.prototype.hide = function () {
			var self = this;
			
			if (this.options.fadeOut.enabled) {				
				this._fadeOut();
			} else {
				self.options.onClose()
				this.$note.remove()
				self.options.onClosed()
			}
		}
			
		Sushi.fn.notify = function (options) {
			return new Notification(this, options)
		}
			
		Sushi.fn.notify.defaults = {
			type: 'success',
			closable: true,
			transition: 'fade',
			fadeOut: {
				enabled: true,
				delay: 3000
			},
			pauseOnHover: true,
			message: 'This is a message.',
			onClose: function () {},
			onClosed: function () {}
		}
		
		return Notification;
 	}
 );
