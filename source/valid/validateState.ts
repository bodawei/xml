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

interface ValidateState {
   elementDeclarations: {
      [name: string]: DeclarationDetails;
   };
   parameterEntities: {
      [name: string]: ParameterEntityDetails;
   };
}

export { DeclarationDetails, ElDeclType, ValidateState };
