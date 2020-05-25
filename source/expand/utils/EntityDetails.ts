/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { strOrBlank } from 'sToken';
import {
   GENERAL_ENTITY_DECLARATION_PTOKEN,
   EntityValuePToken,
   ExternalId,
   GeneralEntityDeclarationPToken,
   GeneralEntityReferencePToken,
   ParameterEntityDeclarationPToken,
   ParameterEntityReferencePToken,
   XmlError,
} from 'token';

import { ExternalDtdSubsetPseudoToken } from './ExternalDtdSubsetPseudoToken';

type LoadingResult = {
   details: InternalGEDetails | InternalPEDetails | void;
   errors: Array<XmlError>;
};
type LoadingCallback = (result: LoadingResult) => void;

type InternalGEDetails = {
   token: GeneralEntityDeclarationPToken;
   isUnparsed: boolean;
   isInternal: boolean;
   isLoading: boolean;
   protoReplacementText?: EntityValuePToken;
   waiters: Array<LoadingCallback>;
};

type InternalPEDetails = {
   token: ParameterEntityDeclarationPToken;
   isInternal: boolean;
   isLoading: boolean;
   protoReplacementText?: EntityValuePToken; // This must be filled in if this is internal when the token is found. It must be filled in for external when asked
   waiters: Array<LoadingCallback>;
};

type GeneralEntityMap = {
   [entityName: string]: InternalGEDetails;
};

type ParameterEntityMap = {
   [entityName: string]: InternalPEDetails;
};

// No reason for anyone externally to see the waiters property.
type PEDetails = Readonly<Omit<InternalPEDetails, 'waiters'>>;
type GEDetails = Readonly<Omit<InternalGEDetails, 'waiters'>>;

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
   private geDetails: GeneralEntityMap;
   private peDetails: ParameterEntityMap;

   constructor() {
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

   public addEntity(
      pToken: GeneralEntityDeclarationPToken | ParameterEntityDeclarationPToken,
      expandedValue?: EntityValuePToken,
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
            waiters: [],
         };

         if (expandedValue) {
            this.geDetails[name].protoReplacementText = expandedValue;
         }
      } else {
         this.peDetails[name] = {
            token: pToken,
            isInternal: !pToken.externalId,
            isLoading: false,
            waiters: [],
         };

         if (expandedValue) {
            this.peDetails[name].protoReplacementText = expandedValue;
         }
      }
   }

   public getGEDetails(name: string): GEDetails | void {
      return this.getInternalGEDetails(name);
   }

   public getPEDetails(name: string): PEDetails | void {
      return this.getInternalPEDetails(name);
   }

   public getReferencedDetails(
      reference: ParameterEntityReferencePToken | GeneralEntityReferencePToken,
   ): GEDetails | PEDetails | void {
      const isPERef = reference instanceof ParameterEntityReferencePToken;
      const entityName = strOrBlank(reference.name);

      return isPERef ? this.getPEDetails(entityName) : this.getGEDetails(entityName);
   }

   public addExternalSubset(externalId: ExternalId): void {
      this.externalSubset = new ExternalDtdSubsetPseudoToken(externalId);
   }

   public getExternalSubsetReference(): ExternalDtdSubsetPseudoToken | void {
      return this.externalSubset;
   }

   public loadingEntity(
      declaration: ParameterEntityDeclarationPToken | GeneralEntityDeclarationPToken,
   ): void {
      const details = this.getDeclarationDetails(declaration);

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
      const details = this.getDeclarationDetails(declaration);

      if (!details || !details.isLoading) {
         setTimeout(() => callback({ details, errors: [] }), 0);
         return;
      }

      details.waiters.push(callback);
   }

   public updateDeclaredValue(
      declaration: ParameterEntityDeclarationPToken | GeneralEntityDeclarationPToken,
      newValue: EntityValuePToken | void,
      errors: Array<XmlError>,
   ): void {
      const details = this.getDeclarationDetails(declaration);

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
            waiter({ details, errors });
         }
      }
   }

   private getInternalGEDetails(name: string): InternalGEDetails | void {
      // Recall that !'' is the same as !undefined
      if (!name) {
         return;
      }

      return this.geDetails[name];
   }

   private getInternalPEDetails(name: string): InternalPEDetails | void {
      // Recall that !'' is the same as !undefined
      if (!name) {
         return;
      }

      return this.peDetails[name];
   }

   private getDeclarationDetails(
      reference: GeneralEntityDeclarationPToken | ParameterEntityDeclarationPToken,
   ): InternalGEDetails | InternalPEDetails | void {
      const isPERef = reference instanceof ParameterEntityDeclarationPToken;
      const entityName = strOrBlank(reference.name);

      return isPERef
         ? this.getInternalPEDetails(entityName)
         : this.getInternalGEDetails(entityName);
   }
}

export { EntityDetails, GEDetails };
