const maxBlockCommentLen = require('./max-block-comment-len');

module.exports = {
   rules: {
       "no-template-literals": {
           create: maxBlockCommentLen
       }
   }
};
