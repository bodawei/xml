/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */

import { PTokenStream } from 'node';
import { PToXTokenStream } from '../node';
import SimpleObjStream from './so';
import { STokenSource } from 'basic';

describe('SimpleObjStream (integration)', () => {
   let sTokenSource: STokenSource;
   let pTokenStream: PTokenStream;
   let tokenStream: PToXTokenStream;
   let objStream: SimpleObjStream;

   beforeEach(() => {
      sTokenSource = new STokenSource();
      pTokenStream = new PTokenStream(sTokenSource);
      tokenStream = new PToXTokenStream();
      objStream = new SimpleObjStream();

      pTokenStream.pipe(tokenStream).pipe(objStream);
   });

   it('builds a simple result', (done) => {
      sTokenSource.addText('<?xml version="1.0"?><!DOCTYPE one><one>1<two>2</two>1</one>');
      sTokenSource.endText();

      objStream.on('data', (final: Record<string, any>) => {
         const result = JSON.parse(JSON.stringify(final));
         expect(result).toEqual({
            type: 'one',
            attr: {},
            content: [
               '1', {
                  type: 'two',
                  attr: {},
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

   it('includes CDATA', (done) => {
      sTokenSource.addText('<?xml version="1.0"?><!DOCTYPE one><one>1<![CDATA[<two>2</two>]]>1</one>');
      sTokenSource.endText();

      objStream.on('data', (final: Record<string, any>) => {
         const result = JSON.parse(JSON.stringify(final));
         expect(result).toEqual({
            type: 'one',
            attr: {},
            content: [
               '1',
               '<two>2</two>',
               '1',
            ],
         });
         done();
      });
   });

   // it('does everything', (done) => {
   //    const SRC_ROOT = '..';
   //    /* eslint-disable no-console, global-require */

   //    const PTokenStream = require(SRC_ROOT + '/parse').PTokenStream;
   //    const TokenStream = require(SRC_ROOT + '/tokenize').XTokenStream;
   //    const SimpleObjStream = require('./so.js').default;

   //    const pTokenStream = new PTokenStream();
   //    const tokenStream = new TokenStream();
   //    const objStream = new SimpleObjStream();
   //    pTokenStream.on('end', () => {
   //       // console.log('Got the end');
   //    });

   //    pTokenStream.pipe(tokenStream).pipe(objStream);
   //    //const data = fs.readFileSync('./REC-xml-20081126.xml');
   //    const data = require('./foo.json');

   //    // console.log('LENGTH', data.data.length);
   //    pTokenStream.addText(data.data);
   //    pTokenStream.endText();

   //    // pTokenStream.on('end', () => console.log('STREAM ENDING'));
   //    // pTokenStream.on('close', () => console.log('STREAM CLOSE'));
   //    // pTokenStream.on('finish', () => console.log('STREAM FINISH'));
   //    objStream.on('data', (result) => {
   //      console.log('HERE', JSON.stringify(result, undefined, 2));
   //       done();
   //    });

   //    pTokenStream.on('error', (x) => {
   //       console.log('ERROR', x);
   //    });
   // });

});
