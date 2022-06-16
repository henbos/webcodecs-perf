'use strict';

import {EncodingTest} from './encoding-test.mjs';

const encodingTest = new EncodingTest();

document.getElementById('start-encoding')
    .addEventListener('click', async () => {
      const mediaStream = await encodingTest.initMediaStream();
      encodingTest.configure(
          document.getElementById('resolutions-select').value,
          document.getElementById('scalability-select').value,
          document.getElementById('hw-select').value);
      const videoElement = document.getElementById('local-preview');
      videoElement.srcObject = mediaStream;
      videoElement.play();
      encodingTest.addEncoders(
          document.getElementById('codec-select').value,
          document.getElementById('encoder-number').value);
      encodingTest.startTest();
    });

// Add codecs to select.
const codecList = encodingTest.codecList();
const codecSelectElement = document.getElementById('codec-select');
for (const [name, codec] of codecList) {
  const option = document.createElement('option');
  option.text = name;
  option.value = codec;
  codecSelectElement.add(option);
}

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