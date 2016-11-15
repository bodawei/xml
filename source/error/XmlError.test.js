/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

/* eslint-env jasmine */

const XmlError = require('./XmlError.js');

describe('XmlError()', () => {

   describe('construction', () => {

      it('sets id', () => {
         expect(new XmlError('hello').id).toEqual('hello');
      });

   });

});
