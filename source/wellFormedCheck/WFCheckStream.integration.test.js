/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { Offset, EntityLocation } from '../basic';
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

   function givenInputExpectResult(input, evaluator) {
      const results = [];

      checker.on('data', (data) => {
         results.push(data);
      });
      checker.on('end', () => {
         evaluator(results);
      });
      parsedStream.addText(input);
      parsedStream.endText();
   }

   describe('XML_DECLARATION', () => {

      it('reports an error if the version attribute is the wrong case', (done) => {
         givenInputExpectResult('<?xml VERSION="1.0"?>', (results) => {
            expect(results[0]).toEqual(new WellFormedError('XMLDECL_ATTR_INVALID_CASE',
               [ 'version', 'VERSION' ],
               new Offset(new EntityLocation(), 6, 0, 6),
               new Offset(new EntityLocation(), 0, 0, 0)
            ));
            expect(results[1].type).toEqual('XML_DECLARATION');
            done();
         });
      });

   });

   describe('DOCTYPE', () => {

      it('reports an error and the parsed value when the input name is bad', (done) => {
         givenInputExpectResult('<?xml version="1.0"?><!DOCTYPE $badName SYSTEM "sys.xml"[]>', (results) => {
            expect(results[1]).toEqual(new WellFormedError(WellFormedError.ID.DOCTYPE_NAME_INVALID,
               [ '$badName' ],
               new Offset(new EntityLocation(), 31, 0, 31),
               new Offset(new EntityLocation(), 21, 0, 21)
            ));
            expect(results[2].type).toEqual('DOCTYPE_START');
            expect(results[3].type).toEqual('DOCTYPE_END');
            done();
         });
      });

      it('reports an error and the parsed value when the close is missing', (done) => {
         givenInputExpectResult('<?xml version="1.0"?><!DOCTYPE goodName SYSTEM "sys.xml"[]', (results) => {
            expect(results[0].type).toEqual('XML_DECLARATION');
            expect(results[1].type).toEqual('DOCTYPE_START');
            expect(results[2]).toEqual(new WellFormedError(WellFormedError.ID.DOCTYPE_NO_CLOSE,
               undefined,
               new Offset(new EntityLocation(), 58, 0, 58),
               new Offset(new EntityLocation(), 21, 0, 21)
            ));
            expect(results[3].type).toEqual('DOCTYPE_END');
            done();
         });
      });

   });

   describe('ENTITY', () => {

      it('reports an error when the entity has the wrong syntax', (done) => {
         givenInputExpectResult('<?xml version="1.0"?><!DOCTYPE foo [<!ENTITY %entityName "frog">]>', (results) => {
            expect(results[2]).toEqual(new WellFormedError('ENTITYDECL_PERCENT_NO_TRAILING_SPACE',
               [ 'entityName' ],
               new Offset(new EntityLocation(), 46, 0, 46),
               new Offset(new EntityLocation(), 36, 0, 36)
            ));
            expect(results[3].type).toEqual('ENTITY_DECL');
            done();
         });
      });

   });

});
