//Known issues:
//1. When page "flip" is activated after accelerating a touch event,
// a double acceleration glitch occurs when flipping to the back page

// 2. Since page flip does not work on Android 2.2 - 4.0, the "front"
// and "back" concept should not be used.

//optimize for minification and performance
(function(window, document, undefined) {

   var slidfast = (function() {

      var slidfast = function(startupOptions) {
         options = startupOptions;
         return new slidfast.core.init(options);
      },

            options,

            defaultPageID = "",

            touchEnabled = false,

            singlePageModel = false,

            focusPage = null,

            slides = false,

            optimizeNetwork = false,

            isReady = false,

            flipped = false;

      slidfast.core = slidfast.prototype = {
         constructor: slidfast,

         start: function() {

            try {
               if (options) {
                  defaultPageID = options.defaultPageID;
                  touchEnabled = options.touchEnabled;
                  singlePageModel = options.singlePageModel;
                  optimizeNetwork = options.optimizeNetwork;
                  slides = options.slides;
               }
            } catch(e) {
               alert('Problem with startup options. You must define the page ID at a min. \n Error:' + e)
            }

            slidfast.core.hideURLBar();
            slidfast.core.locationChange();

            if (touchEnabled) {
               new slidfast.ui.Touch(getElement(defaultPageID));
            }

            if (optimizeNetwork) {
               //network optimized calls fetchAndCache based on connection type
               slidfast.network.init();
            } else {
               //otherwise, if network optimization isn't turned on, still allow use of AJAX fetch and cache
               if (singlePageModel) {
                  slidfast.core.fetchAndCache(true);
               }
            }

            if(slides){
               slidfast.slides.init();
            }

         },

         hideURLBar: function() {
            //hide the url bar on mobile devices
            setTimeout(scrollTo, 0, 0, 1)
         },

         init: function(options) {

            window.addEventListener('load', function(e) {
               isReady = true;
               slidfast.core.start(defaultPageID, touchEnabled);
            }, false);

            window.addEventListener('hashchange', function(e) {
               slidfast.core.locationChange();
            }, false);

            if(options.slides){
               //slide specific todo fix later
               document.addEventListener('keydown', function(e) {
                  slidfast.slides.handleKeys(e);
               }, false);
            }
            //setup a generic event for WebSocket messages
            //let the server do it for now
            //window.eventObj = document.createEvent('Event');

            return slidfast.core;

         },

         locationChange: function() {
            if (location.hash === "#" + defaultPageID || location.hash == '') {
               //slidfast.ui.slideTo(defaultPageID);
            } else {

               try {
                  //todo - give the hash a safe namespace
                  targetId = location.hash;
                  //slidfast.ui.slideTo(targetId.replace('#sf-', ''));
               } catch(e) {
                  console.log(e)
                  //alert(e)
               }

            }
         },

         ajax : function(url, callback, async) {
            var req = init();

            req.onreadystatechange = processRequest;

            function init() {
               if (window.XMLHttpRequest) {
                  return new XMLHttpRequest();
               } else if (window.ActiveXObject) {
                  return new ActiveXObject("Microsoft.XMLHTTP");
               }
            }

            function processRequest() {
               if (req.readyState == 4) {
                  if (req.status == 200) {
                     if (slidfast.html5e.supports_local_storage()) {
                        try {
                           localStorage[url] = req.responseText;
                        } catch(e) {
                           if (e.name == 'QUOTA_EXCEEDED_ERR') {
                              //write this markup to a server-side
                              //cache or extension of localStorage
                              alert('Quota exceeded!');
                           }
                        }
                     }
                     if (callback) callback(req.responseText, url);
                  } else {
                     // There is an error of some kind, use our cached copy (if available).
                     if (!!localStorage[url]) {
                        // We have some data cached, return that to the callback.
                        callback(localStorage[url], url);
                        return;
                     }
                  }
               }
            }

            this.doGet = function() {
               req.open("GET", url + "?timestamp=" + new Date().getTime(), async);
               req.send(null);

            }

            this.doPost = function(body) {
               req.open("POST", url, async);
               req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
               req.send(body);
            }
         },

         insertPages : function(text, originalLink) {

            var frame = getFrame();
            frame.write(text);

            //now we have a DOM to work with
            var incomingPages = frame.getElementsByClassName('page');

            var i;
            var pageCount = incomingPages.length;
            //helper for onlcick below
            var onclickHelper = function(e) {
               return function(f) {
                  slidfast.ui.slideTo(e);
               }
            };
            for (i = 0; i < pageCount; i += 1) {
               //the new page will always be at index 0 because
               //the last one just got popped off the stack with appendChild (below)
               //todo - handle better
               var newPage = incomingPages[0];
               //stage the new pages to the left by default
               //(todo check for predefined stage class)
               newPage.className = 'page stage-left';


               try {
                  //mobile safari will not allow nodes to be transferred from one DOM to another so
                  //we must use adoptNode()
                  //todo - if you want to use this function, then you need an active slide-group to use below
                  //get an active -->('slide-group').appendChild(document.adoptNode(newPage));
               } catch(e) {
                  //todo graceful degradation?
               }
               //this is where prefetching multiple "mobile" pages embedded in a single html page gets tricky.
               //we may have N embedded pages, so how do we know which node/page this should link/slide to?
               //for now we'll assume the first *-page in the "front" node is where this links to.
               if (originalLink.onclick == null) {
                  //todo set the href for ajax bookmark (override back button)
                  originalLink.setAttribute('href', '#');
                  //set the original link for transition
                  originalLink.onclick = onclickHelper(newPage.id);
               }
            }
         },

         cacheExternalImage : function(url) {
            var img = new Image(); // width, height values are optional params
            //remote server has to support CORS
            img.crossOrigin = '';
            img.src = url;
            img.onload = function() {
               if (img.complete) {
                  //this is where you could proxy server side
                  load(img);
               }
            }
            var canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;

            // Copy the image contents to the canvas
            var ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            img.src = ctx.canvas.toDataURL("image/png");
            return img
         },

         fetchAndCache : function(async) {
            var links = slidfast.core.getUnconvertedLinks(document, 'fetch');

            var i;
            for (i = 0; i < links.length; i += 1) {
               var ai = new slidfast.core.ajax(links[i], function(text, url) {
                  //insert the new mobile page into the DOM
                  slidfast.core.insertPages(text, url);
               }, async);
               ai.doGet();
            }
         },

         getUnconvertedLinks : function(node, classname) {
            //iterate through all nodes in this DOM to find all mobile pages we care about
            var links = new Array;
            var pages = node.getElementsByClassName('page');
            var i;
            for (i = 0; i < pages.length; i += 1) {
               //find all links
               var pageLinks = pages[i].getElementsByTagName('a');

               var j;
               for (j = 0; j < pageLinks.length; j += 1) {
                  var link = pageLinks[j];

                  if (link.hasAttribute('href') &&
                     //'#' in the href tells us that this page is already loaded in the dom - and
                     // that it links to a mobile transition/page
                        !(/[\#]/g).test(link.href)) {
                     //check for an explicit class name setting to filter this link
                     if (classname != null) {
                        if (link.className.indexOf(classname) >= 0) {
                           links.push(link);
                        }
                     } else if (classname == null && link.className == '') {
                        //return unfiltered list
                        links.push(link);
                     }
                  }
               }
            }
            return links;
         }

      };

      slidfast.core.init.prototype = slidfast.core;

      slidfast.ui = slidfast.prototype = {
         //method takes string 'id' or actual element
         slideTo : function(id) {

            if (!focusPage) {
               focusPage = getElement(defaultPageID);
            }

            //1.)the page we are bringing into focus dictates how
            // the current page will exit. So let's see what classes
            // our incoming page is using. We know it will have stage[right|left|etc...]

            if (typeof id === 'string') {
               try {
                  id = getElement(id);
               } catch(e) {
                  console.log('uh oh')
               }
            }

            var classes;
            //todo use classList here
            //this causes error with no classname--> console.log(id.className.indexOf(' '));
            try {
               classes = id.className.split(' ');
            } catch(e) {

            }

            //2.)decide if the incoming page is assigned to right or left
            // (-1 if no match)
            var stageType = classes.indexOf('stage-left');


            //3.) decide how this focused page should exit.
            if (focusPage) {
               if (stageType > 0) {
                  focusPage.className = 'slide transition stage-right';
               } else {
                  focusPage.className = 'slide transition stage-left';
               }
            }

            //4. refresh/set the variable
            focusPage = id;

            //5. Bring in the new page.
            focusPage.className = 'slide transition';

            //6. make this transition bookmarkable
            location.hash = '#sf-' + focusPage.id;

            if (touchEnabled) {
               new slidfast.ui.Touch(focusPage);
            }

         },

         Touch : function(e) {
            var page = e;
            //todo - tie to markup for now
            var track = getElement("slide-group-container");
            var currentPos = page.style.left;

            var originalTouch = 0;

            var slideDirection = null;
            var cancel = false;
            var swipeThreshold = 201;

            var swipeTime;
            var timer;
            var maxPos;

            function pageMove(event) {
               //get position after transform
               var curTransform = new WebKitCSSMatrix(window.getComputedStyle(page).webkitTransform);
               var pagePosition = curTransform.m41;

               //make sure finger is not released
               if (event.type != 'touchend') {
                  //holder for current x position
                  var currentTouch = event.touches[0].clientX;

                  if (event.type == 'touchstart') {
                     //reset measurement to 0 each time a new touch begins
                     originalTouch = event.touches[0].clientX;
                     timer = timerStart();
                  }

                  //get the difference between where we are now vs. where we started on first touch
                  currentPos = currentTouch - originalTouch;

                  //figure out if we are cancelling the swipe event
                  //simple gauge for finding the highest positive or negative number
                  if (pagePosition < 0) {
                     if (maxPos < pagePosition) {
                        cancel = true;
                     } else {
                        maxPos = pagePosition;
                     }
                  } else {
                     if (maxPos > pagePosition) {
                        cancel = true;
                     } else {
                        maxPos = pagePosition;
                     }
                  }

               } else {
                  //touch event comes to an end
                  swipeTime = timerEnd(timer, 'numbers2');
                  currentPos = 0;

                  //how far do we go before a page flip occurs
                  var pageFlipThreshold = 75;

                  if (!cancel) {
                     //find out which direction we're going on x axis
                     if (pagePosition >= 0) {
                        //moving current page to the right
                        //so means we're flipping backwards
                        if ((pagePosition > pageFlipThreshold) || (swipeTime < swipeThreshold)) {
                           //user wants to go backward
                           slideDirection = 'right';
                        } else {
                           slideDirection = null;
                        }
                     } else {
                        //current page is sliding to the left
                        if ((swipeTime < swipeThreshold) || (pagePosition < pageFlipThreshold)) {
                           //user wants to go forward
                           slideDirection = 'left';
                        } else {
                           slideDirection = null;
                        }

                     }
                  }
                  maxPos = 0;
                  cancel = false;
               }

               positionPage();
            }

            function positionPage(end) {
               page.style.webkitTransform = 'translate3d(' + currentPos + 'px, 0, 0)';
               if (end) {
                  page.style.WebkitTransition = 'all .4s ease-out';
                  //page.style.WebkitTransition = 'all .4s cubic-bezier(0,.58,.58,1)'
               } else {
                  page.style.WebkitTransition = 'all .2s ease-out';
               }
               page.style.WebkitUserSelect = 'none';
            }

            track.ontouchstart = function(event) {
               //alert(event.touches[0].clientX);
               pageMove(event);
            };
            track.ontouchmove = function(event) {
               event.preventDefault();
               pageMove(event);
            };
            track.ontouchend = function(event) {
               pageMove(event);
               if (slideDirection == 'left') {
                  slidfast.ui.slideTo('wesley-page');
               } else if (slideDirection == 'right') {
                  slidfast.ui.slideTo('about-page');
               }
            };

            positionPage(true);

         }

      };

      slidfast.network = slidfast.prototype = {

         init : function() {
            window.addEventListener('load', function(e) {
               if (navigator.onLine) {
                  //new page load
                  slidfast.network.processOnline();
               } else {
                  //the app is probably already cached and (maybe) bookmarked...
                  slidfast.network.processOffline();
               }
            }, false);

            window.addEventListener("offline", function(e) {
               //we just lost our connection and entered offline mode, disable eternal link
               slidfast.network.processOffline(e.type);
            }, false);

            window.addEventListener("online", function(e) {
               //just came back online, enable links
               slidfast.network.processOnline(e.type);
            }, false);

            slidfast.network.setup();
         },

         setup : function(event) {
            // create a custom object if navigator.connection isn't available
            var connection = navigator.connection || {'type':'0'};
            if (connection.type == 2 || connection.type == 1) {
               //wifi/ethernet
               //Coffee Wifi latency: ~75ms-200ms
               //Home Wifi latency: ~25-35ms
               //Coffee Wifi DL speed: ~550kbps-650kbps
               //Home Wifi DL speed: ~1000kbps-2000kbps
               slidfast.core.fetchAndCache(true);
            } else if (connection.type == 3) {
               //edge
               //ATT Edge latency: ~400-600ms
               //ATT Edge DL speed: ~2-10kbps
               slidfast.core.fetchAndCache(false);
            } else if (connection.type == 2) {
               //3g
               //ATT 3G latency: ~400ms
               //Verizon 3G latency: ~150-250ms
               //ATT 3G DL speed: ~60-100kbps
               //Verizon 3G DL speed: ~20-70kbps
               slidfast.core.fetchAndCache(false);
            } else {
               //unknown
               slidfast.core.fetchAndCache(true);
            }
         },

         processOnline : function(event) {

            slidfast.network.setup();
            checkAppCache();

            //reset our once disabled offline links
            if (event) {
               for (i = 0; i < disabledLinks.length; i += 1) {
                  disabledLinks[i].onclick = null;
               }
            }

            function checkAppCache() {
               //check for a new appCache
               window.applicationCache.addEventListener('updateready', function(e) {
                  //alert('checking appcache' + window.applicationCache.status);
                  if (window.applicationCache.status == window.applicationCache.UPDATEREADY) {
                     // Browser downloaded a new app cache.
                     // Swap it in and reload the page to get the new hotness.
                     window.applicationCache.swapCache();
                     if (confirm('A new version of this site is available. Load it?')) {
                        window.location.reload();
                     }
                  } else {
                  }
               }, false);
            }
         },

         processOffline : function(event) {
            slidfast.network.setup();
            //disable external links until we come back - setting the bounds of app
            disabledLinks = slidfast.core.getUnconvertedLinks(document);
            var i;
            //helper for onlcick below
            var onclickHelper = function(e) {
               return function(f) {
                  alert('This app is currently offline and cannot access the hotness');
                  return false;
               }
            };
            for (i = 0; i < disabledLinks.length; i += 1) {
               if (disabledLinks[i].onclick == null) {
                  //alert user we're not online
                  disabledLinks[i].onclick = onclickHelper(disabledLinks[i].href);

               }
            }
         }


      };

      slidfast.html5e = slidfast.prototype = {

         supports_local_storage : function() {
            try {
               return 'localStorage' in window && window['localStorage'] !== null;
            } catch (e) {
               return false;
            }
         },

         supports_app_cache : function() {
            try {
               return 'applicationCache' in window && window['applicationCache'] !== null;
            } catch (e) {
               return false;
            }
         }

      };

       var ip,ws;
       var username;
       var isopen = false;
       //var _onopen,_onmessage,_onclose,_onerror;
       slidfast.ws = slidfast.prototype = {

           ip : function() {
               //dev
               var ai = new slidfast.core.ajax('/rest/presenters/ip',function(text,url){
                   ip = text;
               },false);
               ai.doGet();
               return ip;

               //prod
               //return '107.22.176.73';
           },

           connect : function(websocket,initString) {

               username = 'yomama';
               //here we check to see if we're passing in our mock websocket object from polling clients (using gracefulWebSocket.js)
               console.log('!websocket ' + websocket);
               if(!websocket){
//               todo - use localstorage so we don't have to make future http requests for ip, but if ip changes we need to
//               detect ws failure and refresh localstorage with new ip... //if(!localStorage['/rest/members/ip']){
                  var location = 'ws://' + this.ip() + ':8081';
                  ws = new WebSocket(location);
               }else{
                  ws = websocket;
               }
              //ws = websocket;
              //this.ws = ws;
              ws.onopen = function() {
                 isopen = true;
                 //basic auth until we get something better
                 console.log('sent onopen' + username);
                 slidfast.ws._send('user:'+username);
                 if(initString){
                    slidfast.ws._send(initString);
                 }
              };
              ws.onmessage = this._onmessage;
              ws.onclose = this._onclose;
//              ws.onerror = this._onerror;

              return ws;
          },

          _onopen : function() {
              isopen = true;
              //basic auth until we get something better
              //console.log('sent onopen' + username);
              slidfast.ws._send('user:'+username);
          },

          _onmessage : function(m) {
              if (m.data) {
                  ////console.log(m.data);
                  //check to see if this message is a CDI event
                 //alert('onmessage' + m.data);
                  if(m.data.indexOf('cdievent') > 0){
                      try{
                          //$('log').innerHTML = m.data;
                           ////console.log(m.data);
                          //avoid use of eval...

                          var event = (m.data);
                          event = (new Function("return " + event))();
                          event.cdievent.fire();
                      }catch(e){
                          alert(e);
                      }
                  }else{

                  }
              }
          },

          _onclose : function(m) {
              ws = null;
          },

          _onerror : function(e) {
              alert(e);
          },

          _send : function(message) {
              //console.log('sent ');
              ws.send(message);

          }
      };

      var activeGroup, activeSlide, activeOption;
      var pastOptions = [], activeOptions = [];
      var futureSlides = [], pastSlides = [];
      var futureGroups = [], pastGroups = [];
      var groupSlideIndex = 0;
      var currentVotes = {};
      var totalVotes = 0;
      slidfast.slides = slidfast.prototype = {

         init : function() {
            futureGroups = toArray(this.groups());
            for (i = 0; i < futureGroups.length; i++) {
               futureGroups[i].style.display = 'none';
               var thisGroupSlides = this.groupSlides(futureGroups[i]);
               for (j = 0; j < thisGroupSlides.length; j++) {
                  //todo use classlist
                  thisGroupSlides[j].className = 'slide stage-right';
               }
            }

            activeGroup = futureGroups.shift();
            activeGroup.style.display = '';

            futureSlides = toArray(this.groupSlides(activeGroup));

            activeSlide = futureSlides.shift();

            window.addEventListener('clientVote', function(e) {
               slidfast.slides.optionVote(e.vote,activeSlide);
            }, false);

            this.checkOptions();
            this.updateRemotes();
            slidfast.ui.slideTo(activeSlide);
         },

         checkOptions : function() {
            //console.log('checkOptions' + groupSlideIndex + ' ' + activeSlide.getAttribute("data-option"));
            if (groupSlideIndex == 0 &&
                  activeSlide.getAttribute("data-option") == 'master') {
               //init activeOptions
               var groupOptions = this.groupOptions(activeGroup);
               if(groupOptions.length > 0){
                  barChart.clear();
                  $('div').remove('.placeholder');
                  for (var i = 0; i < groupOptions.length; i++) {
                     barChart.addVoteOption(groupOptions[i]);
                  }


                  var barChartDiv = document.createElement("div");
                  barChartDiv.className = 'placeholder';
                  activeSlide.appendChild(barChartDiv);

                  barChart.draw();
               }
               //if(!activeSlide.querySelector('.option-handler-1') && groupOptions.length > 0){
                  //console.log('checkOptions groupOptions' + groupOptions);
				  
				  /*
                  var option1 = document.createElement("a");
                  option1.href = 'javascript:slidfast.slides.setOption(\'' + groupOptions[0] + '\');void(0)';
                  option1.appendChild(document.createTextNode('' + groupOptions[0]));

                  var option2 = document.createElement("a");
                  option2.href = 'javascript:slidfast.slides.setOption(\'' + groupOptions[1] + '\');void(0)';
                  option2.appendChild(document.createTextNode('' + groupOptions[1]));

                  var optionHandler1 = document.createElement("div");
                  optionHandler1.className = 'option-handler-1';
                  optionHandler1.appendChild(option1);
                  activeSlide.appendChild(optionHandler1);

                  var optionHandler2 = document.createElement("div");
                  optionHandler2.className = 'option-handler-2';
                  optionHandler2.appendChild(option2);
                  activeSlide.appendChild(optionHandler2);
				  */
               //}

               //}
            }
         },

         clearRoute : function(){
             activeSlide.removeAttribute("data-route");
         },

         nextSlide : function() {
            //console.log('nextSlide' + futureSlides.length + ' ' + groupSlideIndex);
            if (futureSlides.length > 0) {

               if(activeSlide.getAttribute("data-option") == 'master' &&
                  activeSlide.getAttribute("data-route") == null && totalVotes > 0) {
                  //console.log('decideroute');
                  this.decideRoute();
               }

               pastSlides.push(activeSlide);
               activeSlide = futureSlides.shift();
               slidfast.ui.slideTo(activeSlide);
               groupSlideIndex++;
            } else {
               //move to next group
               this.nextGroup();
            }


            //quick hack for hiding audience address bar
             var mainScreenAddressBar = document.querySelector(".address");
             if(mainScreenAddressBar){
                 document.querySelector(".address").className = 'address-small';
             }
         },

         prevSlide : function() {
            //console.log('prevSlide' + pastSlides.length + ' ' + groupSlideIndex);
            if (pastSlides.length > 0 && groupSlideIndex > 0) {
               futureSlides.unshift(activeSlide);
               activeSlide = pastSlides.pop();
               slidfast.ui.slideTo(activeSlide);
               groupSlideIndex--;
            } else {
               this.prevGroup();
            }
         },

         nextGroup : function() {

            //console.log('nextGroup' + groupSlideIndex);
            if (futureGroups.length > 0) {
               activeOption = null;

               groupSlideIndex = 0;
               pastGroups.push(activeGroup);
               activeGroup.style.display = 'none';
               activeGroup = futureGroups.shift();
               activeGroup.style.display = '';
               futureSlides = toArray(this.groupSlides(activeGroup));
               activeSlide = futureSlides.shift();

               this.checkOptions();
               this.updateRemotes();
               slidfast.ui.slideTo(activeSlide);

               //reset votes
               currentVotes = {};
               totalVotes = 0;


            } else {
               //eop
            }
         },

         prevGroup : function() {
            //console.log('prevGroup ' + pastGroups.length);
            if (pastGroups.length > 0) {
               futureGroups.unshift(activeGroup);
               activeGroup.style.display = 'none';
               activeGroup = pastGroups.pop();
               activeGroup.style.display = '';
               //
               //pastSlides = toArray(this.groupSlides(activeGroup));
               //pastSlides.reverse();
               //console.log('pastOptions ' + pastOptions.length);
               if(pastOptions.length > 0){
                  //option has been selected for the current group
                  if(activeOption){
                     activeOption = pastOptions[pastOptions.length - 2];
                  }else{
                     //option has not been chose yet in active group, so pop from history
                     activeOption = pastOptions.pop();
                  }

                  this.setOption(activeOption);
                  pastSlides = futureSlides;
               }else{
                  pastSlides = toArray(this.groupSlides(activeGroup));
                  //pastSlides.reverse();
               }
               futureSlides = [];
               groupSlideIndex = pastSlides.length;
               activeSlide = pastSlides.pop();
               var groupOptions = this.groupOptions(activeGroup);
               this.updateRemotes();
               //console.log('---groupOptions ' + groupOptions);
               //console.log('activeSlide ' + activeSlide);

               slidfast.ui.slideTo(activeSlide);

               //reset votes
               currentVotes = {};
               totalVotes = 0;

            } else {
               //beginning of presentation
            }
         },

         groups : function() {
            //return all groups in the DOM
            return document.querySelectorAll(".slide-group");
         },

         groupSlides : function(group) {
            //return all slides for a group
            return group.querySelectorAll(".slide");
         },

         groupOptions : function(group) {
            //there are 2 options per group, based on active slide... return them
            activeOptions = [];
            var u = {}, option;
            var slides = toArray(this.groupSlides(group));
            //console.log(slides.length);
            for (i = 0; i < slides.length; i++) {
               //or .dataset['option']
               option = slides[i].getAttribute("data-option");
               if (option && option != 'master') {
                  if (option in u)
                     continue;
                  activeOptions.push(option);
                  u[option] = 1;
               }
            }
            //console.log('activeOptions ' + activeOptions);

            return activeOptions;
         },

         setOption : function(option) {
            futureSlides = [];
            //try to keep a history of options chosen
            if (pastOptions.length > 0) {
               if (pastOptions.indexOf(option) != 1) {
                  pastOptions.push(option);
               }
            } else {
               //push first option on stack
               pastOptions.push(option);
            }

            //only show slides for selected option
            var slides = toArray(this.groupSlides(activeGroup));
            for (i = 0; i < slides.length; i++) {
               //include only chose option slides and master  ('master' + activeOption) is the only case we want to include master
               //todo - fix double arrow tap when going backwards on master
               if (slides[i].getAttribute("data-option") == option || (slides[i].getAttribute("data-option") == 'master' && activeOption != null)) {
                  ////console.log(slides[i]);
                  futureSlides.push(slides[i]);
               }
            }

            //safe to set now
            activeOption = option;
            activeOptions = [];
         },

         updateRemotes : function() {
            var activeOptionsString = 'activeOptions:' + activeOptions;
            //console.log('===========' + activeOptions.length);
            if(activeOptions.length >= 1){
                if(!ws){
                   //console.log('no conn');
                   slidfast.ws.connect(null,activeOptionsString);
                }else{
                   //console.log('conn');
                   slidfast.ws._send(activeOptionsString);
                }
            }

         },

         optionVote : function(vote, activeSlide) {
            //given vote for a default slide
            var index;
            //if(vote in activeOptions){
               index = activeOptions.indexOf(vote);
               if(vote in currentVotes){
                  currentVotes[vote] += 1;
                  ////console.log(currentVotes);
               }else{
                  currentVotes[vote] = 1;

               }
            //}
            ////console.log(vote + ' ' + currentVotes[vote]);

            for (i = 0; i < activeOptions.length; i++) {
                if(currentVotes.hasOwnProperty(activeOptions[i]))
                totalVotes += currentVotes[activeOptions[i]];
            }
			
			barChart.vote(vote);
			barChart.redraw();

			/*
            //update the makeshift bar chart
            for (i = 0; i < activeOptions.length; i++) {
               //console.log(currentVotes[activeOptions[i]]);
               var optionHandler = activeSlide.querySelector('.option-handler-' + (i + 1));
               if(currentVotes[activeOptions[i]]){
                  optionHandler.style.width = ((currentVotes[activeOptions[i]]/totalVotes) * 100) + '%';
                  optionHandler.style.backgroundColor = '#ffffff';
                  optionHandler.style.border = '1px solid #777';
               }else{
                  optionHandler.style.width = '50%';
               }
            }
			*/
         },

         decideRoute : function(){
            //now we need a decision

            var values = [];
            var sortedObj = [];
            //console.log(currentVotes);
            for(var opt in currentVotes){
               if (currentVotes.hasOwnProperty(opt)) {
                  values.push(currentVotes[opt])
               }
            }
            values.sort(function(a,b){return b-a});
            //console.log(values);

            //todo - check for tie condition

            var winner;
            for(var optb in currentVotes){
               if (currentVotes.hasOwnProperty(optb)) {
                  //based on the sorted values, we'll choose the first one
                  //javascript hashes can't be sorted, so this is a rebuild
                   if(values[0] == currentVotes[optb]){
                      winner = optb;
                   }
               }
            }
            activeSlide.setAttribute('data-route',winner);
            //clear votes for next slideGroup
            totalVotes = 0;
            //console.log('winner' + winner);
            this.setOption(winner);
         },

         handleKeys : function(event) {
            switch (event.keyCode) {
                case 39: // right arrow
                case 13: // Enter
                case 32: // space
                case 34: // PgDn
                  slidfast.slides.nextSlide();
                  event.preventDefault();
                  break;

                case 37: // left arrow
                case 8: // Backspace
                case 33: // PgUp
                  slidfast.slides.prevSlide();
                  event.preventDefault();
                  break;

                case 40: // down arrow

                  event.preventDefault();
                  break;

                case 38: // up arrow

                  event.preventDefault();
                  break;

                case 78: // N
                  //document.body.classList.toggle('with-notes');
                  break;

                case 27: // ESC
                  //document.body.classList.remove('with-notes');
                  break;
              }
         }

      };


      var getElement = function(id) {
         if (document.querySelector) {
            return document.querySelector('#' + id);
         } else {
            return document.getElementById(id);
         }
      };

      var timerStart = function() {
         return (new Date()).getTime();
      };

      var timerEnd = function(start, id) {
         return ((new Date()).getTime() - start);
      };

      var log = function(statement) {
         var log = getElement('log');
         var currentText = log.innerHTML;
         log.innerHTML = (new Date()).toTimeString() + ': ' + statement + '<br/>' + currentText;
      };

      var getFrame = function() {
         var frame = document.getElementById("temp-frame");

         if (!frame) {
            // create frame
            frame = document.createElement("iframe");
            frame.setAttribute("id", "temp-frame");
            frame.setAttribute("name", "temp-frame");
            frame.setAttribute("seamless", "");
            frame.setAttribute("sandbox", "");
            frame.style.display = 'none';
            document.documentElement.appendChild(frame);
         }
         // load a page
         return frame.contentDocument;
      };

      var toArray = function(obj) {
         var array = [];
         // iterate backwards ensuring that length is an UInt32
         for (var i = obj.length >>> 0; i--;) {
            array[i] = obj[i];
         }
         return array;
      };

      function handleBodyKeyDown(event) {

      }

      return slidfast;

   })();

   window.slidfast = slidfast;
})(window, document);




