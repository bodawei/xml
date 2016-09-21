/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

/* eslint-env jasmine */

const XmlToken = require('./XmlToken.js');
const XmlErrorToken = require('./XmlErrorToken.js');

describe('toBeSyntaxError', () => {

   it('reports pass when the error code is the expected error code', () => {
      expect(new XmlErrorToken(XmlToken.SYNTAX_ERROR, 'FISH')).toBeSyntaxError('FISH');
   });

   it('reports no pass when the error code is the expected error code', () => {
      expect(new XmlErrorToken(XmlToken.SYNTAX_ERROR, 'TEST')).not.toBeSyntaxError('BOGUS');
   });

});
