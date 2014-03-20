Scoryst
=========

High level code structure:
Scoryst uses jquery/CSS + Backbone for the frontend and Django for the backend. Keep in mind that Django uses Model-Template-View, so if you’re coming from a Ruby on Rails background, Django views can be considered to be the controllers and Django templates to be the views. Most of our URL structure is RESTful.

Unless otherwise stated, we wrote the code.

Backend
=========
scorystproject/
-settings.py: Django settings for scorystproject project. To prevent pushing sensitive data to git such as AWS credentials, it imports a local file all of us have called local_settings.py.
-urls.py: Specifies regular expressions detailing which urls are handled by which views.

scorystapp/
-management/
--demo_db.py/demo_old_db.py/test_db.py: Create fake databases so that we can test easily during development. Not in use anymore since we now copy over the production database locally for testing purposes.
--manual_upload.py: This is a worst case scenario file which is used when Imagemagick fails (e.g. due to unforeseen memory issues). It allows us to directly upload JPEGs and PDFs to AWS without relying on any external tools.

-migrations/
We use South to manage our migrations which auto-creates this folder
-performance/cache_helpers.py: We use django-cacheops for caching, but cacheops is still primitive in a few ways. For example, you can’t cache a function over multiple querysets etc. cache_helpers adds this functionality on top of cacheops.
-static/
--cache/
Automatically generated. Should not be touched.
--css/lib/: 3rd party library css files such as bootstrap, font-awesome, jquery custom-scrollbar.
--css/style.css: All CSS written by us in one file for performance. Eventually, we might decide to break it down into multiple CSS files, but as of now, different sections have been clearly separated in the css file and it is still easy to work with.
--fonts/: Icons from Font Awesome.
--images/: Any static images we have e.g. corgi pictures for our error pages.
--pdf/: Some PDF files we use for testing purposes.
--js/
javascript files. Described in detail in the front end section.
-templates/: Templates used for the front-end. Described in detail in the front-end section.
-decorators.py
Custom decorators that we use for our functions, generally used to restrict access. There are some tasks that we need to perform for every single query made, such as get who the course user is, check privileges etc. We write decorators for our functions in decorators.py.
For example, almost all the functions have the @decorators.access_controlled and @decorators.instructor_or_ta_required decorators. The former ensures that the user is logged in and the course_id/exam_id/exam_answer_id are consistent with each other (you can’t try to access course 1 with an exam of course 2). The latter ensures that certain pages can only be accessed by instructors and tas for a particular course.
-models.py
All our database models are in this file (UserManager, User, Course, CourseUser, Exam, ExamPage, QuestionPart, Rubric, ExamAnswer, ExamAnswerPage, QuestionPartAnswer, Annotation). These are well documented within the file.
-forms.py
We use forms.py to validate forms submitted from the front-end. For example, during password reset, the password must be at least 8 characters, a PDF file can’t be bigger than 100MB, only valid emails are used, etc.
-panels.py
We used panels.py for django debug toolbar that we use for debugging purposes. This file is not written by us.
-serializers.py
Since backbone connects to Django using a RESTful JSON interface, we use the Django REST framework. This file utilizes Django REST framework and allows to specify serializers for our data representation.
-utils.py
Utility functions
-views/
The views folder contains the bulk of the backend code. Each file is documented thoroughly, so we’ll just mention the higher details here.
--auth.py
Takes care of logging in/logging out, changing passwords etc.
--course.py
When a user wants to create a new course on Scoryst
--error.py
Nobody likes 404 or 500 errors, so we show pictures of a cute corgi when this happens. 
--exams.py
For uploading and editing exams. Users can create/delete exams, edit the rubrics associated with an existing exam and upload new rubrics. Also validates the created exams. 
--general.py
Generic things which don’t need the user to be logged in, like the about and landing page.
--get_csv.py
Once exam grading is over, instructors might want to download a CSV detailing student scores.
--grade.py
Returns the grade page template. Also has functions to get jpegs corresponding to different students etc. 
--grade_or_view.py
Functions that are useful for both grading an exam by instructors or viewing an exam by students such as listing the rubrics, displaying the annotations, getting the pdf associated with a student’s exam.
--helpers.py
Helper functions for rendering templates and passing extra context to each template
--map.py
When student exams are uploaded, we don’t know which exam belongs to which student. map.py provides an interface allowing us to quickly map unmapped exams to students.
--map_question_parts.py
Sometimes, mapping pages to questions can go wrong, for instance when a student writes on the blank side or reorders the pages. This allows us to quickly fix the question mapping.
--overview.py
For the grade overview page, where the instructor can see a list of students and their exam summaries, release grades, etc.
--roster.py
For the roster page. Validates insertion of students/instructors into the course as well as editing/deleting them.
--send_email.py
We need to send emails for a variety of reasons- an exam has been graded, someone is added to a course, password reset etc. As such we use mandrill to send emails along with djrill and celery, which do most of the hard work for us. This merely generates templates, validates etc.
--statistics.py
Generates statistics for an exam
--upload.py
Handles uploads of exams. This is complicated and is explained in detail in the workers/ section.

workers/
To convert PDF into jpegs, we use ImageMagick. ImageMagick is great with one caveat: it uses a lot of memory. This is the reason we had to use manual_upload.py; imagemagick kept utilizing all the memory on our server, so our server kept killing it. To take care of this, we utilize Orchard (orchardup.com to instantly create and delete Docker hosts in the cloud). However, even using Orchard is a fairly complex process:
1. User uploads pdf file containing dozens of exams. Upload.py breaks these pdfs into smaller pdfs (one exam per pdf) and uploads them to S3. 
2. We create the orchard host and spawn a thread to dispatch the converter worker.
3. In dispatcher.py, we dispatch the worker with the given name to the provided orchard host.
  Delivers the provided payload as arguments to the worker (in our case, AWS credentials and the pdf paths).
4. In converter.py, using ImageMagick, we convert the given PDFs to JPEGs. PDFs are passed as paths in S3. They're read from S3, converted to JPEGs, and stored back in S3. This entire step is quite complicated and is documented thoroughly in converter.py.

The other files in the workers/ folder are setup files required to use Orchard. Using Orchard and our multiple workers, we can easily handle uploads of 100 or so exams, each a few megabytes in size, very quickly.

requirements.txt
Specifies all the requirements for scoryst. Run “sudo pip install -r requirements.txt” to install anything missing on your machine that is specified in requirements.txt.

There is other backend code also involved on the server. For example, we have a CRON job running that takes periodic backups of our database.
mention stuff like periodic database backups somewhere.

Frontend
=========
-templates/: Used to display pages (the equivalent of views in RoR).
--about.epy
Information about Scoryst
--create-exam.epy
Instructor can create a new exam
--exams.epy
Instructor can view all of the exams for the course
--grade-overview.epy
Instructor/TA/student can see overview of the class. Instructor/TA can grade. Student can see breakdown of his/her own scores.
--grade.epy
Used for 3 particular instances. (1) when an instructor/TA is grading, (2) when the student is viewing the graded exam, and (3) when an instructor is previewing an exam after it is created.
--landing-page.epy
Landing page. Currently not in production.
--layout.epy
Used in every page except the landing page. It contains code for the navigation bar and adding basic static files e.g. jQuery, Google Analytics.
--login.epy
Login page. Redirects here if user tries to access a page and is not logged in.
--map-exams.epy
An internal interface and tool used to assign student exams to a student (by typing in the student’s name for every exam).
--map-question-parts.epy
An internal interface and tool used to assign particular pages of a student’s exam to particular question/parts.
--new-course.epy
Instructor can create a new course.
--not-found.epy
404 page
--server-error.epy
500 page
--settings.epy
Allow user to change password
--statistics.epy
Show statistics for a class
--switch-user.epy
See view from any user (with superuser privileges only). Currently not used in production.
--upload.epy
An internal interface and tool used to handle upload of student exams. As of now, we are handling uploads of student exams ourselves to get metrics on how long scanning etc take, so there is no direct link to this on the Scoryst webpage. Refer to upload.py to see how the backend works for it.
--email/: Email templates to correspond to users for events e.g. added as grader, student’s grades have been released, password reset.
--reset/: Page templates for anything related to the user changing or resetting his/her password.

-templatetags/
--custom_tags.py
By looking at the URL, determines which course is “active” and therefore allows us to highlight it in the navigation bar.

-static/js
--lib/
library javascript files such as underscore, backbone etc.
--analytics.js
Google analytics
--create-exam.js/create-exam-validator.js
The exam creation and validation process is simple in terms of functionality, but making it intuitive in terms of UI leads to complications. create-exam.js handles adding new questions, new rubrics, deleting them, associating points with them etc with a user friendly interface. Both files are heavily documented.
--exams.js
This is used on the page which shows all of the created exams. We don’t need much javascript here except basic popovers.
--exam-overview.js/grade-overview.js/student-grade-overview.js
see all exams for a given class. Student can see breakdown of his/her own scores. Instructors can see breakdown of any student scores. 
--idempotent.js
Defines IdempotentView. Our backbone views can extend IdempotentView to negate any effects of the views upon removal (e.g. stop listening to DOM events, deregister subviews).
--map-exams.js
Javascript to handle mapping of students to exams. Uses typeahead.js for superfast typeahead completion.
--map-questions-parts.js
Validates and takes care mapping of questions to pages. 
--popover-confirm.js
Custom jquery plugin that creates popovers with cancel and confirm buttons. Well documented in the file.
--script.js
Handles resizing of window etc for all pages
--statistics.js
Uses Chart.js to generate beautiful histograms of the scores
--image-loader.js
ImageLoader class handles asynchronously loading jpegs as well as preloading images for better performance. In case of errors, it also handles showing a loading gif and periodically attempting to fetch the image again. It is extensively documented in the file and can handle prefetching both next and previous pages as well as next/previous students. It also handles large images:
For each image we store two versions of the images, a medium sized version (~200kb which is readable for most students) and a large version (1-2MB, super clear). By default, we only show the medium sized version and that is what is prefetched. However, a user can toggle the zoom-lens to get the large version of the image too. 


--roster/: Directory for all the Backbone code (views and model) required for the roster page.
---course-user-model.js
Defines the Backbone model for a course user.
---views/main.js
The main Backbone view. Creates the roster table and creates subviews for every row.
---views/table-row.js
Defines a view that represents one row of the table (for one course user).

--grade/: Directory for all the Backbone code (views and models) required for the grade page.
---mediator.js: Used to pass information about events between views. 
---models/annotation.js
Represents an instructor/TA annotation on the exam page.
---models/question-part-answer.js
Represents a student’s answer to a particular question and part.
---models/rubric.js
Represents the rubrics associated with a student’s answer to a particular question and part.
---models/utils.js
Allows models to know if the user is a student (to restrict permissions). Also gets CSRF token so that POST/PUT/DELETE requests are possible.
---views/annotation.js
Defines a view that represents one annotation on the exam page.
---views/comment.js
Defines a view that represents an instructor/TA comment to the student.
---views/custom-points.js
Defines a view for the custom points field in the rubrics navigation.
---views/exam-nav.js
Defines a view for the entire exam navigation for a given page.
---views/exam-pdf.js
Defines a view for the exam that shows up on the grade page. Changes the exam page that is shown when the user is navigating.
---views/main.js
The top-level view we create that creates the other views as subviews. Also adds listeners to the mediator for when the user is navigating to a different student or question/part.
---views/rubric.js
Defines a view for one entire rubric. 
---views/rubrics-nav-header.js
Defines a view for the top of the rubric which contains information about whether the question is graded, the grader, and the total points.
---views/rubrics-nav.js
Represents the entire rubrics navigation. Creates the rubrics nav header, all of the rubrics, the comment, and the custom points as subviews.
---views/student-nav.js
Defines view for navigating between students. Tells the mediator when the user changes students, which then tells all other views.
---views/utils.js
Allows views to know if the user is a student (to restrict permissions).

Styling conventions
=========
Python
Tab width is 2 (indentation by spaces)
ClassNames are always UpperCamelCase
function names are separated_by_underscores
variables are separated_by_underscores
All functions, no matter how short must have a docstring
Functions are separated from each other by two line breaks
New line must exist at the end of every file
In case parameters are too long, take them to the next line after two spaces
Use single quotes for strings not double quotes
HTML/CSS
Tab width is 2 by spaces
CSS class names are hyphenated eg. info-popover to be consistent with bootstrap etc.
Suppose the create-exams page has a div with class ‘.grade-style’. style.css must have it in the form ‘.create-exam .grade-style’ along with the other css styles for create-exam
Use double quotes for strings not single quotes
Javascript
lowerCamelCase variable names and functions
jQuery DOM elements must begin with $. eg. var $examCanvas = $('.exam-canvas');
Use === instead of ==
Every function must be documented
Prefer regular functions to variable functions
Prefer functional callbacks (i.e. $.each()) to direct iteration (i.e. for (...) {})
Don’t include any HTML strings in JavaScript; factor these out to embedded JavaScript templates via underscore.js
Avoid alert().
Wrap files in ASIFs (anonymous self-invoking functions) to avoid polluting the global scope
Always prefix variables with var
Always end lines with semicolons

One may wonder why underscores are used in python and camelCase in javascript. This is done to keep as much consistency as possible within those languages. Most of jQuery and backbone use camelCase and most of the python libraries we are using use underscores. However, this creates a discrepancy when we pass JSON data to and from the backend. This has been minor so far and we will be fixing this by adding a middleware to convert variable names.
