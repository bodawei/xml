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

/**********************************************************************\
 The params property, is an array of objects corresponding to
 the "attributes" of the xml declaration in the order they were found,
 each object has a name and a value.
\**********************************************************************/

class DeclarationToken extends XmlToken {

   constructor(params, chunks) {
      super(XmlToken.XMLDECL, undefined, chunks);

      this.params = params;
   }

}

/**********************************************************************\
 TextDeclarationToken is used to represent a TextDecl in an external
 entity.
\**********************************************************************/

class TextDeclarationToken extends XmlToken {

   constructor(params, chunks) {
      super(XmlToken.TEXTDECL, undefined, chunks);

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

class DocTypeStartToken extends XmlToken {

   constructor(name, externalLocation) {
      super(XmlToken.DOCTYPE_START, name);

      this.name = name;
      this.externalLoc = externalLocation;
   }

}

class DocTypeEndToken extends XmlToken {

   constructor() {
      super(XmlToken.DOCTYPE_END);
   }

}

class NotationToken extends XmlToken {

   constructor(name, systemLiteral, pubidLiteral) {
      super(XmlToken.NOTATION_DECL, name);

      this.name = name;
      this.systemLiteral = systemLiteral;
      this.pubidLiteral = pubidLiteral;
   }

}

class EntityToken extends XmlToken {

   constructor(name, value, systemLiteral, publicLiteral, notationDataName) {
      super(XmlToken.ENTITY_DECL, name);

      this.name = name;
      this.value = value;
      this.notationDataName = notationDataName;
   }

}

class ParameterEntityToken extends EntityToken {

   constructor(name, value, systemLiteral, publicLiteral, notationDataName) {
      super(name, value, systemLiteral, publicLiteral, notationDataName);

      this.type = XmlToken.PARAMETERENTITY_DECL;
   }

}

class ElementDeclarationToken extends XmlToken {

   constructor(name, contentType) {
      super(XmlToken.ELEMENT_DECL);

      this.name = name;
      this.contentType = contentType;
   }

}

class AttributeListDeclarationToken extends XmlToken {

   constructor(elementName, attributes) {
      super(XmlToken.ATTLIST_DECL);

      this.elementName = elementName;
      this.attributes = attributes;
   }

}

XmlToken.SPACE = 'WhiteSpace';
XmlToken.COMMENT = 'Comment';
XmlToken.PI = 'ProcessingInstruction';

XmlToken.XMLDECL = 'XmlDecl';
XmlToken.TEXTDECL = 'TextDecl';
XmlToken.DOCTYPE_START = 'DocTypeStart';
XmlToken.DOCTYPE_END = 'DocTypeEnd';
XmlToken.NOTATION_DECL = 'NotationDeclaration';
XmlToken.ENTITY_DECL = 'EntityDeclaration';
XmlToken.PARAMETERENTITY_DECL = 'ParameterEntityDeclaration';
XmlToken.ELEMENT_DECL = 'ElementDeclaration';
XmlToken.ATTLIST_DECL = 'AttributeListDeclaration';

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
XmlToken.TextDeclarationToken = TextDeclarationToken;
XmlToken.DocTypeStartToken = DocTypeStartToken;
XmlToken.DocTypeEndToken = DocTypeEndToken;
XmlToken.StartTagToken = StartTagToken;
XmlToken.TagToken = TagToken;
XmlToken.NotationToken = NotationToken;
XmlToken.EntityToken = EntityToken;
XmlToken.ParameterEntityToken = ParameterEntityToken;
XmlToken.ElementDeclarationToken = ElementDeclarationToken;
XmlToken.AttributeListDeclarationToken = AttributeListDeclarationToken;

module.exports = XmlToken;
