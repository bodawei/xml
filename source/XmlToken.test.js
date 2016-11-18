/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

/* eslint-env jasmine */

const tokens = require('./XmlToken.js');
const XmlToken = tokens.XmlToken;

describe('XmlToken', () => {

   describe('construction', () => {

      it('throws an error if not passed chunks when constructed', () => {
         expect(() => {
            new XmlToken();
         }).toThrowError('Must provide a chunks value to the token you are constructing.');
      });

      it('sets the provided chunks as the chunks value', () => {
         const token = new XmlToken([ 'foo' ]);

         expect(token.chunks).toEqual([ 'foo' ]);
      });

      it('sets no chunks when the special ATTR_NO_CHUNKS value is provided', () => {
         const token = new XmlToken(tokens.ATTR_NO_CHUNKS);

         expect(token.chunks).toBeUndefined();
      });

      it('sets no chunks when the special ENTITYVAL_NO_CHUNKS value is provided', () => {
         const token = new XmlToken(tokens.ENTITYVAL_NO_CHUNKS);

         expect(token.chunks).toBeUndefined();
      });

   });

});
