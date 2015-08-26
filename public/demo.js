console.log("Welcome to the audio analysis demo for the online e-learning platform easydrum")

var microponeNode = null;
var scriptProcessorNode = null;
var audioCtx = null;
var BUFFER_SIZE = 4096;
var c = null;
var ctx = null;
var rafID = null;
var data = [];

/** 
    initialize audio analyzer
*/
$(function () {
    initVisualization();
    initAudioContext();
    initMicrophoneInput();
    rafID = window.requestAnimationFrame(updateVisualization);
});

/** 
    initialize requestAnimationFrame and canvas
*/
function initVisualization() {
    //using requestAnimationFrame instead of timeout...
    if (!window.requestAnimationFrame)
      window.requestAnimationFrame = window.webkitRequestAnimationFrame;

    $("#demo").append('<canvas id="visualisation" width="'+(window.innerWidth-25)+'" height="300" style="background:black;"></canvas><br>');
    c = document.getElementById("visualisation");
    ctx = c.getContext("2d");
}

/**
    initialize web audio api audio context and nodes
*/
function initAudioContext() {
    //creates audio context.
    audioCtx = new AudioContext();
    // custom script processor node, which gets channel data from the audio stream   
    scriptProcessorNode = audioCtx.createScriptProcessor(BUFFER_SIZE, 1, 1); 
    scriptProcessorNode.onaudioprocess = onAudioProcess;
}

/** 
    on audio process
*/
function onAudioProcess(e){
    data = new Float32Array(BUFFER_SIZE);
    data = e.inputBuffer.getChannelData (0);

    //TODO:
    //insert onset detection
}

/**
    initialize audio navigator microphone input
*/
function initMicrophoneInput(){
    //handle different types navigator objects of different browsers
    if (!!(navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia)) {      
        navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
    } else {
        alert('getUserMedia() is not supported in your browser');        
    }
    //get microphone input
    navigator.getUserMedia({audio: true, video: false}, 
        //success
        handleMicrophoneInput, 
        //failed    
        function () {
            console.log('capturing microphone data failed!');
            console.log(evt);
        }
    );
}

/** 
	handle microphone input
*/
function handleMicrophoneInput(stream){
    console.log("capturing microphone data ...");
	//convert audio stream to mediaStreamSource (node)
    microphoneNode = audioCtx.createMediaStreamSource(stream);
    microphoneNode.connect(scriptProcessorNode);   
}

/** 
    update visualization
*/
function updateVisualization() {
    var width = c.width;
    var height = c.height;
    var scale_x = BUFFER_SIZE/width;
    var _data = data; // contains sine wave with values beween -1 and 1
    ctx.clearRect(0, 0, c.width, c.height);
    for (var i = 0; i < BUFFER_SIZE; i++) {
        var value = _data[i]*height/2;
        var left = Math.round(i/scale_x);
        var top = 0;
        if(value < 0){
            value = Math.abs(value);
            top = Math.round(value + height/2);
        }else{
            top = Math.round(height/2 - value);
        }
        ctx.fillStyle = "red";
        ctx.fillRect(left, top, 1, 1);
    }
    //update visualisation
    rafID = window.requestAnimationFrame(updateVisualization);
}

