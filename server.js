'use strict';
// Application Dependencies
const express = require('express');
//CORS = Cross Origin Resource Sharing
const cors = require('cors');
//DOTENV (read our enviroment variable)
require('dotenv').config();
const superagent = require('superagent');
// Application Setup
const PORT = process.env.PORT || 3030;
const app = express();
app.use(cors());
//Routes
app.get('/location', locationHandlerFunc);
app.get('/weather', getWeather);
app.get('/trails', trailsHandler);
app.get('*', notFoundPageHandler);
app.use(errorHandler);
// https://city-explorer-backend.herokuapp.com/location?city=amman
function locationHandlerFunc(req, res) {
    // ? -> query string parameteres
    let cityName = req.query.city;
    // to get data from api server -> request url + key
    let locKey = process.env.LOCATION_KEY;
    let url = `https://eu1.locationiq.com/v1/search.php?key=${locKey}&q=${cityName}&format=json`;
    // superagent: client-side HTTP request library
    // console.log('before the superagent');
    superagent.get(url)
        .then(data => {
            // console.log('inside the superagent');
            // console.log(data.body);
            let locationData = new Location(cityName, data.body);
            res.send(locationData);
        })
        .catch(() => {
            errorHandler('Location .. Something went wrong!!', req, res);
        });
    // console.log('after the superagent');
}
function Location(city, geoData) {
    this.search_query = city;
    this.formatted_query = geoData[0].display_name;
    this.latitude = geoData[0].lat;
    this.longitude = geoData[0].lon;
}
//  creating a function for location
function getWeather(req, res) {
    console.log(req.query);
//   let city = req.query.search_query;
  let cityName = req.query.search_query;
  let lat = req.query.latitude;
  let lon = req.query.longitude;
  let wthrKye = process.env.WETHER_KEY;
  let weatherDaily =[];
  let days =5;
  let weatherUrl = `https://api.weatherbit.io/v2.0/forecast/daily?city=${cityName}&lat=${lat}&lon=${lon}&key=${wthrKye}&days=${days}`;

//   let weatherDescription = [];
  // let jsonData = require('./data/weather.json');
  superagent.get(weatherUrl)
  .then(data => {
    //   console.log(data);
   weatherDaily = data.body.data.map(val => {
       return new Weather(val);
    });
    res.send(weatherDaily);
}).catch(() => {
    // res.status(500).send('Sorry, something went wrong');
    errorHandler('Weather .. Something went wrong!!', req, res);
  });
}
function Weather(weatheData) {
  this.forecast = weatheData.weather.description;;
  this.time =  weatheData.datetime;
}
function trailsHandler(req, res) {
  let lat = req.query.latitude;
  let lon = req.query.longitude;
  let triKye = process.env.TRAIL_KEY;
  let triUrl = `https://www.hikingproject.com/data/get-trails?lat=${lat}&lon=${lon}&maxDistance=200&key=${triKye}`;
  superagent.get(triUrl)
  .then(data => {
    let availableTrails = data.body.trails.map(val => {
      return new Trail(val);
    });
    res.status(200).send(availableTrails);
  }).catch(() => {
    errorHandler('Trail .. Something went wrong!!', req, res);
  });
}
function Trail(data) {
  this.name = data.name;
  this.location = data.location;
  this.length = data.length;
  this.stars = data.stars;
  this.star_votes = data.starVotes;
  this.summary = data.summary;
  this.trail_url = data.url;
  this.conditions = data.conditionStatus;
  this.condition_date = data.conditionDate.split(' ')[0];
  this.condition_time = data.conditionDate.split(' ')[1];
}
function notFoundPageHandler(req, res) {
    res.status(404).send('Not Found');
}
function errorHandler(error, req, res) {
    res.status(500).send(error);
}
app.listen(PORT, () => {
    console.log(`listening on port ${PORT}`)
})