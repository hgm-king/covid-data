// Dataworker.js
//
// wrapper for wasm module, encapsulates raw memory and the methods exposed
// Dataworker is here to do a lot of data manipulation very fast over
// a contiguous block of memory



class Worker {
  constructor() {
    this.self = Dataworker.new();
    this.width = dataworker.width();
    this.height = dataworker.height();
    this.dataPtr = dataworker.data();
    this.matrix = new Uint32Array(memory.buffer, dataPtr, width * height);
  }

  get matrix() { return this.matrix }

}

module.exports = Worker;
