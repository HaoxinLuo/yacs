Handlebars.registerHelper('department_code', function (id) {
  return new Handlebars.SafeString(Yacs.models.departments.store.id[id].code);
});

Handlebars.registerHelper('course_credits', function (c) {
  var outString = '';
  // render "credit(s)" properly
  if (c.min_credits != c.max_credits) {
    outString = c.min_credits + '-' + c.max_credits + ' credits';
  }
  else {
    outString = c.max_credits + ' credit' + (c.max_credits == 1 ? '' : 's');
  }
  return new Handlebars.SafeString(outString);
});

Handlebars.registerHelper('join', function (arr) {
  return new Handlebars.SafeString(arr.join(', '));
});

Handlebars.registerHelper('course_seats', function (c) {
  var remaining = c.seats - c.seats_taken;
  return new Handlebars.SafeString(remaining);
});

Handlebars.registerHelper('selected_status', function (s) {
  return new Handlebars.SafeString(Yacs.user.hasSelection(s.id) ? 'selected' : '');
});

Handlebars.registerHelper('day_name', function (n) {
  return new Handlebars.SafeString(['Sun', 'Mon', 'Tue', 'Wed', 'Thr', 'Fri', 'Sat'][n]);
});

Handlebars.registerHelper('time_range', function (start, end) {
  return new Handlebars.SafeString([start, end].map(function (time) {
    var hour = Math.floor(time / 100);
    var ampm = hour > 12 ? 'p' : 'a';
    hour = hour > 12 ? hour - 12 : hour == 0 ? 12 : hour;
    var minutes = time % 100;
    minutes = minutes > 9 ? minutes : minutes == 0 ? '' : '0' + minutes;
    return hour + (minutes ? ':' + minutes : '') + ampm;
  }).join('-'));
});

/**
 * Courses view. Displays courses and their sections
 * @param {Object} data - Object containing Courses model collection
 * @param {Model[]} data.courses - Courses model collection
 * @return {undefined}
 * @memberOf Yacs.views
 */
Yacs.views.courses = function (data) {
  var html = HandlebarsTemplates.courses(data);
  Yacs.setContents(html);

  var isCourseSelected = function (course) {
    var isSelected = true;
    course.querySelectorAll('section').forEach(function (s) {
      if (!Yacs.user.hasSelection(s.dataset.id)) isSelected = false;
    });
    return isSelected;
  };

  var descriptionRequireTruncation = function (description, showButton) {
    var overflowed = description.classList.contains('overflow');
    var overflowing = description.scrollHeight > 38;
    if (overflowed != overflowing) {
      description.classList[overflowing ? 'add' : 'remove']('overflow','truncated');
      showButton.classList[overflowing ? 'remove' : 'add']('open');
      showButton.style.display = overflowing ? 'block' : 'none';
    }
  };

  // Add event listeners to sections
  document.getElementsByTagName('section').forEach(function (s) {
    Yacs.on('click', s, function (section) {
      /* If there happens to be a mismatch between the data and the display,
         we care about the data - e.g. if the id is in the array, we will
         always deselect it regardless of whether it was being rendered as
         selected or not.
      */
      var sid = section.dataset.id;
      if (Yacs.user.removeSelection(sid)) {
        section.classList.remove('selected');
      }
      else {
        Yacs.user.addSelection(sid);
        section.classList.add('selected');
      }
      var course = section.closest('course');
      course.classList[isCourseSelected(course) ? 'add' : 'remove']('selected');
    });
    if (Yacs.user.hasSelection(s.dataset.id)) s.classList.add('selected');
  });

  /* This does not actually add or remove sections from the selected list.
     TODO: implement this
  */
  document.getElementsByTagName('course').forEach(function (c) {
    Yacs.on('click', c.getElementsByTagName('course-info')[0], function (ci) {
      var isSelected = isCourseSelected(c);
      c.getElementsByTagName('section').forEach(function (s) {
        if (isSelected) {
          s.classList.remove('selected');
          Yacs.user.removeSelection(s.dataset.id);
        } else {
          s.classList.add('selected');
          Yacs.user.addSelection(s.dataset.id);
        }
      });
      c.classList[isSelected ? 'remove' : 'add']('selected');
    });
    if (isCourseSelected(c)) c.classList.add('selected');

    var description = c.querySelector('course-description');
    var showButton = c.querySelector('show-hide-button');
    Yacs.on('click', showButton, function (showButton, event) {
      var descriptionTruncated = description.classList.contains('truncated');
      description.classList[descriptionTruncated ? 'remove' : 'add']('truncated');
      showButton.classList[descriptionTruncated ? 'add' : 'remove']('open');
      event.stopPropagation();
    });
    descriptionRequireTruncation(description, showButton);
  });

  var checkAllDescriptionOverflow = function () {
    console.log("checking all coureses");
    document.querySelectorAll("course").forEach(function (c) {
      var description = c.querySelector("course-description"),
          showButton  = c.querySelector("show-hide-button");
      descriptionRequireTruncation(description, showButton);
    });    
  };

  // (function () {
  //   var expand = document.querySelector(".resize-sensor-expand"),
  //       expandChild = expand.childNodes[0],
  //       shrink = document.querySelector(".resize-sensor-shrink"),
  //       running = false;
  //   console.log(expand, expandChild, shrink);
  //   var reset = function () {
  //     expandChild.style.width  = 100000+'px';
  //     expandChild.style.height = 100000+'px';

  //     expand.scrollLeft = 100000;
  //     expand.scrollTop  = 100000;

  //     shrink.scrollLeft = 100000;
  //     shrink.scrollTop  = 100000;
  //   };
  //   var onScroll = function () {
  //     if (!running) {
  //       running = true;
  //       requestAnimationFrame(checkAllDescriptionOverflow);
  //       running = false;
  //     }
  //     console.log("resizing");
  //     reset();
  //   };
  //   reset();
  //   expand.addEventListener("scroll", onScroll);
  //   shrink.addEventListener("scroll", onScroll);
  // }());
  var attach = function(element) {
    element.resizeSensor = document.createElement('div');
    element.resizeSensor.className = 'resize-sensor';
    var style = 'position: absolute; left: 0; top: 0; right: 0; bottom: 0; overflow: hidden; z-index: -1; visibility: hidden;';
    var styleChild = 'position: absolute; left: 0; top: 0; transition: 0s;';

    element.resizeSensor.style.cssText = style;
    element.resizeSensor.innerHTML =
      '<div class="resize-sensor-expand" style="' + style + '">' +
      '<div style="' + styleChild + '"></div>' +
      '</div>' +
      '<div class="resize-sensor-shrink" style="' + style + '">' +
      '<div style="' + styleChild + ' width: 200%; height: 200%"></div>' +
      '</div>';
    element.appendChild(element.resizeSensor);
    element.style.position = 'relative';

    var expand = document.querySelector(".resize-sensor-expand"),
        expandChild = expand.childNodes[0];
    var shrink = document.querySelector(".resize-sensor-shrink");
    console.log(expand, expandChild, shrink);

    var reset = function() {
      expandChild.style.width  = 100000+'px';
      expandChild.style.height = 100000+'px';

      expand.scrollLeft = 100000;
      expand.scrollTop  = 100000;

      shrink.scrollLeft = 100000;
      shrink.scrollTop  = 100000;
    };
    reset();
    var counter = 0,
        ccounter = 0,
        dirty = false,
        checking = false;
    var onScroll = function(){
      console.log('resize detected', dirty);
      //dirty = true;
      if(!checking){
        checking = true;
        requestAnimationFrame(checkAllDescriptionOverflow);
        checking = false;
      }
      reset();
    };
    setInterval(function(){counter = 0;ccounter=0;}, 1000);
    var checkDirty = function(){
      console.log("check: ", ccounter++);
      //if(dirty){
      console.log('resize: ',counter++);
      dirty= false;
      //}
      checking = false;
      //    requestAnimationFrame(checkDirty);
    };
    //  requestAnimationFrame(checkDirty);
    expand.addEventListener("scroll", onScroll);
    shrink.addEventListener("scroll", onScroll);
  };
  attach(document.querySelector("#content"));
  // var resizingFunction;
  // window.addEventListener('resize', function () {
  //   if (document.querySelector('#content courses')){
  //     clearTimeout(resizingFunction);
  //     resizingFunction = setTimeout(function () {
  //       document.querySelectorAll('course').forEach(function (c) {
  //         var description = c.querySelector('course-description');
  //         var showButton = c.querySelector('show-hide-button');
  //         descriptionRequireTruncation(description, showButton);
  //       });
  //     }, 100);
  //   }
  // });
};
