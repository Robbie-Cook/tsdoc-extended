#!/bin/env node

import NodeExtended from "node-extended";
import fs from "fs";

// Capitalize a string
function toCapitalCase(str: string) {
  if (!str || str === "") {
    return str;
  }
  return str[0].toUpperCase() + str.slice(1);
}

/**
 * A class to make generating TSDoc markdown easier
 */
export default class TsDocExtended {
  /**
   * Generate nice markdown docs with examples
   *
   * @example `generateMarkdown('src/')`
   */
  static generateMarkdown(
    srcDir: string = "src",
    ignoredModules?: Array<string>
  ): string {
    NodeExtended.executeSync(
      `npx typedoc ${srcDir ?? "./src"} --json docs/index.json`
    );

    console.log("Generated JSON index...");
    const data = JSON.parse(fs.readFileSync("./docs/index.json").toString());
    console.log("Read JSON index...");

    let stringItems: string[] = [];
    data.children.forEach((item: { name: string; children: any[] }) => {
      if (!(ignoredModules && item.name.replace(/"/g, "") in ignoredModules)) {
        item.children?.forEach((child) => {
          const name = child.name.replace(/"/g, "");
          if (child.comment && !child.name.includes("Props")) {
            stringItems.push(`* **${name}**`);

            const subItems = [];
            if (child.comment.shortText) {
              subItems.push(`\t${child.comment.shortText}`);
            }

            if (child.comment.text) {
              subItems.push(`${child.comment.text}`);
            }

            if (child.comment.tags) {
              subItems.push("");
              const item = `${child.comment.tags.map(
                (tag: { tag: string; text: string }) =>
                  `${toCapitalCase(tag.tag)}: ${tag.text.replace(
                    /\n/g,
                    "\n\t"
                  )}`
              )}`;
              subItems.push(item);
            }

            stringItems.push(subItems.join("\n\t"));
          }
        });
      }
    });
    return stringItems.join("\n");
  }
}

// For require inports
export { TsDocExtended };
