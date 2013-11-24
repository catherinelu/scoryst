$(function() {
	$('.paperview .question-nav > a').click(function() {
		// $('.paperview .question-nav ul').toggle();	
		if ($('.paperview .question-nav ul').css('display') == 'none') {
			$('.paperview .question-nav ul').css('display', 'inherit');		
			$('.paperview .question-nav i').attr('class', 'fa fa-minus-circle fa-lg');
		} else {
			$('.paperview .question-nav ul').css('display', 'none');
			$('.paperview .question-nav i').attr('class', 'fa fa-plus-circle fa-lg');
		}
	});
});