/*
 * Hits Shape:
 *

{
  "hitCount": 0,
  "uniqueIPs": [],

  "urls": {
    "/": {
      "hitCount": 0,
      "uniqueIPs": [],

      "dates": {
        "20190217": {
          "hitCount": 0,
          "uniqueIPs": [],
        }
      }
    }
  }
}

 *
 * Initial shape:
 *

{
  "uniqueIPs": [],
  "hitCount": 0,
  "hosts": {}
}

 *
 */

let http = require('http');
let fs = require('fs');
let path = require('path');
let { promisify } = require('util');

let readFile = promisify(fs.readFile);
let writeFile = promisify(fs.writeFile);

const PORT = 3000;
let savedData;

function handleServerStarted() {
  console.log(`Listening to :${PORT}`);
}

function handleServerRequest(request, response) {
  addIP(request.connection.remoteAddress, request.headers.host, request.url);
  saveDataToJSON(savedData);
  response.write(JSON.stringify(savedData, null, 2));
  response.end();
}

function readSavedDataJSON() {
  return readFile(
    path.join(__dirname, 'hits.json'),
    'utf8'
  );
}

function addIP(IP, host, url) {
  savedData.hitCount += 1;
  savedData.uniqueIPs = Array.from(new Set(savedData.uniqueIPs).add(IP));

  if (!savedData.hosts[host]) {
    savedData.hosts[host] = {
      hitCount: 0,
      uniqueIPs: [],
      urls: {},
    };
  }
  let hostObject = savedData.hosts[host];
  hostObject.hitCount += 1;
  hostObject.uniqueIPs = Array.from(new Set(hostObject.uniqueIPs).add(IP));

  if (!hostObject.urls[url]) {
    hostObject.urls[url] = {
      hitCount: 0,
      uniqueIPs: [],
      dates: {},
    };
  }
  let urlObject = hostObject.urls[url];
  urlObject.hitCount += 1;
  urlObject.uniqueIPs = Array.from(new Set(urlObject.uniqueIPs).add(IP));

  let dateNow = new Date();
  let dateString = `${
    `${dateNow.getUTCFullYear()}`.padStart(5, 0)
  }${
    `${dateNow.getUTCMonth()}`.padStart(2, 0)
  }${
    `${dateNow.getUTCDate()}`.padStart(2, 0)
  }`;

  if (!urlObject.dates[dateString]) {
    urlObject.dates[dateString] = {
      hitCount: 0,
      uniqueIPs: [],
    };
  }
  urlObject.dates[dateString].hitCount += 1;
  urlObject.dates[dateString].uniqueIPs =
    Array.from(new Set(urlObject.dates[dateString].uniqueIPs).add(IP));
}

function saveDataToJSON(updatedData) {
  return writeFile(
    path.join(__dirname, 'hits.json'),
    JSON.stringify(updatedData),
    'utf8'
  );
}

(async function() {
  let savedDataJSON = await readSavedDataJSON();
  savedData = JSON.parse(savedDataJSON);

  let server = http.createServer(handleServerRequest);
  server.listen(PORT, handleServerStarted);
}());
