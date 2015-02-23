//'use strict';


var host = '';
//host = 'http://localhost:8081';

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

    // Use the 'brown' theme - override default 'blue' theme

    $mdThemingProvider.theme('default')
      .primaryColor('brown')
      .accentColor('brown');

  })
  .controller('MainCtrl', ['$scope', 'api', '$routeParams', '$location', function ($scope, api, $routeParams, $location) {
//    $scope.url = 'localhost:8080';

    if($location.search().uuid){
      loadTheGun($location.search().uuid)
    }else {
      $scope.speedgun = [];
    }

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
      '<div class="desc">TODO... Resource that caused a navigation event</div>' +
      '<basicstats data="data" property="{{property}}"></basicstats>' +
      '</div>' +
      '</md-card>';

  } else if(tAttrs.detail && tAttrs.detail.indexOf('resourceSingle') >= 0){
    template = '<md-card class="cell {{property}} {{detail}} z-anim">' +
      '<div class="card ">' +
      '<div class="header">{{detail}}</div>' +
      '<div class="desc">{{data[0][uuid][property].label}}</div>' +
      '<resourcestats data="data" property="{{property}}"></resourcestats>' +
      '</div>' +
      '</md-card>';

  }else{
    template = '<md-card class="cell {{property}} {{detail}} z-anim">' +
      '<div class="card ">' +
      '<div class="header">{{property | deCamelCase}}</div>' +
      '<div class="desc">{{data[0][uuid][property].label}}</div>' +
      '<stats data="data" property="{{property}}" suffix="{{suffix}}"></stats>' +
      '</div>' +
      '</md-card>';
  }
  return template;
}


