'use strict';

import {EncodingTest} from './encoding-test.mjs';

const encodingTest = new EncodingTest();

document.getElementById('start-encoding')
    .addEventListener('click', async () => {
      const mediaStream = await encodingTest.initMediaStream();
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