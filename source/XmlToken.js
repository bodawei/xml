/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

const ATTR_NO_CHUNKS = 'Attribute values have no chunks';
const ENTITYVAL_NO_CHUNKS = 'At declaration time, entity values have no chunks';
const SUBSET_NO_CHUNKS = 'Subset tokens never have chunks';

class XmlToken {

   constructor(chunks) {
      if (!chunks) {
         throw new Error('Must provide a chunks value to the token you are constructing.');
      }

      this.chunks = undefined;

      if (chunks !== ATTR_NO_CHUNKS && chunks !== ENTITYVAL_NO_CHUNKS && chunks !== SUBSET_NO_CHUNKS) {
         this.chunks = chunks;
      }
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

class EntityReference extends XmlToken {

   constructor(name, chunks) {
      super(chunks);

      this.name = name;
   }

}

class ParameterEntityReference extends XmlToken {

   constructor(name, chunks) {
      super(chunks);

      this.name = name;
   }

}

class EntityStart extends XmlToken {

   constructor(name, chunks) {
      super(chunks);
      this.name = name;
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

class InternalSubsetStart extends XmlToken {

   constructor() {
      super(SUBSET_NO_CHUNKS);
   }

}

class InternalSubsetEnd extends XmlToken {

   constructor() {
      super(SUBSET_NO_CHUNKS);
   }

}

class ExternalSubsetStart extends XmlToken {

   constructor() {
      super(SUBSET_NO_CHUNKS);
   }

}

class ExternalSubsetEnd extends XmlToken {

   constructor() {
      super(SUBSET_NO_CHUNKS);
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

   constructor(name, value, entityLocation, notationDataName, chunks) {
      super(chunks);

      this.name = name;
      this.value = value;
      this.entityLocation = entityLocation;
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
   ATTR_NO_CHUNKS,
   ENTITYVAL_NO_CHUNKS,
   XmlToken,
   Comment,
   ProcessingInstruction,
   Space,

   XmlDeclaration,
   TextDeclaration,

   DocTypeStart,
   DocTypeEnd,
   InternalSubsetStart,
   InternalSubsetEnd,
   ExternalSubsetStart,
   ExternalSubsetEnd,
   NotationDeclaration,
   EntityDeclaration,
   PEntityDeclaration,
   ElementDeclaration,
   AttrListDeclaration,

   ElementStart,
   EmptyElement,
   ElementEnd,

   EntityReference,
   ParameterEntityReference,
   EntityStart,
   EntityEnd,

   CharRef,
   CharData,
   CData,
   Text
};
