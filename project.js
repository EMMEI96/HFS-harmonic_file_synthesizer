console.clear();

var audioCtx = new Tone.Context 
Tone.setContext(audioCtx)
var smallBuffer;
var buffer;
//disegnagrafici
var main_wv;
var reader = new FileReader();
var smooth;//smoother input variable 
var smooth_old = 0;
var x =[];//array where we copy buffer data
var u;//float32array for copying buffer
var y=[];//regions pointer
var y_old=[];//memory regions
var y_oldend=[];
var startReg;
var endReg;
var diff;
var reversed = false;
var firstclone = true;

//Convolver
var myArrayBuffer2;
var convolver;
var reader2= new FileReader();
//file reader
Filter = new Tone.Filter({
type: "lowpass",
frequency: 1000,
Q: 10,
gain: 1,
rolloff: -24
})


var wavesurfer = WaveSurfer.create({
        container: '#waveformi',
        waveColor: '#c0c0c0',
        progressColor: 'RGB(0,115,128)',
        normalize: 'true'
    });
//

WebAudioControlsOptions={useMidi:1};





const c = document.querySelector("#forCon")
c.onchange = function(event) {
   var fileList = forCon.files;
   var file;
   for (var i = 0; i < fileList.length; i++) {
     // get item
    file = fileList.item(c);
    reader2.readAsArrayBuffer(file)
    reader2.onload = function(evt) {
      audioData = evt.target.result;
      audioCtx.decodeAudioData(audioData, function(buf) {
        myArrayBuffer2 = buf;
      })
    }
   }  
}
var urls = ["https://github.com/David-Badiane/stufff/blob/master/impulse2.mp3"]

////////FILE READER 
const i = document.querySelector("#myfile");
i.onchange = function(event) {
  
   var fileList = myfile.files;
   var file;
   for (var i = 0; i < fileList.length; i++) {
    file = fileList.item(i);
    reader.readAsArrayBuffer(file)
    reader.onload = function(evt) {
      audioData = evt.target.result;
      audioCtx.decodeAudioData(audioData, function(buffer_role) {
        buffer = buffer_role;
        y_old = [];
        y_oldend = []; 
        firstclone = true;
        reversed=false;
        loadBuffer(buffer);
        wavesurfer.clearRegions();
        var timeline = Object.create(WaveSurfer.Timeline);
        timeline.init({
          wavesurfer: wavesurfer,
          container: '#waveform-timeline'
        });
        wavesurfer.playPause();
         smallBuffer = buffer_role;
        console.log(smallBuffer);
        console.log(wavesurfer.backend.buffer)
      })
    }
   }
}

/////////////REGIONS SETTINGS 
wavesurfer.on('finish', function() {
  wavesurfer.playPause();
});

wavesurfer.on('ready', function() {
  //enables to drag and create regions
  wavesurfer.enableDragSelection({
    color:'hsla(51, 100%, 50%, 0.1)',
    loop:'true',
    id : "sample"
  });
  
 //limits the number of possible regions to 1 
  wavesurfer.on("region-created", function(region) {
          wavesurfer.clearRegions();
        });
});

///////SLIDERS,BUTTONS

//sliders
const zoom_slider = document.querySelector('#zoomslider');
zoom_slider.onchange = function () {
  var zoomLevel = Number(slider.value);
  wavesurfer.zoom(zoomLevel);
};
const smoother = document.querySelector("#fadein")
//smoother 
smoother.oninput = function() {
  if(firstclone) {
    y[0] = 0;
    y[1] = buffer.length;
    smallBuffer = audioCtx.createBuffer(buffer.numberOfChannels, y[1]-y[0], audioCtx.sampleRate);
    smoothing(smallBuffer);
    y=[];  
  }
  
  if(!firstclone) {
    smoothing(smallBuffer);
  } 
}
smoother.onchange = function() {
  wavesurfer.playPause()
}

//buttons
start.onclick = function() {
  wavesurfer.playPause();
}
reversing.onclick = function(){
 if(!firstclone){
   riversati();
   wavesurfer.playPause();
 }
}
save.onclick = function() {
  smoother.value =0;
  savereg("sample");
  clone(smallBuffer);
  redraw(smallBuffer);
  
  if(reversed){
  reverse(smallBuffer)
  loadBuffer(smallBuffer)
  }
  
  console.log("region status")
  console.log(reversed)
  wavesurfer.playPause();
}
waveforming.onclick = function (){
  y_old = [];
  smoother.value=0;
  y_oldend=[];
  reversed=false;
  firstclone = true;
  loadBuffer(buffer);
  wavesurfer.clearRegions();
  var timeline = Object.create(WaveSurfer.Timeline);
  timeline.init({
    wavesurfer: wavesurfer,
    container: '#waveform-timeline'
  });
  
  wavesurfer.playPause();
}

///////FUNCTIONS

//loadBuffer loads the target buffer into wavesurfer
function loadBuffer(obj){
wavesurfer.empty()
this.wavesurfer.loadDecodedBuffer(obj);
wavesurfer.drawBuffer(obj);
}
//the function savereg saves the start/end parameters of the regions and creates the buffers with proper buffer length
function savereg(id) {
  y= [];
  if (wavesurfer.regions.list["sample"]) {
  var region = wavesurfer.regions.list[id];
  if(!reversed){
    y.push(region.start);
    y.push(region.end);
  }
  if(reversed){
  var distance = (y_oldend[y_oldend.length-1] -y_old[y_old.length-1])/audioCtx.sampleRate;
  y.push(distance-region.end);
  y.push(distance-region.start);
  }
    
  for (let i = 0; i < y.length; i++){
    y[i] = Math.round(y[i] * audioCtx.sampleRate)
  }
  
  y_old.push(y[0])
  y_oldend.push(y[1])
  
  
  smallBuffer = audioCtx.createBuffer(buffer.numberOfChannels, y[1]-y[0], audioCtx.sampleRate)
  }
  if (y == []) { alert ("you gotta create a region")}
  }
//the function clone puts a copy of the region in the target buffer
function clone (smallBuf){
for(let index=0; index<smallBuf.numberOfChannels; index++ )
{ 
  main_wv = buffer.getChannelData(index);
  if(firstclone){
   for (let i =y[0]; i < y[1]; i++)
   {
    var n = i - y[0] 
    x[n] = main_wv[i];
   }
   u = new Float32Array(x) 
   smallBuf.copyToChannel(u, index, 0);
   firstclone = false;
  }
  
  if(!firstclone){
   startReg=0;
   for (let i =0; i<y_old.length; i++)
   {
    startReg += y_old[i];
   }
   
   for (let i = startReg; i <startReg + y[1]; i++){
    var n = i - startReg 
    x[n] = main_wv[i];
   }
  
  u = new Float32Array(x) 
  smallBuf.copyToChannel(u, index, 0);
   
  }
 }
}
//smoothing of the target buffer
function smoothing(buf) {
 clone(buf)
 if(reversed) {reverse(buf)}
 smooth = parseInt(smoother.value)/1000
 diff = smooth - smooth_old
 
 for (let index =0; index < buf.numberOfChannels; index++){
  var t = buf.getChannelData(index)
  for (let i =0; i < t.length; i++){
   
   if(i <= t.length*smooth){
    t[i] = t[i] * (i/(t.length*smooth))**1.03
    t[t.length-i] = t[t.length-i] * ((i/(t.length*smooth))**1.03);
   }
 
   if(i > t.length*smooth)
   {
    t[i] = t[i] ;
   }
  }
 }  
 loadBuffer(buf);
  
 var timeline = Object.create(WaveSurfer.Timeline);
 timeline.init({
  wavesurfer: wavesurfer,
  container: '#waveform-timeline'
 });   
 smooth_old = smooth;
}
//redraws the smallBuf
function redraw(smallBuf) {
  loadBuffer(smallBuf);
  wavesurfer.clearRegions();
  var timeline = Object.create(WaveSurfer.Timeline);

  timeline.init({
    wavesurfer: wavesurfer,
    container: '#waveform-timeline'
  });  
}
//reverses the target buffer
function reverse(buf){
  for(let index=0; index< buf.numberOfChannels; index++)
  {
   main_wv = buf.getChannelData(index)
   for (let i =0; i < buf.length; i++){
    var n = buf.length - 1 - i;
    x[i] = main_wv[n];
  }
  u = new Float32Array(x) 
  buf.copyToChannel(u, index, 0);
 }
 }

//logic for reversing
function riversati() { 

 if (firstclone == false) {  
  reversed =! reversed
  reverse(smallBuffer)
  loadBuffer(smallBuffer)
 } 
}

/////////////////////////////////////////////////



function getData(url) {
  console.log("starting")
  var request = new XMLHttpRequest();

  request.open('GET', url, true);

  request.responseType = 'arraybuffer';

  request.onload = function() {
    var audioData = request.response;
    console.log("loadaed")
    audioCtx.decodeAudioData(audioData, function(buffer) {
        myArrayBuffer2 = buffer;
      console.log("loaded", data)

      },

      function(e){ console.log("Error with decoding audio data" + e.err); });

  }
  request.setRequestHeader("Content-Type","multipart/form-data");
  request.send();
  console.log("loading")
}


var filters = { "lowpass": {
      q: true,
      gain: false
    }, "highpass": {
      q: true,
      gain: false 
    }, "bandpass": {
      q: true,
      gain: false 
    }, "highshelf": { 
      q: false,
      gain: true 
    }, "allpass": {
      q: true,
      gain: false
    }, "peaking": {
      q: true,
      gain: true
    }
  };

  
  var filtersDropdown = document.getElementById("filtersDropdown"); 
const filter_knobs = document.querySelectorAll('.filter_knob')
for ( let i = 0; i<filter_knobs.length; i++){
 filter_knobs[i].addEventListener('input',filter_actions,false);
 filter_knobs[i].addEventListener('change',filter_actions,false);
}

  for(var item in filters) {
    var option = document.createElement("option");
    option.innerHTML = item;
    // This will cause a re-flow of the page but we don't care
    filtersDropdown.appendChild(option);
  };

 var frequencyBars = 100;
  // Array containing all the frequencies we want to get
  // response for when calling getFrequencyResponse()
  var myFrequencyArray = new Float32Array(frequencyBars);
  for(var m = 0; m < frequencyBars; ++m) {
    myFrequencyArray[m] = 2000/frequencyBars*(m+1);
  }
  
  // We receive the result in these two when calling
  // getFrequencyResponse()
  var magResponseOutput = new Float32Array(frequencyBars); // magnitude
  var phaseResponseOutput = new Float32Array(frequencyBars);




function filter_actions(e){
 if(buffer) {
 if(e.target.id=="frequencySlider") {
    Filter.frequency.value = this.value; 
    Filter.getFrequencyResponse();
 }

 if(e.target.id=="gainSlider") {
    Filter.gain.value = this.value;
    Filter.getFrequencyResponse();
    }
  

  if(e.target.id=="qSlider") {
    Filter.Q.value = this.value; 
    Filter.getFrequencyResponse();
  }          
 }
}



 function filterClicked (event) {
    event = event || window.event;
    var target = event.target || event.srcElement;
    var filterName = target.value;
    Filter.type = filterName;
    Filter.getFrequencyResponse();
    qSlider.disabled = !filters[filterName].q;
    gainSlider.disabled = !filters[filterName].gain;
  };
  filtersDropdown.addEventListener("change", filterClicked, false);
//////////////////////////////////////////////////////


var envelope;
var convolver;
var players=[];
var canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");
var player1;
var player2;
var player3;
var playing = false;
var total;
var current;
var attacking = false;
var osc;
var modes = ["PHRYGIAN","MIXOLYDIAN","DORIAN","LYDIAN","LOCRIAN"]

var controller = false;
var notes =[];
var str = ""

var env = {
  attack: 1.0,
  decay: 1.0,
  sustain: 0.5,
  release: 1.5
};


const impulses = ["FileConv","autoconv","impulse1","impulse2","impulse3","impulse4"];
const impulses_ref =[myArrayBuffer2,smallBuffer,"","","",""];

 var impulsesDropdown = document.getElementById("impulsesDropdown"); 

  for(var item in impulses) {
    var option = document.createElement("option");
    option.innerHTML = impulses[item];
    // This will cause a re-flow of the page but we don't care
    impulsesDropdown.appendChild(option);
  };



var impulse_selector=0 ;
function impulseClicked (event) {
    event = event || window.event;
    var target = event.target || event.srcElement;
    impulse_selector = impulses.indexOf(target.value);
    
  };
impulsesDropdown.addEventListener("change", impulseClicked, false);
const drywet = document.getElementById("drywet");

drywet.oninput = function()
{
  convolver.wet.value = drywet.value / 100;
  console.log(convolver.wet.value);
}



function drawAxis() {
  ctx.save();
  ctx.beginPath();
  ctx.lineWidth = 2;
  ctx.moveTo(60, 25);
  ctx.lineTo(60, 250);
  ctx.lineTo(480, 250);
  ctx.strokeStyle = "rgba(255,0,0,0.0)";
  ctx.stroke();
  ctx.closePath();
  
  // Max Amplitude Dotted Line
  ctx.beginPath();
  ctx.lineCap = "butt";
  ctx.moveTo(48, 44);
  ctx.lineTo(640, 44);
  ctx.setLineDash([2, 2]);
  ctx.lineWidth = 2;
  ctx.strokeStyle = "lightgrey";
  ctx.stroke();
  ctx.closePath();
  ctx.restore();

  // Amp max
  ctx.font = "bold 18px arial";
  ctx.fillStyle = "lightgrey";
  ctx.fillText("Amp", 25, 42);
  ctx.font = "bold 15px arial";
  ctx.fillText("max", 62, 42);

  // Amplitude
  ctx.save();
  ctx.translate(50, 145);
  ctx.rotate(-Math.PI / 2);
  ctx.font = "bold 22px serif";
  ctx.restore();

}

function drawArrowhead(x, y, radians, size) {
  ctx.save();
  ctx.beginPath();
  ctx.translate(x, y);
  ctx.rotate(radians);
  ctx.moveTo(0, 0);
  ctx.lineTo(size/1.5, size * 1.7);
  ctx.lineTo(-size/1.5, size * 1.7);
  ctx.fillStyle = "black";
  ctx.fill();
  ctx.closePath();
  ctx.restore();
}

function draw() {
  // reset variables
  total = env.attack + env.decay + env.release+env.sustain;
  current = 32;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Attack
  ctx.beginPath();
  ctx.lineCap = "round";
  ctx.moveTo(32, 250);
  ctx.lineTo(env.attack*50 + current, 50);
  current += env.attack *50

  // Decay
  ctx.quadraticCurveTo(current ,250-env.sustain*200,  env.decay *100+ current,250-env.sustain*200)
  current += env.decay * 100;

  // Sustain
  ctx.lineTo(current + 250, 250 - env.sustain * 200);
  current += 100;

  // Release
  ctx.quadraticCurveTo(current+170,249 ,(env.release+0.001)/total*300+200+current,250);
  current += env.release / total * 300;
  ctx.stroke();

  // stroke
  ctx.lineWidth = 5;
  ctx.strokeStyle = "lightgrey";
  ctx.lineJoin = "round";
  ctx.stroke();
  ctx.closePath();

  // RELEASE LINES
  if (env.release != 0) {
    // vertical release
    ctx.beginPath();
    ctx.lineWidth = 8.5;
    ctx.strokeStyle = "rgb(60,0,0)";
    if(env.release / total > .1){
      // horizontal release
      ctx.moveTo(current + 205, 20);
      current -= env.release / total * 300;
      ctx.lineTo(current +150, 20);
      ctx.stroke();
      ctx.closePath();
      if(env.release / total > .16){
        // R
        ctx.font = "bold 22px arial";
        ctx.fillStyle = "rgb(60,0,0)";
        ctx.textAlign = "center";
        ctx.fillText("R", current+230, 16);
      }
    } else{
      ctx.stroke();
      ctx.closePath();
      current -= env.release / total * 300;
    }
  }

  // key released
 if(env.release!=0){
  ctx.beginPath();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "black";
  ctx.stroke();
  drawArrowhead(current+150, 232, 0, 6);
  ctx.font = "bold 18px arial";
  ctx.fillStyle = "black";
  ctx.textAlign = "center";
  ctx.fillText("key", current+150, 268);
  ctx.fillText("released", current+150, 285);
  ctx.closePath();
  
  // SUSTAIN LINES
  // vertical sustain black
  ctx.beginPath();
  ctx.moveTo(current+150, 250);
  ctx.lineTo(current+150, 24);
  ctx.stroke();
  ctx.closePath();}
  
  if (env.sustain != 0) {
    ctx.beginPath();
    // horizontal sustain
    ctx.moveTo(current+150, 20);
    current -= 100;
    ctx.lineTo(current , 20);
    ctx.lineWidth = 7;
    ctx.strokeStyle = "rgb(45,0,0)";
    ctx.stroke();
    ctx.closePath();
    if(env.sustain > 0.1){
      //S
      ctx.font = "bold 22px arial";
      ctx.fillStyle = "rgb(45,0,0)";
      ctx.textAlign = "center";
      ctx.fillText("S", current + 130, 16);
    }
  } else {
    current -= 100;
  }

  // DECAY LINES
  if (env.decay != 0) {
    // vertical decay
    ctx.beginPath();
    ctx.lineWidth = 5.5;
    ctx.strokeStyle = "rgb(30,0,0)";
    if(env.decay / total > .1){
      // horizontal decay
      ctx.moveTo(current , 20);
      current -= env.decay *100
      ctx.lineTo(current , 20);
      ctx.stroke();
      ctx.closePath();
      // arrowhead
      if(env.decay > .05){
        // D
        ctx.font = "bold 22px arial";
        ctx.fillStyle = "rgb(30,0,0)";
        ctx.textAlign = "center";
        ctx.fillText("D", current + 50, 16);
      }
    } else{
      ctx.stroke();
      ctx.closePath();
      current -= env.decay / total * 300;
    }
  }

  // ATTACK LINES
  if (env.attack != 0) {
    // vertical attack
    ctx.beginPath();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgb(0,0,0)";
    if(env.attack / total > .1){
      // horizontal attack
      ctx.moveTo(current , 20);
      current -= env.attack * 30;
      ctx.lineTo(32 , 20);
      ctx.stroke();
      ctx.closePath();
      // arrowhead
      if(env.attack / total > .16){
        // A
        ctx.font = "bold 22px arial";
        ctx.fillStyle = "rgb(0,0,0)";
        ctx.textAlign = "center";
        ctx.fillText("A", current + 20, 16);
      }
    } else{
      ctx.stroke();
      ctx.closePath()
      current -= env.attack *30;
    }
  }

  drawAxis();
}
draw();



$("#attackRange").on("input", function() {
  if(!playing){
    env.attack = Number($("#attackRange").val());
    createEnvelope();
    draw();
  }
});

$("#decayRange").on("input", function() {
  if(!playing){
  env.decay = Number($("#decayRange").val());
  createEnvelope();
  draw();
  }
});

$("#sustainRange").on("input", function() {
  if(!playing){
  env.sustain = Number($("#sustainRange").val());
  createEnvelope();
  draw();
  }
});

$("#releaseRange").on("input", function() {
  if(!playing){
  env.release = Number($("#releaseRange").val());
  createEnvelope();
  draw();
  }
})

var master_volume = document.getElementById('mastervolume')
mastervolume.oninput = function () {
  Tone.Master.volume.value = master_volume.value
}

function createEnvelope() {
envelope = new Tone.AmplitudeEnvelope({
    attack: env.attack,
    decay: env.decay,
    sustain: env.sustain,
    release: env.release
  }).toMaster()
}

//////////////////////////////////////////////////////////
 
  


function createPlayers(){
  stop_players();
  impulses_ref[0] = myArrayBuffer2;
  impulses_ref[1] = smallBuffer;
  convolver = new Tone.Convolver(impulses_ref[impulse_selector]);
  convolver.wet.value = drywet.value / 100;

  convolver.buffer =myArrayBuffer2;
  players=[];
  player1 = new Tone.GrainPlayer(smallBuffer);
  player2 = new Tone.GrainPlayer(smallBuffer);
  player3 = new Tone.GrainPlayer(smallBuffer);
  players.push(player1);
  players.push(player2);
  players.push(player3);
  
  for(let i=0; i<players.length; i++){
   players[i].grainSize = 0.15;
   players[i].playbackRate = 1;
   players[i].overlap = 0.1;
   players[i].loop = true;
   players[i].connect(convolver);
  }
  
  convolver.connect(Filter);
  
 
  
  Filter.getFrequencyResponse();
   Filter.connect(envelope);  
    player1.start();
    player2.start();
    player3.start(); 
}

function stop_players(){
  for(let i=0; i<players.length; i++){
   players[i].stop() 
  }
}
document.querySelector("#monitor").innerText = "PHRYGIAN"
const Mode = document.querySelector("#mode_input")
Mode.addEventListener('input',actions);
Mode.addEventListener('change',actions);

function mode_input(){
  document.querySelector("#monitor").innerText = modes[Mode.value]
  set_chords();
}

//cadence input setting

const cadence=document.querySelector("#cadence_input");

cadence.oninput=function(){
  
  if(buffer){
  set_chords();
  }

 }
cadence.onchange=function(){
  cadence.value=0;
  set_chords();
}

const chord=document.querySelector("#chord_input");
const knob = document.getElementsByTagName('webaudio-knob')
for ( let i = 0; i<knob.length; i++){
 knob[i].addEventListener('input',actions,false);
 knob[i].addEventListener('change',actions,false);
}


function set_chords(){
  player1.detune = pitch + dati[Mode.value][cadence.value][chord.value]["player1"]
  player2.detune = pitch + dati[Mode.value][cadence.value][chord.value]["player2"]
  player3.detune = pitch + dati[Mode.value][cadence.value][chord.value]["player3"]
 
  if(playing){
    if(controller){
    for(let i = 36;i<= 84; i++){
     keyboard.setNote(0,i)
    }
   
   keyboard.setNote(1,notes[notes.length-1]+(dati[Mode.value][cadence.value][chord.value]["player1"])/100);
   keyboard.setNote(1,notes[notes.length-1]+(dati[Mode.value][cadence.value][chord.value]["player2"])/100);
   keyboard.setNote(1,notes[notes.length-1]+(dati[Mode.value][cadence.value][chord.value]["player3"])/100);
   }
 }
  
  if (chord.value==0) {
    player2.mute = true;
    player3.mute = true
    if(cadence.value != 0)
      {player2.mute = false; player3.mute = false}
  }
  if (chord.value !=0) {
    player2.mute = false; player3.mute = false}
} 




var keyboard=document.getElementById("keyboard");
keyboard.addEventListener('change',actions,false);
keyboard.addEventListener('note',actions,false);

keyboard.keycodes1 = [90,88,67,86,66,78,77,65,83,68,70,71,72,74,75,76,81,87,69,82,84,89,85,73,79,80,49,50,51,52,53,54,55,56,57,48];
keyboard.keycodes2 = [];


createEnvelope() ;
//using computer keyboard leads to some problems of the library. if setNote is used you need to reclick on the piano keyboard
$(document).keyup(function(e) { 
if (keyboard.keycodes1.indexOf(e.keyCode) >= 0){
  console.log("b");
    position = keyboard.keycodes1.indexOf(e.keyCode);
    keyboard.setNote(0,36+position + (dati[Mode.value][cadence.value][chord.value]["player1"])/100);
    keyboard.setNote(0,36+position + (dati[Mode.value][cadence.value][chord.value]["player2"])/100);
    keyboard.setNote(0,36+position + (dati[Mode.value][cadence.value][chord.value]["player3"])/100);
    envelope.triggerRelease();
    controller = false;
    playing = false;
 }
})




function actions(e){
 if(buffer) {
  if(e.target.id=="mode_input") {
    mode_input()
  }

  if(e.target.id=="keyboard") {
   str=e.type + " : " + e.target.id + " : [" + e.note + "] ";console.log(str);
   
   if(e.note[0]==1){
    playing=true;
    keyboard.setNote(1,e.note[1]+(dati[Mode.value][cadence.value][chord.value]["player1"])/100);
    keyboard.setNote(1,e.note[1]+(dati[Mode.value][cadence.value][chord.value]["player2"])/100);
    keyboard.setNote(1,e.note[1]+(dati[Mode.value][cadence.value][chord.value]["player3"])/100);
    keyboard.click()
    if(controller){
     if(notes[notes.length-1] != notes[notes.length-2]){
      envelope.triggerRelease()
      stop_players();
     }
    }
    pitch = 100*(e.note[1]-55);
   
    createPlayers();
    envelope.triggerAttack();
    set_chords();
    notes.push(e.note[1])
    controller = true
   }

   if(e.note[0] == 0) {
    notes=[]
    keyboard.setNote(0,e.note[1]+(dati[Mode.value][cadence.value][chord.value]["player1"])/100);
    keyboard.setNote(0,e.note[1]+(dati[Mode.value][cadence.value][chord.value]["player2"])/100);
    keyboard.setNote(0,e.note[1]+(dati[Mode.value][cadence.value][chord.value]["player3"])/100);
    envelope.triggerRelease();
    playing=false;
    controller = false  
  }          
 }

 else
 set_chords();           
 }
}

webAudioControlsMidiManager.addMidiListener(function(e) {
 console.log(e.data);
 if(smallBuffer){
   
  if(e.data[0]==144){
    playing = true;
    console.log("b")
   if(controller){
    if(notes[notes.length-1] != notes[notes.length-2]){
     envelope.triggerRelease();
     stop_players();
    }
   }
   keyboard.setNote(1,e.data[1]+(dati[Mode.value][cadence.value][chord.value]["player1"])/100);
   keyboard.setNote(1,e.data[1]+(dati[Mode.value][cadence.value][chord.value]["player2"])/100);
   keyboard.setNote(1,e.data[1]+(dati[Mode.value][cadence.value][chord.value]["player3"])/100);
   pitch = 100*(e.data[1]-55);
   createPlayers();
   set_chords();
   envelope.triggerAttack();
   notes.push(e.data[1]);
   controller = true;
  }
  
  if(e.data[0] == 128) {
    keyboard.setNote(0,e.data[1]+(dati[Mode.value][cadence.value][chord.value]["player1"])/100);
    keyboard.setNote(0,e.data[1]+(dati[Mode.value][cadence.value][chord.value]["player2"])/100);
    keyboard.setNote(0,e.data[1]+(dati[Mode.value][cadence.value][chord.value]["player3"])/100);
    playing=false;
    notes=[];
    keyboard.setNote(0,e.data[1]);
    controller = false;
    envelope.triggerRelease();
  }
 }  
});

const dati = {0://phrygian
              {0: 
               {0:{player1:0, player2:0,player3:0},
                   1:{player1:0, player2:300,player3:700},
                   2:{player1:0,player2:100,player3:700},
                   3:{player1:0,player2:400,player3:800},
                   4:{player1:0,player2:700,player3:1000} 
               },
                     
               1:  {0:{player1:100, player2:800, player3:1200},
                    1:{player1:100, player2:800, player3:1200},
                    2:{player1:100, player2:800, player3:1200},
                    3:{player1:100, player2:800, player3:1200},
                    4:{player1:100, player2:800, player3:1200}
                    },
               2:  {
                    0:{player1:-200, player2:100, player3:500},
                    1:{player1:-200, player2:100, player3:500},
                    2:{player1:-200, player2:100, player3:500},
                    3:{player1:-200, player2:100, player3:500},
                    4:{player1:-200, player2:100, player3:500}
               },
               3:  { 
                   0:{player1:-100, player2:600, player3:1000},
                   1:{player1:-100, player2:600, player3:1000},
                   2:{player1:-100, player2:600, player3:1000},
                   3:{player1:-100, player2:600, player3:1000},
                   4:{player1:-100, player2:600, player3:1000}}
              
              },
              
        1://mixolydian
               {0: 
               {0:{player1:0, player2:0,player3:0},
                1:{player1:0, player2:400,player3:700},
                2:{player1:0,player2:400,player3:1000},
                3:{player1:0,player2:200,player3:500},
                4:{player1:0,player2:500,player3:1000} 
               },
                  
               1:{ 
                 0:{player1:-200, player2:200, player3:900},
                 1:{player1:-200, player2:200, player3:900},
                 2:{player1:-200, player2:200, player3:900},
                 3:{player1:-200, player2:200, player3:900},
                 4:{player1:-200, player2:200, player3:900}
               },
               2:{
                0:{player1:200, player2:700, player3:1200},
                1:{player1:200, player2:700, player3:1200},
                2:{player1:200, player2:700, player3:1200},
                3:{player1:200, player2:700, player3:1200},
                4:{player1:200, player2:700, player3:1200}
                  },
               3:{
                 0:{player1:-200, player2:200, player3:700},
                 1:{player1:-200, player2:200, player3:700},
                 2:{player1:-200, player2:200, player3:700},
                 3:{player1:-200, player2:200, player3:700},
                 4:{player1:-200, player2:200, player3:700}
               }
              },
        2://dorian
               {0:{
                 0:{player1:0, player2:0,player3:0},
                 1:{player1:0,player2:300,player3:700},
                 2:{player1:0,player2:300,player3:900},
                 3:{player1:0,player2:700,player3:1400},
                 4:{player1:0,player2:500,player3:1000} 
               },
                  
                1:{
                 0:{player1:200, player2:500, player3:1200},
                 1:{player1:200, player2:500, player3:1200},
                 2:{player1:200, player2:500, player3:1200},
                 3:{player1:200, player2:500, player3:1200},
                 4:{player1:200, player2:500, player3:1200}
                 },
               2:{
                  0:{player1:-200,player2:500, player3:900},
                  1:{player1:-200,player2:500, player3:900},
                  2:{player1:-200,player2:500, player3:900},
                  3:{player1:-200,player2:500, player3:900},
                  4:{player1:-200,player2:500, player3:900}
                 },
               3: {
                  0:{player1:300, player2:700, player3:1000},
                  1:{player1:300, player2:700, player3:1000},
                  2:{player1:300, player2:700, player3:1000},
                  3:{player1:300, player2:700, player3:1000},
                  4:{player1:300, player2:700, player3:1000}
                  }
              },
              
        3://lydian
               {0: 
               {0:{player1:0, player2:0,player3:0},
                1:{player1:0,player2:400,player3:700},
                2:{player1:0,player2:600,player3:900},
                3:{player1:0,player2:700,player3:1100},
                4:{player1:0,player2:200,player3:900} 
               },
                  
                1:{
                 0:{player1:-100,player2:300,player:900},
                 1:{player1:-100,player2:300,player:900},
                 2:{player1:-100,player2:300,player:900},
                 3:{player1:-100,player2:300,player:900},
                 4:{player1:-100,player2:300,player:900}
                 },
               2:{
                 0:{player1:200, player2:600, player:900},
                 1:{player1:200, player2:600, player:900},
                 2:{player1:200, player2:600, player:900},
                 3:{player1:200, player2:600, player:900},
                 4:{player1:200, player2:600, player:900}
                  },
               3:{
                 0:{player1:0, player2:200, player:500},
                 1:{player1:0, player2:200, player:500},
                 2:{player1:0, player2:200, player:500},
                 3:{player1:0, player2:200, player:500},
                 4:{player1:0, player2:200, player:500}
                 }
              },
                
        4://locrian
               {0: 
               {0:{player1:0, player2:0,player3:0},
                1:{player1:0,player2:300,player3:1000},
                2:{player1:0,player2:600,player3:900},
                3:{player1:0,player2:500,player3:800},
                4:{player1:0,player2:600,player3:1000} 
               },
                  
               1:{
                 0:{player1:200, player2:600, player3:800},
                 1:{player1:200, player2:600, player3:800},
                 2:{player1:200, player2:600, player3:800},
                 3:{player1:200, player2:600, player3:800},
                 4:{player1:200, player2:600, player3:800}
               },
               2:{
                 0:{player1:-200, player2:200, player3:600},
                 1:{player1:-200, player2:200, player3:600},
                 2:{player1:-200, player2:200, player3:600},
                 3:{player1:-200, player2:200, player3:600},
                 4:{player1:-200, player2:200, player3:600}
                },
               3:{
                 0:{player1:-100, player2:200, player3:500},
                 1:{player1:-100, player2:200, player3:500},
                 2:{player1:-100, player2:200, player3:500},
                 3:{player1:-100, player2:200, player3:500},
                 4:{player1:-100, player2:200, player3:500}
               }
              }
}
