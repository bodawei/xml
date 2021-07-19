/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { MockErrorCollector } from 'basic-test';
import { ElementDeclarationPToken, GeneralEntityDeclarationPToken, TextPToken } from 'pToken';
import { toSToken } from 'sToken';

import { elementStartValidate } from '../elementStartValidate';
import { ValidityError } from '../../error/ValidityError';
import { validityConstraint } from '../../error/validityConstraint';
import { ElDeclType, ElementContext, ValidateState } from '../../validateState';
import { ElementStartPToken, NOTATION_PTOKEN } from 'token';
import { CmGraph } from '../../contentModal/cmGraphTypes';
import { makeElementDeclaration } from 'token-test';

const VID = validityConstraint.id;

describe('elementStartValidate (unit)', () => {
   let elementDeclaration: ElementDeclarationPToken;
   let mockErrorCollector: MockErrorCollector;
   let state: ValidateState;
   let elementStart: ElementStartPToken;
   let graph: CmGraph;

   beforeEach(() => {
      mockErrorCollector = new MockErrorCollector();
      elementDeclaration = new ElementDeclarationPToken({
         close: toSToken('>'),
         declType: toSToken('ELEMENT'),
         declTypeSpace: toSToken(' '),
         name: toSToken('elementName'),
         nameSpace: toSToken(' '),
         open: toSToken('<!'),
         openSpace: undefined,
      });
      elementStart = new ElementStartPToken({
         open: toSToken('</'),
         name: toSToken('elementName'),
      });
      graph = {
         startId: 0,
         endId: 0,
         states: {
            '4': {
               id: 4,
               trans: {
                  one: {
                     ref: '/1/2',
                     stateId: 5,
                  },
                  two: {
                     ref: '/3/4',
                     stateId: 6,
                  },
               },
               done: false,
            },
         },
      };
      const currentContext: ElementContext = {
         declDetails: {
            token: elementDeclaration,
            type: ElDeclType.ELEMENT,
            graph,
         },
         parentName: 'elementName',
         stateId: 4,
      };
      state = new ValidateState({
         elementDeclarations: {
            elementName: {
               type: ElDeclType.ELEMENT,
               token: new ElementDeclarationPToken({
                  open: toSToken('<!'),
                  declType: toSToken('ELEMENT'),
                  name: toSToken('elementName'),
                  close: toSToken('>'),
               }),
               graph,
            },
         },
         elementContext: {
            contextStack: [currentContext],
            activeContext: currentContext,
            pastEnd: false,
         },
      });
   });

   it('reports an error when element is the first/root element, and it does not match the docType', () => {
      state = new ValidateState({
         docType: 'rootType',
      });

      elementStartValidate(elementStart, state, mockErrorCollector);

      // @ts-expect-error 2329/matchers
      expect(mockErrorCollector).toReportValidityError({
         id: VID.ELEMENT_MISMATCH_ROOT_TYPE,
         params: ['rootType', 'elementName'],
         position: elementStart.name,
         lastPosition: undefined,
      });
   });

   it('reports no error when element is the first/root element, and it does match the docType', () => {
      state = new ValidateState({
         docType: 'elementName',
         elementDeclarations: {
            elementName: {
               token: makeElementDeclaration(),
               type: ElDeclType.ANY,
            },
         },
      });

      elementStartValidate(elementStart, state, mockErrorCollector);

      expect(mockErrorCollector.errors).toEqual([]);
   });

   it('reports no error when element is the first/root element, does not match the docType, but we are past the end', () => {
      state = new ValidateState({
         docType: 'bogusName',
         elementDeclarations: {
            elementName: {
               token: makeElementDeclaration(),
               type: ElDeclType.ANY,
            },
         },
         elementContext: {
            contextStack: [],
            pastEnd: true,
         },
      });

      elementStartValidate(elementStart, state, mockErrorCollector);

      expect(mockErrorCollector.errors).toEqual([]);
   });

   it('reports an error when the context is EMPTY', () => {
      state = new ValidateState({
         elementContext: {
            ...state.elementContext,
            activeContext: {
               declDetails: {
                  token: elementDeclaration,
                  type: ElDeclType.EMPTY,
               },
               parentName: 'parentName',
               stateId: 0,
            },
         },
      });

      elementStartValidate(elementStart, state, mockErrorCollector);

      // @ts-expect-error 2329/matchers
      expect(mockErrorCollector).toReportValidityError({
         id: ValidityError.ID.CONTENT_IN_EMPTY_ELEMENT,
         params: ['parentName'],
         position: elementStart.name,
         lastPosition: undefined,
      });
   });

   it('reports an error when the context is ANY, and the name is not a declared element', () => {
      state = new ValidateState({
         elementContext: {
            ...state.elementContext,
            activeContext: {
               declDetails: {
                  token: elementDeclaration,
                  type: ElDeclType.ANY,
               },
               parentName: 'parentName',
               stateId: 0,
            },
         },
      });
      elementStart = new ElementStartPToken({
         open: toSToken('</'),
         name: toSToken('other'),
      });

      elementStartValidate(elementStart, state, mockErrorCollector);

      // @ts-expect-error 2329/matchers
      expect(mockErrorCollector).toReportValidityError({
         id: ValidityError.ID.UNDECLARED_ELEMENT,
         params: ['other'],
         position: elementStart.name,
         lastPosition: undefined,
      });
   });

   it('reports an error when the context is MIXED, and the name is not a known name', () => {
      state = new ValidateState({
         elementContext: {
            ...state.elementContext,
            activeContext: {
               declDetails: {
                  token: elementDeclaration,
                  type: ElDeclType.MIXED,
                  names: ['foo'],
                  duplicateNames: [],
               },
               parentName: 'parentName',
               stateId: 0,
            },
         },
      });

      elementStartValidate(elementStart, state, mockErrorCollector);

      // @ts-expect-error 2329/matchers
      expect(mockErrorCollector).toReportValidityError({
         id: ValidityError.ID.INVALID_ELEMENT_IN_MIXED,
         params: ['parentName', 'elementName'],
         position: elementStart.name,
         lastPosition: undefined,
      });
   });

   it('reports an error when the context is ELEMENT, and there is no transition from this state', () => {
      state = new ValidateState({
         elementContext: {
            ...state.elementContext,
            activeContext: {
               declDetails: {
                  token: elementDeclaration,
                  type: ElDeclType.ELEMENT,
                  graph,
               },
               parentName: 'parentName',
               stateId: 4,
            },
         },
      });

      elementStartValidate(elementStart, state, mockErrorCollector);

      // @ts-expect-error 2329/matchers
      expect(mockErrorCollector).toReportValidityError({
         id: ValidityError.ID.INVALID_ELEMENT_IN_CONTENT,
         params: ['parentName', 'elementName'],
         position: elementStart.name,
         lastPosition: undefined,
      });
   });

   it('reports no error when there is no active context', () => {
      state = {
         ...state,
         elementContext: {
            ...state.elementContext,
            activeContext: undefined,
         },
      };

      elementStartValidate(elementStart, state, mockErrorCollector);

      expect(mockErrorCollector.errors).toEqual([]);
   });

   it('reports no error when we are past the end of the document', () => {
      state = {
         ...state,
         elementContext: {
            ...state.elementContext,
            pastEnd: true,
         },
      };

      elementStartValidate(elementStart, state, mockErrorCollector);

      expect(mockErrorCollector.errors).toEqual([]);
   });

   describe('attributes', () => {
      it('reports an error when an attribute has not been declared (§3.1.0)', () => {
         state = new ValidateState({
            attributeDefs: {
               elementName: {},
            },
         });
         elementStart = new ElementStartPToken({
            open: toSToken('</'),
            name: toSToken('elementName'),
            attributes: [
               {
                  name: toSToken('att1'),
                  openQuote: toSToken('"'),
                  value: [],
                  defaulted: true,
               },
            ],
         });

         elementStartValidate(elementStart, state, mockErrorCollector);

         // @ts-expect-error 2329/matchers
         expect(mockErrorCollector).toReportValidityError({
            id: ValidityError.ID.ELEMENTSTART_UNDECLARED_ATTRIBUTE,
            params: ['elementName', 'att1'],
            position: toSToken('att1'),
            lastPosition: undefined,
         });
      });

      describe('ID (§3.3.1)', () => {
         it('reports an error when an ID attribute is not a name (§3.3.1)', () => {
            state = new ValidateState({
               attributeDefs: {
                  elementName: {
                     att1: {
                        def: {
                           name: toSToken('att1'),
                           type: toSToken('ID'),
                           value: [],
                        },
                        isExternal: false,
                     },
                  },
               },
            });
            elementStart = new ElementStartPToken({
               attributes: [
                  {
                     defaulted: true,
                     name: toSToken('att1'),
                     value: [new TextPToken(toSToken('$BOGUS'))],
                  },
               ],
               name: toSToken('elementName'),
               open: toSToken('</'),
            });

            elementStartValidate(elementStart, state, mockErrorCollector);

            // @ts-expect-error 2329/matchers
            expect(mockErrorCollector).toReportValidityError({
               id: ValidityError.ID.ELEMENTSTART_ID_NAME_INVALID,
               lastPosition: undefined,
               params: ['elementName', 'att1', '$BOGUS'],
               position: toSToken('att1'),
            });
         });

         it('reports no error when an ID attribute is a name (§3.3.1)', () => {
            state = new ValidateState({
               attributeDefs: {
                  elementName: {
                     att1: {
                        def: {
                           name: toSToken('att1'),
                           type: toSToken('ID'),
                           value: [],
                        },
                        isExternal: false,
                     },
                  },
               },
               elementDeclarations: {
                  elementName: {
                     token: makeElementDeclaration(),
                     type: ElDeclType.ANY,
                  },
               },
            });
            elementStart = new ElementStartPToken({
               attributes: [
                  {
                     defaulted: true,
                     name: toSToken('att1'),
                     value: [new TextPToken(toSToken('good'))],
                  },
               ],
               name: toSToken('elementName'),
               open: toSToken('</'),
            });

            elementStartValidate(elementStart, state, mockErrorCollector);

            expect(mockErrorCollector.errors).toEqual([]);
         });

         it('reports an error when an ID value has been used before (§3.3.1)', () => {
            state = new ValidateState({
               attributeDefs: {
                  elementName: {
                     att1: {
                        def: {
                           name: toSToken('att1'),
                           type: toSToken('ID'),
                           value: [],
                        },
                        isExternal: false,
                     },
                  },
               },
               ids: {
                  reused: {
                     attName: 'otherAttribute',
                     elName: 'otherElement',
                  },
               },
            });
            elementStart = new ElementStartPToken({
               attributes: [
                  {
                     defaulted: true,
                     name: toSToken('att1'),
                     value: [new TextPToken(toSToken('reused'))],
                  },
               ],
               name: toSToken('elementName'),
               open: toSToken('</'),
            });

            elementStartValidate(elementStart, state, mockErrorCollector);

            // @ts-expect-error 2329/matchers
            expect(mockErrorCollector).toReportValidityError({
               id: ValidityError.ID.ELEMENTSTART_ID_DUPLICATE,
               lastPosition: undefined,
               params: ['elementName', 'att1', 'otherElement', 'otherAttribute', 'reused'],
               position: toSToken('att1'),
            });
         });

         it('reports an error when an ID value has been used twice in the same element (§3.3.1)', () => {
            state = new ValidateState({
               attributeDefs: {
                  elementName: {
                     att1: {
                        def: {
                           name: toSToken('att1'),
                           type: toSToken('ID'),
                           value: [],
                        },
                        isExternal: false,
                     },
                     att2: {
                        def: {
                           name: toSToken('att2'),
                           type: toSToken('ID'),
                           value: [],
                        },
                        isExternal: false,
                     },
                  },
               },
               ids: {},
            });
            elementStart = new ElementStartPToken({
               attributes: [
                  {
                     defaulted: true,
                     name: toSToken('att1'),
                     value: [new TextPToken(toSToken('reused'))],
                  },
                  {
                     defaulted: true,
                     name: toSToken('att2'),
                     value: [new TextPToken(toSToken('reused'))],
                  },
               ],
               name: toSToken('elementName'),
               open: toSToken('</'),
            });

            elementStartValidate(elementStart, state, mockErrorCollector);

            // @ts-expect-error 2329/matchers
            expect(mockErrorCollector).toReportValidityError({
               id: ValidityError.ID.ELEMENTSTART_ID_DUPLICATE,
               lastPosition: undefined,
               params: ['elementName', 'att2', 'elementName', 'att1', 'reused'],
               position: toSToken('att2'),
            });
         });
      });

      describe('IDREF (§3.3.1)', () => {
         it('reports an error when an IDREF attribute is not a name (§3.3.1)', () => {
            state = new ValidateState({
               attributeDefs: {
                  elementName: {
                     att1: {
                        def: {
                           name: toSToken('att1'),
                           type: toSToken('IDREF'),
                           value: [],
                        },
                        isExternal: false,
                     },
                  },
               },
            });
            elementStart = new ElementStartPToken({
               attributes: [
                  {
                     defaulted: true,
                     name: toSToken('att1'),
                     value: [new TextPToken(toSToken('$BOGUS'))],
                  },
               ],
               name: toSToken('elementName'),
               open: toSToken('</'),
            });

            elementStartValidate(elementStart, state, mockErrorCollector);

            // @ts-expect-error 2329/matchers
            expect(mockErrorCollector).toReportValidityError({
               id: ValidityError.ID.ELEMENTSTART_IDREF_NOT_NAME,
               lastPosition: undefined,
               params: ['elementName', 'att1', '$BOGUS'],
               position: toSToken('att1'),
            });
         });

         it('reports an error when an IDREFS attribute contains non-names (§3.3.1)', () => {
            state = new ValidateState({
               attributeDefs: {
                  elementName: {
                     att1: {
                        def: {
                           name: toSToken('att1'),
                           type: toSToken('IDREFS'),
                           value: [],
                        },
                        isExternal: false,
                     },
                  },
               },
            });
            elementStart = new ElementStartPToken({
               attributes: [
                  {
                     defaulted: true,
                     name: toSToken('att1'),
                     value: [new TextPToken(toSToken('good $BOGUS happy $BAD'))],
                  },
               ],
               name: toSToken('elementName'),
               open: toSToken('</'),
            });

            elementStartValidate(elementStart, state, mockErrorCollector);

            // @ts-expect-error 2329/matchers
            expect(mockErrorCollector).toReportValidityError({
               id: ValidityError.ID.ELEMENTSTART_IDREFS_NOT_NAME,
               lastPosition: undefined,
               params: ['elementName', 'att1', '$BOGUS, $BAD'],
               position: toSToken('att1'),
            });
         });

         it('reports no error when an IDREF attribute is a name (§3.3.1)', () => {
            state = new ValidateState({
               attributeDefs: {
                  elementName: {
                     att1: {
                        def: {
                           name: toSToken('att1'),
                           type: toSToken('IDREF'),
                           value: [],
                        },
                        isExternal: false,
                     },
                  },
               },
               elementDeclarations: {
                  elementName: {
                     token: makeElementDeclaration(),
                     type: ElDeclType.ANY,
                  },
               },
            });
            elementStart = new ElementStartPToken({
               attributes: [
                  {
                     defaulted: true,
                     name: toSToken('att1'),
                     value: [new TextPToken(toSToken('good'))],
                  },
               ],
               name: toSToken('elementName'),
               open: toSToken('</'),
            });

            elementStartValidate(elementStart, state, mockErrorCollector);

            expect(mockErrorCollector.errors).toEqual([]);
         });
      });

      it('reports an error when a NMTOKEN value is empty (§3.3.1)', () => {
         state = new ValidateState({
            attributeDefs: {
               elementName: {
                  att1: {
                     def: {
                        name: toSToken('att1'),
                        type: toSToken('NMTOKEN'),
                        value: [],
                     },
                     isExternal: false,
                  },
               },
            },
         });
         elementStart = new ElementStartPToken({
            attributes: [
               {
                  defaulted: true,
                  name: toSToken('att1'),
                  value: [],
               },
            ],
            name: toSToken('elementName'),
            open: toSToken('</'),
         });

         elementStartValidate(elementStart, state, mockErrorCollector);

         // @ts-expect-error 2329/matchers
         expect(mockErrorCollector).toReportValidityError({
            id: ValidityError.ID.ELEMENTSTART_NMTOKEN_NOT_NMTOKEN,
            lastPosition: undefined,
            params: ['', 'elementName', 'att1'],
            position: toSToken('att1'),
         });
      });

      it('reports an error when a NMTOKENS value is empty (§3.3.1)', () => {
         state = new ValidateState({
            attributeDefs: {
               elementName: {
                  att1: {
                     def: {
                        name: toSToken('att1'),
                        type: toSToken('NMTOKENS'),
                        value: [],
                     },
                     isExternal: false,
                  },
               },
            },
         });
         elementStart = new ElementStartPToken({
            attributes: [
               {
                  defaulted: true,
                  name: toSToken('att1'),
                  openQuote: toSToken('"'),
                  value: [],
               },
            ],
            name: toSToken('elementName'),
            open: toSToken('</'),
         });

         elementStartValidate(elementStart, state, mockErrorCollector);

         // @ts-expect-error 2329/matchers
         expect(mockErrorCollector).toReportValidityError({
            id: VID.ELEMENTSTART_NMTOKENS_NOT_NMTOKEN,
            lastPosition: undefined,
            params: ['', 'elementName', 'att1'],
            position: toSToken('att1'),
         });
      });

      it('reports an error when a NMTOKENS value is not a name token (§3.3.1)', () => {
         state = new ValidateState({
            attributeDefs: {
               elementName: {
                  att1: {
                     def: {
                        name: toSToken('att1'),
                        type: toSToken('NMTOKENS'),
                        value: [],
                     },
                     isExternal: false,
                  },
               },
            },
         });
         elementStart = new ElementStartPToken({
            attributes: [
               {
                  defaulted: true,
                  name: toSToken('att1'),
                  openQuote: toSToken('"'),
                  value: [
                     new TextPToken(toSToken('fooo$$bar')),
                     new TextPToken(toSToken(' ')),
                     new TextPToken(toSToken('good')),
                     new TextPToken(toSToken(' foo\nbar')),
                  ],
               },
            ],
            name: toSToken('elementName'),
            open: toSToken('</'),
         });

         elementStartValidate(elementStart, state, mockErrorCollector);

         // @ts-expect-error 2329/matchers
         expect(mockErrorCollector).toReportValidityError({
            id: VID.ELEMENTSTART_NMTOKENS_NOT_NMTOKEN,
            lastPosition: undefined,
            params: ['fooo$$bar, foo\nbar', 'elementName', 'att1'],
            position: toSToken('att1'),
         });
      });

      it('reports an error when a NMTOKENS value is not a name token, but trims leading and trailing whitespace when calculating that (§3.3.1)', () => {
         state = new ValidateState({
            attributeDefs: {
               elementName: {
                  att1: {
                     def: {
                        name: toSToken('att1'),
                        type: toSToken('NMTOKENS'),
                        value: [],
                     },
                     isExternal: false,
                  },
               },
            },
         });
         elementStart = new ElementStartPToken({
            attributes: [
               {
                  defaulted: true,
                  name: toSToken('att1'),
                  openQuote: toSToken('"'),
                  value: [new TextPToken(toSToken('  fooo$$bar good '))],
               },
            ],
            name: toSToken('elementName'),
            open: toSToken('</'),
         });

         elementStartValidate(elementStart, state, mockErrorCollector);

         // @ts-expect-error 2329/matchers
         expect(mockErrorCollector).toReportValidityError({
            id: ValidityError.ID.ELEMENTSTART_NMTOKENS_NOT_NMTOKEN,
            lastPosition: undefined,
            params: ['fooo$$bar', 'elementName', 'att1'],
            position: toSToken('att1'),
         });
      });

      const entiDat: Array<[string, boolean, string, string, string, string, string, string]> = [
         [
            'ENTITY',
            false,
            '$badEntName',
            '$badEntName',
            'entName',
            'entName',
            'parsedEnt',
            'parsedEnt',
         ],
         [
            'ENTITIES',
            true,
            'foo $BAD bar',
            '$BAD',
            'paramA another',
            'paramA, another',
            'one param two',
            'param',
         ],
      ];

      entiDat.forEach((item) => {
         const [
            type,
            isPlural,
            badEntName,
            badEntReport,
            entName,
            entNameReport,
            parsedEntName,
            parsedEntNameReported,
         ] = item;

         describe(`${type} attribute type`, () => {
            beforeEach(() => {
               state = new ValidateState({
                  attributeDefs: {
                     elementName: {
                        att1: {
                           def: {
                              name: toSToken('att1'),
                              type: toSToken(type),
                              value: [],
                           },
                           isExternal: false,
                        },
                     },
                  },
                  generalEntities: {
                     [parsedEntNameReported]: {
                        isInternal: false,
                        token: new GeneralEntityDeclarationPToken({
                           open: toSToken('yipes'),
                        }),
                     },
                  },
               });
            });

            it(`reports an error when an ${type} value is not a name (§3.3.1)`, () => {
               elementStart = new ElementStartPToken({
                  attributes: [
                     {
                        name: toSToken('att1'),
                        value: [new TextPToken(toSToken(badEntName))],
                     },
                  ],
                  name: toSToken('elementName'),
                  open: toSToken('</'),
               });

               elementStartValidate(elementStart, state, mockErrorCollector);

               // @ts-expect-error 2329/matchers
               expect(mockErrorCollector).toReportValidityError({
                  id: isPlural
                     ? VID.ELEMENTSTART_ENTITIES_NOT_NAME
                     : VID.ELEMENTSTART_ENTITY_NOT_NAME,
                  lastPosition: undefined,
                  params: [badEntReport, 'elementName', 'att1'],
                  position: toSToken('att1'),
               });
            });

            it(`reports an error when an ${type} value does not reference a known entity (§3.3.1)`, () => {
               elementStart = new ElementStartPToken({
                  attributes: [
                     {
                        name: toSToken('att1'),
                        value: [new TextPToken(toSToken(entName))],
                     },
                  ],
                  name: toSToken('elementName'),
                  open: toSToken('</'),
               });

               elementStartValidate(elementStart, state, mockErrorCollector);

               // @ts-expect-error 2329/matchers
               expect(mockErrorCollector).toReportValidityError({
                  id: isPlural
                     ? VID.ELEMENTSTART_ENTITIES_NO_ENTITY
                     : VID.ELEMENTSTART_ENTITY_NO_ENTITY,
                  lastPosition: undefined,
                  params: [entNameReport, 'elementName', 'att1'],
                  position: toSToken('att1'),
               });
            });

            it(`reports an error when an ${type} value does not reference an unparsed entity (§3.3.1)`, () => {
               elementStart = new ElementStartPToken({
                  attributes: [
                     {
                        name: toSToken('att1'),
                        value: [new TextPToken(toSToken(parsedEntName))],
                     },
                  ],
                  name: toSToken('elementName'),
                  open: toSToken('</'),
               });

               elementStartValidate(elementStart, state, mockErrorCollector);

               // @ts-expect-error 2329/matchers
               expect(mockErrorCollector).toReportValidityError({
                  id: isPlural
                     ? VID.ELEMENTSTART_ENTITIES_PARSED_ENTITY
                     : VID.ELEMENTSTART_ENTITY_PARSED_ENTITY,
                  lastPosition: undefined,
                  params: [parsedEntNameReported, 'elementName', 'att1'],
                  position: toSToken('att1'),
               });
            });

            it(`reports no error when an ${type} value references an unparsed entity (§3.3.1)`, () => {
               state = new ValidateState({
                  ...state,
                  elementDeclarations: {
                     elementName: {
                        token: makeElementDeclaration(),
                        type: ElDeclType.ANY,
                     },
                  },
                  generalEntities: {
                     [parsedEntNameReported]: {
                        isInternal: false,
                        token: new GeneralEntityDeclarationPToken({
                           nDataName: toSToken('someNotation'),
                           open: toSToken('yipes'),
                        }),
                     },
                  },
               });
               elementStart = new ElementStartPToken({
                  attributes: [
                     {
                        name: toSToken('att1'),
                        value: [new TextPToken(toSToken(parsedEntNameReported))],
                     },
                  ],
                  name: toSToken('elementName'),
                  open: toSToken('</'),
               });

               elementStartValidate(elementStart, state, mockErrorCollector);

               expect(mockErrorCollector.errors).toEqual([]);
            });
         });
      });

      it('reports an error when a required attribute is not specified (§3.3.2)', () => {
         state = new ValidateState({
            ...state,
            attributeDefs: {
               elementName: {
                  req1: {
                     def: {
                        defaultType: toSToken('#REQUIRED'),
                        name: toSToken('req1'),
                        value: [],
                     },
                     isExternal: false,
                  },
               },
            },
            elementDeclarations: {
               elementName: {
                  token: makeElementDeclaration(),
                  type: ElDeclType.ANY,
               },
            },
            generalEntities: {},
         });

         elementStart = new ElementStartPToken({
            attributes: [
               {
                  name: toSToken('att1'),
                  value: [new TextPToken(toSToken('foo'))],
               },
            ],
            close: toSToken('>'),
            name: toSToken('elementName'),
            open: toSToken('</'),
         });

         elementStartValidate(elementStart, state, mockErrorCollector);

         // @ts-expect-error 2329/matchers
         expect(mockErrorCollector).toReportValidityError({
            id: VID.ELEMENTSTART_NO_REQUIRED,
            lastPosition: undefined,
            params: ['elementName', 'req1'],
            position: elementStart.close,
         });
      });

      it('reports an error when a required attribute is not specified, even when #REQUIRED has the wrong case (§3.3.2)', () => {
         state = new ValidateState({
            ...state,
            attributeDefs: {
               elementName: {
                  req1: {
                     def: {
                        defaultType: toSToken('#reQuiRED'),
                        name: toSToken('req1'),
                        value: [],
                     },
                     isExternal: false,
                  },
               },
            },
            elementDeclarations: {
               elementName: {
                  token: makeElementDeclaration(),
                  type: ElDeclType.ANY,
               },
            },
            generalEntities: {},
         });

         elementStart = new ElementStartPToken({
            attributes: [
               {
                  name: toSToken('att1'),
                  value: [new TextPToken(toSToken('foo'))],
               },
            ],
            close: toSToken('>'),
            name: toSToken('elementName'),
            open: toSToken('</'),
         });

         elementStartValidate(elementStart, state, mockErrorCollector);

         // @ts-expect-error 2329/matchers
         expect(mockErrorCollector).toReportValidityError({
            id: VID.ELEMENTSTART_NO_REQUIRED,
            lastPosition: undefined,
            params: ['elementName', 'req1'],
            position: elementStart.close,
         });
      });

      it('reports an error when an attribute is defaulted from an external ATTLIST declaration, and the document is standalone', () => {
         state = new ValidateState({
            attributeDefs: {
               elementName: {
                  att1: {
                     def: {
                        name: toSToken('att1'),
                        value: [],
                     },
                     isExternal: true,
                  },
               },
            },
            isStandalone: true,
         });
         elementStart = new ElementStartPToken({
            attributes: [
               {
                  defaulted: true,
                  name: toSToken('att1'),
                  value: [],
               },
            ],
            name: toSToken('elementName'),
            open: toSToken('</'),
         });

         elementStartValidate(elementStart, state, mockErrorCollector);

         // @ts-expect-error 2329/matchers
         expect(mockErrorCollector).toReportValidityError({
            id: ValidityError.ID.ELEMENTSTART_DEFAULT_EXTERNAL_DECLARED,
            lastPosition: undefined,
            params: ['elementName', 'att1'],
            position: toSToken('att1'),
         });
      });

      it('reports no error when an attribute is defaulted from an internal ATTLIST declaration, and the document is standalone', () => {
         state = new ValidateState({
            attributeDefs: {
               elementName: {
                  att1: {
                     def: {
                        name: toSToken('att1'),
                        value: [],
                     },
                     isExternal: false,
                  },
               },
            },
            elementDeclarations: state.elementDeclarations,
            isStandalone: true,
         });
         elementStart = new ElementStartPToken({
            attributes: [
               {
                  defaulted: true,
                  name: toSToken('att1'),
                  value: [],
               },
            ],
            name: toSToken('elementName'),
            open: toSToken('</'),
         });

         elementStartValidate(elementStart, state, mockErrorCollector);

         expect(mockErrorCollector.errors).toEqual([]);
      });

      it('reports no error when an attribute is defaulted from an external ATTLIST declaration, and the document is not standalone', () => {
         state = new ValidateState({
            attributeDefs: {
               elementName: {
                  att1: {
                     def: {
                        name: toSToken('att1'),
                        value: [],
                     },
                     isExternal: true,
                  },
               },
            },
            elementDeclarations: state.elementDeclarations,
            isStandalone: false,
         });
         elementStart = new ElementStartPToken({
            attributes: [
               {
                  defaulted: true,
                  name: toSToken('att1'),
                  value: [],
               },
            ],
            name: toSToken('elementName'),
            open: toSToken('</'),
         });

         elementStartValidate(elementStart, state, mockErrorCollector);

         expect(mockErrorCollector.errors).toEqual([]);
      });

      describe('Notation Attributes (§3.3.1)', () => {
         it('reports an error when the value of a notation in the element start is not found in the ATTLIST declaration (§3.3.1)', () => {
            state = new ValidateState({
               attributeDefs: {
                  elementName: {
                     att1: {
                        def: {
                           enumeration: {
                              open: toSToken('('),
                              type: NOTATION_PTOKEN,
                              words: [
                                 {
                                    word: toSToken('first'),
                                 },
                                 {
                                    word: toSToken('second'),
                                 },
                              ],
                           },
                           name: toSToken('att1'),
                           type: toSToken('NOTATION'),
                           value: [],
                        },
                        isExternal: true,
                     },
                  },
               },
            });
            elementStart = new ElementStartPToken({
               attributes: [
                  {
                     name: toSToken('att1'),
                     value: [new TextPToken(toSToken('bad'))],
                  },
               ],
               name: toSToken('elementName'),
               open: toSToken('</'),
            });

            elementStartValidate(elementStart, state, mockErrorCollector);

            // @ts-expect-error 2329/matchers
            expect(mockErrorCollector).toReportValidityError({
               id: ValidityError.ID.ELEMENTSTART_NOTATION_NOT_DECLARED,
               lastPosition: undefined,
               params: ['elementName', 'att1', 'first|second', 'bad'],
               position: toSToken('att1'),
            });
         });

         it('reports an error when the ATTLIST has no values in the enumeration (§3.3.1)', () => {
            state = new ValidateState({
               attributeDefs: {
                  elementName: {
                     att1: {
                        def: {
                           enumeration: undefined,
                           name: toSToken('att1'),
                           type: toSToken('NOTATION'),
                           value: [],
                        },
                        isExternal: true,
                     },
                  },
               },
            });
            elementStart = new ElementStartPToken({
               attributes: [
                  {
                     name: toSToken('att1'),
                     value: [new TextPToken(toSToken('bad'))],
                  },
               ],
               name: toSToken('elementName'),
               open: toSToken('</'),
            });

            elementStartValidate(elementStart, state, mockErrorCollector);

            // @ts-expect-error 2329/matchers
            expect(mockErrorCollector).toReportValidityError({
               id: ValidityError.ID.ELEMENTSTART_NOTATION_NOT_DECLARED,
               lastPosition: undefined,
               params: ['elementName', 'att1', '', 'bad'],
               position: toSToken('att1'),
            });
         });

         it('reports no error when the value of a notation in the element start is found in the ATTLIST declaration (§3.3.1)', () => {
            state = new ValidateState({
               attributeDefs: {
                  elementName: {
                     att1: {
                        def: {
                           enumeration: {
                              open: toSToken('('),
                              type: NOTATION_PTOKEN,
                              words: [
                                 {
                                    word: toSToken('first'),
                                 },
                              ],
                           },
                           name: toSToken('att1'),
                           type: toSToken('NOTATION'),
                           value: [],
                        },
                        isExternal: true,
                     },
                  },
               },
               elementDeclarations: {
                  elementName: {
                     token: makeElementDeclaration(),
                     type: ElDeclType.ANY,
                  },
               },
            });
            elementStart = new ElementStartPToken({
               attributes: [
                  {
                     name: toSToken('att1'),
                     value: [new TextPToken(toSToken('first'))],
                  },
               ],
               name: toSToken('elementName'),
               open: toSToken('</'),
            });

            elementStartValidate(elementStart, state, mockErrorCollector);

            expect(mockErrorCollector.errors).toEqual([]);
         });
      });

      describe('Enumeration (§3.3.1)', () => {
         it('reports an error when the value of an enumeration in the element start is not found in the ATTLIST declaration (§3.3.1)', () => {
            state = new ValidateState({
               attributeDefs: {
                  elementName: {
                     att1: {
                        def: {
                           enumeration: {
                              open: toSToken('('),
                              type: NOTATION_PTOKEN,
                              words: [
                                 {
                                    word: toSToken('first'),
                                 },
                                 {
                                    word: toSToken('second'),
                                 },
                              ],
                           },
                           name: toSToken('att1'),
                           value: [],
                        },
                        isExternal: true,
                     },
                  },
               },
            });
            elementStart = new ElementStartPToken({
               attributes: [
                  {
                     name: toSToken('att1'),
                     value: [new TextPToken(toSToken('bad'))],
                  },
               ],
               name: toSToken('elementName'),
               open: toSToken('</'),
            });

            elementStartValidate(elementStart, state, mockErrorCollector);

            // @ts-expect-error 2329/matchers
            expect(mockErrorCollector).toReportValidityError({
               id: ValidityError.ID.ELEMENTSTART_ENUMERATION_NOT_DECLARED,
               lastPosition: undefined,
               params: ['elementName', 'att1', 'first|second', 'bad'],
               position: toSToken('att1'),
            });
         });

         it('reports no error when the ATTLIST has no enumeration (§3.3.1)', () => {
            state = new ValidateState({
               attributeDefs: {
                  elementName: {
                     att1: {
                        def: {
                           enumeration: undefined,
                           name: toSToken('att1'),
                           // We don't have neough info to know what this is
                           value: [],
                        },
                        isExternal: true,
                     },
                  },
               },
               elementDeclarations: {
                  elementName: {
                     token: makeElementDeclaration(),
                     type: ElDeclType.ANY,
                  },
               },
            });
            elementStart = new ElementStartPToken({
               attributes: [
                  {
                     name: toSToken('att1'),
                     value: [new TextPToken(toSToken('bad'))],
                  },
               ],
               name: toSToken('elementName'),
               open: toSToken('</'),
            });

            elementStartValidate(elementStart, state, mockErrorCollector);

            expect(mockErrorCollector.errors).toEqual([]);
         });

         it('reports no error when the value of a enumeration in the element start is found in the ATTLIST declaration (§3.3.1)', () => {
            state = new ValidateState({
               attributeDefs: {
                  elementName: {
                     att1: {
                        def: {
                           enumeration: {
                              open: toSToken('('),
                              type: NOTATION_PTOKEN,
                              words: [
                                 {
                                    word: toSToken('first'),
                                 },
                              ],
                           },
                           name: toSToken('att1'),
                           value: [],
                        },
                        isExternal: true,
                     },
                  },
               },
               elementDeclarations: {
                  elementName: {
                     token: makeElementDeclaration(),
                     type: ElDeclType.ANY,
                  },
               },
            });
            elementStart = new ElementStartPToken({
               attributes: [
                  {
                     name: toSToken('att1'),
                     value: [new TextPToken(toSToken('first'))],
                  },
               ],
               name: toSToken('elementName'),
               open: toSToken('</'),
            });

            elementStartValidate(elementStart, state, mockErrorCollector);

            expect(mockErrorCollector.errors).toEqual([]);
         });
      });
   });

   it('reports an error if an attribute changed through normalization, but the declaration was external and the document is standalone (§2.9.0)', () => {
      state = new ValidateState({
         attributeDefs: {
            elementName: {
               att1: {
                  def: {
                     name: toSToken('att1'),
                     value: [],
                  },
                  isExternal: true,
               },
            },
         },
         elementDeclarations: state.elementDeclarations,
         isStandalone: true,
      });
      elementStart = new ElementStartPToken({
         attributes: [
            {
               dtdChangedNormalization: true,
               name: toSToken('att1'),
               normalized: true,
               value: [],
            },
         ],
         name: toSToken('elementName'),
         open: toSToken('</'),
      });

      elementStartValidate(elementStart, state, mockErrorCollector);

      // @ts-expect-error 2329/matchers
      expect(mockErrorCollector).toReportValidityError({
         id: ValidityError.ID.ATTLISTDECL_TYPE_EXTERNAL_DECLARED,
         lastPosition: undefined,
         params: ['elementName', 'att1'],
         position: toSToken('att1'),
      });
   });

   it('reports no error if an attribute changed through normalization, but the declaration was not external and the document is standalone (§2.9.0)', () => {
      state = new ValidateState({
         attributeDefs: {
            elementName: {
               att1: {
                  def: {
                     name: toSToken('att1'),
                     value: [],
                  },
                  isExternal: false,
               },
            },
         },
         elementDeclarations: state.elementDeclarations,
         isStandalone: true,
      });
      elementStart = new ElementStartPToken({
         attributes: [
            {
               dtdChangedNormalization: true,
               name: toSToken('att1'),
               normalized: true,
               value: [],
            },
         ],
         name: toSToken('elementName'),
         open: toSToken('</'),
      });

      elementStartValidate(elementStart, state, mockErrorCollector);

      expect(mockErrorCollector.errors).toEqual([]);
   });

   it('reports no error if an attribute was not changed through normalization, but the declaration was external and the document is standalone (§2.9.0)', () => {
      state = new ValidateState({
         attributeDefs: {
            elementName: {
               att1: {
                  def: {
                     name: toSToken('att1'),
                     value: [],
                  },
                  isExternal: true,
               },
            },
         },
         elementDeclarations: state.elementDeclarations,
         isStandalone: true,
      });
      elementStart = new ElementStartPToken({
         attributes: [
            {
               name: toSToken('att1'),
               value: [],
            },
         ],
         name: toSToken('elementName'),
         open: toSToken('</'),
      });

      elementStartValidate(elementStart, state, mockErrorCollector);

      expect(mockErrorCollector.errors).toEqual([]);
   });
});
