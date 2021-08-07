/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import {
   ErrorCollector,
   ConformanceVersion,
   isSpace,
   error,
   ErrorToken,
   warning,
   WarningToken,
} from 'basic';
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

import { validityConstraint } from '../error/validityConstraint';
import { DeclarationDetails, ElDeclType, ValidateState } from '../validateState';

const EID = error.id;
const VID = validityConstraint.id;

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
   state: ValidateState,
   ec: ErrorCollector,
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
         // IS THIS use of isSpace() correct?  Spce is generally not 0x0085 by this point.  we may want to remove this, or modify isSpace() and repalce the various S regexp's we have.
         if (isSpace(char, version.version)) {
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
         ec.report(VID.ELEMENTDECL_PEREF_PARENS_UNBALANCED, [elName, entityName]);
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
         ec.reportError(warning.id.ELEMENTDECL_PEREF_EMPTY, WarningToken, [elName, entityName]);
      }

      // §3.2.1 For interoperability, ... neither the first nor last non-blank character
      //    of the replacement text should be a connector (| or ,).
      if (cmEndFound && trailingDelimiter) {
         ec.reportError(warning.id.ELEMENTDECL_PEREF_TRAILING_CONNECTOR, WarningToken, [
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
   declInfo: DeclarationDetails,
   state: ValidateState,
   ec: ErrorCollector,
   version: ConformanceVersion,
): void {
   const openSToken = elDecl.open;
   const elName = strOrBlank(elDecl.name);

   // §3.2.0: Validity constraint: Unique Element Type Declaration
   //    An element type must not be declared more than once.
   ec.setPos(openSToken);

   // §2.8.0: Validity Constraint: Proper Declaration/PE Nesting
   //    Parameter-entity replacement text must be properly nested with markup declarations.
   //    That is to say, if ... the last character of a markup declaration (markupdecl above)
   //    is contained in the replacement text for a parameter-entity reference,
   //    both [first and last char] must be contained in the same replacement text.
   // In this case, the first character was not, so make sure the last is not.
   if (elDecl.unexpanded && elDecl.extra) {
      const extraText = strOrBlank(elDecl.extra);

      ec.check(extraText.indexOf('>') !== -1, VID.PEREF_INVALID_END_NESTING, ['ELEMENT']);
   }

   ec.setPos(elDecl.name);
   ec.check(state.elementDeclarations[elName], VID.ELEMENT_EXTRA_DECLARATION, [elName]);

   if (!elDecl.contentModel) {
      return;
   }

   const contentNames = getElementNames(elDecl.contentModel);
   const undeclaredNames: Array<string> = [];

   ec.setPos(elDecl.contentModel.open);

   for (const name of contentNames) {
      if (!state.elementDeclarations[name] && name !== elName) {
         undeclaredNames.push(name);
      }
   }

   // §3.2.0: At user option, an XML processor may issue a warning when a declaration mentions an
   //    element type for which no declaration is provided, but this is not an error.
   if (undeclaredNames.length > 0) {
      ec.reportError(warning.id.ELEMENT_CHILD_UNDECLARED, WarningToken, [
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

      ec.check(duplicateNames.length > 0, VID.ELEMENTDECL_MIXED_DUPLICATE_NAME, [
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
         const state = declInfo.graph.states[Number(id)];

         for (const transName of Object.keys(state.trans)) {
            if (state.trans[transName].ref.indexOf(',') != -1) {
               cases.push(`${transName} (${state.trans[transName].ref})`);
            }
         }
      }

      if (cases.length > 0) {
         ec.reportError(EID.ELEMENTDECL_CONTENT_MODEL_NONDETERMINISTC, ErrorToken, [
            elName,
            cases.join(','),
         ]);
      }
   }

   if (declInfo.type === ElDeclType.ELEMENT || declInfo.type === ElDeclType.MIXED) {
      validateEntities(elDecl, elName, state, ec, version);
   }
}

export { elementDeclarationValidate };
