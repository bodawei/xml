import { ErrorCollector, ConformanceVersion } from 'basic';
import { SToken, strOrBlank } from 'sToken';
import {
   CHARREF_PTOKEN,
   GENERAL_ENTITY_REFERENCE_PTOKEN,
   PARAMETER_ENTITY_REFERENCE_PTOKEN,
   TEXT_PTOKEN,
   ParseToken,
   GeneralEntityDeclarationPToken,
   GeneralEntityReferencePToken,
   ParameterEntityDeclarationPToken,
   ParameterEntityReferencePToken,
} from 'pToken';
import { WellFormedError } from './error/WellFormedError';
import {
   GENERAL_ENTITY_END_PTOKEN,
   GENERAL_ENTITY_START_PTOKEN,
   PARAMETER_ENTITY_END_PTOKEN,
   PARAMETER_ENTITY_START_PTOKEN,
   ElementEmptyPToken,
   ElementStartPToken,
   GeneralEntityStartPToken,
   InternalSubsetStartToken,
   ExternalSubsetStartToken,
   ParameterEntityStartPToken,
   ConditionalPToken,
} from 'token';
import { AttributePToken } from '../token/common/attribute';
import { LiteralValuePToken } from 'source/token/common/literal';

type ContentStart = ElementStartPToken | ElementEmptyPToken | GeneralEntityStartPToken;

type MarkupStart =
   | InternalSubsetStartToken
   | ExternalSubsetStartToken
   | ParameterEntityStartPToken
   | ConditionalPToken;

interface GeneralEntitiesInfo {
   [name: string]:
      | {
           token: GeneralEntityDeclarationPToken;
           declaredInInternalSubset: boolean;
        }
      | undefined;
}

interface ParameterEntitiesInfo {
   [name: string]: ParameterEntityDeclarationPToken | undefined; // https://stackoverflow.com/questions/61493377/typescript-returned-type-when-accessing-undefined-key-on-object-is-wrong
}

interface MarkupChecker {
   check(pToken: ParseToken, errorCollector: ErrorCollector): undefined | typeof CHECKER_DONE;
}

interface ContentChecker {
   check(pToken: ParseToken, errorCollector: ErrorCollector): undefined | typeof CHECKER_DONE;
   isDone: boolean;
}

interface ContentCheckerConstructor {
   new (
      start: ContentStart,
      ec: ErrorCollector,
      checkState: CheckState,
      geContext: Array<string>,
   ): ContentChecker;
}

interface MarkupCheckerConstructor {
   new (
      start: MarkupStart,
      ec: ErrorCollector,
      checkState: CheckState,
      geContext: Array<string>,
   ): MarkupChecker;
}

const CHECKER_DONE = '**Checker Done**';

const WFID = WellFormedError.ID;
const PROTECTED_ENTITIES = ['amp', 'lt', 'gt', 'apos', 'quot'];

class CheckState {
   public confVer: ConformanceVersion = new ConformanceVersion();

   public generalDecls: GeneralEntitiesInfo = {};

   public paramDecls: ParameterEntitiesInfo = {};

   // public hasAllDecls: boolean = true; // if not validating, a peref got in the way.
   public peRefCount = 0;

   public isStandalone = false;

   public hasNoDTD = false;

   public hasExternalDTD = false;
}

// §3.1.0: Well-Formedness Constraint: No External Entity References
//    Attribute values must not contain direct or indirect entity
//    references to external entities.
function checkForExternalEntity(
   value: LiteralValuePToken,
   paramDecls: ParameterEntitiesInfo,
   ec: ErrorCollector,
   open: SToken,
): void {
   for (const item of value) {
      let ref: ParameterEntityReferencePToken | undefined;

      if (item.type === PARAMETER_ENTITY_START_PTOKEN) {
         ref = item.referencePToken;
      } else if (item.type === PARAMETER_ENTITY_REFERENCE_PTOKEN) {
         ref = item;
      }

      if (!ref) {
         continue;
      }

      const name = strOrBlank(ref.name);
      const decl = paramDecls[name];

      if (!decl) {
         continue;
      }

      ec.check(decl.externalId, WFID.ATTRIBUTE_INVALID_REFERENCE, [name], open);

      checkForExternalEntity(decl.value, paramDecls, ec, open);
   }
}

/*
 * §4.1.0: Well-formedness constraint: Entity Declared
 *    In a document without any DTD, a document with only an internal DTD subset which
 *    contains no parameter entity references, or a document with " standalone='yes' ",
 *    for an entity reference that does not occur within the external subset or a
 *    parameter entity, the Name given in the entity reference must match that in
 *    an entity declaration that does not occur within the external subset or
 *    a parameter entity, except that well-formed documents need not declare any of
 *    the following entities: amp, lt, gt, apos, quot.  The declaration of a general
 *    entity must precede any reference to it which appears in a default value in
 *    an attribute-list declaration.
 *    Note that non-validating processors are not obligated to read and process
 *    entity declarations occurring in parameter entities or in the external subset;
 *    for such documents, the rule that an entity must be declared is a well-formedness
 *    constraint only if standalone='yes'.
 *
 * Translation:
 *    If all entity declarations are visibile to a non-validating processor (that is,
 *    there is no dtd, an internal dtd with nothing hidden in parameter entities,
 *    or standalone=yes (which might have an external subset or parm entities, but
 *    we are told they have nothing of significance)), then we can be confident
 *    that we know all the possible entity declarations. As such, if we find an
 *    entity reference, and there is no declaration for it, it is an error.
 *
 *    Or, closer to what this actually does: If we have any reason to believe we
 *    don't have access to all the possible declarations, then don't report an error.
 *
 *    Let's look at the cases this can't address:
 *    - If there is a DTD, and some of it is external, we may or may not have
 *      a declaration in that external DTD subset. So, if we find a reference,
 *      and we are not doing a full validation pass, we won't have read in the
 *      external subset, and so won't know if the reference is correct.
 *    - If there is a DTD, but only internal, and there are parameter entity
 *      references in that internal subset (outside of markup!), those parameter
 *      entity values may contain other entity declarations. Similarly, then,
 *      if we are not doing a full validation process, then we won't expand
 *      those entities and so won't discover the declarations. Thus, when we
 *      find a general entity reference, and find no declaration, we don't
 *      know if it is because the declaration doesn't exist or we didn't read it.
 *    - As far as I can tell, with standalone=yes, we may in fact have external
 *      entities and subsets, but we're assured that things in there do not
 *      affect most of how the document is presented. So, there may be external
 *      entities that have general entity references in them, but we have no
 *      way (or need) to determine if they have corresponding declarations if
 *      we are not doing a validation process.
 *    If we ARE doing a full validation process, of course, then we can
 *    always determine whether any reference has a declaration, but when there
 *    is no declaration, then it is a validation error, and not a well-formedness
 *    error.
 */
function checkGeneralEntity(
   pToken: GeneralEntityReferencePToken,
   inAtt: boolean,
   entityDecls: GeneralEntitiesInfo,
   state: CheckState,
   ec: ErrorCollector,
): void {
   const name = strOrBlank(pToken.name);
   const genEntityDecl = entityDecls[name];
   const declarationExists = genEntityDecl !== undefined;
   const isPredefinedEntity = PROTECTED_ENTITIES.indexOf(name) !== -1;
   const mustHaveDeclaration =
      state.isStandalone || state.hasNoDTD || (!state.hasExternalDTD && state.peRefCount === 0); // @@@@ Test this

   if (genEntityDecl !== undefined) {
      if (inAtt) {
         // §3.1.0: Well-Formedness Constraint: No External Entity References
         //    Attribute values must not contain direct or indirect entity
         //    references to external entities.
         ec.check(
            genEntityDecl.token.externalId,
            WFID.ATTRIBUTE_INVALID_REFERENCE,
            [name],
            pToken.open,
         );

         checkForExternalEntity(genEntityDecl.token.value, state.paramDecls, ec, pToken.open);
      }

      // §4.1.0: Well-Formedness Constraint: Parsed Entity
      //     An entity reference must not contain the name of an unparsed entity.
      //     Unparsed entities may be referred to only in attribute values
      //     declared to be of type ENTITY or ENTITIES.
      ec.check(genEntityDecl.token.nDataName, WFID.REFERENCE_UNPARSED_NO_USE, [name], pToken.open);

      // §4.1.0 Well-formedness constraint: Entity Declared
      //     In a ... document with "standalone='yes'", for an entity reference that
      //     does not occur within the external subset or a parameter entity, the
      //     Name given in the entity reference must match that in an entity
      //     declaration that does not occur within the external subset...
      // Translation: given a general entity reference (that appears in
      // the content or an attribute list default in the internal subset
      // but not in a parameter entity), there must be a declaration, and it
      // must not be in the external subset
      ec.check(
         state.isStandalone && !genEntityDecl.declaredInInternalSubset,
         WFID.REFERENCE_INVALID_STANDALONE,
         [name],
         pToken.open,
      );
   }

   // §4.1.0 See long comment above.
   if (!declarationExists && !isPredefinedEntity && mustHaveDeclaration) {
      ec.report(WFID.REFERENCE_NO_DECLARATION, [name], pToken.open);
   }
}

/*
 * Examine the contents of the attribute values for any well-formedness problems
 */
function scanAttributeValues(
   attributes: ReadonlyArray<AttributePToken>,
   entityDecls: GeneralEntitiesInfo,
   state: CheckState,
   geContext: Array<string>,
   ec: ErrorCollector,
): void {
   const refNameStack: Array<string> = [];

   for (const att of attributes) {
      for (const val of att.value) {
         switch (val.type) {
            case GENERAL_ENTITY_REFERENCE_PTOKEN:
               const entityName = strOrBlank(val.name);

               // §4.1.0: Well-formedness constraint: No Recursion
               //    A parsed entity must not contain a recursive reference to itself,
               //    either directly or indirectly.
               ec.check(
                  refNameStack.includes(entityName) || geContext.includes(entityName),
                  WFID.REFERENCE_INVALID_RECURSION,
                  [entityName],
                  val.open,
               );
               checkGeneralEntity(val, true, entityDecls, state, ec);
               break;
            case GENERAL_ENTITY_START_PTOKEN:
               const geEntityName = strOrBlank(val.referencePToken.name);

               // §4.1.0: Well-formedness constraint: No Recursion
               //    A parsed entity must not contain a recursive reference to itself,
               //    either directly or indirectly.
               ec.check(
                  refNameStack.includes(geEntityName) || geContext.includes(geEntityName),
                  WFID.REFERENCE_INVALID_RECURSION,
                  [geEntityName],
                  val.referencePToken.open,
               );
               refNameStack.push(geEntityName);
               checkGeneralEntity(val.referencePToken, true, entityDecls, state, ec);
               break;
            case GENERAL_ENTITY_END_PTOKEN:
               const name = strOrBlank(val.referencePToken.name);
               const topName = refNameStack[refNameStack.length - 1];

               if (name === topName) {
                  refNameStack.pop();
               } else {
                  ec.report(
                     WFID.ATTRIBUTE_REFERENCE_UNBALANCED,
                     [name, topName],
                     val.referencePToken.open,
                  );
               }
               break;
            case TEXT_PTOKEN:
            case CHARREF_PTOKEN:
            case PARAMETER_ENTITY_START_PTOKEN:
            case PARAMETER_ENTITY_END_PTOKEN:
            case PARAMETER_ENTITY_REFERENCE_PTOKEN:
               // do nothing
               break;
         }
      }
   }
}

/*
 * Much the same as the above. though this is a bit controversial. If we think we should have
 * seen all declarations with a non-validating entity, then we can check whether this parameter
 * entity reference has a related entity declaration. This is a bit of a borderline test since
 * even if we have seen all, the very presence of this parameter entity reference means that
 * hereafter we can't have seen any others. I think one could mount a reasonable argument
 * that this is not a check that should be made.
 */
function checkParameterEntity(
   pToken: ParameterEntityReferencePToken,
   entityDecls: ParameterEntitiesInfo,
   state: CheckState,
   ec: ErrorCollector,
): void {
   const name = strOrBlank(pToken.name);
   const paramEntityDecl = entityDecls[name];
   const declarationExists = paramEntityDecl !== undefined;
   const mustHaveDeclaration =
      state.isStandalone || state.hasNoDTD || (!state.hasExternalDTD && state.peRefCount === 0); // @@@@ Test this

   // §4.1.0 See long comment above.
   if (!declarationExists && mustHaveDeclaration) {
      ec.report(WFID.REFERENCE_NO_DECLARATION, [name], pToken.open);
   }
}

/*
 * Return true if the specified reference is associated with a declartion of an external parameter
 * entity.  Returns false if we don't know or it is definitely internal.
 */
function isParamEntityExternal(
   pToken: ParameterEntityReferencePToken,
   entityDecls: ParameterEntitiesInfo,
): boolean {
   const name = strOrBlank(pToken.name);
   const paramEntityDecl = entityDecls[name];
   const declarationExists = paramEntityDecl !== undefined;

   return declarationExists && paramEntityDecl?.externalId !== undefined;
}

export {
   ContentChecker,
   MarkupChecker,
   ContentStart,
   MarkupStart,
   ContentCheckerConstructor,
   MarkupCheckerConstructor,
   GeneralEntitiesInfo,
   ParameterEntitiesInfo,
   CheckState,
   CHECKER_DONE,
   scanAttributeValues,
   checkGeneralEntity,
   checkParameterEntity,
   isParamEntityExternal,
};
