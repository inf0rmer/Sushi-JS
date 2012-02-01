define	[
	'cs!contacts.views',
	'cs!contacts.data'
], (Views, Data) ->
	
	AppRouter = new Sushi.Class(Sushi.Router, 
		constructor: (options) ->
			AppRouter.Super.call(this, options)

		routes: 
			"/people/:id": "getPerson"
		
		getPerson: (id) ->		
			detail = new Views.PersonDetailView( model: Data.get(id) )
			detail.render()
	)
	
	AppRouter