var video = document.querySelector('video');
var caption = video.querySelector('track[kind=captions]');

var lyricsDisplay = document.querySelector('.lyrics');
var captionsHidden = document.querySelector('.captions-hidden');

var xhr = new XMLHttpRequest();
xhr.open('GET', caption.src);
xhr.onreadystatechange = function() {
  if (xhr.readyState === 4) {
    parseLyrics(xhr.responseText);
  }
};
xhr.send();

var cues = [];
var dataObjects = [];
//var regions = [];

function parseLyrics(caption) {
  var parser = new WebVTT.Parser(window, WebVTT.StringDecoder());

  parser.oncue = function(cue) {
    dataObjects.push(splitCue(cue));
  };
  // parser.onregion = function(region) {
  //   regions.push(region);
  // }
  parser.onparsingerror = function(error) {
    console.log(error);
  }

  parser.parse(caption);
  parser.flush();
  WebVTT.processCues(window, cues, captionsHidden);
  //console.log(dataObjects);
}

video.addEventListener('timeupdate', function() {
  var ct = video.currentTime;

    while(lyricsDisplay.firstChild){
      lyricsDisplay.removeChild(lyricsDisplay.firstChild);
    }

  dataObjects.filter(function(item) {
    return item.cue.startTime <= ct && item.cue.endTime >= ct;
  }).forEach(function(item) {
    lyricsDisplay.appendChild(item.el);

    let times = item.times.map((c, i) => { return {time: c, index: i}; })
    .filter(c => c.time <= ct);

    times.forEach(c => {
        document.querySelector(`#f${c.index}`).style.backgroundColor = 'yellow';
    });

    if(times.length> 0){
        document.querySelector(`#f${times[times.length-1].index}`).style.backgroundColor = 'orange';
    }
    
  });
});


let t= /<[0-9]{2}:[0-9]{2}:[0-9]{2}[.]{0,1}[0-9]{0,}>/g

function splitCue(cue){

    let text = cue.text;

    let fragments = text.split(t);
    let times = text.match(t);
    times = times || [];

    times = times.map(c => c.substr(1, 8))
    .map(t => {
        let segments = t.split(':');
        return segments[0]*3600 + segments[1]*60 + +segments[2];
    });
    
    let html = '';

    let i = 0;
    fragments.forEach(f => {
        html += `<span id="f${i}">${f}</span>`;
        i++;
    });

    let container = document.createElement('div');
    container.innerHTML = html;

    let dataObject = {
        el: container,
        cue: cue,
        times: [cue.startTime, ...times]
    };

    return dataObject;
}