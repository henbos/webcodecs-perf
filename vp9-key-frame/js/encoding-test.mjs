'use strict'

const resolutionList = [
  ['720p', [1280, 720]],
  ['360p', [640, 360]]
];

const scalabilityModeList = ['L1T1', 'L1T2'];

const hardwareAccelerationList =
    ['no-preference', 'prefer-hardware', 'prefer-software'];

export class EncodingTest {
  constructor() {
    this._mediaStreams = null;
    this._currentStreamIndex = 0;
    this._trackWriter=null;
    this._worker = new Worker('js/codecs-worker.mjs?r=1', {type: 'module'});
    this.bindEventHandlers();
  }

  bindEventHandlers() {
    this._worker.addEventListener('message', (event) => {
      const [messageType, args] = event.data;
      switch (messageType) {
        case 'decoded-frame':
          this.renderFrame(...args);
          break;
        default:
          console.warn('Unknown message ' + JSON.stringify(event.data));
      }
    });
  }

  renderFrame(frame){
    this._trackWriter.write(frame);
  }

  async initMediaStreams() {
    if (this._mediaStreams != null) {
      return false;  // Already initialized, no need to do it again.
    }
    const width = 1280;
    const height = 720;
    this._mediaStreams = [];
    // Real camera.
    this._mediaStreams.push(
    await navigator.mediaDevices.getUserMedia(
        {audio: false, video: {width, height}}));
    // Fake camera (green frames).
    const canvas =
        document.createElement('canvas', { width, height });
    const context = canvas.getContext('2d');
    setInterval(() => {
      context.fillStyle = `rgb(0,255,0)`;
      context.fillRect(0, 0, width, height);
    }, 1000 / 30);
    this._mediaStreams.push(canvas.captureStream());
    // Setup decoder to render resulting frames.
    this.initPlayer();
    return true;
  }

  currentStream() {
    return this._mediaStreams[this._currentStreamIndex];
  }
  swapCurrentStream() {
    this._currentStreamIndex = 1 - this._currentStreamIndex;
  }

  async initPlayer() {
    const mediaStreamTrackGenerator = new MediaStreamTrackGenerator({ kind: "video" });
    this._trackWriter = mediaStreamTrackGenerator.writable.getWriter();
    document.getElementById('playback').srcObject = new MediaStream([mediaStreamTrackGenerator]);
  }

  configure(keyFrames, resolutionsIndex, scalabilityMode, hardwareAcceleration,
            delayKeyFrameRequest) {
    this._worker.postMessage([
      'configure',
      [
        keyFrames, resolutionList[resolutionsIndex][1], scalabilityMode,
        hardwareAcceleration, delayKeyFrameRequest
      ]
    ]);
  }

  onUpdateKeyFrameMode(keyFrames) {
    this._worker.postMessage(['update-key-frame-mode', [keyFrames]]);
  }

  startTest() {
    this.readRawFrames(this._mediaStreams[0]);
    this.readRawFrames(this._mediaStreams[1]);
  }

  async readRawFrames(stream) {
    const processor = new MediaStreamTrackProcessor(
        {track: stream.getVideoTracks()[0]});
    const reader = processor.readable.getReader();
    let prevStream = null;
    while (true) {
      const {value, done} = await reader.read();
      if (done) {
        console.debug('Video track ends.');
        break;
      }
      let didSwapStream =
          prevStream != null && prevStream != this.currentStream();
      prevStream = this.currentStream();
      if (this.currentStream() == stream) {
        // Forward the frame, the worker is responsible for closing it.
        this._worker.postMessage(
            ['raw-frame', [value, didSwapStream]], [value]);
      } else {
        // Close unwanted frames.
        value.close();
      }
    }
  }

  resolutionList() {
    return resolutionList;
  }

  scalabilityModeList() {
    return scalabilityModeList;
  }

  hardwareAccelerationList() {
    return hardwareAccelerationList;
  }

  requestKeyFrame() {
    this._worker.postMessage([
      'key-frame-request',
    ]);
  }
}