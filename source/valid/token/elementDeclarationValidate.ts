/* Copyright ® 2017-2020 by 柏大衛. All rights reserved. */

import { ErrorCollector, ConformanceVersion, isSpace, XmlWarning } from 'basic';
import {
   TEXT_PTOKEN,
   ContentModelP,
   ElementDeclarationPToken,
   isContentModelP,
   UnexpandedMarkupToken,
} from 'pToken';
import { strOrBlank } from 'sToken';
import { WellFormedError } from 'wellformedness';
import {
   EntityValuePToken,
   PARAMETER_ENTITY_REFERENCE_PTOKEN,
   CHARREF_PTOKEN,
   PARAMETER_ENTITY_START_PTOKEN,
   PARAMETER_ENTITY_END_PTOKEN,
} from 'token';

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

         if (name !== '' && name.toUpperCase() !== '#PCDATA') {
            childNames.push(name);
         }
      }
   }

   return childNames;
}

/*
 * Given an EntityValuePToken, extract all the textual information in it and insert that
 * into an STokenSource, returning that.
 */
function textFromEntityValue(entityValue: EntityValuePToken): string {
   const result: Array<string> = [];

   for (const element of entityValue) {
      switch (element.type) {
         case PARAMETER_ENTITY_START_PTOKEN:
         case PARAMETER_ENTITY_END_PTOKEN:
         case PARAMETER_ENTITY_REFERENCE_PTOKEN:
            break;
         case CHARREF_PTOKEN:
            result.push(element.char);
            break;
         case TEXT_PTOKEN:
            result.push(strOrBlank(element.text));
            break;
      }
   }

   return result.join('');
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

      const replacementText = textFromEntityValue(details.replacementText.value);
      let depth = 0;
      let space = 0;
      let nonSpace = 0;
      let trailingDelimiter = false;
      let seenCloseParen = false;

      for (const char of replacementText) {
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
         ec.report(ValidityError.ID.ELEMENTDECL_PEREF_PARENS_UNBALANCED, [elName, entityName]);
      }

      // §3.2.1 For interoperability, if a parameter-entity reference appears
      //    in a choice, seq, or Mixed construct, its replacement text should
      //    not be empty ...
      //    (1.0/2 changes this to "replacement text should contain at least one non-blank character"
      const hasEmptyContent =
         (version.version === 1 && version.revision === 1 && space === 0 && nonSpace === 0) ||
         (((version.version === 1 && version.revision > 1) || version.version > 1) &&
            nonSpace === 0);

      if (cmEndFound && hasEmptyContent) {
         ec.reportError(XmlWarning.ID.ELEMENTDECL_PEREF_EMPTY, XmlWarning, [elName, entityName]);
      }

      // §3.2.1 For interoperability, ... neither the first nor last non-blank character
      //    of the replacement text should be a connector (| or ,).
      if (cmEndFound && trailingDelimiter) {
         ec.reportError(XmlWarning.ID.ELEMENTDECL_PEREF_TRAILING_CONNECTOR, XmlWarning, [
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
   state: ValidateState,
   ec: ErrorCollector,
   version: ConformanceVersion,
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

   if (declInfo.type === ElDeclType.CHILDREN || declInfo.type === ElDeclType.MIXED) {
      validateEntities(elDecl, elName, state, ec, version);
   }
}

export { elementDeclarationValidate };
