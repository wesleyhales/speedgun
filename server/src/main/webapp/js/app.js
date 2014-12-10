//'use strict';

var host = '';
//host = 'http://localhost:8081';

angular.module('app', [])
  .service('api', ['$q', '$http', '$timeout', function ($q, $http, $timeout) {
    var numReports = 5, retryDelay = 500;
    this.go = function(url, email, cached){
      //http://localhost:8081/rest/performance/go?url=http%3A%2F%2Fgoogle.com&cached=false&email=
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
      if (!uuid) return $q.when(speedgun);
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
          if (res.data === '#fail') return;
          console.log(res.data);
            data = res.data instanceof Array ? res.data : [res.data];
            if (data.length >= numReports) return deferred.resolve(data);
            deferred.notify(data);
          },function(err){console.log('err', err);});

        request.finally(function(){
          console.log(data.length);
            if (data.length < numReports) $timeout(loop, retryDelay);
          });
      };

      loop();

      return deferred.promise;
    };
  }])
  .controller('MainCtrl', ['$scope', 'api', function ($scope, api) {
    $scope.url = 'http://yahoo.com';
    api.get().then(function(res){
      $scope.speedgun = res;
    });
    $scope.go = function(url, email, cached){
      api.go(url, email, cached).then(function(initResponse){
        var uuid = initResponse.data.uuid;
        console.log(uuid);
        var done = function(data){
          $scope.speedgun = data;
        };
        var error = function(err){
          console.log('error');
          console.log(err);
        };
        var progress = function(data){
          $scope.speedgun = data;
        };
        api.get(uuid).then(done, error, progress);
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
        suffix: '@'
      },
      template:
        '<md-card class="cell {{property}}">' +
          '<div class=card>' +
            '<div class="header">{{property | deCamelCase}}</div>' +
            '<div class="desc">{{data[0][property].label}}</div>' +
            '<stats data="data" property="{{property}}" suffix="{{suffix}}" class="pure-g"></stats>' +
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
      template: '<div class="pure-u-1-5"><span class="prefix">{{prefix}}</span>{{data[0][property].value}}<span class="suffix">{{suffix}}</span></div>' +
                '<div class="pure-u-1-5"><span class="prefix">{{prefix}}</span>{{data[1][property].value}}<span class="suffix">{{suffix}}</span></div>' +
                '<div class="pure-u-1-5"><span class="prefix">{{prefix}}</span>{{data[2][property].value}}<span class="suffix">{{suffix}}</span></div>' +
                '<div class="pure-u-1-5"><span class="prefix">{{prefix}}</span>{{data[3][property].value}}<span class="suffix">{{suffix}}</span></div>' +
                '<div class="pure-u-1-5"><span class="prefix">{{prefix}}</span>{{data[4][property].value}}<span class="suffix">{{suffix}}</span></div>'
    };
  }]);


