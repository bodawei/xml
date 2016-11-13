/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

class XmlToken {

   constructor(chunks) {
      this.chunks = chunks;
   }

}

class Space extends XmlToken {

   constructor(text, chunks) {
      super(chunks);

      this.text = text;
   }

}

class Comment extends XmlToken {

   constructor(content, chunks) {
      super(chunks);

      this.content = content;
   }

}

class ProcessingInstruction extends XmlToken {

   constructor(target, content, chunks) {
      super(chunks);

      this.target = target;
      this.content = content;
   }

}

class EntityStart extends XmlToken {

   constructor(name, haveEntityData, chunks) {
      super(chunks);

      this.name = name;
      this.haveEntityData = haveEntityData || false;
   }

}

class EntityEnd extends XmlToken {

   constructor(name, chunks) {
      super(chunks);
      this.name = name;
   }

}

class CharRef extends XmlToken {

   constructor(char, chunks) {
      super(chunks);
      this.text = char;
   }

}

class CharData extends XmlToken {

   constructor(text, chunks) {
      super(chunks);
      this.text = text;
   }

}

class CData extends XmlToken {

   constructor(text, chunks) {
      super(chunks);
      this.text = text;
   }

}

class Text extends XmlToken {

   constructor(text, chunks) {
      super(chunks);
      this.text = text;
   }

}

/**********************************************************************\
 The params property, is an array of objects corresponding to
 the "attributes" of the xml declaration in the order they were found,
 each object has a name and a value.
\**********************************************************************/

class XmlDeclaration extends XmlToken {

   constructor(params, chunks) {
      super(chunks);

      this.params = params;
   }

}

class TextDeclaration extends XmlToken {

   constructor(params, chunks) {
      super(chunks);

      this.params = params;
   }

}

class ElementEnd extends XmlToken {

   constructor(name, chunks) {
      super(chunks);

      this.name = name;
   }

}

class ElementStart extends XmlToken {

   constructor(name, attributes, chunks) {
      super(chunks);

      this.name = name;
      this.attributes = attributes;
   }

}

class EmptyElement extends XmlToken {

   constructor(name, attributes, chunks) {
      super(chunks);

      this.name = name;
      this.attributes = attributes;
   }

}

class DocTypeStart extends XmlToken {

   constructor(name, externalLocation, chunks) {
      super(chunks);

      this.name = name;
      this.externalLoc = externalLocation;
   }

}

class DocTypeEnd extends XmlToken {
}

class NotationDeclaration extends XmlToken {

   constructor(name, externalLocation, chunks) {
      super(chunks);

      this.name = name;
      this.externalLoc = externalLocation;
   }

}

class EntityDeclaration extends XmlToken {

   constructor(name, value, systemLiteral, publicLiteral, notationDataName, chunks) {
      super(chunks);

      this.name = name;
      this.value = value;
      this.notationDataName = notationDataName;
   }

}

class PEntityDeclaration extends EntityDeclaration {
}

class ElementDeclaration extends XmlToken {

   constructor(name, contentType, chunks) {
      super(chunks);

      this.name = name;
      this.contentType = contentType;
   }

}

class AttrListDeclaration extends XmlToken {

   constructor(elementName, attributes, chunks) {
      super(chunks);

      this.elementName = elementName;
      this.attributes = attributes;
   }

}

XmlToken.SYNTAX_ERROR = 'SyntaxError';

XmlToken.Comment = Comment;
XmlToken.ProcessingInstruction = ProcessingInstruction;
XmlToken.Space = Space;

XmlToken.XmlDeclaration = XmlDeclaration;
XmlToken.TextDeclaration = TextDeclaration;

XmlToken.DocTypeStart = DocTypeStart;
XmlToken.DocTypeEnd = DocTypeEnd;
XmlToken.NotationDeclaration = NotationDeclaration;
XmlToken.EntityDeclaration = EntityDeclaration;
XmlToken.PEntityDeclaration = PEntityDeclaration;
XmlToken.ElementDeclaration = ElementDeclaration;
XmlToken.AttrListDeclaration = AttrListDeclaration;

XmlToken.ElementStart = ElementStart;
XmlToken.EmptyElement = EmptyElement;
XmlToken.ElementEnd = ElementEnd;

XmlToken.EntityStart = EntityStart;
XmlToken.EntityEnd = EntityEnd;

XmlToken.CharRef = CharRef;
XmlToken.CharData = CharData;
XmlToken.CData = CData;
XmlToken.Text = Text;

module.exports = XmlToken;
