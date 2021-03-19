/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { ConformanceVersion, XmlError, XmlWarning } from 'basic';
import { MockErrorCollector } from 'basic-test';
import { GeneralEntityReferencePToken, TextPToken } from 'pToken';
import { makeSTokenMaker } from 'sToken-test';
import { SToken, toSToken } from 'sToken';
import { AttributePToken } from 'token';

import { attributeLangCheck } from '../attributeLangCheck';
import { literalCheck } from '../literalCheck';
import { nameCheck } from '../nameCheck';
import { nameXmlCheck } from '../../common/nameXmlCheck';
import { attributeCheck } from '../attributeCheck';
import { WellFormedError } from '../../error/WellFormedError';

jest.mock('../attributeLangCheck');
jest.mock('../literalCheck');
jest.mock('../nameCheck');
jest.mock('../../common/nameXmlCheck');

describe('attributeCheck (unit)', () => {
   let attributesPChunk: Array<AttributePToken>;
   let confVer: ConformanceVersion;
   let mockErrorCollector: MockErrorCollector;
   let previousSpace: SToken;
   let mockLiteralCheck: jest.MockedFunction<typeof literalCheck>;

   beforeEach(() => {
      attributesPChunk = [
         {
            name: toSToken('version'),
            postNameSpace: toSToken(' '),
            equal: toSToken('='),
            postEqualSpace: toSToken(' '),
            value: [],
            trailingSpace: toSToken(' '),
         },
         {
            name: toSToken('another'),
            postNameSpace: undefined,
            equal: toSToken('='),
            postEqualSpace: undefined,
            value: [],
            trailingSpace: undefined,
         },
      ];

      confVer = new ConformanceVersion();
      const makeToken = makeSTokenMaker();
      previousSpace = makeToken(' ');
      mockErrorCollector = new MockErrorCollector();
      mockLiteralCheck = literalCheck as jest.MockedFunction<typeof literalCheck>;
   });

   it('calls the nameCheck() routine', () => {
      attributeCheck(attributesPChunk, mockErrorCollector, confVer, previousSpace, '');

      expect(nameCheck).toHaveBeenCalledWith(
         attributesPChunk[0].name,
         mockErrorCollector,
         confVer,
         WellFormedError.ID.ATTRIBUTE_INVALID_NAME,
      );
   });

   it('calls the attributeLangCheck() routine', () => {
      attributesPChunk[0].name.str = 'xml:lang';
      attributeCheck(
         attributesPChunk,
         mockErrorCollector,
         confVer,
         previousSpace,
         WellFormedError.ID.NOUN_ATTRIBUTE,
      );

      expect(attributeLangCheck).toHaveBeenCalledWith(
         attributesPChunk[0].value,
         mockErrorCollector,
         confVer,
      );
   });

   it('reports an error if an xml:space attribute has a value other than preserve or default', () => {
      mockLiteralCheck.mockImplementation((_2, _3, _4, _5, callback) => {
         callback?.();
      });

      attributeCheck(
         [
            {
               name: toSToken('xml:space'),
               equal: toSToken('='),
               value: [new TextPToken(toSToken('bogus'))],
            },
         ],
         mockErrorCollector,
         confVer,
         undefined,
         WellFormedError.ID.NOUN_ATTRIBUTE,
      );

      expect(mockErrorCollector).toReportXmlError({
         id: XmlError.ID.XMLSPACE_INVALID_VALUE,
         params: ['bogus'],
         position: undefined,
         lastPosition: toSToken('='),
      });
   });

   it('reports no error if an xml:space attribute has a of default', () => {
      mockLiteralCheck.mockImplementation((_2, _3, _4, _5, callback) => {
         callback?.();
      });

      attributeCheck(
         [
            {
               name: toSToken('xml:space'),
               equal: toSToken('='),
               value: [new TextPToken(toSToken('default'))],
            },
         ],
         mockErrorCollector,
         confVer,
         toSToken(' '),
         WellFormedError.ID.NOUN_ATTRIBUTE,
      );

      expect(mockErrorCollector.errors).toEqual([]);
   });

   it('reports no error if an xml:space attribute has a of preserve', () => {
      mockLiteralCheck.mockImplementation((_2, _3, _4, _5, callback) => {
         callback?.();
      });

      attributeCheck(
         [
            {
               name: toSToken('xml:space'),
               equal: toSToken('='),
               value: [new TextPToken(toSToken('preserve'))],
            },
         ],
         mockErrorCollector,
         confVer,
         toSToken(' '),
         WellFormedError.ID.NOUN_ATTRIBUTE,
      );

      expect(mockErrorCollector.errors).toEqual([]);
   });

   it('asks the literal module to look for problems in the declaration part', () => {
      attributeCheck(
         attributesPChunk,
         mockErrorCollector,
         confVer,
         previousSpace,
         WellFormedError.ID.NOUN_ATTRIBUTE,
      );

      const params = mockLiteralCheck.mock.calls[0];
      expect(params[0]).toEqual(attributesPChunk[0]);
      expect(params[1]).toEqual(mockErrorCollector);
      expect(params[2]).toEqual(confVer);
      expect(params[3]).toEqual(WellFormedError.ID.NOUN_ATTRIBUTE);
      expect(params[4] instanceof Function).toEqual(true);
   });

   it('reports an error if there is no space before the first attribute name', () => {
      attributeCheck(
         attributesPChunk,
         mockErrorCollector,
         confVer,
         undefined,
         WellFormedError.ID.NOUN_ATTRIBUTE,
      );

      expect(mockErrorCollector).toReportWFError({
         id: WellFormedError.ID.ATTRIBUTE_NO_SPACE_BEFORE_NAME,
         params: ['version'],
         position: undefined,
      });
   });

   it('reports an error if there is no space between the first and second attrs', () => {
      delete attributesPChunk[0].trailingSpace;

      attributeCheck(
         attributesPChunk,
         mockErrorCollector,
         confVer,
         previousSpace,
         WellFormedError.ID.NOUN_ATTRIBUTE,
      );

      expect(mockErrorCollector).toReportWFError({
         id: WellFormedError.ID.ATTRIBUTE_NO_SPACE_BEFORE_NAME,
         params: ['another'],
         lastPosition: attributesPChunk[0].postEqualSpace,
      });
   });

   it('calls the nameXmlCheck() function', () => {
      attributeCheck(
         attributesPChunk,
         mockErrorCollector,
         confVer,
         previousSpace,
         WellFormedError.ID.NOUN_ATTRIBUTE,
         () => {},
      );

      expect(nameXmlCheck).toHaveBeenCalledWith(
         attributesPChunk[0].name,
         mockErrorCollector,
         confVer,
         'ATTRIBUTE',
         XmlWarning.ID.ATTRIBUTE_NAME_XMLCOLON_RESERVED,
         XmlWarning.ID.ATTRIBUTE_NAME_XML_RESERVED,
      );
   });

   it('calls the checkName function, if provided', () => {
      const checkName = jest.fn();

      attributeCheck(
         attributesPChunk,
         mockErrorCollector,
         confVer,
         previousSpace,
         WellFormedError.ID.NOUN_ATTRIBUTE,
         checkName,
      );

      expect(checkName).toHaveBeenCalledWith(
         attributesPChunk[0].name,
         0,
         mockErrorCollector,
         confVer,
      );
   });

   it('calls the checkValue function, if provided', () => {
      const checkValue = jest.fn();
      mockLiteralCheck.mockImplementation((_2, _3, _4, _5, callback) => {
         callback?.();
      });

      attributeCheck(
         attributesPChunk,
         mockErrorCollector,
         confVer,
         previousSpace,
         WellFormedError.ID.NOUN_ATTRIBUTE,
         undefined,
         checkValue,
      );

      expect(checkValue).toHaveBeenCalledWith(
         attributesPChunk[0].name,
         attributesPChunk[0].value,
         mockErrorCollector,
         confVer,
      );
   });

   it('reports an error if there is no "=" found', () => {
      delete attributesPChunk[0].equal;

      attributeCheck(
         attributesPChunk,
         mockErrorCollector,
         confVer,
         previousSpace,
         WellFormedError.ID.NOUN_ATTRIBUTE,
      );

      expect(mockErrorCollector).toReportWFError({
         id: WellFormedError.ID.ATTRIBUTE_NO_EQUAL,
         params: ['version'],
         lastPosition: attributesPChunk[0].postNameSpace,
      });
   });

   it('reports an error if attributes have duplicate names', () => {
      attributesPChunk[1].name.str = attributesPChunk[0].name.str;

      attributeCheck(
         attributesPChunk,
         mockErrorCollector,
         confVer,
         previousSpace,
         WellFormedError.ID.NOUN_ATTRIBUTE,
      );

      expect(mockErrorCollector).toReportWFError({
         id: WellFormedError.ID.ATTRIBUTE_DUPLICATE_NAME,
         params: ['version'],
         position: attributesPChunk[1].name,
      });
   });

   it('reports no error if there is a duplicate name but it is not an attribute', () => {
      attributesPChunk[1].name.str = attributesPChunk[0].name.str;

      attributeCheck(attributesPChunk, mockErrorCollector, confVer, previousSpace, 'other');

      expect(mockErrorCollector.errors.length).toEqual(0);
   });

   it('reports an error if there is a "<" in the attribute value', () => {
      mockLiteralCheck.mockImplementation((_2, _3, _4, _5, callback) => {
         callback?.();
      });

      attributesPChunk[1].value = [
         new TextPToken({ text: SToken.fromString('foo') }),
         new GeneralEntityReferencePToken({ open: SToken.fromString('&') }),
         new TextPToken({ text: SToken.fromString('t<o') }),
      ];

      attributeCheck(
         attributesPChunk,
         mockErrorCollector,
         confVer,
         previousSpace,
         WellFormedError.ID.NOUN_ATTRIBUTE,
      );

      expect(mockErrorCollector).toReportWFError({
         id: WellFormedError.ID.ATTRIBUTE_INVALID_VALUE,
         params: ['another'],
         lastPosition: attributesPChunk[1].equal,
      });
   });
});
