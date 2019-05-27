import { EntityMetaData } from 'basic';
import { ErrorCollector, WellFormedError } from 'error';
import { strOrBlank } from "sToken";
import {
   GENERAL_ENTITY_END_PTOKEN,
   GENERAL_ENTITY_REFERENCE_PTOKEN,
   GENERAL_ENTITY_START_PTOKEN,

   GeneralEntityReferencePToken,
   GeneralEntityDeclarationPToken,
   ParameterEntityDeclarationPToken,
   ParameterEntityReferencePToken,

   PToken,
} from 'token';
import { AttributePToken } from 'source/token/common/attribute';

type GeneralEntitiesInfo = {
   [name: string]: GeneralEntityDeclarationPToken;
}

type ParameterEntitiesInfo = {
   [name: string]: ParameterEntityDeclarationPToken;
}

type EntityInfo = {
   generalDecls: GeneralEntitiesInfo,
   paramDecls: ParameterEntitiesInfo,
   hasAllDecls: boolean,
   peRefCount: number,
};

interface CheckerConstructor {
   new(checkState: CheckState): Checker;
}

interface Checker {
   check(pToken: PToken, errorCollector: ErrorCollector): void | typeof CHECKER_DONE;
};

const WFID = WellFormedError.ID;
const PROTECTED_ENTITIES = [ 'amp', 'lt', 'gt', 'apos', 'quot' ];
const CHECKER_DONE = '**Checker Done**';

class CheckState {
   public emd: EntityMetaData = new EntityMetaData();
   public generalDecls: GeneralEntitiesInfo = {};
   public paramDecls: ParameterEntitiesInfo = {};
   // public hasAllDecls: boolean = true; // if not validating, a peref got in the way.
   public peRefCount: number = 0;
   public isStandalone: boolean = false;
   public hasNoDTD: boolean = false;
   public hasExternalDTD: boolean = false;
}

/*
 * Examine the contents of the attribute values for any well-formedness problems
 */
function scanAttributeValues(attributes: Array<AttributePToken> , entityDecls: GeneralEntitiesInfo, state: CheckState, ec: ErrorCollector) {
   const refNameStack: Array<string> = [];

   for (const att of attributes) {
      for (const val of att.value) {
         switch(val.type) {
            case GENERAL_ENTITY_REFERENCE_PTOKEN:
               checkGeneralEntity(val, true, entityDecls, state, ec);
               break;
            case GENERAL_ENTITY_START_PTOKEN:
               const genEntityName = strOrBlank(val.referencePToken.name);

               refNameStack.push(genEntityName);
               checkGeneralEntity(val.referencePToken, true, entityDecls, state, ec);
               break;
            case GENERAL_ENTITY_END_PTOKEN:
               const name = strOrBlank(val.referencePToken.name);
               const topName = refNameStack[refNameStack.length -1];

               if (name === topName) {
                  refNameStack.pop();
               } else {
                  ec.report(WFID.ATTRIBUTE_REFERENCE_UNBALANCED, [ name, topName ],
                     val.referencePToken.open);
               }
               break;
         }
      }
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
function checkGeneralEntity(pToken: GeneralEntityReferencePToken, inAtt: boolean,
      entityDecls: GeneralEntitiesInfo, state: CheckState, ec: ErrorCollector) {
   const name = strOrBlank(pToken.name);
   const genEntityDecl = entityDecls[name];
   const declarationExists = !!genEntityDecl;
   const isPredefinedEntity = PROTECTED_ENTITIES.indexOf(name) !== -1;
   const mustHaveDeclaration = state.isStandalone || state.hasNoDTD || (!state.hasExternalDTD && state.peRefCount === 0); // @@@@ Test this

   if (genEntityDecl) {
      if (inAtt) {
         // §3.1.0: Well-Formedness Constraint: No External Entity References
         //    Attribute values must not contain direct or indirect entity
         //    references to external entities.
         ec.check(genEntityDecl && genEntityDecl.externalId,
            WFID.ATTRIBUTE_INVALID_REFERENCE, [ name ], pToken.open);
      }

      // §4.1.0: Well-Formedness Constraint: Parsed Entity
      //     An entity reference must not contain the name of an unparsed entity.
      //     Unparsed entities may be referred to only in attribute values
      //     declared to be of type ENTITY or ENTITIES.
      ec.check(genEntityDecl.nDataName, WFID.REFERENCE_UNPARSED_NO_USE, [name], pToken.open);
   }

   // §4.1.0 See long comment above.
   if (!declarationExists && !isPredefinedEntity && mustHaveDeclaration) {
      ec.report(WFID.REFERENCE_NO_DECLARATION, [ name ], pToken.open);
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
function checkParameterEntity(pToken: ParameterEntityReferencePToken, entityDecls: ParameterEntitiesInfo, state: CheckState, ec: ErrorCollector) {
   const name = strOrBlank(pToken.name);
   const paramEntityDecl = entityDecls[name];
   const declarationExists = !!paramEntityDecl;
   const mustHaveDeclaration = state.isStandalone || state.hasNoDTD || (!state.hasExternalDTD && state.peRefCount === 0); // @@@@ Test this

   // §4.1.0 See long comment above.
   if (!declarationExists && mustHaveDeclaration) {
      ec.report(WFID.REFERENCE_NO_DECLARATION, [ name ], pToken.open);
   }
}

/*
 * Return true if the specified reference is associated with a declartion of an external parameter
 * entity.  Returns false if we don't know or it is definitely internal.
 */
function isParamEntityExternal(pToken: ParameterEntityReferencePToken, entityDecls: ParameterEntitiesInfo) {
   const name = strOrBlank(pToken.name);
   const paramEntityDecl = entityDecls[name];
   const declarationExists = !!paramEntityDecl;

   return declarationExists && !!paramEntityDecl.externalId;
}

export {
   Checker,
   CheckerConstructor,
   GeneralEntitiesInfo,
   ParameterEntitiesInfo,

   CheckState,
   CHECKER_DONE,

   scanAttributeValues,
   checkGeneralEntity,
   checkParameterEntity,
   isParamEntityExternal,
};