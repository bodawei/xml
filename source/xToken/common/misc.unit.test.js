/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData } from '../../basic';
import { WellFormedError, XmlWarning } from '../../error';
import { MockErrorCollector } from '../../basic/test';
import { makeLToken } from '../../lToken/test';

import * as misc from './misc.js';

describe('misc', () => {

   describe('checkWellFormedNameRecommendation()', () => {
      let WARN1;
      let WARN2;
      let entityMetaData;
      let errorCollectorSpy;

      beforeEach(() => {
         errorCollectorSpy = {
            reportError: jasmine.createSpy('callbackSpy'),
         };
         entityMetaData = new EntityMetaData();
         WARN1 = 'WARN1';
         WARN2 = 'WARN2';
      });

      it('adds no errors if a name is not passed in', () => {
         misc.checkWellFormedNameRecommendation(undefined, errorCollectorSpy, entityMetaData, WARN1, WARN2);
         expect(errorCollectorSpy.reportError).not.toHaveBeenCalled();
      });

      it('reports no errors if the name does not start with "xml"', () => {
         misc.checkWellFormedNameRecommendation(makeLToken('foo'), errorCollectorSpy,
            new EntityMetaData(EntityMetaData.KIND.DOCUMENT, 1, 5), WARN1, WARN2);
         expect(errorCollectorSpy.reportError).not.toHaveBeenCalled();
      });

      it('reports no error if the version is 1.0/6, and it starts with "xml"', () => {
         misc.checkWellFormedNameRecommendation(makeLToken('xmlFoo'), errorCollectorSpy,
            new EntityMetaData(EntityMetaData.KIND.DOCUMENT, 1, 6), WARN1, WARN2);
         expect(errorCollectorSpy.reportError).not.toHaveBeenCalled();
      });

      it('report an error if the version is 1.0/6, and it starts with "xml-"', () => {
         misc.checkWellFormedNameRecommendation(makeLToken('xml-Foo'), errorCollectorSpy,
            new EntityMetaData(EntityMetaData.KIND.DOCUMENT, 1, 6), WARN1, WARN2);
         expect(errorCollectorSpy.reportError).toHaveBeenCalledWith(WARN1, XmlWarning, [ 'xml-Foo' ]);
      });

      it('report an error if the version is 1.0/5, and it starts with "xml"', () => {
         misc.checkWellFormedNameRecommendation(makeLToken('xmlFoo'), errorCollectorSpy,
         new EntityMetaData(EntityMetaData.KIND.DOCUMENT, 1, 5), WARN1, WARN2);
         expect(errorCollectorSpy.reportError).toHaveBeenCalledWith(WARN2, XmlWarning, [ 'xmlFoo' ]);
      });

      it('report an error if the version is 1.1/5, and it starts with "xml-"', () => {
         misc.checkWellFormedNameRecommendation(makeLToken('xml-Foo'), errorCollectorSpy,
            new EntityMetaData(EntityMetaData.KIND.DOCUMENT, 1, 5), WARN1, WARN2);
         expect(errorCollectorSpy.reportError).toHaveBeenCalledWith(WARN2, XmlWarning, [ 'xml-Foo' ]);
      });

   });

   describe('checkWellFormedText()', () => {
      let mockErrorCollector;

      beforeEach(() => {
         mockErrorCollector = new MockErrorCollector();
      });

      it('adds no errors if an LToken is not passed in', () => {
         misc.checkWellFormedText(undefined, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector.errors).toEqual([]);
      });

      it('reports no errors if the lToken has no bad errors', () => {
         misc.checkWellFormedText(makeLToken('foo'), mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector.errors).toEqual([]);
      });

      it('reports an error if the LToken has bad characters', () => {
         const lToken = makeLToken('b\u0001x\u0000x\uFDD1x\uFDD2xx');

         misc.checkWellFormedText(lToken, mockErrorCollector,
            new EntityMetaData());

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.CHARDATA_INVALID_CHAR,
            params: [ '1, 3' ],
            position: undefined,
         });
      });

      it('reports an error if the 1.1 LToken has bad characters that are only bad in version 1.1', () => {
         const lToken = makeLToken('bad\u007F');

         misc.checkWellFormedText(lToken, mockErrorCollector,
            new EntityMetaData(EntityMetaData.KIND.DOCUMENT, 1.1, 2));

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.CHARDATA_INVALID_CHAR,
            params: [ '3' ],
            position: undefined,
         });
      });

      it('reports no error if the 1.0 LToken has bad characters that are only bad in version 1.1', () => {
         const lToken = makeLToken('bad\u007F');

         misc.checkWellFormedText(lToken, mockErrorCollector,
            new EntityMetaData(EntityMetaData.KIND.DOCUMENT, 1.0, 5));

         expect(mockErrorCollector.errors.length).toEqual(1);
         expect(mockErrorCollector.errors[0].id).not.toEqual(WellFormedError.ID.CHARDATA_INVALID_CHAR);
      });

      it('reports a warning if the LToken has discouraged characters', () => {
         const lToken = makeLToken('b\u0001x\u0000x\uFDD1x\uFDD2xx');

         misc.checkWellFormedText(lToken, mockErrorCollector,
            new EntityMetaData());

         expect(mockErrorCollector).toReportWarning({
            id: XmlWarning.ID.CHARDATA_DISCOURAGED_CHAR,
            params: [ '5, 7' ],
            position: undefined,
         });
      });

      it('reports a warning if the 1.0/1 LToken has chars that are only discouraged in version 1.0/>2', () => {
         const lToken = makeLToken('bad\u007F');

         misc.checkWellFormedText(lToken, mockErrorCollector,
            new EntityMetaData(EntityMetaData.KIND.DOCUMENT, 1.0, 1));

         expect(mockErrorCollector.errors.length).toEqual(0);
      });

      it('reports a warning if the 1.0/2 LToken has chars that are only discouraged in version 1.0/>2', () => {
         const lToken = makeLToken('bad\u007F');

         misc.checkWellFormedText(lToken, mockErrorCollector,
            new EntityMetaData(EntityMetaData.KIND.DOCUMENT, 1.0, 2));

         expect(mockErrorCollector.errors.length).toEqual(0);
      });

      it('reports no warning if the 1.0/3 LToken has chars that are only discouraged in version 1.0/5', () => {
         const lToken = makeLToken('bad\uFDEF');

         misc.checkWellFormedText(lToken, mockErrorCollector,
            new EntityMetaData(EntityMetaData.KIND.DOCUMENT, 1.0, 3));

         expect(mockErrorCollector.errors.length).toEqual(0);
      });

      it('reports a warning if the 1.0/5 LToken has chars that are only discouraged in version 1.0/5', () => {
         const lToken = makeLToken('bad\uFDEF');

         misc.checkWellFormedText(lToken, mockErrorCollector,
            new EntityMetaData(EntityMetaData.KIND.DOCUMENT, 1.0, 5));

         expect(mockErrorCollector).toReportWarning({
            id: XmlWarning.ID.CHARDATA_DISCOURAGED_CHAR,
            params: [ '3' ],
            position: undefined,
         });
      });

      it('reports a warning if the 1.0 LToken has chars that are only discouraged in version 1.0', () => {
         const lToken = makeLToken('bad\u007F');

         misc.checkWellFormedText(lToken, mockErrorCollector,
            new EntityMetaData(EntityMetaData.KIND.DOCUMENT, 1.0, 5));

         expect(mockErrorCollector).toReportWarning({
            id: XmlWarning.ID.CHARDATA_DISCOURAGED_CHAR,
            params: [ '3' ],
            position: undefined,
         });
      });

      it('reports a warning if the 1.1 LToken has chars that are only discouraged in version 1.0', () => {
         const lToken = makeLToken('bad\u007F');

         misc.checkWellFormedText(lToken, mockErrorCollector,
            new EntityMetaData(EntityMetaData.KIND.DOCUMENT, 1.1, 2));

         expect(mockErrorCollector.errors.length).toEqual(1);
         expect(mockErrorCollector.errors[0].id).toEqual(WellFormedError.ID.CHARDATA_INVALID_CHAR);
      });

   });

});
