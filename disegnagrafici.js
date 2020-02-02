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

var wavesurfer = WaveSurfer.create({
    container: '#waveformi',
    waveColor: '#c0c0c0',
    progressColor: 'RGB(0,115,128)',
    normalize: 'true'
});

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
zoom_slider.oninput = function () {
  var zoomLevel = zoom_slider.value;
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