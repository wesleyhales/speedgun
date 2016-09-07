var fs = require('fs');

//this is the extension used for files in the cache path
exports.cacheExtension = "d";

//this is the path that QTNetwork classes uses for caching files for it's http client
//the path should be the one that has 16 folders labeled 0,1,2,3,...,F
exports.cachePath = '/Users/whales/Library/Caches/Ofi\ Labs/PhantomJS/data8/';

//the resources that are to be saved
exports.cachedResources = new Array();

//call this when you first encounter a resource
//includeResource takes the httpResponse from phanomjs and remembers it for later
exports.includeResource = function (httpResponse) {
  if(!(httpResponse.url in exports.cachedResources)){
    exports.cachedResources[httpResponse.url] = new cachedResource(httpResponse);
  }
}

//this takes an httpResponse and builds the object that will be used to get the file contents
function cachedResource (httpResponse) {
  this.response = httpResponse;
  this.cacheFile = getUrlCacheFilename(this.response.url);
  this.cacheFileNoPath = this.cacheFile.clearBefore("/");
  this.mimetype = this.response.contentType.clearAfter(";");
  this.getContents = function () {
    //get all of the contents
    var contents = fs.read(exports.cachePath+this.cacheFile,'b');
    
    //get the last header
    var lastHeader = this.response.headers[this.response.headers.length-1];
    var secondToLastHeader = this.response.headers[this.response.headers.length-2];
    var indexOfLastHeader = contents.regexIndexOf(secondToLastHeader.name.escapeRegExp()+".+"+lastHeader.name.escapeRegExp());
    
    //really good chance this will be a problem with non image content types
    //I used a hex viewer to open up the QT cache files then came up with this way to find the end of the headers
    var lengthOfLastHeaders =
      secondToLastHeader.name.length+4+secondToLastHeader.value.length+4+
      lastHeader.name.length+4+lastHeader.value.length+1;
    
    return contents.substr(indexOfLastHeader+lengthOfLastHeaders);
  }
}

//get the name of the file from the QNetworkDiskCache that phantomjs uses
function getUrlCacheFilename(url,littleEndian,cacheSuffix)
{
  //im lazy, so make the last two args optional
  littleEndian = typeof littleEndian !== 'undefined' ? littleEndian : true;
  cacheSuffix = typeof cacheSuffix !== 'undefined' ? cacheSuffix : '.d';
  
  //convert the sha1 digest to hex
  //QT handles caching by converting the SHA1 hash to 64 bit qlonglong
  //   so the hash gets truncated to 8 bytes
  var digest = SHA1(url).substring(0,16).toString();
  
  //if this is a little endian system, reverse the bytes
  var littleEndian = true;
  if(littleEndian)
  {
    var result = "";
    //the digest is in hex, so take 2 bytes at a time
    for (var i = digest.length-1; i > 0; i-=2)
    {
      result += digest.substr(i-1, 2);
    }
    digest = result;
  }
  
  //convert to js int then to base 36 string, then truncate
  var hash = parseInt(digest,16).toString(36).substr(0, 8);
  
  //in QT the filename of a cached url is hash[0]%16 + '/' + hash + '.d'
  return (parseInt(hash.charCodeAt(hash.length-1))%16).toString(16) + '/' + hash + cacheSuffix;
}

//get hex SHA1 digest of msg
//borrowed from http://www.webtoolkit.info/javascript-sha1.html
function SHA1(msg) {
  
  function rotate_left(n,s) {
    var t4 = ( n<<s ) | (n>>>(32-s));
    return t4;
  };
  
  function lsb_hex(val) {
    var str="";
    var i;
    var vh;
    var vl;
    
    for( i=0; i<=6; i+=2 ) {
      vh = (val>>>(i*4+4))&0x0f;
      vl = (val>>>(i*4))&0x0f;
      str += vh.toString(16) + vl.toString(16);
    }
    return str;
  };
  
  function cvt_hex(val) {
    var str="";
    var i;
    var v;
    
    for( i=7; i>=0; i-- ) {
      v = (val>>>(i*4))&0x0f;
      str += v.toString(16);
    }
    return str;
  };
  
  
  function Utf8Encode(string) {
    string = string.replace(/\r\n/g,"\n");
    var utftext = "";
    
    for (var n = 0; n < string.length; n++) {
      
      var c = string.charCodeAt(n);
      
      if (c < 128) {
        utftext += String.fromCharCode(c);
      }
      else if((c > 127) && (c < 2048)) {
        utftext += String.fromCharCode((c >> 6) | 192);
        utftext += String.fromCharCode((c & 63) | 128);
      }
      else {
        utftext += String.fromCharCode((c >> 12) | 224);
        utftext += String.fromCharCode(((c >> 6) & 63) | 128);
        utftext += String.fromCharCode((c & 63) | 128);
      }
      
    }
    
    return utftext;
  };
  
  var blockstart;
  var i, j;
  var W = new Array(80);
  var H0 = 0x67452301;
  var H1 = 0xEFCDAB89;
  var H2 = 0x98BADCFE;
  var H3 = 0x10325476;
  var H4 = 0xC3D2E1F0;
  var A, B, C, D, E;
  var temp;
  
  msg = Utf8Encode(msg);
  
  var msg_len = msg.length;
  
  var word_array = new Array();
  for( i=0; i<msg_len-3; i+=4 ) {
    j = msg.charCodeAt(i)<<24 | msg.charCodeAt(i+1)<<16 |
      msg.charCodeAt(i+2)<<8 | msg.charCodeAt(i+3);
    word_array.push( j );
  }
  
  switch( msg_len % 4 ) {
    case 0:
      i = 0x080000000;
      break;
    case 1:
      i = msg.charCodeAt(msg_len-1)<<24 | 0x0800000;
      break;
    
    case 2:
      i = msg.charCodeAt(msg_len-2)<<24 | msg.charCodeAt(msg_len-1)<<16 | 0x08000;
      break;
    
    case 3:
      i = msg.charCodeAt(msg_len-3)<<24 | msg.charCodeAt(msg_len-2)<<16 | msg.charCodeAt(msg_len-1)<<8	| 0x80;
      break;
  }
  
  word_array.push( i );
  
  while( (word_array.length % 16) != 14 ) word_array.push( 0 );
  
  word_array.push( msg_len>>>29 );
  word_array.push( (msg_len<<3)&0x0ffffffff );
  
  
  for ( blockstart=0; blockstart<word_array.length; blockstart+=16 ) {
    
    for( i=0; i<16; i++ ) W[i] = word_array[blockstart+i];
    for( i=16; i<=79; i++ ) W[i] = rotate_left(W[i-3] ^ W[i-8] ^ W[i-14] ^ W[i-16], 1);
    
    A = H0;
    B = H1;
    C = H2;
    D = H3;
    E = H4;
    
    for( i= 0; i<=19; i++ ) {
      temp = (rotate_left(A,5) + ((B&C) | (~B&D)) + E + W[i] + 0x5A827999) & 0x0ffffffff;
      E = D;
      D = C;
      C = rotate_left(B,30);
      B = A;
      A = temp;
    }
    
    for( i=20; i<=39; i++ ) {
      temp = (rotate_left(A,5) + (B ^ C ^ D) + E + W[i] + 0x6ED9EBA1) & 0x0ffffffff;
      E = D;
      D = C;
      C = rotate_left(B,30);
      B = A;
      A = temp;
    }
    
    for( i=40; i<=59; i++ ) {
      temp = (rotate_left(A,5) + ((B&C) | (B&D) | (C&D)) + E + W[i] + 0x8F1BBCDC) & 0x0ffffffff;
      E = D;
      D = C;
      C = rotate_left(B,30);
      B = A;
      A = temp;
    }
    
    for( i=60; i<=79; i++ ) {
      temp = (rotate_left(A,5) + (B ^ C ^ D) + E + W[i] + 0xCA62C1D6) & 0x0ffffffff;
      E = D;
      D = C;
      C = rotate_left(B,30);
      B = A;
      A = temp;
    }
    
    H0 = (H0 + A) & 0x0ffffffff;
    H1 = (H1 + B) & 0x0ffffffff;
    H2 = (H2 + C) & 0x0ffffffff;
    H3 = (H3 + D) & 0x0ffffffff;
    H4 = (H4 + E) & 0x0ffffffff;
    
  }
  
  var temp = cvt_hex(H0) + cvt_hex(H1) + cvt_hex(H2) + cvt_hex(H3) + cvt_hex(H4);
  
  return temp.toLowerCase();
  
}

//I'm lazy, this is helpful
String.prototype.clearAfter = function(text) {
  var indexOf = this.indexOf(text);
  return (indexOf > 0) ? this.substr(0,indexOf) : this.toString();
}

String.prototype.clearBefore = function(text) {
  var indexOf = this.indexOf(text);
  return (indexOf > 0) ? this.substr(indexOf+1) : this.toString();
}


//"
String.prototype.regexIndexOf = function(regex, startpos) {
  var indexOf = this.substring(startpos || 0).search(regex);
  return (indexOf >= 0) ? (indexOf + (startpos || 0)) : indexOf;
}

//"
String.prototype.escapeRegExp = function() {
  return this.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&").replace(" ","\\s");
}