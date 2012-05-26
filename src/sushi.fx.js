/*
 * Sushi.fx
 *
 */
 define('sushi.fx',
 	// Module dependencies
 	[
 		'sushi.core',
 		'sushi.$',
 		'sushi.utils',
 		'sushi.utils.collection'
 	],

 	/**
 	 * Sushi fx
 	 *
 	 * @namespace Sushi
 	 * @class fx
 	 */
 	function(Sushi, $, utils, collection) {
 		
 		var prefix = '', eventPrefix, endEventName, endAnimationName,
			vendors = { webkit: 'webkit', moz: '', o: 'o', ms: 'MS' },
			document = window.document, testEl = document.createElement('div'),
			supportedTransforms = /^((translate|rotate|scale)(X|Y|Z|3d)?|matrix(3d)?|perspective|skew(X|Y)?)$/i,
			clearProperties = {},
			document = window.document, docElem = document.documentElement,
			speeds = { _default: 400, fast: 200, slow: 600 }

		function downcase(str) { return str.toLowerCase() }
		function normalizeEvent(name) { return eventPrefix ? eventPrefix + name : downcase(name) }

		collection.each(vendors, function(vendor, event){
			if (testEl.style[vendor + 'TransitionProperty'] !== undefined) {
				prefix = '-' + downcase(vendor) + '-'
				eventPrefix = event
				return false
			}
		})

		clearProperties[prefix + 'transition-property'] =
		clearProperties[prefix + 'transition-duration'] =
		clearProperties[prefix + 'transition-timing-function'] =
		clearProperties[prefix + 'animation-name'] =
		clearProperties[prefix + 'animation-duration'] = ''

		$.fx = {
			off: (eventPrefix === undefined && testEl.style.transitionProperty === undefined),
			cssPrefix: prefix,
			transitionEnd: normalizeEvent('TransitionEnd'),
			animationEnd: normalizeEvent('AnimationEnd')
		}

		$.fn.animate = function(properties, duration, ease, callback){
			if (utils.isObject(duration))
		  		ease = duration.easing, callback = duration.complete, duration = duration.duration
			if (duration) duration = duration / 1000
				return this.anim(properties, duration, ease, callback)
		}

		$.fn.anim = function(properties, duration, ease, callback){
			var transforms, cssProperties = {}, key, that = this, wrappedCallback, endEvent = $.fx.transitionEnd
			if (duration === undefined) duration = 0.4
			if ($.fx.off) duration = 0
			
			if (typeof properties == 'string') {
				// keyframe animation
				cssProperties[prefix + 'animation-name'] = properties
				cssProperties[prefix + 'animation-duration'] = duration + 's'
				endEvent = $.fx.animationEnd
			} else {
				// CSS transitions
				for (key in properties)
					if (supportedTransforms.test(key)) {
						transforms || (transforms = [])
						transforms.push(key + '(' + properties[key] + ')')
					}
					else cssProperties[key] = properties[key]
			
					if (transforms) cssProperties[prefix + 'transform'] = transforms.join(' ')
					if (!$.fx.off && typeof properties === 'object') {
						cssProperties[prefix + 'transition-property'] = Object.keys(properties).join(', ')
						cssProperties[prefix + 'transition-duration'] = duration + 's'
						cssProperties[prefix + 'transition-timing-function'] = (ease || 'linear')
					}
				}

				wrappedCallback = function(event){
					if (typeof event !== 'undefined') {
						if (event.target !== event.currentTarget) return // makes sure the event didn't bubble from "below"
						$(event.target).unbind(endEvent, arguments.callee)
					}
					
					$(this).css(clearProperties)
					callback && callback.call(this)
				}
			
				if (duration > 0) this.on(endEvent, wrappedCallback)
			
				setTimeout(function() {
					that.css(cssProperties);
					if (duration <= 0) setTimeout(function() {
						that.each(function(){ wrappedCallback.call(this) })
					}, 0)
				}, 0)
			
			return this
		}

		function translateSpeed(speed) {
			return typeof speed == 'number' ? speed : (speeds[speed] || speeds._default)
		}

		function anim(el, speed, opacity, scale, callback) {
			if (typeof speed == 'function' && !callback) callback = speed, speed = undefined
			var props = { opacity: opacity }
			if (scale) {
				props.scale = scale
				el.css($.fx.cssPrefix + 'transform-origin', '0 0')
			}
			return el.anim(props, translateSpeed(speed) / 1000, null, callback)
		}
  
		function hide(el, speed, scale, callback) {
			return anim(el, speed, 0, scale, function(){
				$(this).hide();
				callback && callback.call(this)
			})
		}

		$.fn.fadeTo = function(speed, opacity, callback) {
			return anim(this, speed, opacity, null, callback)
		}

		$.fn.fadeIn = function(speed, callback) {
			var target = this.css('opacity')
			if (target > 0) this.css('opacity', 0)
			else target = 1
			return this.show().fadeTo(speed, target, callback)
		}

		$.fn.fadeOut = function(speed, callback) {
			return hide(this, speed, null, callback)
		}

		$.fn.fadeToggle = function(speed, callback) {
			var hidden = this.css('opacity') == 0 || this.css('display') == 'none'
			return this[hidden ? 'fadeIn' : 'fadeOut'](speed, callback)
		}

		$.extend($.fx, {
			speeds: speeds
		})
        
        return $;
 	}
 );
