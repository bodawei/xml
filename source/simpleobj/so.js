/* Copyright ® 2017 by 柏大衛. All rights reserved. */

import stream from 'readable-stream';

import {
   cdata,
   charData,
   elementStart,
   elementEnd,
} from '../token';

class Node {

   constructor(type) {
      this.type = type;
      this.content = [];
   }

   addContent(item) {
      this.content.push(item);
   }

}

class SimpleObj extends stream.Transform {

   constructor() {
      super({
         objectMode: true,
      });
      this._stack = [];
      this._root = undefined;
   }

   _transform(xToken, _, done) {
      let leaf;
      if (this._stack.length > 0) {
         leaf = this._stack[this._stack.length - 1];
      }

      if (xToken instanceof elementStart.XToken) {
         const el = new Node(xToken.name);
         if (!this._root) {
            this._root = el;
         } else {
            leaf.addContent(el);
         }
         // let padding = '';
         // for (var index = 0; index < this._stack.length; index++) {
         //    padding += ' ';
         // }
         // if (this._stack.length < 50) {
         //    console.log('PUSH ', padding + '\\' + xToken.name)
         // }
         this._stack.push(el);
      } else if (xToken instanceof elementEnd.XToken) {
         this._stack.pop();
         // let padding2 = '';
         // for (var index = 0; index < this._stack.length; index++) {
         //    padding2 += ' ';
         // }
         // if (this._stack.length < 50) {
         //    console.log('POP  ', padding2 + '/' + xToken.name)
         // }
      } else if (xToken instanceof charData.XToken) {
         // console.log('TEXT ', xToken.text)
         leaf.addContent(xToken.text);
      } else if (xToken instanceof cdata.XToken) {
         // console.log('TEXT ', xToken.text)
         leaf.addContent(xToken.text);
      }

      done();
   }

   _flush() {
      this.push(this._root);
   }

}

export default SimpleObj;
