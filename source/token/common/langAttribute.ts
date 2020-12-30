import { pattern as BCP47_REGEX } from 'bcp47-validate';
import { ConformanceVersion } from "basic";
import { ErrorCollector, WellFormedError } from "error";
import { isTextPToken } from "pToken";
import { SToken } from "sToken";
import { isTextXToken } from "xToken";

import { AttributeValuePToken, AttributeValueXToken } from '../common/attribute';
import { GENERAL_ENTITY_REFERENCE_PTOKEN } from "../generalEntityReference";
import { GENERAL_ENTITY_REFERENCE_XTOKEN } from 'xToken';

const WFID = WellFormedError.ID;
const ONE_DOT_ZERO_REV1_REGEX = /^[a-z][a-z](?:-[a-z]+)*$|^[xi](?:-[a-z]+)+$/i;

type AttributeValue = AttributeValuePToken | AttributeValueXToken;

function getAttributeValueText(value: AttributeValue): string {
   let newValue = '';

   for (const piece of value) {
      if (isTextPToken(piece) && piece.text) {
         newValue += piece.text.str;
      } else if (isTextXToken(piece)) {
         newValue += piece.text;
      }
   }

   return newValue;
}

function firstSToken(value: AttributeValue): SToken | void {
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
      } else if (isTextXToken(element) && element.pToken) {
         pToken = element.pToken;
      }

   }

   if (!pToken) {
      return;
   }

   return pToken.text;
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
function check1dot0rev1(value: AttributeValue, attrValue: string, ec: ErrorCollector) {
   const isValid = ONE_DOT_ZERO_REV1_REGEX.test(attrValue);

   ec.check(!isValid, WFID.ATTRIBUTE_LANG_BAD_CODE, [attrValue], firstSToken(value));
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
function check1dot0rev2AndBeyond(value: AttributeValue, attrValue: string, ec: ErrorCollector) {
   if (BCP47_REGEX.test(attrValue)) {
      return;
   }

   ec.report(WFID.ATTRIBUTE_LANG_BAD_CODE, [attrValue], firstSToken(value));
}

function hasReference(value: AttributeValue): boolean {
   for (const piece of value) {
      if (piece.type === GENERAL_ENTITY_REFERENCE_PTOKEN ||
         piece.type === GENERAL_ENTITY_REFERENCE_XTOKEN) {
         return true;
      }
   }

   return false;
}

function checkXmlLangWellFormed(value: AttributeValue, ec: ErrorCollector, confVer: ConformanceVersion): void {
   if (hasReference(value)) {
      return;
   }

   const attrValue = getAttributeValueText(value);

   if (confVer.version === 1.0 && confVer.revision === 1) {
      check1dot0rev1(value, attrValue, ec);
      return;
   }

   if (attrValue === '' && (
      confVer.version === 1.0 && confVer.revision >= 3 || confVer.version === 1.1)) {
      return;
   }

   check1dot0rev2AndBeyond(value, attrValue, ec);
}

export {
   checkXmlLangWellFormed,
}