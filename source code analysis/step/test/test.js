var fs = require('fs');

var Step = require('../step.js');

Step(
    function readDir() {
        fs.readdir(__dirname, this);
    },
    function readFiles(err, results) {
        if (err) throw err;
        // Create a new group
        var group = this.group();
var that = this;///
        results.forEach(function(filename) {
            if (/\.js$/.test(filename)) {
                // fs.readFile(__dirname + "/" + filename, 'utf8', group());
                // 不调用group()
                fs.readFile(__dirname + "/" + filename, 'utf8', that.parallel());

                // 延时调用group
                // process.nextTick(function() {group()(null, filename);});
            }
        });
    },
    function showAll(err, files) {
        if (err) throw err;
console.log('show all');///
        files.forEach(function(text) {
            console.log(text.slice(0, 20));
        });
        // console.dir(files);
    }
);