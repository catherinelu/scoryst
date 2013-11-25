// don't automatically render into body
Router.configure({
  autoRender: false
});

// defines routes for this application
Router.map(function() {
  this.route('login', {
    path: '/',
    template: 'login'
  });

  this.route('dashboard', {
    path: '/dashboard',
    template: 'dashboard'
  });

  this.route('upload-exam', {
    path: '/upload-exam',
    template: 'upload-exam'
  });

  this.route('grade', {
    path: '/grade',
    template: 'grade'
  });

  // TODO: remaining routes (e.g. 404)
});

Template.header.events({
  /* Toggles nav dropdown. */
  'mouseenter .navbar-nav': function() {
    $('.dropdown-menu').show();
  },

  'mouseleave .navbar-nav': function() {
    $('.dropdown-menu').hide();
  }
});

/* Gets pages to display in navigation. */
Template.nav.pages = function() {
  var pages = [
    {
      'name': 'dashboard', // corresponds to a named route
      'icon': 'dashboard', // icon to display next to the anchor
      'text': 'Dashboard' // anchor text
    },

    {
      'name': 'upload-exam',
      'icon': 'file-text',
      'text': 'New Exam'
    },

    {
      'name': 'grade',
      'icon': 'pencil',
      'text': 'Grade'
    }
  ];

  // mark the page being displayed as active
  var curPage = Router.current();
  if (curPage) {
    pages.forEach(function(page) {
      page.active = (page.name === curPage.route.name);
    });
  }

  return pages;
};

/* Calculates and sets the height of the navigation bar. */
function resizeNav() {
  // height of the page excluding the header and footer
  var contentHeight = $('.container').outerHeight(true);
  var viewportHeight = $(window).height() - $('header').height() - $('footer').height();

  /* If the viewport is larger than the content, the nav fills the viewport. Otherwise,
   * the nav is at least the size of the content. */
  var navHeight = Math.max(viewportHeight, contentHeight);
  $('nav').height(navHeight);
}

Template.layout.rendered = resizeNav;
$(window).resize(resizeNav);

// year for copyright notice
Template.footer.year = new Date().getFullYear();
