

const d3 = require("d3");
const topojson = require("topojson-client");

import { Dataworker, Filetype } from 'dataworker';
import { memory } from "dataworker/dataworker_bg";

// linear colors
const dataVizColors = [
  '#aae6f0',
  '#71d2f1',
  '#39bdf3',
  '#00a9f4',
  '#027ab1',
  '#034b6f',
  '#051c2c',
]

// method to add bits to the UI
const buildLegend = () => {
  const legendId = "legend"
  // add a min value
  const min = document.createElement("span");
  min.id = "min";
  document.getElementById(legendId).append(min);
  // add a colored square for every single color we have
  dataVizColors.forEach((color) => {
    const square = document.createElement("div");
    square.classList.add("legend-block");
    square.style.backgroundColor = color;
    document.getElementById(legendId).append(square);
  });
  // add a max value
  const max = document.createElement("span");
  max.id = "max";
  document.getElementById(legendId).append(max);
}

const buildDesc = () => {
  const descId = "data";
  // add a total value
  const sum = document.createElement("h6");
  sum.id = "sum";
  document.getElementById(descId).append(sum);
  // add an average value
  const avg = document.createElement("h6");
  avg.id = "avg";
  document.getElementById(descId).append(avg);
}

//
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

const mapUrl = "https://raw.githubusercontent.com/nychealth/coronavirus-data/master/Geography-resources/MODZCTA_2010_WGS1984.geo.json";
const povertyUrl = "https://raw.githubusercontent.com/nychealth/coronavirus-data/master/by-poverty.csv";
const historyUrl = "https://api.github.com/repos/nychealth/coronavirus-data/commits?path=data-by-modzcta.csv";
const dataUrl = "https://raw.githubusercontent.com/nychealth/coronavirus-data/master/data-by-modzcta.csv";
// https://api.github.com/repos/nychealth/coronavirus-data/commits?path=data-by-modzcta.csv
// https://raw.githubusercontent.com/nychealth/coronavirus-data/cf508e8fe08ddff44a847c1b54209c598b88c913/data-by-modzcta.csv

const chartWidth = 860,
      chartHeight = 1060;

let data;

// setup UI
buildLegend();
buildDesc();

// (async () => {
//
//   // setup the map
//   const nyc = await d3.json(mapUrl);
//   const map = d3.select("#map").append("svg")
//       .attr("width", chartWidth)
//       .attr("height", chartHeight);
//
//   // turn our geodata into a lovely map
//   const path = d3.geoPath()
//       .projection(d3.geoConicConformal()
//       .parallels([33, 45])
//       .rotate([96, -39])
//       .fitSize([chartWidth, chartHeight], nyc));
//
//   // build a tooltip for our map
//   const tooltip = d3.select("#map").append("div")
//         .attr("class", "tooltip")
//         .style("opacity", 1);
//
//   // Setup the data
//   const covidMapDataChunk = await Dataworker.getData(dataUrl, Filetype.CSV);
//   const covidMapObj = covidMapDataChunk.to_object().CsvStruct;
//   const headers = covidMapDataChunk.keys();
//
//   let dataPointer = -1;
//   let dataLength = -1;
//   let mapData = [];
//
//   const floats = [];
//   const strings = [];
//
//   headers.forEach((header) => {
//     if (covidMapObj[0][header].match(/[a-zA-z]/)) {
//       strings.push(header);
//     } else if(covidMapObj[0][header].match(/\./)) {
//       floats.push(header);
//     }
//   });
//
//   // prep the method to do the actual drawing
//   const draw = (header) => {
//     let ptr;
//
//     // expose the column of the csv that we want
//     if (floats.includes(header))  {
//       ptr = covidMapDataChunk.expose_key_float(header);
//     } else if (strings.includes(header))  {
//       ptr = covidMapDataChunk.expose_key_string(header);
//     } else {
//       ptr = covidMapDataChunk.expose_key_int(header);
//     }
//
//     // if the data memory buffer needs to be changed at all
//     const length = covidMapDataChunk.length();
//     console.log(length, dataLength);
//     if ( dataPointer !== ptr || dataLength != length )  {
//       console.log("Creating new array buffer!");
//       mapData = new Uint32Array(memory.buffer, ptr, length);
//       dataPointer = ptr;
//       dataLength = length;
//     }
//
//     // sometimes we need to transform the data coming out
//     // this line totally breaks the map though
//     // mapData = mapData.map(n => Math.floor(covidMapDataChunk.transform(n)));
//
//     // various describers
//     const mapDataMin = covidMapDataChunk.min();
//     const mapDataMax = covidMapDataChunk.max();
//     const mapDataSum = covidMapDataChunk.sum();
//     const mapDataAvg = covidMapDataChunk.avg();
//
//
//     console.log(mapData, ptr, covidMapDataChunk.keys(), mapDataMin, mapDataMax);
//
//     document.getElementById('min').innerText = mapDataMin;
//     document.getElementById('max').innerText = mapDataMax;
//     document.getElementById('sum').innerText = `Total: ${mapDataSum}`;
//     document.getElementById('avg').innerText = `Average: ${Math.floor(mapDataAvg * 100) / 100}`;
//
//     const color = (d, i) => {
//       if(d.properties.MODZCTA == 99999) { return '#3aa573'; }
//       const n = buckets(mapData[i], mapDataMin, mapDataMax, dataVizColors.length);
//       return dataVizColors[n]
//     }
//
//     const t = map.transition()
//             .duration(750);
//
//     map.selectAll("path")
//         .data(nyc.features)
//         .join(
//           enter => enter.append("path")
//               .attr("d", path)
//               .attr( "fill", color)
//               .attr( "stroke", '#f0f0f0')
//               .attr("d", path)
//               .on("mouseover", function(d, i) {
//                 const record = covidMapObj[i];
//                 tooltip.transition()
//                 .duration(200)
//                 .style("opacity", .9);
//                 tooltip.html(`
//                   ${record['BOROUGH_GROUP']}: ${record['NEIGHBORHOOD_NAME']}<br>
//                   ${mapData[i]}
//                 `)
//                 .style("left", (d3.event.pageX) + "px")
//                 .style("top", (d3.event.pageY - 28) + "px");
//               })
//               .on("mouseout", function(d) {
//                 tooltip.transition()
//                 .duration(500)
//                 .style("opacity", 0);
//               }),
//           update => update
//               .attr( "fill", color)
//               .attr("d", path),
//           exit => exit
//               .remove()
//         );
//   }
//
//   // setup the select
//   const select = document.getElementById("fields");
//   for (const val of headers) {
//     var option = document.createElement("option");
//     option.value = val;
//     option.text = val.charAt(0).toUpperCase() + val.slice(1);
//     select.appendChild(option);
//   }
//   select.onchange = (e) => draw(e.target.value);
//
//   draw(headers[1]);
// })();




(async () => {

  const covidPovertyDataChunk = await Dataworker.getData(povertyUrl, Filetype.CSV);
  const headers = covidPovertyDataChunk.keys();

  const covidPovertyObj = covidPovertyDataChunk.to_object().CsvStruct;

  const id = "POVERTY_GROUP";

  let dataPointer = -1;
  let dataLength = -1;
  let povertyData = [];

  const floats = [];
  const strings = [];
  const ints = [];

  headers.forEach((header) => {
    let arr;

    if (covidPovertyObj[0][header].match(/[a-zA-z]/)) { arr = strings; }
    else if(covidPovertyObj[0][header].match(/\./)) { arr = floats; }
    else { arr = ints; }

    arr.push(header);
  });
  // console.log(covidPovertyDataChunk);
  console.log(d3.range(covidPovertyObj.length))
  console.log(covidPovertyDataChunk.max())

  const margin = {top: 30, right: 0, bottom: 30, left: 40};
  const height = 300;
  const width = 400;
  const bar = d3.select("#map").append("svg")
      .attr("viewBox", [0, 0, width, height]);

  const x = d3.scaleBand()
    .domain(d3.range(covidPovertyDataChunk.length()))
    .range([margin.left, width - margin.right])
    .padding(0.1)

  const y = d3.scaleLinear()
    .domain([0, covidPovertyDataChunk.max()]).nice()
    .range([height - margin.bottom, margin.top])

  const xAxis = g => g
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).tickFormat(i => covidPovertyObj[i][id]).tickSizeOuter(0))

  const yAxis = g => g
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).ticks(null))
    .call(g => g.select(".domain").remove())
    .call(g => g.append("text")
        .attr("x", -margin.left)
        .attr("y", 10)
        .attr("fill", "currentColor")
        .attr("text-anchor", "start")
        .text(header))

  bar
    .append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")

  bar
    .attr("class", "y axis")
    .append("text") // just for the title (ticks are automatic)
    .attr("transform", "rotate(-90)") // rotate the text!
    .attr("y", 6)
    .attr("dy", ".71em")
    .style("text-anchor", "end")
    .text("Frequency");
  // prep the method to do the actual drawing
  const draw = (header) => {
    let ptr;

    // expose the column of the csv that we want
    if (floats.includes(header))  {
      ptr = covidPovertyDataChunk.expose_key_float(header);
    } else if (strings.includes(header))  {
      ptr = covidPovertyDataChunk.expose_key_string(header);
    } else {
      ptr = covidPovertyDataChunk.expose_key_int(header);
    }

    // if the data memory buffer needs to be changed at all
    const length = covidPovertyDataChunk.length();
    console.log(length, dataLength, covidPovertyObj[0]['POVERTY_GROUP']);
    if ( dataPointer !== ptr || dataLength != length )  {
      console.log("Creating new array buffer!");
      povertyData = new Uint32Array(memory.buffer, ptr, length);
      dataPointer = ptr;
      dataLength = length;
    }

    bar.append("g")
        .attr("fill", dataVizColors[3])
      .selectAll("rect")
      .data(povertyData)
      .join(
        enter => enter
              .append("rect")
              .attr("x", (d, i) => x(i))
              .attr("y", d => y(d))
              .attr("height", d => y(0) - y(d))
              .attr("width", x.bandwidth()),
        update => update
              .attr("x", (d, i) => x(i))
              .attr("y", d => y(d))
              .attr("height", d => y(0) - y(d))
              .attr("width", x.bandwidth()),
        exit => exit
              .remove(),
      )

    bar.select('.x.axis').call(xAxis);

    // same for yAxis but with more transform and a title
    bar.select(".y.axis").call(yAxis)


  };

    // setup the select
    const select = document.getElementById("fields");
    for (const val of headers) {
      var option = document.createElement("option");
      option.value = val;
      option.text = val.charAt(0).toUpperCase() + val.slice(1);
      select.appendChild(option);
    }
    select.onchange = (e) => draw(e.target.value);

  draw(headers[1]);
})();
