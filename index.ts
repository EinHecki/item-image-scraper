import fs from "fs-extra";
import path from "path";
import axios from "axios";
import { load } from "cheerio";

const resolution = "120px";
const blockWikiUrl = "https://minecraft.wiki/w/Block";
const itemWikiUrl = "https://minecraft.wiki/w/Item";
const outputDir = path.join(__dirname, "assets");

await fs.ensureDir(outputDir);

const imageUrls: { imageUrl: string; fileName: string }[] = [];

async function scrapeBlockTextures() {
  const { data: html } = await axios.get(blockWikiUrl);
  const $ = load(html);

  $("div.div-col.columns.column-width")
    .first()
    .find("ul li")
    .each((_, element) => {
      const imgTag = $(element).find("a.mw-file-description img");
      const srcSet = imgTag.attr("srcset");
      const titleTag = $(element).find("a.mw-redirect");

      if (srcSet && titleTag.length > 0) {
        const highResUrl = srcSet.split(",")[0].trim().split(" ")[0];
        const updatedUrl = highResUrl.replace(/\/\d+px-/, `/${resolution}-`);
        const title = titleTag.attr("title");

        if (updatedUrl && title) {
          const sanitizedTitle = title.replace(/\s+/g, "_");
          imageUrls.push({
            imageUrl: `https://minecraft.wiki${updatedUrl}`,
            fileName: `${sanitizedTitle}.png`,
          });
        }
      }
    });
}

async function scrapeItemTextures() {
  const { data: html } = await axios.get(itemWikiUrl);
  const $ = load(html);

  $("div.div-col.columns.column-width:lt(4)")
    .find("ul li")
    .each((_, element) => {
      const imgTag = $(element).find("img.mw-file-element");
      const src = imgTag.attr("src");
      const titleTag = $(element).find("span.sprite-text");

      if (titleTag.length === 0) {
        console.log("No title tag found for item");

        console.log(src);
      }

      if (src && titleTag.length > 0) {
        const highResUrl = src.split(",")[0].trim().split(" ")[0];
        const updatedUrl = highResUrl.replace(/\/\d+px-/, `/${resolution}-`);
        const title = titleTag.text();

        if (updatedUrl && title) {
          const sanitizedTitle = title.replace(/\s+/g, "_");
          imageUrls.push({
            imageUrl: `https://minecraft.wiki${updatedUrl}`,
            fileName: `${sanitizedTitle}.png`,
          });
        }
      }
    });
}

await scrapeBlockTextures();
await scrapeItemTextures();

for (const { imageUrl, fileName } of imageUrls) {
  const filePath = path.join(outputDir, fileName);

  console.log(`${fileName} -> ${imageUrl}`);

  const response = await fetch(imageUrl);
  await Bun.write(filePath, response);
}
