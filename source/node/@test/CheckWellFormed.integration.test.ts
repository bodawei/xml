/* Copyright ® 2017-2019 by 柏大衛. All rights reserved. */

import { Offset, EntityId, } from 'basic';
import { STokenSource } from 'basic';
import { ELEMENT_START_PTOKEN } from 'token';
import { WellFormedError, wellFormedErrorCodes  } from 'wellformedness';

import { PTokenStream } from '../pTokenStream';
import CheckWellFormed from '../CheckWellFormed';
import { expectError } from './utils';

const WFEID = wellFormedErrorCodes.id;

describe('CheckWellFormed (integration)', () => {
   let sTokenSource: STokenSource;
   let pTokenStream: PTokenStream;
   let checker: CheckWellFormed;

   beforeEach(() => {
      sTokenSource = new STokenSource() ;
      pTokenStream = new PTokenStream(sTokenSource);
      checker = new CheckWellFormed();

      pTokenStream.pipe(checker);
   });

   function expectInputToProduce(input: string, error: WellFormedError, done: () => void) {
      sTokenSource.addText(input);
      sTokenSource.endText();

      expectError(checker, error, done);
   }

   it('reports an error when the processingInstruction has a missing space', (done) => {
      expectInputToProduce('<?xml version="1.0"?><? aTarget',
         new WellFormedError(WFEID.PI_SPACE_AFTER_OPEN,
            [ 'aTarget' ],
            new Offset(new EntityId(), 23, 0, 23),
            new Offset(new EntityId(), 21, 0, 21)
         ), done);
   });

   it('reports an error when the ATTLIST has a bad name', (done) => {
      expectInputToProduce('<?xml version="1.0"?><!DOCTYPE [<!ATTLIST $badName>]>',
         new WellFormedError(WFEID.ATTLISTDECL_ELEMENT_NAME_INVALID,
            [ '$badName' ],
            new Offset(new EntityId(), 42, 0, 42),
            new Offset(new EntityId(), 32, 0, 32),
         ), done);
   });

   it('reports an error when the charData has an invalid char', (done) => {
      expectInputToProduce('<?xml version="1.0"?><one>bad\u0000data</one><one>bad\u0000data</one>',
         new WellFormedError(WFEID.CHARDATA_INVALID_CHAR,
            [ '29' ],
            new Offset(new EntityId(), 26, 0, 26),
            new Offset(new EntityId(), 26, 0, 26)
         ), done);
   });

   it('reports an error when the comment has no close', (done) => {
      expectInputToProduce('<?xml version="1.0"?><!-- foo',
         new WellFormedError(WFEID.COMMENT_NO_CLOSE,
            undefined,
            new Offset(new EntityId(), 29, 0, 29),
            new Offset(new EntityId(), 21, 0, 21)
         ), done);
   });

   it('reports an error when the DOCTYPE type is a bad valud', (done) => {
      expectInputToProduce('<?xml version="1.0"?><!DOCTYPE $badName SYSTEM "sys.xml"[]>',
         new WellFormedError(WFEID.DOCTYPE_NAME_INVALID,
            [ '$badName' ],
            new Offset(new EntityId(), 31, 0, 31),
            new Offset(new EntityId(), 21, 0, 21)
         ), done);
   });

   it('reports an error when the DOCTYPE close is missing', (done) => {
      expectInputToProduce('<?xml version="1.0"?><!DOCTYPE goodName SYSTEM "sys.xml"[]',
         new WellFormedError(WFEID.DOCTYPE_NO_CLOSE,
            undefined,
            new Offset(new EntityId(), 58, 0, 58),
            new Offset(new EntityId(), 21, 0, 21)
         ), done);
   });

   it('reports an error when the element start has the wrong syntax', (done) => {
      expectInputToProduce('<?xml version="1.0"?>< spaceBeforeBad>',
         new WellFormedError(WFEID.ELEMENT_XTRA_LEADING_SPACE,
            [ 'spaceBeforeBad' ],
            new Offset(new EntityId(), 22, 0, 22),
            new Offset(new EntityId(), 21, 0, 21)
         ), done);
   });

   it('reports an error when the element start is after the end (§2.1 production [1])', (done) => {
      expectInputToProduce('<?xml version="1.0"?><one></one><two>',
         new WellFormedError(WFEID.TOKEN_INVALID_CONTEXT,
            [ ELEMENT_START_PTOKEN ],
            new Offset(new EntityId(), 32, 0, 32),
            new Offset(new EntityId(), 32, 0, 32)
         ), done);
   });

   it('reports an error when the empty element has the wrong syntax', (done) => {
      expectInputToProduce('<?xml version="1.0"?>< spaceBeforeBad/>',
         new WellFormedError(WFEID.ELEMENT_XTRA_LEADING_SPACE,
            [ 'spaceBeforeBad' ],
            new Offset(new EntityId(), 22, 0, 22),
            new Offset(new EntityId(), 21, 0, 21)
         ), done);
   });

   it('reports an error when the element end tag has the wrong syntax', (done) => {
      expectInputToProduce('<?xml version="1.0"?><spaceBeforeBad></ spaceBeforeBad>',
         new WellFormedError(WFEID.ELEMENT_XTRA_LEADING_SPACE,
            [ 'spaceBeforeBad' ],
            new Offset(new EntityId(), 39, 0, 39),
            new Offset(new EntityId(), 37, 0, 37)
         ), done);
   });

   it('reports an error when an ELEMENT declaration has the wrong syntax', (done) => {
      expectInputToProduce('<?xml version="1.0"?><!DOCTYPE foo [<!ELEMENT elDec BOGUS>]>',
         new WellFormedError(WFEID.ELEMENTDECL_SPEC_UNKNOWN,
            [ 'elDec', 'BOGUS' ],
            new Offset(new EntityId(), 52, 0, 52),
            new Offset(new EntityId(), 36, 0, 36)
         ), done);
   });

   it('reports an error when an ENTITY declaration has the wrong syntax', (done) => {
      expectInputToProduce('<?xml version="1.0"?><!DOCTYPE foo [<!ENTITY %entityName "frog">]>',
         new WellFormedError(WFEID.ENTITYDECL_PERCENT_NO_TRAILING_SPACE,
            [ 'entityName' ],
            new Offset(new EntityId(), 46, 0, 46),
            new Offset(new EntityId(), 36, 0, 36)
         ), done);
   });

   it('reports an error when an entity reference has the wrong syntax', (done) => {
      expectInputToProduce('<?xml version="1.0"?><one>& entityRef;</one>',
         new WellFormedError(WFEID.REFERENCE_XTRA_SPACE,
            [ 'entityRef' ],
            new Offset(new EntityId(), 27, 0, 27),
            new Offset(new EntityId(), 26, 0, 26)
         ), done);
   });

   it('reports an error when a parameter entity reference has the wrong syntax', (done) => {
      expectInputToProduce('<?xml version="1.0"?><!DOCTYPE foo [% peRef; ]><one></one>',
         new WellFormedError(WFEID.PEREF_XTRA_SPACE,
            [ 'peRef' ],
            new Offset(new EntityId(), 37, 0, 37),
            new Offset(new EntityId(), 36, 0, 36)
         ), done);
   });

   it('reports an error when a NOTATION declaration has the wrong syntax', (done) => {
      expectInputToProduce('<?xml version="1.0"?><!DOCTYPE foo [<!NOTATION $badName SYSTEM "sys.xml">]>',
         new WellFormedError(WFEID.NOTATIONDECL_NAME_INVALID,
            [ '$badName' ],
            new Offset(new EntityId(), 47, 0, 47),
            new Offset(new EntityId(), 36, 0, 36)
         ), done);
   });

   it('reports an error when an CDATA has a bad character in its content', (done) => {
      expectInputToProduce('<?xml version="1.0"?><![CDATA[foo\u0000 bad',
         new WellFormedError(WFEID.CDATA_NO_CLOSE,
            [ 'CDATA' ],
            new Offset(new EntityId(), 38, 0, 38),
            new Offset(new EntityId(), 21, 0, 21)
         ), done);
   });

   it('reports an error if the XML DEclaration version attribute is the wrong case', (done) => {
      expectInputToProduce('<?xml VERSION="1.0"?>',
         new WellFormedError(WFEID.XMLDECL_PARAM_INVALID_CASE,
            [ 'version', 'VERSION' ],
            new Offset(new EntityId(), 6, 0, 6),
            new Offset(new EntityId(), 0, 0, 0)
         ), done);
   });

   it('reports an error if there is a stray > in the DTD', (done) => {
      expectInputToProduce('<?xml version="1.0"?><!DOCTYPE root [ <!ELEMENT root ANY> > ]><root/>',
         new WellFormedError(WFEID.MARKUPDECL_INVALID_TOKEN,
            [ 'CHARDATA_PTOKEN' ],
            new Offset(new EntityId(), 58, 0, 58),
            new Offset(new EntityId(), 58, 0, 58)
         ), done);
   });

});
