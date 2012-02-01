define('contacts.views',
	[
		'contacts.data',
		'text!templates/app.tpl',
		'text!templates/person.tpl'
	],
	function(People, AppTemplate, PersonTemplate) {		
		var AppView
		,	PersonView
		,	PersonDetailView
		;
		
		PersonView = new Sushi.Class(Sushi.View, {
			constructor: function(options) {
				PersonView.Super.call(this, options);
			},
			
			tagName: 'li',
			
			template: Sushi.template.compile(PersonTemplate),
			
			events: {
				"click .remove": "destroy"
			},
			
			initialize: function() {
				this.model.bind('change', this.render, this);
				this.model.bind('destroy', this.remove, this);
			},
			
			render: function() {
				$(this.el).html(this.template(this.model.toJSON()));
				return this;
			},
			
			remove: function() {
				$(this.el).remove();
			},
			
			destroy: function() {
				this.model.destroy();
			}
		});
		
		PersonDetailView = new Sushi.Class(Sushi.View, {
			constructor: function(options) {
				PersonView.Super.call(this, options);
			}
		});
		
		AppView = new Sushi.Class(Sushi.View, {
			constructor: function(options) {
				AppView.Super.call(this, options);
			},
			
			el: $('#contactsApp'),
			
			template: Sushi.template.compile(AppTemplate),
			
			events: {
				"click #addContact": "createContact"
			},
			
			initialize: function() {
				this.render();
				
				People.bind('add', this.addOne, this);
				People.bind('reset', this.addAll, this);
				
				People.fetch();
			},
			
			render: function() {
				$(this.el).html(this.template());
			},
			
			addOne: function(person) {
				$('#peopleList').append( new PersonView({model: person}).render().el );
			},
			
			addAll: function() {
				People.each(this.addOne);
			},
			
			createContact: function() {
				People.create();
			}
		});
		
		return {
			AppView			 : AppView,
			PersonView		 : PersonView,
			PersonDetailView : PersonDetailView
		};
	}
)