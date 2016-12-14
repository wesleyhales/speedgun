var fs = require('fs');
  
module.exports = {
  printResourceReport: function (page) {
  
    var xresources = speedgun.reportData.resources.value,
        aurl = document.createElement('a');
    
    aurl.href = speedGunArgs.url;
    var hostName = aurl.hostname,
        hostNameArray = hostName.split("."),
        tld = hostNameArray[(hostNameArray.length - 2)] + '.' + hostNameArray[(hostNameArray.length - 1)],
        reportResource = {};
  
    var firstparty = speedGunArgs.reportLocation + '1stparty-resources.txt',
        thirdparty = speedGunArgs.reportLocation + '3rdparty-resources.txt';
  
    if (fs.exists(firstparty)) {
      fs.remove(firstparty);
      fs.remove(thirdparty);
    }
    var fp = fs.open(firstparty, "a"),
        tp = fs.open(thirdparty, "a"),
        fpResourceCount = 0, tpResourceCount = 0, fpResSize = 0, tpResSize = 0;
  
    for(var obj in xresources) {
      var resource = xresources[obj],
          entry = false;
    
      resource.size = ((resource.size !== undefined && resource.size !== 'undefined') ? resource.size : 0);
    
      //todo, here we populate all resource sizes and total page weight but...
      //todo - this feature depends on https://github.com/ariya/phantomjs/issues/10156#ref-commit-545b03c
      speedgun.reportData.totalBytes.value = speedgun.reportData.totalBytes.value + resource.size;
      speedgun.reportData.totalResources.value++;
    
      aurl.href = resource.url;
      hostName = aurl.hostname;
      hostNameArray = hostName.split(".");
      var newtld = hostNameArray[(hostNameArray.length - 2)] + '.' + hostNameArray[(hostNameArray.length - 1)];
      reportResource.firstParty = newtld === tld;
      reportResource.url = resource.url;
      reportResource.size = resource.size;
      reportResource.duration = resource.duration;
      reportResource.threepjstotal = 0;
      reportResource.jstotal = 0;
    
      var f;
    
      //track first and thrid party sizes and count
      if(reportResource.firstParty){
        f = fp;
        fpResourceCount++;
        fpResSize += reportResource.size;
      }else{
        f = tp;
        tpResourceCount++;
        tpResSize += reportResource.size;
      }
    
      //todo add headers switch to config
      var headers = true, response = {};
      if (headers) {
        var responses = resource.responses;
        if(responses.length >= 1){
          for (var i = 0; i < responses.length;i++){
            response = responses[i];
            if(response.start && response.start.headers.length > 0){
              entry = 'start';
              break;
            }else if(response.end && response.end.headers.length > 0){
              entry = 'end';
              break;
            }else{
              //no headers in the response, skip it.
              entry = false
            }
          }
        }else{
          //is base 64 or came back with null content-type on response
        }
        
        if(entry && speedGunArgs.cdnDebug){
          reportResource.AKAMAI     = {active:false,features:[]};
          reportResource.INSTART    = {active:false,features:[]};
          reportResource.FASTLY     = {active:false,features:[]};
          reportResource.MAXCDN     = {active:false,features:[]};
          reportResource.GENERIC    = {active:false,features:[]};
          reportResource.CLOUDFRONT = {active:false,features:[]};
          
          reportResource.status = response[entry].status;
          
          // add more from proprietary headers section here: https://www.cedexis.com/blog/fun-with-headers/
          response[entry].headers.forEach(function (header) {
          
            if(header.name.toLowerCase().indexOf('akamai') > -1){reportResource.AKAMAI.active = true}
            if(header.name.toLowerCase().indexOf('fastly') > -1){reportResource.FASTLY.active = true}
            if(header.name.toLowerCase().indexOf('instart') > -1){reportResource.INSTART.active = true}
            if(header.value.toLowerCase().indexOf('netdna') > -1){reportResource.MAXCDN.active = true}
            if(header.value.toLowerCase().indexOf('cloudfront') > -1){reportResource.CLOUDFRONT.active = true}
          
          
            //akamai rules
            if (header.name.toLowerCase() === 'x-akamai-transformed') {reportResource.AKAMAI.features.push({feature:"FEO_ENABLED"});}
            if (header.name.toLowerCase() === 'x-akamai-edgescape') {reportResource.AKAMAI.features.push({feature:"CONTENT_TARGETING"});} // https://community.akamai.com/community/web-performance/blog/2016/03/16/content-targeting-a-basic-introduction
            if (header.value.toLowerCase().indexOf('pmb=mrum') > -1) {reportResource.AKAMAI.features.push({feature:"RUM_ENABLED"});}
          
            //fastly rules
            // https://community.fastly.com/t/deciphering-fastly-debug-header/520
          
            //generic use of caching headers
            if (header.name.toLowerCase() === ('x-check-cacheable' && header.value.indexOf('NO') > -1)) {reportResource.GENERIC.features.push({feature:"NOT_CACHED"});}
            if (header.name.toLowerCase() === ('x-cache' && header.value.indexOf('HIT') > -1)) {reportResource.GENERIC.features.push({feature:"CACHED"});}
          
            //instart rules
            if (header.name === 'x-instart-cache-id') {reportResource.INSTART.features.push({feature:"CACHED"});}
            if (header.name === 'X-Instart-Streaming') {
              if(header.value.indexOf('HtmlStreaming:HIT;InstantLoad:HIT') > -1){reportResource.INSTART.features.push({feature:"HTML Streaming and InstantLoad are both enabled"});}
              if(header.value.indexOf('HtmlStreaming:HIT;InstantLoad:SKIP,optimization_disabled') > -1){reportResource.INSTART.features.push({feature:"HTML Streaming is enabled, InstantLoad is disabled"});}
              if(header.value.indexOf('HtmlStreaming:MISS,optimization_disabled;InstantLoad:HIT') > -1){reportResource.INSTART.features.push({feature:"HTML Streaming is disabled, Instant Load is enabled"});}
              if(header.value.indexOf('HtmlStreaming:MISS,reloaded_request;InstantLoad:SKIP,optimization_disabled') > -1){reportResource.INSTART.features.push({feature:"HTML Streaming is enabled but was not applied because the request was reloaded; InstantLoad is disabled"});}
              if(header.value.indexOf('HtmlStreaming:MISS,streaming_cache_not_ready;InstantLoad:SKIP,html_streaming_miss') > -1){reportResource.INSTART.features.push({feature:"HTML Streaming is enabled but was not applied because the streaming cache was not yet ready; InstantLoad is disabled"});}
              if(header.value.indexOf('js_profiled') > -1){reportResource.INSTART.features.push({feature:"JavaScript Streaming is enabled"});}
              if(header.value.indexOf('js_profiled') > -1){reportResource.INSTART.features.push({feature:"JavaScript Streaming is enabled and the optimized code was delivered to the client"});}
            }
          
          });
        }
      
        if(entry){
          reportResource.headers = response[entry].headers;
        }
      
        
        reportResource.isjs = false;
        reportResource.cacheable = true;
        reportResource.isImage = false;
        
        //if we get an image content type, evaluate the page and look for more data, e.g. width/height
        reportResource.headers.forEach(function (header) {
          //pull detailed image information
          if(header.value.indexOf('image/') > -1) {
            reportResource.isImage = true;
            reportResource.imageSize = page.evaluate(function (url, usepath) {
              var aurl = document.createElement('a');
              aurl.href = url;
              var selectorUrl = (usepath ? aurl.pathname : url);
              var thisimage = document.querySelector('img[src*="' + selectorUrl + '"]');
              return {"width": thisimage.naturalWidth, "height": thisimage.naturalHeight};
            }, reportResource.url, reportResource.firstParty);
          }else{
            //reportResource.imageSize = undefined;
          }
        });
        
        //all report/ui stuff below
        function configAlert(string){
          f.writeLine('<');
          f.writeLine('<-!!!!! Config ALERT------------------ ' + string);
          f.writeLine('<');
        }
        
        f.writeLine(' ');
        f.writeLine('==================== ' + (reportResource.AKAMAI.active ? 'Akamai' :
                                              (reportResource.FASTLY.active ? 'Fastly' :
                                              (reportResource.INSTART.active ? 'Instart Logic' :
                                              (reportResource.MAXCDN.active ? 'MaxCDN' :
                                              (reportResource.CLOUDFRONT.active ? 'CloudFront' : 'Unknown'))))) + ' ===================');
        
        if(reportResource.AKAMAI.active) {
          for (var item in reportResource.AKAMAI.features) {
            f.writeLine('______akamai: ' + reportResource.AKAMAI.features[item].feature);
          }
        }
        if(reportResource.INSTART.active) {
          for (var item in reportResource.INSTART.features) {
            f.writeLine('______Instart Logic: ' + reportResource.INSTART.features[item].feature);
          }
        }
      
        f.writeLine('______number: ' + (reportResource.firstParty ? fpResourceCount : tpResourceCount));
        f.writeLine('______id: ' + speedgun.reportData.totalResources.value);
        f.writeLine('______url: ' + reportResource.url);
      
        if(resource.times.end){
          var endTime = new Date(resource.times.end);
          f.writeLine('______received: ' + endTime.getHours() + ':' + endTime.getMinutes() + ':' + endTime.getSeconds() + '.' + endTime.getMilliseconds() + 'ms');
        }
        f.writeLine('______duration: ' + reportResource.duration + 'ms');
        f.writeLine('______bytes sent: ' + reportResource.size);
        f.writeLine('______total bytes sent so far: ' + (reportResource.firstParty ? fpResSize : tpResSize));
        f.writeLine('______HTTP status: ' + reportResource.status);
        f.writeLine(' ');
        
        reportResource.headers.forEach(function (header) {
        
          f.writeLine('______header: ' + header.name + ' ' + header.value);
          //case of Javascript file without the extension
          if(header.name.indexOf('Content-Type') > -1 && header.value.indexOf('javascript') > -1 && reportResource.url.indexOf('.js') === -1){
            reportResource.isjs = true;
            configAlert('If applying Javascript related feature, this file needs to be added to config manually because the URL does not end in ".js".');
          }
        
          if(header.name.indexOf('Cache-Control') > -1 && header.value.indexOf('no-cache') > -1){
            reportResource.cacheable = false;
            configAlert('Not Cacheable - file size is: ' + reportResource.size + ' and transfer time was: ' + reportResource.duration);
          }
        
        });
      
        if(reportResource.isImage) {
          //Defaults do not apply and config needs to be changed
          if (reportResource.size < 1500 && reportResource.firstParty) {
            configAlert('Image will Not be transcoded because it falls below 1500 bytes');
          }
        
          //Defaults do not apply and config needs to be changed
          if (reportResource.imageSize && (reportResource.imageSize.width > 1024 || reportResource.imageSize.height > 1024) && reportResource.firstParty) {
            configAlert('Image will Not be transcoded because it exceeds the default 1024 max width or height');
          }
        
          if (reportResource.url.indexOf('edgekey.net') > -1) {
            configAlert('This image is being transcoded through Akamai\'s 3rd party domain');
          }
        }
      
        //qualified first party javascript caching info
        if(reportResource.firstParty && reportResource.isjs && reportResource.cacheable){
          reportResource.jstotal += reportResource.size;
          configAlert('Javascript is cacheable. Total size is: ' + reportResource.size + ' Total bytes so far: ' + reportResource.threepjstotal);
        }
      
        //qualified third party javascript caching info
        if(!reportResource.firstParty && reportResource.isjs && reportResource.cacheable){
          reportResource.threepjstotal += reportResource.size;
          configAlert('Potential 3PJS Cacheable. Total size is: ' + reportResource.size + ' Total bytes so far: ' + reportResource.jstotal);
        }
      
      }
    }
  
    fp.close();
    tp.close();
    
  }
};