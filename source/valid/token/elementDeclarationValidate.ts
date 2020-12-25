/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { ErrorCollector, WellFormedError, XmlWarning } from 'error';
import { ContentModelP, ElementDeclarationPToken, isContentModelP } from 'pToken';
import { strOrBlank } from 'sToken';

import { ValidityError } from '../error/ValidityError';
import { ElDeclType, ValidateState } from '../validateState';

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
            childNames.push(name);
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
   const declInfo = state.elementDeclarations[elName];

   if (!declInfo) {
      return;
   }

   // §3.2.0: Validity constraint: Unique Element Type Declaration
   //    An element type must not be declared more than once.
   ec.setPos(openSToken);
   ec.setPos(elDecl.name);
   ec.check(declInfo.token !== elDecl, ValidityError.ID.ELEMENT_EXTRA_DECLARATION, [elName]);

   if (!elDecl.contentModel) {
      return;
   }

   const contentNames = getElementNames(elDecl.contentModel);
   const undeclaredNames: Array<string> = [];

   ec.setPos(elDecl.contentModel.open);

   for (const name of contentNames) {
      if (!state.elementDeclarations[name]) {
         undeclaredNames.push(name);
      }
   }

   // §3.2.0: At user option, an XML processor may issue a warning when a declaration mentions an
   //    element type for which no declaration is provided, but this is not an error.
   if (undeclaredNames.length > 0) {
      ec.reportError(XmlWarning.ID.ELEMENT_CHILD_UNDECLARED, XmlWarning, [
         elName,
         undeclaredNames.join(','),
      ]);
   }

   // §3.2.2: Validity constraint: No Duplicate Types
   //    The same name must not appear more than once in a single mixed-content declaration.
   if (declInfo.type === ElDeclType.MIXED && declInfo.duplicateNames.length > 0) {
      ec.report(ValidityError.ID.ELEMENTDECL_MIXED_DUPLICATE_NAME, [
         elName,
         declInfo.duplicateNames.join(','),
      ]);
   }

   if (declInfo.type === ElDeclType.CHILDREN) {
      // §3.2.1
      //   For compatibility, it is an error if an element in the document can
      //    match more than one occurrence of an element type in the content
      //    model. For more information, see "E. Deterministic Content Models".
      const cases: Array<string> = [];

      for (const id of Object.keys(declInfo.graph.states)) {
         const state = declInfo.graph.states[Number(id)];

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
            [elName, cases.join(',')],
         );
      }
   }
}

export { elementDeclarationValidate };
