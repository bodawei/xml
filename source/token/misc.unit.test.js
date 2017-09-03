/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData } from '../basic';
import { XmlWarning } from '../error';
import { makeLToken } from '../lToken/test';

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

});
