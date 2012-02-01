define('contacts.main',
	[
		'contacts.data',
		'contacts.views'
	],
	function(Data, Views) {
		ContactsApp = window.ContactsApp = {};
		
		ContactsApp.app = new Views.AppView();
		ContactsApp.Data = Data;
	}
)