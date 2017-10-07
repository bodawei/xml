/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { ParsedStream } from '../parse';
import { TokenStream } from '../tokenize';
import SimpleObjStream from './so.js';

describe('SimpleObjStream (integration)', () => {
   let parsedStream;
   let tokenStream;
   let objStream;

   beforeEach(() => {
      parsedStream = new ParsedStream();
      tokenStream = new TokenStream();
      objStream = new SimpleObjStream();

      parsedStream.pipe(tokenStream).pipe(objStream);
   });

   it('builds a simple result', (done) => {
      parsedStream.addText('<?xml version="1.0"?><!DOCTYPE one><one>1<two>2</two>1</one>');
      parsedStream.endText();

      objStream.on('data', (final) => {
         const result = JSON.parse(JSON.stringify(final));
         expect(result).toEqual({
            type: 'one',
            content: [
               '1', {
                  type: 'two',
                  content: [
                     '2',
                  ],
               },
               '1',
            ],
         });
         done();
      });
   });

   // it('does everything', (done) => {
   //    const SRC_ROOT = '..';
   //    /* eslint-disable no-console, global-require */

   //    const ParsedStream = require(SRC_ROOT + '/parse').ParsedStream;
   //    const TokenStream = require(SRC_ROOT + '/tokenize').TokenStream;
   //    const SimpleObjStream = require('./so.js').default;

   //    const parsedStream = new ParsedStream();
   //    const tokenStream = new TokenStream();
   //    const objStream = new SimpleObjStream();
   //    parsedStream.on('end', () => {
   //       // console.log('Got the end');
   //    });

   //    parsedStream.pipe(tokenStream).pipe(objStream);
   //    //const data = fs.readFileSync('./REC-xml-20081126.xml');
   //    const data = require('./foo.json');

   //    // console.log('LENGTH', data.data.length);
   //    parsedStream.addText(data.data);
   //    parsedStream.endText();

   //    // parsedStream.on('end', () => console.log('PARSED ENDING'));
   //    // parsedStream.on('close', () => console.log('PARSED CLOSE'));
   //    // parsedStream.on('finish', () => console.log('PARSED FINISH'));
   //    objStream.on('data', (result) => {
   //      console.log('HERE', JSON.stringify(result, undefined, 2));
   //       done();
   //    });

   //    parsedStream.on('error', (x) => {
   //       console.log('ERROR', x);
   //    });
   // });

});
