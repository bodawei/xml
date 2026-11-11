import { strOrBlank } from 'basic';
import { EntityId } from 'basic';
import {
   GENERAL_ENTITY_REFERENCE_PTOKEN,
   GeneralEntityReferencePToken,
   ParameterEntityReferencePToken,
} from 'pToken';

import { OpaqueEntityLoc } from '../types';
import {
   ExternalDtdSubsetPseudoToken,
   EXTERNAL_DTD_PSEUDO_TOKEN,
} from './ExternalDtdSubsetPseudoToken';

const EXTERNAL_ENTITY_NAME = 'External Subset Entity';

/*
 * Centralizes a stack to keep track of what parameter entity and
 * general entity references we are expanding, as well as what the current
 * entity location we are in
 *
 * This does NOT make any judgements about the legality of GE's in PE's or PE's in GE's.
 */
class EntityContextStack {
   private nameStack: Array<string> = [];

   private locStack: Array<OpaqueEntityLoc> = [];

   cloneWithRef(
      pToken: GeneralEntityReferencePToken | ParameterEntityReferencePToken,
      entityLoc: OpaqueEntityLoc,
   ): EntityContextStack {
      if (pToken.type === GENERAL_ENTITY_REFERENCE_PTOKEN) {
         return this.cloneWithGEName(pToken, entityLoc);
      } else {
         return this.cloneWithPEName(pToken, entityLoc);
      }
   }

   pushDocumentEntity(entityId: EntityId): void {
      this.nameStack.push('Document Entity');
      this.locStack.push(entityId);
   }

   pushName(
      pToken:
         | GeneralEntityReferencePToken
         | ParameterEntityReferencePToken
         | ExternalDtdSubsetPseudoToken,
      entityLoc: OpaqueEntityLoc,
   ): void {
      if (pToken.type === EXTERNAL_DTD_PSEUDO_TOKEN) {
         this.nameStack.push(EXTERNAL_ENTITY_NAME);
         this.locStack.push(entityLoc);
         return;
      }

      const name = strOrBlank(pToken.name);

      if (pToken.type === GENERAL_ENTITY_REFERENCE_PTOKEN) {
         this.pushGEName(name);
      } else {
         this.pushPEName(name);
      }
      this.locStack.push(entityLoc);
   }

   hasName(pToken: GeneralEntityReferencePToken | ParameterEntityReferencePToken): boolean {
      const name = strOrBlank(pToken.name);

      if (pToken.type === GENERAL_ENTITY_REFERENCE_PTOKEN) {
         return this.hasGEName(name);
      } else {
         return this.hasPEName(name);
      }
   }

   getCurrentEntityLoc(): OpaqueEntityLoc {
      return this.locStack[this.locStack.length - 1];
   }

   popName(
      pToken:
         | GeneralEntityReferencePToken
         | ParameterEntityReferencePToken
         | ExternalDtdSubsetPseudoToken,
   ): string | void {
      if (pToken.type === EXTERNAL_DTD_PSEUDO_TOKEN) {
         if (this.nameStack[this.nameStack.length - 1] === EXTERNAL_ENTITY_NAME) {
            this.nameStack.pop();
            this.locStack.pop();
         }
         return;
      }

      const name = strOrBlank(pToken.name);

      if (pToken.type === GENERAL_ENTITY_REFERENCE_PTOKEN) {
         return this.popGEName(name);
      } else {
         return this.popPEName(name);
      }
   }

   private cloneWithPEName(
      pToken: ParameterEntityReferencePToken,
      entityLoc: OpaqueEntityLoc,
   ): EntityContextStack {
      const name = strOrBlank(pToken.name);
      const other = new EntityContextStack();
      other.nameStack = [...this.nameStack, `PE ${name}`];
      other.locStack = [...this.locStack, entityLoc];

      return other;
   }

   private cloneWithGEName(
      pToken: GeneralEntityReferencePToken,
      entityLoc: OpaqueEntityLoc,
   ): EntityContextStack {
      const name = strOrBlank(pToken.name);

      const other = new EntityContextStack();
      other.nameStack = [...this.nameStack, `GE ${name}`];
      other.locStack = [...this.locStack, entityLoc];

      return other;
   }

   private pushPEName(name: string): void {
      this.nameStack.push(`PE ${name}`);
   }

   private pushGEName(name: string): void {
      this.nameStack.push(`GE ${name}`);
   }

   private hasPEName(name: string): boolean {
      return this.nameStack.includes(`PE ${name}`);
   }

   private hasGEName(name: string): boolean {
      return this.nameStack.includes(`GE ${name}`);
   }

   private popPEName(name: string): string | void {
      if (this.nameStack[this.nameStack.length - 1] === `PE ${name}`) {
         this.locStack.pop();
         return this.nameStack.pop()?.replace('PE ', '');
      }
   }

   private popGEName(name: string): string | void {
      if (this.nameStack[this.nameStack.length - 1] === `GE ${name}`) {
         this.locStack.pop();
         return this.nameStack.pop()?.replace('GE ', '');
      }
   }
}

export { EntityContextStack };
