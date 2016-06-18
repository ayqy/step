var fs = require('fs');

var Step = require('../step.js');

var syncTask = function(name, callback) {
    var id = 'syncTask_' + name;
    console.log(id);
    callback(null, id);
};
var asyncTask = function(name, callback) {
    var id = 'asyncTask_' + name;
    process.nextTick(function() {
        console.log(id);
        callback(null, id);
    });
};

// Step(function() {
//     var group = this.group();
//     asyncTask('a1', group());
//     asyncTask('a2', group());
//     asyncTask('a3', group());
//     asyncTask('a4', group());
// }, function(err, res) {
//     if (err) throw err;

//     console.log(res);
// });

// Step(function() {
//     var group = this.group();
//     syncTask('s1', group());
//     syncTask('s2', group());
//     // 因为同一个step内存在状态lock，不会触发group尾部的check()
// }, function(err, res) {
//     if (err) throw err;

//     console.log(res);
// });

// Step(function() {
//     var group = this.group();
//     asyncTask('a1', group());
//     syncTask('s1', group());
//     // 因为存在后续group，pending不为0，不会触发nextTick中的check()
// }, function(err, res) {
//     if (err) throw err;

//     console.log(res);
// });

// Step(function() {
//     var group = this.group();
//     syncTask('s1', group());
//     asyncTask('a1', group());
//     // 同上
// }, function(err, res) {
//     if (err) throw err;

//     console.log(res);
// });

// Step(function() {
//     var group = this.group();
//     setTimeout(function() {
//         // 时间大于nextTick即可
//         group()(null, 'ErrorCase');
//     }, 50);
//     // 结果是nextTickCheck触发callback，res为[]
//     // 然后group尾部的check触发，局部pending为0，进入next，全局pending变为-1，但没有影响正常逻辑
// }, function(err, res) {
//     if (err) throw err;

//     console.log(res);
// });

// nextTickCheck一般情况下没问题
// https://github.com/creationix/step/issues/41

// Step(function() {
//     var _callback = this;
//     setTimeout(function() {
//         _callback(null, 1);
//     }, 50);
//     setTimeout(function() {
//         _callback(null, 2, 4);
//     }, 30);
// }, function(err, res) {
//     if (err) throw err;
//     console.log(res);
// });

// Step(function() {
//     throw new Error('error occurs');
// }, function(err) {
//     // if (err) throw err;
//     this(null, 'ok');
// }, function(err, res) {
//     if (!err) {
//         console.log(res);   // ok
//     }
// });

var myStep = Step.fn(function(arg1, arg2) {
    console.log(arg1, arg2);
    console.log('step1');
    this(null, 1);
}, function(err, res) {
    console.log('step2');
    this(null, [res, 2]);
}, function(err, res) {
    console.log('step3');
    console.log(res);
    this(null, res);
});
myStep('data1', 'data2', function(err, res) {
    console.log('extra tailing step');
    if (!err) {
        console.log(res);
    }
});