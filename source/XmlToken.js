/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

class XmlToken {

   constructor(type, data, chunks) {
      this.type = type;
      this.data = data;
      this.chunks = chunks;
   }

}

class SpaceToken extends XmlToken {

   constructor(text, chunks) {
      super(XmlToken.SPACE, undefined, chunks);

      this.text = text;
   }

}

class CommentToken extends XmlToken {

   constructor(content, chunks) {
      super(XmlToken.COMMENT, undefined, chunks);

      this.content = content;
   }

}

class ProcessingInstructionToken extends XmlToken {

   constructor(target, content, chunks) {
      super(XmlToken.PI, undefined, chunks);

      this.target = target;
      this.content = content;
   }

}

class DeclarationToken extends XmlToken {

   constructor(params, chunks) {
      super(XmlToken.XMLDECL, undefined, chunks);

      this.params = params;
   }

}

class TagToken extends XmlToken {

   constructor(type, name, chunks) {
      super(type, undefined, chunks);

      this.name = name;
   }

}

class StartTagToken extends TagToken {

   constructor(type, name, attributes, chunks) {
      super(type, name, chunks);

      this.attributes = attributes;
   }

}

class DocTypeToken extends XmlToken {

   constructor(name, internalDtd) {
      super(XmlToken.DOCTYPE, name);

      this.name = name;
      this.internalDtd = internalDtd;
   }

}

XmlToken.SPACE = 'WhiteSpace';
XmlToken.COMMENT = 'Comment';
XmlToken.PI = 'ProcessingInstruction';

XmlToken.XMLDECL = 'XmlDecl';
XmlToken.DOCTYPE = 'DocType';

XmlToken.ELEMENT_START = 'ElementStartTag';
XmlToken.ELEMENT_EMPTY = 'ElementEmptyTag';
XmlToken.ELEMENT_END = 'ElementEndTag';
XmlToken.ENTITY_START = 'EntityStartMarker';
XmlToken.ENTITY_END = 'EntityEndMarker';

XmlToken.CHAR_REF = 'CharacterReference';
XmlToken.CHARDATA = 'CharData';
XmlToken.CDATA = 'CData';
XmlToken.TEXT = 'TextPiece';

XmlToken.SYNTAX_ERROR = 'SyntaxError';

XmlToken.CommentToken = CommentToken;
XmlToken.ProcessingInstructionToken = ProcessingInstructionToken;
XmlToken.SpaceToken = SpaceToken;
XmlToken.DeclarationToken = DeclarationToken;
XmlToken.DocTypeToken = DocTypeToken;
XmlToken.StartTagToken = StartTagToken;
XmlToken.TagToken = TagToken;

module.exports = XmlToken;
