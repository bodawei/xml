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

module.exports = {
   XmlToken,
   Comment,
   ProcessingInstruction,
   Space,

   XmlDeclaration,
   TextDeclaration,

   DocTypeStart,
   DocTypeEnd,
   NotationDeclaration,
   EntityDeclaration,
   PEntityDeclaration,
   ElementDeclaration,
   AttrListDeclaration,

   ElementStart,
   EmptyElement,
   ElementEnd,

   EntityStart,
   EntityEnd,

   CharRef,
   CharData,
   CData,
   Text
};
