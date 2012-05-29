require.config({
	paths: {
		text: '../test/sandbox/plugins/text'
	}
})

define(['./views/app'], function(AppView){
    return Sushi.sandbox.subscribe('bootstrap', 'todos', function (element) {
		new AppView({el: Sushi.sandbox.dom.find(element)});
    });
});