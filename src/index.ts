#!/bin/env node

import NodeExtended from "node-extended";
import fs from "fs";

interface Comment {
  shortText: string;
  text: string;
  tags?: Array<{
    tag: string; // e.g. 'example'
    text: string;
  }>;
}

interface Item {
  id: number;
  name: string;
  kind: number;
  kindString?: string;
  flags?: {
    isExported: true;
  };
  originalName?: string;
  children: Item[];
  signatures?: Array<Partial<Item>>;
  comment?: Comment;
}

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
   * Get comments from an item
   */
  private static getComments(item: Item | Partial<Item>): Array<string> {
    let subItems: string[] = [];
    if (item.comment) {
      if (item.comment.shortText) {
        subItems.push(`\t${item.comment.shortText}`);
      }

      if (item.comment.text) {
        subItems.push(`${item.comment.text}`);
      }

      if (item.comment.tags) {
        subItems.push("");
        const thing = `${item.comment.tags.map(
          (tag: { tag: string; text: string }) =>
            `${toCapitalCase(tag.tag)}: ${tag.text.replace(/\n/g, "\n\t")}`
        )}`;
        subItems.push(thing);
      }
    }
    if (item.signatures) {
      subItems = [...subItems, ...this.getComments(item.signatures[0])];
    }
    return subItems;
  }
  /**
   * Process the children of an item
   */
  private static processChildren(
    item: Item,
    ignoredModules?: Array<string>,
    depth = 0
  ): Array<string> | null {
    if (!item || !item.children) {
      return null;
    }

    console.log(`Processing ${item.name}`);

    const lines: string[] = [];

    for (let child of item.children) {
      if (!child.flags?.isExported) {
        continue;
      }
      console.log(`Processing child ${child.name}`);

      const name = child.name.replace(/"/g, "");

      if (
        !(
          ignoredModules &&
          ignoredModules.includes(child.name.replace(/"/g, "")) &&
          child.kindString === "Module"
        ) &&
        !child.name.includes("Props")
      ) {
        lines.push(`* **${name}**`);
      }

      // Process comments

      lines.push(this.getComments(child).join("\n" + "\t".repeat(depth)));

      // Recursively get data on each child
      const subChildren = this.processChildren(
        child,
        ignoredModules,
        depth + 1
      );
      if (subChildren) {
        subChildren.unshift("");
        const subLines = subChildren.join("\n" + "\t".repeat(depth + 1));

        lines.push(subLines);
      }
    }
    return lines;
  }

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

    const processedChild = this.processChildren(data);
    if (processedChild) {
      stringItems.push(processedChild.join("\n\t"));
    }

    return stringItems.join("\n");
  }
}

// For require inports
export { TsDocExtended };
