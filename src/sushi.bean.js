/*
 * Sushi.bean - Event utility
 *
 */
 define('sushi.bean',
 	// Module dependencies
 	[
 		'vendors/bean'
    ],

 	/**
 	 * Sushi Bean
 	 *
 	 * @namespace Sushi
 	 * @class bean
 	 */
 	function(bean) {
 		Sushi.namespace('bean');
 		Sushi.bean = bean;
 		
 		return bean;
 	}
 );