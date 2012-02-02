<div class="clearfix">
	<h1 class="name">{{firstName}} {{lastName}}</h1>
	<nav class="controls clearfix">
		<div class="right">
			<button class="edit btn btn-small"><i class="icon-trash icon-pencil"></i> Edit</button>
		</div>
	</nav>
</div>


<div class="area">
	<h3>Phone Numbers</h3>
	{{#if phoneNr}}
		<ul class="phone-numbers"></ul>
	{{else}}
		<p>No phone numbers.</p>
	{{/if}}
</div>