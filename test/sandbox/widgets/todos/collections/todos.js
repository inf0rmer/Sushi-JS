define(['../models/todo', 'sushi.stores.LocalStore'], function(Todo, LocalStore){

    var TodosCollection = new Sushi.Class(Sushi.sandbox.mvc.Collection, {
    
    	constructor: function(options, models) {
    		TodosCollection.Super.call(this, options, models);
    	},

        // Reference to this collection's model.
        model: Todo,

        // Save all of the todo items under the `"todos"` namespace.
        localStorage: new LocalStore("todos-sushi-require"),

        // Filter down the list of all todo items that are finished.
        completed: function() {
          return this.filter(function(todo){ return todo.get('completed'); });
        },

        // Filter down the list to only todo items that are still not finished.
        remaining: function() {
          return this.without.apply(this, this.completed());
        },

        // We keep the Todos in sequential order, despite being saved by unordered
        // GUID in the database. This generates the next order number for new items.
        nextOrder: function() {
          if (!this.length) return 1;
          return this.last().get('order') + 1;
        },

        // Todos are sorted by their original insertion order.
        comparator: function(todo) {
          return todo.get('order');
        }

    });

    return new TodosCollection;
});
