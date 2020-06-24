// timer.js
//
// the job of this is to take metrics of how long it takes for something to happen/execute
//

class Timer {
  constructor ()  {
    this.timers = {};
  }

  startTimer ( id ) {
    this.timers[id] = window.performance.now();
  }

  endTimer ( id ) {
    const end = window.performance.now();
    const dif = end - this.timers[id];
    console.log(`${id} took ${dif}ms`);
  }
}

module.exports = Timer;
