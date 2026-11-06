/* Copyright ® 2021 by 柏大衛. All rights reserved. */

import { describe, expect, it } from '@jest/globals';
import { ConformanceVersion, toSToken } from 'basic';
import {
   makeCdata,
   makeComment,
   makeDocTypeStart,
   makeElementDeclaration,
   makeGeneralEntityDeclaration,
   makeNotationDeclaration,
   makeParameterEntityDeclaration,
   makeParameterEntityStart,
} from 'token-test';

import { ElDeclType, ValidityState } from '../validityState';

describe('ValidityState (unit)', () => {
   it('constructs an empty default state when given no parameters', () => {
      expect(new ValidityState()).toMatchInlineSnapshot(`
         ValidityState {
           "attributes": {},
           "confVer": ConformanceVersion {
             "edition": 5,
             "type": "CONFORMANCE_VERSION",
             "version": 1,
           },
           "docType": undefined,
           "dtdContext": {
             "enclosingStack": [],
             "inExternalMarkupContext": false,
             "inExternalSubset": false,
             "lastPToken": undefined,
           },
           "elementContext": {
             "contextStack": [],
             "pastEnd": false,
           },
           "elements": {},
           "generalEntities": {},
           "hasExternalSubset": false,
           "hasPeRefs": false,
           "idRefs": {},
           "ids": {},
           "isStandalone": false,
           "notations": {},
           "parameterEntities": {},
         }
      `);
   });

   it('clones the provided state when it is passed as a parameter', () => {
      const other = new ValidityState({
         attributes: {
            foo: {
               att1: {
                  def: {
                     name: toSToken('whoo'),
                     value: [],
                  },
                  isExternalMarkupDeclaration: false,
               },
            },
         },
         confVer: new ConformanceVersion(1, 4),
         docType: 'whee',
         dtdContext: {
            enclosingStack: [makeDocTypeStart()],
            inExternalMarkupContext: true,
            inExternalSubset: true,
            lastPToken: makeComment(),
         },
         elementContext: {
            contextStack: [
               {
                  details: {
                     isExternalMarkupDeclaration: false,
                     token: makeElementDeclaration(),
                     type: ElDeclType.ANY,
                  },
                  lastToken: makeCdata(),
                  parentName: 'foo',
                  stateId: 3,
               },
            ],
            pastEnd: false,
         },
         elements: {
            foo: {
               isExternalMarkupDeclaration: false,
               token: makeElementDeclaration(),
               type: ElDeclType.ANY,
            },
         },
         generalEntities: {
            entity1: {
               isExternalMarkupDeclaration: true,
               isInternalValue: false,
               token: makeGeneralEntityDeclaration(),
            },
         },
         hasExternalSubset: false,
         hasPeRefs: false,
         idRefs: {
            one: {
               attName: 'att1',
               elName: 'one',
               sToken: toSToken('ass'),
            },
         },
         ids: {
            one: {
               attName: 'att1',
               elName: 'one',
            },
         },
         isStandalone: true,
         notations: {
            foo: true,
         },
         parameterEntities: {
            entity1: {
               isExternalMarkupDeclaration: true,
               isInternalValue: false,
               token: makeParameterEntityDeclaration(),
            },
         },
      });

      expect(new ValidityState(other)).toEqual(other);
      expect(new ValidityState(other)).not.toBe(other);
   });

   it('completely overwrites the base when passed a second state', () => {
      const base = new ValidityState({
         attributes: {
            foo: {
               att1: {
                  def: {
                     name: toSToken('whoo'),
                     value: [],
                  },
                  isExternalMarkupDeclaration: false,
               },
            },
         },
         confVer: new ConformanceVersion(1, 4),
         docType: 'whee',
         dtdContext: {
            enclosingStack: [makeDocTypeStart()],
            inExternalMarkupContext: true,
            inExternalSubset: true,
            lastPToken: makeComment(),
         },
         elementContext: {
            contextStack: [
               {
                  details: {
                     isExternalMarkupDeclaration: false,
                     token: makeElementDeclaration(),
                     type: ElDeclType.ANY,
                  },
                  lastToken: makeCdata(),
                  parentName: 'foo',
                  stateId: 3,
               },
            ],
            pastEnd: false,
         },
         elements: {
            foo: {
               isExternalMarkupDeclaration: false,
               token: makeElementDeclaration(),
               type: ElDeclType.ANY,
            },
         },
         generalEntities: {
            entity1: {
               isExternalMarkupDeclaration: true,
               isInternalValue: false,
               token: makeGeneralEntityDeclaration(),
            },
         },
         hasExternalSubset: false,
         hasPeRefs: false,
         idRefs: {
            one: {
               attName: 'att1',
               elName: 'one',
               sToken: toSToken('ass'),
            },
         },
         ids: {
            one: {
               attName: 'att1',
               elName: 'one',
            },
         },
         isStandalone: true,
         notations: {
            foo: true,
         },
         parameterEntities: {
            entity1: {
               isExternalMarkupDeclaration: true,
               isInternalValue: false,
               token: makeParameterEntityDeclaration(),
            },
         },
      });

      const addition: ValidityState = {
         attributes: {
            foo: {
               att1: {
                  def: {
                     name: toSToken('nope'),
                     value: [],
                  },
                  isExternalMarkupDeclaration: true,
               },
            },
            zup: {
               att1: {
                  def: {
                     name: toSToken('whoo'),
                     value: [],
                  },
                  isExternalMarkupDeclaration: false,
               },
            },
         },
         confVer: new ConformanceVersion(1, 2),
         docType: 'asdf',
         dtdContext: {
            enclosingStack: [makeParameterEntityStart()],
            inExternalMarkupContext: false,
            inExternalSubset: true,
            lastPToken: makeNotationDeclaration(),
         },
         elementContext: {
            contextStack: [
               {
                  details: {
                     isExternalMarkupDeclaration: false,
                     token: makeElementDeclaration(),
                     type: ElDeclType.EMPTY,
                  },
                  lastToken: makeCdata(),
                  parentName: 'junk',
                  stateId: 1,
               },
            ],
            pastEnd: true,
         },
         elements: {
            foo: {
               isExternalMarkupDeclaration: true,
               token: makeElementDeclaration(),
               type: ElDeclType.ANY,
            },
            zup: {
               isExternalMarkupDeclaration: false,
               token: makeElementDeclaration(),
               type: ElDeclType.EMPTY,
            },
         },
         generalEntities: {
            entity1: {
               isExternalMarkupDeclaration: false,
               isInternalValue: true,
               token: makeGeneralEntityDeclaration(),
            },
            entity2: {
               isExternalMarkupDeclaration: true,
               isInternalValue: false,
               token: makeGeneralEntityDeclaration(),
            },
         },
         hasExternalSubset: true,
         hasPeRefs: true,
         idRefs: {
            one: {
               attName: 'att2',
               elName: 'true',
               sToken: toSToken('true'),
            },
            two: {
               attName: 'att2',
               elName: 'true',
               sToken: toSToken('true'),
            },
         },
         ids: {
            one: {
               attName: 'att2',
               elName: 'another',
            },
            two: {
               attName: 'att3',
               elName: 'another',
            },
         },
         isStandalone: false,
         notations: {
            foo: true,
            zup: true,
         },
         parameterEntities: {
            entity1: {
               isExternalMarkupDeclaration: false,
               isInternalValue: false,
               token: makeParameterEntityDeclaration(),
            },
            entity2: {
               isExternalMarkupDeclaration: false,
               isInternalValue: false,
               token: makeParameterEntityDeclaration(),
            },
         },
      };

      expect(new ValidityState(base, addition)).toEqual(addition);
   });

   it('adds items to the base', () => {
      const base = new ValidityState({
         attributes: {
            foo: {
               att1: {
                  def: {
                     name: toSToken('whoo'),
                     value: [],
                  },
                  isExternalMarkupDeclaration: false,
               },
            },
         },
         confVer: new ConformanceVersion(1, 4),
         docType: 'whee',
         dtdContext: {
            enclosingStack: [makeDocTypeStart()],
            inExternalMarkupContext: true,
            inExternalSubset: true,
            lastPToken: makeComment(),
         },
         elementContext: {
            contextStack: [
               {
                  details: {
                     isExternalMarkupDeclaration: false,
                     token: makeElementDeclaration(),
                     type: ElDeclType.ANY,
                  },
                  lastToken: makeCdata(),
                  parentName: 'foo',
                  stateId: 3,
               },
            ],
            pastEnd: false,
         },
         elements: {
            foo: {
               isExternalMarkupDeclaration: false,
               token: makeElementDeclaration(),
               type: ElDeclType.ANY,
            },
         },
         generalEntities: {
            entity1: {
               isExternalMarkupDeclaration: true,
               isInternalValue: false,
               token: makeGeneralEntityDeclaration(),
            },
         },
         hasExternalSubset: false,
         hasPeRefs: false,
         idRefs: {
            one: {
               attName: 'att1',
               elName: 'one',
               sToken: toSToken('ass'),
            },
         },
         ids: {
            one: {
               attName: 'att1',
               elName: 'one',
            },
         },
         isStandalone: true,
         notations: {
            foo: true,
         },
         parameterEntities: {
            entity1: {
               isExternalMarkupDeclaration: true,
               isInternalValue: false,
               token: makeParameterEntityDeclaration(),
            },
         },
      });

      const augment = {
         parameterEntities: {
            entity2: {
               isExternalMarkupDeclaration: false,
               isInternalValue: false,
               token: makeParameterEntityDeclaration(),
            },
         },
      };

      expect(new ValidityState(base, augment)).toEqual({
         attributes: {
            foo: {
               att1: {
                  def: {
                     name: toSToken('whoo'),
                     value: [],
                  },
                  isExternalMarkupDeclaration: false,
               },
            },
         },
         confVer: new ConformanceVersion(1, 4),
         docType: 'whee',
         dtdContext: {
            enclosingStack: [makeDocTypeStart()],
            inExternalMarkupContext: true,
            inExternalSubset: true,
            lastPToken: makeComment(),
         },
         elementContext: {
            contextStack: [
               {
                  details: {
                     isExternalMarkupDeclaration: false,
                     token: makeElementDeclaration(),
                     type: ElDeclType.ANY,
                  },
                  lastToken: makeCdata(),
                  parentName: 'foo',
                  stateId: 3,
               },
            ],
            pastEnd: false,
         },
         elements: {
            foo: {
               isExternalMarkupDeclaration: false,
               token: makeElementDeclaration(),
               type: ElDeclType.ANY,
            },
         },
         generalEntities: {
            entity1: {
               isExternalMarkupDeclaration: true,
               isInternalValue: false,
               token: makeGeneralEntityDeclaration(),
            },
         },
         hasExternalSubset: false,
         hasPeRefs: false,
         idRefs: {
            one: {
               attName: 'att1',
               elName: 'one',
               sToken: toSToken('ass'),
            },
         },
         ids: {
            one: {
               attName: 'att1',
               elName: 'one',
            },
         },
         isStandalone: true,
         notations: {
            foo: true,
         },
         parameterEntities: {
            entity1: {
               isExternalMarkupDeclaration: true,
               isInternalValue: false,
               token: makeParameterEntityDeclaration(),
            },
            entity2: {
               isExternalMarkupDeclaration: false,
               isInternalValue: false,
               token: makeParameterEntityDeclaration(),
            },
         },
      });
   });
});
