/* Copyright ® 2018-2026 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';

import { ConformanceVersion, Range, EntityId } from 'basic';
import { ParamCollector } from 'basic-test';
import { AttListDeclarationPToken } from 'pToken';
import { SToken, toSToken } from 'basic';
import { WordListPToken, WordListType } from 'token';

import { literalCheck } from '../../common/literalCheck';
import { nameCheck } from '../../common/nameCheck';
import { nameXmlCheck } from '../../common/nameXmlCheck';
import { wordListCheck } from '../../common/wordlistCheck';
import { wellFormedErrorCodes } from '../../error/wellFormedError';
import { warningCodes } from '../../error/warningCodes';

import { attListDeclarationCheck } from '../attListDeclarationCheck';

jest.mock('../../common/literalCheck');
jest.mock('../../common/nameCheck');
jest.mock('../../common/nameXmlCheck');
jest.mock('../../common/wordlistCheck');

const WFEID = wellFormedErrorCodes.id;
const WID = warningCodes.id;

describe('attListDeclarationCheck()', () => {
   let collector: ParamCollector;
   let confVer: ConformanceVersion;
   let aldPToken: AttListDeclarationPToken;
   let mockLiteralCheck: jest.MockedFunction<typeof literalCheck>;

   beforeEach(() => {
      aldPToken = new AttListDeclarationPToken({
         declType: toSToken('ATTLIST'),
         elementName: toSToken('elementName'),
         elementNameSpace: toSToken(' '),
         open: toSToken('<!'),
         attDefs: [
            {
               name: toSToken('att1'),
               nameSpace: toSToken(' '),
               type: toSToken('CDATA'),
               typeSpace: toSToken(' '),
               defaultType: toSToken('#REQUIRED'),
               defaultTypeSpace: toSToken(' '),
               value: [],
            },
         ],
         close: toSToken('>'),
      });

      collector = new ParamCollector();
      confVer = new ConformanceVersion();

      mockLiteralCheck = literalCheck as jest.MockedFunction<typeof literalCheck>;
   });

   it('reports an error if the declaration type is not all caps', () => {
      const testToken = new AttListDeclarationPToken(aldPToken, {
         declType: toSToken('attlist'),
      });

      attListDeclarationCheck(testToken, collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.ATTLISTDECL_DECLTYPE_INVALID,
         lastPosition: undefined,
         params: ['attlist'],
         position: testToken.declType,
      });
   });

   it('reports an error if there is no element name', () => {
      const testToken = new AttListDeclarationPToken(aldPToken, {
         elementName: undefined,
      });

      attListDeclarationCheck(testToken, collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.ATTLISTDECL_NO_ELEMENT_NAME,
         lastPosition: testToken.declType,
         params: [],
         position: undefined,
      });
   });

   it('reports an error if there is no space after the element name and there are attdefs', () => {
      const testToken = new AttListDeclarationPToken(aldPToken, {
         elementNameSpace: undefined,
      });

      attListDeclarationCheck(testToken, collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.ATTLISTDECL_ELEMENT_NAME_NO_TRAILING_SPACE,
         lastPosition: testToken.elementName,
         params: [],
         position: undefined,
      });
   });

   it('reports no error if there is no space after the element name and there are no attdefs', () => {
      const testToken = new AttListDeclarationPToken(aldPToken, {
         attDefs: [],
         elementNameSpace: undefined,
      });

      attListDeclarationCheck(testToken, collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).not.toHaveAnyProblems();
   });

   it('reports no error if there are no attribute definitions', () => {
      const testToken = new AttListDeclarationPToken(aldPToken, {
         attDefs: [],
      });

      attListDeclarationCheck(testToken, collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).not.toHaveAnyProblems();
   });

   it('calls nameCheck() to report on name validity', () => {
      attListDeclarationCheck(aldPToken, collector, confVer);

      expect(nameCheck).toHaveBeenCalledWith(
         aldPToken.elementName,
         collector,
         confVer,
         WFEID.ATTLISTDECL_ELEMENT_NAME_INVALID,
      );
   });

   it('calls nameCheck() to report on attribute name validity', () => {
      attListDeclarationCheck(aldPToken, collector, confVer);

      expect(nameCheck).toHaveBeenCalledWith(
         aldPToken.attDefs[0].name,
         collector,
         confVer,
         WFEID.ATTLISTDECL_ATTR_NAME_INVALID,
      );
   });

   it('calls nameXmlCheck() to report on attribute name conformance', () => {
      attListDeclarationCheck(aldPToken, collector, confVer);

      expect(nameXmlCheck).toHaveBeenCalledWith(
         aldPToken.attDefs[0].name,
         collector,
         confVer,
         'ATTRIBUTE',
         WID.ATTLISTDECL_ATTR_NAME_XMLCOLON_RESERVED,
         WID.ATTLISTDECL_ATTR_NAME_XML_RESERVED,
      );
   });

   it('reports a warning if the same attribute name is listed multiple times', () => {
      const testToken = new AttListDeclarationPToken(aldPToken, {
         attDefs: [
            {
               name: toSToken('att1'),
               nameSpace: toSToken(' '),
               type: toSToken('CDATA'),
               typeSpace: toSToken(' '),
               defaultType: toSToken('#REQUIRED'),
               defaultTypeSpace: toSToken(' '),
               value: [],
            },
            {
               name: toSToken('two'),
               value: [],
            },
            {
               name: new SToken('att1', 'att1', new Range(new EntityId(), 10, 0, 10, 15, 0, 15)),
               value: [],
            },
         ],
      });

      attListDeclarationCheck(testToken, collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWFWarning({
         params: ['att1'],
         id: WID.ATTLISTDECL_ATTR_NAME_DUPLICATE,
         position: testToken.attDefs[2].name,
      });
   });

   it('reports an error if there is no space after the attribute name', () => {
      const testToken = new AttListDeclarationPToken(aldPToken, {
         attDefs: [
            {
               name: toSToken('att1'),
               nameSpace: undefined,
               type: toSToken('CDATA'),
               typeSpace: toSToken(' '),
               defaultType: toSToken('#REQUIRED'),
               defaultTypeSpace: toSToken(' '),
               value: [],
            },
         ],
      });

      attListDeclarationCheck(testToken, collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.ATTLISTDECL_ATTR_NAME_NO_SPACE,
         lastPosition: testToken.attDefs[0].name,
         params: ['att1', 'elementName'],
         position: undefined,
      });
   });

   it('reports an error if an unknown type is provided', () => {
      const testToken = new AttListDeclarationPToken(aldPToken, {
         attDefs: [
            {
               name: toSToken('att1'),
               nameSpace: undefined,
               type: toSToken('bogus'),
               typeSpace: toSToken(' '),
               defaultType: toSToken('#REQUIRED'),
               defaultTypeSpace: toSToken(' '),
               value: [],
            },
         ],
      });

      attListDeclarationCheck(testToken, collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.ATTLISTDECL_ATTR_TYPE_UNKNOWN,
         params: ['att1', 'elementName', 'bogus'],
         position: testToken.attDefs[0].type,
      });
   });

   it('reports no error if the type is CDATA', () => {
      attListDeclarationCheck(aldPToken, collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).not.toHaveAnyProblems();
   });

   it('reports no error if the type is ID', () => {
      const testToken = new AttListDeclarationPToken(aldPToken, {
         attDefs: [
            {
               name: toSToken('att1'),
               nameSpace: toSToken(' '),
               type: toSToken('ID'),
               typeSpace: toSToken(' '),
               defaultType: toSToken('#REQUIRED'),
               defaultTypeSpace: toSToken(' '),
               value: [],
            },
         ],
      });

      attListDeclarationCheck(testToken, collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).not.toHaveAnyProblems();
   });

   it('reports no error if the type is IDREF', () => {
      const testToken = new AttListDeclarationPToken(aldPToken, {
         attDefs: [
            {
               defaultType: toSToken('#REQUIRED'),
               defaultTypeSpace: toSToken(' '),
               name: toSToken('att1'),
               nameSpace: toSToken(' '),
               type: toSToken('IDREF'),
               typeSpace: toSToken(' '),
               value: [],
            },
         ],
      });

      attListDeclarationCheck(testToken, collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).not.toHaveAnyProblems();
   });

   it('reports no error if the type is IDREFS', () => {
      const testToken = new AttListDeclarationPToken(aldPToken, {
         attDefs: [
            {
               name: toSToken('att1'),
               nameSpace: toSToken(' '),
               type: toSToken('IDREFS'),
               typeSpace: toSToken(' '),
               defaultType: toSToken('#REQUIRED'),
               defaultTypeSpace: toSToken(' '),
               value: [],
            },
         ],
      });

      attListDeclarationCheck(testToken, collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).not.toHaveAnyProblems();
   });

   it('reports no error if the type is ENTITY', () => {
      const testToken = new AttListDeclarationPToken(aldPToken, {
         attDefs: [
            {
               name: toSToken('att1'),
               nameSpace: toSToken(' '),
               type: toSToken('ENTITY'),
               typeSpace: toSToken(' '),
               defaultType: toSToken('#REQUIRED'),
               defaultTypeSpace: toSToken(' '),
               value: [],
            },
         ],
      });

      attListDeclarationCheck(testToken, collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).not.toHaveAnyProblems();
   });

   it('reports no error if the type is ENTITIES', () => {
      const testToken = new AttListDeclarationPToken(aldPToken, {
         attDefs: [
            {
               defaultType: toSToken('#REQUIRED'),
               defaultTypeSpace: toSToken(' '),
               name: toSToken('att1'),
               nameSpace: toSToken(' '),
               type: toSToken('ENTITIES'),
               typeSpace: toSToken(' '),
               value: [],
            },
         ],
      });

      attListDeclarationCheck(testToken, collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).not.toHaveAnyProblems();
   });

   it('reports no error if the type is NMTOKEN', () => {
      const testToken = new AttListDeclarationPToken(aldPToken, {
         attDefs: [
            {
               defaultType: toSToken('#REQUIRED'),
               defaultTypeSpace: toSToken(' '),
               name: toSToken('att1'),
               nameSpace: toSToken(' '),
               type: toSToken('NMTOKEN'),
               typeSpace: toSToken(' '),
               value: [],
            },
         ],
      });

      attListDeclarationCheck(testToken, collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).not.toHaveAnyProblems();
   });

   it('reports no error if the type is NMTOKENS', () => {
      const testToken = new AttListDeclarationPToken(aldPToken, {
         attDefs: [
            {
               defaultType: toSToken('#REQUIRED'),
               defaultTypeSpace: toSToken(' '),
               name: toSToken('att1'),
               nameSpace: toSToken(' '),
               type: toSToken('NMTOKENS'),
               typeSpace: toSToken(' '),
               value: [],
            },
         ],
      });

      attListDeclarationCheck(testToken, collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).not.toHaveAnyProblems();
   });

   it('reports no error if the type is NOTATION', () => {
      const testToken = new AttListDeclarationPToken(aldPToken, {
         elementName: toSToken('BUG'),
         attDefs: [
            {
               name: toSToken('att1'),
               nameSpace: toSToken(' '),
               type: toSToken('NOTATION'),
               typeSpace: toSToken(' '),
               enumeration: new WordListPToken(WordListType.NOTATION, {
                  open: toSToken('('),
                  words: [
                     {
                        word: toSToken('x'),
                     },
                  ],
                  close: toSToken(')'),
                  closeSpace: toSToken(' '),
               }),
               defaultType: toSToken('#REQUIRED'),
               defaultTypeSpace: toSToken(' '),
               value: [],
            },
         ],
      });

      attListDeclarationCheck(testToken, collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).not.toHaveAnyProblems();
   });

   it('reports an error if an the type is miscased', () => {
      const testToken = new AttListDeclarationPToken(aldPToken, {
         attDefs: [
            {
               defaultType: toSToken('#REQUIRED'),
               defaultTypeSpace: toSToken(' '),
               name: toSToken('att1'),
               nameSpace: toSToken(' '),
               type: toSToken('cdata'),
               typeSpace: toSToken(' '),
               value: [],
            },
         ],
      });

      attListDeclarationCheck(testToken, collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.ATTLISTDECL_ATTR_TYPE_INVALID,
         params: ['att1', 'elementName', 'cdata'],
         position: testToken.attDefs[0].type,
      });
   });

   it('reports an error this an enumerated type but it has no name list', () => {
      const testToken = new AttListDeclarationPToken(aldPToken, {
         attDefs: [
            {
               defaultType: toSToken('#REQUIRED'),
               defaultTypeSpace: toSToken(' '),
               name: toSToken('att1'),
               nameSpace: toSToken(' '),
               type: undefined,
               typeSpace: toSToken(' '),
               value: [],
            },
         ],
      });

      attListDeclarationCheck(testToken, collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.ATTLISTDECL_ATTR_NO_ATTTYPE,
         lastPosition: testToken.attDefs[0].nameSpace,
         params: ['att1', 'elementName'],
      });
   });

   it('calls wordListCheck() if this is an enumerated type', () => {
      const enumeration = new WordListPToken(WordListType.ENUMERATION, {
         open: toSToken(' '),
      });
      const testToken = new AttListDeclarationPToken(aldPToken, {
         attDefs: [
            {
               name: toSToken('att1'),
               nameSpace: toSToken(' '),
               type: undefined,
               typeSpace: toSToken(' '),
               enumeration,
               defaultType: toSToken('#REQUIRED'),
               defaultTypeSpace: toSToken(' '),
               value: [],
            },
         ],
      });

      attListDeclarationCheck(testToken, collector, confVer);

      expect(wordListCheck).toHaveBeenCalledWith(enumeration, collector, confVer);
   });

   it('reports an error the enumeration does not end with a space', () => {
      const enumeration = new WordListPToken(WordListType.ENUMERATION, {
         open: toSToken(' '),
      });
      const testToken = new AttListDeclarationPToken(aldPToken, {
         attDefs: [
            {
               defaultType: toSToken('#REQUIRED'),
               defaultTypeSpace: toSToken(' '),
               enumeration,
               name: toSToken('att1'),
               nameSpace: toSToken(' '),
               type: undefined,
               typeSpace: toSToken(' '),
               value: [],
            },
         ],
      });

      attListDeclarationCheck(testToken, collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         lastPosition: testToken.attDefs[0].nameSpace,
         id: WFEID.ATTLISTDECL_ATTR_NO_ENUMERATION_SPACE,
         params: ['att1', 'elementName'],
      });
   });

   it('reports an error if this is an NOTATION type but it has no name list', () => {
      const testToken = new AttListDeclarationPToken(aldPToken, {
         attDefs: [
            {
               defaultType: toSToken('#REQUIRED'),
               defaultTypeSpace: toSToken(' '),
               name: toSToken('att1'),
               nameSpace: toSToken(' '),
               type: toSToken('NOTATION'),
               typeSpace: toSToken(' '),
               value: [],
            },
         ],
      });

      attListDeclarationCheck(testToken, collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.ATTLISTDECL_ATTR_NO_NOTATION,
         params: ['att1', 'elementName'],
         position: testToken.attDefs[0].typeSpace,
      });
   });

   it('calls wordListCheck() if this is an NOTATION type', () => {
      const enumeration = new WordListPToken(WordListType.NOTATION, {
         open: toSToken(' '),
      });
      const testToken = new AttListDeclarationPToken(aldPToken, {
         attDefs: [
            {
               defaultType: toSToken('#REQUIRED'),
               defaultTypeSpace: toSToken(' '),
               enumeration,
               name: toSToken('att1'),
               nameSpace: toSToken(' '),
               type: undefined,
               typeSpace: toSToken(' '),
               value: [],
            },
         ],
      });

      attListDeclarationCheck(testToken, collector, confVer);

      expect(wordListCheck).toHaveBeenCalledWith(enumeration, collector, confVer);
   });

   it('reports an error the NOTATION list does not end with a space', () => {
      const enumeration = new WordListPToken(WordListType.NOTATION, {
         open: toSToken(' '),
      });
      const testToken = new AttListDeclarationPToken(aldPToken, {
         attDefs: [
            {
               name: toSToken('att1'),
               nameSpace: toSToken(' '),
               type: toSToken('NOTATION'),
               typeSpace: toSToken(' '),
               enumeration,
               defaultType: toSToken('#REQUIRED'),
               defaultTypeSpace: toSToken(' '),
               value: [],
            },
         ],
      });

      attListDeclarationCheck(testToken, collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.ATTLISTDECL_ATTR_NO_NOTATION_SPACE,
         params: ['att1', 'elementName'],
         position: testToken.attDefs[0].typeSpace, // Should be the end of the name list, but mocked out
      });
   });

   it('reports an error if there is no space after the attribute type', () => {
      const testToken = new AttListDeclarationPToken(aldPToken, {
         attDefs: [
            {
               name: toSToken('att1'),
               nameSpace: toSToken(' '),
               type: toSToken('CDATA'),
               typeSpace: undefined,
               defaultType: toSToken('#REQUIRED'),
               defaultTypeSpace: toSToken(' '),
               value: [],
            },
         ],
      });

      attListDeclarationCheck(testToken, collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.ATTLISTDECL_ATTR_TYPE_NO_SPACE,
         params: ['att1', 'CDATA', 'elementName'],
         position: undefined,
         lastPosition: testToken.attDefs[0].type,
      });
   });

   it('reports an error if an unknown defaultType is provided', () => {
      const testToken = new AttListDeclarationPToken(aldPToken, {
         attDefs: [
            {
               name: toSToken('att1'),
               nameSpace: toSToken(' '),
               type: toSToken('CDATA'),
               typeSpace: toSToken(' '),
               defaultType: toSToken('#IMPLICIT'),
               defaultTypeSpace: toSToken(' '),
               value: [],
            },
         ],
      });

      attListDeclarationCheck(testToken, collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.ATTLISTDECL_ATTR_DEFAULT_UNKNOWN,
         params: ['att1', 'elementName', '#IMPLICIT'],
         position: testToken.attDefs[0].defaultType,
      });
   });

   it('reports no error if the type is #REQUIRED', () => {
      const testToken = new AttListDeclarationPToken(aldPToken, {
         attDefs: [
            {
               name: toSToken('att1'),
               nameSpace: toSToken(' '),
               type: toSToken('CDATA'),
               typeSpace: toSToken(' '),
               defaultType: toSToken('#REQUIRED'),
               defaultTypeSpace: toSToken(' '),
               value: [],
            },
         ],
      });

      attListDeclarationCheck(testToken, collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).not.toHaveAnyProblems();
   });

   it('reports no error if the type is #IMPLIED', () => {
      const testToken = new AttListDeclarationPToken(aldPToken, {
         attDefs: [
            {
               name: toSToken('att1'),
               nameSpace: toSToken(' '),
               type: toSToken('CDATA'),
               typeSpace: toSToken(' '),
               defaultType: toSToken('#IMPLIED'),
               defaultTypeSpace: toSToken(' '),
               value: [],
            },
         ],
      });

      attListDeclarationCheck(testToken, collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).not.toHaveAnyProblems();
   });

   it('reports no error if the type is #FIXED', () => {
      const testToken = new AttListDeclarationPToken(aldPToken, {
         attDefs: [
            {
               name: toSToken('att1'),
               nameSpace: toSToken(' '),
               type: toSToken('CDATA'),
               typeSpace: toSToken(' '),
               defaultType: toSToken('#FIXED'),
               defaultTypeSpace: toSToken(' '),
               openQuote: toSToken('"'),
               closeQuote: toSToken('"'),
               value: [],
            },
         ],
      });

      attListDeclarationCheck(testToken, collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).not.toHaveAnyProblems();
   });

   it('reports an error if an the default type is miscased', () => {
      const testToken = new AttListDeclarationPToken(aldPToken, {
         attDefs: [
            {
               name: toSToken('att1'),
               nameSpace: toSToken(' '),
               type: toSToken('CDATA'),
               typeSpace: toSToken(' '),
               defaultType: toSToken('#required'),
               defaultTypeSpace: toSToken(' '),
               value: [],
            },
         ],
      });

      attListDeclarationCheck(testToken, collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.ATTLISTDECL_ATTR_DEFAULT_INVALID,
         params: ['att1', 'elementName', '#required'],
         position: testToken.attDefs[0].defaultType,
      });
   });

   it('reports an error if there is no space after a fixed type', () => {
      const testToken = new AttListDeclarationPToken(aldPToken, {
         attDefs: [
            {
               name: toSToken('att1'),
               nameSpace: toSToken(' '),
               type: toSToken('CDATA'),
               typeSpace: toSToken(' '),
               defaultType: toSToken('#FIXED'),
               defaultTypeSpace: undefined,
               value: [],
            },
         ],
      });

      attListDeclarationCheck(testToken, collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.ATTLISTDECL_ATTR_FIXED_NO_SPACE,
         params: ['att1', 'elementName'],
         position: undefined,
         lastPosition: testToken.attDefs[0].defaultType,
      });
   });

   it('reports an error if there is no value and no defaultType', () => {
      const testToken = new AttListDeclarationPToken(aldPToken, {
         attDefs: [
            {
               name: toSToken('att1'),
               nameSpace: undefined,
               type: toSToken('CDATA'),
               typeSpace: toSToken(' '),
               defaultType: undefined,
               defaultTypeSpace: toSToken(' '),
               value: [],
            },
         ],
      });

      attListDeclarationCheck(testToken, collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.ATTLISTDECL_ATTR_NO_VALUE,
         params: ['att1', 'elementName'],
         position: undefined,
         lastPosition: testToken.attDefs[0].typeSpace,
      });
   });

   it('reports an error if there is no value after a #FIXED', () => {
      const testToken = new AttListDeclarationPToken(aldPToken, {
         attDefs: [
            {
               name: toSToken('att1'),
               nameSpace: toSToken(' '),
               type: toSToken('CDATA'),
               typeSpace: toSToken(' '),
               defaultType: toSToken('#FIXED'),
               defaultTypeSpace: toSToken(' '),
               value: [],
            },
         ],
      });

      attListDeclarationCheck(testToken, collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.ATTLISTDECL_ATTR_FIXED_NO_VALUE,
         params: ['att1', 'elementName'],
         position: undefined,
         lastPosition: testToken.attDefs[0].defaultTypeSpace,
      });
   });

   it('calls mockLiteralCheck() with the attribute data', () => {
      const testToken = new AttListDeclarationPToken(aldPToken, {
         attDefs: [
            {
               name: toSToken('att1'),
               nameSpace: toSToken(' '),
               type: toSToken('CDATA'),
               typeSpace: toSToken(' '),
               defaultType: toSToken('#FIXED'),
               defaultTypeSpace: toSToken(' '),
               value: [],
            },
         ],
      });

      attListDeclarationCheck(testToken, collector, confVer);

      expect(mockLiteralCheck).toHaveBeenCalledWith(
         testToken.attDefs[0],
         collector,
         confVer,
         WFEID.NOUN_ATTRIBUTE,
      );
   });

   it('reports an error if there is a value after a #REQUIRED', () => {
      const testToken = new AttListDeclarationPToken(aldPToken, {
         attDefs: [
            {
               name: toSToken('att1'),
               nameSpace: toSToken(' '),
               type: toSToken('CDATA'),
               typeSpace: toSToken(' '),
               defaultType: toSToken('#REQUIRED'),
               defaultTypeSpace: toSToken(' '),
               openQuote: toSToken('"'),
               value: [],
            },
         ],
      });

      attListDeclarationCheck(testToken, collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.ATTLISTDECL_ATTR_EXTRA_VALUE,
         params: ['att1', 'elementName'],
         position: testToken.attDefs[0].openQuote,
      });
   });

   it('reports an error if there is no close', () => {
      const testToken = new AttListDeclarationPToken(aldPToken, {
         close: undefined,
      });

      attListDeclarationCheck(testToken, collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.ATTLISTDECL_NO_CLOSE,
         params: ['elementName'],
         position: undefined,
         lastPosition: testToken.attDefs[0].defaultTypeSpace,
      });
   });

   it('reports an error if there is extra text after unexpanded', () => {
      const testToken = new AttListDeclarationPToken(aldPToken, {
         extra: toSToken('CDATA'),
      });

      attListDeclarationCheck(testToken, collector, confVer);

      // @ts-expect-error 2329/matchers
      expect(collector).toHaveWellFormedError({
         id: WFEID.ATTLISTDECL_EXTRA_TEXT,
         lastPosition: undefined,
         params: ['CDATA'],
         position: testToken.extra,
      });
   });
});
