const d3 = require("d3");
const topojson = require("topojson-client");

import { Dataworker, Filetype, Chunk } from 'dataworker';
import { memory } from "dataworker/dataworker_bg";

const errorCheckElem = (elem, id) => {if (!elem) { throw new Error(`UI is expecting an element with the following id :: ${id}`)}};

const getElem = (id) => {
  const elem = document.getElementById(id);
  errorCheckElem(elem, id);
  return elem;
};

// utility function to put an `tag element with `id into `parentId
const buildElem = (parentId, id, tag) => {
  const elem = document.createElement(tag);
  elem.id = id;
  document.getElementById(parentId).append(elem);
  return elem;
}

// linear colors
const dataVizColors = [
  '#aae6f0',
  '#71d2f1',
  '#39bdf3',
  '#00a9f4',
  '#027ab1',
  '#034b6f',
  '#051c2c',
];

const parkColor = '#d1f4dd';
const defaultId = 99999;

const chartWidth = 816,
      chartHeight = 1000;

const mapId = "#map";

const stringRegex = /[a-zA-z]/;
const stringPredicate = (field) => field.match(stringRegex);
const decimalRegex = /\./;
const decimalPredicate = (field) => field.match(decimalRegex);

// the formatters for our values
const averageText = (v) => `Average: ${v}`;
const sumText = (v) => `Total: ${v}`;
const dateText = (v) => `Date: ${v}`;

const mapDataIdentifier = (d) => d.properties.MODZCTA;

// formatter for the tooltip, record is a row in a csv
const generateMapTooltip = (record, val) => {
  let string = '';
  if ( record ) { string += `${record['BOROUGH_GROUP']}: ${record['NEIGHBORHOOD_NAME']}<br>`; }
  if ( val ) { string += val; }
  return string;
}

// this creates a method that will take in a bunch of data
// including map data, the colors, etc.
// if the current data element is default, it will return a given default color
const generateMapColorFunc = (data, min, max, colors, defaultId, defaultColor) => (d, i) => {
  if(mapDataIdentifier(d) == defaultId) { return defaultColor; }
  const n = buckets(data[i], min, max, colors.length);
  return colors[n];
}

// a given commit object holds the date with the timezone
const getDateFromCommit = (commit) => commit.commit.committer.date.split('T')[0];

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

const populateSelect = (select, headers) => {
  headers.map( header => {
    var option = document.createElement("option");
    option.value = header;
    option.text = header;
    select.appendChild(option);
  })
}

const asyncWait = async (count) => new Promise(resolve => setTimeout(resolve, count? count : 1000 ));

const utf8ArrayToStr = (array) => {
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
const min = getElem('min');
const max = getElem('max');
const sum = getElem('sum');
const avg = getElem('avg');
const date = getElem('date');

const loaderId = "loader";
const hiddenClass = "hidden";
const loaded = getElem("loaded");
const loading = getElem("loading");

const hideLoader = () => {
  const loader = document.getElementById(loaderId);
  loader.classList.add(hiddenClass);
}

const select = getElem("fields")
const range = getElem("date-slider");

let data;
(async () => {
  //
  // Setup the data
  //

  // first get all the commits for the file
  const historyDataChunk = await Dataworker.getData(historyUrl, Filetype.JSON);
  const historyData = historyDataChunk.to_object().JsonStruct;
  // turn each commit sha into a raw url
  const dataUrls = historyData.map((object) => buildRawUrl(object.sha));

  loaded.innerText = "0";
  loading.innerText = dataUrls.length;

  // start by initializing the first URL into the Chunk
  let covidMapDataChunk = await Dataworker.getData(dataUrls[0], Filetype.CSV);
  const covidMapObj = covidMapDataChunk.to_object().CsvStruct;
  const headers = covidMapDataChunk.keys();

  // then append each data url onto that chunk
  // this would be easier with ranges
  for ( let index in dataUrls) {
    if ( ++index === dataUrls.length ) continue;
    loaded.innerText = index;
    covidMapDataChunk = await Dataworker.append(dataUrls[index], Filetype.CSV, covidMapDataChunk);
  }

  const floats = [];
  const strings = [];
  const ints = [];
  // find out what sort of datatypes each header is
  headers.forEach((header) => {
    const field = covidMapObj[0][header];
    if (stringPredicate(field)) { strings.push(header); }
    else if(decimalPredicate(field)) { floats.push(header); }
    else { ints.push(header); }
  });

  // hide our loader
  hideLoader();

  //
  // Setup the UI
  //

  // setup the select with the new values
  populateSelect(select, ints.concat(floats));

  // setup the slider
  range.min = 0;
  range.max = covidMapDataChunk.count() - 1;
  range.value = 0;

  // get the map and setup the chart
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

  // prep the method to do the actual drawing
  const draw = () => {

    // get the input values
    const selectedHeader = select.options[select.selectedIndex].value;
    const selectedDate = range.value;
    covidMapDataChunk.select(selectedDate);
    let ptr;

    // expose the column of the csv that we want
    if (floats.includes(selectedHeader))  { ptr = covidMapDataChunk.expose_key_float(selectedHeader); }
    else if (strings.includes(selectedHeader))  { ptr = covidMapDataChunk.expose_key_string(selectedHeader); }
    else { ptr = covidMapDataChunk.expose_key_int(selectedHeader); }

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
    date.innerText = dateText(getDateFromCommit(historyData[selectedDate]));

    // for a given element, return a `legendColor based on min and max
    // or park color if the element matches the default id 99999
    // prototype :: mapColor(d, i) -> hexColorString
    const mapColor = generateMapColorFunc(mapData, mapDataMin, mapDataMax, legendColors, defaultId, parkColor);

    // D3 magic
    map.selectAll("path")
      .data(nyc.features)
      .join(
        enter => enter.append("path")
          .attr("d", path)
          .attr( "fill", mapColor)
          .attr( "stroke", '#f0f0f0')
          .attr("d", path)
          .on("mouseover", function(d, i) {
            tooltip.transition()
            .duration(200)
            .style("opacity", .9);
            tooltip.html(generateMapTooltip(covidMapObj[i], mapData[i]))
            .style("left", (d3.event.pageX) + "px")
            .style("top", (d3.event.pageY - 28) + "px");
          })
          .on("mouseout", function(d) {
            tooltip.transition()
            .duration(500)
            .style("opacity", 0);
          }),
        update => update
          .attr( "fill", mapColor)
          .attr("d", path),
        exit => exit
          .remove()
      );
  }

  // Add interactivity to the UI
  range.oninput = draw;
  select.onchange = draw;

  // kickoff the app!
  draw(headers[1]);
})();
