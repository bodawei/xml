/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { ConformanceVersion } from 'basic';
import {
   AttDefinitionP,
   ElementDeclarationPToken,
   GeneralEntityDeclarationPToken,
   ParameterEntityDeclarationPToken,
   ParseToken,
} from 'pToken';
import { SToken } from 'sToken';
import {
   ConditionalPToken,
   DocTypeStartPToken,
   EntityValuePToken,
   ParameterEntityStartPToken,
} from 'token';
import { CmGraph } from '../contentModel/cmGraphTypes';

enum ElDeclType {
   ANY,
   ELEMENT,
   EMPTY,
   MIXED,
}

interface AnyDetails {
   token: ElementDeclarationPToken;
   type: ElDeclType.ANY;
   isExternalMarkupDeclaration: boolean;
}

interface EmptyDetails {
   token: ElementDeclarationPToken;
   type: ElDeclType.EMPTY;
   isExternalMarkupDeclaration: boolean;
}

interface MixedDetails {
   token: ElementDeclarationPToken;
   type: ElDeclType.MIXED;
   names: Array<string>;
   isExternalMarkupDeclaration: boolean;
}

interface ElementDetails {
   token: ElementDeclarationPToken;
   type: ElDeclType.ELEMENT;
   graph: CmGraph;
   isExternalMarkupDeclaration: boolean;
}

type DeclarationDetails = AnyDetails | EmptyDetails | MixedDetails | ElementDetails;

interface ParameterEntityDetails {
   isInternalValue: boolean;
   token: ParameterEntityDeclarationPToken;
   replacementText?: EntityValuePToken;
   isExternalMarkupDeclaration: boolean;
}

interface ElementContext {
   declDetails: DeclarationDetails;
   lastToken: ParseToken | undefined;
   parentName: string;
   stateId: number;
}

interface GeneralEntityDetails {
   token: GeneralEntityDeclarationPToken;
   isInternalValue: boolean;
   isExternalMarkupDeclaration: boolean;
}

type ReadonlyGeneralEntityDetails = Readonly<GeneralEntityDetails>;
type ReadonlyParameterEntityDetails = Readonly<ParameterEntityDetails>;

interface ValidateStateProps {
   docType?: string;
   attributeDefs?: {
      [elementName: string]: AttributeDefs | undefined;
   };

   generalEntities?: {
      [elementName: string]: GeneralEntityDetails;
   };

   notationDeclarations?: {
      [notationName: string]: true | undefined;
   };

   parameterEntities?: {
      [name: string]: ParameterEntityDetails;
   };

   elementDeclarations?: {
      [name: string]: DeclarationDetails | undefined;
   };

   ids?: {
      [id: string]: undefined | { elName: string; attName: string };
   };

   idRefs?: {
      [id: string]: undefined | { elName: string; attName: string; sToken: SToken };
   };

   elementContext?: {
      contextStack: ReadonlyArray<ElementContext>;
      activeContext?: ElementContext; // if this is undefined, contextStack is 0 length
      pastEnd: boolean; // when this is true, activeContext will be undefined
   };

   dtdContext?: {
      inExternalSubset?: boolean;
      inExternalMarkupContext?: boolean;
      enclosingStack: ReadonlyArray<
         DocTypeStartPToken | ParameterEntityStartPToken | ConditionalPToken
      >;
      lastPToken?: ParseToken;
   };

   hasExternalSubset?: boolean;
   hasPeRefs?: boolean;
   isStandalone?: boolean;
   confVer?: ConformanceVersion;
}

interface AttributeDefs {
   [attName: string]:
      | {
           readonly def: AttDefinitionP;
           readonly isExternalMarkupDeclaration: boolean;
        }
      | undefined;
}

interface IdMap {
   readonly [id: string]: undefined | { readonly elName: string; readonly attName: string };
}

interface IdRefDetails {
   readonly elName: string;
   readonly attName: string;
   readonly sToken: SToken;
}

interface IdRefMap {
   readonly [id: string]: undefined | IdRefDetails;
}

class ValidateState {
   readonly docType?: string;

   readonly attributeDefs: {
      readonly [elementName: string]: AttributeDefs | undefined;
   };

   readonly generalEntities: {
      readonly [elementName: string]: ReadonlyGeneralEntityDetails | undefined;
   };

   readonly ids: IdMap;

   readonly idRefs: IdRefMap;

   elementDeclarations: {
      [name: string]: DeclarationDetails | undefined;
   };

   readonly notationDeclarations: {
      readonly [notationName: string]: true | undefined;
   };

   readonly parameterEntities: {
      readonly [elementName: string]: ReadonlyParameterEntityDetails | undefined;
   };

   elementContext: {
      readonly contextStack: ReadonlyArray<ElementContext>;
      readonly activeContext?: ElementContext; // if this is undefined, contextStack is 0 length
      readonly pastEnd: boolean; // when this is true, activeContext will be undefined
   };

   readonly dtdContext: {
      readonly inExternalSubset: boolean;
      readonly enclosingStack: ReadonlyArray<
         DocTypeStartPToken | ParameterEntityStartPToken | ConditionalPToken
      >;
      readonly inExternalMarkupContext: boolean;
      readonly lastPToken?: ParseToken;
   };

   readonly isStandalone: boolean;

   readonly hasExternalSubset: boolean;

   readonly hasPeRefs: boolean;

   confVer: ConformanceVersion;

   constructor(otherState?: ValidateStateProps | ValidateState) {
      this.docType = otherState?.docType;
      this.attributeDefs = otherState?.attributeDefs || {};
      this.elementDeclarations = otherState?.elementDeclarations || {};
      // Too simplistic.
      this.generalEntities = otherState?.generalEntities ? { ...otherState.generalEntities } : {};
      this.notationDeclarations = { ...(otherState?.notationDeclarations ?? {}) };
      this.parameterEntities = otherState?.parameterEntities
         ? { ...otherState.parameterEntities }
         : {};
      this.ids = {
         ...(otherState?.ids ?? {}),
      };
      this.idRefs = {
         ...(otherState?.idRefs ?? {}),
      };
      this.elementContext = {
         activeContext: otherState?.elementContext?.activeContext,
         contextStack: otherState?.elementContext?.contextStack || [],
         pastEnd: otherState?.elementContext?.pastEnd || false,
      };
      this.dtdContext = {
         enclosingStack: otherState?.dtdContext?.enclosingStack ?? [],
         inExternalMarkupContext: !!otherState?.dtdContext?.inExternalMarkupContext,
         inExternalSubset: otherState?.dtdContext?.inExternalSubset ?? false,
         lastPToken: otherState?.dtdContext?.lastPToken,
      };
      this.hasExternalSubset = otherState?.hasExternalSubset ?? false;
      this.hasPeRefs = otherState?.hasPeRefs ?? false;
      this.isStandalone = otherState?.isStandalone ?? false;
      this.confVer = otherState?.confVer ?? new ConformanceVersion(1, 5);
   }
}

export {
   AttributeDefs,
   DeclarationDetails,
   ElementContext,
   ElDeclType,
   ValidateState,
   ValidateStateProps,
   IdRefDetails,
};
