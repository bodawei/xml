/* Copyright ® 2020 by 柏大衛. All rights reserved. */

import { GeneralEntityReferencePToken, ParameterEntityReferencePToken, PToken } from 'token';

import { ExpandParams, ExternalSubsetPToken } from '../types';

type ExpandReference = (pToken: PToken | void, handled: () => void) => void;

/*
 * This takes General Entity Reference or a ParameterEntityReference in the body
 * of an XML document, and expands it.
 * Because the design of this system is to support documents larger than memory
 * (however massochistic that seems now) this means that given a reference, this
 * will generate a sequence of tokens, one at a time. In fact, it not only delivers
 * the expanded sequence of expanded tokens, but it will generate an additional
 * set of "meta" tokens which reflect portions of the data stream pre-intermediate
 * parsing. That information is necessary since the design of this stage of
 * the processing is to do no well formedness or validity checks, this stage
 * must deliver enough information for another stage to do that processing.
 * The implicit assumption is that that stage will consume those tokens and not
 * pass them further on.
 *
 * The processing of a parameter entity reference (in the DTD) and a general entity
 * reference (in the content) have different behaviors.
 *
 * Given a parameter entity reference
 * - Look up the parameter entity declaration, loading value-external values as needed.
 * - If not already parsed, parse it into a "streaming" EntityValuePToken
 * - Any parameter entity references encountered in the EntityValue will be "recursively"
 *   expanded.
 *
 * Given a general entity reference
 * - Look up the general entity declaration, loading value-external values as needed.
 * - Parse it into an EntityValuePToken
 * - Any embedded parameter entity rererences must be expanded "recursively".
 * - Then parse this resulting stream as content, which may reveal general entity
 *   references that must be "recursively" parsed.
 *
 * The key observation here is that the first portion of both phases is the same.
 *
 * Another observation: In terms of the nesting, we can have arbitrarily deep, but
 * non-recursive expansions of general entity references. Each individual GE expansion
 * is a "closed" stream of tokens, which is to say syntactic constructs can not span
 * their boundaries. At the leaves of the general entity expansion tree there may also
 * be arbitrarily deep, also non-recursive, parameter entity expansion trees.
 * While syntactic constructs may not span a single expanded PE expansion, the use of
 * escapes may allow ge refs and char refs to cross boundaries as long as they couldn't
 * be recognized there
 *
 * Relevant portions of the standard:
 * - Some portion of the standard will cause an entity value of "<" to produce a well formedness
 *   error.  I'm not clear where that happen
 * - 2.8.0 does mention that declarations from the internal subset take precedence over
 *   those in the external subset. This is handled by the expansion system which will process
 *   the internal before the external, and ignore any duplicate declarations.
 * 
 * §2.8.0 Validity constraint: Proper Declaration/PE Nesting
 *    Parameter-entity replacement text must be properly nested with markup declarations.
 *   That is to say, if either the first character or the last character of a markup declaration
 *   (markupdecl above) is contained in the replacement text for a parameter-entity reference,
 *   both must be contained in the same replacement text.
 * 
 * §2.8.0 Well-formedness constraint: PEs in Internal Subset
 *    In the internal DTD subset, parameter-entity references must not occur within
 *    markup declarations; they may occur where markup declarations can occur.
 *    (This does not apply to references that occur in external parameter entities or to
 *    the external subset.)
 * NOTE: This relies on other stages for enforcing this constraint. This has no understanding
 * of this context, so it will expand whatever it is given.
 * 
 * §2.8.0 Well-formedness constraint: PE Between Declarations
 *    The replacement text of a parameter entity reference in a DeclSep must match
 *    the production extSubsetDecl.
 * NOTE: Handled by the well formedness checks that come after this.  Such a processor
 * will receive the PE Start and PE End tokens (and any nested ones as well), but between
 * those will be whatever tokens the reference parsed to.
 * 
 * §2.9.0 Validity constraint: Standalone Document Declaration
 *    The standalone document declaration must have the value "no" if any external markup
 *    declarations contain declarations of: ...
 * NOTE: This also ignores any aspect of this In fact, this will readily load and expand
 * any value-external entities, allowing latter stages to report errors
 * 
 * -- continue with 2.10
 * 

 * - §2.5.0 and §2.6.0 both disallow parameter entity references in comments and processing
 *   instructions. This stage relies on other stages supholding that.
 * §4.4.x says that general entity references may not occur in the DTD and PE references may not
 *     occur in the content.  This also depends on other stages enforcing that.
 *
 * IMPLEMENTATION NOTES
 * - We may want to rework setupReferencedEntity and parseEntityValue to be more visibly
 *   stream based and wrap that for the non-stream ones
 * - Prove the syntactic constructs assumptions
 * - At this time, this does not avoid loading value-external entities (or the external subset)
 *   even if standalone is true.  That will happen if it can, and errors will be reported elsewhere.
 *
Given a reference, expandParams, and a deliverExpandedToken
- I think it's time to make the cache entries into a class.
   - The loading should be a function, I think, beter than having the loadingemitter
- call the expandGeRef or expandPeRef with those params, and an array of names, with this one
- expandGERef
   - If the value is in the cache then feed into the stokensource and feed to parseBody
      modify parseBody to have only one callback
   - IF not, then call alternate load routien which doesn't put the value into the cache, but 
      returns an sTokenStream, which it feeds each chunk of chars it gets.
      This parses that into an entity value
         - If there is a peref, then call the other routine with this.  here, too, we must block until done
         As it goes, if the value is below some max, it will store the result in the cache
   - Parse that into a body  (do we expand the geref?  or does the caller?
         - caller should stop receiving acknowledging new input until the sub is done.

- IF it is a peref, it is all the same, except 
- If it is the special case of the external subset, handle accordingly. Wrap in : ExternalSubsetEndToken



 */
function expandBodyReference(
   pToken: GeneralEntityReferencePToken | ParameterEntityReferencePToken | ExternalSubsetPToken,
   expandParams: ExpandParams,
   expanded: ExpandReference,
): void {
   expanded(undefined, () => {
      //do nothing
   });
}

export { expandBodyReference };
