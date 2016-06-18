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
        results.forEach(function(filename) {
            if (/\.js$/.test(filename)) {
                fs.readFile(__dirname + "/" + filename, 'utf8', group());
            }
        });
    },
    function showAll(err, files) {
        if (err) throw err;
        files.forEach(function(text) {
            console.log(text.slice(0, 20));
        });
        // console.dir(files);
    }
);