var GifMachine = null;

var first = -1;
var last = -1;
$(".subtitle").click(function(){
  var n = $(this).index();
  if( first == -1 && last == -1) {
    first = n;
    last = n;
  }
  else if( n === last ) first = last;
  else if( n === first ) last = first;
  else if( n < first ) first = n;
  else if( n > last ) last = n;
  else if( n < last && n > first) {
    if( last-n < n-first ) last = n;
    else first = n;
  }
  console.log(first,last);
  $(".subtitle").removeClass("active");
  $(".subtitle").slice(first,last+1).addClass("active");
  refreshGif();
});
$("#gif img").load(function(){
  $(this).css("opacity",1.0);
  $(".spinner").hide();
});

function allDidLoad(frames, timeDiff){
  console.log("allDidLoad");
  if(GifMachine) {
    GifMachine.abort();
    GifMachine = null;
  }
  GifMachine = new GIF({workerScript:"js/gif.worker.js"});
  GifMachine.on('finished', function(blob) {
    $("#gif img").attr("src",URL.createObjectURL(blob));
  });
  var delay = Math.min(timeDiff/frames.length,150);
  for(var i = 0; i < frames.length; i++){
    GifMachine.addFrame(frames[i],{delay:delay});
  }
  GifMachine.render();
}

function refreshGif(){
  var starttime = $(".active:first").data("starttime");
  var endtime = $(".active:last").data("endtime");
  console.log(starttime,endtime);

  var NFRAMES = 30;
  var timestamps = _.range(starttime, endtime, parseInt((endtime-starttime)/NFRAMES,10)); // 30 frames?
  var filenames = timestamps.map(function(t){ return "http://gifgifgif.arqball.com.s3.amazonaws.com/30rock/107/"+_.str.sprintf("%08d.png",t); });
  var backupFilenames = timestamps.map(function(t){ return "png/"+_.str.sprintf("%08d.png",t); });

  var nTimestampsRemaining = timestamps.length;
  var frames = new Array(timestamps.length);
  var cacheMiss = function(){
    this.src = this.backupFilename;
  };
  var oneDidLoad = function(){
    nTimestampsRemaining--;
    if(nTimestampsRemaining <= 0)
      allDidLoad(frames, endtime-starttime);
  };
  for(var i = 0; i < timestamps.length; i++){
    frames[i] = new Image();
    frames[i].crossOrigin = true;
    frames[i].onload = oneDidLoad;
    frames[i].onerror = cacheMiss;
    frames[i].backupFilename = backupFilenames[i];
    frames[i].src = filenames[i];
  }
  $(".spinner").show();
  $("#gif img").css("opacity",0.2);
}