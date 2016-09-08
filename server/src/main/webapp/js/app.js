//'use strict';


var host = '';


angular.module('app', [
  'ngMaterial',
  'ngRoute'
]).service('api', ['$q', '$http', '$timeout', function ($q, $http, $timeout) {
  var numReports = 5, retryDelay = 2500;
  this.go = function(url, email, cached){
    //http://localhost:8081/rest/performance/go?url=http%3A%2F%2Fgoogle.com&cached=false&email=
    //console.log('go',url, email, cached)
    var config = {
      params : {
        url : url,
        cached : !!cached,
        email : email || ''
      }
    };
    return $http.get(host + '/rest/performance/go', config);
    //return $q.when(mockinit);
  };
  this.imageData = function(uuid){
    var base64url = host + '/rest/performance/checkimage';
    var config = {
      params : {
        uuid : uuid
      }
    };
    return $http.get(base64url, config);
  };
  this.getNodes = function(){
    var nodeList = 'http://speedgun.io/rest/beacon/getlist';
    return $http.get(nodeList);
  };
  this.get = function (uuid) {
//        if (!uuid) return $q.when(speedgun);
//      http://127.0.0.1:8080/rest/performance/checkimage?uuid=586930c7-5cc3-46a5-9802-fbd36ff05c1a
    var url = host + '/rest/performance/report';
    
    var config = {
      params : {
        uuid : uuid
      }
    };
    
    var deferred = $q.defer();
    var data = [];
    
    var loop = function (){
      var request = $http.get(url, config);
      var retryLoop = $timeout(loop, retryDelay);
      
      request.then(function(res){
        
        data = res.data instanceof Array ? res.data : [res.data];
        
        if (data.length >= numReports){
          $timeout.cancel(retryLoop);
          return deferred.resolve(data);
        }
        
        deferred.notify(data);
        
      },function(err){
        console.log('err', err);
        $timeout.cancel(retryLoop);
        return;
      });
      
    };
    
    loop();
    
    return deferred.promise;
  };
}])
  .config(function($mdThemingProvider) {
    
    $mdThemingProvider.theme('default')
      .primaryColor('red')
      .accentColor('red');
    
  })
  .controller('MainCtrl', ['$scope', 'api', '$routeParams', '$location', function ($scope, api, $routeParams, $location) {
    
    if($location.search().uuid){
      loadTheGun($location.search().uuid)
    }else {
      $scope.speedgun = [];
    }
    
    $scope.runCount = 0;
    
    function animate() {
      var cells = document.querySelectorAll('.cell');
      Array.prototype.forEach.call(cells, function(cell){cell.childNodes[0].classList.remove('transparent')});
      Array.prototype.forEach.call(cells, function(cell){cell.classList.remove('z-0')});
      setTimeout(function(){
        Array.prototype.forEach.call(cells, function(cell){cell.childNodes[0].classList.remove('transparent')});
      },1500);
    };
    
    function loadTheGun(uuid){
      $scope.uuid = uuid;
      $scope.screenshots = [{'2':'1'}];
//      animate();
      var done = function(data){
        $scope.running = false;
        $scope.speedgun = data;
      };
      var error = function(err){
        $scope.running = false;
        console.log('error');
        console.log(err);
      };
      var progress = function(data){
        $scope.running = true;
        console.log('progress',data);
        $scope.speedgun = data;
        
        api.imageData(uuid).then(function(initResponse){
          $scope.screenshots = initResponse;
        });
      };
      
      api.get(uuid).then(done, error, progress);
      
    }
    
    
    $scope.clear = function(){
      $location.search('uuid','');
      $scope.running = false;
      $scope.speedgun = [];
    };
    
    
    api.getNodes().then(function(response){
      var tempNodes = response.data;
      console.log(tempNodes);
      $scope.nodeList = [];
      for(key in tempNodes){
        $scope.nodeList.push({'label':key,'value':key})
      }
    });
    
    $scope.selectedNode = '';
    
    $scope.$watch('selectedNode', function(node) {
      if(node === null || node === ''){
        host = '';
      }else{
        host = 'http://' + node + ':8081';
      }
      
      
      
    });
    
    $scope.xgo = function(url, email, cached){
      
      $scope.running = url;
      
      if(url.indexOf('http://') === -1 && url.indexOf('https://') === -1){
        url = 'http://' + url;
      }
      api.go(url, email, cached).then(function(initResponse){
        var uuid = initResponse.data.uuid;
        $location.search('uuid',uuid);
        
        $scope.uuid = uuid;
        $scope.position = initResponse.data.position;
        
        loadTheGun(uuid);
      })
    }
  }])
  .filter('deCamelCase', function() {
    return function(input) {
      return input.replace(/^([a-z])/, function(m, $1){return $1.toUpperCase()})
        .replace(/([a-z])([A-Z])/g, function(m,$1,$2){ return $1 + ' ' + $2});
    };
  })
  .filter('decode', function() {
    return function(input) {
      return decodeURIComponent(input);
    };
  })
  .directive('card',['$location',function($location){
    return {
      restrict: 'E',
      scope: {
        data: '=',
        property: '@',
        prefix: '@',
        suffix: '@',
        detail: '@'
      },
      link: function ($scope) {
        $scope.$watch('data', function() {
          $scope.uuid = $location.search().uuid;
        });
      },
      //using a quick fix to conditionally apply templates
      template:resolveCardTemplate
      
    };
  }])
  .directive('stats',['$location',function($location){
    return {
      restrict: 'E',
      scope: {
        data: '=',
        property: '@',
        prefix: '@',
        suffix: '@'
      },
      link: function ($scope, element) {
        var statNodes = element.children().children();
        
        $scope.$watch('data', function(){
          if($scope.data) {
            $scope.uuid = $location.search().uuid;
            var stats = $scope.data.map(function (run, i) {
              var itemFromRunArray = run[$scope.uuid][$scope.property];
              if (itemFromRunArray) {
                return {value: itemFromRunArray.value, index: i};
              }
              
            });
            
            stats.sort(function (a, b) {
              return a.value > b.value ? 1 : a.value < b.value ? -1 : 0
            });
            
            var best;
            
            if (stats.length > 1) {
              //best and worst are always at the min and max indices because of sort above.
              if (stats[0] !== undefined) {
                best = stats[0].value;
                // if less than half the values are "best" values, mark them, otherwise leave them naked.
                if (stats.filter(function (stat) {
                    return stat.value === best
                  }).length < (stats.length / 2)) {
                  stats.forEach(function (stat) {
                    if (stat.value === best) {
                      if ($scope.currentBest) $scope.currentBest.classList.remove('best');
                      $scope.currentBest = statNodes[stat.index];
                      $scope.currentBest.classList.add('best');
                    }
                  });
                }
              }
              
              if (stats[2] !== undefined && stats.length === 5) {
                
                var median = stats[2].value;
//                console.log('data',$scope.data, 'median', median);
                stats.forEach(function (stat) {
                  if (stat.value === median) {
                    if ($scope.currentMedian) $scope.currentMedian.classList.remove('median');
                    $scope.currentMedian = statNodes[stat.index];
                    $scope.currentMedian.classList.add('median');
                  }
                })
              }
              
              if (stats[4] !== undefined) {
                var worst = stats[4].value;
                if (best !== worst) {
                  if (stats.filter(function (stat) {
                      return stat.value === worst
                    }).length < (stats.length / 2)) {
                    stats.forEach(function (stat) {
                      if (stat.value === worst) {
                        if ($scope.currentWorst) $scope.currentWorst.classList.remove('worst');
                        $scope.currentWorst = statNodes[stat.index];
                        $scope.currentWorst.classList.add('worst');
                      }
                    });
                  }
                }
              }
            }
          }
        })
      },
      template:
      '<div layout="row">' +
      '<div flex class="stat z-anim" layout=column layout-align="center center"><div><span class="prefix">{{prefix}}</span>{{data[0][uuid][property].value}}<span class="suffix">{{data[0][uuid][property].value === "na" ? "" : suffix}}</span></div></div>' +
      '<div flex class="stat z-anim" layout=column layout-align="center center"><div><span class="prefix">{{prefix}}</span>{{data[1][uuid][property].value}}<span class="suffix">{{data[1][uuid][property].value === "na" ? "" : suffix}}</span></div></div>' +
      '<div flex class="stat z-anim" layout=column layout-align="center center"><div><span class="prefix">{{prefix}}</span>{{data[2][uuid][property].value}}<span class="suffix">{{data[2][uuid][property].value === "na" ? "" : suffix}}</span></div></div>' +
      '<div flex class="stat z-anim" layout=column layout-align="center center"><div><span class="prefix">{{prefix}}</span>{{data[3][uuid][property].value}}<span class="suffix">{{data[3][uuid][property].value === "na" ? "" : suffix}}</span></div></div>' +
      '<div flex class="stat z-anim" layout=column layout-align="center center"><div><span class="prefix">{{prefix}}</span>{{data[4][uuid][property].value}}<span class="suffix">{{data[4][uuid][property].value === "na" ? "" : suffix}}</span></div></div>' +
      '</div>'
    };
  }])
  .directive('errorstats',['$location',function($location){
    return {
      restrict: 'E',
      scope: {
        data: '=',
        property: '@'
      },
      link : function($scope,element){
        $scope.$watch('data', function() {
          $scope.uuid = $location.search().uuid;
        });
      },
      template:
      '<div layout="column">' +
      '<div flex class="z-anim word-break" layout="row" layout-align="left center"><div>{{data[0][uuid][property].value | decode}}</div></div>' +
      '</div>'
    };
  }])
  .directive('basicstats',['$location',function($location){
    return {
      restrict: 'E',
      scope: {
        data: '=',
        property: '@'
      },
      link : function($scope,element){
        $scope.$watch('data', function() {
          $scope.uuid = $location.search().uuid;
        });
      },
      template:
      '<div layout="column">' +
      '<div flex class="z-anim"  layout-align="left"><ul layout="column" ng-repeat="key in data[0][uuid][property].value" class="navEventList"><li class="word-break">URL: {{key.url}}</li><li>Cause: {{key.cause}}</li><li>Source is Main Frame? {{key.mainFrame}}</li><li>Will Navigate? {{key.willNavigate}}</li></ul></div>' +
      '</div>'
    };
  }])
  .directive('resourcestats',['$location',function($location){
    return {
      restrict: 'E',
      scope: {
        data: '=',
        property: '@'
      },
      link : function($scope,element){
        $scope.$watch('data', function() {
          $scope.uuid = $location.search().uuid;
        });
      },
      template:
      '<div layout="column">' +
      '<div flex class="z-anim word-break" layout="row" layout-align="left"><div><a href="{{data[0][uuid][property].value.url}}">{{data[0][uuid][property].value.url}}</a></div></div>' +
      '<ul class="navEventList">' +
      '<li class="word-break">{{data[0][uuid][property].value.size}} bytes</li>' +
      '<li class="word-break">Time: {{data[0][uuid][property].value.times.end - data[0][uuid][property].value.times.request > 0 ? data[0][uuid][property].value.times.end - data[0][uuid][property].value.times.request : 0}}ms</li>' +
      '</ul>' +
      '</div>'
    };
  }])

function resolveCardTemplate(tElement, tAttrs) {
  var template = '';
  if(tAttrs.detail === 'errors') {
    template = '<md-card class="cell {{property}} {{detail}} z-anim">' +
      '<div class="card ">' +
      '<div class="header">{{detail}}</div>' +
      '<div class="desc">Errors that occured in the browser during page load.</div>' +
      '<errorstats data="data" property="{{property}}"></errorstats>' +
      '</div>' +
      '</md-card>';
  } else if(tAttrs.detail === 'navEvents'){
    template = '<md-card class="cell {{property}} {{detail}} z-anim">' +
      '<div class="card ">' +
      '<div class="header">{{detail}}</div>' +
      '<div class="desc">Resource that caused a navigation event</div>' +
      '<basicstats data="data" property="{{property}}"></basicstats>' +
      '</div>' +
      '</md-card>';
    
  } else if(tAttrs.detail && tAttrs.detail.indexOf('resourceSingle') >= 0){
    template = '<md-card class="cell {{property}} {{detail}} z-anim">' +
      '<div class="card ">' +
      '<div class="header">{{detail}}</div>' +
      '<div class="desc">{{propertyLabels[data[0][uuid][property]]}}</div>' +
      '<resourcestats data="data" property="{{property}}"></resourcestats>' +
      '</div>' +
      '</md-card>';
    
  }else{
    template = '<md-card class="cell {{property}} {{detail}} z-anim">' +
      '<div class="card ">' +
      '<div class="header">{{property | deCamelCase}}</div>' +
      '<div class="desc">{{propertyLabels[data[0][uuid][property]]}}</div>' +
      '<stats data="data" property="{{property}}" suffix="{{suffix}}"></stats>' +
      '</div>' +
      '</md-card>';
  }
  
  propertyLabels = {
    pageLoadTime: 'Total time to load page. Measuring the time it took from the navigationStart to loadEventEnd events.',
    perceivedLoadTime: 'User-perceived page load time. The amount of time it took the browser to load the page and execute JavaScript.',
    requestResponseTime: 'Time spent making a request to the server and receiving the response - after network lookups and negotiations.',
    fetchTime: 'Fetch start to response end. Total time spent in app cache, domain lookups, and making secure connection',
    pageProcessTime: 'Total time spent processing the page.',
    domLoading: 'Return the time immediately before the user agent sets the current document readiness to \"loading\"',
    domComplete: 'Return the time immediately before the user agent sets the current document readiness to \"complete\"',
    loadEventStart: 'Return the time immediately before the load event of the current document is fired. It must return zero when the load event is not fired yet.',
    loadEventEnd: 'Return the time when the load event of the current document is completed. It must return zero when the load event is not fired or is not completed.',
    loadEventTime: 'Total time spent during the load event.',
    domInteractive: 'Return the time immediately before the user agent sets the current document readiness to \"interactive\".',
    connectStart: 'Return the time immediately before the user agent start establishing the connection to the server to retrieve the document. If a persistent connection [RFC 2616] is used or the current document is retrieved from relevant application caches or local resources, this attribute must return value of domainLookupEnd.',
    connectEnd: 'Return the time immediately after the user agent finishes establishing the connection to the server to retrieve the current document. If a persistent connection [RFC 2616] is used or the current document is retrieved from relevant application caches or local resources, this attribute must return the value of domainLookupEnd',
    connectTime: 'Time spent during connect.',
    secureConnectionStart: 'This attribute is optional. User agents that don\'t have this attribute available must set it as undefined. When this attribute is available, if the scheme of the current page is HTTPS, this attribute must return the time immediately before the user agent starts the handshake process to secure the current connection. If this attribute is available but HTTPS is not used, this attribute must return zero.',
    fetchStart: 'If the new resource is to be fetched using HTTP GET or equivalent, fetchStart must return the time immediately before the user agent starts checking any relevant application caches. Otherwise, it must return the time when the user agent starts fetching the resource.',
    domContentLoadedEventStart: 'This attribute must return the time immediately before the user agent fires the DOMContentLoaded event at the Document.',
    domContentLoadedEventEnd: 'This attribute must return the time immediately after the document\'s DOMContentLoaded event completes.',
    domContentTime: 'Total time spent during DomContentLoading event',
    requestStart: 'This attribute must return the time immediately before the user agent starts requesting the current document from the server, or from relevant application caches or from local resources.',
    responseStart: 'This attribute must return the time immediately after the user agent receives the first byte of the response from the server, or from relevant application caches or from local resources.',
    responseEnd: 'This attribute must return the time immediately after the user agent receives the last byte of the current document or immediately before the transport connection is closed, whichever comes first. The document here can be received either from the server, relevant application caches or from local resources.',
    responseTime: 'Total time spent during response',
    domainLookupStart: 'This attribute must return the time immediately before the user agent starts the domain name lookup for the current document. If a persistent connection [RFC 2616] is used or the current document is retrieved from relevant application caches or local resources, this attribute must return the same value as fetchStart.',
    domainLookupEnd: 'This attribute must return the time immediately after the user agent finishes the domain name lookup for the current document. If a persistent connection [RFC 2616] is used or the current document is retrieved from relevant application caches or local resources, this attribute must return the same value as fetchStart.',
    domainLookupTime: 'Total time spent in domain lookup',
    redirectStart: 'If there are HTTP redirects or equivalent when navigating and if all the redirects or equivalent are from the same origin, this attribute must return the starting time of the fetch that initiates the redirect. Otherwise, this attribute must return zero.',
    redirectEnd: 'If there are HTTP redirects or equivalent when navigating and all redirects and equivalents are from the same origin, this attribute must return the time immediately after receiving the last byte of the response of the last redirect. Otherwise, this attribute must return zero.',
    redirectTime: 'Time spent during redirect',
    unloadEventStart: 'If the previous document and the current document have the same origin [IETF RFC 6454], this attribute must return the time immediately before the user agent starts the unload event of the previous document. If there is no previous document or the previous document has a different origin than the current document, this attribute must return zero.',
    unloadEventEnd: 'If the previous document and the current document have the same same origin, this attribute must return the time immediately after the user agent finishes the unload event of the previous document. If there is no previous document or the previous document has a different origin than the current document or the unload is not yet completed, this attribute must return zero.',
    DOMContentLoaded: 'Old perf measurement',
    Load: 'Old perf measurement'
  };
  return template;
}


