'use strict'

const vp9 = 'vp09.00.10.08';
let encoder, decoder;
let keyFramesRemaining = 2;
const recordNumber = 300;

let resolution;
let scalabilityMode;
let hardwareAcceleration;
let chunks = [];
let keyFrameRequested = false;
let totalFrameCount = 0;

addEventListener('message', (event) => {
  const [messageType, args] = event.data;
  switch (messageType) {
    case 'configure':
      configure(...args);
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

function configure(newKeyFramesRemaining,
  newResolution, newScalabilityMode, newHardwareAcceleration) {
  keyFramesRemaining = newKeyFramesRemaining;
  resolution = newResolution;
  scalabilityMode =
    newScalabilityMode == 'L1T1' ? undefined : newScalabilityMode;
  hardwareAcceleration = newHardwareAcceleration;
  initEncoder();
  initDecoder();
}

function onRawFrame(frame) {
  ++totalFrameCount;
  // Starting from the second frame, encode with the right resolution-
  if (totalFrameCount == 2) {
    reconfigure(resolution[0], resolution[1]);
  }
  // Try to encode the first two frames as not key-frames.
  if (totalFrameCount <= 2) {
    console.log('Encoding...');
    encoder.encode(frame, { keyFrame: false });
    frame.close();
    return;
  }
  encoder.encode(frame, { keyFrame: (keyFramesRemaining > 0 || keyFrameRequested) ? true : false });
  frame.close();
  if (keyFramesRemaining > 0) {
    keyFramesRemaining--;
  }
  keyFrameRequested = false;
}

function initEncoder() {
  encoder = new VideoEncoder({
    output: videoChunkOutputCallback,
    error: encoderErrorCallback
  });
  // Let's encode the first frame with the wrong resolution.
  reconfigure(resolution[0] / 2, resolution[1] / 2);
}

function reconfigure(width, height) {
  console.log(`Reconfiguring: ${width}x${height}`);
  const encoderConfig = {
    codec: vp9,
    width: width,
    height: height,
    framerate: 30,
    latencyMode: 'realtime',
    scalabilityMode,
    hardwareAcceleration,
  };
  encoder.configure(encoderConfig);
}

function initDecoder() {
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
