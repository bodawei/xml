# demo

This system contains various demonstrations of tools that one can build on top of the overal Tiramisu system.

## CommentExpanderStream
* Certain characters are not allowed in a the source form of an XML document. Which raises the question, if you need to put one of those in a comment, or you need to put a character in a comment that you can not type directly, how do you get it in there?  This node.js transform stream offers one solution: You can enter a character reference in the text of a command, and this stream will replace that text with the referenced chatacter.
   * Thus, it takes a comment of the form `<!-- Tiramisu &#xD83C;&#xDF70; -->` and produces the equivalent of `<!-- Tiramisu 🍰 -->`
   * This takes an input stream of tokens, and modifies any COMMENT_PTOKEN types it encounters