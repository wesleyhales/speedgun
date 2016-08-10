#!/usr/bin/env phantomjs
var fs = require('fs'),
    WebPage = require('webpage'),
    system = require('system'),
    args = system.args,
    speedGunArgs = {
      task: 'performance',
      format: 'simple',
      output: 'json',
      userAgent: 'chrome',
      configFile: 'config.json',
      uuid: null
    },
    unaryArgs = {
      help: false,
      version: false,
      verbose: false,
      screenshot: false,
      crawl: false,
      debug: false,
      wipe: false,
      phantomCacheEnabled: false
    },
    validValues = {
      task: ['performance'],
      format: ['detailed', 'simple'],
      output: ['json', 'csv', 'junit', 'post']
    },
    argsAlias = {
      t: 'task',
      f: 'format',
      o: 'output',
      h: 'help',
      v: 'version',
      ua: 'userAgent',
      u: 'uuid'
    },
    pageInstance = WebPage.create(),
    paintDetected = false;
onInitializedFired = false;

var speedgun = {

  run: function () {

    this.setupArgs();
    // validate
    this.validateArgs();

    if (speedGunArgs.help) {
      this.printHelp();
      phantom.exit();
    }

    speedgun.performancecache = this.clone(speedgun.performance);
    this.config = this.mergeConfig(speedGunArgs, speedGunArgs.configFile);
    var task = this[this.config.task];

    if(speedGunArgs.crawl){
      var WebPage = require('webpage'),
          linkgrabber = WebPage.create();
      var hostmatch = document.createElement('a');
      hostmatch.href = speedGunArgs.url;
      this.crawl(task,linkgrabber,hostmatch.hostname);
    }else{
      this.load(this.config, task, this);
    }


  },

  performance: {
    //this object serves as a bridge between the phantom global scope and the eval'd page.
    perfObj: {

      data: function (string) {

        var report = {};

        report.url = {label: 'URL', value: speedGunArgs.url, index: 32};

        report.screenshot = {label: 'Screenshot', value: '', index: 33};

        //HRT - High Resolution Time gives us floating point time stamps that can be accurate to microsecond resolution.
        //The now() method returns the time elapsed from when the navigationStart time in PerformanceTiming happened.
        report.now = {label: 'HRT now()', value: 0, index: 1};

        report.nowms = {label: 'Date.now()', value: 0, index: 2};

        //high level load times
        report.pageLoadTime = {label: 'Total time to load page. Measuring the time it took from the navigationStart to loadEventEnd events.', value: 0, index: 3};

        report.perceivedLoadTime = {label: 'User-perceived page load time. The amount of time it took the browser to load the page and execute JavaScript.', value: 0, index: 4};

        report.requestResponseTime = {label: 'Time spent making a request to the server and receiving the response - after network lookups and negotiations.', value: 0, index: 5};

        report.fetchTime = {label: 'Fetch start to response end. Total time spent in app cache, domain lookups, and making secure connection', value: 0, index: 7};

        report.pageProcessTime = {label: 'Total time spent processing the page.', value: 0, index: 8};

        report.domLoading = {value: 0, label: 'Return the time immediately before the user agent sets the current document readiness to \"loading\"', index: 30};

        report.domComplete = {value: 0, label: 'Return the time immediately before the user agent sets the current document readiness to \"complete\"', index: 23};

        report.loadEventStart = {value: 0, label: 'Return the time immediately before the load event of the current document is fired. It must return zero when the load event is not fired yet.', index: 25};

        report.loadEventEnd = {value: 0, label: 'Return the time when the load event of the current document is completed. It must return zero when the load event is not fired or is not completed.', index: 31};

        report.loadEventTime = {label: 'Total time spent during the load event.', value: 0, index: 9};

        report.domInteractive = {value: 0, label: 'Return the time immediately before the user agent sets the current document readiness to \"interactive\".', index: 17};

        report.connectStart = {value: 0, label: 'Return the time immediately before the user agent start establishing the connection to the server to retrieve the document. If a persistent connection [RFC 2616] is used or the current document is retrieved from relevant application caches or local resources, this attribute must return value of domainLookupEnd.', index: 11};

        report.connectEnd = {value: 0, label: 'Return the time immediately after the user agent finishes establishing the connection to the server to retrieve the current document. If a persistent connection [RFC 2616] is used or the current document is retrieved from relevant application caches or local resources, this attribute must return the value of domainLookupEnd', index: 28};

        report.connectTime = {label: 'Time spent during connect.', value: 0, index: 28};

        report.navigationStart = {value: 0, label: '', index: 12};

        report.secureConnectionStart = {value: 0, label: 'This attribute is optional. User agents that don\'t have this attribute available must set it as undefined. When this attribute is available, if the scheme of the current page is HTTPS, this attribute must return the time immediately before the user agent starts the handshake process to secure the current connection. If this attribute is available but HTTPS is not used, this attribute must return zero.', index: 13};

        report.fetchStart = {value: 0, label: 'If the new resource is to be fetched using HTTP GET or equivalent, fetchStart must return the time immediately before the user agent starts checking any relevant application caches. Otherwise, it must return the time when the user agent starts fetching the resource.', index: 14};

        report.domContentLoadedEventStart = {value: 0, label: 'This attribute must return the time immediately before the user agent fires the DOMContentLoaded event at the Document.', index: 15};

        report.domContentLoadedEventEnd = {value: 0, label: 'This attribute must return the time immediately after the document\'s DOMContentLoaded event completes.', index: 26};

        report.domContentTime = {label: 'Total time spent during DomContentLoading event', value: 0, index: 10};


        //      If the transport connection fails after a request is sent and the user agent reopens a connection and resend the request, requestStart should return the corresponding values of the new request.
        //      This interface does not include an attribute to represent the completion of sending the request, e.g., requestEnd.
        //      Completion of sending the request from the user agent does not always indicate the corresponding completion time in the network transport, which brings most of the benefit of having such an attribute.
        //      Some user agents have high cost to determine the actual completion time of sending the request due to the HTTP layer encapsulation.
        report.requestStart = {value: 0, label: 'This attribute must return the time immediately before the user agent starts requesting the current document from the server, or from relevant application caches or from local resources.', index: 20};

        report.responseStart = {value: 0, label: 'This attribute must return the time immediately after the user agent receives the first byte of the response from the server, or from relevant application caches or from local resources.', index: 16};

        report.responseEnd = {value: 0, label: 'This attribute must return the time immediately after the user agent receives the last byte of the current document or immediately before the transport connection is closed, whichever comes first. The document here can be received either from the server, relevant application caches or from local resources.', index: 29};

        report.responseTime = {label: 'Total time spent during response', value: 0, index: 34};

        report.domainLookupStart = {value: 0, label: 'This attribute must return the time immediately before the user agent starts the domain name lookup for the current document. If a persistent connection [RFC 2616] is used or the current document is retrieved from relevant application caches or local resources, this attribute must return the same value as fetchStart.', index: 24};

        report.domainLookupEnd = {value: 0, label: 'This attribute must return the time immediately after the user agent finishes the domain name lookup for the current document. If a persistent connection [RFC 2616] is used or the current document is retrieved from relevant application caches or local resources, this attribute must return the same value as fetchStart.', index: 18};

        //      In cases where the user agent already has the domain information in cache, domainLookupStart and domainLookupEnd represent the times when the user agent starts and ends the domain data retrieval from the cache.
        report.domainLookupTime = {label: 'Total time spent in domain lookup', value: 0, index: 35};

        report.redirectStart = {value: 0, label: 'If there are HTTP redirects or equivalent when navigating and if all the redirects or equivalent are from the same origin, this attribute must return the starting time of the fetch that initiates the redirect. Otherwise, this attribute must return zero.', index: 19};

        report.redirectEnd = {value: 0, label: 'If there are HTTP redirects or equivalent when navigating and all redirects and equivalents are from the same origin, this attribute must return the time immediately after receiving the last byte of the response of the last redirect. Otherwise, this attribute must return zero.', index: 27};

        //network level redirects
        report.redirectTime = {label: 'Time spent during redirect', value: 0, index: 6};

        report.unloadEventStart = {value: 0, label: 'If the previous document and the current document have the same origin [IETF RFC 6454], this attribute must return the time immediately before the user agent starts the unload event of the previous document. If there is no previous document or the previous document has a different origin than the current document, this attribute must return zero.', index: 22};

        //      If there are HTTP redirects or equivalent when navigating and not all the redirects or equivalent are from the same origin, both unloadEventStart and unloadEventEnd must return the zero.
        report.unloadEventEnd = {value: 0, label: 'If the previous document and the current document have the same same origin, this attribute must return the time immediately after the user agent finishes the unload event of the previous document. If there is no previous document or the previous document has a different origin than the current document or the unload is not yet completed, this attribute must return zero.', index: 21};

        //navigation timing
        report.timing = {value: 0, label: '', index: 36};

        //PhantomJS Error Detection
        report.errors = {value: [], label: '', index: 37};

        report.DOMContentLoaded = {value: 0, label: 'Old perf measurement', index: 40};

        report.startRender = {value: 0, label: '', index: 85};

        report.Load = {value: 0, label: 'Old perf measurement', index: 41};

        report.navEvents = {label: '', value: [], index: 56};

        if (string) {
          return JSON.stringify(report);
        } else {
          return report;
        }

      }

    },

    onRepaintRequested: function(page, time, x, y, width, height) {

      if(onInitializedFired && !paintDetected && !(width === 0 && height === 0)) {
        //page.render('firstPaint.png',{format: 'jpeg', quality: '50'});
        page.evaluate(function () {
          var startRender = Math.floor(performance.now());
          console.log(JSON.stringify({label: 'Start Render measured using PhantomJS\'s onRepaintRequested.', value: startRender, index: 85}));

        });
        paintDetected = true;
      };
    },

    onResourceTimeout: function (e) {
      console.log(e.errorCode);   // it'll probably be 408
      console.log(e.errorString); // it'll probably be 'Network timeout on resource'
      console.log(e.url);         // the url whose request timed out
      phantom.exit(1);
    },

    onLoadFinished: function (page, config) {
    },

    onLoadStarted: function (page, config) {
      console.log('###### onLoadStarted ' + page.url);
    },

    onNavigationRequested: function (page, config, url, type, willNavigate, main) {

      if (Object.keys(speedgun.reportData).length === 0) {
        //init report
        speedgun.reportData = speedgun.performance.perfObj.data(false);
      }

      var eventData = {};
      try {
        if (url !== undefined && type !== undefined && willNavigate !== undefined && main !== undefined) {

          eventData = {
            url: url,
            cause: type,
            willNavigate: willNavigate,
            mainFrame: main
          };

        }
      } catch (e) {
        console.log('Problem with event data:', e)
      }

      speedgun.reportData.navEvents.value.push(eventData);


    },

    onPageCreated: function (page, config) {
      //      console.log('###### onPageCreated ' + page.url);
    },

    onInitialized: function (page) {
      onInitializedFired = true;
      console.log('###### onInitialized ' + page.url);

      if (Object.keys(speedgun.reportData).length === 0) {
        //init report
        speedgun.reportData = speedgun.performance.perfObj.data(false);
      }

      page.evaluate(function (perfObj) {

        var nowms = Date.now();

        console.log(JSON.stringify({value: nowms, label: '', index: 2}));
        console.log(JSON.stringify({value: performance.now(), label: '', index: 1}));

        //--------------- Begin ways of old DOM perf with event Listeners

        //        The DOMContentLoaded event is fired when the document has been completely
        //        loaded and parsed, without waiting for stylesheets, images, and subframes
        //        to finish loading
        document.addEventListener("DOMContentLoaded", function () {
          console.log(JSON.stringify({value: (Date.now() - nowms), label: 'This is the measured with document.addEventListener(\"DOMContentLoaded\"... The DOMContentLoaded event is fired when the document has been completely loaded and parsed, without waiting for stylesheets, images, and subframes to finish loading', index: 40}));
        }, false);

        //detect a fully-loaded page
        window.addEventListener("load", function () {
          console.log(JSON.stringify({value: (Date.now() - nowms), label: 'Measured with the old window.addEventListener(\"load\" method... Detects the time it took to load the page.', index: 41}));
        }, false);

        //check for JS errors
        window.onerror = function (message, url, linenumber) {
          console.log('error:' + message + " on line " + linenumber + " for " + url);
        };


        //--------------- End DOM event Listeners
      });
    },

    onResourceRequested: function (page, config, request) {
      // var domain = 'www.rebeccataylor.com',
      //     targetDNS = 'a021.kellwoodrebeccataylor.inscname.net',
      //     match = requestData.url.match(/https?:\/\/www[.]rebeccataylor[.]com\//);
      //
      // if (match != null) {
      //   var cdnUrl = requestData.url.replace(domain, targetDNS);
      //   console.log('Rewriting request:', requestData.url, cdnUrl);
      //   networkRequest.changeUrl(cdnUrl);
      //   networkRequest.setHeader('Host', domain);
      // }
    },

    onResourceReceived: function (page, config, response) {
    }
  },

  reportData: {},

  crawl: function(task,linkgrabber,hostmatch){

    //open the page to initiate the crawl
    linkgrabber.open(this.config.url, function (status) {
      linkgrabber.evaluate(function (hostmatch) {
        var collection = document.getElementsByTagName('a'),
            currentValues = [],
            values = [].map.call(collection, function(obj) {
              if(currentValues.indexOf(obj.href) < 0){
                //match only on same domain. todo - make configurable
                if(hostmatch && (hostmatch.indexOf(obj.hostname) > -1)){
                  currentValues.push(obj.href);
                }
              }
            });
        //console is used as a channel for sending data out of
        //this evaluate to phantomJS parent context
        console.log(JSON.stringify(currentValues));
      },hostmatch);

    });

    var crawlablePages;

    linkgrabber.onConsoleMessage = function (msg) {
      if(msg && msg.indexOf('[') === 0){
        try {
          crawlablePages = JSON.parse(msg);
          console.log('***Crawling ' + crawlablePages.length + ' total pages.')
        } catch (e) {
          console.log('problem parsing links for crawler ',e)
        }
        if(crawlablePages.constructor === Array){
          go(crawlablePages)
        }
      }
    };

    var that = this,timeoutObj = {};
    function go(crawlablePages){

      function callback(){
        var page = crawlablePages.shift();
        console.log('### Running speedgun report for: ',page, crawlablePages.length + ' left to go...');
        doit(page,crawlablePages.length,callback)
      }

      function doit(url,index, callback){
        timeoutObj[index] = setTimeout(function(){
          console.log('url being loaded: ',url,index, ' at ', (index * 5), ' seconds');
          that.config.url = url;
          that.load(that.config, task, that,callback);
        },(5000))
      }
      callback();
    }
  },

  load: function (config, task, scope, callback) {

    var page = WebPage.create();
    page.settings.localToRemoteUrlAccessEnabled = true;
    page.settings.webSecurityEnabled = false;
    page.settings.resourceTimeout = 20000; // 20 seconds
    page.viewportSize = { width: 1280, height: 1024 };

    //    page.clearMemoryCache();

    if (config.userAgent && config.userAgent != "default") {
      if (config.userAgentAliases[config.userAgent]) {
        config.userAgent = config.userAgentAliases[config.userAgent];
      }
      page.settings.userAgent = config.userAgent;
    }

    function doPageLoad() {
      setTimeout(function () {
        page.open(config.url);
      }, config.cacheWait);
    }

    if (config.task == 'performancecache') {
      pagetemp.open(config.url, function (status) {
        if (status === 'success') {
          pagetemp.release();
          doPageLoad();
        }
      });
    } else {
      doPageLoad();
    }

    var allEvents =
        ['onInitialized',
          'onLoadStarted',
          'onLoadFinished',
          'onNavigationRequested',
          'onPageCreated',
          'onResourceRequested',
          'onResourceReceived',
          'onResourceTimeout',
          'onRepaintRequested'];

    allEvents.forEach(function (event) {
      if (task[event]) {
        page[event] = function () {

          var args = [page, config], a, aL;
          for (a = 0, aL = arguments.length; a < aL; a++) {
            args.push(arguments[a]);
          }
          task[event].apply(scope, args);
        };

      }
    });

    page.onConsoleMessage = function (msg) {

      var error = false,
          incoming = msg;

      //debug dump
      (speedGunArgs.debug ? console.log('console: ',msg) : null);

      if (msg.indexOf('error:') >= 0) {
        speedgun.reportData.errors.value.push(encodeURIComponent(msg.substring('error:'.length, msg.length)));
        error = true;
      }

      //if above conditions were not met, handle normal JSON.stringified message
      if (typeof incoming === 'string') {

        try {
          incoming = JSON.parse(incoming);

        } catch (e) {
          //if being logged with no format, assume error
          msg = msg.replace('\n', '');
          msg = msg.replace(',', '&#044;');
          incoming = speedgun.reportData.errors.value.push(encodeURIComponent(msg));
        }
      }

      for (var entry in speedgun.reportData) {
        if (speedgun.reportData[entry].index === incoming.index && !error) {
          speedgun.reportData[entry] = incoming;
        }
      }

    };

    page.onError = function (msg, trace) {
      trace.forEach(function (item) {
        speedgun.reportData.errors.value.push(encodeURIComponent(msg + ':' + item.file + ':' + item.line));
      })
    };

    var phantomExit = function () {
      if(callback){
        //in crawler mode.
        console.log('!!load new page!!');
        callback();
      }else{
        console.log('!!exit phantom!!', callback);
        phantom.exit(0);
      }
    };

    //hack to eliminate multiple calls to this method from other page.evaluate events.
    //todo - this is a bug in impl or phantom
    var onLoadStarted = 'invalid';
    if(task.onLoadStarted){
      page.onLoadStarted = function (status) {
        task.onLoadStarted.call(scope, page, config, status);
        if(onLoadStarted === 'invalid'){
          onLoadStarted = true;
        }

      }
    }

    if (task.onLoadFinished) {
      page.onLoadFinished = function (status) {
        task.onLoadFinished.call(scope, page, config, status);

        if (onLoadStarted) {
          onLoadStarted = false;

          waitFor(function () {
            // Check in the page if a specific element is now visible

            return page.evaluate(function () {
              return (window.performance.timing.loadEventEnd > 0);
            });
          }, function () {

            speedgun.reportData = page.evaluate(function (perfObj) {

              var report = JSON.parse(perfObj),
                  timing = performance.timing,
                  nav = performance.navigation,
                  navStart = timing.navigationStart;

              //--------------- Begin PhantomJS supported user timing and performance timing measurements

              //try to calculate understandable load numbers
              report.pageLoadTime.value = validateTimes(timing.loadEventEnd);
              report.perceivedLoadTime.value = validateTimes(report.nowms.value); //from https://developer.mozilla.org/en-US/docs/Navigation_timing
              report.requestResponseTime.value = validateTimes(timing.responseEnd, timing.requestStart);
              report.redirectTime.value = validateTimes(timing.redirectEnd, timing.redirectStart);
              report.fetchTime.value = validateTimes(timing.connectEnd, timing.fetchStart);
              report.pageProcessTime.value = validateTimes(timing.loadEventStart, timing.domLoading);
              report.loadEventTime.value = validateTimes(timing.loadEventEnd, timing.loadEventStart);
              report.domContentTime.value = validateTimes(timing.domContentLoadedEventEnd, timing.domContentLoadedEventStart);
              report.responseTime.value = validateTimes(timing.responseEnd, timing.responseStart);
              report.connectTime.value = validateTimes(timing.connectEnd, timing.connectStart);
              report.domainLookupTime.value = validateTimes(timing.domainLookupEnd, timing.domainLookupStart);

              //subtract the rest from navigationStart to see when the event was fired relative to browser load
              //1 offs
              report.navigationStart.value = validateTimes(timing.navigationStart);
              report.secureConnectionStart.value = validateTimes(timing.secureConnectionStart);
              report.domInteractive.value = validateTimes(timing.domInteractive);
              report.fetchStart.value = validateTimes(timing.fetchStart);
              report.requestStart.value = validateTimes(timing.requestStart);
              report.domLoading.value = validateTimes(timing.domLoading);
              report.domComplete.value = validateTimes(timing.domComplete);

              //start and end
              report.connectStart.value = validateTimes(timing.connectStart);
              report.connectEnd.value = validateTimes(timing.connectEnd);

              report.domContentLoadedEventStart.value = validateTimes(timing.domContentLoadedEventStart);
              report.domContentLoadedEventEnd.value = validateTimes(timing.domContentLoadedEventEnd);

              report.responseStart.value = validateTimes(timing.responseStart);
              report.responseEnd.value = validateTimes(timing.responseEnd);

              report.domainLookupStart.value = validateTimes(timing.domainLookupStart);
              report.domainLookupEnd.value = validateTimes(timing.domainLookupEnd);

              report.redirectStart.value = validateTimes(timing.redirectStart);
              report.redirectEnd.value = validateTimes(timing.redirectEnd);

              report.unloadEventStart.value = validateTimes(timing.unloadEventStart);
              report.unloadEventEnd.value = validateTimes(timing.unloadEventEnd);

              report.loadEventStart.value = validateTimes(timing.loadEventStart);
              report.loadEventEnd.value = validateTimes(timing.loadEventEnd);

              //sometimes, numbers are returned as negative when subtracting from navigationStart. This could possibly be a bug with PhantomJS
              function validateTimes(end, start) {
                if (!start) {
                  start = navStart;
                }
                var diffTime = end - start;
                return diffTime > 0 ? diffTime : 'na';
              }

              report.timing.value = nav.type;

              switch (report.timing.value) {
                case 0:
                  report.timing.label = ('Type_NavigateNext: Navigation started by clicking on a link, or entering the URL in the user agent\'s address bar, or form submission, or initializing through a script operation');
                  break;
                case 1:
                  report.timing.label = ('Type_Reload: Navigation through the reload operation or the location.reload() method.');
                  break;
                case 2:
                  report.timing.label = ('Type_Back_Forward: Navigation through a history traversal operation.');
                  break;
                case 255:
                  report.timing.label = ('Type_Undefined: Any navigation types not defined by values above.');
                  break;
                default:
                  report.timing.label = ('Not detected');
              }

              // for (var key in report) {
              //   //export/bridge data back to phantom context
              //   console.log(JSON.stringify(report[key]));
              // }
              return report;

            }, JSON.stringify(speedgun.reportData));

            //finish up any leftover tasks to complete the report
            printReport(speedgun.reportData, phantomExit);
          });


        }
      }


    } else {
      page.onLoadFinished = function (status) {
        phantomExit();
      };
    }

    function printReport(report, exitphantom) {

      //setup screenshot
      var reportLocation = speedgun.reportData.url.value.replace('://', '_').replace(":", "_") + '/speedgun';
      speedgun.reportData.screenshot.value = speedgun.reportData.nowms.value + '.png';
      page.viewportSize = { width: 1280, height: 1024 };

      if (!speedGunArgs.uuid && speedGunArgs.screenshot) {
        console.log('Rendering Screenshot to', 'reports/' + reportLocation + speedgun.reportData.screenshot.value);
        page.render('reports/' + reportLocation + speedgun.reportData.screenshot.value, {format: 'jpeg', quality: '50'});
      }

      if (speedGunArgs.output === 'csv') {
        console.log('filename', reportLocation);
        speedgun.printToFile(report, reportLocation, 'csv', speedGunArgs.wipe, exitphantom);
      }

      if (speedGunArgs.output === 'json') {
        speedgun.printToFile(report, reportLocation, 'json', speedGunArgs.wipe, exitphantom);
      }
  
      if (speedGunArgs.output === 'junit') {
        speedgun.printToFile(report, reportLocation, 'xml', true, exitphantom);
      }

      if (speedGunArgs.output === 'post') {
        var postImage = function () {
          var base64 = null;
          console.log('Rendering Screenshot to base64');
          base64 = page.renderBase64('JPEG', {format: 'jpeg', quality: '50'});
          speedgun.postIMAGE(base64, 'http://127.0.0.1:8080/rest/performance/imageData', exitphantom);
        };

        speedgun.postJSON(report, 'http://127.0.0.1:8080/rest/performance/reportData', postImage);
      }

    }

    /** Classic waitFor example from PhantomJS
     */
    function waitFor(testFx, onReady, timeOutMillis) {
      var maxtimeOutMillis = timeOutMillis ? timeOutMillis : 10000, //< Default Max Timout is 10s
          start = new Date().getTime(),
          condition = false,
          interval = setInterval(function () {
            if ((new Date().getTime() - start < maxtimeOutMillis) && !condition) {
              // If not time-out yet and condition not yet fulfilled
              condition = (typeof(testFx) === "string" ? eval(testFx) : testFx()); //< defensive code
            } else {
              if (!condition) {
                // If condition still not fulfilled (timeout but condition is 'false')
                console.log("'waitFor()' timeout");
                phantom.exit(1);
              } else {
                // Condition fulfilled (timeout and/or condition is 'true')
                typeof(onReady) === "string" ? eval(onReady) : onReady(); //< Do what it's supposed to do once the condition is fulfilled
                clearInterval(interval); //< Stop this interval
              }
            }
          }, 250); //< repeat check every 250ms
    }


  },

  mergeConfig: function (config, configFile) {
    var result = '', key;
    if (fs.exists(configFile)) {
      configFile = "config.json";
      result = JSON.parse(fs.read(configFile));
    } else {
      //some of the page.settings need to be brought here
      result = {
        "task": "performance",
        "userAgent": "chrome",
        "userAgentAliases": {
          "chrome": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/535.11 (KHTML, like Gecko) Chrome/17.0.963.12 Safari/535.11"
        },
        "wait": 0,
        "cacheWait": 200,
        "consolePrefix": "#",
        "verbose": false
      }
    }
    for (key in config) {
      result[key] = config[key];
    }

    return result;
  },

  pad: function (str, length) {
    var padded = str.toString();
    if (padded.length > length) {
      return this.pad(padded, length * 2);
    }
    return this.repeat(' ', length - padded.length) + padded;
  },

  repeat: function (chr, length) {
    for (var str = '', l = 0; l < length; l++) {
      str += chr;
    }
    return str;
  },

  clone: function (obj) {
    var target = {};
    for (var i in obj) {
      if (obj.hasOwnProperty(i)) {
        target[i] = obj[i];
      }
    }
    return target;
  },

  postJSON: function (report, endpoint, postImage) {

    var settings = {
      operation: "POST",
      encoding: "utf8",
      headers: {
        "Content-Type": "application/json"
      },
      data: {}
    };

    settings.data[speedGunArgs.uuid] = report;
    speedgun.postData(settings, endpoint, postImage);

  },

  postIMAGE: function (base64, endpoint, exitphantom) {

    var settings = {
      operation: "POST",
      encoding: "utf8",
      headers: {
        "Content-Type": "application/json"
      },
      data: {}
    };

    settings.data[speedGunArgs.uuid] = base64;
    speedgun.postData(settings, endpoint, exitphantom);
  },

  postData: function (settings, endpoint, exitphantom) {

    if (settings.data && Object.keys(settings.data).length > 0) {

      settings.data = JSON.stringify(settings.data);
      console.log('settings.data: ', getByteCount(settings.data), ' size in bytes');
      pageInstance.open(endpoint, settings, function (status) {
        console.log('attempting to POST: ' + settings.data.substring(0, 50));
        if (status !== 'success') {
          console.log('Unable to post!', status);
        } else {
          console.log('Post data success for:' + endpoint);
        }
        exitphantom();
      });


      pageInstance.onLoadStarted = function (status) {
        console.log('[debug] onLoadStarted postData:', status);
      };

      pageInstance.onLoadFinished = function (status) {
        setTimeout(function () {
          console.log('[debug] onLoadFinished postData: ', status);
        }, 1);
      };

      pageInstance.onConsoleMessage = function (msg, lineNum, sourceId) {
        console.log('[debug] postData CONSOLE: ' + msg + ' (from line #' + lineNum + ' in "' + sourceId + '")');
      };

    }
  },

  printToFile: function (report, filename, extension, createNew, exitphantom) {
    var f,
        myfile,
        keys = [],
        values = [];

    for (var key in report) {
      var value = report[key].value;
      if (typeof value === 'object') {
        for (var secondkey in value) {
          if (key === 'navEvents') {
            keys.push(key);
            values.push(value[secondkey].url);
          } else if (key.indexOf('resourceSingle') >= 0) {
            //only store for url
            if (value[secondkey].url) {
              keys.push(key);
              values.push(value[secondkey].url)
            }
          } else if (key.indexOf('error') >= 0) {
            keys.push(key);
            values.push(value[secondkey])
          }
        }
      } else {
        keys.push(key);
        values.push(value);
      }
    }

    // changed this, we will always output json/csv/etc right?
    if (speedGunArgs.wipe) {
      myfile = 'reports/' + filename + '.' + extension;
    } else {
      myfile = 'reports/' + filename + '-' + speedGunArgs.output + '.' + extension;
    }

    console.log('Writing report data to: ', myfile);

    if (!createNew && fs.exists(myfile)) {
      //file exists so append line
      try {
        switch (extension) {
          case 'json':
            var phantomLog = [];
            var tempLine = null;
            var json_content = fs.read(myfile);
            if (json_content != "") {
              tempLine = JSON.parse(json_content);
            }
            if (Object.prototype.toString.call(tempLine) === '[object Array]') {
              phantomLog = tempLine;
            }
            phantomLog.push(report);
            fs.remove(myfile);
            f = fs.open(myfile, "w");
            f.writeLine(JSON.stringify(phantomLog));
            f.close();
            break;
          case 'xml':
            console.log("cannot append report to xml file");
            break;
          default:
            f = fs.open(myfile, "a");
            f.writeLine(values);
            f.close();
            break;
        }
      } catch (e) {
        console.log("problem appending to file", e);
      }
    } else {
      if (fs.exists(myfile)) {
        fs.remove(myfile);
      }
      //write the headers and first line
      try {
        f = fs.open(myfile, "w");
        switch (extension) {
          case 'json':
            f.writeLine(JSON.stringify(report));
            break;
          case 'xml':
            f.writeLine(this.formatAsJUnit(keys, values));
            break;
          default:
            f.writeLine(keys);
            f.writeLine(values);
            break;
        }
        f.close();
      } catch (e) {
        console.log("problem writing to file", e);
      }
    }
    exitphantom();
  },

  /**
   * Format test results as JUnit XML for CI
   * @see: http://www.junit.org/
   * @param {Array} tests the arrays containing the test results from testResults.
   * @return {String} the results as JUnit XML text
   */
  formatAsJUnit: function (keys, values) {
    var junitable = ['url','startRender','DOMContentLoaded','Load','domComplete','domainLookupTime','loadEventStart','navigationStart','pageLoadTime','responseTime'];
    var i, n = 0, key, value, suite,
        junit = [],
        suites = [];

    for (i = 0; i < keys.length; i++) {
      key = keys[i];
      if (junitable.indexOf(key) === -1) {
        continue;
      }
      value = values[i];
      // open test suite w/ summary
      suite = '  <testsuite name="' + key + '" tests="1">\n';
      suite += '    <testcase name="' + key + '" time="' + value + '"/>\n';
      suite +='  </testsuite>';
      suites.push(suite);
      n++;
    }

    // xml
    junit.push('<?xml version="1.0" encoding="UTF-8" ?>');

    // open test suites wrapper
    junit.push('<testsuites>');

    // concat test cases
    junit = junit.concat(suites);

    // close test suites wrapper
    junit.push('</testsuites>');

    return junit.join('\n');
  },

  setupArgs: function () {

    // go through the args and create a better

    // lets skip the script name (1)
    for (i = 1; i < args.length; i += 1) {
      arg = args[i];

      // special handling for the URL
      if (arg.charAt(0) !== '-') {
        speedGunArgs['url'] = arg;
      }

      // lets remove the starting -
      arg = arg.replace(/^\-\-?/, '');

      if (speedGunArgs.hasOwnProperty(arg)) {
        i += 1;
        speedGunArgs[arg] = args[i];
      } else if (speedGunArgs.hasOwnProperty(argsAlias[arg])) {
        i += 1;
        speedGunArgs[argsAlias[arg]] = args[i];
      } else if (unaryArgs.hasOwnProperty(arg)) {
        speedGunArgs[arg] = true;
      } else if (unaryArgs.hasOwnProperty(argsAlias[arg])) {
        speedGunArgs[argsAlias[arg]] = true;
      }
    }

    // push the unararyArgs that dont exist
    Object.keys(unaryArgs).forEach(function (arg) {
      if (!speedGunArgs.hasOwnProperty(arg)) {
        speedGunArgs[arg] = false;
      }
    });

  },

  printHelp: function () {
    console.log('  Usage: phantomjs --config=core/pconfig.json core/speedgun.js [options] url');
    console.log('  Options:');
    console.log('    -h, --help               This help');
    console.log('    -t, --task               Choose task (' + validValues['task'].toString().replace(/,/g, '|') + ') [performance]');
    console.log('    -f, --format             How much information (' + validValues['format'].toString().replace(/,/g, '|') + ') [simple]');
    console.log('    -o, --output             Output format (' + validValues['output'].toString().replace(/,/g, '|') + ') [json]');
    console.log('    -ua, --userAgent         Set the user agent (chrome|android|iphone) [chrome]');
    console.log('    -v, --version            Not implemented yet');
    console.log('    -u, --uuid               only used for server side run in speedgun.io');
    console.log('    --verbose                Turn on verbose logging');
    console.log('    --crawl                  Crawl all links on the page');
    console.log('    --screenshot             Create a png of screen');
    console.log('    --wipe                   Wipe the file instead of appending to it on each report');
    console.log('    --phantomCacheEnabled    Enable PhantomJS cache');
    console.log('    --debug                  Debug output to terminal');
    // Lets not talk about the configFile for now
  },

  validateArgs: function () {
    var isFailing = false;
    var self = this;

    Object.keys(validValues).forEach(function (key) {
      if (validValues[key].indexOf(speedGunArgs[key]) < 0) {
        console.log('The ' + key + ' argument ' + speedGunArgs[key] + ' is not a valid value. Need to be one of ' + validValues[key]);
        self.printHelp();
        isFailing = true;
      }
    });

    if (speedGunArgs.url === undefined) {
      console.log('You must supply a URL');
      this.printHelp();
      isFailing = true;
    }

    if (isFailing) {
      phantom.exit();
    }
  }

};

function getByteCount( s )
{
  var count = 0, stringLength = s.length, i;
  s = String( s || "" );
  for( i = 0 ; i < stringLength ; i++ )
  {
    var partCount = encodeURI( s[i] ).split("%").length;
    count += partCount==1?1:partCount-1;
  }
  return count;
}

speedgun.run();
