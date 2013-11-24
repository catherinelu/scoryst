$(function() {
	/* This function calculates and sets the height of the navigation bar. */
	window.resizeNav = function() {
		/* The height of the page excluding the header and footer. */
		var contentHeight = $('.container').outerHeight(true);
		var viewportHeight = $(window).height() - $('header').height() - $('footer').height();
		/* If the viewport is larger than the content, the nav fills the viewport. Otherwise,
         * the nav is at least the size of the content. */
		var navHeight = Math.max(viewportHeight, contentHeight);
		$('nav').height(navHeight);
	};

    resizeNav();
    $(window).resize(resizeNav);

    /* Toggles logout when the user clicks on the Welcome link. */
    $('.navbar-nav').hover(function() {
        $('.dropdown-menu').toggle();
    });
});
