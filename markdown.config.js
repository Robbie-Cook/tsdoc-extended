const fs = require("fs");
const { TsDocExtended } = require("./dist/index");

/* CLI markdown.config.js file example */
module.exports = {
  transforms: {
    /* Match <!-- AUTO-GENERATED-CONTENT:START (API) --> */
    API(content, options) {
      return TsDocExtended.generateMarkdown();
    },
  },
  callback: function () {
    console.log("done");
  },
};
