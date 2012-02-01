define	[
	
], () ->	
	Person = new Sushi.Class(Sushi.Model,
		constructor: (attributes, options) ->
			Person.Super.call(this, attributes, options)
			
		defaults:
			firstName: 'John'
			lastName: 'Appleseed'
			phoneNr: '+000 000000000'
	)
	
	PeopleList = new Sushi.Class(Sushi.Collection,
		constructor: (models, options) ->
			PeopleList.Super.call(this, models, options)
		
		model: Person
		
		store: new Sushi.stores.LocalStore('people')
	)
	
	new PeopleList