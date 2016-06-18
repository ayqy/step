var TwoStep = require('./twostep');
var FS = require('fs');

TwoStep(
  function one() {
    this.pass(__filename + ".bak");
    FS.readFile(__filename, 'utf8', this.slot());
  },
  function two(err, target, contents) {
    if (err) throw err;
    this.pass(target);
    FS.writeFile(target, contents, this.slot())
  },
  function three(err, target) {
    if (err) throw err;
    console.log("%s written to successfully", target);
    FS.readdir(__dirname, this.slot());
  },
  function four(err, fileNames) {
    if (err) throw err;
    this.pass(fileNames);
    var group = this.makeGroup();
    fileNames.forEach(function (filename) {
      FS.stat(filename, group.slot());
    });
  },
  function five(err, fileNames, stats) {
    if (err) throw err;
    this.pass(fileNames.filter(function (name, i) {
      return stats[i].isFile();
    }));
    var group = this.makeGroup();
    stats.forEach(function (stat, i) {
      if (stat.isFile()) FS.readFile(fileNames[i], 'utf8', group.slot());
    });
  },
  function six(err, fileNames, contents) {
    if (err) throw err;
    var merged = {};
    fileNames.forEach(function (name, i) {
      merged[name] = contents[i].substr(0, 80);
    });
    console.log(merged);
  }
);
