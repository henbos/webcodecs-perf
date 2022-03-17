'use strict';

import {EncodingTest} from './encoding-test.mjs';

const encodingTest = new EncodingTest();

document.getElementById('start-encoding').addEventListener('click', async () => {
  await encodingTest.initMediaStream();
  encodingTest.addEncoders(document.getElementById('encoder-number').value);
  encodingTest.startTest();
});