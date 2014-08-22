'use strict';

var path = require('path');

// speedgun Node module
// ----------
// to get phantomjs reporters path use
// require("speedgun").load_reports;
// require("speedgun").speedreports;
// require("speedgun").filmstrips;
(function(exports) {

  exports.load_reports = path.resolve(__dirname+"/../")+"/speedgun.js";
  exports.speedreports = path.resolve(__dirname+"/../")+"/speedreport.js";

}(typeof exports === 'object' && exports || this));