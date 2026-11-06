/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { Problem } from 'basic';
import { strOrBlank, toSToken } from 'basic';
import {
   GENERAL_ENTITY_DECLARATION_PTOKEN,
   ExternalIdP,
   GeneralEntityDeclarationPToken,
   GeneralEntityReferencePToken,
   ParameterEntityDeclarationPToken,
   ParameterEntityReferencePToken,
} from 'pToken';
import { EntityValuePToken, ElidedEntityDeclarationPToken } from 'token';

import { ExternalDtdSubsetPseudoToken } from './ExternalDtdSubsetPseudoToken';
import { lookupPredefinedEntityValue } from './lookupPredefinedEntityValue';
import { OpaqueEntityLoc } from '../types';

interface LoadingResult {
   details: PrivateGEDetails | PrivatePEDetails | undefined;
   byproducts: Array<Problem | ElidedEntityDeclarationPToken>;
}
type LoadingCallback = (result: LoadingResult) => void;

interface PrivateGEDetails {
   token: GeneralEntityDeclarationPToken;
   isUnparsed: boolean;
   isInternal: boolean;
   isLoading: boolean;
   protoReplacementText?: EntityValuePToken;
   waiters: Array<LoadingCallback>;
   entityLoc: OpaqueEntityLoc; // id of the entity that contains this entity's replacement text.
}

interface PrivatePEDetails {
   token: ParameterEntityDeclarationPToken;
   isInternal: boolean;
   isLoading: boolean;
   protoReplacementText?: EntityValuePToken; // This must be filled in if this is internal when the token is found. It must be filled in for external when asked
   waiters: Array<LoadingCallback>;
   entityLoc: OpaqueEntityLoc; // id of the entity that contains this entity's replacement text.
}

type GeneralEntityMap = Record<string, PrivateGEDetails>;

type ParameterEntityMap = Record<string, PrivatePEDetails>;

// No reason for anyone externally to see the waiters property.
type PEDetails = Readonly<Omit<PrivatePEDetails, 'waiters'>>;
type GEDetails = Readonly<Omit<PrivateGEDetails, 'waiters'>>;

/*
 * This simple class keeps track of all the entity declarations and the
 * constructed equivalent of the replacement text of value-internal entities,
 * or the replacement text equivalent of entities needed to construct the
 * replacement text of those value-internal entities.
 *
 * Its main purpose is to pull this data management out of the various
 * routines that use this data.
 */
class EntityDetails {
   private externalSubset?: ExternalDtdSubsetPseudoToken;

   private predefinedGeDetails: GeneralEntityMap;

   private geDetails: GeneralEntityMap;

   private peDetails: ParameterEntityMap;

   constructor() {
      this.predefinedGeDetails = {};
      this.geDetails = {};
      this.peDetails = {};
   }

   public hasEntity(
      pToken: GeneralEntityDeclarationPToken | ParameterEntityDeclarationPToken,
   ): boolean {
      const name = strOrBlank(pToken.name);
      const hasEntry =
         pToken.type === GENERAL_ENTITY_DECLARATION_PTOKEN
            ? !!this.geDetails[name]
            : !!this.peDetails[name];

      return hasEntry;
   }

   /*
    * Note that by convention all value-internal entities will
    * have their value passed as the second parameter here whenever
    * that entity is added here.
    */

   public addEntity(
      pToken: GeneralEntityDeclarationPToken | ParameterEntityDeclarationPToken,
      expandedInternalValue: EntityValuePToken | undefined,
      resolvedLocation: OpaqueEntityLoc,
   ): void {
      const name = strOrBlank(pToken.name);

      if (this.hasEntity(pToken) || name === '') {
         return;
      }

      if (pToken.type === GENERAL_ENTITY_DECLARATION_PTOKEN) {
         this.geDetails[name] = {
            token: pToken,
            isInternal: !pToken.externalId,
            isUnparsed: !!pToken.nData,
            isLoading: false,
            entityLoc: resolvedLocation,
            waiters: [],
         };

         if (expandedInternalValue) {
            this.geDetails[name].protoReplacementText = expandedInternalValue;
         }
      } else {
         this.peDetails[name] = {
            token: pToken,
            isInternal: !pToken.externalId,
            isLoading: false,
            entityLoc: resolvedLocation,
            waiters: [],
         };

         if (expandedInternalValue) {
            this.peDetails[name].protoReplacementText = expandedInternalValue;
         }
      }
   }

   public getGEDetails(name: string): GEDetails | undefined {
      return this.getInternalGEDetails(name);
   }

   public getPEDetails(name: string): PEDetails | undefined {
      return this.getInternalPEDetails(name);
   }

   public getReferencedDetails(
      reference: ParameterEntityReferencePToken | GeneralEntityReferencePToken,
   ): GEDetails | PEDetails | undefined {
      const isPERef = reference instanceof ParameterEntityReferencePToken;
      const entityName = strOrBlank(reference.name);

      return isPERef ? this.getPEDetails(entityName) : this.getGEDetails(entityName);
   }

   public addExternalSubset(externalId: ExternalIdP): void {
      this.externalSubset = new ExternalDtdSubsetPseudoToken(externalId);
   }

   public getExternalSubsetReference(): ExternalDtdSubsetPseudoToken | undefined {
      return this.externalSubset;
   }

   public loadingEntity(
      declaration: ParameterEntityDeclarationPToken | GeneralEntityDeclarationPToken,
   ): void {
      const details = this.getContentDetails(declaration);

      if (!details) {
         throw new Error(
            'Internal error: Trying to load the value of a declaration that has not been seen.',
         );
      }

      details.isLoading = true;
   }

   public waitForLoading(
      declaration: ParameterEntityDeclarationPToken | GeneralEntityDeclarationPToken,
      callback: LoadingCallback,
   ): void {
      const details = this.getContentDetails(declaration);

      if (!details?.isLoading) {
         setTimeout(() => {
            callback({ details, byproducts: [] });
         }, 0);
         return;
      }

      details.waiters.push(callback);
   }

   public updateDeclaredValue(
      declaration: ParameterEntityDeclarationPToken | GeneralEntityDeclarationPToken,
      newValue: EntityValuePToken | undefined,
      byproducts: Array<Problem | ElidedEntityDeclarationPToken>,
   ): void {
      const details = this.getContentDetails(declaration);

      if (!details) {
         throw new Error('Internal error: A value was loaded for an unknown entity.');
      }

      details.isLoading = false;

      if (newValue) {
         details.protoReplacementText = newValue;
      }

      if (details.waiters.length > 0) {
         const waiters = details.waiters;
         details.waiters = [];

         for (const waiter of waiters) {
            waiter({ details, byproducts });
         }
      }
   }

   private getInternalGEDetails(name: string): PrivateGEDetails | undefined {
      // Recall that !'' is the same as !undefined
      if (!name) {
         return;
      }

      let result = this.geDetails[name] || this.predefinedGeDetails[name];

      if (!result) {
         const value = lookupPredefinedEntityValue(name);

         if (value) {
            result = {
               token: new GeneralEntityDeclarationPToken({
                  open: toSToken('<!'),
                  name: toSToken(name),
                  value,
               }),
               isUnparsed: false,
               isInternal: true,
               isLoading: false,
               waiters: [],
               entityLoc: 'predefined',
               protoReplacementText: value,
            };

            this.predefinedGeDetails[name] = result;
         }
      }

      return result;
   }

   private getInternalPEDetails(name: string): PrivatePEDetails | undefined {
      // Recall that !'' is the same as !undefined
      if (!name) {
         return;
      }

      return this.peDetails[name];
   }

   private getContentDetails(
      reference: GeneralEntityDeclarationPToken | ParameterEntityDeclarationPToken,
   ): PrivateGEDetails | PrivatePEDetails | undefined {
      const isPERef = reference instanceof ParameterEntityDeclarationPToken;
      const entityName = strOrBlank(reference.name);

      return isPERef
         ? this.getInternalPEDetails(entityName)
         : this.getInternalGEDetails(entityName);
   }
}

export { EntityDetails, GEDetails };
