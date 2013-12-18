// TODO: wrap in AF
// don't automatically render into body
Router.configure({
  autoRender: false
});

/* Redirects to the login page if the user is not logged in. */
function redirectIfNotLoggedIn() {
  if (!Meteor.userId()) {
    this.redirect('login');
    this.stop();
  }
}

// defines routes for this application
Router.map(function() {
  this.route('login', {
    path: '/',
    template: 'login',

    before: [
      function() {
        // redirect to dashboard if the user is already logged in
        if (Meteor.userId()) {
          this.redirect('/dashboard');
          this.stop();
        }
      }
    ]
  });

  this.route('dashboard', {
    path: '/dashboard',
    template: 'dashboard',
    before: [redirectIfNotLoggedIn]
  });

  this.route('upload-exam', {
    path: '/upload-exam',
    template: 'upload-exam',
    before: [redirectIfNotLoggedIn]
  });

  this.route('grade', {
    path: '/grade',
    template: 'grade',
    before: [redirectIfNotLoggedIn]
  });

  // TODO: prevent visiting route until examUrl and pdfUrl are set in session
  this.route('create-exam', {
    path: '/create-exam',
    template: 'create-exam',
    before: [redirectIfNotLoggedIn]
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
  },

  'click .logout': function() {
    Meteor.logout();
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
resizeNav = function() {
  // height of the page excluding the header and footer
  var contentHeight = $('.container').outerHeight(true);
  var viewportHeight = $(window).height() - $('header').height() - $('footer').height();

  /* If the viewport is larger than the content, the nav fills the viewport. Otherwise,
   * the nav is at least the size of the content. */
  var navHeight = Math.max(viewportHeight, contentHeight);
  $('nav').height(navHeight);
}

Template.layout.rendered = resizeNav;
// In case the window resizes (e.g. PDF is loaded), resizes the navbar as well.
$(window).resize(resizeNav);

// year for copyright notice
Template.footer.year = new Date().getFullYear();
