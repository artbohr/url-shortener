'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var dns = require('dns');
var cors = require('cors');
var bodyParser = require('body-parser');

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;
mongoose.connect(process.env.MONGO_URI, { useMongoClient: true });

app.use(cors());

app.use('/public', express.static(process.cwd() + '/public'));
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

const urlSchema = mongoose.Schema({
  originalUrl : {type: String, required: true},
  newUrl : String
});

const URL = mongoose.model('URL',urlSchema);

app.post('/api/shorturl/new', function(req, res){
  // slice the input if "http" is found in it
  if (req.body.url.includes("http")) req.body.url = req.body.url.slice(req.body.url.indexOf("://")+3);
  // check if the input is a working url, if not respond with "wrong domain" msg
  dns.lookup(req.body.url, function (err, address, family) {
    if (err) {
      res.send({ error: "invalid URL"});
    } else {
      // create num for the short url
      const newRandomURL = (Math.floor(Math.random() * 10000000)).toString();
      
      const urlForm = new URL({
        originalUrl : req.body.url,
        newUrl : newRandomURL
      });
      // save to db
      urlForm.save(); 
      // send json response with original and short url
      res.send({"original_url":req.body.url, "short_url": `https://url-shortener-mserv.glitch.me/api/shorturl/${newRandomURL}`});
    }
  }); 
});
// redirect to original url if the provided shorturl is correct (stored in DB)
app.get('/api/shorturl/:url(*)', function(req, res){
  const toFind = req.params.url;
  
  URL.findOne({ 'newUrl': toFind })
    .then(doc=>doc !== null? res.redirect("http://"+doc.originalUrl) : res.send({"message": null}))
    .catch(err=> res.send({message: err}))
});


app.listen(port, function () {
  console.log('Node.js listening ...');
});
