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
 		'sushi.error'
 	],

 	/**
 	 * Sushi ui.listable
 	 *
 	 * @namespace Sushi
 	 * @class ui.listable
 	 */
 	function(Sushi, Event, $, template, View, Model, Collection, utils, SushiError) {
 		
 		var Listable = function(element, options) { 			
 			var isCollection, ListCollection, ListView, LayoutView, ItemView, ItemModel, that = this;
 			
 			this.$element = $(element)
			this.options = {};
			Sushi.extend(this.options, Sushi.fn.listable.defaults);
			Sushi.extend(this.options, options);
			this.source = (typeof this.options.source === 'string') ? JSON.parse(this.options.source) : this.options.source
			
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
			
			ListCollection = Sushi.Class( Collection, {
				constructor: function(models, options) {
					ListCollection.Super.call(this, models, options);
				},
				
				model: ItemModel
			});
			
			ItemView = new Sushi.Class( View, {
				constructor: function(options) {
					ItemView.Super.call(this, options);
				},
				
				tagName: 'li',
				
				template: that.options.itemTemplate,
				
				initialize: function(options) {
					this.model.bind('change', this.render, this);
					this.model.bind('destroy', this.dealloc, this);
				},
				
				render: function() {
					this.$el.html( this.template( this.model.toJSON() ) );
					
					return this;
				}
			});
			
			ListView = new Sushi.Class( View, {
				constructor: function(options) {
					ListView.Super.call(this, options);
					return this;
				},
				
				tagName: (that.options.listElement === 'unordered') ? 'ul' : 'ol',
				
				initialize: function() {
					this.collection.bind('reset', this.addAll, this);
					this.collection.bind('all', this.addAll, this);
					this.collection.bind('add', this.addOne, this);
				},
				
				addOne: function(item) {
					var view = new ItemView( {model: item} )
					this.$el.append( view.render().el );
					return this;
				},
				
				addAll: function() {
					this.collection.each( this.addOne, this );
					return this;
				}
				
			});
			
			LayoutView = new Sushi.Class( View, {
				
				constructor: function(options) {
					LayoutView.Super.call(this, options);
				},
				
				el: element,
				
				$el: $(element),
				
				layout: that.options.layout,
				
				searchTemplate: that.options.searchTemplate,
				
				components: that.options.uses,
				
				initialize: function() {					
					this.listView = new ListView({collection: that.source}).addAll();
				},
				
				render: function() {
					
					var data = {
						//search: (this.components.search != null) ? this.searchTemplate : null,
						list: this.listView.$el
					}					
					
					this.$el.html( this.layout( data ) );
					return this;
				}
				
			});
			
			// Turn it into a ListCollection if it's a simple array
			if (!isCollection) this.source = new ListCollection(this.source);
			
			this.view = new LayoutView(this.options);
			
			this.render();
 		}
 		
 		// Public API
 		Listable.prototype = {
 			
 			render: function() {
 				this.$element.html(this.view.render().$el.html());
 				return this;
 			}
 			
 		}
 		
 		// Make it able to bind and trigger events
 		Sushi.extend( Listable.prototype, Event );
 		
        /* DROPDOWN PLUGIN DEFINITION
		 * ========================== */
	
		Sushi.fn.listable = function (options) {
			return this.each(function () {
				var $this = $(this)
					, data = $this.data('listable')
					
					if (!data) $this.data('listable', (data = new Listable(this, options)))
			});
		}
		
		Sushi.fn.listable.defaults = {
			source: [],
			uses: {
				search: {
					placeholder: 'Search'
				}
			},
			listType: 'unordered',
			layout: template.compile( '{{{search}}} {{{filters}}} {{{list}}}' ),
			itemTemplate: template.compile( '<article>{{#if image}} {{image}} {{/if}} {{#if title}} <strong>{{title}}</strong> {{/if}} {{#if description}} <p>{{description}}</p> {{/if}}</article>' ),
			searchTemplate: template.compile( '<form action=""><input class="search" type="search" placeholder="{{components.search.placeholder}}></input></form>' )
		}
	
		Sushi.fn.listable.Constructor = Listable
		
		Sushi.ready(function () {
			$('[data-provide="listable"]').on('focus.listable.data-api', function (e) {
				var $this = $(this)
				if ($this.data('listable')) return
				e.preventDefault()
				$this.listable($this.data())
			})
		});
 	}
 );
