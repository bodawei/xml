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
                  new Offset(new EntityLocation(), 31, 0, 31), new Offset(new EntityLocation(), 21, 0, 21));
         function evaluate() {
            results.shift();  // remove the xml declaration
            expect(results).toEqual([
               error,
               {
                  type: 'DOCTYPE_START',
                  openLToken: new LToken('<!', '<!', new Range(new EntityLocation(), 21, 0, 21, 23, 0, 23)),
                  postOpenSpaceLToken: undefined,
                  declTypeLToken: new LToken('DOCTYPE', 'DOCTYPE',
                     new Range(new EntityLocation(), 23, 0, 23, 30, 0, 30)),
                  postDeclTypeSpaceLToken: new LToken(' ', ' ', new Range(new EntityLocation(), 30, 0, 30, 31, 0, 31)),
                  nameLToken: new LToken('$badName', '$badName', new Range(new EntityLocation(), 31, 0, 31, 39, 0, 39)),
                  postNameSpaceLToken: new LToken(' ', ' ', new Range(new EntityLocation(), 39, 0, 39, 40, 0, 40)),
                  externalId: {
                     type: 'EXTERNAL_ID',
                     typeLToken: new LToken('SYSTEM', 'SYSTEM', new Range(new EntityLocation(), 40, 0, 40, 46, 0, 46)),
                     postTypeSpaceLToken: new LToken(' ', ' ', new Range(new EntityLocation(), 46, 0, 46, 47, 0, 47)),
                     systemOpenQuoteLToken: new LToken('"', '"',
                        new Range(new EntityLocation(), 47, 0, 47, 48, 0, 48)),
                     systemLToken: new LToken('sys.xml', 'sys.xml',
                        new Range(new EntityLocation(), 48, 0, 48, 55, 0, 55)),
                     systemCloseQuoteLToken: new LToken('"', '"',
                        new Range(new EntityLocation(), 55, 0, 55, 56, 0, 56)),
                  },
                  postExternalIdSpaceLToken: undefined,
                  startInternalSubsetLToken: new LToken('[', '[',
                     new Range(new EntityLocation(), 56, 0, 56, 57, 0, 57)),
               }, {
                  type: 'DOCTYPE_END',
                  closeInternalSubsetLToken: new LToken(']', ']',
                     new Range(new EntityLocation(), 57, 0, 57, 58, 0, 58)),
                  postCloseInternalSubsetSpaceLToken: undefined,
                  closeLToken: new LToken('>', '>', new Range(new EntityLocation(), 58, 0, 58, 59, 0, 59)),
               },
            ]);

            done();
         }

         parsedStream.addText('<?xml version="1.0"?><!DOCTYPE $badName SYSTEM "sys.xml"[]>');
         parsedStream.endText();

         checker.on('data', (data) => results.push(data));
         checker.on('end', evaluate);
      });

      it('reports an error and the parsed value when the close is missing', (done) => {
         const results = [];

         const error = new WellFormedError(WellFormedError.ID.DOCTYPE_NO_CLOSE, undefined,
                  new Offset(new EntityLocation(), 58, 0, 58), new Offset(new EntityLocation(), 21, 0, 21));
         function evaluate() {
            results.shift();
            expect(results).toEqual([ {
               type: 'DOCTYPE_START',
               openLToken: new LToken('<!', '<!', new Range(new EntityLocation(), 21, 0, 21, 23, 0, 23)),
               postOpenSpaceLToken: undefined,
               declTypeLToken: new LToken('DOCTYPE', 'DOCTYPE', new Range(new EntityLocation(), 23, 0, 23, 30, 0, 30)),
               postDeclTypeSpaceLToken: new LToken(' ', ' ', new Range(new EntityLocation(), 30, 0, 30, 31, 0, 31)),
               nameLToken: new LToken('goodName', 'goodName', new Range(new EntityLocation(), 31, 0, 31, 39, 0, 39)),
               postNameSpaceLToken: new LToken(' ', ' ', new Range(new EntityLocation(), 39, 0, 39, 40, 0, 40)),
               externalId: {
                  type: 'EXTERNAL_ID',
                  typeLToken: new LToken('SYSTEM', 'SYSTEM', new Range(new EntityLocation(), 40, 0, 40, 46, 0, 46)),
                  postTypeSpaceLToken: new LToken(' ', ' ', new Range(new EntityLocation(), 46, 0, 46, 47, 0, 47)),
                  systemOpenQuoteLToken: new LToken('"', '"', new Range(new EntityLocation(), 47, 0, 47, 48, 0, 48)),
                  systemLToken: new LToken('sys.xml', 'sys.xml',
                     new Range(new EntityLocation(), 48, 0, 48, 55, 0, 55)),
                  systemCloseQuoteLToken: new LToken('"', '"', new Range(new EntityLocation(), 55, 0, 55, 56, 0, 56)),
               },
               postExternalIdSpaceLToken: undefined,
               startInternalSubsetLToken: new LToken('[', '[', new Range(new EntityLocation(), 56, 0, 56, 57, 0, 57)),
            },
               error,
            {
               type: 'DOCTYPE_END',
               closeInternalSubsetLToken: new LToken(']', ']', new Range(new EntityLocation(), 57, 0, 57, 58, 0, 58)),
               postCloseInternalSubsetSpaceLToken: undefined,
               closeLToken: undefined,
            } ]);

            done();
         }

         parsedStream.addText('<?xml version="1.0"?><!DOCTYPE goodName SYSTEM "sys.xml"[]');
         parsedStream.endText();

         checker.on('data', (data) => results.push(data));
         checker.on('end', evaluate);
      });

   });

});
