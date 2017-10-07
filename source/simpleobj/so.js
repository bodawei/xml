/* Copyright ® 2017 by 柏大衛. All rights reserved. */

import stream from 'readable-stream';

import {
   cdata,
   charData,
   elementStart,
   elementEnd,
} from '../xToken';

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

   _transform(parsed, _, done) {
      let leaf;
      if (this._stack.length > 0) {
         leaf = this._stack[this._stack.length - 1];
      }

      if (parsed instanceof elementStart.Token) {
         const el = new Node(parsed.name);
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
         //    console.log('PUSH ', padding + '\\' + parsed.name)
         // }
         this._stack.push(el);
      } else if (parsed instanceof elementEnd.Token) {
         this._stack.pop();
         // let padding2 = '';
         // for (var index = 0; index < this._stack.length; index++) {
         //    padding2 += ' ';
         // }
         // if (this._stack.length < 50) {
         //    console.log('POP  ', padding2 + '/' + parsed.name)
         // }
      } else if (parsed instanceof charData.Token) {
         // console.log('TEXT ', parsed.text)
         leaf.addContent(parsed.text);
      } else if (parsed instanceof cdata.Token) {
         // console.log('TEXT ', parsed.text)
         leaf.addContent(parsed.text);
      }

      done();
   }

   _flush() {
      this.push(this._root);
   }

}

export default SimpleObj;
