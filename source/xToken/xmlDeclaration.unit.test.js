/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityMetaData } from '../basic';
import { MockErrorCollector } from '../basic/test';
import { WellFormedError } from '../error';
import { makeLTokenMaker, MockLTokenSource } from '../lToken/test';

import * as misc from './common/misc.js';
import * as pi from './processingInstruction.js';
import * as quotedValue from './common/quotedValue.js';
import * as xmlDeclaration from './xmlDeclaration.js';

describe('xmlDeclaration (unit)', () => {

   describe('parse()', () => {
      let mockSource;
      let callback;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
         spyOn(quotedValue, 'parse');
         quotedValue.parse.and.callFake((_1, _2, _3, callback) => { callback(true); });
      });

      it('gathers no value if thee is no quote after the equal sign', () => {
         quotedValue.parse.and.callFake((_1, _2, _3, callback) => { callback(false); });
         mockSource = new MockLTokenSource([
            'version',
            ' ',
            '=',
            ' ',
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

      it('gathers multiple parameters', () => {
         mockSource = new MockLTokenSource([
            'version',
            undefined,
            '=',
            undefined,
            undefined,  // trailingSpace
            'encoding',
            undefined,
            '=',
            undefined,
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
               postNameSpace: undefined,
               equal: expectedLToken('='),
               postEqualSpace: undefined,
               trailingSpace: undefined,
            }, {
               name: expectedLToken('encoding'),
               postNameSpace: undefined,
               equal: expectedLToken('='),
               postEqualSpace: undefined,
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
               paramOpenQuote: makeToken('"'),
               paramValue: makeToken('1.1'),
               paramCloseQuote: makeToken('"'),
               trailingSpace: makeToken(' '),
            }, {
               name: makeToken('encoding'),
               equal: makeToken('='),
               paramOpenQuote: makeToken('"'),
               paramValue: makeToken('ascii'),
               paramCloseQuote: makeToken('"'),
               trailingSpace: makeToken(' '),
            }, {
               name: makeToken('standalone'),
               equal: makeToken('='),
               paramOpenQuote: makeToken('"'),
               paramValue: makeToken('yes'),
               paramCloseQuote: makeToken('"'),
               trailingSpace: makeToken(' '),
            } ],
            close: makeToken('?>'),
         };
         spyOn(pi, 'checkWellFormed');
         spyOn(quotedValue, 'checkWellFormed');
         quotedValue.checkWellFormed.and.callFake((_1, _2, _3, _4, _5, cb) => {
            cb();
         });
      });

      it('asks the quotedValue module to look for problems in the declaration part', () => {
         const emd = new EntityMetaData();

         xmlDeclaration.checkWellFormed(parsed, mockErrorCollector, emd);

         const params = quotedValue.checkWellFormed.calls.argsFor(0);
         expect(params[0]).toEqual('param');
         expect(params[1]).toEqual(parsed.params[0]);
         expect(params[2]).toEqual(mockErrorCollector);
         expect(params[3]).toEqual(emd);
         expect(params[4]).toEqual(WellFormedError.ID.NOUN_XMLDECL_PARAM);
         expect(params[5] instanceof Function).toEqual(true);
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

      it('calls misc.checkWellFormedText() with the value of each token', () => {
         spyOn(misc, 'checkWellFormedText');
         const emd = new EntityMetaData();

         xmlDeclaration.checkWellFormed(parsed, mockErrorCollector, emd);

         expect(misc.checkWellFormedText).toHaveBeenCalledWith(parsed.params[1].paramValue, mockErrorCollector, emd);
      });

      it('reports an error if the version is not a legal value', () => {
         parsed.params[0].paramValue.text = '1.2';

         xmlDeclaration.checkWellFormed(parsed, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.XMLDECL_VERSION_INVALD,
            params: [ '1.2' ],
            lastPosition: parsed.params[0].equal,  // not right due to mocking
         });
      });

      it('reports an error if the encoding is not a legal value', () => {
         parsed.params[1].paramValue.text = '$$BAD_ENCODING$$';

         xmlDeclaration.checkWellFormed(parsed, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.XMLDECL_ENCODING_INVALID,
            params: [ '$$BAD_ENCODING$$' ],
            lastPosition: parsed.params[1].equal,  // not right due to mocking
         });
      });

      it('reports an error if the standalone is neither "yes" or "no"', () => {
         parsed.params[2].paramValue.text = 'Maybe';

         xmlDeclaration.checkWellFormed(parsed, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.XMLDECL_STANDALONE_INVALID,
            params: [ 'Maybe' ],
            lastPosition: parsed.params[2].equal,  // not right due to mocking
         });
      });

      it('reports an error if the standalone is not all lower case', () => {
         parsed.params[2].paramValue.text = 'Yes';

         xmlDeclaration.checkWellFormed(parsed, mockErrorCollector, new EntityMetaData());

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.XMLDECL_STANDALONE_INVALID_CASE,
            params: [ 'yes', 'Yes' ],
            lastPosition: parsed.params[2].equal,  // not right due to mocking
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
            lastPosition: parsed.params[2].equal, // not quite right, due to mocking
         });
      });

   });

   describe('makeToken()', () => {

      beforeEach(() => {
         spyOn(quotedValue, 'appendLTokens');
      });

      it('asks the quotedValue module to provide LTokens', () => {
         const parsed = {
            params: [ {
            } ],
         };

         const token = xmlDeclaration.makeToken(parsed);

         expect(quotedValue.appendLTokens).toHaveBeenCalledWith('param', token.lTokens, parsed.params[0]);
      });

      it('returns an entity reference token with the entity name', () => {
         const makeToken = makeLTokenMaker();
         const parsed = {
            params: [ {
               name: makeToken('version'),
               postNameSpace: makeToken(' '),
               equal: makeToken('='),
               postEqualSpace: makeToken(' '),
               paramValue: makeToken('1.1'),
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
         ]));
      });

   });

});
