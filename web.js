var srt = require("subtitles-parser");
var fs = require("fs-extra");
var _ = require('underscore');
_.str = require('underscore.string');
_.mixin(_.str.exports());
var exec = require('child_process').exec;
var async = require('async');

var argv = require('yargs').argv;

var secrets = require('./secrets');

// AWS
var AWS = require('aws-sdk');
AWS.config.update(secrets.aws);
var s3 = new AWS.S3();
var s3bucket = "gifgifgif.arqball.com";

// var elasticsearch = require('elasticsearch');
// var es = new elasticsearch.Client({
//   host: 'localhost:9200',
//   log: 'trace'
// });

//var moviedb = require('moviedb')('64f08c9e3a526326dd6f09d5e0972769');

var express = require('express');
var app = express();

var ejs = require('ejs');

var txt = fs.readFileSync( "30.rock.107.tracy.does.conan.hdtv.xvid.notv.srt" ).toString();
var subtitles = srt.fromSrt(txt , true);

fs.ensureDir("png");

function createPng(timestamp, filename, cb){
  if(fs.existsSync("./png/"+filename)) {
    cb(); return;
  }
  var cmd = ["ffmpeg","-ss",timestamp/1000,"-i","tpz-30rock107.avi","-q:v","1","-frames:v 1","png/"+filename].join(" ");
  console.log(cmd);
  exec(cmd,cb);
}

function sendPng(timestamp, res){
  var filename = _.sprintf("%08d.png",timestamp);
  createPng(timestamp, filename, function(err){
    if(err) {
      console.error("[!] Could not create PNG. ",filename);
      console.dir(err);
      res.status(500).end();
      return;
    }
    res.sendFile(filename,{root:'./png/'},function(err){
      if(err) {
        console.error("[!] Could not send PNG. ",filename);
        res.status(500).end();
        return;
      }

      // upload to S3 for caching
      var opts = {
        Bucket: s3bucket,
        ACL:"public-read",
        Key: "30rock/107/"+filename,
        Body: fs.readFileSync("png/"+filename)
      };
      s3.putObject(opts, function(err,data){
        if(err){
          console.error("[!] Could not upload to S3. ",filename);
          console.dir(err);
        }
        fs.unlink("png/"+filename);
      });

    });
  });
}

app.get("/",function(req, res){
  var indexHtml = fs.readFileSync( "index.ejs" ).toString();
  res.send(ejs.render(indexHtml,{subtitles:subtitles, filename:function(t){
    return _.str.sprintf("%08d.png",t);
  }}));
});

app.get("/png/:start",function(req,res){
  var timestamp = parseInt(req.params["start"],10);
  sendPng(timestamp,res);
});

// Serve static assets
app.get("/js/:f",function(req,res){
  res.sendFile(req.params["f"],{root:'./js/'});
});
app.get("/css/:f",function(req,res){
  res.sendFile(req.params["f"],{root:'./css/'});
});

var server = app.listen(3000, function() {
  console.log('Listening on port %d', server.address().port);
});