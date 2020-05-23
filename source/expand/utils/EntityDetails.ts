import { strOrBlank } from 'sToken';
import {
   GENERAL_ENTITY_DECLARATION_PTOKEN,
   EntityValuePToken,
   GeneralEntityDeclarationPToken,
   GeneralEntityReferencePToken,
   ParameterEntityDeclarationPToken,
   ParameterEntityReferencePToken,
   XmlError,
} from 'token';

import { ExternalDtdSubsetPseudoToken } from './ExternalDtdSubsetPseudoToken';

type LoadingResult = {
   details: GeneralEntityInfo | ParameterEntityInfo | void;
   errors: Array<XmlError>;
};
type LoadingCallback = (result: LoadingResult) => void;

type GeneralEntityInfo = {
   token: GeneralEntityDeclarationPToken;
   isUnparsed: boolean;
   isInternal: boolean;
   isLoading: boolean;
   valueCache?: EntityValuePToken;
   waiters: Array<LoadingCallback>;
};

type ParameterEntityInfo = {
   token: ParameterEntityDeclarationPToken;
   isInternal: boolean;
   isLoading: boolean;
   valueCache?: EntityValuePToken; // This must be filled in if this is internal when the token is found. It must be filled in for external when asked
   waiters: Array<LoadingCallback>;
};

type GeneralEntityMap = {
   [entityName: string]: GeneralEntityInfo;
};

type ParameterEntityMap = {
   [entityName: string]: ParameterEntityInfo;
};

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

      if (this.hasEntity(pToken)) {
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
            this.geDetails[name].valueCache = expandedValue;
         }
      } else {
         this.peDetails[name] = {
            token: pToken,
            isInternal: !pToken.externalId,
            isLoading: false,
            waiters: [],
         };

         if (expandedValue) {
            this.peDetails[name].valueCache = expandedValue;
         }
      }
   }

   public getGeDetails(name: string): GeneralEntityInfo | void {
      // Recall that !'' is the same as !undefined
      if (!name) {
         return;
      }

      return this.geDetails[name];
   }

   public getPeDetails(name: string): ParameterEntityInfo | void {
      // Recall that !'' is the same as !undefined
      if (!name) {
         return;
      }

      return this.peDetails[name];
   }

   public getReferencedDetails(
      reference: ParameterEntityReferencePToken | GeneralEntityReferencePToken,
   ): GeneralEntityInfo | ParameterEntityInfo | void {
      const isPERef = reference instanceof ParameterEntityReferencePToken;
      const entityName = strOrBlank(reference.name);

      return isPERef ? this.getPeDetails(entityName) : this.getGeDetails(entityName);
   }

   public loadingEntity(
      declaration: ParameterEntityDeclarationPToken | GeneralEntityDeclarationPToken,
   ): void {
      const details = this.getDeclarationDetails(declaration);

      if (!details) {
         throw new Error(
            'Internal error: Trying to load the value of a declaration that has not been seen',
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
         details.valueCache = newValue;
      }

      if (details.waiters.length > 0) {
         const waiters = details.waiters;
         details.waiters = [];

         for (const waiter of waiters) {
            waiter({ details, errors });
         }
      }
   }

   private getDeclarationDetails(
      reference: GeneralEntityDeclarationPToken | ParameterEntityDeclarationPToken,
   ): GeneralEntityInfo | ParameterEntityInfo | void {
      const isPERef = reference instanceof ParameterEntityDeclarationPToken;
      const entityName = strOrBlank(reference.name);

      return isPERef ? this.getPeDetails(entityName) : this.getGeDetails(entityName);
   }
}

export { EntityDetails, GeneralEntityInfo };
