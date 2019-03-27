/* Copyright ® 2019 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import stream from 'readable-stream';

import { WellFormedError } from 'error';

import { expectError } from './utils';

describe('utils (unit)', () => {

   describe('expectError()', () => {

      it('succeeds if the specified error is found', (done) => {
         const dummyStream = new stream.PassThrough({
            objectMode: true,
         });
         const error = new WellFormedError(WellFormedError.ID.REFERENCE_NO_DECLARATION);

         dummyStream.write(error);
         dummyStream.end();

         expectError(dummyStream, error, done);
      });

      it('allows the expected to be an array', (done) => {
         const dummyStream = new stream.PassThrough({
            objectMode: true,
         });
         const error = new WellFormedError(WellFormedError.ID.REFERENCE_NO_DECLARATION);

         dummyStream.write(error);
         dummyStream.end();

         expectError(dummyStream, [ error ], done);
      });

   });

});
