/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import {
   Offset,
   EntityLocation,
 } from '../../basic';
import { WellFormedError } from '../../error';
import { PTokenStream } from '../../pTokenStream';

import CheckPTokenWellFormedStream from '../CheckPTokenWellFormedStream.js';

describe('CheckPTokenWellFormedStream (integration)', () => {
   let pTokenStream;
   let checker;

   beforeEach(() => {
      pTokenStream = new PTokenStream();
      checker = new CheckPTokenWellFormedStream();
      pTokenStream.pipe(checker);
   });

   function expectInputToProduce(input, error, done) {
      const results = [];

      checker.on('data', (data) => {
         results.push(data);
      });
      checker.on('end', () => {
         const errors = results.filter((element) => {
            return element instanceof WellFormedError && element.id === error.id;
         });

         expect(errors[0]).toEqual(error);
         done();
      });
      pTokenStream.addText(input);
      pTokenStream.endText();
   }

   it('reports an error when the processingInstruction has a missing space', (done) => {
      expectInputToProduce('<?xml version="1.0"?><? aTarget',
         new WellFormedError('PI_SPACE_AFTER_OPEN',
            [ 'aTarget' ],
            new Offset(new EntityLocation(), 23, 0, 23),
            new Offset(new EntityLocation(), 21, 0, 21)
         ), done);
   });

   it('reports an error when the ATTLIST has a bad name', (done) => {
      expectInputToProduce('<?xml version="1.0"?><!DOCTYPE [<!ATTLIST $badName>]>',
         new WellFormedError('ATTLISTDECL_ELEMENT_NAME_INVALID',
            [ '$badName' ],
            new Offset(new EntityLocation(), 42, 0, 42),
            new Offset(new EntityLocation(), 32, 0, 32),
         ), done);
   });

   it('reports an error when the charData has an invalid char', (done) => {
      expectInputToProduce('<?xml version="1.0"?><one>bad\u0000data</one>',
         new WellFormedError('CHARDATA_INVALID_CHAR',
            [ 29 ],
            new Offset(new EntityLocation(), 26, 0, 26),
            new Offset(new EntityLocation(), 26, 0, 26)
         ), done);
   });

   it('reports an error when the comment has no close', (done) => {
      expectInputToProduce('<?xml version="1.0"?><!-- foo',
         new WellFormedError('COMMENT_NO_CLOSE',
            undefined,
            new Offset(new EntityLocation(), 29, 0, 29),
            new Offset(new EntityLocation(), 21, 0, 21)
         ), done);
   });

   it('reports an error when the DOCTYPE type is a bad valud', (done) => {
      expectInputToProduce('<?xml version="1.0"?><!DOCTYPE $badName SYSTEM "sys.xml"[]>',
         new WellFormedError(WellFormedError.ID.DOCTYPE_NAME_INVALID,
            [ '$badName' ],
            new Offset(new EntityLocation(), 31, 0, 31),
            new Offset(new EntityLocation(), 21, 0, 21)
         ), done);
   });

   it('reports an error when the DOCTYPE close is missing', (done) => {
      expectInputToProduce('<?xml version="1.0"?><!DOCTYPE goodName SYSTEM "sys.xml"[]',
         new WellFormedError(WellFormedError.ID.DOCTYPE_NO_CLOSE,
            undefined,
            new Offset(new EntityLocation(), 58, 0, 58),
            new Offset(new EntityLocation(), 21, 0, 21)
         ), done);
   });

   it('reports an error when the element start has the wrong syntax', (done) => {
      expectInputToProduce('<?xml version="1.0"?>< spaceBeforeBad>',
         new WellFormedError('ELEMENT_XTRA_LEADING_SPACE',
            [ 'spaceBeforeBad' ],
            new Offset(new EntityLocation(), 22, 0, 22),
            new Offset(new EntityLocation(), 21, 0, 21)
         ), done);
   });

   it('reports an error when the empty element has the wrong syntax', (done) => {
      expectInputToProduce('<?xml version="1.0"?>< spaceBeforeBad/>',
         new WellFormedError('ELEMENT_XTRA_LEADING_SPACE',
            [ 'spaceBeforeBad' ],
            new Offset(new EntityLocation(), 22, 0, 22),
            new Offset(new EntityLocation(), 21, 0, 21)
         ), done);
   });

   it('reports an error when the element end tag has the wrong syntax', (done) => {
      expectInputToProduce('<?xml version="1.0"?><spaceBeforeBad></ spaceBeforeBad>',
         new WellFormedError('ELEMENT_XTRA_LEADING_SPACE',
            [ 'spaceBeforeBad' ],
            new Offset(new EntityLocation(), 39, 0, 39),
            new Offset(new EntityLocation(), 37, 0, 37)
         ), done);
   });

   it('reports an error when an ENTITY declaration has the wrong syntax', (done) => {
      expectInputToProduce('<?xml version="1.0"?><!DOCTYPE foo [<!ENTITY %entityName "frog">]>',
         new WellFormedError('ENTITYDECL_PERCENT_NO_TRAILING_SPACE',
            [ 'entityName' ],
            new Offset(new EntityLocation(), 46, 0, 46),
            new Offset(new EntityLocation(), 36, 0, 36)
         ), done);
   });

   it('reports an error when an entity reference has the wrong syntax', (done) => {
      expectInputToProduce('<?xml version="1.0"?><one>& entityRef;</one>',
         new WellFormedError('REFERENCE_XTRA_SPACE',
            [ 'entityRef' ],
            new Offset(new EntityLocation(), 27, 0, 27),
            new Offset(new EntityLocation(), 26, 0, 26)
         ), done);
   });

   it('reports an error when a parameter entity reference has the wrong syntax', (done) => {
      expectInputToProduce('<?xml version="1.0"?><one>% peRef;</one>',
         new WellFormedError('REFERENCE_XTRA_SPACE',
            [ 'peRef' ],
            new Offset(new EntityLocation(), 27, 0, 27),
            new Offset(new EntityLocation(), 26, 0, 26)
         ), done);
   });

   it('reports an error when a NOTATION declaration has the wrong syntax', (done) => {
      expectInputToProduce('<?xml version="1.0"?><!DOCTYPE foo [<!NOTATION $badName SYSTEM "sys.xml">]>',
            new WellFormedError('NOTATIONDECL_NAME_INVALID',
               [ '$badName' ],
               new Offset(new EntityLocation(), 47, 0, 47),
               new Offset(new EntityLocation(), 36, 0, 36)
            ), done);
   });

   it('reports an error when a space is found in the wrong place', (done) => {
      expectInputToProduce('  ',
            new WellFormedError('SPACE_INVALID_CONTEXT',
               undefined,
               new Offset(new EntityLocation(), 0, 0, 0),
               new Offset(new EntityLocation(), 0, 0, 0)
            ), done);
   });

   it('reports an error when an UNKNOWN declaration is found', (done) => {
      expectInputToProduce('<?xml version="1.0"?><!BOGUS',
         new WellFormedError('DECL_UNKNOWN',
            [ 'BOGUS' ],
            new Offset(new EntityLocation(), 23, 0, 23),
            new Offset(new EntityLocation(), 21, 0, 21)
         ), done);
   });

   it('reports an error when an UNKNOWN envelope is found', (done) => {
      expectInputToProduce('<?xml version="1.0"?><![BOGUS[foo]]>',
         new WellFormedError('ENVELOPE_UNKNOWN',
            [ 'BOGUS' ],
            new Offset(new EntityLocation(), 24, 0, 24),
            new Offset(new EntityLocation(), 21, 0, 21)
         ), done);
   });

   it('reports an error when an CDATA has a bad character in its content', (done) => {
      expectInputToProduce('<?xml version="1.0"?><![CDATA[foo\u0000 bad',
         new WellFormedError(WellFormedError.ID.CDATA_NO_CLOSE,
            [ 'CDATA' ],
            new Offset(new EntityLocation(), 38, 0, 38),
            new Offset(new EntityLocation(), 21, 0, 21)
         ), done);
   });

   it('reports an error if the XML DEclaration version attribute is the wrong case', (done) => {
      expectInputToProduce('<?xml VERSION="1.0"?>', new WellFormedError('XMLDECL_ATTR_INVALID_CASE',
            [ 'version', 'VERSION' ],
            new Offset(new EntityLocation(), 6, 0, 6),
            new Offset(new EntityLocation(), 0, 0, 0)
         ), done);
   });

});
