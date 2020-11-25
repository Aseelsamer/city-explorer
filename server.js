'use strict';

const express = require('express');
require('dotenv').config();

const server = express();
const pg = require('pg');
const client  = new pg.Client(process.env.DATABASE_URL);
const superagent = require('superagent');
// cors added
const cors = require('cors');
server.use(cors());

const PORT = process.env.PORT;

server.get('/', (req, res) => {
  res.send('Homepage');
});

server.get('/location', locationHandler);
server.get('/weather', weatherHandler);
server.get('/trails', trailHandler);

function locationHandler(req, res){
  let cityName = req.query.city;
  let locationToken =  process.env.LOCATION_KEY;
  let url = `https://us1.locationiq.com/v1/search.php?key=${locationToken}&q=${cityName}&format=json`;

  let SQL = `SELECT search_query, formatted_query, latitude, longitude FROM location WHERE search_query = '${cityName}'`;//it should match data in constructor
  client.query(SQL)// in order to run the query
    .then(result => {
      if(result.rowCount !== 0){//if yes(there is data)
        console.log(result);
        res.status(200).json(result.rows[0]);
      }else if(result.rowCount === 0){
        console.log('inside else');
        callLocationAPI(url, cityName)
          .then(locData => {
            console.log(locData);
            res.status(200).json(locData);
          });
        console.log('after callback function');
      }
    })
    .catch(error=>errorHandler(error, req, res));

  /*superagent.get(url)
    .then(data => {
      const locationObject = new Location(cityName, data.body);
      res.status(200).send(locationObject);
    })
    .catch(()=> {
      errorHandler('Location .. Something went wrong!!', req, res);
    });*/
}
function callLocationAPI(url, cityName){//we want to hit the server, nw data is in data.body
  return superagent.get(url)
    .then(data => {
      console.log('inside callback function');
      const locationObject = new Location(cityName, data.body);
      let insertSQL = `INSERT INTO location (search_query,formatted_query, latitude, longitude) VALUES ($1,$2,$3,$4)`;
      let safeValues = [locationObject.search_query,locationObject.formatted_query, locationObject.latitude,locationObject.longitude];
      client.query(insertSQL,safeValues)
        .then (() =>{
          console.log('your data has been added successfully!!');
        });
      console.log(locationObject);
      return locationObject;
    });
}
function weatherHandler(req, res){
  let cityName = req.query.search_query;
  let cityLat = req.query.lat;
  let cityLon = req.query.lon;

  console.log(req.query);
  let weatherKey = process.env.WEATHER_API_KEY;
  let url = `https://api.weatherbit.io/v2.0/forecast/daily?city=${cityName}&key=${weatherKey}&days=8&lat=${cityLat}&lon=${cityLon}`;
  superagent.get(url)
    .then(weatehrData => {
      let weatherObjcts =  weatehrData.body.data.map( w => {
        let weatherObject = new Weather(w);
        return weatherObject;
      });
      res.status(200).json(weatherObjcts);
    })
    .catch(()=> {
      errorHandler('Weather .. Something went wrong!!', req, res);
    });
}

function trailHandler(req, res){
  let trailLat = req.query.latitude;
  let trailLon = req.query.longitude;
  let trailsKey = process.env.TRAIL_API_KEY;
  let url = `https://www.hikingproject.com/data/get-trails?lat=${trailLat}&lon=${trailLon}&maxDistance=10&key=${trailsKey}`;

  superagent.get(url)
    .then(tarilsData => {
      let trailObjects = tarilsData.body.trails.map( t => {
        let trail = new Trail(t);
        return trail;
      });
      res.status(200).json(trailObjects);
    })
    .catch(() => {
      errorHandler('Trails .. Something went wrong!!', req, res);
    });
}

function errorHandler(error, req, res) {
  res.status(500).send(error);
}

function Location(city, locationData){
  this.search_query = city;
  this.formatted_query = locationData[0].display_name;
  this.latitude = locationData[0].lat;
  this.longitude = locationData[0].lon;
}

function Weather(weatehrData){
  this.forecast = weatehrData.weather.description;
  this.time = weatehrData.datetime;
}
function Trail(trailData){
  this.name = trailData.name;
  this.location = trailData.location;
  this.length = trailData.length;
  this.stars = trailData.stars;
  this.star_votes = trailData.starVotes;
  this.summary = trailData.summary;
  this.trail_url = trailData.url;
  this. conditions = trailData.conditionStatus;
  this.condition_date = trailData.conditionDate.split(' ')[0];
  this.condition_time = trailData.conditionDate.split(' ')[1];
}
server.get('*', (req, res) => {
  res.status(400).send('Not found');
});
server.use((error, req, res) => {
  res.status(500).send('Sorry, something went wrong');
});
client.connect()
  .then(() => {
    server.listen(PORT, ()=>{
      console.log(`Listening on port ${PORT}`);
    });
  });
=======
const cors = require('cors');

const server = express();
server.use(cors());


const PORT = process.env.PORT || 3000;

server.get('/location',(req,res)=>{
  const locationData = require('./data/location.json');
  console.log(locationData);
  const locationObj = new Location('Lynnwood',locationData);
  res.send(locationObj);//return
});

function Location(city,locData) {
  this.search_query = city;
  this.formatted_query=locData[0].display_name;
  this.latitude = locData[0].lat;
  this.longitude = locData[0].lon;
}


let weatherArray =[];
server.get('/weather',(req,res)=>{
  const weatherData = require('./data/weather.json');

  weatherData.data.forEach(el1 =>{
    let weatherObj= new Weather(el1);
  });
  res.send(weatherArray);
});

function Weather(weatherData){
  this.forecast=weatherData.weather.description;
  this.time=weatherData.datetime;
  weatherArray.push(this);
}


server.get('*', (req, res) => {
  res.status(404).send('not found');
});

server.use((error, req, res) => {
  res.status(500).send(error);
});



server.listen(PORT, () => {
  console.log(`Listening on PORT: ${PORT}`);
});

