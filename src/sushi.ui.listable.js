/*
 * Sushi.ui.listable
 *
 */
 define('sushi.ui.listable',
 	// Module dependencies
 	[
 		'sushi.core',
 		'sushi.event',
 		'sushi.$',
 		'sushi.template',
 		'sushi.mvc.view',
 		'sushi.mvc.model',
 		'sushi.mvc.collection',
 		'sushi.utils',
 		'sushi.error',
 		'sushi.utils.json',
 		'sushi.mvc.view.bindings'
 	],

 	/**
 	 * Sushi ui.listable
 	 *
 	 * @namespace Sushi
 	 * @class ui.listable
 	 */
 	function(Sushi, Event, $, template, View, Model, Collection, utils, SushiError, JSON) {
 		
 		var Listable, isCollection, ListCollection, SearchView, ListView, ItemView, ItemModel, TitleModel;
 		
 		Listable = function(element, options) {
 		
 			var that = this;
 			
 			this.$element = $(element)
			this.options = {};
			Sushi.extend(this.options, options);
			
			this.source = (typeof this.options.source === 'string') ? JSON.parse(this.options.source) : this.options.source;
			this.uses = (typeof this.options.uses === 'string') ? JSON.parse(options.uses) : this.options.uses;
			
			// Type inferring
			isCollection = this.source instanceof Collection;
			
			if (!isCollection && !utils.isArray(this.source)) {
				throw new SushiError('source must be a Sushi Collection or a simple array')
			}
			
			ItemModel = new Sushi.Class( Model, {
				constructor: function(attributes, options) {
					ItemModel.Super.call(this, attributes, options);
				},
				
				defaults: {
					title: 'Title',
					description: 'Description',
					image: null
				}
			});
			
			TitleModel = new Sushi.Class( Model, {
				constructor: function(attributes, options) {
					TitleModel.Super.call(this, attributes, options);
				},
				
				defaults: {
					content: 'Title'
				}
			});
			
			ListCollection = Sushi.Class( Collection, {
				constructor: function(models, options) {
					ListCollection.Super.call(this, models, options);
				},
				
				model: ItemModel
			});
			
			TitleView = new Sushi.Class( View, {
				constructor: function(options) {
					TitleView.Super.call(this, options);
					this._configure(options || {});
				},
				
				tagName: 'header',
				
				template: that.options.titleTemplate,
				
				className: 'listable-header',
				
				initialize: function(options) {
					this.data = options.data;
				},
				
				render: function() {
					this.$el.html(this.template(this.data));
					return this;
				}
			});
			
			SearchView = new Sushi.Class( View, {
				constructor: function(options) {
					SearchView.Super.call(this, options);
					this._configure(options || {});
				},
				
				tagName: 'div',
				
				template: that.options.searchTemplate,
				
				className: 'listable-search',
				
				events: {
					'keyup input': 'search',
					'change input': 'search'
				},
				
				initialize: function(options) {
					this.data = options.data;
				},
				
				render: function() {
					this.$el.html(this.template(this.data));
					return this;
				},
				
				search: function() {
					var value = this.$el.find('input').val(),
						pattern = new RegExp(value, 'gi'),
						results;
					
					results = new ListCollection(this.collection.filter(function(model){
						return (pattern.test(model.get('title')) || pattern.test(model.get('description')));
					}));
					
					that.trigger('search', results, value);
					that.$element.trigger('search', [results, value]);
				}
			});
			
			ItemView = new Sushi.Class( View, {
				constructor: function(options) {
					ItemView.Super.call(this, options);
					this._configure(options || {});
				},
				
				tagName: 'li',
				
				template: that.options.itemTemplate,
				
				className: 'listable-item',
				
				bindings: {
					'text [data-binding="title"]': 'title',
					'text [data-binding="description"]': 'description'
				},
				
				initialize: function(options) {
					this.model.bind('destroy', this.dealloc, this);
					return this;
				},
				
				render: function() {
					this.$el.html( this.template( this.model.toJSON() ) );
					return this.bindModel();
				}
			});
			
			ListView = new Sushi.Class( View, {
				constructor: function(options) {
					ListView.Super.call(this, options);
					this._configure(options || {});
				},
				
				tagName: (that.options.listType === 'unordered') ? 'ul' : 'ol',
				
				className: 'listable-list unstyled',
				
				initialize: function(options) {
					this.collection.bind('reset', this.addAll, this);
					this.collection.bind('add', this.addOne, this);
					
					that.bind('search', this.search, this);
					
					if (this.collection.length)	this.addAll();
					
					return this;
				},
				
				addOne: function(item) {
					var view = new ItemView( {model: item} )
					this.$el.append( view.render().el );
					return this;
				},
				
				addAll: function(collection) {
					collection = (collection) ? collection : this.collection;
					
					this.$el.html('');
					
					if (collection.length) {
						collection.each( this.addOne, this );
					} else {
						this.$el.html('<li class="empty">' + that.options.emptyText + '</li>')
					}
					return this;
				},
				
				search: function(collection) {
					this.addAll.call(this, collection);
				}
				
			});
			
			// Turn it into a ListCollection if it's a simple array
			if (!isCollection) this.source = new ListCollection(this.source);
			
			this.render();
 		}
 		
 		// Public API
 		Listable.prototype = {
 			
 			render: function() {
 				
 				var i, len, component, view, piece;
 				
 				for (i=0, len=this.uses.length; i<len; i++) {
 					component = this.uses[i];
 					
 					switch (component.type) {
 						case 'title':
 							view = new TitleView({data: component});
 							piece = view.render().el;
 							break;
 							
 						case 'search':
 							view = new SearchView({collection: this.source, data: component});
 							piece = view.render().el
 							break;
 						
 						case 'list':
 							view = new ListView({collection: this.source, data: component});
 							piece = view.render().el;
 							break;
 					}
 					
 					this.$element.append(piece);
 				}
 				
 				return this;
 			}
 			
 		}
 		
 		// Make it able to bind and trigger events
 		Sushi.extend( Listable.prototype, Event );
 		
        /* DROPDOWN PLUGIN DEFINITION
		 * ========================== */
	
		Sushi.fn.listable = function (opts) {
			return this.each(function () {
				var $this = $(this)
					, data = $this.data('listable')
					, options = {};
					
					Sushi.extend(options, Sushi.fn.listable.defaults)
					Sushi.extend(options, $this.data())
					Sushi.extend(options, opts);
					
					if (!data) $this.data('listable', (data = new Listable(this, options)))
			});
		}
		
		Sushi.fn.listable.defaults = {
			source: [],
			uses: [
				{
					type: 'title',
					content: 'My List'
				},
				{
					type: 'search',
					placeholder: 'Search'
				},
				{
					type: 'list'
				}
			],
			listType: 'unordered',
			titleTemplate: template.compile( '<h1 class="listable-title">{{content}}</h1>' ),
			itemTemplate: template.compile( '<a href="http://google.com"><article>{{#if image}} <aside class="image">{{image}}</aside> {{/if}} {{#if title}} <h1 data-binding="title" class="content title">{{title}}</h1> {{/if}} {{#if description}} <p data-binding="description" class="muted content description">{{description}}</p> {{/if}}</article></a>' ),
			searchTemplate: template.compile( '<form action=""><input class="search" type="search" placeholder="{{placeholder}}" /></form>' ),
			emptyText: "No results"
		}
	
		Sushi.fn.listable.Constructor = Listable
		
		 /* LISTABLE DATA-API
		  * ============== */
		
		Sushi.ready(function () {
			$('[data-provide="listable"]').each( function () {
			  	var $this = $(this)
					, data = {};
				
				Sushi.extend(data, $this.data());

				$this.listable(data)
			});
		  })
 	}
 );
