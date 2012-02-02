<div class="clearfix">
	<h2>Editing {{firstName}} {{lastName}}</h2>
	<nav class="controls clearfix">
		<div class="right">
			<button class="remove btn btn-danger btn-small"><i class="icon-trash icon-white"></i> Remove</button>
			<button class="save btn btn-success"><i class="icon-ok icon-white"></i> Done</button>
		</div>
	</nav>
</div>
<form class="form-horizontal">
	<fieldset>
		<legend>Name</legend>
		<div class="control-group">
			<label class="control-label" for="person-edit-firstName">First name</label>
			<div class="controls">
				<input type="text" id="person-edit-firstName" data-field="firstName" value="{{firstName}}" placeholder="First Name" />
			</div>
		</div>
		<div class="control-group">
			<label class="control-label" for="person-edit-lastName">Last name</label>
			<div class="controls">
				<input type="text" data-field="lastName" value="{{lastName}}" placeholder="Last Name" >
			</div>
		</div>
	</fieldset>
	
	<fieldset>
		<legend>Phone Numbers <button class="addPhoneNr btn-no-text"><i class="icon-ok icon-plus"></i><span class="text">Add Phone Nr.</span></button></legend>
		<ul class="phone-numbers"></ul>
	</fieldset>
</form>