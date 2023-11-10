'use strict'

const vp9 = 'vp09.00.10.08';
let encoder = null, decoder = null;
let keyFramesRemaining = 2;
let keyFramesRemainingSetting = null;
const recordNumber = 300;

let resolution;
let scalabilityMode;
let hardwareAcceleration;
let chunks = [];
let keyFrameRequested = false;
let isFirstFrameEver = true;
let delayKeyFrameRequest = false;

addEventListener('message', (event) => {
  const [messageType, args] = event.data;
  switch (messageType) {
    case 'configure':
      configure(...args);
      break;
    case 'update-key-frame-mode':
      updateKeyFrameMode(...args);
      break;
    case 'raw-frame':
      onRawFrame(...args);
      break;
    case 'download-dump':
      downloadDump(...args);
      break;
    case 'key-frame-request':
      keyFrameRequested = true;
      break;
    default:
      console.warn('Unknown message ' + JSON.stringify(event.data));
  }
});

function configure(newKeyFramesRemaining, newResolution, newScalabilityMode,
                   newHardwareAcceleration, newDelayKeyFrameRequest) {
  console.log('Reconfiguring');
  keyFramesRemaining = keyFramesRemainingSetting = newKeyFramesRemaining;
  resolution = newResolution;
  scalabilityMode =
    newScalabilityMode == 'L1T1' ? undefined : newScalabilityMode;
  hardwareAcceleration = newHardwareAcceleration;
  delayKeyFrameRequest = newDelayKeyFrameRequest;
  isFirstFrameEver = true;
  initEncoder();
  initDecoder();
}

function updateKeyFrameMode(newKeyFramesRemainingSetting) {
  keyFramesRemainingSetting = newKeyFramesRemainingSetting;
}

function onRawFrame(frame, didSwapStream) {
  if (didSwapStream) {
    console.log('The stream was just swapped, first frame keyFrame:false.');
    // Encode one frame like normal.
    encoder.encode(frame, { keyFrame: false });
    frame.close();
    // Subsequently do as many key frames in a row as was last specified.
    keyFramesRemaining = keyFramesRemainingSetting;
    return;
  }
  if (delayKeyFrameRequest && isFirstFrameEver) {
    console.log('keyFrame:false');
    encoder.encode(frame, { keyFrame: false });
    frame.close();
    isFirstFrameEver = false;
    return;
  }
  const keyFrame = (keyFramesRemaining > 0 || keyFrameRequested);
  if (keyFrame) {
    console.log('keyFrame:true');
  }
  encoder.encode(frame, { keyFrame });
  frame.close();
  if (keyFramesRemaining > 0) {
    keyFramesRemaining--;
  }
  keyFrameRequested = false;
}

function initEncoder() {
  if (!encoder) {
    encoder = new VideoEncoder({
      output: videoChunkOutputCallback,
      error: encoderErrorCallback
    });
  }
  const encoderConfig = {
    codec: vp9,
    width: resolution[0],
    height: resolution[1],
    framerate: 30,
    latencyMode: 'realtime',
    scalabilityMode,
    hardwareAcceleration,
  };
  encoder.configure(encoderConfig);
}

function initDecoder() {
  if (decoder) {
    return;
  }
  decoder = new VideoDecoder({ output: videoFrameOutputCallback, error: decoderErrorCallback });
  decoder.configure({
    codec: vp9
  });
}

function videoChunkOutputCallback(chunk, metadata) {
  decoder.decode(chunk);
}

function encoderErrorCallback(error) {
  console.error(`Video encoder error: ${JSON.stringify(error)}`);
}

function videoFrameOutputCallback(frame) {
  postMessage(['decoded-frame', [frame]], [frame]);
}

function decoderErrorCallback(error) {
  console.error(`Video decoder error: ${JSON.stringify(error)}`);
}

function downloadDump() {

}
