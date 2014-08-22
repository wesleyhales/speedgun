// Schedule all three types of reports to run every hour.
// Files are saved in relative paths "reports/" and "filmstrip-<increment>/".
// File names for CSV and JSON are incremented each hour from zero as "speedgun-<increment>.<csv OR json>".
// Folder for filmstrip images is incremented from zero as "filmstrip-<increment>/".
var exec = require('child_process').exec;

var increment = 0;

// TODO: Pass URL as argument when calling as "node schedule-speedgun.js <URL>".
function runspeedgun(){
    exec('phantomjs speedgun.js http://www.people.com performance csv', function (error, stdout, stderr) {
        exec('mv reports/speedgun.csv reports/speedgun-' + increment + '.csv', function(error, stdout, stderr){
        	console.log('CSV ' + increment + ' done.');
        });
    });
    exec('phantomjs speedgun.js http://www.people.com performancecache json', function (error, stdout, stderr) {
        exec('mv reports/speedgun.json reports/speedgun-' + increment + '.json', function(error, stdout, stderr){
        	console.log('JSON ' + increment + ' done.');
        });
    });
    exec('phantomjs speedgun.js http://www.people.com filmstrip', function (error, stdout, stderr) {
        exec('mkdir filmstrip/filmstrip-' + increment, function(error, stdout, stderr){
        	exec('mv filmstrip/screenshot*.png filmstrip/filmstrip-' + increment + '/', function(error, stdout, stderr){
        		console.log('Filmstrip ' + increment + ' done.')
        	});
        });
    });
    makeTimeout();
    increment++;    
}

function makeTimeout(){
    var d = new Date();
    var min = d.getMinutes();
    var sec = d.getSeconds();

    if((min == '00') && (sec == '00')) {
        runspeedgun();
    } else {
        setTimeout(runspeedgun, (60*(60-min)+(60-sec))*1000);
    }            
}

makeTimeout();
