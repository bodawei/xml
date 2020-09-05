/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */
/* eslint-env jasmine */

import { EntityId, Range } from 'basic';
import { MockSTokenSource } from 'sToken-test';

import * as pi from '../../processingInstruction';
import * as textDeclaration from '../../textDeclaration';
import * as xmlDeclaration from '../../xmlDeclaration';
import { parseInstruction } from '../instruction';
import { SToken } from 'sToken';

describe('instruction (unit)', () => {
   let open: SToken;

   beforeEach(() => {
      open = SToken.fromString('<?');
   });

   describe('parseInstruction()', () => {
      let callback: jasmine.Spy;

      beforeEach(() => {
         callback = jasmine.createSpy('callbackSpy');
      });

      it('does a basic parse of a processing instruction', () => {
         const piParse = spyOn(pi, 'parseProcessingInstruction');
         const mockSource = new MockSTokenSource([
            [ undefined, 'space' ],
            [ undefined, 'word', [ '?>' ] ],
            [ undefined, 'space' ],
         ]);

         parseInstruction(mockSource, open, true, callback);
         mockSource.respondInAsyncTime();

         const args = piParse.calls.argsFor(0);
         expect(args[0]).toEqual(mockSource);
         expect(args[1]).toEqual({
            open: open,
            openSpace: undefined,
            target: undefined,
            targetSpace: undefined,
         });
         expect(args[2]).toBeInstanceOf(Function);
      });

      it('does a basic parse of an xml declaration', () => {
         const xmlParse = spyOn(xmlDeclaration, 'parseXmlDeclaration');
         const mockSource = new MockSTokenSource([
            [ undefined, 'space' ],
            [ 'xml', 'word', [ '?>' ] ],
            [ undefined, 'space' ],
         ]);

         parseInstruction(mockSource, open, true, callback);
         mockSource.respondInAsyncTime();

         const args = xmlParse.calls.argsFor(0);
         expect(args[0]).toEqual(mockSource);
         expect(args[1]).toEqual({
            open: open,
            openSpace: undefined,
            target: new SToken('xml', 'xml', new Range(new EntityId(), 0, 0, 0, 3, 0, 3)),
            targetSpace: undefined,
         });
         expect(args[2]).toBeInstanceOf(Function);
      });

      it('does a basic parse of an text declaration', () => {
         const textParse = spyOn(textDeclaration, 'parseTextDeclaration');
         const mockSource = new MockSTokenSource([
            [ '\t', 'space' ],
            [ 'xml', 'word', [ '?>' ] ],
            [ ' ', 'space' ],
         ]);

         parseInstruction(mockSource, open, false, callback);
         mockSource.respondInAsyncTime();

         const args = textParse.calls.argsFor(0);
         expect(args[0]).toEqual(mockSource);
         expect(args[1]).toEqual({
            open: open,
            openSpace: new SToken('\t', '\t', new Range(new EntityId(), 0, 0, 0, 1, 0, 1)),
            target: new SToken('xml', 'xml', new Range(new EntityId(), 1, 0, 1, 4, 0, 4)),
            targetSpace: new SToken(' ', ' ', new Range(new EntityId(), 4, 0, 4, 5, 0, 5)),
         });
         expect(args[2]).toBeInstanceOf(Function);
      });

   });

});
