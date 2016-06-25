/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

/* eslint-env node */
/* eslint-disable no-var */

'use strict';

/*
 * Limit block comment line length to a particular number of columns.
 *
 * WHY
 * Code line lengths are quite reasonably greater than 100 characters.
 * This is reasonable both because identifiers are commonly long (so
 * shorter line lengths make it hard to "say" something coherent), and
 * needing to visually "seek" to the next line is not especially hard
 * given that lines often do not wrap, and the use of indenting and
 * whitespace makes this task very easy.
 *
 * In contrast, when reading paragraphs of text, it is hard to visually
 * scan back to find the next line (lines in books are generally around
 * 60 characters plus or minus some. Wider pages will tend to go
 * multi-column).
 *
 * Thus having different line lengths for code versus comments, while
 * unusual, makes good sense from a human factors standpoint.
 *
 * Note:
 * eslint has a max-len: [ 2, { ... , comments: ## ...}] configuration
 * value which might suit your needs better. That puts a limit on any
 * comment going more than the specified number of columns. This, in
 * contrast, pays attention only to block comments, and then relative to
 * however they are already indented. The issue isn't line length, but
 * reading length.
 *
 * HOW
 * This simply scans each line and if it is too long, reports an error.
 * Note that this does not count any whitespace before the comment. Thus,
 * given the following line from a block comment:
 *
 *          /*
 *           * 01234 6789 123 5 789
 *
 * this starts counting at the 0 (after the star and one following space),
 * making that line 20 character long.
 *
 * USAGE
 * In the eslint configuration file, you can just say:
 *    'max-block-comment-len': 2
 * or
 *    'max-block-comment-len': [ 2, 80 ]
 * The former uses the default line length of 60 characters, the latter
 * sets a default of 80.
 */

var DEFAULT = 60;

module.exports = function maxBlockCommentLen(context) {

   var sourceLines;

   return {
      Program: function Program() {
         sourceLines = context.getSourceLines();
      },
      BlockComment: function BlockComment(node) {

         var firstLineIndex = node.loc.start.line - 1;   // start.line is 1 indexed
         var lastLineIndex = node.loc.end.line - 1;
         var firstStarIndex = sourceLines[firstLineIndex].indexOf('*');
         var maxLength = context.options[0] || DEFAULT;

         for (var line = firstLineIndex; line <= lastLineIndex; line++) {
            var length = sourceLines[line].length;
            var starIndex = sourceLines[line].indexOf('*');
            var ignoredLength = starIndex + 2;

            // If we can't find the *, just use the indentation from the first star
            if (starIndex === -1) {
               ignoredLength = firstStarIndex + 1;
            }

            if (length - ignoredLength > maxLength) {
               context.report(node, 'Block comment line ' + (line + 1) + ' is ' + (length - ignoredLength) +
                  ' chars long (limit: ' + maxLength + ').');
            }
         }

      }
   };

};
