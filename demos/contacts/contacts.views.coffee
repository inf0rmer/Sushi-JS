define [
	'contacts.data',
	'text!templates/app.tpl',
	'text!templates/person.tpl',
	'text!templates/personDetail.tpl',
	'text!templates/personInvalid.tpl'
], (People, AppTemplate, PersonTemplate, PersonDetailTemplate, PersonInvalidTemplate) ->
	
	exports = this
	exports.detailViews = []
	
	PersonView = new Sushi.Class(Sushi.View,
		constructor: (options) ->
			PersonView.Super.call(this, options)
		
		tagName: 'li'
		
		template: Sushi.template.compile PersonTemplate
		
		events:
			"click .remove"	: "destroy"
		
		initialize: () ->
			@model.bind('change', @render, @)
			@model.bind('destroy', @remove, @)
		
		render: () ->
			$(@el).html(@template(@model.toJSON()))
			@
				
		remove: () ->
			$(@el).remove()
		
		destroy: () ->
			@model.destroy()
	)

	PersonDetailView = new Sushi.Class(Sushi.View,
		constructor: (options) ->
			PersonView.Super.call(this, options)
		
		tagName: 'section'
		
		template: Sushi.template.compile PersonDetailTemplate
		
		invalidTemplate: Sushi.template.compile PersonInvalidTemplate
		
		initialize: () ->
			if @model
				@model.bind('change', @render, @)
				@model.bind('destroy', @remove, @)
		
		render: () ->
			if not @model
				$('#detailView').html @invalidTemplate()
				return @
				
			$('#detailView').html @template (@model.toJSON())
			@
		
		remove: () ->
			$('#detailView').html ''
	)

	AppView = new Sushi.Class(Sushi.View,
		constructor: (options) ->
			AppView.Super.call(this, options)
		
		el: '#contactsApp'
		
		template: Sushi.template.compile(AppTemplate),
		
		events:
			"click #addContact": "createContact"
		
		initialize: () ->
			@render()
			
			People.bind('add', @addOne, @)
			People.bind('reset', @addAll, @)
			People.fetch()
		
		render: () ->
			$(@el).html( @template() )
			@
		
		addOne: (person) ->
			$('#peopleList', @el).append( new PersonView(model: person).render().el )
		
		addAll: () ->
			People.each(@addOne)
		
		createContact: () ->
			People.create()
	);
	
	{
		AppView				: AppView
		PersonDetailView	: PersonDetailView
	}