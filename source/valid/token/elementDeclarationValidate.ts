/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { ErrorCollector, WellFormedError, XmlWarning } from 'error';
import { ContentModelP, ElementDeclarationPToken, isContentModelP } from 'pToken';
import { strOrBlank } from 'sToken';

import { ValidityError } from '../error/ValidityError';
import { makeCmGraph } from '../contentModal/makeCmGraph';

enum ElDeclType {
   ANY,
   CHILDREN,
   EMPTY,
   MIXED,
}

interface DeclarationDetails {
   token: ElementDeclarationPToken;
   type: ElDeclType;
}

interface ValidateState {
   elementDeclarations: {
      [name: string]: DeclarationDetails;
   };
}

function populateElementDeclaration(
   elDecl: ElementDeclarationPToken,
   state: ValidateState,
): DeclarationDetails | undefined {
   const elName = strOrBlank(elDecl.name);
   const ucSpec = strOrBlank(elDecl.contentSpec).toLocaleUpperCase();
   let type: ElDeclType = ElDeclType.EMPTY;

   if (state.elementDeclarations[elName]) {
      return undefined;
   }

   if (elDecl.contentModel) {
      type = ElDeclType.CHILDREN;

      if (
         'delimitedParticles' in elDecl.contentModel &&
         elDecl.contentModel.delimitedParticles.length > 0
      ) {
         const first = elDecl.contentModel.delimitedParticles[0];

         if (first.particle && 'name' in first.particle) {
            const name = strOrBlank(first.particle.name).toLocaleUpperCase();

            if (name === '#PCDATA') {
               type = ElDeclType.MIXED;
            }
         }
      }
   } else if (ucSpec === 'ANY') {
      type = ElDeclType.ANY;
   }

   state.elementDeclarations[elName] = {
      token: elDecl,
      type,
   };

   return state.elementDeclarations[elName];
}

function getElementNames(contentModel: ContentModelP): Array<string> {
   const childNames: Array<string> = [];

   for (const particle of contentModel.delimitedParticles) {
      const aParticle = particle.particle;

      if (!aParticle) {
         continue;
      }

      if (isContentModelP(aParticle)) {
         childNames.push(...getElementNames(aParticle));
      } else {
         const name = strOrBlank(aParticle.name);

         if (name !== '') {
            childNames.push();
         }
      }
   }

   return childNames;
}

function elementDeclarationValidate(
   elDecl: ElementDeclarationPToken,
   state: ValidateState,
   ec: ErrorCollector,
): void {
   const openSToken = elDecl.open;
   const elName = strOrBlank(elDecl.name);

   const declInfo = populateElementDeclaration(elDecl, state);

   // §3.2.0: Validity constraint: Unique Element Type Declaration
   //    An element type must not be declared more than once.
   ec.setPos(openSToken);
   ec.setPos(elDecl.name);
   ec.check(!declInfo, ValidityError.ID.ELEMENT_EXTRA_DECLARATION, [elName], openSToken);

   if (!declInfo || !elDecl.contentModel) {
      return;
   }

   const seenElements: { [name: string]: boolean } = {};
   const contentNames = getElementNames(elDecl.contentModel);

   ec.setPos(elDecl.contentModel.open);

   for (const name of contentNames) {
      // §3.2.0: At user option, an XML processor may issue a warning when a declaration mentions an
      //    element type for which no declaration is provided, but this is not an error.
      if (!state.elementDeclarations[name]) {
         ec.reportError(XmlWarning.ID.ELEMENT_CHILD_UNDECLARED, XmlWarning, [elName, name]);
      }

      if (declInfo.type !== ElDeclType.MIXED) {
         continue;
      }

      // §3.2.2: Validity constraint: No Duplicate Types
      //    The same name must not appear more than once in a single mixed-content declaration.
      if (seenElements[name]) {
         ec.report(ValidityError.ID.ELEMENTDECL_MIXED_DUPLICATE_NAME, [elName, name]);
      } else if (name && name.toLocaleUpperCase() !== '#PCDATA') {
         seenElements[name] = true;
      }
   }

   if (declInfo.type !== ElDeclType.MIXED) {
      const graph = makeCmGraph(elDecl.contentModel);

      // §3.2.1
      //   For compatibility, it is an error if an element in the document can
      //    match more than one occurrence of an element type in the content
      //    model. For more information, see "E. Deterministic Content Models".
      const cases: Array<string> = [];

      for (const id of Object.keys(graph.states)) {
         const state = graph.states[Number(id)];

         for (const transName of Object.keys(state.trans)) {
            if (state.trans[transName].ref.indexOf(',') != -1) {
               cases.push(`${transName} (${state.trans[transName].ref})`);
            }
         }
      }

      if (cases.length > 0) {
         ec.reportError(
            WellFormedError.ID.ELEMENTDECL_CONTENT_MODEL_NONDETERMINISTC,
            WellFormedError,
            [cases.join(',')],
         );
      }
   }
}

export { elementDeclarationValidate };
