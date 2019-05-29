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
 * Initial value:
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

const PORT = process.env.PORT || 2875;
let savedData;

function handleServerStarted() {
  console.log(`Listening to :${PORT}`);
}

function readSavedDataJSON() {
  return readFile(
    path.join(__dirname, 'hits.json'),
    'utf8'
  );
}

function addIP(IP, _host, _url) {
  savedData.hitCount += 1;
  savedData.uniqueIPs = Array.from(new Set(savedData.uniqueIPs).add(IP));

  let fullURLString = `${_host}${_url}`;
  if (!fullURLString.split('//')[1]) {
    fullURLString = `http://${fullURLString}`;
  }
  let fullURL = new URL(fullURLString);
  let {
    pathname,
    hostname,
  } = fullURL;
  if (!savedData.hosts[hostname]) {
    savedData.hosts[hostname] = {
      hitCount: 0,
      uniqueIPs: [],
      urls: {},
    };
  }
  let hostObject = savedData.hosts[hostname];
  hostObject.hitCount += 1;
  hostObject.uniqueIPs = Array.from(new Set(hostObject.uniqueIPs).add(IP));

  if (!hostObject.urls[pathname]) {
    hostObject.urls[pathname] = {
      hitCount: 0,
      uniqueIPs: [],
      dates: {},
    };
  }
  let urlObject = hostObject.urls[pathname];
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

function handleServerRequest(request, response) {
  if (request.url === '/favicon.ico') {
    response.write('');
  } else {
    addIP(request.connection.remoteAddress, request.headers.host, request.url);
    saveDataToJSON(savedData);
    response.write(JSON.stringify(savedData, null, 2));
  }

  response.end();
}

(async function() {
  let savedDataJSON = await readSavedDataJSON();
  savedData = JSON.parse(savedDataJSON);

  let server = http.createServer(handleServerRequest);
  server.listen(
    PORT,
    handleServerStarted
  );
}());
