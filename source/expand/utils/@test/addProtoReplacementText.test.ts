/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { ENTITY_ID, CONFORMANCE_VERSION } from 'basic';
import {
   GeneralEntityDeclarationPToken,
   ParameterEntityDeclarationPToken,
   TextPToken,
} from 'pToken';
import { toSToken, STokenSource } from 'sToken';
import { WellFormedError } from 'wellformedness';
import {
   ElidedEntityDeclarationPToken,
   EntityValuePToken,
   GeneralEntityReferencePToken,
   ParameterEntityReferencePToken,
   XmlError,
} from 'token';

import { ExpandParams, RetrieveResults } from '../../types';
import { EntityDetails } from '../EntityDetails';
import * as expandEntityValue from '../expandEntityValue';
import { addProtoReplacementText } from '../addProtoReplacementText';
import { EntityContextStack } from '../EntityContextStack';

describe('addProtoReplacementText() (unit)', () => {
   let entityDetails: EntityDetails;
   let peDecl: ParameterEntityDeclarationPToken;
   let params: ExpandParams;
   let textPToken: TextPToken;
   let peRefPToken: ParameterEntityReferencePToken;
   let geRefPToken: GeneralEntityReferencePToken;
   let expandEntitValueSpy: jasmine.Spy;

   beforeEach(() => {
      textPToken = new TextPToken({ text: toSToken('foo') });
      peRefPToken = new ParameterEntityReferencePToken({
         open: toSToken('%'),
         name: toSToken('pe1'),
      });
      geRefPToken = new GeneralEntityReferencePToken({
         open: toSToken('&'),
         name: toSToken('ge1'),
      });
      peDecl = new ParameterEntityDeclarationPToken({
         open: toSToken('<!'),
         name: toSToken('pe1'),
         externalId: {},
      });
      const geDecl = new GeneralEntityDeclarationPToken({
         open: toSToken('<!'),
         name: toSToken('ge1'),
         externalId: {},
      });
      entityDetails = new EntityDetails();
      entityDetails.addEntity(peDecl, undefined, 'pe loc');
      entityDetails.addEntity(geDecl, undefined, 'ge loc');

      params = {
         entityId: {
            type: ENTITY_ID,
            systemId: '',
         },
         confVer: {
            type: CONFORMANCE_VERSION,
            version: 1,
            revision: 5,
         },
         entityDetails,
         conditionalStack: [],
         loadExternalEntities: true,
         utils: {
            parseBody: (): void => {
               return undefined;
            },
            parseEntityValue: (sTokenSource, done): void => {
               done([textPToken]);
            },
            resolveEntityId: () => '',
            retrieveExternalEntity: (): RetrieveResults => {
               return {
                  sTokenSource: new STokenSource({}),
                  getErrors: (): Array<XmlError> => [],
               };
            },
            parseAttributeValue: (): void => {},
         },
      };

      expandEntitValueSpy = spyOn(expandEntityValue, 'expandEntityValue').and.callFake(
         (pToken: any, expandParams: any, chain: any, cb: (foo: any) => void) => {
            cb({ newValue: [textPToken], byproducts: [] });
         },
      );
   });

   it('calls back with no errors when asked to process a parameter entity token', (done) => {
      entityDetails.updateDeclaredValue(peDecl, [], []);

      addProtoReplacementText(peRefPToken, params, new EntityContextStack(), (result) => {
         expect(result).toEqual({ byproducts: [] });
         done();
      });
   });

   it('addds an expanded parameter entity to the cache when called with a known entity', (done) => {
      addProtoReplacementText(peRefPToken, params, new EntityContextStack(), () => {
         const details = entityDetails.getPEDetails('pe1');
         expect((details as any).protoReplacementText).toEqual([textPToken]);
         done();
      });
   });

   it('addds an expanded general entity to the cache when called with a known general entity', (done) => {
      addProtoReplacementText(geRefPToken, params, new EntityContextStack(), () => {
         const details = entityDetails.getGEDetails('ge1');
         expect((details as any).protoReplacementText).toEqual([textPToken]);
         done();
      });
   });

   it('does not do any further processing when the entity has no name', (done) => {
      const retrieveExternalEntitySpy = spyOn(params.utils, 'retrieveExternalEntity');
      peRefPToken = new ParameterEntityReferencePToken({ open: toSToken('%') });

      addProtoReplacementText(peRefPToken, params, new EntityContextStack(), () => {
         expect(retrieveExternalEntitySpy).not.toHaveBeenCalled();
         done();
      });
   });

   it('does not do any further processing when the entity was not declared', (done) => {
      const retrieveExternalEntitySpy = spyOn(params.utils, 'retrieveExternalEntity');
      const peBadRefPToken = new ParameterEntityReferencePToken({
         open: toSToken('%'),
         name: toSToken('bogus'),
      });

      addProtoReplacementText(peBadRefPToken, params, new EntityContextStack(), () => {
         expect(retrieveExternalEntitySpy).not.toHaveBeenCalled();
         done();
      });
   });

   it('does not do any further processing when the entity already has replacement text defined', (done) => {
      const retrieveExternalEntitySpy = spyOn(params.utils, 'retrieveExternalEntity');
      entityDetails.updateDeclaredValue(peDecl, [], []);

      addProtoReplacementText(peRefPToken, params, new EntityContextStack(), () => {
         expect(retrieveExternalEntitySpy).not.toHaveBeenCalled();
         done();
      });
   });

   it('does not do any further processing when loadExternalEntities is false', (done) => {
      params.loadExternalEntities = false;
      const retrieveExternalEntitySpy = spyOn(params.utils, 'retrieveExternalEntity');
      peRefPToken = new ParameterEntityReferencePToken({
         open: toSToken('&'),
         name: toSToken('pe1'),
      });

      addProtoReplacementText(peRefPToken, params, new EntityContextStack(), () => {
         expect(retrieveExternalEntitySpy).not.toHaveBeenCalled();
         done();
      });
   });

   it('calls back to all callers when the first call has finished', (done) => {
      let done1: (value: EntityValuePToken) => void;
      let callCount = 0;
      params.utils.parseEntityValue = (other, localDone): void => {
         done1 = localDone;
      };
      done1 = (): void => {
         return undefined;
      };

      // Make the first call.  This will store the done function, above wand wait for the second
      addProtoReplacementText(peRefPToken, params, new EntityContextStack(), () => {
         callCount++;
         expect(callCount).toEqual(1);
      });

      // make the second call. This will set up the second call back which will
      // be invoked below
      addProtoReplacementText(peRefPToken, params, new EntityContextStack(), () => {
         callCount++;
         expect(callCount).toEqual(2);
         done();
      });

      // Note that we have done no callbacks yet
      expect(callCount).toEqual(0);

      // Now, trigger the stored call, and both calls will happen
      done1([textPToken]);
   });

   it('calls expandEntityValue with the name of the paramenter entity in the name stack (§4.1.0)', (done) => {
      addProtoReplacementText(peRefPToken, params, new EntityContextStack(), () => {
         expect(expandEntitValueSpy.calls.argsFor(0)[2].hasPEName('pe1')).toEqual(true);
         done();
      });
   });

   it('calls cloneWithRef on the stack with the entityLoc from the details (implementation)', (done) => {
      const stack = new EntityContextStack();
      const cloneSpy = spyOn(stack, 'cloneWithRef');

      addProtoReplacementText(peRefPToken, params, stack, () => {
         expect(cloneSpy).toHaveBeenCalledWith(peRefPToken, 'pe loc');
         done();
      });
   });

   it('calls expandEntityValue with the name of the general entity in the name stack (§4.1.0)', (done) => {
      addProtoReplacementText(geRefPToken, params, new EntityContextStack(), () => {
         expect(expandEntitValueSpy.calls.argsFor(0)[2].hasGEName('ge1')).toEqual(true);
         done();
      });
   });

   it('delivers parsing errors to call callers', (done) => {
      let done1: (value: EntityValuePToken) => void;
      let callCount = 0;
      done1 = (): void => {
         return undefined;
      };
      params.utils.parseEntityValue = (other, localDone): void => {
         done1 = localDone;
      };
      params.utils.retrieveExternalEntity = (): RetrieveResults => {
         const errors: Array<XmlError> = [];
         for (let index = 0; index < callCount; index++) {
            errors.push(new WellFormedError(WellFormedError.ID.XMLDECL_NO_PARAMS));
         }
         return {
            sTokenSource: new STokenSource({}),
            getErrors: (): Array<XmlError> => errors,
         };
      };

      callCount++;
      // Make a first call.  This will start to "retrieve" the sToken and the errors at this time
      addProtoReplacementText(peRefPToken, params, new EntityContextStack(), (results) => {
         expect(results).toEqual({
            byproducts: [
               new WellFormedError(WellFormedError.ID.XMLDECL_NO_PARAMS),
               new ElidedEntityDeclarationPToken(peDecl, [
                  new TextPToken({ text: toSToken('foo') }),
               ]),
            ],
         });
      });

      // make the second call. This will short circuit and not retrieve.
      callCount++;
      addProtoReplacementText(peRefPToken, params, new EntityContextStack(), (results) => {
         expect(results).toEqual({
            byproducts: [],
         });
         done();
      });

      // Now, trigger the stored call, and both callbacks will be invoked with the first's errors
      done1([textPToken]);
   });

   it('does not do any further processing when the entity can not be parsed', (done) => {
      params.utils.retrieveExternalEntity = (): RetrieveResults => {
         return {
            sTokenSource: new STokenSource({}),
            getErrors: (): Array<XmlError> => [
               new WellFormedError(WellFormedError.ID.XMLDECL_NO_PARAMS),
            ],
         };
      };
      params.utils.parseEntityValue = (other, localDone): void => {
         localDone(undefined); // <-- heart of the test
      };

      addProtoReplacementText(peRefPToken, params, new EntityContextStack(), (results) => {
         expect(results).toEqual({
            byproducts: [new WellFormedError(WellFormedError.ID.XMLDECL_NO_PARAMS)],
         });
         done();
      });
   });
});
