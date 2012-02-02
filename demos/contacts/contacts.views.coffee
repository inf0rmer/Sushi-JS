define [
	'cs!contacts.data',
	'text!templates/app.tpl',
	'text!templates/person.tpl',
	'text!templates/personDetail.tpl',
	'text!templates/personInvalid.tpl',
	'text!templates/personEdit.tpl',
	'text!templates/phoneNr.tpl',
	'text!templates/phoneNrEdit.tpl'
], (People, AppTemplate, PersonTemplate, PersonDetailTemplate, PersonInvalidTemplate, PersonEditTemplate, PhoneNrTemplate, PhoneNrEditTemplate) ->
	
	exports = this
	exports.detailViews = []
	
	PersonView = new Sushi.Class(Sushi.View,
		constructor: (options) ->
			PersonView.Super.call(this, options)
		
		tagName: 'li'
		
		template: Sushi.template.compile PersonTemplate
		
		initialize: () ->
			@model.bind('change', @render, @)
			@model.bind('destroy', @remove, @)
		
		render: () ->
			if @model.get('active')
				$(@el).addClass('active')
			else
				$(@el).removeClass('active')
			
			$(@el).html(@template(@model.toJSON()))
			@
				
		remove: () ->
			$(@el).remove()
			delete @
	)

	PersonDetailView = new Sushi.Class(Sushi.View,
		constructor: (options) ->
			PersonView.Super.call(this, options)
		
		tagName: 'section'
		
		template: Sushi.template.compile PersonDetailTemplate
		
		invalidTemplate: Sushi.template.compile PersonInvalidTemplate
		
		events:
			"click .edit"	: "edit"
			"click .remove"	: "destroy"
		
		initialize: () ->
			if @model
				@model.bind('change', @render, @)
				@model.bind('destroy', @remove, @)
			@
		
		render: () ->
			if not @model
				$('#detailView').html @invalidTemplate()
				return @
				
			$(@el).html @template ( @model.toJSON() )
			$('#detailView').html('').append @el
			
			new Sushi.Enumerable(@model.get 'phoneNr' ).each (number) ->
				$('.phone-numbers', @el).append new PhoneNrView(model:number).render()
				
			@
		
		remove: () ->
			$(@el).remove()
			delete @
		
		edit: () ->
			new PersonEditView(model: @model).render()
			
		destroy: () ->
			if confirm('Really delete ' + @model.get('firstName') + ' ' + @model.get('lastName') + '?')
				@model.destroy()
	)
	
	PersonEditView = new Sushi.Class(Sushi.View, 
		constructor: (options) ->
			PersonEditView.Super.call(this, options)
			
		template: Sushi.template.compile PersonEditTemplate
		
		tagName: 'section'
		
		events:
			'click .save'					: 'saveEdit'
			'click .addPhoneNr' 			: 'addPhoneNr'
		
		initialize: () ->
			@model.bind('change', @render, @)
			@model.bind('destroy', @remove, @)
			@
			
		render: () ->
			$(@el).html @template ( @model.toJSON() )
			$('#detailView').html('').append @el
			
			new Sushi.Enumerable(@model.get 'phoneNr' ).each (number) ->
				$('.phone-numbers', @el).append new PhoneNrEditView(model:number).render()
			
			@
		
		remove: () ->
			$(@el).remove
			delete @
		
		close: () ->
			@remove
			new PersonDetailView(model: @model).render()
		
		saveEdit: () ->
			if Sushi.utils.isEmpty firstName = $("input[data-field='firstName']", @el).val()
				firstName = @model.get('firstName')
				
			if Sushi.utils.isEmpty lastName = $("input[data-field='lastName']", @el).val()
				lastName = @model.get('lastName')
			
			phoneNrs = []
			
			$('.phone-numbers li', @el).each () ->
				if !Sushi.utils.isEmpty phoneNr = $("input[data-field='phoneNr']", this).val()
					phoneNrs.push phoneNr
						
			@model.save(
				firstName: firstName
				lastName: lastName
				phoneNr: phoneNrs
			)
			
			@close()
		
		addPhoneNr: () ->
			$(".phone-numbers", @el).append new PhoneNrEditView().render()
	)
	
	PhoneNrView = new Sushi.Class(Sushi.View, 
		constructor: (options) ->
			PhoneNrView.Super.call(this, options)
		
		tagName: 'li'
		
		template: Sushi.template.compile PhoneNrTemplate
		
		render: () ->
			$(@el).html @template( @model )
		
		remove: () ->
			$(@el).remove()
			delete @
	)
	
	PhoneNrEditView = new Sushi.Class(Sushi.View, 
		constructor: (options) ->
			PhoneNrView.Super.call(this, options)
		
		tagName: 'li'
		
		template: Sushi.template.compile PhoneNrEditTemplate
		
		events:
			"click .remove" : "remove"
		
		render: () ->
			$(@el).html @template( @model )
		
		remove: () ->
			$(@el).remove()
			delete @
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
			newPerson = People.create()
			Sushi.event.publish 'contact/created', newPerson
	);
	
	{
		AppView				: AppView
		PersonDetailView	: PersonDetailView
	}