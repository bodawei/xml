/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { toSToken } from 'sToken';
import {
   EXTERNAL_ID,
   GeneralEntityDeclarationPToken,
   ParameterEntityDeclarationPToken,
   GeneralEntityReferencePToken,
   ParameterEntityReferencePToken,
   TextPToken,
} from 'token';

import { EntityNameStack } from '../EntityNameStack';

describe('EntityNameStack (unit)', () => {
   let entityNameStack: EntityNameStack;
   let geRef: GeneralEntityReferencePToken;
   let peRef: ParameterEntityReferencePToken;

   beforeEach(() => {
      geRef = new GeneralEntityReferencePToken({
         open: toSToken('&'),
         name: toSToken('foo'),
      });
      peRef = new ParameterEntityReferencePToken({
         open: toSToken('%'),
         name: toSToken('foo'),
      });

      entityNameStack = new EntityNameStack();
   });

   describe('pushPEName()', () => {
      it('adds the name to the stack', () => {
         entityNameStack.pushPEName('foo');

         expect(entityNameStack.hasPEName('foo')).toEqual(true);
      });
   });

   describe('pushGEName()', () => {
      it('adds the name to the stack', () => {
         entityNameStack.pushGEName('foo');

         expect(entityNameStack.hasGEName('foo')).toEqual(true);
      });
   });

   describe('pushName()', () => {
      it('adds the general entity reference name to the stack', () => {
         entityNameStack.pushName(geRef);

         expect(entityNameStack.hasGEName('foo')).toEqual(true);
      });

      it('adds the parameter entity reference name to the stack', () => {
         entityNameStack.pushName(peRef);

         expect(entityNameStack.hasPEName('foo')).toEqual(true);
      });
   });

   describe('cloneWithPEName()', () => {
      it('adds the name to the stack', () => {
         entityNameStack.pushPEName('foo');

         const newStack = entityNameStack.cloneWithPEName('bar');

         expect(newStack.hasPEName('foo') && newStack.hasPEName('bar')).toEqual(true);
      });

      it('makes a copy of the new stack', () => {
         entityNameStack.pushPEName('foo');

         const newStack = entityNameStack.cloneWithPEName('bar');

         expect(newStack).not.toEqual(entityNameStack);
      });
   });

   describe('cloneWithGEName()', () => {
      it('adds the name to the new stack', () => {
         entityNameStack.pushGEName('foo');

         const newStack = entityNameStack.cloneWithGEName('bar');

         expect(newStack.hasGEName('foo') && newStack.hasGEName('bar')).toEqual(true);
      });

      it('makes a copy of the new stack', () => {
         entityNameStack.pushGEName('foo');

         const newStack = entityNameStack.cloneWithGEName('bar');

         expect(newStack).not.toEqual(entityNameStack);
      });
   });

   describe('hasPEName()', () => {
      it('finds an element already in the stack', () => {
         entityNameStack.pushPEName('foo');

         expect(entityNameStack.hasPEName('foo')).toEqual(true);
      });

      it('returns false if the name is not in the stack', () => {
         entityNameStack.pushPEName('foo');

         expect(entityNameStack.hasPEName('bar')).toEqual(false);
      });

      it('returns false if the same named GE is in the stack', () => {
         entityNameStack.pushGEName('foo');

         expect(entityNameStack.hasPEName('foo')).toEqual(false);
      });
   });

   describe('hasGEName()', () => {
      it('returns true if the general entity name is in the stack', () => {
         entityNameStack.pushGEName('foo');

         expect(entityNameStack.hasGEName('foo')).toEqual(true);
      });

      it('returns false if the name is not in the stack', () => {
         entityNameStack.pushGEName('foo');

         expect(entityNameStack.hasGEName('bar')).toEqual(false);
      });

      it('returns false if the same named GE is in the stack', () => {
         entityNameStack.pushPEName('foo');

         expect(entityNameStack.hasGEName('foo')).toEqual(false);
      });
   });

   describe('hasName()', () => {
      it('returns true if the general entity reference names is in the stack', () => {
         entityNameStack.pushGEName('foo');

         expect(entityNameStack.hasName(geRef)).toEqual(true);
      });

      it('returns true if the parameter entity reference names is in the stack', () => {
         entityNameStack.pushPEName('foo');

         expect(entityNameStack.hasName(peRef)).toEqual(true);
      });
   });

   describe('popPEName()', () => {
      it('removes the name from the stack', () => {
         entityNameStack.pushPEName('foo');

         const result = entityNameStack.popPEName('foo');

         expect(result).toEqual('foo');
         expect(entityNameStack.hasPEName('foo')).toEqual(false);
      });

      it('removes and returns nothing if the name does not match the topmost stack', () => {
         entityNameStack.pushPEName('foo');
         entityNameStack.pushPEName('bar');

         const result = entityNameStack.popPEName('foo');

         expect(result).toBeUndefined();
         expect(entityNameStack.hasPEName('foo')).toEqual(true);
      });

      describe('popGEName()', () => {
         it('removes the name from the stack', () => {
            entityNameStack.pushGEName('foo');

            const result = entityNameStack.popGEName('foo');

            expect(result).toEqual('foo');
            expect(entityNameStack.hasGEName('foo')).toEqual(false);
         });

         it('removes and returns nothing if the name does not match the topmost stack', () => {
            entityNameStack.pushGEName('foo');
            entityNameStack.pushGEName('bar');

            const result = entityNameStack.popGEName('foo');

            expect(result).toBeUndefined();
            expect(entityNameStack.hasGEName('foo')).toEqual(true);
         });
      });
   });

   describe('popName()', () => {
      it('removes the general entity reference name from the stack', () => {
         entityNameStack.pushGEName('foo');

         const result = entityNameStack.popName(geRef);

         expect(result).toEqual('foo');
         expect(entityNameStack.hasGEName('foo')).toEqual(false);
      });

      it('removes the parameter entity reference name from the stack', () => {
         entityNameStack.pushPEName('foo');

         const result = entityNameStack.popName(peRef);

         expect(result).toEqual('foo');
         expect(entityNameStack.hasGEName('foo')).toEqual(false);
      });
   });
});
