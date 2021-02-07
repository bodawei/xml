/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { AttDefinitionP, ElementDeclarationPToken, ParameterEntityDeclarationPToken } from 'pToken';
import { EntityValuePToken } from 'token';
import { CmGraph } from './contentModal/cmGraphTypes';

enum ElDeclType {
   ANY,
   CHILDREN,
   EMPTY,
   MIXED,
}

interface AnyDetails {
   token: ElementDeclarationPToken;
   type: ElDeclType.ANY;
}

interface EmptyDetails {
   token: ElementDeclarationPToken;
   type: ElDeclType.EMPTY;
}

interface MixedDetails {
   token: ElementDeclarationPToken;
   type: ElDeclType.MIXED;
   names: Array<string>;
   duplicateNames: Array<string>;
}

interface ChildrenDetails {
   token: ElementDeclarationPToken;
   type: ElDeclType.CHILDREN;
   graph: CmGraph;
}

type DeclarationDetails = AnyDetails | EmptyDetails | MixedDetails | ChildrenDetails;

interface ParameterEntityDetails {
   isInternal: boolean;
   token: ParameterEntityDeclarationPToken;
   replacementText?: EntityValuePToken;
}

interface ElementContext {
   declDetails: DeclarationDetails;
   parentName: string;
   stateId: number;
}

interface GeneralEntityDetails {
   isInternal: boolean;
}

type ReadonlyGeneralEntityDetails = Readonly<GeneralEntityDetails>;
type ReadonlyParameterEntityDetails = Readonly<ParameterEntityDetails>;

interface ValidateStateProps {
   attributeDefs?: {
      [elementName: string]: AttributeDefs;
   };

   generalEntities?: {
      [elementName: string]: GeneralEntityDetails;
   };

   parameterEntities?: {
      [name: string]: ParameterEntityDetails;
   };

   elementDeclarations?: {
      [name: string]: DeclarationDetails;
   };

   elementContext?: {
      contextStack: ReadonlyArray<ElementContext>;
      activeContext?: ElementContext; // if this is undefined, contextStack is 0 length
      pastEnd: boolean; // when this is true, activeContext will be undefined
   };

   inExternalSubset?: boolean;
   isStandalone?: boolean;
}

interface AttributeDefs {
   [attName: string]:
      | {
           readonly def: AttDefinitionP;
           readonly isExternal: boolean;
        }
      | undefined;
}

class ValidateState {
   readonly inExternalSubset: boolean;

   readonly attributeDefs: {
      readonly [elementName: string]: AttributeDefs | undefined;
   };

   readonly generalEntities: {
      readonly [elementName: string]: ReadonlyGeneralEntityDetails;
   };

   elementDeclarations: {
      [name: string]: DeclarationDetails | undefined;
   };

   readonly parameterEntities: {
      readonly [elementName: string]: ReadonlyParameterEntityDetails;
   };

   elementContext: {
      readonly contextStack: ReadonlyArray<ElementContext>;
      readonly activeContext?: ElementContext; // if this is undefined, contextStack is 0 length
      readonly pastEnd: boolean; // when this is true, activeContext will be undefined
   };

   readonly isStandalone: boolean;

   constructor(otherState?: ValidateStateProps) {
      this.attributeDefs = otherState?.attributeDefs || {};
      this.elementDeclarations = otherState?.elementDeclarations || {};
      // Too simplistic.
      this.generalEntities = otherState?.generalEntities ? { ...otherState.generalEntities } : {};
      this.parameterEntities = otherState?.parameterEntities
         ? { ...otherState.parameterEntities }
         : {};
      this.elementContext = {
         contextStack: otherState?.elementContext?.contextStack || [],
         activeContext: otherState?.elementContext?.activeContext,
         pastEnd: otherState?.elementContext?.pastEnd || false,
      };
      this.isStandalone = otherState?.isStandalone ?? false;
      this.inExternalSubset = otherState?.inExternalSubset ?? false;
   }
}

export { AttributeDefs, DeclarationDetails, ElementContext, ElDeclType, ValidateState };
