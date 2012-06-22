/*
 * Sushi.ui.scrollable
 *
 */
 define('sushi.ui.scrollable',
 	// Module dependencies
 	[
 		'sushi.core',
 		'sushi.$',
 		'sushi.utils'
 	],

 	/**
 	 * Sushi ui.scrollable - based on https://github.com/LearnBoost/scrollable
 	 *
 	 * @namespace Sushi
 	 * @class ui.scrollable
 	 */
 	function(Sushi, $, utils) {        
        /**
		 * Scrollable pane constructor.
		 *
		 * @param {Element|jQuery} main pane
		 * @param {Object} options
		 *
		 */
        function Scrollable (el, opts) {
			this.el = $(el);
			this.options = opts || {};
			
			this.x = false !== this.options.x;
			this.y = false !== this.options.y;
			this.padding = undefined == this.options.padding ? 2 : this.options.padding;
			
			this.inner = this.el.find('.scrollable-inner');
			this.inner.css({
				'width': '+=' + scrollbarSize()
			  , 'height': '+=' + scrollbarSize()
			});
			
			this.refresh();
		};
        
        /**
		 * refresh scrollbars
		 *
		 */
		Scrollable.prototype.refresh = function() {
			var needHScroll = this.inner.get(0).scrollWidth > this.el.width()
			  , needVScroll = this.inner.get(0).scrollHeight > this.el.height();
			
			if (!this.horizontal && needHScroll && this.x) {
				this.horizontal = new Scrollbar.Horizontal(this);
			} else if (this.horizontal && !needHScroll)  {
				this.horizontal.destroy();
				this.horizontal = null
			}
			
			if (!this.vertical && needVScroll && this.y) {
				this.vertical = new Scrollbar.Vertical(this);
			} else if (this.vertical && !needVScroll)  {
				this.vertical.destroy();
				this.vertical = null
			}	
		};
		
		/**
		 * Cleans up.
		 *
		 * @return {Scrollable} for chaining
		 */
		Scrollable.prototype.destroy = function () {
			if (this.horizontal) {
				this.horizontal.destroy();
				this.horizontal = null;
			}
			if (this.vertical) {
				this.vertical.destroy();
				this.vertical = null;
			}
			return this;
		};
		
		/**
		 * Rebuild Scrollable.
		 *
		 * @return {Scrollable} for chaining
		 */
		Scrollable.prototype.rebuild = function () {
			this.destroy();
			this.inner.attr('style', '');
			Scrollable.call(this, this.el.get(0), this.options);
			return this;
		};
		
		/**
		 * Scrollbar constructor.
		 *
		 * @param {Element|jQuery} element
		 */
		function Scrollbar (pane) {
			this.pane = pane;
			this.pane.el.append(this.el);
			this.innerEl = this.pane.inner.get(0);
			
			this.dragging = false;
			this.enter = false;
			this.shown = false;
			
			// hovering
			this.pane.el.on('mouseenter', utils.bind(this.mouseenter, this));
			this.pane.el.on('mouseleave', utils.bind(this.mouseleave, this));
			
			// dragging
			this.el.on('mousedown', utils.bind(this.mousedown, this));
			// scrolling
			this.pane.inner.on('scroll', utils.bind(this.scroll, this));
			
			// wheel -optional-
			this.pane.inner.on('mousewheel', utils.bind(this.mousewheel, this));
			
			// show
			var initialDisplay = this.pane.options.initialDisplay;
			
			if (initialDisplay !== false) {
				this.show();
				this.hiding = setTimeout(utils.bind(this.hide, this), parseInt(initialDisplay, 10) || 3000);
			}
		};
		
		/**
		 * Cleans up.
		 *
		 * @return {Scrollbar} for chaining
		 */
		Scrollbar.prototype.destroy = function () {
			this.el.remove();
			return this;
		};
		
		/**
		 * Called upon mouseenter.
		 *
		 */
		Scrollbar.prototype.mouseenter = function () {
			this.enter = true;
			this.show();
		};
		
		/**
		 * Called upon mouseleave.
		 *
		 */
		Scrollbar.prototype.mouseleave = function () {
			this.enter = false;
			
			if (!this.dragging) {
				this.hide();
			}
		};
		
		/**
		 * Called upon wrap scroll.
		 *
		 */
		Scrollbar.prototype.scroll = function () {
			if (!this.shown) {
				this.show();
				if (!this.enter && !this.dragging) {
					this.hiding = setTimeout(utils.bind(this.hide, this), 1500);
				}
			}
			
			this.update();
		};
		
		/**
		 * Called upon scrollbar mousedown.
		 *
		 */
		Scrollbar.prototype.mousedown = function (ev) {
			ev.preventDefault();
			
			this.dragging = true;
			
			this.startPageY = ev.pageY - parseInt(this.el.css('top'), 10);
			this.startPageX = ev.pageX - parseInt(this.el.css('left'), 10);
			
			// prevent crazy selections on IE
			document.onselectstart = function () { return false; };
			
			var pane = this.pane
			  , move = utils.bind(this.mousemove, this)
			  , self = this
			
			$(document)
				.on('mousemove', move)
			  	.on('mouseup', function () {
					self.dragging = false;
					document.onselectstart = null;
			
					$(document).unbind('mousemove', move);
			
					if (!self.enter) {
				  		self.hide();
					}
			});
		};
		
		/**
		 * Show scrollbar.
		 *
		 */
		Scrollbar.prototype.show = function (duration) {
			if (!this.shown) {
				this.update();
				this.el.addClass('scrollable-scrollbar-shown');
				if (this.hiding) {
					clearTimeout(this.hiding);
					this.hiding = null;
				}
				this.shown = true;
			}
		};
		
		/**
		 * Hide scrollbar.
		 *
		 */
		Scrollbar.prototype.hide = function () {
			if (this.shown) {
				// check for dragging
				this.el.removeClass('scrollable-scrollbar-shown');
				this.shown = false;
			}
		};
		
		/**
		 * Horizontal scrollbar constructor
		 *
		 */
		Scrollbar.Horizontal = function (pane) {
			this.el = $('<div class="scrollable-scrollbar scrollable-scrollbar-horizontal">');
			Scrollbar.call(this, pane);
		};
		
		Sushi.extend(Scrollbar.Horizontal.prototype, Scrollbar.prototype);
		
		/**
		 * Updates size/position of scrollbar.
		 *
		 */
		Scrollbar.Horizontal.prototype.update = function () {
			var paneWidth = this.pane.el.width()
			  , trackWidth = paneWidth - this.pane.padding * 2
			  , innerEl = this.pane.inner.get(0)
			
			this.el
			  .css('width', trackWidth * paneWidth / innerEl.scrollWidth)
			  .css('left', trackWidth * innerEl.scrollLeft / innerEl.scrollWidth)
		};
		
		/**
		 * Called upon drag.
		 *
		 */
		Scrollbar.Horizontal.prototype.mousemove = function (ev) {
			var trackWidth = this.pane.el.width() - this.pane.padding * 2
			  , pos = ev.pageX - this.startPageX
			  , barWidth = this.el.width()
			  , innerEl = this.pane.inner.get(0)
			
			// minimum top is 0, maximum is the track height
			var y = Math.min(Math.max(pos, 0), trackWidth - barWidth)
			
			innerEl.scrollLeft = (innerEl.scrollWidth - this.pane.el.width()) * y / (trackWidth - barWidth);
		};
		
		/**
		 * Called upon container mousewheel.
		 *
		 */
		Scrollbar.Horizontal.prototype.mousewheel = function (ev, delta, x, y) {
			if ((x < 0 && 0 == this.pane.inner.get(0).scrollLeft) ||
				(x > 0 && (this.innerEl.scrollLeft + this.pane.el.width()
				  == this.innerEl.scrollWidth))) {
				ev.preventDefault();
				return false;
			}
		};
		
		/**
		 * Vertical scrollbar constructor
		 *
		 */
		Scrollbar.Vertical = function (pane) {
			this.el = $('<div class="scrollable-scrollbar scrollable-scrollbar-vertical">');
			Scrollbar.call(this, pane);
		};
		
		Sushi.extend(Scrollbar.Vertical.prototype, Scrollbar.prototype);
		
		/**
		 * Updates size/position of scrollbar.
		 *
		 */
		
		Scrollbar.Vertical.prototype.update = function () {
			var paneHeight = this.pane.el.height()
			  , trackHeight = paneHeight - this.pane.padding * 2
			  , innerEl = this.innerEl
			
			this.el
			  .css('height', trackHeight * paneHeight / innerEl.scrollHeight)
			  .css('top', trackHeight * innerEl.scrollTop / innerEl.scrollHeight)
		};
		
		/**
		 * Called upon drag.
		 *
		 */
		Scrollbar.Vertical.prototype.mousemove = function (ev) {
			var paneHeight = this.pane.el.height()
			  , trackHeight = paneHeight - this.pane.padding * 2
			  , pos = ev.pageY - this.startPageY
			  , barHeight = this.el.height()
			  , innerEl = this.innerEl
			
			// minimum top is 0, maximum is the track height
			var y = Math.min(Math.max(pos, 0), trackHeight - barHeight)
			
			innerEl.scrollTop = (innerEl.scrollHeight - paneHeight) * y / (trackHeight - barHeight)
		};
		
		/**
		 * Called upon container mousewheel.
		 *
		 */
		Scrollbar.Vertical.prototype.mousewheel = function (ev, delta, x, y) {
			if ((y > 0 && 0 == this.innerEl.scrollTop) ||
				(y < 0 && (this.innerEl.scrollTop + this.pane.el.height()
				  == this.innerEl.scrollHeight))) {
				ev.preventDefault();
				return false;
			}
		};
		
		/**
		 * Scrollbar size detection.
		 */
		var size;
		
		function scrollbarSize () {
			if (size === undefined) {
			  var div = $(
				  '<div style="width:50px;height:50px;overflow:hidden;'
				+ 'position:absolute;top:-200px;left:-200px;"><div style="height:100px;">'
				+ '</div>'
			  );
			
			  $('body').append(div);
			
			  var w1 = $('div', div).width();
			  div.css('overflow-y', 'scroll');
			  var w2 = $('div', div).width();
			  $(div).remove();
			
			  size = w1 - w2;
			}
		
			return size;
		};
  
  		/**
  		 * Sushi Plugin definition
  		 */
        $.fn.scrollable = function (option) {
			return this.each(function () {
				var $this = $(this)
					, data = $this.data('scrollable')
					, options = typeof option == 'object' && option
				
				if (!data) $this.data('scrollable', (data = new Scrollable(this, options)))
				if (typeof option == 'string') data[option]()
			});
		};
 	}
 );
