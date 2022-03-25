'use strict'

// Each item is an array of 2 strings: [display name, codec string].
// Codec string is defined in WebCodecs Codec Registry
// https://www.w3.org/TR/webcodecs-codec-registry/.
const codecList =
    [['H.264', 'avc1.4d002a'], ['AV1', 'av01.0.00M.08'], ['VP8', 'vp8']];

export class EncodingTest {
  constructor() {
    this._mediaStream = null;
    this._worker = new Worker('js/codecs-worker.mjs?r=15', {type: 'module'});
    this.bindEventHandlers();
  }

  bindEventHandlers() {
    this._worker.addEventListener('message', (event) => {
      const [messageType, args] = event.data;
      switch (messageType) {
        case 'stats':
          this.updateStats(...args);
          break;
          ;
        default:
          console.warn('Unknown message ' + JSON.stringify(event.data));
      }
    });
  }

  updateStats(stats) {
    document.getElementById('stats').innerText = stats;
  }

  async initMediaStream() {
    this._mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        width: 1280,
        height: 720,
      }
    });
    return this._mediaStream;
  }

  _addAnEncoder(codec) {
    this._worker.postMessage(['add-encoder', [codec]]);
  }

  addEncoders(codec, num) {
    for (let i = 0; i < num; i++) {
      this._addAnEncoder(codec);
    }
  }

  async startTest() {
    const processor = new MediaStreamTrackProcessor(
        {track: this._mediaStream.getVideoTracks()[0]});
    const reader = processor.readable.getReader();
    while (true) {
      const {value, done} = await reader.read();
      if (done) {
        console.debug('Video track ends.');
        break;
      }
      this._worker.postMessage(['raw-frame', [value]], [value]);
    }
  }

  codecList() {
    return codecList;
  }
}