

const d3 = require("d3");
const topojson = require("topojson-client");

import { Dataworker, Filetype } from 'dataworker';
import { memory } from "dataworker/dataworker_bg";

const dataVizColors = [
  '#051c2c',
  '#034b6f',
  '#027ab1',
  '#00a9f4',
  '#39bdf3',
  '#71d2f1',
  '#aae6f0',
  '#3c96b4',
  '#afc3ff',
]


const asyncWait = async (count) => new Promise(resolve => setTimeout(resolve, count? count : 1000 ));

function Utf8ArrayToStr(array) {
  let s = "";
  array.forEach((char) => { s += String.fromCharCode(char) })
  return s;
}

// given a range of min to max where the range is divided into n segments
// and an integer x where min <= x <= max
// let bucket be the segment number that x is within
const buckets = (x, min, max, n) => Math.floor((x - min) / ((max - min) / n));


// const chartWidth = 5000;
// const chartHeight = 5000;
//
// const svg = d3.select("body").append("svg")
//     .attr("height", chartHeight)
//     .attr("width", chartWidth)
//     .attr("viewBox", `0 -20 ${chartWidth} ${chartHeight}`);
//
// const circleRadius = 3;
// const circleDiameter = circleRadius * 2;
//
// const polarY = (radius, theta) => radius * Math.sin(theta) / 3;
// const polarX = (radius, theta) => radius * Math.cos(theta) / 3;
//
// const draw = () => {
//   const t = svg.transition()
//       .duration(750);
//
//   svg.selectAll("circle")
//     .data(matrix, d => d)
//     .join(
//       enter => enter
//           .append("circle")
//           .attr("fill", "green")
//           .attr('cx', (d, i) => (chartWidth / 2) + polarX(i, i))
//           .attr('cy', (d, i) => (chartHeight / 2) + polarY(i, i))
//           .attr('r', circleRadius)
//           .text(d => d)
//         .call(enter => enter.transition(t)
//           .attr("y", 0)),
//       update => update
//           .attr("fill", "black")
//           .attr("y", 0),
//       exit => exit
//           .attr("fill", "brown")
//         .call(exit => exit.transition(t)
//           .attr("y", 30)
//           .remove())
//     );
// }
//
// (async () => {
//   while (true) {
//     dataworker.reset();
//     draw();
//     await asyncWait(100);
//   }
// })();


const mapUrl = "https://raw.githubusercontent.com/nychealth/coronavirus-data/master/Geography-resources/MODZCTA_2010_WGS1984.geo.json";
const historyUrl = "https://api.github.com/repos/nychealth/coronavirus-data/commits?path=data-by-modzcta.csv";
const dataUrl = "https://raw.githubusercontent.com/nychealth/coronavirus-data/cf508e8fe08ddff44a847c1b54209c598b88c913/data-by-modzcta.csv";
// https://api.github.com/repos/nychealth/coronavirus-data/commits?path=data-by-modzcta.csv
// https://raw.githubusercontent.com/nychealth/coronavirus-data/cf508e8fe08ddff44a847c1b54209c598b88c913/data-by-modzcta.csv

const chartWidth = 960,
      chartHeight = 1160;

let data;

(async () => {

  // setup the map
  const nyc = await d3.json(mapUrl);
  const svg = d3.select("body").append("svg")
      .attr("width", chartWidth)
      .attr("height", chartHeight);

  const path = d3.geoPath()
      .projection(d3.geoConicConformal()
      .parallels([33, 45])
      .rotate([96, -39])
      .fitSize([chartWidth, chartHeight], nyc));

  // console.log(nyc, nyc.features.map((feature) => feature.properties.MODZCTA));
  // const history = await Dataworker.getData(historyUrl, Filetype.JSON);
  // const obj = history.to_object();
  // console.log(history, obj);

  // Setup the data
  const covidMapDataChunk = await Dataworker.getData(dataUrl, Filetype.CSV);
  const headers = covidMapDataChunk.keys();
  const draw = (header) => {

    const ptr = covidMapDataChunk.expose_key_int(header);
    const length = covidMapDataChunk.length();
    const mapData = new Uint32Array(memory.buffer, ptr, length);

    const mapDataMin = covidMapDataChunk.min();
    const mapDataMax = covidMapDataChunk.max();

    console.log(length, mapData, covidMapDataChunk.keys(), mapDataMin, mapDataMax);
    const t = svg.transition()
            .duration(750);

    svg.selectAll("path")
        .data(nyc.features)
        .join(
          enter => enter.append("path")
              .attr("d", path)
              .attr( "fill", (d, i) => {
                const n = buckets(mapData[i], mapDataMin, mapDataMax, dataVizColors.length);
                return dataVizColors[n]
              })
              .attr("d", path),
          update => update
              .attr( "fill", (d, i) => {
                const n = buckets(mapData[i], mapDataMin, mapDataMax, dataVizColors.length);
                return dataVizColors[n]
              })
              .attr("d", path),
          exit => exit
              .remove()
        );
  }

  // setup the select
  const select = document.getElementById("fields");
  for (const val of headers) {
    var option = document.createElement("option");
    option.value = val;
    option.text = val.charAt(0).toUpperCase() + val.slice(1);
    select.appendChild(option);
  }

  select.onchange = (e) => draw(e.target.value);

  draw(headers[2]);
})();
