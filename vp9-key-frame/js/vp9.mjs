'use strict';

import {EncodingTest} from './encoding-test.mjs';

const encodingTest = new EncodingTest();

document.getElementById('start-encoding')
    .addEventListener('click', async () => {
      const isFirstInit = await encodingTest.initMediaStreams();
      let keyFrames = 'unknown';
      if (document.getElementById('key-frame-none').checked) {
        keyFrames = 0;
      } else if (document.getElementById('key-frame-single').checked) {
        keyFrames = 1;
      } else if (document.getElementById('key-frame-consecutive').checked) {
        keyFrames = 2;
      }
      encodingTest.configure(keyFrames,
          document.getElementById('resolutions-select').value,
          document.getElementById('scalability-select').value,
          document.getElementById('hw-select').value,
          document.getElementById('delay-keyframe-request').checked);
      if (isFirstInit) {
        const videoElement = document.getElementById('local-preview');
        videoElement.srcObject = encodingTest.currentStream();
        encodingTest.startTest();
      }
    });

document.getElementById('key-frame-request').addEventListener('click', () => {
  encodingTest.requestKeyFrame();
});

function updateKeyFrameMode() {
  let keyFrames = 'unknown';
  if (document.getElementById('key-frame-none').checked) {
    keyFrames = 0;
  } else if (document.getElementById('key-frame-single').checked) {
    keyFrames = 1;
  } else if (document.getElementById('key-frame-consecutive').checked) {
    keyFrames = 2;
  }
  encodingTest.onUpdateKeyFrameMode(keyFrames);
}

document.getElementById('key-frame-none').onclick = updateKeyFrameMode;
document.getElementById('key-frame-single').onclick = updateKeyFrameMode;
document.getElementById('key-frame-consecutive').onclick = updateKeyFrameMode;

document.getElementById('swap-camera').addEventListener('click', () => {
  encodingTest.swapCurrentStream();

  const videoElement = document.getElementById('local-preview');
  videoElement.srcObject = encodingTest.currentStream();
});

const resolutionList = encodingTest.resolutionList();
const resolutionSelectElement = document.getElementById('resolutions-select');
let resolutionIndex = 0;
for (const [name, _] of resolutionList) {
  const option = document.createElement('option');
  option.text = name;
  option.value = resolutionIndex;
  resolutionSelectElement.add(option);
  resolutionIndex += 1;
}

const scalabilityModeList = encodingTest.scalabilityModeList();
const scalabilitySelectElement = document.getElementById('scalability-select');
for (const name of scalabilityModeList) {
  const option = document.createElement('option');
  option.text = name;
  option.value = name;
  scalabilitySelectElement.add(option);
}

const hardwareAccelerationList = encodingTest.hardwareAccelerationList();
const hardwareAccelerationSelectElement = document.getElementById('hw-select');
for (const name of hardwareAccelerationList) {
  const option = document.createElement('option');
  option.text = name;
  option.value = name;
  hardwareAccelerationSelectElement.add(option);
}
