/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { ElementDeclarationPToken } from 'pToken';
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

interface ValidateState {
   elementDeclarations: {
      [name: string]: DeclarationDetails;
   };
}

export { DeclarationDetails, ElDeclType, ValidateState };
