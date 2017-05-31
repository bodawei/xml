/* Copyright ® 2017 by David John Burrowes. All rights reserved. */

'use strict';

/* eslint-env jasmine */

const StringParser = require('./02parser.js');

// fdescribe('StringParser', () => {
   let parser;

   // beforeEach(() => {
      parser = new StringParser();
   // });

   // it('one', (done) => {
      const results = [];

      parser.on('data', (data) => {
         results.push(data);
      });
      parser.addText('<?xml version="1.0"?>');
      parser.endText();

      console.log(results);
//    });

// });
