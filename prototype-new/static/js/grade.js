$(function() {
	$('.grade .question-nav > a').click(function() {
		// $('.grade .question-nav ul').toggle();	
		if ($('.grade .question-nav ul').css('display') == 'none') {
			$('.grade .question-nav ul').css('display', 'inherit');		
			$('.grade .question-nav i').attr('class', 'fa fa-minus-circle fa-lg');
		} else {
			$('.grade .question-nav ul').css('display', 'none');
			$('.grade .question-nav i').attr('class', 'fa fa-plus-circle fa-lg');
		}
	});
});