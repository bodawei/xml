/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { toSToken } from 'sToken';
import { ElementDeclarationPToken } from 'pToken';

import { ElDeclType } from '../../validateState';
import { recordElementDeclaration } from '../recordElementDeclaration';

import * as makeCmGraphModule from '../../contentModal/makeCmGraph';

jest.mock('../../contentModal/makeCmGraph');

describe('recordElementDeclaration (unit)', () => {
   let elementDeclaration: ElementDeclarationPToken;
   let makeCmGraph: jest.MockedFunction<typeof makeCmGraphModule.makeCmGraph>;

   beforeEach(async () => {
      ({ makeCmGraph } = (await import('../../contentModal/makeCmGraph')) as {
         makeCmGraph: jest.MockedFunction<typeof makeCmGraphModule.makeCmGraph>;
      });
      elementDeclaration = new ElementDeclarationPToken({
         open: toSToken('<!'),
         declType: toSToken('ELEMENT'),
         name: toSToken('elementName'),
         close: toSToken('>'),
      });
   });

   it('adds a declaration with a content spec or model to the state as an ANY type', () => {
      const result = recordElementDeclaration(elementDeclaration, { elementDeclarations: {} });

      expect(result).toEqual({
         elementDeclarations: {
            elementName: {
               token: elementDeclaration,
               type: ElDeclType.ANY,
            },
         },
      });
   });

   it('adds a declaration with an ANY contentSpec as an ANY type', () => {
      elementDeclaration = new ElementDeclarationPToken({
         open: toSToken('<!'),
         declType: toSToken('ELEMENT'),
         name: toSToken('elementName'),
         contentSpec: toSToken('ANY'),
         close: toSToken('>'),
      });
      const result = recordElementDeclaration(elementDeclaration, { elementDeclarations: {} });

      expect(result).toEqual({
         elementDeclarations: {
            elementName: {
               token: elementDeclaration,
               type: ElDeclType.ANY,
            },
         },
      });
   });

   it('adds a declaration with an EMPTY contentSpec as an EMPTY type', () => {
      elementDeclaration = new ElementDeclarationPToken({
         open: toSToken('<!'),
         declType: toSToken('ELEMENT'),
         name: toSToken('elementName'),
         contentSpec: toSToken('EMPTY'),
         close: toSToken('>'),
      });
      const result = recordElementDeclaration(elementDeclaration, { elementDeclarations: {} });

      expect(result).toEqual({
         elementDeclarations: {
            elementName: {
               token: elementDeclaration,
               type: ElDeclType.EMPTY,
            },
         },
      });
   });

   it('does not override another entry already present for the same name', () => {
      const second = new ElementDeclarationPToken({
         open: toSToken('<!'),
         declType: toSToken('ELEMENT'),
         name: toSToken('elementName'),
         contentSpec: toSToken('EMPTY'),
         close: toSToken('>'),
      });
      const result1 = recordElementDeclaration(elementDeclaration, { elementDeclarations: {} });
      const result2 = recordElementDeclaration(second, result1);

      expect(result2).toEqual({
         elementDeclarations: {
            elementName: {
               token: elementDeclaration,
               type: ElDeclType.ANY,
            },
         },
      });
   });

   it('adds a MIXED entry if it encounters a content model with #PCDATA at the start', () => {
      elementDeclaration = new ElementDeclarationPToken({
         open: toSToken('<!'),
         declType: toSToken('ELEMENT'),
         name: toSToken('elementName'),
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
         close: toSToken('>'),
      });
      const result = recordElementDeclaration(elementDeclaration, { elementDeclarations: {} });

      expect(result).toEqual({
         elementDeclarations: {
            elementName: {
               token: elementDeclaration,
               type: ElDeclType.MIXED,
               names: ['one', 'two'],
               duplicateNames: [],
            },
         },
      });
   });

   it('does not add a mis-cased #pcdata to the results', () => {
      elementDeclaration = new ElementDeclarationPToken({
         open: toSToken('<!'),
         declType: toSToken('ELEMENT'),
         name: toSToken('elementName'),
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
         close: toSToken('>'),
      });
      const result = recordElementDeclaration(elementDeclaration, { elementDeclarations: {} });

      expect(result).toEqual({
         elementDeclarations: {
            elementName: {
               token: elementDeclaration,
               type: ElDeclType.MIXED,
               names: ['one'],
               duplicateNames: [],
            },
         },
      });
   });

   it('does adds duplicate names to the duplicate list (a single time)', () => {
      elementDeclaration = new ElementDeclarationPToken({
         open: toSToken('<!'),
         declType: toSToken('ELEMENT'),
         name: toSToken('elementName'),
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
         close: toSToken('>'),
      });
      const result = recordElementDeclaration(elementDeclaration, { elementDeclarations: {} });

      expect(result).toEqual({
         elementDeclarations: {
            elementName: {
               token: elementDeclaration,
               type: ElDeclType.MIXED,
               names: ['one'],
               duplicateNames: ['one'],
            },
         },
      });
   });

   it('ignores emedded content models', () => {
      elementDeclaration = new ElementDeclarationPToken({
         open: toSToken('<!'),
         declType: toSToken('ELEMENT'),
         name: toSToken('elementName'),
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
         close: toSToken('>'),
      });
      const result = recordElementDeclaration(elementDeclaration, { elementDeclarations: {} });

      expect(result).toEqual({
         elementDeclarations: {
            elementName: {
               token: elementDeclaration,
               type: ElDeclType.MIXED,
               names: ['one'],
               duplicateNames: [],
            },
         },
      });
   });

   it('treats an empty top-level content model as an empty entry', () => {
      elementDeclaration = new ElementDeclarationPToken({
         open: toSToken('<!'),
         declType: toSToken('ELEMENT'),
         name: toSToken('elementName'),
         contentModel: {
            delimitedParticles: [],
         },
         close: toSToken('>'),
      });
      const result = recordElementDeclaration(elementDeclaration, { elementDeclarations: {} });

      expect(result).toEqual({
         elementDeclarations: {
            elementName: {
               token: elementDeclaration,
               type: ElDeclType.EMPTY,
            },
         },
      });
   });

   it('turns the non-mixed content model into a graph', () => {
      elementDeclaration = new ElementDeclarationPToken({
         open: toSToken('<!'),
         declType: toSToken('ELEMENT'),
         name: toSToken('elementName'),
         contentModel: {
            delimitedParticles: [
               {
                  particle: {
                     name: toSToken('one'),
                  },
                  delimiter: toSToken('|'),
               },
               {
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
                  delimiter: toSToken('|'),
               },
               {
                  particle: {
                     name: toSToken('three'),
                  },
               },
            ],
         },
         close: toSToken('>'),
      });
      makeCmGraph.mockReturnValue({ startId: 0, endId: 0, states: {} });

      const result = recordElementDeclaration(elementDeclaration, { elementDeclarations: {} });

      expect(result).toEqual({
         elementDeclarations: {
            elementName: {
               token: elementDeclaration,
               type: ElDeclType.CHILDREN,
               graph: { startId: 0, endId: 0, states: {} },
            },
         },
      });
   });

   it('treats an initial deliited particle without a particle as a children', () => {
      elementDeclaration = new ElementDeclarationPToken({
         open: toSToken('<!'),
         declType: toSToken('ELEMENT'),
         name: toSToken('elementName'),
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
         close: toSToken('>'),
      });
      makeCmGraph.mockReturnValue({ startId: 0, endId: 0, states: {} });

      const result = recordElementDeclaration(elementDeclaration, { elementDeclarations: {} });

      expect(result).toEqual({
         elementDeclarations: {
            elementName: {
               token: elementDeclaration,
               type: ElDeclType.CHILDREN,
               graph: { startId: 0, endId: 0, states: {} },
            },
         },
      });
   });
});
