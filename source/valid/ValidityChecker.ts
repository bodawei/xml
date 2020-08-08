import { ErrorCollector, ValidityError, XmlWarning } from "error";
import { PToken, GENERAL_ENTITY_DECLARATION_PTOKEN, PARAMETER_ENTITY_DECLARATION_PTOKEN, GENERAL_ENTITY_REFERENCE_PTOKEN, GeneralEntityReferencePToken, ParameterEntityReferencePToken, PARAMETER_ENTITY_REFERENCE_PTOKEN } from "token";
import { strOrBlank } from "sToken";

/*
TODO:
-3. Move validity errors into this module.
-2. Define warning ID
-1. Put the checks into another checkMap
   -- call functions check<token>Validity

/ Compare/contrast the different versions of the validity constraint.  Do we have any version differences?
/??? Think about: Do we need to deal with figureing out the internal/external subset stuff?

0. Enumerate the validity and WFC constatings for entity declared in their respective readme's.

1. Set flags:
   - isStandalone (when get xmldecl)
   - hasExternalSubset (when get docTypeStart)
   - hasExternalParamEntity (when get entity decl)
      or for 1.3 and later
   - hasPEEntityreference (in entity decl.  Or in entity decl. need to check expanded things)

2. Decide if to report error
   if (hasExternalSubet or external param entities) and standalone = no
   - Then must be declared
   (we don't check others because well formed got 'em?)
   --> note that the declarations must preceed.
Note 1.0/4+ and 1.1/2+ says: parameter entity references

3. Need to check that the declarations for Predefined match

4. Review Well-formedness

5. Do other cases, below


/ check inline gerefs
/ check inline perefs
- check perefs in ge decls
   - This just iterates and calls checkPERef
- check perefs in pedecl
- check perefs in consumed things
- check gerefs in attributes
- also ATTLIST defaults




WFC
hasDTD
hasExternalSubset
hasPeRef
isNotStandalone
   then do not check
   

if
   No DTD
      or
   only internal DTD subset & no perefs
      or
   standalone = yes

   Ref must be declared
      except predefined
   ref must be before

   1.0/2 goes on to say: doesn't apply to references in external subset or param entities
   1.0/3 says non-validating do not need to read entity declarations in param etntities or external subsets
*/

interface GeDeclInfo {
   isInternal: boolean,
}

interface PeDeclInfo {
   isInternal: boolean,
}

const PREDEFINED = ['lt', 'gt', 'quot', 'apos', 'amp'];
const VEID = ValidityError.ID;
const WARNID = XmlWarning.ID;

class ValidityChecker {

   private geDecls: Record<string, GeDeclInfo>;
   private peDecls: Record<string, PeDeclInfo>;

   constructor() {
      this.geDecls = {};
      this.peDecls = {};
   }

   checkPToken(token: PToken, ec: ErrorCollector): void {
      switch(token.type) {
         case GENERAL_ENTITY_DECLARATION_PTOKEN:
            const geDeclName = strOrBlank(token.name);

            if (geDeclName !== '') {
               this.geDecls[geDeclName] = {
                  isInternal: !token.externalId
               };
            }
            break;
         case PARAMETER_ENTITY_DECLARATION_PTOKEN:
            const peDeclName = strOrBlank(token.name);

            if (peDeclName !== '') {
               this.peDecls[peDeclName] = {
                  isInternal: !token.externalId
               };
            }
            break;
         case GENERAL_ENTITY_REFERENCE_PTOKEN:
            this.checkGERef(token, ec);
            break;
         case PARAMETER_ENTITY_REFERENCE_PTOKEN:
            this.checkPERef(token, ec);
            break;
      }
   }


   private checkGERef(token: GeneralEntityReferencePToken, ec: ErrorCollector): void {
      const geDeclName = strOrBlank(token.name);
      let isDeclared = !this.geDecls[geDeclName];

      if (isDeclared) {
         return;
      }
      
      /*
       * §4.1.0: Validity Constraint: Entity Declared
       *    In a document with an external subset or parameter entity references with
       *    "standalone='no'", the Name given in the entity reference must match that
       *    in an entity declaration. ...
       */
      if (!PREDEFINED.includes(geDeclName)) {
         ec.report(VEID.GEREF_UNDEFINED, [geDeclName], token.open);
      } else {
         /*
          * §4.1.0: Validity Constraint: Entity Declared
          *    For interoperability, valid documents should declare the entities
          *    amp, lt, gt, apos, quot, in the form specified in 4.6 Predefined Entities.
          */
         ec.reportError(WARNID.PREDEFINED_NOT_DECLARED, XmlWarning, [geDeclName], token.open);
      }

   }

   private checkPERef(token: ParameterEntityReferencePToken, ec: ErrorCollector): void {
      const peDeclName = strOrBlank(token.name);

      /*
       * §4.1.0: Validity Constraint: Entity Declared
       *    In a document with an external subset or parameter entity references with
       *    "standalone='no'", the Name given in the entity reference must match that
       *    in an entity declaration. ... The declaration of a parameter entity must
       *    precede any reference to it...
       */
      ec.check(!this.peDecls[peDeclName], VEID.PEREF_UNDEFINED, [peDeclName], token.open);
   }
}

export {
   ValidityChecker,
}


/*
**Well-Formedness Constraint: Entity Declared**

In a document without any DTD, a document with only an internal DTD subset which contains no parameter entity references, or a document with "standalone='yes'", the Name given in the entity reference must match that in an entity declaration, except that well-formed documents need not declare any of the following entities: amp, lt, gt, apos, quot. The declaration of a parameter entity must precede any reference to it. Similarly, the declaration of a general entity must precede any reference to it which appears in a default value in an attribute-list declaration. Note that if entities are declared in the external subset or in external parameter entities, a non-validating processor is not obligated to read and process their declarations; for such documents, the rule that an entity must be declared is a well-formedness constraint only if standalone='yes'.

> **1.0/2: Modified:** ..."standalone='yes'", for an entity reference that does not occur within the external subset or a parameter entity, the Name given in the entity reference must match that in an entity declaration that does not occur within the external subset or a parameter entity, except that well-formed documents need not declare any of the following entities: amp, lt, gt, apos, quot. The declaration of a general entity must precede any reference to it which appears in a default value in an attribute-list declaration....

> **1.0/2: Broke into two paragraphs at "Note"**

> **1.0/3: Modified:** ...Note that non-validating processors are not obligated to to read and process entity declarations occurring in parameter entities or in the external subset; for such documents, the rule that an entity must be declared is a well-formedness constraint only if standalone='yes'.

> **1.0/5: Deleted the duplicate "to"**

> **1.1/1: Reverted to 1.0/3's**

> **1.1/3: Removed duplicate "to"**






**Validity Constraint: Entity Declared**

In a document with an external subset or external parameter entities with "standalone='no'", the Name given in the entity reference must match that in an entity declaration. For interoperability, valid documents should declare the entities amp, lt, gt, apos, quot, in the form specified in "4.6 Predefined Entities". The declaration of a parameter entity must precede any reference to it. Similarly, the declaration of a general entity must precede any reference to it which appears in a default value in an attribute-list declaration.

> **1.0/2: Modified:** ...precede any attribute-list declaration containing a default value with a direct or indirect reference to that general entity.

> **1.0/2: Removed quotes around section name**

> **1.0/2: Replaced:** In a document with an external subset or parameter entity references, if the document is not standalone (either "standalone='no'" is specified or there is no standalone declaration), then the Name given in the entity reference must match that in an entity declaration. For interoperability, valid documents should declare the entities amp, lt, gt, apos, quot, in the form specified in 4.6 Predefined Entities. The declaration of a parameter entity must precede any reference to it. Similarly, the declaration of a general entity must precede any attribute-list declaration containing a default value with a direct or indirect reference to that general entity.

> **1.0/4: Modified:** In a document with an external subset or parameter entity references with "standalone='no'", the Name given in the entity reference must match that in an entity declaration. For interoperability, valid documents should declare the entities amp, lt, gt, apos, quot, in the form specified in 4.6 Predefined Entities. The declaration of a parameter entity must precede any reference to it. Similarly, the declaration of a general entity must precede any attribute-list declaration containing a default value with a direct or indirect reference to that general entity.

> **1.1/3: Modified** In a document with an external subset or parameter entity references, if the document is not standalone (either "standalone='no'" is specified or there is no standalone declaration), then the Name given in the entity reference must match that in an entity declaration....


*/
