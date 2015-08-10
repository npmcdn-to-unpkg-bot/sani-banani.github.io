/**
 * Created by akonovalov on 25.07.15.
 */
var app = (function () {
    'use strict';

    var _files, _context, _source, _gainNode, _filterNode, _equalizerNodes, _analyserNode, _generationMethods, _timer, _option,
        _init, _loadFile, _loadSound, _isSoundPlaying, _playSound, _generateAndPlaySound, _stopSound, _setPlaybackRate, _createRoutingGraph, _startTimer, _stopTimer, _timerFunction, _draw,
        _$playbackRate, _$stop, _$dropZone, _$fileName, _$audioPlayer, _$filters, _$equalizer;

    _init = function () {
        var i, frequencies, onLoadAudioListener, onVolumeChangeListener, onOptionsChangeListener, onFilterTypeChangeListener, onFilterFrequencyChangeListener, onFilterQualityChangeListener, onFilterGainChangeListener, onEqualizerChangeListener, onPlaybackRateChangeListener, initializeUI;

        var maxFileSize = 10000000; // максимальный размер файла - 10 мб.

        try {
            window.AudioContext = window.AudioContext||window.webkitAudioContext;
            /* Setup an AudioContext. */
            _context = new AudioContext();
        } catch(e) {
            throw new Error('The Web Audio API is unavailable');
        }

        _source = null;
        _option = 'disabled';

        /* Create nodes. */
        _gainNode = _context.createGain(); // createGain()
        _filterNode = _context.createBiquadFilter();
        _analyserNode = _context.createAnalyser();
        _equalizerNodes = [
            _context.createBiquadFilter(),
            _context.createBiquadFilter(),
            _context.createBiquadFilter(),
            _context.createBiquadFilter(),
            _context.createBiquadFilter(),
            _context.createBiquadFilter()
        ];
        /* Initialize nodes. */
        _filterNode.type = 0;
        _filterNode.frequency.value = 10000;
        _filterNode.Q.value = 0;
        _filterNode.gain.value = 0;
        frequencies = [50, 160, 500, 1600, 5000, 20000];
        for (i = 0; i < 6; i++) {
            _equalizerNodes[i].frequency.value = frequencies[i];
            _equalizerNodes[i].type = 5;
            _equalizerNodes[i].Q.value = 2;
        }
        /* Connect available nodes to make a routing graph.
         * Enable volume level manipulation and sound wave visualization. */
        _gainNode.connect(_analyserNode);
        _analyserNode.connect(_context.destination);
        _filterNode.connect(_gainNode);
        _equalizerNodes[0].connect(_equalizerNodes[1]);
        _equalizerNodes[1].connect(_equalizerNodes[2]);
        _equalizerNodes[2].connect(_equalizerNodes[3]);
        _equalizerNodes[3].connect(_equalizerNodes[4]);
        _equalizerNodes[4].connect(_equalizerNodes[5]);
        _equalizerNodes[5].connect(_gainNode);

        _loadFile = function(file) {
            var audio;

            // Проверяем размер файла
            if (file.size > maxFileSize) {
                dropZone.text('Файл слишком большой!');
                dropZone.addClass('error');
                return false;
            }

            _$dropZone.removeClass('hover');
            _$dropZone.addClass('drop');

            _$fileName.text(file.name);

            audio = URL.createObjectURL(file);

            _loadSound(audio, _playSound);
        };

        onLoadAudioListener = function () {

            _loadFile(this.files[0]);

        };

        /* onVolumeChangeListener changes volume of the sound. */
        onVolumeChangeListener = function () {
            /* Slider's values range between 0 and 200 but the GainNode's
             * default value is 1 what is standard volume level. We have to
             * dived slider's value by 100, but first we convert string value to
             * the integer value. */
            _gainNode.gain.value = parseInt(this.value, 10) / 100;
        };

        /* Listeners that shows/hides options. */
        onOptionsChangeListener = function () {
            _option = this.value;

            switch (this.value) {
                case 'filters':
                    _$filters.show();
                    _$equalizer.hide();
                    break;
                case 'equalizer':
                    _$filters.hide();
                    _$equalizer.show();
                    break;
                case 'disabled':
                    _$filters.hide();
                    _$equalizer.hide();
                    break;
            }

            _createRoutingGraph();
        };
        onFilterTypeChangeListener = function () {
            _filterNode.type = parseInt(this.value, 10);
        };
        onFilterFrequencyChangeListener = function () {
            _filterNode.frequency.value = parseInt(this.value, 10);
        };
        onFilterQualityChangeListener = function () {
            _filterNode.Q.value = parseFloat(this.value);
        };
        onFilterGainChangeListener = function () {
            _filterNode.gain.value = parseFloat(this.value);
        };

        /* Listener for the equalizer. */
        onEqualizerChangeListener = function () {
            var index;

            index = parseInt($(this).attr('id').replace('equalizer-', ''), 10);
            _equalizerNodes[index].gain.value = parseInt(this.value, 10);
        };

        /* onPlaybackRateChangeListener changes the speed with which sound is played. */
        onPlaybackRateChangeListener = function () {
            _setPlaybackRate(parseFloat(this.value));
        };

        /* Function initializes all fields in the application. */
        initializeUI = function () {
            _$dropZone = $('#dropZone');
            _$fileName = $("#fileName");

            // Дальше мы должны проверить поддерживает ли браузер Drag and Drop, для этого мы будем использовать FileReader функцию. Если браузер не поддерживает Drag and Drop, то внутри элемента dropZone мы напишем «Не поддерживается браузером!» и добавим класс «error».
            if (typeof(window.FileReader) == 'undefined') {
                _$dropZone.text('Не поддерживается браузером!');
                _$dropZone.addClass('error');
            }
            /* TODO: вынести тело функции отдельно */
            // Следующее что мы сделаем это будет анимация эффекта перетаскивания файла на dropZone. Отслеживать эти действия мы будет с помощью событий «ondragover» и «ondragleave». Но, так как эти события не могут быть отслежены у jQuery объекта, нам необходимо обращаться не просто к «dropZone», а к «dropZone[0]».
            _$dropZone[0].ondragover = function () {
                _$dropZone.addClass('hover');
                return false;
            };
            /* TODO: заменить функции на jquery-like */
            _$dropZone[0].ondragleave = function () {
                _$dropZone.removeClass('hover');
                return false;
            };

            // Теперь нам необходимо написать обработчик события «ondrop» — это событие когда перетянутый файл опустили. В некоторых браузерах при перетягивании файлов в окно браузера они автоматически открываются, что бы такого не произошло нам нужно отменить стандартное поведение браузера. Также нам необходимо убрать класс «hover», и добавить класс «drop».
            _$dropZone[0].ondrop = function (event) {
                event.preventDefault();

                _loadFile(event.dataTransfer.files[0]);
            };

            $('#audio_file').on('change', onLoadAudioListener);

            _$audioPlayer = audio_player; //$('#audio_player');


            _$playbackRate = $('#playback-rate');
            _$stop = $('#stop');
            _$filters = $('#filters');
            _$equalizer = $('#equalizer');


            $('#volume').on('change', onVolumeChangeListener);
            _$playbackRate.on('change', onPlaybackRateChangeListener);

            $('#options').on('change', onOptionsChangeListener);

            $('#filter-type').on('change', onFilterTypeChangeListener);
            $('#filter-frequency').on('change', onFilterFrequencyChangeListener);
            $('#filter-quality').on('change', onFilterQualityChangeListener);
            $('#filter-gain').on('change', onFilterGainChangeListener);

            $('input[id^="equalizer-"]').on('change', onEqualizerChangeListener);

            _$stop.on('click', _stopSound);
        };

        initializeUI();

        _startTimer();
    };

    _loadSound = function (file, successCallback, errorCallback) {
        var xhr, isLoaded, onRequestLoad, onRequestError, onDecodeAudioDataSuccess, onDecodeAudioDataError, doXHRRequest;

        /* Stop execution if sound file to load was not given. */
        if (!file) {
            return;
        }

        /* Set default values. */
        _files = _files || [];
        successCallback = successCallback || function successCallback() {};
        errorCallback = errorCallback || function errorCallback(msg) {
                alert(msg);
            };

        _$audioPlayer.src = file;

        successCallback();
    };

    _isSoundPlaying = function () {
        return _source && _source.playbackState === _source.PLAYING_STATE;
    };

    _playSound = function () {
        _stopSound();

        _source = _context.createMediaElementSource(_$audioPlayer);
        _$audioPlayer.onended = function() {
            _source.disconnect();
            _source = null;
        };
        _source.connect(_context.destination);

        /* Connect nodes to create routing graph. */
        _createRoutingGraph();

        /* Set playback rate to a new value because it could be changed
         * while no sound was played. */
        //_setPlaybackRate(_$playbackRate.val());
        _$audioPlayer.play();
    };

    _stopSound = function () {
        /* Check whether there is any source. */
        if (_source && _isSoundPlaying()) {
            //_source.noteOff(0); // stop()
            _$audioPlayer.pause();
            _$audioPlayer.currentTime = 0;
            _source = null;
        }
    };

    _createRoutingGraph = function () {
        if (!_source) {
            return;
        }

        /* First disconnect source node form any node it's connected to.
         * We do it to make sure there is only one route in graph. */
        _source.disconnect(0);

        switch (_option) {
            case 'filters':
                _source.connect(_filterNode);
                break;
            case 'equalizer':
                _source.connect(_equalizerNodes[0]);
                break;
            case 'disabled':
                _source.connect(_gainNode);
                break;
        }
    };

    _startTimer = function () {
        /* Draw sound wave spectrum every 10 milliseconds. */
        _timer = setInterval(_timerFunction, 10);
    };

    _stopTimer = function () {
        /* Reset timer for drawing sound wave spectrum. */
        if (_timer) {
            clearInterval(_timer);
            _timer = null;
        }
    };

    _timerFunction = function () {
        _draw();
        if (_isSoundPlaying()) {
            _$stop.show();
        } else {
            _$stop.hide();
        }
    };

    _draw = function () {
        var canvas, context, width, height, barWidth, barHeight, barSpacing, frequencyData, barCount, loopStep, i, hue;

        canvas = $('canvas')[0];
        context = canvas.getContext('2d');
        width = canvas.width;
        height = canvas.height;
        barWidth = 10;
        barSpacing = 2;

        context.clearRect(0, 0, width, height);
        frequencyData = new Uint8Array(_analyserNode.frequencyBinCount);
        _analyserNode.getByteFrequencyData(frequencyData);
        barCount = Math.round(width / (barWidth + barSpacing));
        loopStep = Math.floor(frequencyData.length / barCount);

        for (i = 0; i < barCount; i++) {
            barHeight = frequencyData[i * loopStep];
            hue = parseInt(120 * (1 - (barHeight / 255)), 10);
            context.fillStyle = 'hsl(' + hue + ',75%,50%)';
            context.fillRect(((barWidth + barSpacing) * i) + (barSpacing / 2), height, barWidth - barSpacing, -barHeight);
        }
    };

    return {
        /**
         * Initiates user interface and generate files list.
         */
        init: _init,
        /**
         * Load sound file specified by the file parameter.
         * @param {Object} file It should be object with two properties 'name' - internal file name in the list and 'uri' - uri/url to the file.
         * @param {Function} successCallback
         * @param {Function} errorCallback
         */
        loadSound: _loadSound,
        /**
         * Play previously loaded sound.
         * @param {String} name Internal file name to be played.
         */
        playSound: _playSound,
        /**
         * Stops sound that is being currently played.
         */
        stopSound: _stopSound,
        /**
         * Generate sound source by synthesizing it.
         * @param {String} name Name of the method by which sound will be created.
         */
        generateAndPlaySound: _generateAndPlaySound
    };

}());

$(document).ready(function () {
    app.init();
});