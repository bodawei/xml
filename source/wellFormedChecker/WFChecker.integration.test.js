/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

const Chunk = require('../chunk/Chunk.js');
const Offset = require('../basic/Offset.js');
const Range = require('../basic/Range.js');
const EntityLocation = require('../basic/EntityLocation.js');

const error = require('../error');

const ParsedStream = require('../parser/ParsedStream.js');
const WFChecker = require('./WFChecker.js');

describe('WFChecker', () => {
   let parser;
   let checker;

   beforeEach(() => {
      parser = new ParsedStream();
      checker = new WFChecker();
      parser.pipe(checker);
   });

   describe('DOCTYPE', () => {

      it('reports an error and the parsed value when the input name is bad', (done) => {
         const results = [];

         function evaluate() {
            expect(results).toEqual([
               new error.WellFormedError(error.WellFormedError.ID.DOCTYPE_NAME_INVALID, [ '$badName' ],
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

         parser.addText('<!DOCTYPE $badName');
         parser.endText();

         checker.on('data', (data) => results.push(data));
         checker.on('end', evaluate);
      });

   });

});
