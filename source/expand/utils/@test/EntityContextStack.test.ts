import { EntityId } from 'basic';
/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { toSToken } from 'sToken';
import { GeneralEntityReferencePToken, ParameterEntityReferencePToken } from 'pToken';

import { EntityContextStack } from '../EntityContextStack';
import { ExternalDtdSubsetPseudoToken } from '../ExternalDtdSubsetPseudoToken';

describe('EntityContextStack (unit)', () => {
   let entityNameStack: EntityContextStack;
   let geRef: GeneralEntityReferencePToken;
   let peRef: ParameterEntityReferencePToken;
   let barGERef: GeneralEntityReferencePToken;
   let barPERef: ParameterEntityReferencePToken;
   let extToken: ExternalDtdSubsetPseudoToken;

   beforeEach(() => {
      geRef = new GeneralEntityReferencePToken({
         open: toSToken('&'),
         name: toSToken('foo'),
      });
      peRef = new ParameterEntityReferencePToken({
         open: toSToken('%'),
         name: toSToken('foo'),
      });
      barPERef = new ParameterEntityReferencePToken({
         open: toSToken('%'),
         name: toSToken('bar'),
      });
      barGERef = new GeneralEntityReferencePToken({
         open: toSToken('&'),
         name: toSToken('bar'),
      });
      extToken = new ExternalDtdSubsetPseudoToken({});

      entityNameStack = new EntityContextStack();
   });

   describe('getCurrentEntityLoc()', () => {
      it('returns undefined if called before the document entity is added', () => {
         expect(entityNameStack.getCurrentEntityLoc()).toBeUndefined();
      });

      it('returns the document entity loc if it has been added', () => {
         const entityId = new EntityId('one', 'two');
         entityNameStack.pushDocumentEntity(entityId);

         expect(entityNameStack.getCurrentEntityLoc()).toEqual(entityId);
      });

      it('returns the external subset id if that has been added', () => {
         const entityId = new EntityId('one', 'two');
         entityNameStack.pushDocumentEntity(entityId);
         entityNameStack.pushName(extToken, 'xt is good');

         expect(entityNameStack.getCurrentEntityLoc()).toEqual('xt is good');
      });

      it('returns the most recent GE entity if it has been added', () => {
         const entityId = new EntityId('one', 'two');
         entityNameStack.pushDocumentEntity(entityId);
         entityNameStack.pushName(extToken, 'x');
         entityNameStack.pushName(geRef, 'ge1');
         entityNameStack.pushName(peRef, 'pe1');
         entityNameStack.pushName(barGERef, 'ge2');

         expect(entityNameStack.getCurrentEntityLoc()).toEqual('ge2');
      });

      it('returns the most recent PE entity if it has been added', () => {
         const entityId = new EntityId('one', 'two');
         entityNameStack.pushDocumentEntity(entityId);
         entityNameStack.pushName(extToken, 'x');
         entityNameStack.pushName(geRef, 'ge1');
         entityNameStack.pushName(peRef, 'pe1');
         entityNameStack.pushName(barGERef, 'ge2');
         entityNameStack.pushName(barPERef, 'pe2');
         entityNameStack.popName(barPERef);
         entityNameStack.popName(barGERef);

         expect(entityNameStack.getCurrentEntityLoc()).toEqual('pe1');
      });

      it('returns the document entity after everything else has been popped', () => {
         const entityId = new EntityId('one', 'two');
         entityNameStack.pushDocumentEntity(entityId);
         entityNameStack.pushName(extToken, 'x');
         entityNameStack.pushName(geRef, 'ge1');
         entityNameStack.pushName(barGERef, 'ge2');
         entityNameStack.pushName(barPERef, 'pe2');
         entityNameStack.popName(barPERef);
         entityNameStack.popName(barGERef);
         entityNameStack.popName(geRef);
         entityNameStack.popName(extToken);

         expect(entityNameStack.getCurrentEntityLoc()).toEqual(entityId);
      });
   });

   describe('pushName()', () => {
      it('adds the general entity reference name to the stack', () => {
         entityNameStack.pushName(geRef, '');

         expect(entityNameStack.hasName(geRef)).toEqual(true);
      });

      it('adds the parameter entity reference name to the stack', () => {
         entityNameStack.pushName(peRef, '');

         expect(entityNameStack.hasName(peRef)).toEqual(true);
      });
   });

   describe('cloneWithRef()', () => {
      it('adds a PE name name to the stack', () => {
         entityNameStack.pushName(peRef, '');

         const newStack = entityNameStack.cloneWithRef(barPERef, '');

         expect(newStack.hasName(peRef) && newStack.hasName(barPERef)).toEqual(true);
      });

      it('adds a GE name to the new stack', () => {
         const barRef = new GeneralEntityReferencePToken({
            open: toSToken('&'),
            name: toSToken('bar'),
         });

         entityNameStack.pushName(geRef, '');

         const newStack = entityNameStack.cloneWithRef(barRef, '');

         expect(newStack.hasName(geRef) && newStack.hasName(barRef)).toEqual(true);
      });

      it('makes a copy of the new stack', () => {
         entityNameStack.pushName(peRef, '');

         const newStack = entityNameStack.cloneWithRef(barPERef, '');

         expect(newStack).not.toEqual(entityNameStack);
      });
   });

   describe('hasName()', () => {
      it('returns true if the general entity reference names is in the stack', () => {
         entityNameStack.pushName(geRef, '');

         expect(entityNameStack.hasName(geRef)).toEqual(true);
      });

      it('returns true if the parameter entity reference names is in the stack', () => {
         entityNameStack.pushName(peRef, '');

         expect(entityNameStack.hasName(peRef)).toEqual(true);
      });

      it('returns false if the name is not in the stack', () => {
         entityNameStack.pushName(peRef, '');

         expect(entityNameStack.hasName(barPERef)).toEqual(false);
      });

      it('returns false if the same named PE is in the stack', () => {
         entityNameStack.pushName(geRef, '');

         expect(entityNameStack.hasName(peRef)).toEqual(false);
      });

      it('returns true if the general entity name is in the stack', () => {
         entityNameStack.pushName(geRef, '');

         expect(entityNameStack.hasName(geRef)).toEqual(true);
      });

      it('returns false if the name is not in the stack', () => {
         entityNameStack.pushName(geRef, '');

         expect(entityNameStack.hasName(barGERef)).toEqual(false);
      });

      it('returns false if the same named GE is in the stack', () => {
         entityNameStack.pushName(peRef, '');

         expect(entityNameStack.hasName(geRef)).toEqual(false);
      });
   });

   describe('popName()', () => {
      it('removes the general entity reference name from the stack', () => {
         entityNameStack.pushName(geRef, '');

         const result = entityNameStack.popName(geRef);

         expect(result).toEqual('foo');
         expect(entityNameStack.hasName(geRef)).toEqual(false);
      });

      it('removes the parameter entity reference name from the stack', () => {
         entityNameStack.pushName(peRef, '');

         const result = entityNameStack.popName(peRef);

         expect(result).toEqual('foo');
         expect(entityNameStack.hasName(peRef)).toEqual(false);
      });

      it('removes the parameter entity reference name from the stack', () => {
         entityNameStack.pushName(peRef, '');

         const result = entityNameStack.popName(peRef);

         expect(result).toEqual('foo');
         expect(entityNameStack.hasName(peRef)).toEqual(false);
      });

      it('removes and returns nothing if the PE Ref name does not match the topmost stack', () => {
         entityNameStack.pushName(peRef, '');
         entityNameStack.pushName(barPERef, '');

         const result = entityNameStack.popName(peRef);

         expect(result).toBeUndefined();
         expect(entityNameStack.hasName(peRef)).toEqual(true);
      });

      it('removes and returns nothing if the GE ref name does not match the topmost stack', () => {
         entityNameStack.pushName(geRef, '');
         entityNameStack.pushName(barGERef, '');

         const result = entityNameStack.popName(geRef);

         expect(result).toBeUndefined();
         expect(entityNameStack.hasName(geRef)).toEqual(true);
      });
   });
});
