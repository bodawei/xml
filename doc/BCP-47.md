Some shorthands:
   Å = [a-zA-Z]
   # = [0-9]

# IETF RFC 1766 (1995)
## Standard
   https://tools.ietf.org/html/rfc1766

## Syntax
   Å<1-8>(-Å<1-8>)*

## Registrations
   While the syntax is general, it is constrained in the text of the standard. The constraints are:
      * ÅÅ(-Å<2-8>)?(-Å<1-8>)*
      * i-Å<2-8>(-Å<1-8>)*
      * x(-Å<1-8>)+
   It is important to note that for the second tag, the possible set here is actually constrained by what has been registered.
   * The two letter codes in the primary tag are from https://www.loc.gov/standards/iso639-2/iso639jac_n3r.html  or https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes
   * The two letter codes in the second tag are from https://www.iso.org/iso-3166-country-codes.html

# IETF RFC 3066 (aka BCP-47)  (2001)
## Standard
   https://tools.ietf.org/html/rfc3066

## Syntax
   Å<1-8>(-Å#<1-8>)*

## Registrations
   While the syntax is general, it is constrained in the text of the standard. The constraints are:
      * Å<2>(-Å<2-8>)?(-Å#<1-8>)*
      * Å<3>(-Å<2-8>)?(-Å#<1-8>)*
      * i-Å<2-8>(-Å#<1-8>)*
      * x-(Å#<1-8>)+
   Here, too, the the raw syntax here is dependent on what has been registered.
   * The two letter codes in the primary tag are from https://www.loc.gov/standards/iso639-2/iso639jac_n3r.html  or https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes
   * The three letter codes in the first tag are from https://www.loc.gov/standards/iso639-2/
   * The two letter codes in the second tag are from https://www.iso.org/iso-3166-country-codes.html

# IETF RFC 4646 (aka BCP-47)  (2006)
## Standard
   https://tools.ietf.org/html/rfc4646

## Syntax
   * x-(Å#<1-8>)+ // Private use
   * i-(Å#<2-8>)<1-2> // Grandfathered
   * Å<2-3>-(Å#<2-8>)<1-2> // Grandfathered
   * Å<2-3>-(-ÅÅÅ)<0-3>(-ÅÅÅÅ)?(-(ÅÅ|###))?(-Å#<5-8>|#(Å#)<3>)*(-Å-(Å<2-8>)+)*(-x-(Å<1-8>))*
   * Å<4-8>(-ÅÅÅÅ)?(-(ÅÅ|###))?(-Å#<5-8>|#(Å#)<3>)*(-Å-(Å<2-8>)+)*(-x-(Å<1-8>))*

## Registrations
   This is much more precise, but even here most of these segments are actually constrained by other standards, and so the full range of what is defined by the syntax is not allowed:
   * The two letter codes in the primary tag are from https://www.loc.gov/standards/iso639-2/iso639jac_n3r.html  or https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes
   * https://en.wikipedia.org/wiki/ISO_15924
   * The two letter codes in the second tag are from https://www.iso.org/iso-3166-country-codes.html
   * https://en.wikipedia.org/wiki/UN_M.49

# IETF RFC 5646 (aka BCP-47)  (2009)
## Standard
   https://tools.ietf.org/html/rfc5646 

## Syntax
   * x-(Å#<1-8>)+ // Private use
   * Å<2-3>-(-ÅÅÅ)<0-3>(-ÅÅÅÅ)?(-(ÅÅ|###))?(-Å#<5-8>|#(Å#)<3>)*(-Å-(Å<2-8>)+)*(-x-(Å<1-8>))*
   * Å<4-8>(-ÅÅÅÅ)?(-(ÅÅ|###))?(-Å#<5-8>|#(Å#)<3>)*(-Å-(Å<2-8>)+)*(-x-(Å<1-8>))*
   * "en-GB-oed", "i-ami", "i-bnn", "i-default", "i-enochian", "i-hak", "i-klingon", "i-lux", "i-mingo", "i-navajo", "i-pwn", "i-tao", "i-tay", "i-tsu", "sgn-BE-FR", "sgn-BE-NL", "sgn-CH-DE", "art-lojban", "cel-gaulish", "no-bok", "no-nyn", "zh-guoyu", "zh-hakka", "zh-min", "zh-min-nan", "zh-xiang", 

## Registrations
   This came into existence after the last XML update.

# Summary
While the syntax of early versions was very general, and allowed for cases not allowed in later revisions, each version had the caveat that any value actually used in a tag needed to be registered.  While I've not done the footwork to confirm this, I assume that the restrictions in later versions took into account what had been so registered.
