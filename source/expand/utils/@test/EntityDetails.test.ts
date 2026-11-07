/* Copyright ® 2020-2026 by 柏大衛. All rights reserved. */

import { toSToken } from 'basic';
import {
   ExternalIdP,
   GeneralEntityDeclarationPToken,
   GeneralEntityReferencePToken,
   ParameterEntityDeclarationPToken,
   ParameterEntityReferencePToken,
   TextPToken,
} from 'pToken';

import { EntityDetails } from '../EntityDetails';
import { ExternalDtdSubsetPseudoToken } from '../ExternalDtdSubsetPseudoToken';
import { lookupPredefinedEntityValue } from '../lookupPredefinedEntityValue';

describe('EntityDetails (unit)', () => {
   let entityDetails: EntityDetails;
   let geDecl1: GeneralEntityDeclarationPToken;

   beforeEach(() => {
      geDecl1 = new GeneralEntityDeclarationPToken({
         open: toSToken('<!'),
         name: toSToken('foo'),
      });

      entityDetails = new EntityDetails();
   });

   describe('hasEntity()', () => {
      it('returns true if the specified general entity declaration is already there', () => {
         const decl2 = new GeneralEntityDeclarationPToken({
            open: toSToken('<!'),
            name: toSToken('foo'),
         });
         entityDetails.addEntity(geDecl1, undefined, '');

         const result = entityDetails.hasEntity(decl2);

         expect(result).toEqual(true);
      });

      it('returns true if the specified parameter entity declaration is already there', () => {
         const decl1 = new ParameterEntityDeclarationPToken({
            open: toSToken('<!'),
            name: toSToken('foo'),
         });
         const decl2 = new ParameterEntityDeclarationPToken({
            open: toSToken('<!'),
            name: toSToken('foo'),
         });
         entityDetails.addEntity(decl1, undefined, '');

         const result = entityDetails.hasEntity(decl2);

         expect(result).toEqual(true);
      });

      it('returns false if the specified general entity declaration is not already in the details', () => {
         const decl2 = new GeneralEntityDeclarationPToken({
            open: toSToken('<!'),
            name: toSToken('bar'),
         });
         entityDetails.addEntity(geDecl1, undefined, '');

         const result = entityDetails.hasEntity(decl2);

         expect(result).toEqual(false);
      });

      it('returns false if one tries to ask if an unnamed entity is in the details', () => {
         const decl1 = new GeneralEntityDeclarationPToken({ open: toSToken('<!') });
         const decl2 = new GeneralEntityDeclarationPToken({ open: toSToken('<!') });
         entityDetails.addEntity(decl1, undefined, '');

         const result = entityDetails.hasEntity(decl2);

         expect(result).toEqual(false);
      });
   });

   describe('addEntity()', () => {
      it('creates a details entry for the provided general entity declaration', () => {
         entityDetails.addEntity(geDecl1, undefined, '');

         const result = entityDetails.getGEDetails('foo');
         expect((result as any).token).toEqual(geDecl1);
      });

      it('ignores a second entry for the same name', () => {
         const decl2 = new GeneralEntityDeclarationPToken({
            open: toSToken('<!'),
            name: toSToken('foo'),
         });

         entityDetails.addEntity(geDecl1, undefined, '');
         entityDetails.addEntity(decl2, undefined, '');

         const result = entityDetails.getGEDetails('foo');
         expect((result as any).token).toEqual(geDecl1);
      });

      it('does not add an entry for a token with no name', () => {
         const decl1 = new GeneralEntityDeclarationPToken({
            open: toSToken('<!'),
         });

         entityDetails.addEntity(decl1, undefined, '');

         expect(entityDetails.getGEDetails('')).toBeUndefined();
      });

      it('creates a general entity details entry with a protoReplacementText value', () => {
         entityDetails.addEntity(geDecl1, [new TextPToken({ text: toSToken('wow') })], '');

         const result = entityDetails.getGEDetails('foo');
         expect((result as any).protoReplacementText).toEqual([
            new TextPToken({ text: toSToken('wow') }),
         ]);
      });

      it('creates a details entry for the provided parameter entity declaration', () => {
         const decl1 = new ParameterEntityDeclarationPToken({
            open: toSToken('<!'),
            name: toSToken('foo'),
         });

         entityDetails.addEntity(decl1, undefined, '');

         const result = entityDetails.getPEDetails('foo');
         expect((result as any).token).toEqual(decl1);
      });

      it('creates a paraemter entity details entry with a protoReplacementText value', () => {
         const decl1 = new ParameterEntityDeclarationPToken({
            open: toSToken('<!'),
            name: toSToken('foo'),
         });

         entityDetails.addEntity(decl1, [new TextPToken({ text: toSToken('wow') })], '');

         const result = entityDetails.getPEDetails('foo');
         expect((result as any).protoReplacementText).toEqual([
            new TextPToken({ text: toSToken('wow') }),
         ]);
      });
   });

   describe('getGEDetails()', () => {
      it('retrieves a previously added general entity declaration', () => {
         entityDetails.addEntity(geDecl1, undefined, 'x');

         const result = entityDetails.getGEDetails('foo');
         expect(result as any).toEqual({
            token: geDecl1,
            isUnparsed: false,
            isInternal: true,
            isLoading: false,
            entityLoc: 'x',
            waiters: [],
         });
      });

      it('reveals an unparsed entity as unparsed', () => {
         const decl1 = new GeneralEntityDeclarationPToken({
            open: toSToken('<!'),
            name: toSToken('foo'),
            nData: toSToken('NDATA'),
         });
         entityDetails.addEntity(decl1, undefined, '');

         const result = entityDetails.getGEDetails('foo');
         expect((result as any).isUnparsed).toEqual(true);
      });

      it('reveals an external entity as external', () => {
         const decl1 = new GeneralEntityDeclarationPToken({
            open: toSToken('<!'),
            name: toSToken('foo'),
            externalId: {},
         });
         entityDetails.addEntity(decl1, undefined, '');

         const result = entityDetails.getGEDetails('foo');
         expect((result as any).isInternal).toEqual(false);
      });

      it('retrieves undefined if the specified entity does not exist', () => {
         const result = entityDetails.getGEDetails('foo');
         expect(result).toBeUndefined();
      });

      it('retrieves undefined if an empty name is given', () => {
         entityDetails.addEntity(geDecl1, undefined, '');

         const result = entityDetails.getGEDetails('');
         expect(result).toBeUndefined();
      });
   });

   describe('getPEDetails()', () => {
      it('retrieves a previously added general entity declaration', () => {
         const decl1 = new ParameterEntityDeclarationPToken({
            open: toSToken('<!'),
            name: toSToken('foo'),
         });
         entityDetails.addEntity(decl1, undefined, 'w');

         const result = entityDetails.getPEDetails('foo');
         expect(result as any).toEqual({
            token: decl1,
            isInternal: true,
            isLoading: false,
            entityLoc: 'w',
            waiters: [],
         });
      });

      it('reveals an external entity as external', () => {
         const decl1 = new GeneralEntityDeclarationPToken({
            open: toSToken('<!'),
            name: toSToken('foo'),
            externalId: {},
         });
         entityDetails.addEntity(decl1, undefined, '');

         const result = entityDetails.getGEDetails('foo');
         expect((result as any).isInternal).toEqual(false);
      });

      it('retrieves undefined if the specified entity does not exist', () => {
         const result = entityDetails.getPEDetails('foo');
         expect(result).toBeUndefined();
      });

      it('retrieves undefined if an empty name is given', () => {
         const decl1 = new ParameterEntityDeclarationPToken({
            open: toSToken('<!'),
            name: toSToken(''),
         });
         entityDetails.addEntity(decl1, undefined, '');

         const result = entityDetails.getPEDetails('');
         expect(result).toBeUndefined();
      });

      it('returns a predefined lt entity declaration, even if it was not previously declared', () => {
         const value = lookupPredefinedEntityValue('lt');

         const result = entityDetails.getGEDetails('lt');

         expect(result).toEqual({
            token: new GeneralEntityDeclarationPToken({
               open: toSToken('<!'),
               name: toSToken('lt'),
               value: value,
            }),
            isUnparsed: false,
            isInternal: true,
            isLoading: false,
            waiters: [],
            entityLoc: 'predefined',
            protoReplacementText: value,
         } as any);
      });

      it('returns a predefined gt entity declaration, even if it was not previously declared', () => {
         const value = lookupPredefinedEntityValue('gt');

         const result = entityDetails.getGEDetails('gt');

         expect(result!.protoReplacementText).toEqual(value);
      });

      it('returns a predefined amp entity declaration, even if it was not previously declared', () => {
         const value = lookupPredefinedEntityValue('amp');

         const result = entityDetails.getGEDetails('amp');

         expect(result!.protoReplacementText).toEqual(value);
      });

      it('returns a predefined apos entity declaration, even if it was not previously declared', () => {
         const value = lookupPredefinedEntityValue('apos');

         const result = entityDetails.getGEDetails('apos');

         expect(result!.protoReplacementText).toEqual(value);
      });

      it('returns a predefined quot entity declaration, even if it was not previously declared', () => {
         const value = lookupPredefinedEntityValue('quot');

         const result = entityDetails.getGEDetails('quot');

         expect(result!.protoReplacementText).toEqual(value);
      });
   });

   describe('getReferencedDetails()', () => {
      it('retrieves a previously added general entity declaration', () => {
         entityDetails.addEntity(geDecl1, undefined, 'zz');

         const result = entityDetails.getReferencedDetails(
            new GeneralEntityReferencePToken({
               open: toSToken('&'),
               name: toSToken('foo'),
            }),
         );
         expect(result as any).toEqual({
            token: geDecl1,
            isInternal: true,
            isLoading: false,
            isUnparsed: false,
            entityLoc: 'zz',
            waiters: [],
         });
      });

      it('retrieves a previously added parameter entity declaration', () => {
         const decl1 = new ParameterEntityDeclarationPToken({
            open: toSToken('<!'),
            name: toSToken('foo'),
         });
         entityDetails.addEntity(decl1, undefined, 'gg');

         const result = entityDetails.getReferencedDetails(
            new ParameterEntityReferencePToken({
               open: toSToken('%'),
               name: toSToken('foo'),
            }),
         );
         expect(result as any).toEqual({
            token: decl1,
            isInternal: true,
            isLoading: false,
            entityLoc: 'gg',
            waiters: [],
         });
      });
   });

   describe('addExternalSubset()', () => {
      it('adds an external subset token to this', () => {
         entityDetails.addExternalSubset(new ExternalIdP({}));

         const result = entityDetails.getExternalSubsetReference();
         expect(result instanceof ExternalDtdSubsetPseudoToken).toEqual(true);
      });
   });

   describe('getExternalSubsetReference()', () => {
      it('adds an external subset token to this', () => {
         entityDetails.addExternalSubset(new ExternalIdP({}));

         const result = entityDetails.getExternalSubsetReference();

         expect(result instanceof ExternalDtdSubsetPseudoToken).toEqual(true);
      });
   });

   describe('loadingEntity()', () => {
      it('sets the loading flag on the entity', () => {
         entityDetails.addEntity(geDecl1, undefined, '');

         entityDetails.loadingEntity(geDecl1);

         const result = entityDetails.getReferencedDetails(
            new GeneralEntityReferencePToken({
               open: toSToken('&'),
               name: toSToken('foo'),
            }),
         );
         expect((result as any).isLoading).toEqual(true);
      });

      it('throws an error if you try to state that you are loading an entity that has not been added', () => {
         expect(() => {
            entityDetails.loadingEntity(geDecl1);
         }).toThrowError(
            'Internal error: Trying to load the value of a declaration that has not been seen.',
         );
      });
   });

   describe('waitForLoading()', () => {
      it('calls back after a delay when the entity is not in the process of loading', (done) => {
         let hasBeenCalled = false;
         entityDetails.addEntity(geDecl1, undefined, '');
         const details = entityDetails.getReferencedDetails(
            new GeneralEntityReferencePToken({
               open: toSToken('&'),
               name: toSToken('foo'),
            }),
         );

         entityDetails.waitForLoading(geDecl1, () => {
            hasBeenCalled = true;
            expect((details as any).isLoading).toEqual(false);
            done();
         });

         expect(hasBeenCalled).toEqual(false);
      });

      it('calls back after a delay with no details or errors when the entity has not been added', (done) => {
         entityDetails.waitForLoading(geDecl1, (result) => {
            expect(result).toEqual({
               details: undefined,
               byproducts: [],
            });
            done();
         });
      });
   });

   describe('updateDeclaredValue()', () => {
      it('calls the pending callbacks in order with details and errors', (done) => {
         let callCount = 0;
         entityDetails.addEntity(geDecl1, undefined, '');

         entityDetails.loadingEntity(geDecl1);

         entityDetails.waitForLoading(geDecl1, () => {
            callCount++;
            expect(callCount).toEqual(1);
         });

         entityDetails.waitForLoading(geDecl1, (result) => {
            callCount++;

            expect(callCount).toEqual(2);
            expect((result.details as any).protoReplacementText).toEqual([
               new TextPToken({ text: toSToken('wow') }),
            ]);
            expect(result.byproducts).toEqual([{} as any]);

            done();
         });

         expect(callCount).toEqual(0);

         const errors = [{} as any];
         entityDetails.updateDeclaredValue(
            geDecl1,
            [new TextPToken({ text: toSToken('wow') })],
            errors,
         );
      });

      it('throws an error if the declartion has not been added', () => {
         expect(() => {
            entityDetails.updateDeclaredValue(geDecl1, [], []);
         }).toThrowError('Internal error: A value was loaded for an unknown entity.');
      });
   });
});
