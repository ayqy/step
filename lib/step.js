/*
Copyright (c) 2010 Tim Caswell <tim@creationix.com>

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
function Step() {
  var steps = Array.prototype.slice.call(arguments),
      counter, results;
      
  // Define the main callback that's given as `this` to the steps.
  function next() {

    // Check if there are no steps left
    if (steps.length === 0) {
      // Throw uncaught errors
      if (arguments[0]) {
        throw arguments[0];
      }
      return;
    }
    
    // Get the next step to execute
    var fn = steps.shift();
    counter = 0;
    results = [];
    
    // Run the step in a try..catch block so exceptions don't get out of hand.
    try {
      var result = fn.apply(next, arguments);
    } catch (e) {
      // Pass any exceptions on through the next callback
      next(e);
    }

    // If a syncronous return is used, pass it to the callback
    if (result !== undefined) {
      next(undefined, result);
    }
    
  }
  
  // Add a special callback generator `this.parallel()` that groups stuff.
  next.parallel = function () {
    var i = counter;
    counter++;
    return function () {
      counter--;
      // Compress the error from any result to the first argument
      if (arguments[0]) {
        results[0] = arguments[0];
      }      
      // Send the other results as arguments
      results[i + 1] = arguments[1];
      if (counter <= 0) {
        // When they're all done, call the callback
        next.apply(null, results);
      }
    };
  };
  
  // Start the engine an pass nothing to the first step.
  next([]);
}

// Hook into commonJS module systems
if (typeof module !== 'undefined' && "exports" in module) {
  module.exports = Step;
}