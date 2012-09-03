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
		'sushi.utils.collection',
		'sushi.utils.performance',
		'sushi.mvc.view.bindings',
		'sushi.ui.scrollable'
	],

	/**
	 * Sushi ui.listable
	 *
	 * @namespace Sushi
	 * @class ui.listable
	 */
	function(Sushi, Event, $, template, View, Model, Collection, utils, SushiError, JSON, coll, performance) {

		Listable = function(element, options) {

			var Listable, isCollection, ListCollection, SearchView, ListView, ItemView, ItemModel, TitleModel, TitleView, EmptyView, LoadingView,
				that = this;

			this.$element = $(element);

			this.options = Sushi.extend({}, this.options, options);

			this.source = (typeof this.options.source === 'string') ? JSON.parse(this.options.source) : this.options.source;
			this.uses = (typeof this.options.uses === 'string') ? JSON.parse(options.uses) : this.options.uses;

			// Type inferring
			isCollection = this.source instanceof Collection;

			if (!isCollection && !utils.isArray(this.source)) {
				throw new SushiError('source must be a Sushi Collection or a simple array')
			}

			ItemModel = this.options.item.Model || new Sushi.Class( Model, {
				constructor: function(attributes, options) {
					ItemModel.Super.call(this, attributes, options);
				},

				defaults: {
					title: 'Title',
					description: 'Description',
					image: null,
					link: null
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

			this.TitleView = TitleView = new Sushi.Class( View, {
				constructor: function(options) {
					TitleView.Super.call(this, options);
					this._configure(options || {});
				},

				tagName: 'div',

				template: (typeof that.options.title.template === 'string') ? template.compile(that.options.title.template) : that.options.title.template,

				className: 'listable-header',

				initialize: function(options) {
					this.data = options.data;
				},

				render: function() {
					this.$el.html(this.template(this.data));
					return this;
				}
			});

			this.EmptyView = EmptyView = new Sushi.Class( View, {
				constructor: function(options) {
					EmptyView.Super.call(this, options);
				},

				tagName: 'li',

				template: (typeof that.options.empty.template === 'string') ? template.compile(that.options.empty.template) : that.options.empty.template,

				className: 'listable-item empty',

				initialize: function(options) {
					this.data = options && options.data || {};
				},

				render: function() {
					this.$el.html( this.template(this.data) );
					return this;
				}
			});

			this.SearchView = SearchView = new Sushi.Class( View, {
				constructor: function(options) {
					SearchView.Super.call(this, options);
				},

				tagName: 'div',

				template: (typeof that.options.search.template === 'string') ? template.compile(that.options.search.template) : that.options.search.template,

				className: 'listable-search',

				events: {
					'keyup input': 'search',
					'change input': 'search'
				},

				initialize: function(options) {
					this.data = options.data;
					this.fields = that.options.search.fields || [];

					this.search = utils.throttle(this.search, 500)
				},

				render: function() {
					this.$el.html(this.template(this.data));
					return this;
				},

				search: function() {
					var value = this.$el.find('input').val(),
						self = this;
						results = [];

					utils.each(this.fields, function(field) {
						results[results.length] = this.collection.filter(function(model){
							return (model.has(field) && model.get(field).toLowerCase().indexOf(value.toLowerCase()) != -1);
						});
					}, this);

					results = new ListCollection($.utils.unique($.utils.flatten(results)));

					that.trigger('search', results, value);
					that.$element.trigger('search', [results, value]);
				}
			});

			LoadingView = this.LoadingView = this.options.loading.View || new Sushi.Class( View, {
				constructor: function(options) {
					LoadingView.Super.call(this, options);
				},

				tagName: 'div',

				className: 'listable-loading',

				events: {
					'click span': 'clicked'
				},

				clicked: function() {
					alert('clicked')
				},

				template: (typeof that.options.loading.template === 'string') ? template.compile(that.options.loading.template) : that.options.loading.template,

				render: function() {
					this.$el.html( this.template() );
					return this.bindModel();
				}
			});

			ItemView = this.options.item.View || new Sushi.Class( View, {
				constructor: function(options) {
					ItemView.Super.call(this, options);
					this._configure(options || {});
				},

				tagName: 'li',

				template: (typeof that.options.item.template === 'string') ? template.compile(that.options.item.template) : that.options.item.template,

				className: 'listable-item',

				events: {
					'mouseenter': 'mouseenter',
					'mouseleave': 'mouseleave',
					'click': 'click'
				},

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

					if (this.model.has('link')) this.$el.addClass('listable-item-interactive');

					return this.bindModel();
				},

				mouseenter: function() {
					that.trigger('mouseenter');
					that.$element.trigger('mouseenter');
				},

				mouseleave: function() {
					that.trigger('mouseleave');
					that.$element.trigger('mouseleave');
				},

				click: function() {
					that.trigger('click');
					that.$element.trigger('click');
				}
			});

			this.ListView = ListView = new Sushi.Class( View, {
				constructor: function(options) {
					ListView.Super.call(this, options);
					this._configure(options || {});
				},

				tagName: (that.options.listType === 'unordered') ? 'ul' : 'ol',

				className: 'listable-list unstyled',

				_height: 0,

				_views: [],

				initialize: function(options) {
					this.collection.bind('reset', this.addAll, this);
					this.collection.bind('add', this.addOne, this);
					this.collection.bind('add', this.setHeight, this);
					this.collection.bind('remove', this.setHeight, this);
					this.collection.bind('remove', this.checkEmpty, this);
					this.collection.bind('remove', this.removeView, this);

					that.on('search', this.search, this);

					if (that.options.scrollable) {
						this.collection.on('reset', function() {
							if (!that._scrollable) return false;
							setTimeout(function() {
								that._scrollable.refresh();
							}, 0);
						});
						this.collection.on('add', function() {
							if (!that._scrollable) return false;
							setTimeout(function() {
								that._scrollable.refresh();
							}, 0);
						});
						this.collection.on('remove', function() {
							if (!that._scrollable) return false;
							setTimeout(function() {
								that._scrollable.refresh();
							}, 0);
						});
					}

					this.addAll();

					return this;
				},

				removeView : function(model) {
					var viewToRemove = $.utils.select(this._views, function(cv) { return cv.model === model; })[0];
					this._views = $.utils.without(this._views, viewToRemove);

					viewToRemove.$el.remove();
				},

				addOne: function(item) {
					if (this.emptyView) this.emptyView.dealloc();

					var view = new ItemView( {model: item} );
					this.$el[that.options.listMethod]( view.render().el );
					this._views.push(view);

					return this;
				},

				addAll: function(collection) {
					collection = (collection) ? collection : this.collection;

					this.$el.html('');

					if (collection.length) {
						collection.each( this.addOne, this );
					} else {
						this.emptyView = new EmptyView();
						this.$el.html('').append( this.emptyView.render().el);
					}

					return this;
				},

				checkEmpty: function() {
					if (!this.collection.length) {
						this.emptyView = new EmptyView();
						this.$el.html('').append( this.emptyView.render().el);
					}
				},

				setHeight: function() {
					this._height = this.$el.get(0).scrollHeight - this.$el.get(0).offsetHeight;
				},

				search: function(collection) {
					this.addAll.call(this, collection);
				},

				dealloc: function() {
					// Unbind events to avoid errors
					this.collection.off('reset', this.addAll, this);
					this.collection.off('add', this.addOne, this);
					this.collection.off('add', this.setHeight, this);
					this.collection.off('remove', this.setHeight, this);
					this.collection.off('remove', this.checkEmpty, this);

					that.off('search', this.search, this);

					if (this.options.scrollable) {
						this.collection.off('reset', function() {
							if (!that._scrollable) return false;
							setTimeout(function() {
								that._scrollable.refresh();
							}, 0);
						});
						this.collection.off('add', function() {
							if (!that._scrollable) return false;
							setTimeout(function() {
								that._scrollable.refresh();
							}, 0);
						});
						this.collection.off('remove', function() {
							if (!that._scrollable) return false;
							setTimeout(function() {
								that._scrollable.refresh();
							}, 0);
						});
					}

					ListView.Super.prototype.dealloc.call(this);
				}

			});

			// Turn it into a ListCollection if it's a simple array
			if (!isCollection) this.source = new ListCollection(this.source);

			this.render();
		}

		// Public API
		Listable.prototype = {

			setLoading: function() {
				this.unsetLoading();

				var element = (this.options.scrollable) ? '.scrollable-wrap' : '.listable-list',
					$element = this.$element.find(element);

				if ($element.length)
					$element.hide();

				this.loadingView = new this.LoadingView();
				this.$element.append(this.loadingView.render().el);
			},

			unsetLoading: function() {
				if (this.loadingView) {
					this.loadingView.dealloc();
					this.loadingView = null;
				}

				var element = (this.options.scrollable) ? '.scrollable-wrap' : '.listable-list',
					$element = this.$element.find(element);

				if ($element.length)
					$element.show();
			},

			dealloc: function() {

				if (this.titleView)
					this.titleView.dealloc();

				if (this.searchView)
					this.searchView.dealloc();

				if (this.listView)
					this.listView.dealloc();

				this.$element.html('');
			},

			render: function() {

				var i, len, component, view, piece, $elForScrollEvent, scrollEventCallback, that = this;

				this.dealloc();

				for (i=0, len=this.uses.length; i<len; i++) {
					component = this.uses[i];

					switch (component.type) {
						case 'title':
							this.titleView = view = new this.TitleView({data: component});
							piece = view.render().el;
							break;

						case 'search':
							this.searchView = view = new this.SearchView({collection: this.source, data: component});
							piece = view.render().el;
							break;

						case 'list':
							this.listView = view = new this.ListView({collection: this.source, data: component});
							piece = view.render().el;

							if (this.options.scrollable) {
								var $wrap = $('<div class="scrollable-wrap"><div class="scrollable-inner"></div></div>');
								$wrap.find('.scrollable-inner').append(piece);
								piece = $wrap.get(0);
							}

							break;
					}

					this.$element.append(piece);
				}

				if (this.options.scrollable) {
					var $scrollableWrap = this.$element.find('.scrollable-wrap');

					$scrollableWrap.scrollable();
					this._scrollable = $scrollableWrap.data('scrollable');
				}

				// Set height on first render
				this.listView.setHeight();

				$elForScrollEvent = (this.options.scrollable) ? this.$element.find('.scrollable-inner') : this.listView.$el;

				scrollEventCallback = function() {
					var top = $elForScrollEvent.scrollTop();

					// Publish edge cases under specific events
					if (top === 0)
						that.publish('top');

					if (that.listView._height <= top)
						that.publish('bottom');

					// Always publish scroll
					that.publish('scroll');
				}
				scrollEventCallback = performance.throttle(scrollEventCallback, 300);

				$elForScrollEvent.on('scroll', scrollEventCallback);

				return this;
			}

		};

		// Make it able to bind and trigger events
		Sushi.extend( Listable.prototype, Event );

        /* DROPDOWN PLUGIN DEFINITION
		 * ========================== */

		Sushi.fn.listable = function (opts) {
			return this.each(function () {
				var $this = $(this)
					, data = $this.data('listable')
					, options = {};

					Sushi.extend(options, Sushi.fn.listable.defaults, opts, $this.data());

					if (!data) {
						$this.data('listable', (data = new Listable(this, options)));
					} else {
						data.render();
					}
			});
		};

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
			listMethod: 'append',
			scrollable: true,
			title: {
				template: '<h1 class="listable-title">{{content}}</h1>'
			},
			item: {
				template: '{{#if link}}<a href="{{link}}">{{/if}}<article>{{#if image}} <aside class="image">{{image}}</aside> {{/if}} {{#if title}} <h1 data-binding="title" class="content title">{{title}}</h1> {{/if}} {{#if description}} <p data-binding="description" class="muted content description">{{description}}</p> {{/if}}</article>{{#if link}}</a>{{/if}}'
			},
			search: {
				template: '<form action=""><input class="search" type="search" placeholder="{{placeholder}}" /></form>',
				fields: ['title', 'description']
			},
			empty: {
				template: 'There are no items here.'
			},
			loading: {
				template: '<span class="listable-loading-loader centered">Loading...</span>'
			}
		};

		Sushi.fn.listable.Constructor = Listable;

		 /* LISTABLE DATA-API
		  * ============== */

		Sushi.ready(function () {
			$('[data-provide="listable"]').each( function () {
				var $this = $(this)
					, data = {};

				Sushi.extend(data, $this.data());
				$this.listable(data)
			});
		});
	}
);
