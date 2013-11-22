$(document).ready(function() {
	// Activate tooltips
	$('[data-rel=tooltip]').tooltip();

	//custom autocomplete (category selection)
	$.widget( "custom.catcomplete", $.ui.autocomplete, {
		_renderMenu: function( ul, items ) {
			var that = this,
			currentCategory = "";
			$.each( items, function( index, item ) {
				if ( item.category != currentCategory ) {
					ul.append( "<li class='ui-autocomplete-category'>" + item.category + "</li>" );
					currentCategory = item.category;
				}
				that._renderItemData( ul, item );
			});
		}
	});
	// For the data, data members in the same category must be one after the other
	 var data = [
		{ label: "Karanveer Mohan (kvmohan)", category: "Student" },
		{ label: "Catherine Lu (cglu)", category: "Student" },
		{ label: "Jason Adams (jadams)", category: "TA" },
		{ label: "Susan Patel (spatel)", category: "TA" },
		{ label: "Victor Garcia (victorgarcia)", category: "TA" },
		{ label: "Yasmin Armani (yasarmani)", category: "TA" },
	];
	$( "#tags" ).catcomplete({
		delay: 0,
		source: data
	});

	// Start off the checkboxes as checked
	$(':input:checkbox').prop('checked', true);

});