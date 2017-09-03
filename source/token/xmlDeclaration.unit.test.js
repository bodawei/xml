/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData } from '../basic';
import { MockErrorCollector } from '../basic/test';
import { WellFormedError } from '../error';
import { makeLTokenMaker, MockLTokenSource } from '../lToken/test';

import * as misc from './misc.js';
import * as pi from './processingInstruction.js';
import * as xmlDeclaration from './xmlDeclaration.js';

describe('xmlDeclaration', () => {

   describe('parse()', () => {
      let mockSource;
      let callback;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
      });

      it('gathers no value if thee is no quote after the equal sign', () => {
         mockSource = new MockLTokenSource([
            'version',
            ' ',
            '=',
            ' ',
            undefined,
            undefined,
            '?>',
         ]);

         xmlDeclaration.parse(mockSource, {}, callback);
         mockSource.respondInAsyncTime();

         const expectedLToken = makeLTokenMaker();
         expect(callback).toContainParsedProps({
            type: 'XMLDECL',
            open: undefined,
            postOpenSpace: undefined,
            target: undefined,
            postTargetSpace: undefined,
            params: [ {
               name: expectedLToken('version'),
               postNameSpace: expectedLToken(' '),
               equal: expectedLToken('='),
               postEqualSpace: expectedLToken(' '),
            } ],
            close: expectedLToken('?>'),
         });
      });

      it('gathers a value if the value is in single quotes', () => {
         mockSource = new MockLTokenSource([
            'version',
            ' ',
            '=',
            undefined,
            MockLTokenSource.PEEK('\''),
            '\'',
            '1.3',
            '\'',
            undefined,
            undefined,
            '?>',
         ]);

         xmlDeclaration.parse(mockSource, {}, callback);
         mockSource.respondInAsyncTime();

         const expectedLToken = makeLTokenMaker();
         expect(callback).toContainParsedProps({
            params: [ {
               name: expectedLToken('version'),
               postNameSpace: expectedLToken(' '),
               equal: expectedLToken('='),
               postEqualSpace: undefined,
               openQuote: expectedLToken('\''),
               value: expectedLToken('1.3'),
               closeQuote: expectedLToken('\''),
               trailingSpace: undefined,
            } ],
            close: expectedLToken('?>'),
         });
      });

   });

   describe('checkWellFormed()', () => {
      let mockErrorCollector;
      let parsed;

      beforeEach(() => {
         const makeToken = makeLTokenMaker();
         mockErrorCollector = new MockErrorCollector();

         parsed = {
            open: makeToken('<?'),
            postOpenSpace: undefined,
            target: makeToken('xml'),
            postTargetSpace: makeToken(' '),
            params: [ {
               name: makeToken('version'),
               equal: makeToken('='),
               openQuote: makeToken('"'),
               value: makeToken('1.1'),
               closeQuote: makeToken('"'),
               trailingSpace: makeToken(' '),
            }, {
               name: makeToken('encoding'),
               equal: makeToken('='),
               openQuote: makeToken('"'),
               value: makeToken('ascii'),
               closeQuote: makeToken('"'),
               trailingSpace: makeToken(' '),
            }, {
               name: makeToken('standalone'),
               equal: makeToken('='),
               openQuote: makeToken('"'),
               value: makeToken('yes'),
               closeQuote: makeToken('"'),
               trailingSpace: makeToken(' '),
            } ],
            close: makeToken('?>'),
         };
         spyOn(pi, 'checkWellFormed');
      });

      it('calls the validation from processing instruction', () => {
         const emd = new EntityMetaData();
         xmlDeclaration.checkWellFormed(parsed, mockErrorCollector, emd);

         expect(pi.checkWellFormed).toHaveBeenCalledWith(parsed, mockErrorCollector, emd);
      });

      it('reports no errors with ordinary parameters', () => {
         xmlDeclaration.checkWellFormed(parsed, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector.report).not.toHaveBeenCalled();
      });

      it('reports an error if there is no space between the target and the param name', () => {
         delete parsed.postTargetSpace;

         xmlDeclaration.checkWellFormed(parsed, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.ATTRIBUTE_NO_SPACE_BEFORE_NAME,
            params: [ 'version' ],
            position: parsed.params[0].name,
         });
      });

      it('reports an error if there is no space between the first and second parameters', () => {
         delete parsed.params[0].trailingSpace;

         xmlDeclaration.checkWellFormed(parsed, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.ATTRIBUTE_NO_SPACE_BEFORE_NAME,
            params: [ 'encoding' ],
            position: parsed.params[1].name,
         });
      });

      it('reports an error if a param is the wrong case', () => {
         const makeToken = makeLTokenMaker();
         parsed.params[0].name = makeToken('VERSION');

         xmlDeclaration.checkWellFormed(parsed, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.XMLDECL_ATTR_INVALID_CASE,
            params: [ 'version', 'VERSION' ],
            position: parsed.params[0].name,
         });
      });

      it('reports an error if a version is in the wrong order', () => {
         const temp = parsed.params[0];
         parsed.params.splice(0, 1);
         parsed.params.push(temp); // put version at the end

         xmlDeclaration.checkWellFormed(parsed, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.XMLDECL_VERSION_INVALID_ORDER,
            params: [ 2 ],
            position: parsed.params[2].name,
         });
      });

      it('reports an error if a encoding is in the wrong order', () => {
         const temp = parsed.params[1];
         parsed.params.splice(1, 1);
         parsed.params.push(temp); // put encoding at the end.

         xmlDeclaration.checkWellFormed(parsed, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.XMLDECL_ENCODING_INVALID_ORDER,
            params: undefined,
            position: parsed.params[2].name,
         });
      });

      it('reports an error if encoding has no value', () => {
         parsed.params[1].value = undefined;

         xmlDeclaration.checkWellFormed(parsed, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.ATTRIBUTE_NO_VALUE,
            params: [ 'encoding' ],
            position: undefined,
            lastPosition: parsed.params[1].openQuote,
         });
      });

      it('reports an error if a standalone is in the wrong order', () => {
         const temp = parsed.params[2];
         parsed.params.splice(2, 1);
         parsed.params.unshift(temp); // put standalone at the first position

         xmlDeclaration.checkWellFormed(parsed, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.XMLDECL_STANDALONE_INVALID_ORDER,
            params: undefined,
            position: parsed.params[0].name,
         });
      });

      it('reports an error if standalone specified on a non-doc entity', () => {
         xmlDeclaration.checkWellFormed(parsed, mockErrorCollector,
            new EntityMetaData(EntityMetaData.KIND.EXTERNALSUBSET));

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.TEXTDECL_XTRA_STANDALONE,
            params: undefined,
            position: parsed.params[2].name,
         });
      });

      it('reports an error if an unknown parameter is provided', () => {
         const makeToken = makeLTokenMaker();
         parsed.params[2].name = makeToken('bogus');

         xmlDeclaration.checkWellFormed(parsed, mockErrorCollector,
            new EntityMetaData(EntityMetaData.KIND.EXTERNALSUBSET));

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.XMLDECL_ATTR_UNKNOWN,
            params: [ 'bogus' ],
            position: parsed.params[2].name,
         });
      });

      it('reports an error if the name is invalid', () => {
         const makeToken = makeLTokenMaker();
         parsed.params[2].name = makeToken('$badName');
         xmlDeclaration.checkWellFormed(parsed, mockErrorCollector,
            new EntityMetaData(EntityMetaData.KIND.DOCUMENT, 1.0, 2));

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.ATTRIBUTE_INVALID_NAME,
            params: [ '$badName' ],
            position: parsed.params[2].name,
         });
      });

      it('reports an error if there is no "=" found', () => {
         delete parsed.params[0].equal;

         xmlDeclaration.checkWellFormed(parsed, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.ATTRIBUTE_NO_EQUAL,
            params: [ 'version' ],
            lastPosition: parsed.params[0].name,
         });
      });

      it('reports an error if there is no opening quote found', () => {
         delete parsed.params[0].openQuote;

         xmlDeclaration.checkWellFormed(parsed, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.ATTRIBUTE_NO_QUOTE,
            params: [ 'version' ],
            lastPosition: parsed.params[0].equal,
         });
      });

      it('reports an error if there is no value found', () => {
         delete parsed.params[0].value;

         xmlDeclaration.checkWellFormed(parsed, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.ATTRIBUTE_NO_VALUE,
            params: [ 'version' ],
            lastPosition: parsed.params[0].openQuote,
         });
      });

      it('calls misc.checkWellFormedText() with the value of each token', () => {
         spyOn(misc, 'checkWellFormedText');
         const emd = new EntityMetaData();

         xmlDeclaration.checkWellFormed(parsed, mockErrorCollector, emd);

         expect(misc.checkWellFormedText).toHaveBeenCalledWith(parsed.params[1].value, mockErrorCollector, emd);
      });

      it('reports an error if the version is not a legal value', () => {
         parsed.params[0].value.text = '1.2';

         xmlDeclaration.checkWellFormed(parsed, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.XMLDECL_VERSION_INVALD,
            params: [ '1.2' ],
            position: parsed.params[0].value,
         });
      });

      it('reports an error if the encoding is not a legal value', () => {
         parsed.params[1].value.text = '$$BAD_ENCODING$$';

         xmlDeclaration.checkWellFormed(parsed, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.XMLDECL_ENCODING_INVALID,
            params: [ '$$BAD_ENCODING$$' ],
            position: parsed.params[1].value,
         });
      });

      it('reports an error if the standalone is neither "yes" or "no"', () => {
         parsed.params[2].value.text = 'Maybe';

         xmlDeclaration.checkWellFormed(parsed, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.XMLDECL_STANDALONE_INVALID,
            params: [ 'Maybe' ],
            position: parsed.params[2].value,
         });
      });

      it('reports an error if the standalone is not all lower case', () => {
         parsed.params[2].value.text = 'Yes';

         xmlDeclaration.checkWellFormed(parsed, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.XMLDECL_STANDALONE_INVALID_CASE,
            params: [ 'yes', 'Yes' ],
            position: parsed.params[2].value,
         });
      });

      it('reports an error if there is no close quote found', () => {
         delete parsed.params[0].closeQuote;

         xmlDeclaration.checkWellFormed(parsed, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.ATTRIBUTE_NO_CLOSE_QUOTE,
            params: [ 'version' ],
            lastPosition: parsed.params[0].value,
         });
      });

      it('reports an error if there are no parameters', () => {
         parsed.params = [];

         xmlDeclaration.checkWellFormed(parsed, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.XMLDECL_NO_ATTRIBUTES,
            params: undefined,
            position: parsed.close,
         });
      });

      it('reports an error if there are no parameters in the base document entity', () => {
         parsed.params = [];

         xmlDeclaration.checkWellFormed(parsed, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.XMLDECL_NO_ATTRIBUTES,
            params: undefined,
            position: parsed.close,
         });
      });

      it('reports an error if there are no parameters in the text declaration', () => {
         const emd = new EntityMetaData(EntityMetaData.KIND.EXTERNALSUBSET);
         parsed.params = [];

         xmlDeclaration.checkWellFormed(parsed, mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.TEXTDECL_NO_ATTRIBUTES,
            params: undefined,
            position: parsed.close,
         });
      });

      it('reports an error if there is no encoding in the text declaration', () => {
         const emd = new EntityMetaData(EntityMetaData.KIND.EXTERNALSUBSET);
         parsed.params.splice(1, 1);

         xmlDeclaration.checkWellFormed(parsed, mockErrorCollector, emd);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.TEXTDECL_NO_ENCODING,
            params: undefined,
            position: parsed.close,
         });
      });

      it('reports an error if there is no close', () => {
         delete parsed.close;

         xmlDeclaration.checkWellFormed(parsed, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.XMLDECL_NO_CLOSE,
            params: undefined,
            lastPosition: parsed.params[2].closeQuote,
         });
      });

   });

   describe('makeToken()', () => {

      it('returns an entity reference token with the entity name', () => {
         const makeToken = makeLTokenMaker();
         const parsed = {
            params: [ {
               name: makeToken('version'),
               postNameSpace: makeToken(' '),
               equal: makeToken('='),
               postEqualSpace: makeToken(' '),
               value: makeToken('1.1'),
            } ],
         };

         const token = xmlDeclaration.makeToken(parsed);

         expect(token).toEqual(new xmlDeclaration.Token([ {
            name: 'version',
            value: '1.1',
         } ], [
            parsed.params[0].name,
            parsed.params[0].postNameSpace,
            parsed.params[0].equal,
            parsed.params[0].postEqualSpace,
            parsed.params[0].value,
         ]));
      });

   });

});
