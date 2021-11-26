/* Copyright ® 2017-2021 by 柏大衛. All rights reserved. */

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
   ConditionalStartPToken,
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
   readonly isExternalMarkupDeclaration: boolean;
   // If we have no declaration for an element, we assume it is an ANY type, and do not have a declaration token
   readonly token?: ElementDeclarationPToken;
   readonly type: ElDeclType.ANY;
}

interface AttributeDetails {
   readonly def: AttDefinitionP;
   readonly isExternalMarkupDeclaration: boolean;
}

interface AttListDetails {
   readonly [attName: string]: AttributeDetails | undefined;
}

type ContentDetails = AnyDetails | EmptyDetails | MixedDetails | ElementDetails;

interface ElementContext {
   readonly details: ContentDetails;
   readonly lastToken: ParseToken | undefined;
   readonly parentName: string;
   readonly stateId: number;
}

interface ElementDetails {
   readonly token: ElementDeclarationPToken;
   readonly type: ElDeclType.ELEMENT;
   readonly graph: CmGraph;
   readonly isExternalMarkupDeclaration: boolean;
}

interface EmptyDetails {
   readonly token: ElementDeclarationPToken;
   readonly type: ElDeclType.EMPTY;
   readonly isExternalMarkupDeclaration: boolean;
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

interface MixedDetails {
   readonly isExternalMarkupDeclaration: boolean;
   readonly names: ReadonlyArray<string>;
   readonly token: ElementDeclarationPToken;
   readonly type: ElDeclType.MIXED;
}

interface GeneralEntityDetails {
   readonly isExternalMarkupDeclaration: boolean;
   readonly isInternalValue: boolean;
   readonly token: GeneralEntityDeclarationPToken;
}

interface ParameterEntityDetails {
   readonly isExternalMarkupDeclaration: boolean;
   readonly isInternalValue: boolean;
   readonly replacementText?: EntityValuePToken;
   readonly token: ParameterEntityDeclarationPToken;
}

/*
 * Mutable and optional-prop version of the main type
 * See also: https://github.com/microsoft/TypeScript/issues/24509
 */
interface ValidityStateProps {
   attributes?: {
      [elementName: string]: AttListDetails | undefined;
   };

   confVer?: ConformanceVersion;

   docType?: string;

   dtdContext?: {
      inExternalSubset: boolean;
      inExternalMarkupContext: boolean;
      enclosingStack: ReadonlyArray<
         DocTypeStartPToken | ParameterEntityStartPToken | ConditionalStartPToken
      >;
      lastPToken?: ParseToken;
   };

   elementContext?: {
      contextStack: ReadonlyArray<ElementContext>;
      pastEnd: boolean;
   };

   elements?: {
      [name: string]: ContentDetails | undefined;
   };

   generalEntities?: {
      [elementName: string]: GeneralEntityDetails | undefined;
   };

   hasExternalSubset?: boolean;

   hasPeRefs?: boolean;

   idRefs?: {
      [id: string]: undefined | { attName: string; elName: string; sToken: SToken };
   };

   ids?: {
      [id: string]: undefined | { attName: string; elName: string };
   };

   isStandalone?: boolean;

   notations?: {
      [notationName: string]: true | undefined;
   };

   parameterEntities?: {
      [name: string]: ParameterEntityDetails | undefined;
   };
}

class ValidityState {
   readonly attributes: {
      readonly [elementName: string]: AttListDetails | undefined;
   };

   readonly confVer: ConformanceVersion;

   readonly docType?: string;

   readonly dtdContext: {
      readonly enclosingStack: ReadonlyArray<
         DocTypeStartPToken | ParameterEntityStartPToken | ConditionalStartPToken
      >;
      readonly inExternalMarkupContext: boolean;
      readonly inExternalSubset: boolean;
      readonly lastPToken?: ParseToken;
   };

   readonly elementContext: {
      readonly contextStack: ReadonlyArray<ElementContext>;
      readonly pastEnd: boolean;
   };

   readonly generalEntities: {
      readonly [elementName: string]: GeneralEntityDetails | undefined;
   };

   readonly hasExternalSubset: boolean;

   readonly hasPeRefs: boolean;

   readonly ids: IdMap;

   readonly idRefs: IdRefMap;

   readonly isStandalone: boolean;

   readonly elements: {
      readonly [name: string]: ContentDetails | undefined;
   };

   readonly notations: {
      readonly [notationName: string]: true | undefined;
   };

   readonly parameterEntities: {
      readonly [elementName: string]: ParameterEntityDetails | undefined;
   };

   /*
    * Not especially intuitive: this MERGES the "tables" of base and other
    * e.g. attributes, elements, general and parameter entities, ids, idrefs, and notations
    * but replaces the contexts and other individual values. This is not exactly
    * predictable, but in practice is much more convenient.
    */
   constructor(baseState: ValidityStateProps | ValidityState = {}, other: ValidityStateProps = {}) {
      this.attributes = { ...baseState.attributes, ...other.attributes };
      this.confVer = other.confVer ?? baseState.confVer ?? new ConformanceVersion(1, 5);
      this.docType = other.docType ?? baseState.docType;
      this.dtdContext = other.dtdContext ??
         baseState.dtdContext ?? {
            enclosingStack: [],
            inExternalMarkupContext: false,
            inExternalSubset: false,
            lastPToken: undefined,
         };
      this.elementContext = other.elementContext ??
         baseState.elementContext ?? {
            contextStack: [],
            pastEnd: false,
         };
      this.elements = { ...baseState.elements, ...other.elements };
      this.generalEntities = { ...baseState.generalEntities, ...other.generalEntities };
      this.hasExternalSubset = other.hasExternalSubset ?? baseState.hasExternalSubset ?? false;
      this.hasPeRefs = other.hasPeRefs ?? baseState.hasPeRefs ?? false;
      this.idRefs = { ...baseState.idRefs, ...other.idRefs };
      this.ids = { ...baseState.ids, ...other.ids };
      this.isStandalone = other.isStandalone ?? baseState.isStandalone ?? false;
      this.notations = { ...baseState.notations, ...other.notations };
      this.parameterEntities = { ...baseState.parameterEntities, ...other.parameterEntities };
   }
}

export {
   AttListDetails,
   AttributeDetails,
   ContentDetails,
   ElementContext,
   ElDeclType,
   IdRefDetails,
   IdMap,
   IdRefMap,
   ValidityState,
};
