/**
 * Created by akonovalov on 21.07.2015.
 */

$(document).ready(function () {
    var dropZone = $('#dropZone'),
        maxFileSize = 10000000; // максимальный размер файла - 1 мб.

    // Дальше мы должны проверить поддерживает ли браузер Drag and Drop, для этого мы будем использовать FileReader функцию. Если браузер не поддерживает Drag and Drop, то внутри элемента dropZone мы напишем «Не поддерживается браузером!» и добавим класс «error».
    if (typeof(window.FileReader) == 'undefined') {
        dropZone.text('Не поддерживается браузером!');
        dropZone.addClass('error');
    }

    // Следующее что мы сделаем это будет анимация эффекта перетаскивания файла на dropZone. Отслеживать эти действия мы будет с помощью событий «ondragover» и «ondragleave». Но, так как эти события не могут быть отслежены у jQuery объекта, нам необходимо обращаться не просто к «dropZone», а к «dropZone[0]».
    dropZone[0].ondragover = function () {
        dropZone.addClass('hover');
        return false;
    };

    dropZone[0].ondragleave = function () {
        dropZone.removeClass('hover');
        return false;
    };

    // Теперь нам необходимо написать обработчик события «ondrop» — это событие когда перетянутый файл опустили. В некоторых браузерах при перетягивании файлов в окно браузера они автоматически открываются, что бы такого не произошло нам нужно отменить стандартное поведение браузера. Также нам необходимо убрать класс «hover», и добавить класс «drop».
    dropZone[0].ondrop = function (event) {
        event.preventDefault();
        dropZone.removeClass('hover');
        dropZone.addClass('drop');

        // Дальше нам нужно добавить проверку на размер файла, для этого добавим в обработчик «ondrop» следующий строчки кода:
        var file = event.dataTransfer.files[0];

        if (file.size > maxFileSize) {
            dropZone.text('Файл слишком большой!');
            dropZone.addClass('error');
            return false;
        }
        $("fileName").text(file.name);
        audio_player.src = URL.createObjectURL(event.dataTransfer.files[0]);
        loadSource();
    };
});

var ctx; //audio context
var buf; //audio buffer
var fft; //fft audio node
var samples = 128;
var setup = false; //indicate if audio is set up yet

function init() {
    try {
        // Fix up for prefixing
        window.AudioContext = window.AudioContext||window.webkitAudioContext;
        ctx = new AudioContext();

        setupCanvas();
    }
    catch(e) {
        console.log('Web Audio API is not supported in this browser');
    }
}
window.addEventListener('load', init, false);

function playSound(buffer) {
    var source = context.createBufferSource(); // creates a sound source
    source.buffer = buffer;                    // tell the source which sound to play
    source.connect(context.destination);       // connect the source to the context's destination (the speakers)
    source.start(0);                           // play the source now
                                               // note: on older systems, may have to use deprecated noteOn(time);
}

//load the mp3 file
function loadFile() {
    var req = new XMLHttpRequest();
    req.open("GET","music.mp3",true);
    //we can't use jquery because we need the arraybuffer type
    req.responseType = "arraybuffer";
    req.onload = function() {
        //decode the loaded data
        ctx.decodeAudioData(req.response, function(buffer) {
            buf = buffer;
            play();
        });
    };
    req.send();
}

function loadSource(){
    var src = ctx.createMediaElementSource(audio_player);
    src.connect(ctx.destination);

    fft = ctx.createAnalyser();
    fft.fftSize = 128;

    //connect them up into a chain
    src.connect(fft);
    fft.connect(ctx.destination);

    //play immediately
    //src.noteOn(0);
    setup = true;
}

var gfx;
function setupCanvas() {
    var canvas = document.getElementById('canvas');
    gfx = canvas.getContext('2d');
    window.requestAnimationFrame = window.requestAnimationFrame||window.webkitRequestAnimationFrame;
    requestAnimationFrame(update);
}

function update() {
    window.requestAnimationFrame = window.requestAnimationFrame||window.webkitRequestAnimationFrame;
    requestAnimationFrame(update);
    if(!setup) return;
    gfx.clearRect(0,0,800,600);
    gfx.fillStyle = 'gray';
    gfx.fillRect(0,0,800,600);

    var data = new Uint8Array(128);
    fft.getByteFrequencyData(data);
    gfx.fillStyle = 'red';
    for(var i=0; i<data.length; i++) {
        gfx.fillRect(100+i*4,100+256-data[i]*2,3,100);
    }

}

audio_file.onchange = function(){
    var files = this.files;
    $("fileName").text(files[0].name);
    var file = URL.createObjectURL(files[0]);
    audio_player.src = file;
    loadSource();
    //audio_player.play();
    //loadSound(file);
};