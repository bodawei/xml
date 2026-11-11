import { ConformanceVersion, Collector } from 'basic';
import { SToken } from 'basic';
import { pattern as BCP47_REGEX } from 'bcp47-validate';
import { GENERAL_ENTITY_REFERENCE_PTOKEN, isTextPToken } from 'pToken';
import { AttributeValuePToken } from 'token';

import { wellFormedErrorCodes } from '../error/wellFormedError';

const WFEID = wellFormedErrorCodes.id;
const ONE_DOT_ZERO_REV1_REGEX = /^[a-z][a-z](?:-[a-z]+)*$|^[xi](?:-[a-z]+)+$/i;

const LAX_BCP47 = /^[ix]-[A-Za-z]+(-[A-Za-z]+)*$/;

type AttributeValue = AttributeValuePToken;

function getAttributeValueText(value: AttributeValue): string {
   let newValue = '';

   for (const piece of value) {
      if (isTextPToken(piece)) {
         newValue += piece.text.str;
      }
   }

   return newValue;
}

function firstSToken(value: AttributeValue): SToken | undefined {
   if (value.length === 0) {
      return;
   }

   let pToken;

   for (const element of value) {
      if (pToken) {
         continue;
      }

      if (isTextPToken(element)) {
         pToken = element;
      }
   }

   return pToken?.text;
}

/*
 * SYNTAX
 *    §2.12
 *       1.0/1
 *          [33] LanguageID ::= Langcode ('-' Subcode)*
 *          [34] Langcode   ::= ISO639Code |  IanaCode |  UserCode
 *          [35] ISO639Code ::= ([a-z] | [A-Z]) ([a-z] | [A-Z])
 *          [36] IanaCode   ::= ('i' | 'I') '-' ([a-z] | [A-Z])+
 *          [37] UserCode   ::= ('x' | 'X') '-' ([a-z] | [A-Z])+
 *          [38] Subcode    ::= ([a-z] | [A-Z])+
 */
function check1dot0rev1(value: AttributeValue, attrValue: string, collector: Collector) {
   const isValid = ONE_DOT_ZERO_REV1_REGEX.test(attrValue);

   collector.check(!isValid, WFEID.ATTRIBUTE_LANG_BAD_CODE, [attrValue], firstSToken(value));
}

/*
 * https://tools.ietf.org/html/rfc5646
 *  Language-Tag  = langtag             ; normal language tags
 *               / privateuse          ; private use tag
 *               / grandfathered       ; grandfathered tags
 * langtag       = language
 *                 ["-" script]
 *                 ["-" region]
 *                 *("-" variant)
 *                 *("-" extension)
 *                 ["-" privateuse]
 * language      = 2*3ALPHA            ; shortest ISO 639 code
 *                 ["-" extlang]       ; sometimes followed by
 *                                     ; extended language subtags
 *               / 4ALPHA              ; or reserved for future use
 *               / 5*8ALPHA            ; or registered language subtag
 * extlang       = 3ALPHA              ; selected ISO 639 codes
 *                 *2("-" 3ALPHA)      ; permanently reserved
 * script        = 4ALPHA              ; ISO 15924 code
 * region        = 2ALPHA              ; ISO 3166-1 code
 *               / 3DIGIT              ; UN M.49 code
 * variant       = 5*8alphanum         ; registered variants
 *               / (DIGIT 3alphanum)
 * extension     = singleton 1*("-" (2*8alphanum))
 *                                     ; Single alphanumerics
 *                                     ; "x" reserved for private use
 * singleton     = DIGIT               ; 0 - 9
 *               / %x41-57             ; A - W
 *               / %x59-5A             ; Y - Z
 *               / %x61-77             ; a - w
 *               / %x79-7A             ; y - z
 * privateuse    = "x" 1*("-" (1*8alphanum))
 * grandfathered = irregular           ; non-redundant tags registered
 *               / regular             ; during the RFC 3066 era
 * irregular     = "en-GB-oed"         ; irregular tags do not match
 *               / "i-ami"             ; the 'langtag' production and
 *               / "i-bnn"             ; would not otherwise be
 *               / "i-default"         ; considered 'well-formed'
 *               / "i-enochian"        ; These tags are all valid,
 *               / "i-hak"             ; but most are deprecated
 *               / "i-klingon"         ; in favor of more modern
 *               / "i-lux"             ; subtags or subtag
 *               / "i-mingo"           ; combination
 *               / "i-navajo"
 *               / "i-pwn"
 *               / "i-tao"
 *               / "i-tay"
 *               / "i-tsu"
 *               / "sgn-BE-FR"
 *               / "sgn-BE-NL"
 *               / "sgn-CH-DE"
 * regular       = "art-lojban"        ; these tags match the 'langtag'
 *               / "cel-gaulish"       ; production, but their subtags
 *               / "no-bok"            ; are not extended language
 *               / "no-nyn"            ; or variant subtags: their meaning
 *               / "zh-guoyu"          ; is defined by their registration
 *               / "zh-hakka"          ; and all of these are deprecated
 *               / "zh-min"            ; in favor of a more modern
 *               / "zh-min-nan"        ; subtag or sequence of subtags
 *               / "zh-xiang"
 * alphanum      = (ALPHA / DIGIT)     ; letters and numbers
 */
function check1dot0rev2AndBeyond(value: AttributeValue, attrValue: string, collector: Collector) {
   if (BCP47_REGEX.test(attrValue)) {
      return;
   }

   /*
    * The XML Conformance test suite forces a strange situation here.
    * These three tests, with their respective xml:lang codes, break:
    *  - v-lang03: i-klingon-whorf
    *  - v-lang04: x-dialect-valleygirl
    *  - ibm-valid-P36-ibm36v01.xml: i-BS-ABCD
    *
    * I can not see any world where these are actually correct.
    * §2.12 (in 1.0/2 and beyond) point to IETF RFC 1766, 3066, and BCP47
    * 1.0/5 was done in 2008, so it probably referred to IETF RFC 4646.
    * There has been an RFC 5646 since then, but even ignoring that
    * it doesn't change this.
    * All if the i-* definitions point to IANA registrations. While
    * I can not easily find what was registered for the 1766 and
    * 3066 RFC's, as of 4046, neither i-klingon nor i-bs seem
    * to allow any sub-parts as far as I can tell.
    *
    * 1766: https://tools.ietf.org/html/rfc1766
    *   This allows [A-Za-z]<8>(-[A-Za-z]<8>)* but then curtails the first part
    *   to be i, x, A-Za-z<2>
    *   In this standard, 03 and ibm are valid, but "valleygirl" is more than 8 chars
    *   As noted above, IANA doesn't have -whorf or -ABCD (I don't even
    *   find any i-bs entry anywhere)
    * 3066: https://tools.ietf.org/html/rfc3066
    *   Same as 1766, but allows [A-Za-z]<3> as one of the curtailments.
    *   It also allows [A-Za-z0-9]<8> in the subtag
    *   Aa noted above, IANA doesn't have -whorf or -ABCD
    * 4046: https://tools.ietf.org/html/rfc4646
    *    IANA definitions: https://www.iana.org/assignments/lang-tag-apps/lang-tag-apps.xhtml
    *    This updates the definition for "grandfathered" to be
    *    [A-Za-z]<1,3>(-[A-Za-z0-9]<2,8>(-[A-Za-z0-9]<2,8>))
    *    this syntax allows for 03 and ibm, above.  The wording here
    *    is a bit unclear to me, but I still read this as while the syntax
    *    is general, the only i-* values allowed are ones that had
    *    been allowed by IANA in the 1766 and 3066 timeframe
    * 5646: https://tools.ietf.org/html/rfc5646
    *    IANA: https://www.iana.org/assignments/lang-subtags-templates/lang-subtags-templates.xhtml#lang-subtags-templates-1
    *       https://www.iana.org/assignments/language-subtag-registry/language-subtag-registry
    *       https://www.iana.org/protocols#index_L  (search for Language Tags)
    *    This constrains the definition for "grandfathered" to list
    *    only specific values, and not a general broad syntax.
    *    My interpretation is that rather than do something general
    *    and point to another standard to clarify the specifics, they
    *    pulled in those "frozen" parts of the other standards. Given that
    *    there is no reference to removing previously standard values,
    *    my interpretation is that i-klingon-* and i-BS were never
    *    allowed in the first place.
    * Nonetheless, the XML conformance test suite allows these.
    * Arguably we should provide a parameter to the parser to specify
    * whether to be strict BCP 47 or not.  In the mean time, this will
    * simply allow the lax values for i-* and x- entries.
    */

   if (LAX_BCP47.test(attrValue)) {
      return;
   }

   collector.report(WFEID.ATTRIBUTE_LANG_BAD_CODE, [attrValue], firstSToken(value));
}

function hasReference(value: AttributeValue): boolean {
   for (const piece of value) {
      if (piece.type === GENERAL_ENTITY_REFERENCE_PTOKEN) {
         return true;
      }
   }

   return false;
}

function attributeLangCheck(
   value: AttributeValue,
   collector: Collector,
   confVer: ConformanceVersion,
): void {
   if (hasReference(value)) {
      return;
   }

   const attrValue = getAttributeValueText(value);

   if (confVer.version === 1.0 && confVer.edition === 1) {
      check1dot0rev1(value, attrValue, collector);
      return;
   }

   if (
      attrValue === '' &&
      ((confVer.version === 1.0 && confVer.edition >= 3) || confVer.version === 1.1)
   ) {
      return;
   }

   check1dot0rev2AndBeyond(value, attrValue, collector);
}

export { attributeLangCheck };
