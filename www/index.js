

const d3 = require("d3");
const topojson = require("topojson-client");

import { Dataworker, Filetype, Chunk } from 'dataworker';
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

const errorCheckElement = (elem, id) => {if (!elem) { throw new Error(`UI is expecting an element with the following id :: ${id}`)}};

const parkColor = '#d1f4dd';

const chartWidth = 816,
      chartHeight = 1000;

const loaderId = "loader";
const hiddenClass = "hidden";

const selectId = "fields";
const rangeId = "date-slider";
const select = document.getElementById(selectId);
errorCheckElement(select, selectId);
const range = document.getElementById(rangeId);
errorCheckElement(range, rangeId);

const mapId = "#map";

const stringRegex = /[a-zA-z]/;
const decimalRegex = /\./;
const stringPredicate = (field) => field.match(stringRegex);
const decimalPredicate = (field) => field.match(decimalRegex);

const averageText = (v) => `Average: ${v}`;
const sumText = (v) => `Total: ${v}`;
const dateText = (v) => `Date: ${v}`;

const mapTooltip = (record, val) => {
  let string = '';
  if ( record ) { string += `${record['BOROUGH_GROUP']}: ${record['NEIGHBORHOOD_NAME']}<br>`; }
  if ( val ) { string += val; }
  return string;
}

const getDateFromCommit = (commit) => commit.commit.committer.date.split('T')[0];



//
// UI Bits
//

// utility function to put an `tag element with `id into `parentId
const buildElem = (parentId, id, tag) => {
  const elem = document.createElement(tag);
  elem.id = id;
  document.getElementById(parentId).append(elem);
  return elem;
}

// method to add bits to the UI
const buildLegend = (colors) => {
  const legendId = "legend"
  // add a min value
  buildElem(legendId, 'min', 'span');
  // add a colored square for every single color we have
  colors.forEach((color, i) => {
    const square = buildElem(legendId, `square-${i}`, 'div');
    square.classList.add("legend-block");
    square.style.backgroundColor = color;
  });
  // add a max value
  buildElem(legendId, 'max', 'span');
}

const buildDesc = () => {
  const descId = "data";
  ["sum", "avg", "date"].map((id) => buildElem(descId, id, 'p'))
}


//
// Mathy bits
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

const buildRawUrl = (sha) => `https://raw.githubusercontent.com/nychealth/coronavirus-data/${sha}/data-by-modzcta.csv`;
const mapUrl = "https://raw.githubusercontent.com/nychealth/coronavirus-data/master/Geography-resources/MODZCTA_2010_WGS1984.geo.json";
// const povertyUrl = "https://raw.githubusercontent.com/nychealth/coronavirus-data/master/by-poverty.csv";
const historyUrl = "https://api.github.com/repos/nychealth/coronavirus-data/commits?path=data-by-modzcta.csv";

// setup UI
const legendColors = dataVizColors;
buildLegend(legendColors);
buildDesc();

// these get created in the methods above
const min = document.getElementById('min');
const max = document.getElementById('max');
const sum = document.getElementById('sum');
const avg = document.getElementById('avg');
const date = document.getElementById('date');

let data;
(async () => {

  // first get all the commits for the file
  const historyDataChunk = await Dataworker.getData(historyUrl, Filetype.JSON);
  const historyData = historyDataChunk.to_object().JsonStruct;
  // turn each commit sha into a raw url
  const dataUrls = historyData.map((object) => buildRawUrl(object.sha));

  // Setup the data

  // start by initializing the first URL into the Chunk
  let covidMapDataChunk = await Dataworker.getData(dataUrls[0], Filetype.CSV);
  const covidMapObj = covidMapDataChunk.to_object().CsvStruct;
  const headers = covidMapDataChunk.keys();
  // then append each data url onto that chunk
  // this would be easier with ranges
  for ( let index in dataUrls) {
    if ( ++index === dataUrls.length ) continue;
    covidMapDataChunk = await Dataworker.append(dataUrls[index], Filetype.CSV, covidMapDataChunk);
  }

  // hide our loader
  const loader = document.getElementById(loaderId);
  loader.classList.add(hiddenClass);

  // setup the map
  const nyc = await d3.json(mapUrl);
  const map = d3.select(mapId).append("svg")
      .attr("width", chartWidth)
      .attr("height", chartHeight);

  // turn our geodata into a lovely map
  const path = d3.geoPath()
      .projection(d3.geoConicConformal()
      .parallels([33, 45])
      .rotate([96, -39])
      .fitSize([chartWidth, chartHeight], nyc));

  // build a tooltip for our map
  const tooltip = d3.select(mapId).append("div")
        .attr("class", "tooltip")
        .style("opacity", 1);

  let dataPointer = -1;
  let dataLength = -1;
  let mapData = [];

  // find out what sort of datatypes we have here
  const floats = [];
  const strings = [];
  headers.forEach((header) => {
    const field = covidMapObj[0][header];
    if (stringPredicate(field)) { strings.push(header); }
    else if(decimalPredicate(field)) { floats.push(header); }
  });

  // prep the method to do the actual drawing
  const draw = () => {

    const header = select.options[select.selectedIndex].value;
    const value = range.value;
    covidMapDataChunk.select(value);
    let ptr;

    // expose the column of the csv that we want
    if (floats.includes(header))  {
      ptr = covidMapDataChunk.expose_key_float(header);
    } else if (strings.includes(header))  {
      ptr = covidMapDataChunk.expose_key_string(header);
    } else {
      ptr = covidMapDataChunk.expose_key_int(header);
    }

    // check if the data memory buffer needs to be changed at all
    const length = covidMapDataChunk.length();
    if ( dataPointer !== ptr || dataLength != length )  {

      console.log(`Creating new array buffer! pointer at ${ptr} w/ length ${length}`);
      mapData = new Uint32Array(memory.buffer, ptr, length);
      dataPointer = ptr;
      dataLength = length;
    }


    // sometimes we need to transform the data coming out
    // this line totally breaks the map though
    // mapData = mapData.map(n => Math.floor(covidMapDataChunk.transform(n)));

    // various describers
    const mapDataMin = covidMapDataChunk.min();
    const mapDataMax = covidMapDataChunk.max();
    const mapDataSum = covidMapDataChunk.sum();
    const mapDataAvg = covidMapDataChunk.avg();


    console.log(mapData, ptr, covidMapDataChunk.keys(), mapDataMin, mapDataMax);

    min.innerText = mapDataMin;
    max.innerText = mapDataMax;
    sum.innerText = sumText(mapDataSum);
    avg.innerText = averageText(Math.floor(mapDataAvg * 100) / 100);
    date.innerText = dateText(getDateFromCommit(historyData[value]));

    const color = (d, i) => {
      if(d.properties.MODZCTA == 99999) { return parkColor; }
      const n = buckets(mapData[i], mapDataMin, mapDataMax, legendColors.length);
      return legendColors[n]
    }

    const t = map.transition()
            .duration(750);

    map.selectAll("path")
        .data(nyc.features)
        .join(
          enter => enter.append("path")
              .attr("d", path)
              .attr( "fill", color)
              .attr( "stroke", '#f0f0f0')
              .attr("d", path)
              .on("mouseover", function(d, i) {
                tooltip.transition()
                .duration(200)
                .style("opacity", .9);
                tooltip.html(mapTooltip(covidMapObj[i], mapData[i]))
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 28) + "px");
              })
              .on("mouseout", function(d) {
                tooltip.transition()
                .duration(500)
                .style("opacity", 0);
              }),
          update => update
              .attr( "fill", color)
              .attr("d", path),
          exit => exit
              .remove()
        );
  }

  // setup the select
  for (const val of headers) {
    var option = document.createElement("option");
    option.value = val;
    option.text = val.charAt(0).toUpperCase() + val.slice(1);
    select.appendChild(option);
  }
  select.onchange = draw;

  // setup the slider
  range.min = 0;
  range.max = covidMapDataChunk.count() - 1;
  range.oninput = draw;
  range.value = 0;

  draw(headers[1]);
})();
