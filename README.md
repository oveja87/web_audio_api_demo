# Audio Analysis
--------------------------------------
inspired by http://www.berlinpix.com/blog/reader/items/frequenzanalyse-mit-html5-und-web-audio-api.html

## Connect to the API

### WebRTC 1.0: Real-time Communication Between Browsers
http://dev.w3.org/2011/webrtc/editor/webrtc-20111004.html

Allows to get a multimedia stream (video, audio, or both) from local devices (video cameras, microphones, Web cams) or from prerecorded files provided by the user.

	interface NavigatorUserMedia {
	    void getUserMedia (DOMString options, NavigatorUserMediaSuccessCallback? successCallback, optional NavigatorUserMediaErrorCallback? errorCallback);
	};

getUserMedia prompts the user for permission to use their Web cam or other video or audio input.

The options argument is a string of comma-separated values, each of which is itself a space-separated list of tokens, the first token of which is from the following list:

"audio" - The provided media needs to include audio data.
"video" - The provided media needs to include video data.

- produces a media stream, which can be processed by the MediaStreamAudioSourceNode node of the web audio api.


	//handle different types navigator objects of different browsers
    if (!!(navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia)) {      
        navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
    } else {
        alert('getUserMedia() is not supported in your browser');        
    }

    navigator.getUserMedia({audio: true, video: false}, 
        //success
        handleMicrophoneInput, 
        //failed    
        function () {
            console.log('capturing microphone data failed!');
            console.log(evt);
        }
    );




Um überhaupt etwas mit Audioverarbeitung machen zu können, brauchen wir eine Instanz des AudioContext Interface, welches den Knotenpunkt unserer Anwendung darstellt. Hierbei dürfen wir nicht vergessen, die verschiedenen Präfixe der Browser zu berücksichtigen, in diesem Fall Firefox und Chrome.

	//handle different prefix of the audio context
	var AudioContext = AudioContext || webkitAudioContext;
	//create the context.
	var context = new AudioContext();


## Get Microphone Input

Die Methode "getUserMedia" beschafft uns einen Stream der gewünschten Quelle. Da diese per Standard auch einen Videostream der Notebook-Kamera zur Verfügung stellt, müssen wir explizit angeben, dass wir diesen nicht brauchen, sondern nur den Sound.

Callback-Funktion für den Erfolg oder Misserfolg des Capturing. Bei Erfolg wird die Methode "handleMicrophoneInput" ausgeführt.

Die Methode bekommt als Parameter ein Objekt vom Typ MediaStream, was der Audio-Stream unserer Quelle (z.B. Notebook-Mikrofon) ist. Mittels der Methode "createMediaStreamSource" wird daraus ein Node-Objekt gemacht, dessen Output wir an den Analyser-Node hängen können.

Zum Schluss wird nun wieder der Loop mittels "requestAnimationFrame" gestartet und das Audio-Signal aus dem Mikrofon wird visualisiert.

	navigator.getUserMedia({audio: true, video: false}, 
	    //success
	    handleMicrophoneInput, 
	    //failed    
	    function () {
	        console.log('capturing microphone data failed!');
	        console.log(evt);
	    }
	);

	function handleMicrophoneInput (stream) {    
	    //convert audio stream to mediaStreamSource (node)
	    microphone = context.createMediaStreamSource(stream);
	    //create analyser
	    if (analyser == null) analyser = context.createAnalyser();
	    //connect microphone to analyser
	    microphone.connect(analyser);
	    //start updating
	    rafID = window.requestAnimationFrame( updateVisualization );
	}


## Audio-Nodes

Audio-Nodes erstellen und diese miteinander verbinden.

1. Analyser-Node erstellen (liefert uns die Analyse-Daten)
2. Source-Node erstellen (beinhaltet später die Audiodaten)
3. Source-Node wird mit Analyser verbunden (Source-Node-Output geht an Analyser-Input)
4. Source-Node wird zusätzlich mit den Speakern/Kopfhörern verbunden, damit wir auch etwas hören (context.destination)
5. mit der Methode requestAnimationFrame sagen wir dem Browser, dass er bei der nächsten Zeichnung eine Aktion durchführen soll, in unserem Fall die Aktualisierung der Frequenz-Visualisierung.

	function setupAudioNodes() {
	    //setup a analyser
	    analyser = context.createAnalyser();
	    //create a buffer source node
	    sourceNode = context.createBufferSource();    
	    //connect source to analyser as link
	    sourceNode.connect(analyser);
	    //and connect source to destination
	    sourceNode.connect(context.destination);
	    //start updating
	    rafID = window.requestAnimationFrame(updateVisualization);
	}

## Daten visualisieren

Die vorher initialisierten Nodes haben den Zeichnen-Prozess in Gang gesetzt, dafür haben wir die Methode "updateVisualization", die sich über "requestAnimationFrame" indirekt immer wieder selbst aufruft. Hier passiert nun die Magie:

	function updateVisualization () {
	    // get the average, bincount is fftsize / 2
	    var array = new Uint8Array(analyser.frequencyBinCount);
	    analyser.getByteFrequencyData (array);

	    drawBars(array);
	    drawSpectrogram(array);        

	    rafID = window.requestAnimationFrame(updateVisualization);
	}

Zunächst brauchen wir ein Array vom Typ "Uint8Array" welches ganzzahlige Werte ohne Vorzeichen in dem Bereich von 0 bis 255 enthalten kann. Die Länge wird dabei durch die fftSize bestimmt. Das ist die Größe, die dem Algorithmus FFT (fast Fourier transform) zu Grunde liegt, welcher fester Bestandteil der Web Audio API ist. 

Mit dem FFT kann immer nur ein bestimmter Zeitbereich analysiert werden, wenige Millisekunden oder ähnliches aber nie ganze Audiodateien. Mit Hilfe des AnalyserNode und der Methode "'getByteFrequencyData" füllen wir nun das Array mit Daten.

Anschließend können wir unsere Zeichnen-Methoden für die Bin-Ansicht und für die Spektralanalyse ausführen. Danach wird der ganze Teile mittels "requestAnimationFrame" wiederholt.

Frequenzanteile werden als Spektrogramm dargestellt.
Dabei wird der Frequenzanteil durch die Helligkeit der Farbe bestimmt. Je weiter oben die gezeichnet wird, desto höher ist die Frequenz und je heller die Farbe an dieser Stelle ist, desto stärker ist dieser Frequenzbereich in dem Audio-Signal vertreten.

beim Laden der Seite ein entsprechendes Canvas vorbereitet. Zum Zeichnen haben wir die Methode "drawSpectrogram" die auch von "updateVisualization" aufgerufen wird und die FFT-Daten als Parameter erhält.

Die Methode berechnet die maximale Anzahl an Werten die dargestellt werden sollen. Da pro Pixel ein Wert dargestellt werden soll und das Canvas 512 Pixel hoch ist, ist die ganze maximale Anzahl entweder 512 oder die Länge des Arrays wenn diese kleiner sein sollte.

Danach werden alle bisher gezeichneten Pixel um eins nach links 
verschoben und alle neue Werten werden am rechten Rand gezeichnet.

Die jeweilige Farbe wird in einer extra Methode "getColor" abhängig von dem Wert "value" berechnet. Der maximale Wert in unserem Array ist 255 (8-bit) und soll als "weiß" dargestellt werden. Nun brauchen wir also den Prozentsatz von dem Wert "value" (x%) zu 255 (100%).

Je nachdem wie hoch der Prozentanteil ist, wird die Farbe zwischen schwarz, rot, gelb und weiß als Farbverlauf berechnet.

	function initCanvas () {
		$("body").append('<h2>Spectral Analysis</h2><h3>Frequency inscreased from bottom to top. Amplitude is shown through the brightness of the color.</h3><canvas id="spectrogram" width="'+800+'" height="512" style="background:black;"></canvas>');
	    c = document.getElementById("spectrogram");
		ctx = c.getContext("2d");		
	}

	function drawSpectrogram(array) {
	    var canvas = document.getElementById("spectrogram");
	    //max count is the height of the canvas
	    var max = array.length > canvas.height ? canvas.height : array.length;
	    //move the current pixel one step left
	    var imageData = ctx.getImageData(0,0,canvas.width,canvas.height);
	    ctx.putImageData(imageData,-1,0);
	    //iterate over the elements from the array
	    for (var i = 0; i < max; i++) {
	        // draw each pixel with the specific color
	        var value = array[i];
	        //calc the color of the point
	        ctx.fillStyle = getColor(value);
	        //draw the line at the right side of the canvas        
	        ctx.fillRect(canvas.width - 1, canvas.height - i, 1, 1);
	    }    
	}

	function getColor (v) {
	    var maxVolume = 255;
	    //get percentage of the max volume
	    var p = v / maxVolume;
	    var np = null;

	    if (p < 0.05) {
	        np = [0,0,0] //black
	    //p is between 0.05 and 0.25
	    } else if (p < 0.25) {
	        np = [parseInt(255 * (1-p)),0,0] //between black and red
	    //p is between 0.25 and 0.75
	    } else if (p < 0.75) {
	        np = [255,parseInt(255 * (1-p)),0];     //between red and yellow
	    //p is between 0.75 and 1
	    } else {
	        np = [255,255,parseInt(255 * (1-p))]; //between yellow and white
	    }

	    return 'rgb('+ (np[0]+","+np[1]+","+np[2]) + ")";
	}