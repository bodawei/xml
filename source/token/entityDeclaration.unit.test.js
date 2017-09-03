/* Copyright ® 2017 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { MockErrorCollector } from '../basic/test';
import lTokenUtil from '../lToken/test';
import { WellFormedError } from '../error';

import entityDeclaration from './entityDeclaration.js';
import externalId from './externalId.js';
import quotedValue from './quotedValue.js';

const NO_PARAMS = [ 'char', 'space', 'peekChar', 'peekSpace' ];

describe('entityDeclaration', () => {

   describe('parse()', () => {
      let mockSource;
      let callback;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
         mockSource = new lTokenUtil.MockLTokenSource([
            lTokenUtil.makeLToken('e'),
            lTokenUtil.makeLToken('entityName'),
            lTokenUtil.makeLToken(' '),
            lTokenUtil.makeLToken('S'),
            undefined,
            undefined,
            lTokenUtil.makeLToken('>'),
         ]);

         spyOn(externalId, 'parse');
         externalId.parse.and.callFake((source, terminators, cb) => {
            cb({ externalId: true });
         });
      });

      it('does a simple parse', () => {
         entityDeclaration.parse(mockSource, {}, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps({
            type: 'ENTITY_DECL',
            openLToken: undefined,
            postOpenSpaceLToken: undefined,
            declTypeLToken: undefined,
            postDeclTypeSpaceLToken: undefined,
            nameLToken: lTokenUtil.makeLToken('entityName'),
            postNameSpaceLToken: lTokenUtil.makeLToken(' '),
            externalId: { externalId: true },
            postExternalIdSpaceLToken: undefined,
            closeLToken: lTokenUtil.makeLToken('>'),
         });
      });

      it('uses whatever preliminary declaration values were passed in', () => {
         entityDeclaration.parse(mockSource, {
            openLToken: 'a',
            postOpenSpaceLToken: 'b',
            declTypeLToken: 'c',
            postDeclTypeSpaceLToken: 'd',
         }, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps({
            openLToken: 'a',
            postOpenSpaceLToken: 'b',
            declTypeLToken: 'c',
            postDeclTypeSpaceLToken: 'd',
         });
      });

      it('returns nothing if the first peek return undefined. That is: <!ENTITY', () => {
         mockSource = new lTokenUtil.MockLTokenSource([
            undefined,
         ]);

         entityDeclaration.parse(mockSource, {}, callback);
         mockSource.respondInAsyncTime();

         expect(callback.calls.allArgs()).toEqual([ [ {
            type: 'ENTITY_DECL',
            openLToken: undefined,
            postOpenSpaceLToken: undefined,
            declTypeLToken: undefined,
            postDeclTypeSpaceLToken: undefined,
         } ] ]);
      });

      it('returns parameter entity info if this is a parameter entity: <!ENTITY % entityName ...', () => {
         mockSource = new lTokenUtil.MockLTokenSource([
            lTokenUtil.makeLToken('%'),
            lTokenUtil.makeLToken('%'),
            lTokenUtil.makeLToken(' '),
            lTokenUtil.makeLToken('entityName'),
            lTokenUtil.makeLToken(' '),
            lTokenUtil.makeLToken('S'),
            undefined,
            undefined,
            lTokenUtil.makeLToken('>'),
         ]);

         entityDeclaration.parse(mockSource, {}, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps({
            type: 'ENTITY_DECL',
            parameterLToken: lTokenUtil.makeLToken('%'),
            postParameterSpaceLToken: lTokenUtil.makeLToken(' '),
            nameLToken: lTokenUtil.makeLToken('entityName'),
         });
      });

      it('returns parameter entity without the trailing space if none present: <!ENTITY %entityName...', () => {
         mockSource = new lTokenUtil.MockLTokenSource([
            lTokenUtil.makeLToken('%'),
            lTokenUtil.makeLToken('%'),
            undefined,
            lTokenUtil.makeLToken('entityName'),
            lTokenUtil.makeLToken(' '),
            lTokenUtil.makeLToken('S'),
            undefined,
            undefined,
            lTokenUtil.makeLToken('>'),
         ]);

         entityDeclaration.parse(mockSource, {}, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps({
            parameterLToken: lTokenUtil.makeLToken('%'),
            postParameterSpaceLToken: undefined,
            nameLToken: lTokenUtil.makeLToken('entityName'),
         });
      });

      it('returns nothing if there is no name, space, or start of value: <!ENTITY %', () => {
         mockSource = new lTokenUtil.MockLTokenSource([
            lTokenUtil.makeLToken('%'),
            lTokenUtil.makeLToken('%'),
            undefined,
            undefined,
            undefined,
            undefined,
         ]);

         entityDeclaration.parse(mockSource, {}, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps({
            parameterLToken: lTokenUtil.makeLToken('%'),
            postParameterSpaceLToken: undefined,
            nameLToken: undefined,
            postNameSpaceLToken: undefined,
         });
      });

      it('returns the quoted value if present: <!ENTITY entityName "foo" >', () => {
         mockSource = new lTokenUtil.MockLTokenSource([
            lTokenUtil.makeLToken('e'),
            lTokenUtil.makeLToken('entityName'),
            lTokenUtil.makeLToken(' '),
            lTokenUtil.makeLToken('"'),
            undefined,
            lTokenUtil.makeLToken('>'),
         ]);
         spyOn(quotedValue, 'parse').and.callFake((source, options, cb) => {
            cb({ quotedValue: true });
         });

         entityDeclaration.parse(mockSource, {}, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps({
            entityValue: {
               quotedValue: true,
            },
         });
      });

      it('returns no space between entity name and value: <!ENTITY entityName"foo" >', () => {
         mockSource = new lTokenUtil.MockLTokenSource([
            lTokenUtil.makeLToken('e'),
            lTokenUtil.makeLToken('entityName'),
            undefined,
            lTokenUtil.makeLToken('"'),
            undefined,
            lTokenUtil.makeLToken('>'),
         ]);
         spyOn(quotedValue, 'parse').and.callFake((source, options, cb) => {
            cb({ quotedValue: true });
         });

         entityDeclaration.parse(mockSource, {}, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps({
            nameLToken: lTokenUtil.makeLToken('entityName'),
            postNameSpaceLToken: undefined,
            entityValue: {
               quotedValue: true,
            },
         });
      });

      it('adds trailing space after quoted value if present: <!ENTITY entityName "foo" >', () => {
         mockSource = new lTokenUtil.MockLTokenSource([
            lTokenUtil.makeLToken('e'),
            lTokenUtil.makeLToken('entityName'),
            lTokenUtil.makeLToken(' '),
            lTokenUtil.makeLToken('"'),
            lTokenUtil.makeLToken(' '),
            lTokenUtil.makeLToken('>'),
         ]);
         spyOn(quotedValue, 'parse').and.callFake((source, options, cb) => {
            cb({ quotedValue: true });
         });

         entityDeclaration.parse(mockSource, {}, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps({
            entityValue: {
               quotedValue: true,
            },
            postEntityValueSpaceLToken: lTokenUtil.makeLToken(' '),
            closeLToken: lTokenUtil.makeLToken('>'),
         });
      });

      it('stops if externalId returns nothing: <!ENTITY entityName >', () => {
         mockSource = new lTokenUtil.MockLTokenSource([
            lTokenUtil.makeLToken('e'),
            lTokenUtil.makeLToken('entityName'),
            lTokenUtil.makeLToken(' '),
            lTokenUtil.makeLToken('>'),
            lTokenUtil.makeLToken('>'),
         ]);
         externalId.parse.and.callFake((source, terminators, cb) => {
            cb(undefined);
         });

         entityDeclaration.parse(mockSource, {}, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps({
            nameLToken: lTokenUtil.makeLToken('entityName'),
            postNameSpaceLToken: lTokenUtil.makeLToken(' '),
            externalId: undefined,
         });
      });

      it('returns a space after the externalID: <!ENTITY entityName SYSTEM "foo" >', () => {
         mockSource = new lTokenUtil.MockLTokenSource([
            lTokenUtil.makeLToken('e'),
            lTokenUtil.makeLToken('entityName'),
            lTokenUtil.makeLToken(' '),
            lTokenUtil.makeLToken('S'),
            lTokenUtil.makeLToken(' '),
            undefined, // peekWord
            lTokenUtil.makeLToken('>'),
         ]);

         entityDeclaration.parse(mockSource, {}, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps({
            externalId: {
               externalId: true,
            },
            postExternalIdSpaceLToken: lTokenUtil.makeLToken(' '),
            closeLToken: lTokenUtil.makeLToken('>'),
         });
      });

      it('returns an NDATA clause if found: <!ENTITY entityName SYSTEM "foo" NDATA testNData >', () => {
         mockSource = new lTokenUtil.MockLTokenSource([
            lTokenUtil.makeLToken('e'),
            lTokenUtil.makeLToken('entityName'),
            lTokenUtil.makeLToken(' '),
            lTokenUtil.makeLToken('S'),
               // externalId
            lTokenUtil.makeLToken(' '),
            lTokenUtil.makeLToken('NDATA'),
            lTokenUtil.makeLToken('NDATA'),
            lTokenUtil.makeLToken(' '),
            lTokenUtil.makeLToken('testNData'),
            lTokenUtil.makeLToken(' '),
            lTokenUtil.makeLToken('>'),
         ]);

         entityDeclaration.parse(mockSource, {}, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps({
            postExternalIdSpaceLToken: lTokenUtil.makeLToken(' '),
            nDataLToken: lTokenUtil.makeLToken('NDATA'),
            postNDataSpaceLToken: lTokenUtil.makeLToken(' '),
            nDataNameLToken: lTokenUtil.makeLToken('testNData'),
            postNDataNameSpaceLToken: lTokenUtil.makeLToken(' '),
            closeLToken: lTokenUtil.makeLToken('>'),
         });
      });

      it('recognizes a non-all caps NDATA: <!ENTITY entityName SYSTEM "foo" ndaTa testNData >', () => {
         mockSource = new lTokenUtil.MockLTokenSource([
            lTokenUtil.makeLToken('e'),
            lTokenUtil.makeLToken('entityName'),
            lTokenUtil.makeLToken(' '),
            lTokenUtil.makeLToken('S'),
               // externalId
            lTokenUtil.makeLToken(' '),
            lTokenUtil.makeLToken('ndaTa'),
            lTokenUtil.makeLToken('ndaTa'),
            lTokenUtil.makeLToken(' '),
            lTokenUtil.makeLToken('testNData'),
            lTokenUtil.makeLToken(' '),
            lTokenUtil.makeLToken('>'),
         ]);

         entityDeclaration.parse(mockSource, {}, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps({
            nDataLToken: lTokenUtil.makeLToken('ndaTa'),
         });
      });

      it('does not mind no space after the ndata value: <!ENTITY entityName SYSTEM "foo" ndaTa testNData>', () => {
         mockSource = new lTokenUtil.MockLTokenSource([
            lTokenUtil.makeLToken('e'),
            lTokenUtil.makeLToken('entityName'),
            lTokenUtil.makeLToken(' '),
            lTokenUtil.makeLToken('S'),
               // externalId
            lTokenUtil.makeLToken(' '),
            lTokenUtil.makeLToken('ndaTa'),
            lTokenUtil.makeLToken('ndaTa'),
            lTokenUtil.makeLToken(' '),
            lTokenUtil.makeLToken('testNData'),
            undefined,
            lTokenUtil.makeLToken('>'),
         ]);

         entityDeclaration.parse(mockSource, {}, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps({
            nDataLToken: lTokenUtil.makeLToken('ndaTa'),
            postNDataSpaceLToken: lTokenUtil.makeLToken(' '),
            nDataNameLToken: lTokenUtil.makeLToken('testNData'),
            postNDataNameSpaceLToken: undefined,
            closeLToken: lTokenUtil.makeLToken('>'),
         });
      });

      it('returns if stops after NDATA: <!ENTITY entityName SYSTEM "foo" NDATA', () => {
         mockSource = new lTokenUtil.MockLTokenSource([
            lTokenUtil.makeLToken('e'),
            lTokenUtil.makeLToken('entityName'),
            lTokenUtil.makeLToken(' '),
            lTokenUtil.makeLToken('S'),
               // externalId
            lTokenUtil.makeLToken(' '),
            lTokenUtil.makeLToken('NDATA'),
            lTokenUtil.makeLToken('NDATA'),
            undefined,
            undefined,
            undefined,
            undefined,
         ]);

         entityDeclaration.parse(mockSource, {}, callback);
         mockSource.respondInAsyncTime();

         expect(callback).toContainParsedProps({
            postExternalIdSpaceLToken: lTokenUtil.makeLToken(' '),
            nDataLToken: lTokenUtil.makeLToken('NDATA'),
            postNDataSpaceLToken: undefined,
            nDataNameLToken: undefined,
            postNDataNameSpaceLToken: undefined,
            closeLToken: undefined,
         });
      });

      describe('terminators', () => {

         it('passes quotes and > as terminators for getting the name', () => {
            mockSource = new lTokenUtil.MockLTokenSource([
               lTokenUtil.makeLToken('e'),
               lTokenUtil.makeLToken('entityName'),
               lTokenUtil.makeLToken(' '),
               lTokenUtil.makeLToken('S'),
               undefined,
               undefined,
               lTokenUtil.makeLToken('>'),
            ]);

            entityDeclaration.parse(mockSource, {}, callback);
            mockSource.respondInAsyncTime();

            expect(mockSource.extractToObject.calls.argsFor(0)[1]).toEqual([ '>', '"', '\'' ]);
         });

         it('passes > as terminators all other requests', () => {
            mockSource = new lTokenUtil.MockLTokenSource([
               lTokenUtil.makeLToken('e'),
               lTokenUtil.makeLToken('entityName'),
               lTokenUtil.makeLToken(' '),
               lTokenUtil.makeLToken('S'),
               undefined,
               undefined,
               lTokenUtil.makeLToken('>'),
            ]);

            entityDeclaration.parse(mockSource, {}, callback);
            mockSource.respondInAsyncTime();

            const allArgs = mockSource.extractToObject.calls.allArgs().concat(mockSource.extract.calls.allArgs());
            allArgs.forEach((args) => {
               if (NO_PARAMS.indexOf(args[0]) !== -1) {
                  return;
               }
               // skip the  name call
               if (args[1].length === 3 && args[0] === 'word') {
                  return;
               }
               // skip the match one
               if (args[1] === '>' && args[0] === 'match') {
                  return;
               }

               expect(args[1]).toEqual([ '>' ]);
            });
         });

      });

   });

   describe('checkWellFormed()', () => {
      let mockErrorCollector;
      let parsed;

      beforeEach(() => {
         mockErrorCollector = new MockErrorCollector();
         parsed = {
            openLToken: lTokenUtil.makeLToken('<!'),
            declTypeLToken: lTokenUtil.makeLToken('ENTITY'),
            postDeclTypeSpaceLToken: lTokenUtil.makeLToken('\t'),
            nameLToken: lTokenUtil.makeLToken('entityName'),
            postNameSpaceLToken: lTokenUtil.makeLToken(' '),
            entityValue: {},
            postEntityValueSpaceLToken: undefined,
            closeLToken: lTokenUtil.makeLToken('>'),
         };
      });

      it('reports an error if % is not followed by a space', () => {
         parsed.parameterLToken = lTokenUtil.makeLToken('%');

         entityDeclaration.checkWellFormed(parsed, mockErrorCollector);

         expect(mockErrorCollector.report)
            .toHaveBeenCalledWith(WellFormedError.ID.ENTITYDECL_PERCENT_NO_TRAILING_SPACE, [ 'entityName' ]);
      });

      it('reports an error if there is no name', () => {
         delete parsed.nameLToken;

         entityDeclaration.checkWellFormed(parsed, mockErrorCollector);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.ENTITYDECL_NO_NAME,
            params: undefined,
            position: undefined,
            lastPosition: undefined,
         });
      });

      it('checks the name validity', () => {
         entityDeclaration.checkWellFormed(parsed, mockErrorCollector);

         expect(mockErrorCollector.checkName)
            .toHaveBeenCalledWith(parsed.nameLToken, WellFormedError.ID.ENTITYDECL_NAME_INVALID, parsed.openLToken);
      });

      it('reports an error if there is no space after the name', () => {
         delete parsed.postNameSpaceLToken;

         entityDeclaration.checkWellFormed(parsed, mockErrorCollector);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.ENTITYDECL_NAME_NO_TRAILING_SPACE,
            params: [ 'entityName' ],
            position: undefined,
            lastPosition: parsed.nameLToken,
         });
      });

      it('reports an error if there is no EnitytValue or ExternalID', () => {
         delete parsed.entityValue;

         entityDeclaration.checkWellFormed(parsed, mockErrorCollector);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.ENTITYDECL_NO_VALUE,
            params: [ 'entityName' ],
            position: parsed.postNameSpaceLToken, // nothing after that
         });
      });

      it('reports an error if there was no closing', () => {
         delete parsed.closeLToken;

         entityDeclaration.checkWellFormed(parsed, mockErrorCollector);

         expect(mockErrorCollector).toReportError({
            id: WellFormedError.ID.ENTITYDECL_NO_CLOSE,
            params: [ 'entityName' ],
            position: undefined,
            lastPosition: parsed.postNameSpaceLToken,
         });
      });

   });

   describe('makeToken()', () => {

      it('returns an entity declaration token with the name and value found in the parsing', () => {
         const parsed = {
            nameLToken: lTokenUtil.makeLToken('entityName'),
            entityValue: {
               valueLToken: lTokenUtil.makeLToken('value'),
            },
         };

         const token = entityDeclaration.makeToken(parsed);

         expect(token).toEqual(new entityDeclaration.Token('entityName', 'value', {}, '', [
            parsed.nameLToken,
            parsed.entityValue.valueLToken,
         ]));
      });

      it('returns a parameter entity declaration token with the name and value found in the parsing', () => {
         const parsed = {
            parameterLToken: lTokenUtil.makeLToken('%'),
            nameLToken: lTokenUtil.makeLToken('entityName'),
            entityValue: {
               valueLToken: lTokenUtil.makeLToken('value'),
            },
         };

         const token = entityDeclaration.makeToken(parsed);

         expect(token).toEqual(new entityDeclaration.ParamToken('entityName', 'value', {}, '', [
            parsed.parameterLToken,
            parsed.nameLToken,
            parsed.entityValue.valueLToken,
         ]));
      });

      it('returns a entity declaration with a blank value if there is no name', () => {
         const parsed = {
            nameLToken: undefined,
            entityValue: {
               valueLToken: lTokenUtil.makeLToken('value'),
            },
         };

         const token = entityDeclaration.makeToken(parsed);

         expect(token).toEqual(new entityDeclaration.Token('', 'value', {}, '', [
            parsed.entityValue.valueLToken,
         ]));
      });

      it('returns a entity declaration with a blank value if there is no value', () => {
         const parsed = {
            parameterLToken: lTokenUtil.makeLToken('%'),
            nameLToken: lTokenUtil.makeLToken('entityName'),
         };

         const token = entityDeclaration.makeToken(parsed);

         expect(token).toEqual(new entityDeclaration.ParamToken('entityName', '', {}, '', [
            parsed.parameterLToken,
            parsed.nameLToken,
         ]));
      });

   });

});
