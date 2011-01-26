// Require library-wide dependencies, not in requirejs module format
require([], function() {
	// require Sushi modules in requirejs format
	require(['sushi.core', 'sushi.utils'], function(){
	});
});