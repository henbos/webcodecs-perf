'use strict';

import {EncodingTest} from './encoding-test.mjs';

const encodingTest = new EncodingTest();

document.getElementById('start-encoding')
    .addEventListener('click', async () => {
      const mediaStream = await encodingTest.initMediaStream();
      encodingTest.setResolutions(
          document.getElementById('resolutions-select').value);
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