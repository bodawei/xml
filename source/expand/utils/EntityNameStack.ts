import {
   GeneralEntityReferencePToken,
   ParameterEntityReferencePToken,
   GENERAL_ENTITY_REFERENCE_PTOKEN,
} from 'token';
import { strOrBlank } from 'sToken';

/*
 * Centralizes a stack to keep track of what parameter entity and
 * general entity references we are expanding.
 *
 * This does NOT make any judgements about the legality of GE's in PE's or PE's in GE's.
 */
class EntityNameStack {
   private nameStack: Array<string> = [];

   pushPEName(name: string): void {
      this.nameStack.push(`PE ${name}`);
   }

   pushGEName(name: string): void {
      this.nameStack.push(`GE ${name}`);
   }

   pushName(pToken: GeneralEntityReferencePToken | ParameterEntityReferencePToken): void {
      const name = strOrBlank(pToken.name);

      if (pToken.type === GENERAL_ENTITY_REFERENCE_PTOKEN) {
         this.pushGEName(name);
      } else {
         this.pushPEName(name);
      }
   }

   cloneWithPEName(name: string): EntityNameStack {
      const other = new EntityNameStack();
      other.nameStack = [...this.nameStack, `PE ${name}`];

      return other;
   }

   cloneWithGEName(name: string): EntityNameStack {
      const other = new EntityNameStack();
      other.nameStack = [...this.nameStack, `GE ${name}`];

      return other;
   }

   hasPEName(name: string): boolean {
      return this.nameStack.includes(`PE ${name}`);
   }

   hasGEName(name: string): boolean {
      return this.nameStack.includes(`GE ${name}`);
   }

   hasName(pToken: GeneralEntityReferencePToken | ParameterEntityReferencePToken): boolean {
      const name = strOrBlank(pToken.name);

      if (pToken.type === GENERAL_ENTITY_REFERENCE_PTOKEN) {
         return this.hasGEName(name);
      } else {
         return this.hasPEName(name);
      }
   }

   popPEName(name: string): string | void {
      if (this.nameStack[this.nameStack.length - 1] === `PE ${name}`) {
         return this.nameStack.pop()?.replace('PE ', '');
      }
   }
   popGEName(name: string): string | void {
      if (this.nameStack[this.nameStack.length - 1] === `GE ${name}`) {
         return this.nameStack.pop()?.replace('GE ', '');
      }
   }

   popName(pToken: GeneralEntityReferencePToken | ParameterEntityReferencePToken): string | void {
      const name = strOrBlank(pToken.name);

      if (pToken.type === GENERAL_ENTITY_REFERENCE_PTOKEN) {
         return this.popGEName(name);
      } else {
         return this.popPEName(name);
      }
   }
}

export { EntityNameStack };
