/**
 * Created by akonovalov on 21.07.2015.
 */

var context;
window.addEventListener('load', init, false);

function init() {
    try {
        // Fix up for prefixing
        window.AudioContext = window.AudioContext||window.webkitAudioContext;
        context = new AudioContext();
    }
    catch(e) {
        console.log('Web Audio API is not supported in this browser');
    }
}

var dogBarkingBuffer = null;
function loadSound(url) {
    var request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.responseType = 'arraybuffer';

    // Decode asynchronously
    request.onload = function() {
        context.decodeAudioData(request.response, function(buffer) {
            dogBarkingBuffer = buffer;
        }, onError);
    }
    request.send();
}

function playSound(buffer) {
    var source = context.createBufferSource(); // creates a sound source
    source.buffer = buffer;                    // tell the source which sound to play
    source.connect(context.destination);       // connect the source to the context's destination (the speakers)
    source.start(0);                           // play the source now
                                               // note: on older systems, may have to use deprecated noteOn(time);
}

audio_file.onchange = function(){
    var files = this.files;
    var file = URL.createObjectURL(files[0]);
    audio_player.src = file;
    //audio_player.play();
    //loadSound(file);
};