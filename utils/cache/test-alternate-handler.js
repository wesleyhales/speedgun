/* object handling works better if you do it with onResourceReceived at the 'end' stage, rather than
 * in onLoadFinished. For one thing you'll get AJAX-loaded objects.
 * This snippet filters out pdf files.
 */

page.onResourceReceived = function ( response ) {
  if ( response.stage == 'end' && response.contentType.indexOf( 'application/pdf' ) >= 0 ) {
    cache.includeResource( response );
    for ( index in cache.cachedResources ) {
      /* index is the URL of the resource */
      var rsrc = cache.cachedResources[index];
      if ( !rsrc.saved ) {
        var fname = rsrc.cacheFileNoPath;
        var ext = mimetype.ext[rsrc.mimetype];
        var finalFile = cache.objectPath + '/' + rsrc.leafName;
        phantomFs.write( finalFile, rsrc.getContents(), 'b' );
        rsrc.saved = true;
        var asset = {};
        asset.leafName = rsrc.leafName;
        asset.path = finalFile;
        setState( 'download_' + downloadCount, asset );
        downloadCount++;
      }
    }
  }
}