'use strict';

import {EncodingTest} from './encoding-test.mjs';

const encodingTest = new EncodingTest();

document.getElementById('start-encoding')
    .addEventListener('click', async () => {
      const mediaStream = await encodingTest.initMediaStream();
      const keyFrames = document.getElementById('key-frame-consecutive').checked ? 2 : 1;
      encodingTest.configure(keyFrames,
          document.getElementById('resolutions-select').value,
          document.getElementById('scalability-select').value,
          document.getElementById('hw-select').value);
      const videoElement = document.getElementById('local-preview');
      videoElement.srcObject = mediaStream;
      videoElement.play();
      document.getElementById('playback').play();
      encodingTest.startTest();
    });

document.getElementById('key-frame-request').addEventListener('click',()=>{
  encodingTest.requestKeyFrame();
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
