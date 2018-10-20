/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData, EntityKind, util } from '../../../basic';
import { ErrorCollector, WellFormedError, XmlWarning } from '../../../error';
import { MockErrorCollector } from '../../../error/@test/helper';
import { SToken } from '../../../sToken';
import { makeSToken } from '../../../sToken/@test/helper';

import misc from '../misc';

describe('misc', () => {

   describe('checkWellFormedNameRecommendation()', () => {
      let WARN1: string;
      let WARN2: string;
      let entityMetaData: EntityMetaData;
      let ec: ErrorCollector;

      beforeEach(() => {
         ec = new ErrorCollector(SToken.fromString('x'), WellFormedError);
         ec.reportError = jasmine.createSpy('callbackSpy');
         entityMetaData = new EntityMetaData();
         WARN1 = 'WARN1';
         WARN2 = 'WARN2';
      });

      it('adds no errors if a name is not passed in', () => {
         misc.checkWellFormedNameRecommendation(undefined as any, ec, entityMetaData, 'ELEMENT', WARN1, WARN2);

         expect(ec.reportError).not.toHaveBeenCalled();
      });

      it('reports no errors if the name does not start with "xml"', () => {
         misc.checkWellFormedNameRecommendation(makeSToken('foo'), ec,
            new EntityMetaData(EntityKind.DOCUMENT, 1, 5), 'ELEMENT', WARN1, WARN2);

         expect(ec.reportError).not.toHaveBeenCalled();
      });

      it('reports no errors if this is an xml:lang attriute', () => {
         misc.checkWellFormedNameRecommendation(makeSToken('xml:lang'), ec,
            new EntityMetaData(EntityKind.DOCUMENT, 1, 5), 'ATTRIBUTE', WARN1, WARN2);

         expect(ec.reportError).not.toHaveBeenCalled();
      });

      it('reports no errors if this is an xml:space attriute', () => {
         misc.checkWellFormedNameRecommendation(makeSToken('xml:space'), ec,
            new EntityMetaData(EntityKind.DOCUMENT, 1, 5), 'ATTRIBUTE', WARN1, WARN2);

         expect(ec.reportError).not.toHaveBeenCalled();
      });

      it('reports a warning if XML:LANG is provided', () => {
         misc.checkWellFormedNameRecommendation(makeSToken('XML:LANG'), ec,
            new EntityMetaData(EntityKind.DOCUMENT, 1, 5), 'ATTRIBUTE', WARN1, WARN2);

         expect(ec.reportError).toHaveBeenCalledWith(WARN2, XmlWarning, [ 'XML:LANG' ]);
      });

      it('reports no error if the version is 1.0/6, and the name starts with "xml"', () => {
         misc.checkWellFormedNameRecommendation(makeSToken('xmlFoo'), ec,
            new EntityMetaData(EntityKind.DOCUMENT, 1, 6), 'ELEMENT', WARN1, WARN2);
         expect(ec.reportError).not.toHaveBeenCalled();
      });

      it('reports a warning if the version is 1.0/6, and the PI name starts with "xml-"', () => {
         misc.checkWellFormedNameRecommendation(makeSToken('xml-Foo'), ec,
            new EntityMetaData(EntityKind.DOCUMENT, 1, 6), 'PI', WARN1, WARN2);
         expect(ec.reportError).toHaveBeenCalledWith(WARN1, XmlWarning, [ 'xml-Foo' ]);
      });

      it('reports a warning if the version is 1.0/6, and the element or attr name starts with "xml:"', () => {
         misc.checkWellFormedNameRecommendation(makeSToken('xml:Foo'), ec,
            new EntityMetaData(EntityKind.DOCUMENT, 1, 6), 'ATTRIBUTE', WARN1, WARN2);

         expect(ec.reportError).toHaveBeenCalledWith(WARN1, XmlWarning, [ 'xml:Foo' ]);
      });

      it('reports no warning if the version is 1.0/6, and the attribute name starts with "xml"', () => {
         misc.checkWellFormedNameRecommendation(makeSToken('xmlFoo'), ec,
            new EntityMetaData(EntityKind.DOCUMENT, 1, 6), 'ELEMENT', WARN1, WARN2);

         expect(ec.reportError).not.toHaveBeenCalled();
      });

      it('reports no warning if the version is 1.0/6, and the entity name starts with "xml"', () => {
         misc.checkWellFormedNameRecommendation(makeSToken('xmlFoo'), ec,
            new EntityMetaData(EntityKind.DOCUMENT, 1, 6), 'ENTITY', WARN1, WARN2);

         expect(ec.reportError).not.toHaveBeenCalled();
      });

      it('reports no warning if the version is 1.0/6, and the PI name starts with "xml"', () => {
         misc.checkWellFormedNameRecommendation(makeSToken('xmlFoo'), ec,
            new EntityMetaData(EntityKind.DOCUMENT, 1, 6), 'PI', WARN1, WARN2);

         expect(ec.reportError).not.toHaveBeenCalled();
      });

      it('reports a warning if the version is 1.0/5, and the name starts with "xml"', () => {
         misc.checkWellFormedNameRecommendation(makeSToken('xmlFoo'), ec,
         new EntityMetaData(EntityKind.DOCUMENT, 1, 5), 'ENTITY', WARN1, WARN2);

         expect(ec.reportError).toHaveBeenCalledWith(WARN2, XmlWarning, [ 'xmlFoo' ]);
      });

      it('reports a warning if the version is 1.0/5, and the PI name starts with "xml-"', () => {
         misc.checkWellFormedNameRecommendation(makeSToken('xml-Foo'), ec,
            new EntityMetaData(EntityKind.DOCUMENT, 1, 5), 'PI', WARN1, WARN2);

         expect(ec.reportError).toHaveBeenCalledWith(WARN2, XmlWarning, [ 'xml-Foo' ]);
      });

      it('reports a warning if the version is 1.0/5, and the element/attr name starts with "xml:"', () => {
         misc.checkWellFormedNameRecommendation(makeSToken('xml:Foo'), ec,
            new EntityMetaData(EntityKind.DOCUMENT, 1, 5), 'ELEMENT', WARN1, WARN2);

         expect(ec.reportError).toHaveBeenCalledWith(WARN2, XmlWarning, [ 'xml:Foo' ]);
      });

   });

   describe('checkName', () => {
      let ec: ErrorCollector;
      let errorId: string;
      let emdV1R5: EntityMetaData;
      let utilIsName: jasmine.Spy;

      beforeEach(() => {
         ec = new ErrorCollector(SToken.fromString('x'), WellFormedError);
         errorId = WellFormedError.ID.ELEMENT_NAME_INVALID;
         emdV1R5 = new EntityMetaData(EntityKind.DOCUMENT, 1.0, 5);
         spyOn(ec, 'report');
         utilIsName = spyOn(util, 'isName');
      });

      it('accepts an empty Stoken', () => {
         misc.checkName(undefined as any, ec, emdV1R5, errorId);

         expect(ec.report).not.toHaveBeenCalled();
      });

      it('calls util.isName()', () => {
         misc.checkName(SToken.fromString('foo'), ec, emdV1R5, errorId);

         expect(util.isName).toHaveBeenCalledWith('foo', 1.0, 5);
      });

      it('reports an error if util.isName() returns false', () => {
         utilIsName.and.returnValue(false);

         misc.checkName(SToken.fromString('foo'), ec, emdV1R5, errorId);

         expect(ec.report).toHaveBeenCalledWith(
            errorId, [ 'foo' ], SToken.fromString('foo'));
      });

   });

   describe('checkNMToken', () => {
      let ec: ErrorCollector;
      let errorId: string;
      let emdV1R5: EntityMetaData;
      let emdV1R4: EntityMetaData;
      let emdV11R2: EntityMetaData;

      beforeEach(() => {
         ec = new ErrorCollector(SToken.fromString('x'), WellFormedError);
         errorId = WellFormedError.ID.ELEMENT_NAME_INVALID;
         emdV1R4 = new EntityMetaData(EntityKind.DOCUMENT, 1.0, 4);
         emdV1R5 = new EntityMetaData(EntityKind.DOCUMENT, 1.0, 5);
         emdV11R2 = new EntityMetaData(EntityKind.DOCUMENT, 1.1, 2);
         spyOn(ec, 'report');
      });

      it('accepts an nmtoken that  is just plain letters', () => {
         const name = 'good';

         misc.checkNMToken(makeSToken(name), ec, emdV1R5, errorId);

         expect(ec.report).not.toHaveBeenCalled();
      });

      it('accepts an nmtoken that has a hyphen, period or digit', () => {
         const name = 'on.-8';

         misc.checkNMToken(makeSToken(name), ec, emdV1R5, errorId);

         expect(ec.report).not.toHaveBeenCalled();
      });

      it('accepts an nmtoken that has the allowable chars above ascii in it', () => {
         const name = 'o\u00B7\u0310\u2040e';

         misc.checkNMToken(makeSToken(name), ec, emdV1R5, errorId);

         expect(ec.report).not.toHaveBeenCalled();
      });

      it('accepts an nmtoken that starts with an astral character (e.g. an emoji)', () => {
         const name = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789:_' +
               '\u00CE\u01F8\u0371\u047F\u200C\u2080\u2CCC\u4001\uF901\uFDF1';

         misc.checkNMToken(makeSToken(name), ec, emdV1R5, errorId);

         expect(ec.report).not.toHaveBeenCalled();
      });

      it('accepts an nmtoken that has a uFDF1 in it', () => {
         const name = 'o\uFDF1e';

         misc.checkNMToken(makeSToken(name), ec, emdV1R5, errorId);

         expect(ec.report).not.toHaveBeenCalled();
      });

      it('rejects an nmtoken with a $ in it', () => {
         const name = 'o$e';

         misc.checkNMToken(makeSToken(name), ec, emdV1R5, errorId);

         expect(ec.report).toHaveBeenCalledWith(
            WellFormedError.ID.ELEMENT_NAME_INVALID, [ name ], makeSToken(name));
      });

      it('allows an nmtoken that starts with a digit', () => {
         const name = '1ne';

         misc.checkNMToken(makeSToken(name), ec, emdV1R5, errorId);

         expect(ec.report).not.toHaveBeenCalled();
      });

      it('accepts an nmtoken that starts with a hyphen', () => {
         const name = '-ne';

         misc.checkNMToken(makeSToken(name), ec, emdV1R5, errorId);

         expect(ec.report).not.toHaveBeenCalled();
      });

      it('accepts an nmtoken that starts with a period', () => {
         const name = '.ne';

         misc.checkNMToken(makeSToken(name), ec, emdV1R5, errorId);

         expect(ec.report).not.toHaveBeenCalled();
      });

      it('accepts an nmtoken that starts with a u00B7 (a namechar that is not a namestartchar)', () => {
         const name = '\u00B7ne';

         misc.checkNMToken(makeSToken(name), ec, emdV1R5, errorId);

         expect(ec.report).not.toHaveBeenCalled();
      });

      it('accepts an nmtoken that starts with a u0320 (a namechar that is not a namestartchar)', () => {
         const name = '\u0320ne';

         misc.checkNMToken(makeSToken(name), ec, emdV1R5, errorId);

         expect(ec.report).not.toHaveBeenCalled();
      });

      it('accepts an nmtoken that starts with a u2040 (a namechar that is not a namestartchar)', () => {
         const name = '\u2040';

         misc.checkNMToken(makeSToken(name), ec, emdV1R5, errorId);

         expect(ec.report).not.toHaveBeenCalled();
      });

      it('rejects an nmtoken that has u03F4 in version 1.0/4', () => {
         const name = '\u03F4';

         misc.checkNMToken(makeSToken(name), ec, emdV1R4, errorId);

         expect(ec.report).toHaveBeenCalledWith(
            WellFormedError.ID.ELEMENT_NAME_INVALID, [ name ], makeSToken(name));
      });

      it('accepts an nmtoken that has u03F4 in version 1.0/5', () => {
         const name = '\u03F4';

         misc.checkNMToken(makeSToken(name), ec, emdV1R5, errorId);

         expect(ec.report).not.toHaveBeenCalled();
      });

      it('accepts an nmtoken that has u03F4 in version 1.1', () => {
         const name = '\u03F4';

         misc.checkNMToken(makeSToken(name), ec, emdV11R2, errorId);

         expect(ec.report).not.toHaveBeenCalled();
      });

      it('rejects an nmtoken in 1.0/4 that has characters that are bad in 1.0/4', () => {
         const name = 'f\u0eceb';

         misc.checkNMToken(makeSToken(name), ec, emdV1R4, errorId);

         expect(ec.report).toHaveBeenCalledWith(
            WellFormedError.ID.ELEMENT_NAME_INVALID, [ name ], makeSToken(name));
      });

      it('accepts an nmtoken in 1.0/5 that has characters that are bad in 1.0/4 but ok in version 1.0/5', () => {
         const name = 'f\u0eceb';

         misc.checkNMToken(makeSToken(name), ec, emdV1R5, errorId);

         expect(ec.report).not.toHaveBeenCalled();
      });

      it('accepts an nmtoken in 1.1 that has characters that are bad in 1.0 but ok in version 1.1', () => {
         const name = 'f\u0eceb';

         misc.checkNMToken(makeSToken(name), ec, emdV11R2, errorId);

         expect(ec.report).not.toHaveBeenCalled();
      });

   });

   describe('checkWellFormedText()', () => {
      let mockErrorCollector: MockErrorCollector;

      beforeEach(() => {
         mockErrorCollector = new MockErrorCollector();
      });

      it('adds no errors if an SToken is not passed in', () => {
         misc.checkWellFormedText(undefined as any, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector.errors).toEqual([]);
      });

      it('reports no errors if the SToken has no bad errors', () => {
         misc.checkWellFormedText(makeSToken('foo'), mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector.errors).toEqual([]);
      });

      it('reports an error if the SToken has bad characters', () => {
         const sToken = makeSToken('b\u0001x\u0000x\uFDD1x\uFDD2xx');

         misc.checkWellFormedText(sToken, mockErrorCollector,
            new EntityMetaData());

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.CHARDATA_INVALID_CHAR,
            params: [ '1, 3' ],
            position: undefined,
         });
      });

      it('reports an error if the 1.1 SToken has bad characters that are only bad in version 1.1', () => {
         const sToken = makeSToken('bad\u007F');

         misc.checkWellFormedText(sToken, mockErrorCollector,
            new EntityMetaData(EntityKind.DOCUMENT, 1.1, 2));

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.CHARDATA_INVALID_CHAR,
            params: [ '3' ],
            position: undefined,
         });
      });

      it('reports no error if the 1.0 SToken has bad characters that are only bad in version 1.1', () => {
         const sToken = makeSToken('bad\u007F');

         misc.checkWellFormedText(sToken, mockErrorCollector,
            new EntityMetaData(EntityKind.DOCUMENT, 1.0, 5));

         expect(mockErrorCollector.errors.length).toEqual(1);
         expect(mockErrorCollector.errors[0].id).not.toEqual(WellFormedError.ID.CHARDATA_INVALID_CHAR);
      });

      it('reports a warning if the SToken has discouraged characters', () => {
         const sToken = makeSToken('b\u0001x\u0000x\uFDD1x\uFDD2xx');

         misc.checkWellFormedText(sToken, mockErrorCollector,
            new EntityMetaData());

         expect(mockErrorCollector).toReportWarning({
            id: XmlWarning.ID.CHARDATA_DISCOURAGED_CHAR,
            params: [ '5, 7' ],
            position: undefined,
         });
      });

      it('reports a warning if the 1.0/1 SToken has chars that are only discouraged in version 1.0/>2', () => {
         const sToken = makeSToken('bad\u007F');

         misc.checkWellFormedText(sToken, mockErrorCollector,
            new EntityMetaData(EntityKind.DOCUMENT, 1.0, 1));

         expect(mockErrorCollector.errors.length).toEqual(0);
      });

      it('reports a warning if the 1.0/2 SToken has chars that are only discouraged in version 1.0/>2', () => {
         const sToken = makeSToken('bad\u007F');

         misc.checkWellFormedText(sToken, mockErrorCollector,
            new EntityMetaData(EntityKind.DOCUMENT, 1.0, 2));

         expect(mockErrorCollector.errors.length).toEqual(0);
      });

      it('reports no warning if the 1.0/3 SToken has chars that are only discouraged in version 1.0/5', () => {
         const sToken = makeSToken('bad\uFDEF');

         misc.checkWellFormedText(sToken, mockErrorCollector,
            new EntityMetaData(EntityKind.DOCUMENT, 1.0, 3));

         expect(mockErrorCollector.errors.length).toEqual(0);
      });

      it('reports a warning if the 1.0/5 SToken has chars that are only discouraged in version 1.0/5', () => {
         const sToken = makeSToken('bad\uFDEF');

         misc.checkWellFormedText(sToken, mockErrorCollector,
            new EntityMetaData(EntityKind.DOCUMENT, 1.0, 5));

         expect(mockErrorCollector).toReportWarning({
            id: XmlWarning.ID.CHARDATA_DISCOURAGED_CHAR,
            params: [ '3' ],
            position: undefined,
         });
      });

      it('reports a warning if the 1.0 SToken has chars that are only discouraged in version 1.0', () => {
         const sToken = makeSToken('bad\u007F');

         misc.checkWellFormedText(sToken, mockErrorCollector,
            new EntityMetaData(EntityKind.DOCUMENT, 1.0, 5));

         expect(mockErrorCollector).toReportWarning({
            id: XmlWarning.ID.CHARDATA_DISCOURAGED_CHAR,
            params: [ '3' ],
            position: undefined,
         });
      });

      it('reports a warning if the 1.1 SToken has chars that are only discouraged in version 1.0', () => {
         const sToken = makeSToken('bad\u007F');

         misc.checkWellFormedText(sToken, mockErrorCollector,
            new EntityMetaData(EntityKind.DOCUMENT, 1.1, 2));

         expect(mockErrorCollector.errors.length).toEqual(1);
         expect(mockErrorCollector.errors[0].id).toEqual(WellFormedError.ID.CHARDATA_INVALID_CHAR);
      });

   });

});
