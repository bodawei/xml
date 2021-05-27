/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';

import { toSToken } from 'sToken';
import { ElementDeclarationPToken } from 'pToken';

import { DeclarationDetails, ElDeclType, ValidateState } from '../../validateState';
import { elementDeclarationUpdateState } from '../elementDeclarationUpdateState';

describe('elementDeclarationUpdateState (unit)', () => {
   let elementDeclaration: ElementDeclarationPToken;
   let state: ValidateState;

   beforeEach(async () => {
      elementDeclaration = new ElementDeclarationPToken({
         close: toSToken('>'),
         declType: toSToken('ELEMENT'),
         name: toSToken('elementName'),
         open: toSToken('<!'),
      });

      state = new ValidateState();
   });

   it('adds a declaration with a content spec or model to the state as an ANY type', () => {
      const result = elementDeclarationUpdateState(
         elementDeclaration,
         {
            token: elementDeclaration,
            type: ElDeclType.ANY,
         },
         state,
      );

      expect(result).toEqual(
         new ValidateState({
            elementDeclarations: {
               elementName: {
                  token: elementDeclaration,
                  type: ElDeclType.ANY,
               },
            },
         }),
      );
   });

   it('adds a declaration with an ANY contentSpec as an ANY type', () => {
      elementDeclaration = new ElementDeclarationPToken({
         close: toSToken('>'),
         contentSpec: toSToken('ANY'),
         declType: toSToken('ELEMENT'),
         name: toSToken('elementName'),
         open: toSToken('<!'),
      });
      const result = elementDeclarationUpdateState(
         elementDeclaration,
         {
            token: elementDeclaration,
            type: ElDeclType.ANY,
         },
         state,
      );

      expect(result).toEqual(
         new ValidateState({
            elementDeclarations: {
               elementName: {
                  token: elementDeclaration,
                  type: ElDeclType.ANY,
               },
            },
         }),
      );
   });

   it('adds a declaration with an EMPTY contentSpec as an EMPTY type', () => {
      elementDeclaration = new ElementDeclarationPToken({
         close: toSToken('>'),
         contentSpec: toSToken('EMPTY'),
         declType: toSToken('ELEMENT'),
         name: toSToken('elementName'),
         open: toSToken('<!'),
      });
      const result = elementDeclarationUpdateState(
         elementDeclaration,
         {
            token: elementDeclaration,
            type: ElDeclType.EMPTY,
         },
         state,
      );

      expect(result).toEqual(
         new ValidateState({
            elementDeclarations: {
               elementName: {
                  token: elementDeclaration,
                  type: ElDeclType.EMPTY,
               },
            },
         }),
      );
   });

   it('does not override another entry already present for the same name', () => {
      const second = new ElementDeclarationPToken({
         close: toSToken('>'),
         contentSpec: toSToken('EMPTY'),
         declType: toSToken('ELEMENT'),
         name: toSToken('elementName'),
         open: toSToken('<!'),
      });
      const declDetails: DeclarationDetails = {
         token: elementDeclaration,
         type: ElDeclType.EMPTY,
      };

      const result1 = elementDeclarationUpdateState(elementDeclaration, declDetails, state);
      const result2 = elementDeclarationUpdateState(second, declDetails, result1);

      expect(result2).toEqual(
         new ValidateState({
            elementDeclarations: {
               elementName: {
                  token: elementDeclaration,
                  type: ElDeclType.EMPTY,
               },
            },
         }),
      );
   });

   it('adds a MIXED entry if it encounters a content model with #PCDATA at the start', () => {
      elementDeclaration = new ElementDeclarationPToken({
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
      const result = elementDeclarationUpdateState(
         elementDeclaration,
         {
            names: ['one', 'two'],
            token: elementDeclaration,
            type: ElDeclType.MIXED,
         },
         state,
      );

      expect(result).toEqual(
         new ValidateState({
            elementDeclarations: {
               elementName: {
                  names: ['one', 'two'],
                  token: elementDeclaration,
                  type: ElDeclType.MIXED,
               },
            },
         }),
      );
   });

   it('does not add a mis-cased #pcdata to the results', () => {
      elementDeclaration = new ElementDeclarationPToken({
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
      const result = elementDeclarationUpdateState(
         elementDeclaration,
         {
            names: ['one'],
            token: elementDeclaration,
            type: ElDeclType.MIXED,
         },
         state,
      );

      expect(result).toEqual(
         new ValidateState({
            elementDeclarations: {
               elementName: {
                  names: ['one'],
                  token: elementDeclaration,
                  type: ElDeclType.MIXED,
               },
            },
         }),
      );
   });

   it('does adds duplicate names to the duplicate list (a single time)', () => {
      elementDeclaration = new ElementDeclarationPToken({
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
               {
                  particle: {
                     name: toSToken('one'),
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

      const result = elementDeclarationUpdateState(
         elementDeclaration,
         {
            names: ['one', 'one', 'one'],
            token: elementDeclaration,
            type: ElDeclType.MIXED,
         },
         state,
      );

      expect(result).toEqual(
         new ValidateState({
            elementDeclarations: {
               elementName: {
                  names: ['one', 'one', 'one'],
                  token: elementDeclaration,
                  type: ElDeclType.MIXED,
               },
            },
         }),
      );
   });

   it('ignores emedded content models', () => {
      elementDeclaration = new ElementDeclarationPToken({
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

      const result = elementDeclarationUpdateState(
         elementDeclaration,
         {
            names: ['one'],
            token: elementDeclaration,
            type: ElDeclType.MIXED,
         },
         state,
      );

      expect(result).toEqual(
         new ValidateState({
            elementDeclarations: {
               elementName: {
                  names: ['one'],
                  token: elementDeclaration,
                  type: ElDeclType.MIXED,
               },
            },
         }),
      );
   });

   it('treats an empty top-level content model as an empty entry', () => {
      elementDeclaration = new ElementDeclarationPToken({
         close: toSToken('>'),
         contentModel: {
            delimitedParticles: [],
         },
         declType: toSToken('ELEMENT'),
         name: toSToken('elementName'),
         open: toSToken('<!'),
      });
      const result = elementDeclarationUpdateState(
         elementDeclaration,
         {
            token: elementDeclaration,
            type: ElDeclType.EMPTY,
         },
         state,
      );

      expect(result).toEqual(
         new ValidateState({
            elementDeclarations: {
               elementName: {
                  token: elementDeclaration,
                  type: ElDeclType.EMPTY,
               },
            },
         }),
      );
   });

   it('turns the non-mixed content model into a graph', () => {
      elementDeclaration = new ElementDeclarationPToken({
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

      const result = elementDeclarationUpdateState(
         elementDeclaration,
         {
            graph: { endId: 0, startId: 0, states: {} },
            token: elementDeclaration,
            type: ElDeclType.ELEMENT,
         },
         state,
      );

      expect(result).toEqual(
         new ValidateState({
            elementDeclarations: {
               elementName: {
                  graph: { endId: 0, startId: 0, states: {} },
                  token: elementDeclaration,
                  type: ElDeclType.ELEMENT,
               },
            },
         }),
      );
   });

   it('treats an initial deliited particle without a particle as a children', () => {
      elementDeclaration = new ElementDeclarationPToken({
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

      const result = elementDeclarationUpdateState(
         elementDeclaration,
         {
            graph: { endId: 0, startId: 0, states: {} },
            token: elementDeclaration,
            type: ElDeclType.ELEMENT,
         },
         state,
      );

      expect(result).toEqual(
         new ValidateState({
            elementDeclarations: {
               elementName: {
                  graph: { endId: 0, startId: 0, states: {} },
                  token: elementDeclaration,
                  type: ElDeclType.ELEMENT,
               },
            },
         }),
      );
   });
});
