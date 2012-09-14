/**
 * Sushi Error
 *
 * @module Sushi
 */
/*global Sushi:true, define:true*/
define('sushi.error',
	[
		'sushi.core'
	],

	function(Sushi) {
		function SushiError (msg) {
			Error.call(this);
			if (Error.captureStackTrace)
				Error.captureStackTrace(this, arguments.callee);
			this.message = msg;
			this.name = 'SushiError';
		}

		SushiError.prototype.__proto__ = Error.prototype;

		Sushi.namespace('Error');
		Sushi.Error = SushiError;

		return SushiError;
	}
);
