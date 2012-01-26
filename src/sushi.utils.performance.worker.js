define('sushi.utils.performance.worker',
	['sushi.core', 'sushi.utils'],
	
	/**
	 * Web Worker shim
	 *
	 * @namespace Sushi
	 * @class utils
	 */
	function(core, utils) {
		var global = window,
		Worker,
		index = 0;
		
		if (!("Worker" in global)) {
			Worker = function(src){
				var publicAPI,
					worker,
					worker_idx = index++,
					queue = []
				;
	
				// set up the fake worker environment instance
				Worker["__"+worker_idx] = worker = {
					postMessage: function(msg) {
						var fn = function(){ publicAPI.onmessage(msg); };
						if (queue===false) setTimeout(fn,0);
						else queue.push(fn);
					},
					onmessage: function(){}
				};
	
				var xhr = (XMLHttpRequest ? new XMLHttpRequest() : global.ActiveXObject("Microsoft.XMLHTTP"));
				xhr.onreadystatechange = function() {
					if (xhr.readyState == 4) {
						var script_src = "(function(self,importScripts){\n" + xhr.responseText + "\n})(Worker['__"+worker_idx+"'],function(){});",
							script = document.createElement("script"), fn
						;
						script.text = script_src;
						(document.body || document.getElementsByTagName("body")[0]).appendChild(script);
	
						while (fn = queue.shift()) fn();
						queue = true;
					}
				};
				xhr.open("GET",src);
				xhr.send("");
	
				publicAPI = {
					postMessage: function(msg) {
						var fn = function(){ worker.onmessage(msg); };
						if (queue !== true) queue.push(fn);
						else setTimeout(fn,0);
					},
					onmessage: function(){},
					terminate: function(){}
				};
	
				return publicAPI;
			};
		}
		else {
			Worker = global.Worker;
		}
		
		Sushi.extend(utils, {
			Worker: Worker
		});
		
		return utils.Worker;
		
	}
);