/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { Offset, Range, EntityLocation } from '../basic';
import { Chunk } from '../chunk';
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

   describe('DOCTYPE', () => {

      it('reports an error and the parsed value when the input name is bad', (done) => {
         const results = [];

         function evaluate() {
            expect(results).toEqual([
               new WellFormedError(WellFormedError.ID.DOCTYPE_NAME_INVALID, [ '$badName' ],
                  new Offset(new EntityLocation(), 10, 0, 10), new Offset(new EntityLocation(), 0, 0, 0)),
               {
                  type: 'DOCTYPE_START',
                  openChunk: new Chunk('<!', '<!', new Range(new EntityLocation(), 0, 0, 0, 2, 0, 2)),
                  postOpenSpaceChunk: undefined,
                  declTypeChunk: new Chunk('DOCTYPE', 'DOCTYPE', new Range(new EntityLocation(), 2, 0, 2, 9, 0, 9)),
                  postDeclTypeSpaceChunk: new Chunk(' ', ' ', new Range(new EntityLocation(), 9, 0, 9, 10, 0, 10)),
                  nameChunk: new Chunk('$badName', '$badName', new Range(new EntityLocation(), 10, 0, 10, 18, 0, 18)),
                  postNameSpaceChunk: undefined,
                  startInternalSubsetChunk: undefined,
                  postExternalIdSpaceChunk: undefined,
               },
            ]);

            done();
         }

         parsedStream.addText('<!DOCTYPE $badName');
         parsedStream.endText();

         checker.on('data', (data) => results.push(data));
         checker.on('end', evaluate);
      });

   });

});
