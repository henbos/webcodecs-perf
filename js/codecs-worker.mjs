'use strict'

let initialized = false;
let firstFrame = true;
// Each item in encodings is an object
// like {encoder:VideoEncoder,captureTime:[DateTime],captureTimeIndex:number,encodedTime:[DateTime],encodedTimeIndex:number}.
const encodings = [];
const recordNumber = 300;

addEventListener('message', (event) => {
  const [messageType, args] = event.data;
  switch (messageType) {
    case 'add-encoder':
      addEncoder();
      break;
    case 'raw-frame':
      onRawFrame(...args);
      break;
    default:
      console.warn('Unknown message ' + JSON.stringify(event.data));
  }
});

function onRawFrame(frame) {
  for (let i = 0; i < encodings.length; i++) {
    const encoding = encodings[i];
    // TODO: Only the 1st frame is key frame.
    encoding.encoder.encode(frame, {keyFrame: firstFrame ? true : false});
    encoding.captureTime[(encoding.captureTimeIndex++) % recordNumber] =
        Date.now();
  }
  firstFrame = false;
  frame.close();
}

function addEncoder() {
  const encoder = new VideoEncoder({
    output: videoChunkOutputCallback.bind(null, encodings.length),
    error: encoderErrorCallback
  });
  encoder.configure({
    // codec: 'avc1.4d002a',
    codec: 'av01.0.00M.08',
    width: 1280,
    height: 720,
    framerate: 30,
    latencyMode: 'realtime',
    //avc: {format: 'annexb'},
  });
  const encoding = {
    encoder,
    captureTime: new Array(recordNumber).fill(0),
    captureTimeIndex: 0,
    encodedTime: new Array(recordNumber).fill(0),
    encodedTimeIndex: 0,
  };
  encodings.push(encoding);
  if (!initialized) {
    printStats();
  }
  initialized = true;
}

function calculateAverageEncodingTime(encodingIndex) {
  const encoding = encodings[encodingIndex];
  let validRecords = 0;
  let timeSum = 0;
  for (let i = encoding.captureTimeIndex + 1;
       i < encoding.encodedTimeIndex + recordNumber; i++) {
    if (encoding.captureTime[i] == 0) {
      continue;
    }
    timeSum +=
        (encoding.encodedTime[i % recordNumber] -
         encoding.captureTime[i % recordNumber]);
    validRecords += 1;
  }
  return timeSum / validRecords;
}

function printStats() {
  setInterval(() => {
    let str = 'Average encoding time: ';
    for (let i = 0; i < encodings.length; i++) {
      str += `${calculateAverageEncodingTime(i).toFixed(2)}, `;
    }
    postMessage(['stats', [str]]);
  }, 1000);
}

function videoChunkOutputCallback(encoderIndex, chunk, metadata) {
  const encoding = encodings[encoderIndex];
  encoding.encodedTime[(encoding.encodedTimeIndex++) % recordNumber] =
      Date.now();
}

function encoderErrorCallback(error) {
  console.error(`Video encoder error: ${JSON.stringify(error)}`);
}