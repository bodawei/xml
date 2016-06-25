/* Copyright ® 2016 by David John Burrowes. All rights reserved. */

'use strict';

function Offset(line, column, index) {
   this.line = line;
   this.column = column;
   this.index = index;
}

Offset.prototype.clone = function clone() {
   return new Offset(this.line, this.column, this.index);
};

module.exports = Offset;
