'use strict'

export class EncodingTest {
  constructor() {
    this._mediaStream = null;
    this._worker = new Worker('js/codecs-worker.mjs?r=14', {type: 'module'});
    this.bindEventHandlers();
  }

  bindEventHandlers() {
    this._worker.addEventListener('message', (event) => {
      const [messageType, args] = event.data;
      switch (messageType) {
        case 'stats':
          this.updateStats(...args);
          break;;
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
    const videoElement = document.getElementById('local-preview');
    videoElement.srcObject = this._mediaStream;
    videoElement.play();
  }

  _addAnEncoder() {
    this._worker.postMessage(['add-encoder']);
  }

  addEncoders(num) {
    for (let i = 0; i < num; i++) {
      this._addAnEncoder();
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
}