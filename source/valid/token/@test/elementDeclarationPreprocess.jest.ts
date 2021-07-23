/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';

import { ElementDeclarationPToken } from 'pToken';
import { toSToken } from 'sToken';

import { elementDeclarationPreprocess } from '../elementDeclarationPreprocess';
import { ElDeclType, ValidateState } from '../../validateState';
import * as makeCmGraphModule from '../../contentModal/makeCmGraph';

import { makeCmGraph } from '../../contentModal/makeCmGraph';

jest.mock('../../contentModal/makeCmGraph');

describe('elementDeclarationPreprocess (unit)', () => {
   let makeCmGraphMock: jest.MockedFunction<typeof makeCmGraphModule.makeCmGraph>;
   let state: ValidateState;
   let externalState: ValidateState;

   beforeEach(async () => {
      makeCmGraphMock = makeCmGraph as jest.MockedFunction<typeof makeCmGraphModule.makeCmGraph>;

      state = new ValidateState();
      externalState = new ValidateState({
         dtdContext: {
            enclosingStack: [],
            inExternalMarkupContext: true,
         },
      });
   });

   it('generates an ANY type if an element declaration does not have a type', () => {
      const elementDeclaration = new ElementDeclarationPToken({
         close: toSToken('>'),
         declType: toSToken('ELEMENT'),
         name: toSToken('elementName'),
         open: toSToken('<!'),
      });

      const result = elementDeclarationPreprocess(elementDeclaration, state);

      expect(result).toEqual({
         isExternalMarkupDeclaration: false,
         token: elementDeclaration,
         type: ElDeclType.ANY,
      });
   });

   it('generates an ANY type when the input explicitly says ANY', () => {
      const elementDeclaration = new ElementDeclarationPToken({
         close: toSToken('>'),
         contentSpec: toSToken('ANY'),
         declType: toSToken('ELEMENT'),
         name: toSToken('elementName'),
         open: toSToken('<!'),
      });

      const result = elementDeclarationPreprocess(elementDeclaration, state);

      expect(result).toEqual({
         isExternalMarkupDeclaration: false,
         token: elementDeclaration,
         type: ElDeclType.ANY,
      });
   });

   it('generates an ANY type with an external markup declaration when the input explicitly says ANY', () => {
      const elementDeclaration = new ElementDeclarationPToken({
         close: toSToken('>'),
         contentSpec: toSToken('ANY'),
         declType: toSToken('ELEMENT'),
         name: toSToken('elementName'),
         open: toSToken('<!'),
      });

      const result = elementDeclarationPreprocess(elementDeclaration, externalState);

      expect(result).toEqual({
         isExternalMarkupDeclaration: true,
         token: elementDeclaration,
         type: ElDeclType.ANY,
      });
   });

   it('generates an EMPTY type when the input explicitly says EMPTY', () => {
      const elementDeclaration = new ElementDeclarationPToken({
         close: toSToken('>'),
         contentSpec: toSToken('EMPTY'),
         declType: toSToken('ELEMENT'),
         name: toSToken('elementName'),
         open: toSToken('<!'),
      });

      const result = elementDeclarationPreprocess(elementDeclaration, state);

      expect(result).toEqual({
         isExternalMarkupDeclaration: false,
         token: elementDeclaration,
         type: ElDeclType.EMPTY,
      });
   });

   it('adds a MIXED entry if it encounters a content model with #PCDATA at the start', () => {
      const elementDeclaration = new ElementDeclarationPToken({
         close: toSToken('>'),
         contentModel: {
            delimitedParticles: [
               {
                  particle: {
                     name: toSToken('#PCDATA'),
                  },
               },
               {
                  particle: {
                     name: toSToken('one'),
                  },
               },
               {
                  particle: {
                     name: toSToken('two'),
                  },
               },
            ],
         },
         declType: toSToken('ELEMENT'),
         name: toSToken('elementName'),
         open: toSToken('<!'),
      });

      const result = elementDeclarationPreprocess(elementDeclaration, state);

      expect(result).toEqual({
         isExternalMarkupDeclaration: false,
         names: ['one', 'two'],
         token: elementDeclaration,
         type: ElDeclType.MIXED,
      });
   });

   it('adds a MIXED entry in an external markup declaration when such a token is found in an external context', () => {
      const elementDeclaration = new ElementDeclarationPToken({
         close: toSToken('>'),
         contentModel: {
            delimitedParticles: [
               {
                  particle: {
                     name: toSToken('#PCDATA'),
                  },
               },
               {
                  particle: {
                     name: toSToken('one'),
                  },
               },
               {
                  particle: {
                     name: toSToken('two'),
                  },
               },
            ],
         },
         declType: toSToken('ELEMENT'),
         name: toSToken('elementName'),
         open: toSToken('<!'),
      });

      const result = elementDeclarationPreprocess(elementDeclaration, externalState);

      expect(result).toEqual({
         isExternalMarkupDeclaration: true,
         names: ['one', 'two'],
         token: elementDeclaration,
         type: ElDeclType.MIXED,
      });
   });

   it('does not add a mis-cased #pcdata to the results', () => {
      const elementDeclaration = new ElementDeclarationPToken({
         close: toSToken('>'),
         contentModel: {
            delimitedParticles: [
               {
                  particle: {
                     name: toSToken('#pcdata'),
                  },
               },
               {
                  particle: {
                     name: toSToken('one'),
                  },
               },
            ],
         },
         declType: toSToken('ELEMENT'),
         name: toSToken('elementName'),
         open: toSToken('<!'),
      });

      const result = elementDeclarationPreprocess(elementDeclaration, state);

      expect(result).toEqual({
         isExternalMarkupDeclaration: false,
         names: ['one'],
         token: elementDeclaration,
         type: ElDeclType.MIXED,
      });
   });

   it('considers an embedded content models to make something an ELEMENT type', () => {
      const elementDeclaration = new ElementDeclarationPToken({
         close: toSToken('>'),
         contentModel: {
            delimitedParticles: [
               {
                  particle: {
                     name: toSToken('#pcdata'),
                  },
               },
               {
                  particle: {
                     delimitedParticles: [
                        {
                           particle: {
                              name: toSToken('two'),
                           },
                        },
                     ],
                  },
               },
               {
                  particle: {
                     name: toSToken('one'),
                  },
               },
            ],
         },
         declType: toSToken('ELEMENT'),
         name: toSToken('elementName'),
         open: toSToken('<!'),
      });
      makeCmGraphMock.mockReturnValue({ endId: 0, startId: 0, states: {} });

      const result = elementDeclarationPreprocess(elementDeclaration, state);

      expect(result).toEqual({
         graph: { endId: 0, startId: 0, states: {} },
         isExternalMarkupDeclaration: false,
         token: elementDeclaration,
         type: ElDeclType.ELEMENT,
      });
   });

   it('marks an ELEMENT content model as in an external markup context when it is found there', () => {
      const elementDeclaration = new ElementDeclarationPToken({
         close: toSToken('>'),
         contentModel: {
            delimitedParticles: [
               {
                  particle: {
                     name: toSToken('#pcdata'),
                  },
               },
               {
                  particle: {
                     delimitedParticles: [
                        {
                           particle: {
                              name: toSToken('two'),
                           },
                        },
                     ],
                  },
               },
               {
                  particle: {
                     name: toSToken('one'),
                  },
               },
            ],
         },
         declType: toSToken('ELEMENT'),
         name: toSToken('elementName'),
         open: toSToken('<!'),
      });
      makeCmGraphMock.mockReturnValue({ endId: 0, startId: 0, states: {} });

      const result = elementDeclarationPreprocess(elementDeclaration, externalState);

      expect(result).toEqual({
         graph: { endId: 0, startId: 0, states: {} },
         isExternalMarkupDeclaration: true,
         token: elementDeclaration,
         type: ElDeclType.ELEMENT,
      });
   });

   it('treats an EMPTY top-level content model as an empty entry', () => {
      const elementDeclaration = new ElementDeclarationPToken({
         close: toSToken('>'),
         contentModel: {
            delimitedParticles: [],
         },
         declType: toSToken('ELEMENT'),
         name: toSToken('elementName'),
         open: toSToken('<!'),
      });

      const result = elementDeclarationPreprocess(elementDeclaration, state);

      expect(result).toEqual({
         isExternalMarkupDeclaration: false,
         token: elementDeclaration,
         type: ElDeclType.EMPTY,
      });
   });

   it('turns the non-mixed content model into a graph', () => {
      const elementDeclaration = new ElementDeclarationPToken({
         close: toSToken('>'),
         contentModel: {
            delimitedParticles: [
               {
                  delimiter: toSToken('|'),
                  particle: {
                     name: toSToken('one'),
                  },
               },
               {
                  delimiter: toSToken('|'),
                  particle: {
                     delimitedParticles: [
                        {
                           particle: {
                              name: toSToken('two'),
                              repeat: toSToken('*'),
                           },
                        },
                     ],
                  },
               },
               {
                  particle: {
                     name: toSToken('three'),
                  },
               },
            ],
         },
         declType: toSToken('ELEMENT'),
         name: toSToken('elementName'),
         open: toSToken('<!'),
      });
      makeCmGraphMock.mockReturnValue({ endId: 0, startId: 0, states: {} });

      const result = elementDeclarationPreprocess(elementDeclaration, state);

      expect(result).toEqual({
         graph: { endId: 0, startId: 0, states: {} },
         isExternalMarkupDeclaration: false,
         token: elementDeclaration,
         type: ElDeclType.ELEMENT,
      });
   });

   it('treats an initial deliited particle without a particle as a children', () => {
      const elementDeclaration = new ElementDeclarationPToken({
         close: toSToken('>'),
         contentModel: {
            delimitedParticles: [
               {
                  delimiter: toSToken('|'),
               },
               {
                  particle: {
                     name: toSToken('three'),
                  },
               },
            ],
         },
         declType: toSToken('ELEMENT'),
         name: toSToken('elementName'),
         open: toSToken('<!'),
      });
      makeCmGraphMock.mockReturnValue({ endId: 0, startId: 0, states: {} });

      const result = elementDeclarationPreprocess(elementDeclaration, state);

      expect(result).toEqual({
         graph: { endId: 0, startId: 0, states: {} },
         isExternalMarkupDeclaration: false,
         token: elementDeclaration,
         type: ElDeclType.ELEMENT,
      });
   });
});
