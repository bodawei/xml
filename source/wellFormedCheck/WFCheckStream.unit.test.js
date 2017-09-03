/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { Offset, Range, EntityLocation } from '../basic';
import { LToken } from '../lToken';
import { ParsedStream } from '../parse';
import { WellFormedError } from '../error';
import { docTypeEnd } from '../token';

import WFCheckStream from './WFCheckStream.js';

describe('WFCheckStream (unit)', () => {
   let parsedStream;
   let checker;

   beforeEach(() => {
      parsedStream = new ParsedStream();
      checker = new WFCheckStream();
      parsedStream.pipe(checker);
   });

   function checkError(inputString, done, resultOffset, errorObject) {
      const results = [];

      checker.on('data', (data) => {
         results.push(data);
      });
      checker.on('end', () => {
         expect(results[resultOffset]).toEqual(errorObject);
         done();
      });
      parsedStream.addText(inputString);
      parsedStream.endText();
   }

   describe('XML_DECLARATION', () => {

      it('reports state error if the declaration is not the first thing in the document', (done) => {
         // after the doctype error, start and end
         checkError('<!DOCTYPE foo><?xml version="1.0"?>', done, 3,
            new WellFormedError('XMLDECL_INVALID_CONTEXT', undefined,
               new Offset(new EntityLocation(), 14, 0, 14), new Offset(new EntityLocation(), 14, 0, 14)));
      });

   });

   describe('DOCTYPE', () => {

      it('reports state error if the start comes before the declaration', (done) => {
         checkError('<!DOCTYPE foo><?xml version="1.0"?>', done, 0,
            new WellFormedError('DOCTYPE_INVALID_DOC_CONTEXT', undefined,
               new Offset(new EntityLocation(), 0, 0, 0), new Offset(new EntityLocation(), 0, 0, 0)));
      });

      it('reports state error if the start comes before the declaration', (done) => {
         const results = [];

         checker.on('data', (data) => {
            results.push(data);
         });
         checker.on('end', () => {
            expect(results[0]).toEqual(new WellFormedError('DOCTYPE_INVALID_DOC_CONTEXT', undefined,
               new Offset(new EntityLocation(), 0, 0, 0), new Offset(new EntityLocation(), 0, 0, 0)));
            done();
         });

         checker.write({
            type: docTypeEnd.TYPE,
            openLToken: new LToken('x', 'x', new Range(new EntityLocation(), 0, 0)),
         });
         checker.end();
      });

   });

});
