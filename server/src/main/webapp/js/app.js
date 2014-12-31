//'use strict';


var host = '';
//host = 'http://localhost:8081';

angular.module('app', [
  'ngMaterial',
  'ngRoute'
])
  /*.config([
   '$routeProvider',
   '$locationProvider', function ($routeProvider,
   $locationProvider) {
   $routeProvider
   .when('/uuid/:uuid', {templateUrl: 'index2.html'})
   .otherwise({redirectTo: '/'});

   $locationProvider
   .html5Mode(false);

   }])*/.service('api', ['$q', '$http', '$timeout', function ($q, $http, $timeout) {
      var numReports = 5, retryDelay = 1500;
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
      this.get = function (uuid) {
        //http://localhost:8081/rest/performance/report?uuid=a31d2f1c-b6d2-426f-b48b-7df5d201bc9f
//        if (!uuid) return $q.when(speedgun);
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

          request.then(function(res){

//            if (res.data.status === 'pending') return

            console.log('res.data',res.data);

            data = res.data instanceof Array ? res.data : [res.data];

            if (data.length >= numReports) return deferred.resolve(data);

            deferred.notify(data);

          },function(err){
            console.log('err', err);
          });

          request.finally(function(){
            console.log('finally',data.length);
            if (data.length < numReports) $timeout(loop, retryDelay);
          });
        };

        loop();

        return deferred.promise;
      };
    }])
    .controller('MainCtrl', ['$scope', 'api', '$routeParams', '$location', function ($scope, api, $routeParams, $location) {
//    $scope.url = 'localhost:8080';

      if($location.search().uuid){
        loadTheGun($location.search().uuid)
      }else {
        $scope.speedgun = [];
      }

      function loadTheGun(uuid){
        $scope.uuid = uuid;
        var done = function(data){
          $scope.speedgun = data;
        };
        var error = function(err){
          console.log('error');
          console.log(err);
        };
        var progress = function(data){
          console.log('progress',data)
          $scope.speedgun = data;
        };
        api.get(uuid).then(done, error, progress);
      }



      var animate = function () {
        var cells = document.querySelectorAll('.cell');
        Array.prototype.forEach.call(cells, function(cell){cell.childNodes[0].classList.remove('transparent')});
        Array.prototype.forEach.call(cells, function(cell){cell.classList.remove('z-0')});
        setTimeout(function(){
          Array.prototype.forEach.call(cells, function(cell){cell.childNodes[0].classList.remove('transparent')});
        },200);
      };


      $scope.xgo = function(url, email, cached){
        animate();
        api.go(url, email, cached).then(function(initResponse){
          var uuid = initResponse.data.uuid;
          $location.search('uuid',uuid);

//          console.log('initResponse',initResponse);

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
    .directive('card',[function(){
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

        },
        template:
            '<md-card class="cell {{property}} {{detail}} z-anim z-0">' +
            '<div class="card ">' +
            '<div class="header">{{property | deCamelCase}}</div>' +
            '<div class="desc">{{data[0][property].label}}</div>' +
            '<stats data="data" property="{{property}}" suffix="{{suffix}}"></stats>' +
            '</div>' +
            '</md-card>'
      };
    }])
    .directive('stats',[function(){
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

            var stats = $scope.data.map(function(run, i){
              var itemFromRunArray = run[$scope.property];
              if(itemFromRunArray){
                return {value : itemFromRunArray.value, index: i};
              }

            });

            stats.sort(function(a,b){return a.value > b.value ? 1 : a.value < b.value ? -1 : 0});

            var best;

            if(stats.length > 1){
              //best and worst are always at the min and max indices because of sort above.
              if (stats[0] !== undefined) {
                best = stats[0].value;
                // if less than half the values are "best" values, mark them, otherwise leave them naked.
                if (stats.filter(function(stat){return stat.value === best}).length < (stats.length / 2)) {
                  stats.forEach(function(stat){
                    if (stat.value === best){
                      if($scope.currentBest) $scope.currentBest.classList.remove('best');
                      $scope.currentBest = statNodes[stat.index];
                      $scope.currentBest.classList.add('best');
                    }
                  });
                }
              }

              if (stats[2] !== undefined && stats.length === 5) {

                var median = stats[2].value;
                console.log('data',$scope.data, 'median', median);
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
                  if (stats.filter(function(stat){return stat.value === worst}).length < (stats.length / 2)) {
                    stats.forEach(function (stat) {
                      if (stat.value === worst){
                        if($scope.currentWorst) $scope.currentWorst.classList.remove('worst');
                        $scope.currentWorst = statNodes[stat.index];
                        $scope.currentWorst.classList.add('worst');
                      }
                    });
                  }
                }
              }
            }
          })
        },
        template:
            '<div layout="row">' +
            '<div flex class="stat z-anim" layout=column layout-align="center center"><div><span class="prefix">{{prefix}}</span>{{data[0][property].value}}<span class="suffix">{{data[0][property].value === "na" ? "" : suffix}}</span></div></div>' +
            '<div flex class="stat z-anim" layout=column layout-align="center center"><div><span class="prefix">{{prefix}}</span>{{data[1][property].value}}<span class="suffix">{{data[1][property].value === "na" ? "" : suffix}}</span></div></div>' +
            '<div flex class="stat z-anim" layout=column layout-align="center center"><div><span class="prefix">{{prefix}}</span>{{data[2][property].value}}<span class="suffix">{{data[2][property].value === "na" ? "" : suffix}}</span></div></div>' +
            '<div flex class="stat z-anim" layout=column layout-align="center center"><div><span class="prefix">{{prefix}}</span>{{data[3][property].value}}<span class="suffix">{{data[3][property].value === "na" ? "" : suffix}}</span></div></div>' +
            '<div flex class="stat z-anim" layout=column layout-align="center center"><div><span class="prefix">{{prefix}}</span>{{data[4][property].value}}<span class="suffix">{{data[4][property].value === "na" ? "" : suffix}}</span></div></div>' +
            '</div>'
      };
    }]);


