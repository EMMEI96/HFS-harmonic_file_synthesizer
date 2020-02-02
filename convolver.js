

Filter = new Tone.Filter({
type: "lowpass",
frequency: 1000,
Q: 10,
gain: 1,
rolloff: -24
})

const rolloff_switch = document.getElementById("rolloff_toggle")
rolloff_switch.onchange = function (){
   var select = rolloff_switch.value
  if (!select){ Filter.rolloff = -24}
  if(select){Filter.rolloff=-12}
}


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