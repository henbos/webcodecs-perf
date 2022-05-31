'use strict'

// Each item is an array of 2 strings: [display name, codec string].
// Codec string is defined in WebCodecs Codec Registry
// https://www.w3.org/TR/webcodecs-codec-registry/.
const codecList = [
  ['H.264 High', 'avc1.640028'], ['H.264 Main', 'avc1.4d002a'],
  ['AV1', 'av01.0.00M.08'], ['VP8', 'vp8']
];

const resolutionList = [
  ['720p', [[1280, 720]]],
  ['720p, 360p, 180p', [[1280, 720], [640, 360], [320, 180]]]
];

const scalabilityModeList = ['L1T1', 'L1T2'];

export class EncodingTest {
  constructor() {
    this._mediaStream = null;
    this._worker = new Worker('js/codecs-worker.mjs?r=24', {type: 'module'});
    this.bindEventHandlers();
  }

  bindEventHandlers() {
    this._worker.addEventListener('message', (event) => {
      const [messageType, args] = event.data;
      switch (messageType) {
        case 'stats':
          this.updateStats(...args);
          break;
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

  configure(resolutionsIndex, scalabilityMode){
    this._worker.postMessage(
        ['configure', [resolutionList[resolutionsIndex][1], scalabilityMode]]);
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

  resolutionList() {
    return resolutionList;
  }

  scalabilityModeList() {
    return scalabilityModeList;
  }
}