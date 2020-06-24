const d3 = require("d3");
const topojson = require("topojson-client");

import { Dataworker }  from 'dataworker';
import { memory } from "dataworker/dataworker_bg";

export default class VizMap {
  constructor ( url ) {
    this.url = url;
    this.dataworker = Dataworker.new();
    this.width = dataworker.width();
    this.height = dataworker.height();
    this.dataPtr = dataworker.data();
    this.matrix = new Uint32Array(memory.buffer, dataPtr, width * height);

    this.bars = d3
            .select('#volume-series')
            .selectAll('vol')
            .data(this.matrix, d => d['date']);
  }


}
