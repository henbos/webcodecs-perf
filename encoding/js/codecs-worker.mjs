'use strict'

let initialized = false;
let firstFrame = true;
// Each item in encodings is an object
// like {encoder:VideoEncoder,captureTime:[DateTime],captureTimeIndex:number,encodedTime:[DateTime],encodedTimeIndex:number,firstFrameDelay:number}.
const encodings = [];
const recordNumber = 300;

let resolutions = [[1280, 720], [640, 360], [320, 180]];
let resolutionsIndex = 0;
let scalabilityMode;

addEventListener('message', (event) => {
  const [messageType, args] = event.data;
  switch (messageType) {
    case 'configure':
      configure(...args);
      break;
    case 'add-encoder':
      addEncoder(...args);
      break;
    case 'raw-frame':
      onRawFrame(...args);
      break;
    default:
      console.warn('Unknown message ' + JSON.stringify(event.data));
  }
});

function configure(newResolutions, newScalabilityMode) {
  updateResolutions(newResolutions);
  scalabilityMode =
      newScalabilityMode == 'L1T1' ? undefined : newScalabilityMode;
}

function updateResolutions(newResolutions) {
  if (encodings.length != 0) {
    console.warn(
        'Existing encoders are impacted by updating the resolution list.');
  }
  resolutions = newResolutions;
  resolutionsIndex = 0;
}

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

function addEncoder(codec) {
  const encoder = new VideoEncoder({
    output: videoChunkOutputCallback.bind(null, encodings.length),
    error: encoderErrorCallback
  });
  const encoderConfig = {
    codec: codec,
    width: resolutions[resolutionsIndex][0],
    height: resolutions[resolutionsIndex][1],
    framerate: 30,
    latencyMode: 'realtime',
    scalabilityMode,
  };
  resolutionsIndex += 1;
  resolutionsIndex = resolutionsIndex % resolutions.length;
  if (codec.startsWith('avc1.')) {
    encoderConfig.avc = {format: 'annexb'};
  }
  encoder.configure(encoderConfig);
  const encoding = {
    encoder,
    captureTime: new Array(recordNumber).fill(0),
    captureTimeIndex: 0,
    encodedTime: new Array(recordNumber).fill(0),
    encodedTimeIndex: 0,
    firstFrameDelay: null,
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
    str += '\nFirst frame delay: ';
    for (let i = 0; i < encodings.length; i++) {
      str += `${encodings[i].firstFrameDelay?.toFixed(2)}, `;
    }
    postMessage(['stats', [str]]);
  }, 1000);
}

function videoChunkOutputCallback(encoderIndex, chunk, metadata) {
  const encoding = encodings[encoderIndex];
  encoding.encodedTime[(encoding.encodedTimeIndex++) % recordNumber] =
      Date.now();
  if (!encoding.firstFrameDelay) {
    encoding.firstFrameDelay =
        encoding.encodedTime[0] - encoding.captureTime[0];
  }
}

function encoderErrorCallback(error) {
  console.error(`Video encoder error: ${JSON.stringify(error)}`);
}