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
    };
});

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

function load(){
    var source = context.createMediaElementSource(audio_player);
    source.connect(context.destination);
}

audio_file.onchange = function(){
    var files = this.files;
    var file = URL.createObjectURL(files[0]);
    audio_player.src = file;
    //audio_player.play();
    //loadSound(file);
};