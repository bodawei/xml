/* Copyright ® 2017-2018 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { ErrorCollector, ConformanceVersion, XmlWarning } from 'basic';
import { MockErrorCollector } from 'basic-test';
import { WellFormedError } from '../../../wellformedness/error/WellFormedError';
import { SToken } from 'sToken';
import { makeSToken } from 'sToken-test';
import * as basic from 'basic';
import * as char from '../../../basic/chars';

import misc from '../misc';

describe('misc', () => {

   describe('checkWellFormedNameRecommendation()', () => {
      let WARN1: string;
      let WARN2: string;
      let confVer: ConformanceVersion;
      let ec: ErrorCollector;

      beforeEach(() => {
         ec = new ErrorCollector(SToken.fromString('x'), WellFormedError);
         ec.reportError = jasmine.createSpy('callbackSpy');
         confVer = new ConformanceVersion();
         WARN1 = 'WARN1';
         WARN2 = 'WARN2';
      });

      it('adds no errors if a name is not passed in', () => {
         misc.checkWellFormedNameRecommendation(undefined as any, ec, confVer, 'ELEMENT', WARN1, WARN2);

         expect(ec.reportError).not.toHaveBeenCalled();
      });

      it('reports no errors if the name does not start with "xml" (§3.0.0)', () => {
         misc.checkWellFormedNameRecommendation(makeSToken('foo'), ec,
            new ConformanceVersion(1, 5), 'ELEMENT', WARN1, WARN2);

         expect(ec.reportError).not.toHaveBeenCalled();
      });

      it('reports a warning if the name starts with "xml" (§3.0.0)', () => {
         misc.checkWellFormedNameRecommendation(makeSToken('xmlblah'), ec,
            new ConformanceVersion(1, 5), 'ELEMENT', WARN1, WARN2);

            expect(ec.reportError).toHaveBeenCalledWith(WARN2, XmlWarning, [ 'xmlblah' ]);
         });

      it('reports no errors if this is an xml:lang attriute', () => {
         misc.checkWellFormedNameRecommendation(makeSToken('xml:lang'), ec,
            new ConformanceVersion(1, 5), 'ATTRIBUTE', WARN1, WARN2);

         expect(ec.reportError).not.toHaveBeenCalled();
      });

      it('reports no errors if this is an xml:space attriute', () => {
         misc.checkWellFormedNameRecommendation(makeSToken('xml:space'), ec,
            new ConformanceVersion(1, 5), 'ATTRIBUTE', WARN1, WARN2);

         expect(ec.reportError).not.toHaveBeenCalled();
      });

      it('reports a warning if XML:LANG is provided', () => {
         misc.checkWellFormedNameRecommendation(makeSToken('XML:LANG'), ec,
            new ConformanceVersion(1, 5), 'ATTRIBUTE', WARN1, WARN2);

         expect(ec.reportError).toHaveBeenCalledWith(WARN2, XmlWarning, [ 'XML:LANG' ]);
      });

      it('reports no warning if the version is 1.0/6, and the element name starts with "xml" (§3.0.0)', () => {
         misc.checkWellFormedNameRecommendation(makeSToken('xmlFoo'), ec,
            new ConformanceVersion(1, 6), 'ELEMENT', WARN1, WARN2);
         expect(ec.reportError).not.toHaveBeenCalled();
      });

      it('reports a warning if the version is 1.0/6, and the PI name starts with "xml-"', () => {
         misc.checkWellFormedNameRecommendation(makeSToken('xml-Foo'), ec,
            new ConformanceVersion(1, 6), 'PI', WARN1, WARN2);
         expect(ec.reportError).toHaveBeenCalledWith(WARN1, XmlWarning, [ 'xml-Foo' ]);
      });

      it('reports a warning if the version is 1.0/6, and the element or attr name starts with "xml:"', () => {
         misc.checkWellFormedNameRecommendation(makeSToken('xml:Foo'), ec,
            new ConformanceVersion(1, 6), 'ATTRIBUTE', WARN1, WARN2);

         expect(ec.reportError).toHaveBeenCalledWith(WARN1, XmlWarning, [ 'xml:Foo' ]);
      });

      it('reports no warning if the version is 1.0/6, and the element name starts with "xml" (§3.0.0)', () => {
         misc.checkWellFormedNameRecommendation(makeSToken('xmlFoo'), ec,
            new ConformanceVersion(1, 6), 'ELEMENT', WARN1, WARN2);

         expect(ec.reportError).not.toHaveBeenCalled();
      });

      it('reports no warning if the version is 1.0/6, and the entity name starts with "xml"', () => {
         misc.checkWellFormedNameRecommendation(makeSToken('xmlFoo'), ec,
            new ConformanceVersion(1, 6), 'ENTITY', WARN1, WARN2);

         expect(ec.reportError).not.toHaveBeenCalled();
      });

      it('reports no warning if the version is 1.0/6, and the PI name starts with "xml"', () => {
         misc.checkWellFormedNameRecommendation(makeSToken('xmlFoo'), ec,
            new ConformanceVersion(1, 6), 'PI', WARN1, WARN2);

         expect(ec.reportError).not.toHaveBeenCalled();
      });

      it('reports a warning if the version is 1.0/5, and the name starts with "xml"', () => {
         misc.checkWellFormedNameRecommendation(makeSToken('xmlFoo'), ec,
         new ConformanceVersion(1, 5), 'ENTITY', WARN1, WARN2);

         expect(ec.reportError).toHaveBeenCalledWith(WARN2, XmlWarning, [ 'xmlFoo' ]);
      });

      it('reports a warning if the version is 1.0/5, and the PI name starts with "xml-"', () => {
         misc.checkWellFormedNameRecommendation(makeSToken('xml-Foo'), ec,
            new ConformanceVersion(1, 5), 'PI', WARN1, WARN2);

         expect(ec.reportError).toHaveBeenCalledWith(WARN2, XmlWarning, [ 'xml-Foo' ]);
      });

      it('reports a warning if the version is 1.0/5, and the element name starts with "xml:" (§3.0.0)', () => {
         misc.checkWellFormedNameRecommendation(makeSToken('xml:Foo'), ec,
            new ConformanceVersion(1, 5), 'ELEMENT', WARN1, WARN2);

         expect(ec.reportError).toHaveBeenCalledWith(WARN2, XmlWarning, [ 'xml:Foo' ]);
      });

   });

   describe('checkName', () => {
      let ec: ErrorCollector;
      let errorId: string;
      let confVerV1R5: ConformanceVersion;
      let utilIsName: jasmine.Spy;

      beforeEach(() => {
         ec = new ErrorCollector(SToken.fromString('x'), WellFormedError);
         errorId = WellFormedError.ID.ELEMENT_NAME_INVALID;
         confVerV1R5 = new ConformanceVersion(1.0, 5);
         spyOn(ec, 'report');
         utilIsName = spyOn(char, 'isName');
      });

      it('accepts an empty Stoken', () => {
         misc.checkName(undefined as any, ec, confVerV1R5, errorId);

         expect(ec.report).not.toHaveBeenCalled();
      });

      it('calls isName()', () => {
         misc.checkName(SToken.fromString('foo'), ec, confVerV1R5, errorId);

         expect(char.isName).toHaveBeenCalledWith('foo', 1.0, 5);
      });

      it('reports an error if isName() returns false', () => {
         utilIsName.and.returnValue(false);

         misc.checkName(SToken.fromString('foo'), ec, confVerV1R5, errorId);

         expect(ec.report).toHaveBeenCalledWith(
            errorId, [ 'foo' ], SToken.fromString('foo'));
      });

   });

   describe('checkNMToken', () => {
      let ec: ErrorCollector;
      let errorId: string;
      let confVerV1R5: ConformanceVersion;
      let confVerV1R4: ConformanceVersion;
      let confVerV11R2: ConformanceVersion;
      let utilIsNMToken: jasmine.Spy;

      beforeEach(() => {
         ec = new ErrorCollector(SToken.fromString('x'), WellFormedError);
         errorId = WellFormedError.ID.ELEMENT_NAME_INVALID;
         confVerV1R4 = new ConformanceVersion(1.0, 4);
         confVerV1R5 = new ConformanceVersion(1.0, 5);
         confVerV11R2 = new ConformanceVersion(1.1, 2);
         spyOn(ec, 'report');
         utilIsNMToken = spyOn(char, 'isNmToken');
      });

      it('accepts an empty Stoken', () => {
         misc.checkNMToken(undefined as any, ec, confVerV1R5, errorId);

         expect(ec.report).not.toHaveBeenCalled();
      });

      it('calls isNmToken()', () => {
         misc.checkNMToken(SToken.fromString('foo'), ec, confVerV1R5, errorId);

         expect(char.isNmToken).toHaveBeenCalledWith('foo', 1.0, 5);
      });

      it('reports an error if utilIsNMToken() returns false', () => {
         utilIsNMToken.and.returnValue(false);

         misc.checkNMToken(SToken.fromString('foo'), ec, confVerV1R5, errorId);

         expect(ec.report).toHaveBeenCalledWith(
            errorId, [ 'foo' ], SToken.fromString('foo'));
      });

   });

   describe('checkCharWellFormed()', () => {
      let mockErrorCollector: MockErrorCollector;

      beforeEach(() => {
         mockErrorCollector = new MockErrorCollector();
      });

      it('adds no errors if an SToken is not passed in', () => {
         misc.checkCharWellFormed(undefined as any, mockErrorCollector, new ConformanceVersion());

         expect(mockErrorCollector.errors).toEqual([]);
      });

      it('reports no errors if the SToken has no bad errors', () => {
         misc.checkCharWellFormed(makeSToken('foo'), mockErrorCollector, new ConformanceVersion());

         expect(mockErrorCollector.errors).toEqual([]);
      });

      it('reports an error if the SToken has bad characters', () => {
         const sToken = makeSToken('b\u0001x\u0000x\uFDD1x\uFDD2xx');

         misc.checkCharWellFormed(sToken, mockErrorCollector,
            new ConformanceVersion());

         expect(mockErrorCollector).toReportWFError({
            id: WellFormedError.ID.CHARDATA_INVALID_CHAR,
            params: [ '1, 3' ],
            position: undefined,
         });
      });

      it('reports an error if the 1.1 SToken has bad characters that are only bad in version 1.1', () => {
         const sToken = makeSToken('bad\u007F');

         misc.checkCharWellFormed(sToken, mockErrorCollector,
            new ConformanceVersion(1.1, 2));

         expect(mockErrorCollector).toReportWFError({
            id: WellFormedError.ID.CHARDATA_INVALID_CHAR,
            params: [ '3' ],
            position: undefined,
         });
      });

      it('reports no error if the 1.0 SToken has bad characters that are only bad in version 1.1', () => {
         const sToken = makeSToken('bad\u007F');

         misc.checkCharWellFormed(sToken, mockErrorCollector,
            new ConformanceVersion(1.0, 5));

         expect(mockErrorCollector.errors.length).toEqual(1);
         expect(mockErrorCollector.errors[0].id).not.toEqual(WellFormedError.ID.CHARDATA_INVALID_CHAR);
      });

      it('reports a warning if the SToken has discouraged characters', () => {
         const sToken = makeSToken('b\u0001x\u0000x\uFDD1x\uFDD2xx');

         misc.checkCharWellFormed(sToken, mockErrorCollector,
            new ConformanceVersion());

         expect(mockErrorCollector).toReportWarning({
            id: XmlWarning.ID.CHARDATA_DISCOURAGED_CHAR,
            params: [ '5, 7' ],
            position: undefined,
         });
      });

      it('reports a warning if the 1.0/1 SToken has chars that are only discouraged in version 1.0/>2', () => {
         const sToken = makeSToken('bad\u007F');

         misc.checkCharWellFormed(sToken, mockErrorCollector,
            new ConformanceVersion(1.0, 1));

         expect(mockErrorCollector.errors.length).toEqual(0);
      });

      it('reports a warning if the 1.0/2 SToken has chars that are only discouraged in version 1.0/>2', () => {
         const sToken = makeSToken('bad\u007F');

         misc.checkCharWellFormed(sToken, mockErrorCollector,
            new ConformanceVersion(1.0, 2));

         expect(mockErrorCollector.errors.length).toEqual(0);
      });

      it('reports no warning if the 1.0/3 SToken has chars that are only discouraged in version 1.0/5', () => {
         const sToken = makeSToken('bad\uFDEF');

         misc.checkCharWellFormed(sToken, mockErrorCollector,
            new ConformanceVersion(1.0, 3));

         expect(mockErrorCollector.errors.length).toEqual(0);
      });

      it('reports a warning if the 1.0/5 SToken has chars that are only discouraged in version 1.0/5', () => {
         const sToken = makeSToken('bad\uFDEF');

         misc.checkCharWellFormed(sToken, mockErrorCollector,
            new ConformanceVersion(1.0, 5));

         expect(mockErrorCollector).toReportWarning({
            id: XmlWarning.ID.CHARDATA_DISCOURAGED_CHAR,
            params: [ '3' ],
            position: undefined,
         });
      });

      it('reports a warning if the 1.0 SToken has chars that are only discouraged in version 1.0', () => {
         const sToken = makeSToken('bad\u007F');

         misc.checkCharWellFormed(sToken, mockErrorCollector,
            new ConformanceVersion(1.0, 5));

         expect(mockErrorCollector).toReportWarning({
            id: XmlWarning.ID.CHARDATA_DISCOURAGED_CHAR,
            params: [ '3' ],
            position: undefined,
         });
      });

      it('reports a warning if the 1.1 SToken has chars that are only discouraged in version 1.0', () => {
         const sToken = makeSToken('bad\u007F');

         misc.checkCharWellFormed(sToken, mockErrorCollector,
            new ConformanceVersion(1.1, 2));

         expect(mockErrorCollector.errors.length).toEqual(1);
         expect(mockErrorCollector.errors[0].id).toEqual(WellFormedError.ID.CHARDATA_INVALID_CHAR);
      });

      it('reports an error if there is a lone surrogate character in the input string', () => {
         const sToken = makeSToken('bad\uD801x');

         misc.checkCharWellFormed(sToken, mockErrorCollector,
            new ConformanceVersion(1.1, 2));

         expect(mockErrorCollector.errors.length).toEqual(1);
         expect(mockErrorCollector.errors[0].id).toEqual(WellFormedError.ID.CHARDATA_INVALID_CHAR);
      });

   });

});
