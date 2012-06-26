/*
 * Sushi.aspectify
 *
 * Easily separate concerns with aspect oriented programming.
 * This module adds "before", "after", "around" and "guard" combinations to your classes.
 * Heavily based on YouAreDaChef (https://github.com/raganwald/YouAreDaChef/).
 *
 */
define('sushi.aspectify',
	// Module dependencies
	[
		'sushi.core',
		'sushi.utils',
		'sushi.utils.collection'
	],

	/**
	 * Sushi aspectify
	 *
	 * @namespace Sushi
	 * @class aspectify
	 */
	function(Sushi, utils, collection) {
        Sushi.namespace('aspectify', Sushi);
        
        var __slice = Array.prototype.slice;
        
        Aspectify = function() {

			var klasses = 1 <= arguments.length ? __slice.call(arguments, 0) : [];

			var pointcuts = function(pointcut_exprs) {
				return utils.tap( {}, function(cuts) {
					return utils.each(klasses, function(klass) {
						return utils.each(pointcut_exprs, function(expr) {
							var name;
								
							if ( utils.isString(expr) && utils.isFunction(klass.prototype[expr]) ) {
								name = expr;
								return cuts[name] = {
									klass: klass,
									pointcut: klass.prototype[name],
									inject: []
								};
							} else if ( expr instanceof RegExp ) {
								return utils.each( collection.functions(klass.prototype), function(name) {
									if ( match = name.match(expr) ) {
										return cuts[name] = {
											klass: klass,
											pointcut: klass.prototype[name],
											inject: match
										};
									}
								});
							}
							
						});
					});
				});
		},

		combinator = {
			before: function() {
					var advice, pointcut_exprs, _i;
					
					pointcut_exprs = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), advice = arguments[_i++];
					
					utils.each( pointcuts(pointcut_exprs), function( _arg, name ) {
						var klass, inject, pointcut;
						klass = _arg.klass, pointcut = _arg.pointcut, inject = _arg.inject;
						
						return klass.prototype[name] = function() {
							var args;
							
							args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
							
							advice.call.apply(advice, [this].concat(__slice.call(inject), __slice.call(args)));
							return pointcut.apply(this, args);
						};
					});
					
					return combinator;
			},

			after: function() {
				var advice, pointcut_exprs, _i;
					pointcut_exprs = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), advice = arguments[_i++];

					utils.each(pointcuts(pointcut_exprs), function(_arg, name) {
						var klass, inject, pointcut;
						klass = _arg.klass, pointcut = _arg.pointcut, inject = _arg.inject;
						
						return klass.prototype[name] = function() {
							var args;
							args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];

							return utils.tap(pointcut.apply(this, args), utils.bind(function() {
								return advice.call.apply(advice, [this].concat(__slice.call(inject), __slice.call(args)));
							}, this));
						};
					});
				return combinator;
			},

			around: function() {
				var advice, pointcut_exprs, _i;
				pointcut_exprs = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), advice = arguments[_i++];

				utils.each(pointcuts(pointcut_exprs), function(_arg, name) {
					var klass, inject, pointcut;
					klass = _arg.klass, pointcut = _arg.pointcut, inject = _arg.inject;
						
					return klass.prototype[name] = function() {
						var args, bound_pointcut;
						args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];

						bound_pointcut = utils.bind(function() {
							var args2;
							args2 = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
								return pointcut.apply(this, args2);
						}, this);

						return advice.call.apply(advice, [this, bound_pointcut].concat(__slice.call(inject), __slice.call(args)));
					};
				});
				return combinator;
			},

			guard: function() {
				var advice, pointcut_exprs, _i;
					pointcut_exprs = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), advice = arguments[_i++];

					utils.each(pointcuts(pointcut_exprs), function(_arg, name) {
						var klass, inject, pointcut;
						klass = _arg.klass, pointcut = _arg.pointcut, inject = _arg.inject;
						
						return klass.prototype[name] = function() {
							var args;
							args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
							if (advice.call.apply(advice, [this].concat(__slice.call(inject), __slice.call(args)))) {
								return pointcut.apply(this, args);
							}
						};
					});
					return combinator;
					}
				};

				return combinator;
			};
        
        Sushi.aspectify = Aspectify;
        
        return Aspectify;
	}
);