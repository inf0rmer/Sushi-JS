/*
 * Sushi.ui.modal
 *
 */
 define('sushi.ui.modal',
 	// Module dependencies
 	[
 		'sushi.core',
 		'sushi.$',
 		'sushi.utils',
 		'sushi.support',
 		'sushi.support.transition'
 	],

 	/**
 	 * Sushi ui.modal
 	 *
 	 * @namespace Sushi
 	 * @class ui.modal
 	 */
 	function(Sushi, $, utils, support) {
        /* MODAL CLASS DEFINITION
		  * ====================== */
		
		  var Modal = function (content, options) {
			this.options = options
			this.$element = $(content);
			
			this.$element.delegate('[data-dismiss="modal"]', 'click.dismiss.modal', utils.bind(this.hide, this));
		  }
		
		  Modal.prototype = {
		
			  constructor: Modal
		
			, toggle: function () {
				return this[!this.isShown ? 'show' : 'hide']()
			  }
		
			, show: function (e) {
				var that = this;
				
				this.$element.trigger('show')
		
				if (this.isShown) return
		
				$('body').addClass('modal-open')
		
				this.isShown = true
		
				escape.call(this)
				backdrop.call(this, function () {
				  var transition = $.support.transition && that.$element.hasClass('fade')
				  if (!that.$element.parent().length) {
					that.$element.appendTo(document.body) //don't move modals dom position
				  }
		
				  that.$element
					.show()
					
				  if (transition) {
					that.$element[0].offsetWidth // force reflow
				  }
		
				  that.$element.addClass('in')
				  transition ?
					that.$element.one($.support.transition.end, function () { that.$element.trigger('shown') }) :
					that.$element.trigger('shown')
				})
			  }
		
			, hide: function (e) {
				e && e.preventDefault()
		
				var that = this
		
				this.$element.trigger('hide')
		
				if (!this.isShown) return
		
				this.isShown = false
		
				$('body').removeClass('modal-open')
		
				escape.call(this)
		
				this.$element.removeClass('in')
		
				$.support.transition && this.$element.hasClass('fade') ?
				  hideWithTransition.call(this) :
				  hideModal.call(this)
			  }
		
		  }
		
		
		 /* MODAL PRIVATE METHODS
		  * ===================== */
		
		  function hideWithTransition() {
			var that = this
			  , timeout = setTimeout(function () {
				  $(that.$element).off($.support.transition.end)
				  hideModal.call(that)
				}, 500)
		
			$(this.$element).one($.support.transition.end, function () {
			  clearTimeout(timeout)
			  hideModal.call(that)
			})
		  }
		
		  function hideModal(that) {
			this.$element
			  .hide()
			  .trigger('hidden')
			backdrop.call(this)
		  }
		
		  function backdrop(callback) {
			var that = this
			  , animate = this.$element.hasClass('fade') ? 'fade' : ''
		
			if (this.isShown && this.options.backdrop) {
			  var doAnimate = $.support.transition && animate
		
			  this.$backdrop = $('<div class="modal-backdrop ' + animate + '" />')
				.appendTo(document.body)
		
			  if (this.options.backdrop != 'static') {
				$(this.$backdrop).on('click', utils.bind(this.hide, this))
			  }
		
			  if (doAnimate) this.$backdrop[0].offsetWidth // force reflow
		
			  this.$backdrop.addClass('in')
		
			  doAnimate ?
				$(this.$backdrop).one($.support.transition.end, callback) :
				callback()
		
			} else if (!this.isShown && this.$backdrop) {
			  this.$backdrop.removeClass('in')
			  
			  $.support.transition && this.$element.hasClass('fade')?
				$(this.$backdrop).one($.support.transition.end, utils.bind(removeBackdrop, this)) :
				removeBackdrop.call(this)
		
			} else if (callback) {
			  callback()
			}
		  }
		
		  function removeBackdrop() {
			this.$backdrop.remove()
			this.$backdrop = null
		  }
		
		  function escape() {
			var that = this
			if (this.isShown && this.options.keyboard) {
			  $(document).on('keyup.dismiss.modal', function ( e ) {
				e.which == 27 && that.hide()
			  })
			} else if (!this.isShown) {
			  $(document).off('keyup.dismiss.modal')
			}
		  }
		
		
		 /* MODAL PLUGIN DEFINITION
		  * ======================= */
		
		  Sushi.fn.modal = function (option) {
			return this.each(function () {
			  var $this = $(this)
				, data = $this.data('modal')
				, options = {};
				
			  options = Sushi.extend(options, Sushi.fn.modal.defaults, $this.data(), typeof option == 'object' && option);
			  
			  if (!data) $this.data('modal', (data = new Modal(this, options)))
			  if (typeof option == 'string') data[option]()
			  else if (options.show) data.show()
			})
		  }
		
		  Sushi.fn.modal.defaults = {
			  backdrop: true
			, keyboard: true
			, show: true
		  }
		
		  Sushi.fn.modal.Constructor = Modal
		
		
		 /* MODAL DATA-API
		  * ============== */
		
		  Sushi.ready(function () {
			$('body').delegate('[data-toggle="modal"]', 'click', function ( e ) {
			
			  var $this = $(this), href
				, $target = $($this.attr('data-target') || (href = $this.attr('href')) && href.replace(/.*(?=#[^\s]+$)/, '')) //strip for ie7
				, option
				, data = {};
				
				Sushi.extend(data, $target.data(), $this.data());
				
				$target.data('modal') ? 'toggle' : data

			  e.preventDefault()
			  $target.modal(option)
			});
		  })
 	}
 );
