define(
	['sushi.core', 'sushi.utils'],
	
	/**
	 * 	HTML5 utilities functions
	 *
	 *	@namespace Sushi.utils
	 *	@class HTML5
	 *  @extends Sushi.utils
	 */
	function() {

		/**
		 *	Enable HTML5 Elements inside IE (8 and before)
		 *	script by Remy Sharp http://remysharp.com/2009/01/07/html5-enabling-script/
		 *
		 *	@method shiv
		 *	@param {String} Optional. List of specific objects to create (e.g.: Sushi.HTML5.shiv("canvas, time, aside") );
		 *	@return {Object} HTML5 elements created with boolean value.
		 */	
		var shiv = function(string) {
			var e = (string) ? string : "abbr,article,aside,audio,bb,canvas,datagrid,datalist,details,dialog,eventsource,figure,footer,header,hgroup,mark,menu,meter,nav,output,progress,section,time,video",
				html5els = {},
				i = e.length;

			e.split(',');
			for( i;i >= 0; i -= 1){
				document.createElement(e[i]);
				elsAvailable[e[i]] = true;
			}

			return html5els;
		};
			
		Sushi.namespace('utils.HTML5');
		Sushi.extend(Sushi.utils.HTML5, {
			shiv: shiv
		});
	}
);