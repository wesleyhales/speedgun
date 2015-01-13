#!/usr/bin/env phantomjs
var fs = require('fs'),
    WebPage = require('webpage'),
    system = require('system');
    args = system.args;

var speedgun = {

  run: function () {
    var cliConfig = {};
    speedgun.performancecache = this.clone(speedgun.performance);
    if (!this.processArgs(cliConfig, [
      {
        name: 'url',
        def: 'http://google.com',
        req: true,
        desc: 'the URL of the site to load test'
      },
      {
        name: 'task',
        def: 'performance',
        req: false,
        desc: 'the task to perform',
        oneof: ['performance', 'navigation', 'performance_old', 'performancecache', 'filmstrip']
      },
      {
        name: 'configFile',
        def: 'config.json',
        req: false,
        desc: 'a local configuration file of further speedgun settings'
      }
    ])) {
      return;
    }
    this.config = this.mergeConfig(cliConfig, cliConfig.configFile);
    var task = this[this.config.task];
    this.load(this.config, task, this);
  },

  performance: {
    //this object serves as a bridge between the phantom global scope and the eval'd page.
    perfObj: {

      data: function (string) {

        var report = {};

        report.url = {label: 'URL', value: args[1], index: 32};

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

        report.connectStart = {value: 0 , label: 'Return the time immediately before the user agent start establishing the connection to the server to retrieve the document. If a persistent connection [RFC 2616] is used or the current document is retrieved from relevant application caches or local resources, this attribute must return value of domainLookupEnd.', index: 11};

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

        report.Load = {value: 0, label: 'Old perf measurement', index: 41};

        report.resources = {label: '', value: {}, index: 51};

        report.resourceSingleSmallest = {label:'Smallest resource on the page in bytes.',value:'',index:52};

        report.resourceSingleLargest = {label:'Largest resource on the page in bytes.',value:'',index:53};

        report.resourceSingleFastest = {label:'Fastest downloaded resource.',value:'',index:54};

        report.resourceSingleSlowest = {label:'Slowest downloaded resource.',value:'',index:55};

        report.navEvents = {label:'',value:[],index:56};

        if(string){
          return JSON.stringify(report);
        }else{
          return report;
        }

      }

    },

    onLoadFinished: function (page, config) {


      var size = 0, key, resources = speedgun.reportData.resources.value,slowest, fastest, totalDuration = 0,
          largest, smallest, totalSize = 0,
          missingList = [],
          missingSize = false;

      for(var resource in resources){
        resource = resources[resource];

//        if (resources.hasOwnProperty(resource)) {
          if (!resource.times.start || !resource.times.end) {
            //if one of start or end times is undefined - don't calculate
            resource.times.start = resource.times.end = 0;
          }

          if (!slowest || resource.times.start !== 0 || resource.duration > slowest.duration) {
            slowest = resource;
          }
          if (!fastest || resource.times.start !== 0 || resource.duration < fastest.duration) {
            fastest = resource;
          }
          //console.log(totalDuration);
          totalDuration += resource.duration;


          if (resource.size) {
            if (!largest || resource.size > largest.size) {
              largest = resource;
            }
            if (!smallest || resource.size < smallest.size) {
              smallest = resource;
            }
            totalSize += resource.size;
          } else {
            resource.size = 0;
            missingSize = true;
            missingList.push(resource.url);
          }
//        }
      };

      speedgun.reportData.resourceSingleSmallest.value = smallest;
      speedgun.reportData.resourceSingleLargest.value = largest;
      speedgun.reportData.resourceSingleFastest.value = fastest;
      speedgun.reportData.resourceSingleSlowest.value = slowest;


      page.evaluate(function (perfObj) {

        var report = JSON.parse(perfObj),
            timing = performance.timing,
            nav = performance.navigation,
            navStart = timing.navigationStart;


        //--------------- Begin PhantomJS supported user timing and performance timing measurements

        //try to calculate understandable load numbers
        report.pageLoadTime.value = validateTimes(timing.loadEventEnd);
        report.perceivedLoadTime.value = validateTimes(report.nowms.value); //from https://developer.mozilla.org/en-US/docs/Navigation_timing
        report.requestResponseTime.value = validateTimes(timing.responseEnd,timing.requestStart);
        report.redirectTime.value = validateTimes(timing.redirectEnd,timing.redirectStart);
        report.fetchTime.value = validateTimes(timing.connectEnd,timing.fetchStart);
        report.pageProcessTime.value = validateTimes(timing.loadEventStart,timing.domLoading);
        report.loadEventTime.value = validateTimes(timing.loadEventEnd,timing.loadEventStart);
        report.domContentTime.value = validateTimes(timing.domContentLoadedEventEnd,timing.domContentLoadedEventStart);
        report.responseTime.value = validateTimes(timing.responseEnd,timing.responseStart);
        report.connectTime.value = validateTimes(timing.connectEnd,timing.connectStart);
        report.domainLookupTime.value = validateTimes(timing.domainLookupEnd,timing.domainLookupStart);

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
        function validateTimes(end,start){
          if(!start){
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

        for (var key in report) {
          //export/bridge data back to phantom context
          console.log(JSON.stringify(report[key]));
        }

      }, JSON.stringify(speedgun.reportData));

    },

    onLoadStarted: function (page, config) {
      console.log('###### onLoadStarted');
    },

    onNavigationRequested: function(page, config, url, type, willNavigate, main) {

      if(Object.keys(speedgun.reportData).length === 0){
        //init report
        speedgun.reportData = speedgun.performance.perfObj.data(false);
      }

      var eventData = {};
      try{
        if(url !== undefined && type !== undefined && willNavigate !== undefined && main !== undefined){

          eventData = {
            url: url,
            cause: type,
            willNavigate:willNavigate,
            mainFrame: main
          };

        }
      }catch(e){
        console.log('Problem with event data:',e)
      }

      speedgun.reportData.navEvents.value.push(eventData);


    },

    onPageCreated: function (page, config) {
      console.log('###### onPageCreated');
    },

    onInitialized: function (page) {
      console.log('###### onInitialized');

      if(Object.keys(speedgun.reportData).length === 0){
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
      var now = Date.now();
      speedgun.reportData.resources.value[request.id] = {
        id: request.id,
        url: request.url,
        request: request,
        responses: {},
        duration: '',
        times: {
          request: now
        }
      };

    },
    onResourceReceived: function (page, config, response) {
      var now = Date.now(),
          resource = speedgun.reportData.resources.value[response.id];

      resource.responses[response.stage] = response;

      if (!resource.times[response.stage]) {
        resource.times[response.stage] = now;
        resource.duration = now - resource.times.request;
      }

      if (response.bodySize) {
        resource.size = response.bodySize;
        response.headers.forEach(function (header) {
        });
      } else if (!resource.size) {
        response.headers.forEach(function (header) {
          if (header.name.toLowerCase() == 'content-length' && header.value != 0) {
            resource.size = parseInt(header.value);
          }
        });
      }
    }
  },

  reportData: {},

  performance_old: {
    resources: [],
    count1: 100,
    count2: 1,
    timer: 0,
    evalConsole: {},
    evalConsoleErrors: [],
    onInitialized: function (page, config) {
      var pageeval = page.evaluate(function (startTime) {

      }, this.performance_old.start);
    },
    onLoadStarted: function (page, config) {
      if (!this.performance_old.start) {
        this.performance_old.start = Date.now();
      }
    },
    onResourceRequested: function (page, config, request) {
      var now = Date.now();
      this.performance_old.resources[request.id] = {
        id: request.id,
        url: request.url,
        request: request,
        responses: {},
        duration: '',
        times: {
          request: now
        }
      };
      if (!this.performance_old.start || now < this.performance_old.start) {
        this.performance_old.start = now;
      }

    },
    onResourceReceived: function (page, config, response) {
      var now = Date.now(),
        resource = this.performance_old.resources[response.id];
      resource.responses[response.stage] = response;
      if (!resource.times[response.stage]) {
        resource.times[response.stage] = now;
        resource.duration = now - resource.times.request;
      }
      if (response.bodySize) {
        resource.size = response.bodySize;
        response.headers.forEach(function (header) {
        });
      } else if (!resource.size) {
        response.headers.forEach(function (header) {
          if (header.name.toLowerCase() == 'content-length' && header.value != 0) {
            resource.size = parseInt(header.value);
          }
        });
      }
    },
    onLoadFinished: function (page, config, status) {
      var start = this.performance_old.start,
        finish = Date.now(),
        resources = this.performance_old.resources,
        slowest, fastest, totalDuration = 0,
        largest, smallest, totalSize = 0,
        missingList = [],
        missingSize = false,
        elapsed = finish - start,
        now = new Date();

      resources.forEach(function (resource) {
        if (!resource.times.start) {
          resource.times.start = resource.times.end;
        }
        if (!slowest || resource.duration > slowest.duration) {
          slowest = resource;
        }
        if (!fastest || resource.duration < fastest.duration) {
          fastest = resource;
        }
        //console.log(totalDuration);
        totalDuration += resource.duration;

        if (resource.size) {
          if (!largest || resource.size > largest.size) {
            largest = resource;
          }
          if (!smallest || resource.size < smallest.size) {
            smallest = resource;
          }
          totalSize += resource.size;
        } else {
          resource.size = 0;
          missingSize = true;
          missingList.push(resource.url);
        }
      });

      if (config.verbose) {
        console.log('');
        this.emitConfig(config, '');
      }

      var report = {};
      report.url = args[1];
      report.phantomCacheEnabled = args.indexOf('yes') >= 0 ? 'yes' : 'no';
      report.taskName = config.task;
      var drsi = parseInt(this.performance_old.evalConsole.interactive);
      var drsl = parseInt(this.performance_old.evalConsole.loading);
      var wo = parseInt(this.performance_old.evalConsole.onload);
      // var drsc = parseInt(this.performance_old.evalConsole.complete);

      report.domReadystateLoading = isNaN(drsl) == false ? drsl : 0;
      report.domReadystateInteractive = isNaN(drsi) == false ? drsi : 0;
      // report.domReadystateComplete = isNaN(drsc) == false ? drsc : 0;
      report.windowOnload = isNaN(wo) == false ? wo : 0;

      report.elapsedLoadTime = elapsed;
      report.numberOfResources = resources.length - 1;
      report.totalResourcesTime = totalDuration;
      report.slowestResource = slowest.url;
      report.largestResource = largest.url;
      report.totalResourcesSize = (totalSize / 1000);
      report.nonReportingResources = missingList.length;
      report.timeStamp = now.getTime();
      report.date = now.getDate() + "/" + now.getMonth() + "/" + now.getFullYear();
      report.time = now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds();
      report.errors = this.performance_old.evalConsoleErrors;


      //console.log(JSON.stringify(report));
      console.log('Elapsed load time: ' + this.pad(elapsed, 6) + 'ms');


    }


  },

  filmstrip: {
    onInitialized: function (page, config) {
      this.screenshot(Date.now(), page);
    },
    onLoadStarted: function (page, config) {
      if (!this.performance_old.start) {
        this.performance_old.start = Date.now();
      }
      this.screenshot(Date.now(), page);
    },
    onResourceRequested: function (page, config, request) {
      this.screenshot(Date.now(), page);
    },
    onResourceReceived: function (page, config, response) {
      this.screenshot(Date.now(), page);
    },

    onLoadFinished: function (page, config, status) {
      this.screenshot(Date.now(), page);
    }
  },

  emitConfig: function (config, prefix) {
    console.log(prefix + 'Config:');
    for (key in config) {
      if (config[key].constructor === Object) {
        if (key === config.task) {
          console.log(prefix + ' ' + key + ':');
          for (key2 in config[key]) {
            console.log(prefix + '  ' + key2 + ': ' + config[key][key2]);
          }
        }
      } else {
        console.log(prefix + ' ' + key + ': ' + config[key]);
      }
    }
  },

  load: function (config, task, scope) {
    var page = WebPage.create(),
        pagetemp = WebPage.create(),
        event;

    if (config.userAgent && config.userAgent != "default") {
      if (config.userAgentAliases[config.userAgent]) {
        config.userAgent = config.userAgentAliases[config.userAgent];
      }
      page.settings.userAgent = config.userAgent;
    }
    ['onInitialized',
      'onLoadStarted',
      'onLoadFinished',
      'onNavigationRequested',
      'onPageCreated',
      'onResourceRequested',
      'onResourceReceived']
      .forEach(function (event) {
        if (task[event]) {
          page[event] = function () {
            var args = [page, config],
              a, aL;
            for (a = 0, aL = arguments.length; a < aL; a++) {
              args.push(arguments[a]);
            }
            task[event].apply(scope, args);
          };

        }
      });

    if (task.onLoadFinished) {
      page.onLoadFinished = function (status) {

        //need to timeout and wait for loadEventEnd
        setTimeout(function () {
          task.onLoadFinished.call(scope, page, config, status);
          speedgun.reportData.screenshot.value = speedgun.reportData.nowms.value + '.png';
          page.viewportSize = { width: 1024, height: 768 };
          var reportLocation = '';
           console.log(args[4]);
          if(!args[4]){
            //if not running on the server, create a special folder and render screenshot
            //TODO - move this down to printReport
            reportLocation = speedgun.reportData.url.value.replace('://','_').replace(":", "_") + '/';
            console.log('Rendering Screenshot to','reports/' + reportLocation + speedgun.reportData.screenshot.value)
            page.render('reports/' + reportLocation + speedgun.reportData.screenshot.value);
          }

          //grand finale for the report. need a better final method that cleans up and
          //decides which data to filter on.

          //simple filter for detailed reporting
          if(args.indexOf('detailed') <= 0){
            delete speedgun.reportData.resources;
          }

          //let printReport handle the exit due to post option
          printReport(speedgun.reportData);


        }, 1);
      };
    } else {
      page.onLoadFinished = function (status) {
        exit();
      };
    }

    function printReport(report) {

      var reportLocation = '/speedgun';
      if(!args[4]){
        reportLocation = speedgun.reportData.url.value.replace('://','_').replace(":", "_") + '/speedgun';
      }

      if (args.indexOf('csv') >= 0) {
        speedgun.printToFile(report, reportLocation, 'csv', args.indexOf('wipe') >= 0);
        exit();
      }

      if (args.indexOf('json') >= 0) {
        speedgun.printToFile(report, reportLocation, 'json', args.indexOf('wipe') >= 0);
        exit();
      }

      if (args.indexOf('junit') >= 0) {
        speedgun.printToFile(report, reportLocation, 'xml', args.indexOf('wipe') >= 0);
        exit();
      }

      if (args.indexOf('post') >= 0) {
        speedgun.postJSON(report, 'http://localhost:8082/rest/performance/reportData');
        setTimeout('phantom.exit(0)',1000);
      }

    }

    function exit() {
      phantom.exit(0);
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

    page.settings.localToRemoteUrlAccessEnabled = true;
    page.settings.webSecurityEnabled = false;

    page.onConsoleMessage = function (msg) {

      var error = false,
          incoming = msg;

      //debug dump
//      console.log('console',msg);

      if (msg.indexOf('error:') >= 0) {
        speedgun.reportData.errors.value.push(encodeURIComponent(msg.substring('error:'.length, msg.length)));
        error = true;
      }

      //if above conditions were not met, handle normal JSON.stringified message
      if (typeof incoming === 'string') {

        try{
          incoming = JSON.parse(incoming);
        }catch(e){
          //if being logged with no format, assume error
          msg = msg.replace('\n','');
          msg = msg.replace(',','&#044;')
          incoming = speedgun.reportData.errors.value.push(encodeURIComponent(msg));
        }
      }

      for (var entry in speedgun.reportData) {
        if(speedgun.reportData[entry].index === incoming.index && !error){
          speedgun.reportData[entry] = incoming;
        }
      }

    };

    page.onError = function (msg, trace) {
      trace.forEach(function (item) {
        speedgun.reportData.errors.value.push(encodeURIComponent(msg + ':' + item.file + ':' + item.line));
      })
    };

  },

  processArgs: function (config, contract) {
    var a = 1;
    var ok = true;

    contract.forEach(function (argument) {
      if (a < args.length) {
        config[argument.name] = args[a];
      } else {
        if (argument.req) {
          console.log('"' + argument.name + '" argument is required. This ' + argument.desc + '.');
          ok = false;
        } else {
          config[argument.name] = argument.def;
        }
      }
      if (argument.oneof && argument.oneof.indexOf(config[argument.name]) == -1) {
        console.log('"' + argument.name + '" argument must be one of: ' + argument.oneof.join(', '));
        ok = false;
      }
      a++;
    });
    return ok;
  },

  mergeConfig: function (config, configFile) {
    var result = '', key;
    if (fs.exists(configFile)) {
      configFile = "config.json";
      result = JSON.parse(fs.read(configFile));
    } else {
      //need to hard code default config file if installed as global module... better way? we don't need a lot of this.
      result = {
        "task": "performance",
        "userAgent": "chrome",
        "userAgentAliases": {
          "iphone": "Mozilla/5.0 (iPhone; U; CPU iPhone OS 4_0 like Mac OS X; en-us) AppleWebKit/532.9 (KHTML, like Gecko) Version/4.0.5 Mobile/8A293 Safari/6531.22.7",
          "android": "Mozilla/5.0 (Linux; U; Android 2.2; en-us; Nexus One Build/FRF91) AppleWebKit/533.1 (KHTML, like Gecko) Version/4.0 Mobile Safari/533.1",
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

  truncate: function (str, length) {
    length = length || 80;
    if (str.length <= length) {
      return str;
    }
    var half = length / 2;
    return str.substr(0, half - 2) + '...' + str.substr(str.length - half + 1);
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

  timerStart: function () {
    return Date.now();
  },

  timerEnd: function (start) {
    return (Date.now() - start);
  },

  screenshot: function (now, page) {
    var start = this.timerStart();
    var currentTime = now - this.performance_old.start;
    var ths = this;
    if ((currentTime) >= this.performance_old.count1) {
      page.render('filmstrip/screenshot' + this.performance_old.timer + '.png');
      this.performance_old.count2++;
      this.performance_old.count1 = currentTime + (this.performance_old.count2 * 100);
      //subtract the time it took to render this image
      this.performance_old.timer = this.timerEnd(start) - this.performance_old.count1;
    }
  },

  /**
   * Format test results as JUnit XML for CI
   * @see: http://www.junit.org/
   * @param {Array} tests the arrays containing the test results from testResults.
   * @return {String} the results as JUnit XML text
   */
  formatAsJUnit: function (keys, values) {
    var junitable = ['domReadystateLoading', 'domReadystateInteractive', 'windowOnload', 'elapsedLoadTime', 'numberOfResources', 'totalResourcesTime', 'totalResourcesSize', 'nonReportingResources'];
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
      suite += '  </testsuite>';
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

  postJSON: function(report,endpoint){
    console.log('postJSON----')
    var reportEndpoint = WebPage.create();
    var settings = {
      operation: "POST",
      encoding: "utf8",
      headers: {
        "Content-Type": "application/json"
      },
      data: JSON.stringify(report)
    };

    reportEndpoint.open(endpoint, settings, function(status) {
      console.log('open----')
      if (status !== 'success') {
        console.log('Unable to post!');
      } else {
        console.log(page.plainText);
      }
      phantom.exit();

    });

    reportEndpoint.onLoadFinished = function (status) {

      setTimeout(function () {
        console.log('**********onLoadFinished: ' + status);

      }, 1);
    };

    reportEndpoint.onConsoleMessage = function(msg, lineNum, sourceId) {
      console.log('CONSOLE: ' + msg + ' (from line #' + lineNum + ' in "' + sourceId + '")');
    };
  },

  printToFile: function (report, filename, extension, createNew) {
    var f,
        myfile,
        keys = [],
        values = [];

    for (var key in report) {
        var value = report[key].value;
        if(typeof value === 'object'){
          for (var secondkey in value) {
            if(key === 'navEvents'){
              keys.push(key);
              values.push(value[secondkey].url);
            }else if(key.indexOf('resourceSingle') >= 0){
              //only store for url
              if(value[secondkey].url){
                keys.push(key);
                values.push(value[secondkey].url)
              }
            }else if(key.indexOf('error') >= 0){
                keys.push(key);
                values.push(value[secondkey])
            }
          }
        }else{
          keys.push(key);
          values.push(value);
        }
      }

    if (args[4] && args.indexOf('wipe') < 0) {
      myfile = 'reports/' + filename + '-' + args[4] + '.' + extension;
    } else {
      myfile = 'reports/' + filename + '.' + extension;
    }

    console.log('Writing report data to: ',myfile);

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
  }

};

speedgun.run();
