/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { Offset, Range, EntityLocation } from '../basic';
import { LToken } from '../lToken';
import { ParsedStream } from '../parse';
import { WellFormedError } from '../error';

import WFCheckStream from './WFCheckStream.js';

describe('WFCheckStream (integration)', () => {
   let parsedStream;
   let checker;

   beforeEach(() => {
      parsedStream = new ParsedStream();
      checker = new WFCheckStream();
      parsedStream.pipe(checker);
   });

   describe('XML_DECLARATION', () => {

      it('reports an error if the version attribute is the wrong case', (done) => {
         const results = [];

         checker.on('data', (data) => {
            results.push(data);
         });
         checker.on('end', () => {
            expect(results).toEqual([
               new WellFormedError('XMLDECL_ATTR_INVALID_CASE', [ 'version', 'VERSION' ],
                  new Offset(new EntityLocation(), 6, 0, 6), new Offset(new EntityLocation(), 0, 0, 0)),
               {
                  type: 'XML_DECLARATION',
                  openLToken: new LToken('<?', '<?', new Range(new EntityLocation(), 0, 0, 0, 2, 0, 2)),
                  postOpenSpaceLToken: undefined,
                  targetLToken: new LToken('xml', 'xml', new Range(new EntityLocation(), 2, 0, 2, 5, 0, 5)),
                  postTargetSpaceLToken: new LToken(' ', ' ', new Range(new EntityLocation(), 5, 0, 5, 6, 0, 6)),
                  params: [ {
                     nameLToken: new LToken('VERSION', 'VERSION', new Range(new EntityLocation(), 6, 0, 6, 13, 0, 13)),
                     postNameSpaceLToken: undefined,
                     equalLToken: new LToken('=', '=', new Range(new EntityLocation(), 13, 0, 13, 14, 0, 14)),
                     postEqualSpaceLToken: undefined,
                     openQuoteLToken: new LToken('"', '"', new Range(new EntityLocation(), 14, 0, 14, 15, 0, 15)),
                     valueLToken: new LToken('1.0', '1.0', new Range(new EntityLocation(), 15, 0, 15, 18, 0, 18)),
                     closeQuoteLToken: new LToken('"', '"', new Range(new EntityLocation(), 18, 0, 18, 19, 0, 19)),
                     trailingSpaceLToken: undefined,
                  } ],
                  closeLToken:  new LToken('?>', '?>', new Range(new EntityLocation(), 19, 0, 19, 21, 0, 21)),
               },
            ]);
            done();
         });
         parsedStream.addText('<?xml VERSION="1.0"?>');
         parsedStream.endText();
      });

   });

   describe('DOCTYPE', () => {

      it('reports an error and the parsed value when the input name is bad', (done) => {
         const results = [];

         const error = new WellFormedError(WellFormedError.ID.DOCTYPE_NAME_INVALID, [ '$badName' ],
                  new Offset(new EntityLocation(), 10, 0, 10), new Offset(new EntityLocation(), 0, 0, 0));
         function evaluate() {
            expect(results).toEqual([
               error,
               {
                  type: 'DOCTYPE_START',
                  openLToken: new LToken('<!', '<!', new Range(new EntityLocation(), 0, 0, 0, 2, 0, 2)),
                  postOpenSpaceLToken: undefined,
                  declTypeLToken: new LToken('DOCTYPE', 'DOCTYPE', new Range(new EntityLocation(), 2, 0, 2, 9, 0, 9)),
                  postDeclTypeSpaceLToken: new LToken(' ', ' ', new Range(new EntityLocation(), 9, 0, 9, 10, 0, 10)),
                  nameLToken: new LToken('$badName', '$badName', new Range(new EntityLocation(), 10, 0, 10, 18, 0, 18)),
                  postNameSpaceLToken: new LToken(' ', ' ', new Range(new EntityLocation(), 18, 0, 18, 19, 0, 19)),
                  externalId: {
                     type: 'EXTERNAL_ID',
                     typeLToken: new LToken('SYSTEM', 'SYSTEM', new Range(new EntityLocation(), 19, 0, 19, 25, 0, 25)),
                     postTypeSpaceLToken: new LToken(' ', ' ', new Range(new EntityLocation(), 25, 0, 25, 26, 0, 26)),
                     systemOpenQuoteLToken: new LToken('"', '"', new Range(new EntityLocation(), 26, 0, 26, 27, 0, 27)),
                     systemLToken: new LToken('sys.xml', 'sys.xml',
                        new Range(new EntityLocation(), 27, 0, 27, 34, 0, 34)),
                     systemCloseQuoteLToken: new LToken('"', '"', new Range(new EntityLocation(), 34, 0, 34, 35, 0, 35)),
                  },
                  postExternalIdSpaceLToken: undefined,
                  startInternalSubsetLToken: new LToken('[', '[', new Range(new EntityLocation(), 35, 0, 35, 36, 0, 36)),
               }, {
                  type: 'DOCTYPE_END',
                  closeInternalSubsetLToken: new LToken(']', ']', new Range(new EntityLocation(), 36, 0, 36, 37, 0, 37)),
                  postCloseInternalSubsetSpaceLToken: undefined,
                  closeLToken: new LToken('>', '>', new Range(new EntityLocation(), 37, 0, 37, 38, 0, 38)),
               },
            ]);

            done();
         }

         parsedStream.addText('<!DOCTYPE $badName SYSTEM "sys.xml"[]>');
         parsedStream.endText();

         checker.on('data', (data) => results.push(data));
         checker.on('end', evaluate);
      });

      it('reports an error and the parsed value when the close is missing', (done) => {
         const results = [];

         const error = new WellFormedError(WellFormedError.ID.DOCTYPE_NO_CLOSE, undefined,
                  new Offset(new EntityLocation(), 37, 0, 37), new Offset(new EntityLocation(), 0, 0, 0));
         function evaluate() {
            expect(results).toEqual([ {
               type: 'DOCTYPE_START',
               openLToken: new LToken('<!', '<!', new Range(new EntityLocation(), 0, 0, 0, 2, 0, 2)),
               postOpenSpaceLToken: undefined,
               declTypeLToken: new LToken('DOCTYPE', 'DOCTYPE', new Range(new EntityLocation(), 2, 0, 2, 9, 0, 9)),
               postDeclTypeSpaceLToken: new LToken(' ', ' ', new Range(new EntityLocation(), 9, 0, 9, 10, 0, 10)),
               nameLToken: new LToken('goodName', 'goodName', new Range(new EntityLocation(), 10, 0, 10, 18, 0, 18)),
               postNameSpaceLToken: new LToken(' ', ' ', new Range(new EntityLocation(), 18, 0, 18, 19, 0, 19)),
               externalId: {
                  type: 'EXTERNAL_ID',
                  typeLToken: new LToken('SYSTEM', 'SYSTEM', new Range(new EntityLocation(), 19, 0, 19, 25, 0, 25)),
                  postTypeSpaceLToken: new LToken(' ', ' ', new Range(new EntityLocation(), 25, 0, 25, 26, 0, 26)),
                  systemOpenQuoteLToken: new LToken('"', '"', new Range(new EntityLocation(), 26, 0, 26, 27, 0, 27)),
                  systemLToken: new LToken('sys.xml', 'sys.xml',
                     new Range(new EntityLocation(), 27, 0, 27, 34, 0, 34)),
                  systemCloseQuoteLToken: new LToken('"', '"', new Range(new EntityLocation(), 34, 0, 34, 35, 0, 35)),
               },
               postExternalIdSpaceLToken: undefined,
               startInternalSubsetLToken: new LToken('[', '[', new Range(new EntityLocation(), 35, 0, 35, 36, 0, 36)),
            },
               error,
            {
               type: 'DOCTYPE_END',
               closeInternalSubsetLToken: new LToken(']', ']', new Range(new EntityLocation(), 36, 0, 36, 37, 0, 37)),
               postCloseInternalSubsetSpaceLToken: undefined,
               closeLToken: undefined,
            } ]);

            done();
         }

         parsedStream.addText('<!DOCTYPE goodName SYSTEM "sys.xml"[]');
         parsedStream.endText();

         checker.on('data', (data) => results.push(data));
         checker.on('end', evaluate);
      });

   });

});
