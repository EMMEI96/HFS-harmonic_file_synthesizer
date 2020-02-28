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
var myArrayBuffer2;
var convolver;
var reader2= new FileReader();
var env = {
  attack: 1.0,
  decay: 1.0,
  sustain: 0.5,
  release: 1.5
};

//Convolver
const impulses = ["autoconv","FileConv","impulse1","impulse2","impulse3","impulse4"];
const impulses_ref =[smallBuffer, myArrayBuffer2,"./impulses/impulse1.mp3","./impulses/impulse2.mp3","./impulses/impulse3amp.mp3","./impulses/impulse4.mp3"];

const impulse_file = document.querySelector("#forCon");
impulse_file.onchange = function(event) {
   var fileList = impulse_file.files;
   var file;
   for (let i = 0; i < fileList.length; i++) {
     // get item
    file = fileList.item(i);
    reader2.readAsArrayBuffer(file)
    reader2.onload = function(evt) {
      audioData = evt.target.result;
      audioCtx.decodeAudioData(audioData, function(buf) {
        myArrayBuffer2 = buf;
      })
    }
   }  
}

const impulsesDropdown = document.getElementById("impulsesDropdown");
var impulse_selector=0 ;
for(var item in impulses) {
    var option = document.createElement("option");
    option.innerHTML = impulses[item];
    // This will cause a re-flow of the page but we don't care
    impulsesDropdown.appendChild(option);
  };
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
}

//ADSR

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
  env.release = Number($("#releaseRange").val())+0.01;
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

createEnvelope(); //creates preset envelope

//////////////////////////////////////////////////////////
 
//functions for the interface  


function createPlayers(){
  stop_players();
  impulses_ref[0] = smallBuffer;
  impulses_ref[1] = myArrayBuffer2;
  convolver = new Tone.Convolver(impulses_ref[impulse_selector]);
  convolver.wet.value = drywet.value / 100;
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
var chords_span = document.getElementById("chord_type");

function set_chords(){
  player1.detune = pitch + dati[Mode.value][cadence.value][chord.value]["player1"]
  player2.detune = pitch + dati[Mode.value][cadence.value][chord.value]["player2"]
  player3.detune = pitch + dati[Mode.value][cadence.value][chord.value]["player3"]
  chords_span.innerText = chords_explained[Mode.value][cadence.value][chord.value]["write"]
 
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



//modes input setting
document.querySelector("#monitor").innerText = "PHRYGIAN"
const Mode = document.querySelector("#mode_input")
Mode.addEventListener('input',actions);
Mode.addEventListener('change',actions);
function mode_input(){
  document.querySelector("#monitor").innerText = modes[Mode.value]
  set_chords();
}

//chord input setting
const chord=document.querySelector("#chord_input");
const knob = document.getElementsByTagName('webaudio-knob')
for ( let i = 0; i<knob.length; i++){
 knob[i].addEventListener('input',actions,false);
 knob[i].addEventListener('change',actions,false);
}

//variations input setting
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

//keyboard settings
var keyboard=document.getElementById("keyboard");
keyboard.addEventListener('change',actions,false);
keyboard.addEventListener('note',actions,false);

keyboard.keycodes1 = [90,88,67,86,66,78,77,65,83,68,70,71,72,74,75,76,81,87,69,82,84,89,85,73,79,80,49,50,51,52,53,54,55,56,57,48];
keyboard.keycodes2 = [];

//using computer keyboard leads to some problems of the library. if setNote is used you need to reclick on the piano keyboard
//therefore we lose information about when the key goes up so we manually fix it
$(document).keyup(function(e) { 
if (keyboard.keycodes1.indexOf(e.keyCode) >= 0){
    kcode_position = keyboard.keycodes1.indexOf(e.keyCode);
    knote_position = 36+kcode_position;
    keyboard.setNote(0,knote_position + (dati[Mode.value][cadence.value][chord.value]["player1"])/100);
    keyboard.setNote(0,knote_position + (dati[Mode.value][cadence.value][chord.value]["player2"])/100);
    keyboard.setNote(0,knote_position + (dati[Mode.value][cadence.value][chord.value]["player3"])/100);
    envelope.triggerRelease();
    controller = false;
    playing = false;
 }
})

//this is the function called for the events of webAudio components
//polling

function actions(e){
 if(buffer) {
  if(e.target.id=="mode_input") {
    mode_input()
  }

  if(e.target.id=="keyboard") {
   str=e.type + " : " + e.target.id + " : [" + e.note + "] ";
   
   if(e.note[0]==1){

    playing=true;

    keyboard.setNote(1,e.note[1]+(dati[Mode.value][cadence.value][chord.value]["player1"])/100);
    keyboard.setNote(1,e.note[1]+(dati[Mode.value][cadence.value][chord.value]["player2"])/100);
    keyboard.setNote(1,e.note[1]+(dati[Mode.value][cadence.value][chord.value]["player3"])/100);

    pitch = 100*(e.note[1]-55);
    createPlayers();
    envelope.triggerAttack();
    set_chords();
    //set_chords plays some games with setNote to allow vision of changing chords
    //I manually fix it
    if(controller){
      keyboard.setNote(0,notes[notes.length-1]+(dati[Mode.value][cadence.value][chord.value]["player1"])/100);
      keyboard.setNote(0,notes[notes.length-1]+(dati[Mode.value][cadence.value][chord.value]["player2"])/100);
      keyboard.setNote(0,notes[notes.length-1]+(dati[Mode.value][cadence.value][chord.value]["player3"])/100);
      
      keyboard.setNote(1,e.note[1]+(dati[Mode.value][cadence.value][chord.value]["player1"])/100);
      keyboard.setNote(1,e.note[1]+(dati[Mode.value][cadence.value][chord.value]["player2"])/100);
      keyboard.setNote(1,e.note[1]+(dati[Mode.value][cadence.value][chord.value]["player3"])/100);
    }
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
 {
 set_chords();
 } 
          
 }
}

var past=[false,false,false];

webAudioControlsMidiManager.addMidiListener(function(e) {
 
 if(smallBuffer){
   
  if(e.data[0]==144){
    playing = true;
   keyboard.setNote(1,e.data[1]+(dati[Mode.value][cadence.value][chord.value]["player1"])/100);
   keyboard.setNote(1,e.data[1]+(dati[Mode.value][cadence.value][chord.value]["player2"])/100);
   keyboard.setNote(1,e.data[1]+(dati[Mode.value][cadence.value][chord.value]["player3"])/100);
  
   
   pitch = 100*(e.data[1]-55);
   createPlayers();
   set_chords();
   envelope.triggerAttack();
   if(controller){
    keyboard.setNote(0,notes[notes.length-1]+(dati[Mode.value][cadence.value][chord.value]["player1"])/100);
    keyboard.setNote(0,notes[notes.length-1]+(dati[Mode.value][cadence.value][chord.value]["player2"])/100);
    keyboard.setNote(0,notes[notes.length-1]+(dati[Mode.value][cadence.value][chord.value]["player3"])/100);

    keyboard.setNote(1,e.data[1]+(dati[Mode.value][cadence.value][chord.value]["player1"])/100);
    keyboard.setNote(1,e.data[1]+(dati[Mode.value][cadence.value][chord.value]["player2"])/100);
    keyboard.setNote(1,e.data[1]+(dati[Mode.value][cadence.value][chord.value]["player3"])/100);
  }
   notes.push(e.data[1]);
   
   controller = true;
   past.push(controller);
  }
  
  if(e.data[0] == 128) {
    notes=[];
    keyboard.setNote(0,e.data[1]+(dati[Mode.value][cadence.value][chord.value]["player1"])/100);
    keyboard.setNote(0,e.data[1]+(dati[Mode.value][cadence.value][chord.value]["player2"])/100);
    keyboard.setNote(0,e.data[1]+(dati[Mode.value][cadence.value][chord.value]["player3"])/100);
    
    if( (past[past.length-2] && past[past.length-1]) == false ){ 
      envelope.triggerRelease();
      for(let i =0; i< players.length; i++){
        players[i].stop();
      }
    }

    playing=false;
    controller = false;
    past.push(controller);
  }
 }  
});
