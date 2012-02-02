define	[
	'cs!contacts.views',
	'cs!contacts.data'
], (Views, Data) ->
	
	AppRouter = new Sushi.Class(Sushi.Router, 
		constructor: (options) ->
			AppRouter.Super.call(this, options)

		routes:
			"": "home"
			"/people/:id": "getPerson"
		
		home: () ->
			Data.invoke(
				() -> this.set(active: false)
			)
		
		getPerson: (id) ->
			person = Data.get id
			if person
				Data.invoke(
					() -> this.set(active: false)
				)
				
				person.set({active: true})
				
			detail = new Views.PersonDetailView( model: person )
			detail.render()
	)
	
	AppRouter