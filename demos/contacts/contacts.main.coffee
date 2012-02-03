define [
	'cs!contacts.data',
	'cs!contacts.views',
	'cs!contacts.router'
], (Data, Views, AppRouter) ->
	exports = this
	ContactsApp = exports.ContactsApp = {}
	ContactsApp.app = new Views.AppView
	ContactsApp.Data = Data
	
	ContactsApp.Router = new AppRouter
	Sushi.history.start( root: "/~brunoabrantes/sushi/demos/contacts/");
	
	Data.bind('destroy', () ->
		ContactsApp.Router.navigate '/'
	)
	
	Sushi.event.subscribe('contact/created', (model) ->
		ContactsApp.Router.navigate '/people/' + model.get('id'), true
	)