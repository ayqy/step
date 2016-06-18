var TwoStep = require('./twostep');
var FS = require('fs');
var Path = require('path');

// Create a composite function using TwoStep.fn
var statdir = TwoStep.fn(
  function (directory) {
    this.pass(directory);
    FS.readdir(directory, this.slot());
  },
  function (err, directory, fileNames) {
    if (err) return this.error(err);
    this.pass(directory, fileNames);
    var group = this.makeGroup();
    fileNames.forEach(function (name) {
      FS.stat(name, group.slot());
    });
  },
  function (err, directory, filenames, stats) {
    if (err) return this.error(err);
    var output = {};
    filenames.forEach(function (name, i) {
      var path = Path.join(directory, name);
      output[path] = stats[i];
    });
    this.pass(output);
  }
);

statdir(__dirname, function (err, stats) {
  if (err) throw err;
  console.log("Stats", stats);
})