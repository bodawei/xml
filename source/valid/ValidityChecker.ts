import { ErrorCollector, ValidityError, XmlWarning } from "error";
import { PToken, GENERAL_ENTITY_DECLARATION_PTOKEN, PARAMETER_ENTITY_DECLARATION_PTOKEN, GENERAL_ENTITY_REFERENCE_PTOKEN, GeneralEntityReferencePToken, ParameterEntityReferencePToken, PARAMETER_ENTITY_REFERENCE_PTOKEN } from "token";
import { strOrBlank } from "sToken";

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

**Validity Constraint: Entity Declared**

In a document with an external subset or external parameter entities with "standalone='no'", the Name given in the entity reference must match that in an entity declaration. For interoperability, valid documents should declare the entities amp, lt, gt, apos, quot, in the form specified in "4.6 Predefined Entities". The declaration of a parameter entity must precede any reference to it. Similarly, the declaration of a general entity must precede any reference to it which appears in a default value in an attribute-list declaration.

> **1.0/2: Modified:** ...precede any attribute-list declaration containing a default value with a direct or indirect reference to that general entity.

> **1.0/2: Removed quotes around section name**

> **1.0/2: Replaced:** In a document with an external subset or parameter entity references, if the document is not standalone (either "standalone='no'" is specified or there is no standalone declaration), then the Name given in the entity reference must match that in an entity declaration. For interoperability, valid documents should declare the entities amp, lt, gt, apos, quot, in the form specified in 4.6 Predefined Entities. The declaration of a parameter entity must precede any reference to it. Similarly, the declaration of a general entity must precede any attribute-list declaration containing a default value with a direct or indirect reference to that general entity.

> **1.0/4: Modified:** In a document with an external subset or parameter entity references with "standalone='no'", the Name given in the entity reference must match that in an entity declaration. For interoperability, valid documents should declare the entities amp, lt, gt, apos, quot, in the form specified in 4.6 Predefined Entities. The declaration of a parameter entity must precede any reference to it. Similarly, the declaration of a general entity must precede any attribute-list declaration containing a default value with a direct or indirect reference to that general entity.

> **1.1/3: Modified** In a document with an external subset or parameter entity references, if the document is not standalone (either "standalone='no'" is specified or there is no standalone declaration), then the Name given in the entity reference must match that in an entity declaration....

TODO:
- Define warning ID
- Compare/contrast the different versions of the validity constraint.  Do we have any version differences?
- Think about: Do we need to eal with figureing out the internal/external subset stuff?
- Put the checks into another checkMap
-- call functions check<token>Validity

/ check inline gerefs
/ check inline perefs
- check perefs in ge decls
   - This just iterates and calls checkPERef
- check perefs in pedecl
- check perefs in consumed things
- check gerefs in attributes
- also ATTLIST defaults
*/
