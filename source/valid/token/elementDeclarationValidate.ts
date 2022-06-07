/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { Collector, ConformanceVersion, isSpace } from 'basic';
import {
   PARAMETER_ENTITY_REFERENCE_PTOKEN,
   TEXT_PTOKEN,
   ContentModelP,
   ElementDeclarationPToken,
   isContentModelP,
   UnexpandedMarkupToken,
   pTokenArrayToString,
} from 'pToken';
import { strOrBlank } from 'sToken';

import { ContentDetails, ElDeclType, ValidityState } from '../common/validityState';
import { Error } from '../error/error';
import { errorCodes } from '../error/errorCodes';
import { validityErrorCodes } from '../error/validityErrorCodes';
import { Warning } from '../error/warning';
import { warningCodes } from '../error/warningCodes';

const EID = errorCodes.id;
const VID = validityErrorCodes.id;

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

         if (name !== '' && name.toUpperCase() !== '#PCDATA') {
            childNames.push(name);
         }
      }
   }

   return childNames;
}

function validateEntities(
   elDecl: ElementDeclarationPToken,
   elName: string,
   state: ValidityState,
   coll: Collector,
   version: ConformanceVersion,
): void {
   if (!elDecl.unexpanded) {
      return;
   }

   const unexpandedTokens: Array<UnexpandedMarkupToken> = [...elDecl.unexpanded.tokens];
   let cmEndFound = false;
   let cmDepth = 0;

   /*
    * Loop backwards over the unexpanded tokens. This will allow us to figure out where the
    * last ")" is, and thus the place we should start checking for certain problems.
    * This isn't entirely satisfactory (if the "()"s are unbalanced, we may report
    * some erronious errors, though other legtimate errors will be reported which will
    * lead to fixing these). We would need better details in the unexpanded structure
    * for the "midSpec" case than we get at the moment.
    */
   for (let index = unexpandedTokens.length - 1; index >= 0; index--) {
      const token = unexpandedTokens[index];

      if (token.type !== PARAMETER_ENTITY_REFERENCE_PTOKEN) {
         switch (token.type) {
            case TEXT_PTOKEN:
               const contents = strOrBlank(token.text);

               for (let cIndex = contents.length - 1; cIndex >= 0; cIndex--) {
                  const char = contents[cIndex];

                  if (char === ')') {
                     cmDepth++;
                     cmEndFound = true;
                  } else if (char === '(' && cmEndFound) {
                     cmDepth--;
                  }
               }
               break;
         }

         continue;
      }

      // If we found the end of a content spec, and while going through a text we already found
      // the start of the content model, do not examine any more.
      if (cmEndFound && cmDepth === 0) {
         break;
      }

      const entityName = strOrBlank(token.name);
      const details = state.parameterEntities[entityName];

      if (!details || !details.replacementText) {
         continue;
      }

      const replacementText = pTokenArrayToString(details.replacementText);
      let depth = 0;
      let space = 0;
      let nonSpace = 0;
      let trailingDelimiter = false;
      let seenCloseParen = false;

      for (const char of replacementText) {
         if (isSpace(char)) {
            space++;
         } else {
            nonSpace++;
            trailingDelimiter = false;

            if (char === '(') {
               depth--;
            } else {
               if (char === ')') {
                  depth++;
                  seenCloseParen = true;
               } else if (char === ',' || char === '|') {
                  trailingDelimiter = true;
               }
            }
         }
      }

      // §3.2.1 Validity Constraint: Proper Group/PE Nesting
      //    Parameter-entity replacement text must be properly nested with
      //    parenthetized groups. That is to say, if either of the opening or
      //    closing parentheses in a choice, seq, or Mixed construct is
      //    contained in the replacement text for a parameter entity, both
      //    must be contained in the same replacement text.
      if (depth !== 0) {
         coll.report(VID.PEREF_PARENS_UNBALANCED, [elName, entityName]);
      }

      // §3.2.1 For interoperability, if a parameter-entity reference appears
      //    in a choice, seq, or Mixed construct, its replacement text should
      //    not be empty ...
      //    (1.0/2 changes this to "replacement text should contain at least one non-blank character"
      const hasEmptyContent =
         (version.version === 1 && version.edition === 1 && space === 0 && nonSpace === 0) ||
         (((version.version === 1 && version.edition > 1) || version.version > 1) &&
            nonSpace === 0);

      if (cmEndFound && hasEmptyContent) {
         coll.reportProblem(Warning, warningCodes.id.PEREF_NO_EMPTY_IN_MODEL, [elName, entityName]);
      }

      // §3.2.1 For interoperability, ... neither the first nor last non-blank character
      //    of the replacement text should be a connector (| or ,).
      if (cmEndFound && trailingDelimiter) {
         coll.reportProblem(Warning, warningCodes.id.PEREF_NO_TRAILING_CONNECTOR, [
            elName,
            entityName,
         ]);
      }

      cmDepth += depth;
      cmEndFound = cmEndFound || seenCloseParen;
   }
}

function elementDeclarationValidate(
   elDecl: ElementDeclarationPToken,
   declInfo: ContentDetails,
   state: ValidityState,
   coll: Collector,
): void {
   const openSToken = elDecl.open;
   const elName = strOrBlank(elDecl.name);
   const version = state.confVer;

   coll.setPos(openSToken);

   // §2.8.0: Validity Constraint: Proper Declaration/PE Nesting
   //    Parameter-entity replacement text must be properly nested with markup declarations.
   //    That is to say, if ... the last character of a markup declaration (markupdecl above)
   //    is contained in the replacement text for a parameter-entity reference,
   //    both [first and last char] must be contained in the same replacement text.
   // In this case, the first character was not, so make sure the last is not.
   if (elDecl.unexpanded && elDecl.extra) {
      const extraText = strOrBlank(elDecl.extra);

      coll.check(extraText.indexOf('>') !== -1, VID.PEREF_INVALID_END_NESTING, ['ELEMENT']);
   }

   coll.setPos(elDecl.name);

   // §3.2.0: Validity constraint: Unique Element Type Declaration
   //    An element type must not be declared more than once.
   coll.check(state.elements[elName], VID.ELEMENT_XTRA_DECLARATION, [elName]);

   if (!elDecl.contentModel) {
      return;
   }

   const contentNames = getElementNames(elDecl.contentModel);
   const undeclaredNames: Array<string> = [];

   coll.setPos(elDecl.contentModel.open);

   for (const name of contentNames) {
      if (!state.elements[name] && name !== elName) {
         undeclaredNames.push(name);
      }
   }

   // §3.2.0: At user option, an XML processor may issue a warning when a declaration mentions an
   //    element type for which no declaration is provided, but this is not an error.
   if (undeclaredNames.length > 0) {
      coll.reportProblem(Warning, warningCodes.id.ELEMENT_CHILD_UNDECLARED, [
         elName,
         undeclaredNames.join(','),
      ]);
   }

   // §3.2.2: Validity constraint: No Duplicate Types
   //    The same name must not appear more than once in a single mixed-content declaration.
   if (declInfo.type === ElDeclType.MIXED) {
      const duplicateNames: Array<string> = [];
      const seenNames: Record<string, boolean> = {};

      for (const name of declInfo.names) {
         if (seenNames[name]) {
            duplicateNames.push(name);
         } else {
            seenNames[name] = true;
         }
      }

      coll.check(duplicateNames.length > 0, VID.ELEMENTDECL_XTRA_MIXED_NAME, [
         elName,
         duplicateNames.join(','),
      ]);
   }

   if (declInfo.type === ElDeclType.ELEMENT) {
      // §3.2.1
      //   For compatibility, it is an error if an element in the document can
      //    match more than one occurrence of an element type in the content
      //    model. For more information, see "E. Deterministic Content Models".
      const cases: Array<string> = [];

      for (const id of Object.keys(declInfo.graph.states)) {
         const thisState = declInfo.graph.states[Number(id)];

         for (const transName of Object.keys(thisState.trans)) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            if (thisState.trans[transName]!.ref.indexOf(',') !== -1) {
               // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
               cases.push(`${transName} (${thisState.trans[transName]!.ref})`);
            }
         }
      }

      if (cases.length > 0) {
         coll.reportProblem(Error, EID.ELEMENTDECL_CONTENTMODEL_NONDETERMINISTC, [
            elName,
            cases.join(','),
         ]);
      }
   }

   validateEntities(elDecl, elName, state, coll, version);
}

export { elementDeclarationValidate };
