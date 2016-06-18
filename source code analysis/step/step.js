/*
Copyright (c) 2011 Tim Caswell <tim@creationix.com>

MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

// Inspired by http://github.com/willconant/flow-js, but reimplemented and
// modified to fit my taste and the node.JS error handling system.

// 1.定义Step()接收一系列任务
    // 1.1分离任务（steps）和回调（最后一环）
    // 1.2初始化各个状态变量
// 2.定义next()作为内置的回调函数（供外部使用）
    // 2.1从任务队列中取出一个并放在try块里执行
    //    同时通过this注入next回调
    // 2.2收集并传递结果/异常，执行下一环
// 3.定义next.parallel()，仅供内部使用，配合group
    // 3.1计数器加加
    // 3.2返回负责计数器减减的callback
// 4.定义next.group()，供外部使用
    // 4.1初始化计数器及状态变量
    // 4.2返回负责收集结果的callback
// 5.定义Step.fn()，延长管道（支持添加第一环leading数据准备和额外最后一环tailing收尾）
    // 5.1记录参数传入的各个任务
    // 5.2返回新函数用来接收leading数据和最后的tailing
    //    然后添上第一环和最后一环，并启动Step
// 6.暴露出API
    // 6.1按照CommonJS模块定义的方式暴露出Step()
function Step() {
  var steps = Array.prototype.slice.call(arguments),
      pending, counter, results, lock;
  // steps是调用者传入的一系列函数，最后一个是回调，之前的都是异步/同步任务
  // pending表示待执行项数
  // counter表示并行执行的总项数
  // results表示收集到的并行执行的steps的结果，results[0]为err，再往后与各step对应
  // lock表示正在处理/执行下一个step

  // Define the main callback that's given as `this` to the steps.
  // 主回调函数，即steps中的this
  function next() {
    counter = pending = 0;

    // Check if there are no steps left
    if (steps.length === 0) {
      // Throw uncaught errors
      if (arguments[0]) {
        throw arguments[0];
      }
      return;
    }

    // Get the next step to execute
    // 从头取一个step
    var fn = steps.shift();
    results = [];

    // Run the step in a try..catch block so exceptions don't get out of hand.
    // steps的执行被放到了try中，未捕获的异常通过next(e)传递给下一个step
    try {
      lock = true;
      //!!! steps中，this指向next的原因
      var result = fn.apply(next, arguments);
    } catch (e) {
      // Pass any exceptions on through the next callback
      next(e);
    }

    if (counter > 0 && pending == 0) {
      // If parallel() was called, and all parallel branches executed
      // synchronously, go on to the next step immediately.
      // 控制steps并行执行
      next.apply(null, results);
    } else if (result !== undefined) {
      // If a synchronous return is used, pass it to the callback
      // 把同步step的返回值传入下一个step
      next(undefined, result);
    }

    lock = false;
  }

  // Add a special callback generator `this.parallel()` that groups stuff.
  next.parallel = function () {
    // 每次调用更新计数器与待执行项数
    var index = 1 + counter++;  // 第一个空位留给err，结果从results[1]开始往后放
    pending++;

    return function () {
      // 回调执行时，更新待执行项数
      pending--;
      // Compress the error from any result to the first argument
      if (arguments[0]) {
        results[0] = arguments[0];
      }
      // Send the other results as arguments
      results[index] = arguments[1];
      //!!! 丢弃第3个参数及之后的所有参数
      if (!lock && pending === 0) {
        // When all parallel branches done, call the callback
        // 没有待执行项了，执行下一个step
        next.apply(null, results);
      }
else {
    console.warn('pending ' + pending + ' lock ' + lock);///
}
    };
  };

  // Generates a callback generator for grouped results
  next.group = function () {
    var localCallback = next.parallel();
    var counter = 0;
    var pending = 0;
    var result = [];
    var error = undefined;

    function check() {
console.log('from ' + arguments[0] + ' pending ' + pending);///
      if (pending === 0) {
        // When group is done, call the callback
        localCallback(error, result);
      }
    }
    //! 避免因为this.group()之后无group()调用而无法触发最后一个回调的情况
    process.nextTick(check); // Ensures that check is called at least once

    // Generates a callback for the group
    return function () {
      // 类似于parallel，更新计数器和待执行项数
      var index = counter++;
      pending++;
      return function () {
        pending--;
        // Compress the error from any result to the first argument
        if (arguments[0]) {
          error = arguments[0];
        }
        // Send the other results as arguments
        result[index] = arguments[1];
        // if (!lock) { check(); }
if (!lock) { check('tail'); }///
      };
    };
  };

  // Start the engine an pass nothing to the first step.
  // 仅仅为了初始化counter和padding
  next();
}

// Tack on leading and tailing steps for input and output and return
// the whole thing as a function.  Basically turns step calls into function
// factories.
Step.fn = function StepFn() {
  var steps = Array.prototype.slice.call(arguments);

  // 返回的函数会把接收到的最后一个函数参数作为额外的最后一环
  // 其余的作为参数传入第一环
  return function () {
    var args = Array.prototype.slice.call(arguments);

    // Insert a first step that primes the data stream
    // 插入一步数据流准备
    var toRun = [function () {
      this.apply(null, args);
    }].concat(steps);

    // If the last arg is a function add it as a last step
    // 即tailing hook的实现
    if (typeof args[args.length-1] === 'function') {
      toRun.push(args.pop());
    }


    Step.apply(null, toRun);
  }
}


// Hook into commonJS module systems
if (typeof module !== 'undefined' && "exports" in module) {
  module.exports = Step;
}
