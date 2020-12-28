/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { ElementDeclarationPToken, ParameterEntityDeclarationPToken } from 'pToken';
import { ElidedEntityDeclarationPToken } from 'token';
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
   token: ParameterEntityDeclarationPToken;
   replacementText: ElidedEntityDeclarationPToken;
}

interface ElementContext {
   declDetails: DeclarationDetails;
   parentName: string;
   stateId: number;
}

interface ValidateStateProps {
   elementDeclarations?: {
      [name: string]: DeclarationDetails;
   };

   parameterEntities?: {
      [name: string]: ParameterEntityDetails;
   };

   elementContext?: {
      contextStack: ReadonlyArray<ElementContext>;
      activeContext?: ElementContext; // if this is undefined, contextStack is 0 length
      pastEnd: boolean; // when this is true, activeContext will be undefined
   };
}

class ValidateState {
   elementDeclarations: {
      [name: string]: DeclarationDetails;
   };

   parameterEntities: {
      [name: string]: ParameterEntityDetails;
   };

   elementContext: {
      readonly contextStack: ReadonlyArray<ElementContext>;
      readonly activeContext?: ElementContext; // if this is undefined, contextStack is 0 length
      readonly pastEnd: boolean; // when this is true, activeContext will be undefined
   };

   constructor(otherState?: ValidateStateProps) {
      this.elementDeclarations = otherState?.elementDeclarations || {};
      this.parameterEntities = otherState?.parameterEntities || {};
      this.elementContext = {
         contextStack: otherState?.elementContext?.contextStack || [],
         activeContext: otherState?.elementContext?.activeContext,
         pastEnd: otherState?.elementContext?.pastEnd || false,
      };
   }
}

export { DeclarationDetails, ElementContext, ElDeclType, ValidateState };
