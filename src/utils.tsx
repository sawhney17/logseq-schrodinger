import '@logseq/libs';

import { saveAs } from 'file-saver';
import JSZip, { file } from 'jszip';
import { title } from 'process';
import React from 'react';
import ReactDOM from 'react-dom';

import { BlockEntity, PageEntity, SettingSchemaDesc } from '@logseq/libs/dist/LSPlugin';

import App from './App';
import { handleClosePopup } from './handleClosePopup';
import { linkFormats, path } from './index';
import { exportToSvg } from "@excalidraw/utils";

export var blocks2 = [];
var errorTracker = [];
var zip = new JSZip();
var imageTracker = [];
let allPublicPages;
let allPublicLinks = [] //list of all exported pages

//Retired function
//I kept on missing pages?!?!?!
//Never figured out why
export async function getAllPublicPages_orig() {
  errorTracker = [];
  logseq.DB.q("(page-property public)").then((result) => {
    const mappedResults = result.map((page) => {
      return page.name;
    });
    for (const x in mappedResults) {
      if (x != `${mappedResults.length - 1}`) {
        getBlocksInPage({ page: mappedResults[x] }, false, false);
      } else {
        getBlocksInPage({ page: mappedResults[x] }, false, true);
      }
    }
  });
}

export async function getAllPublicPages() {
  //needs to be both public, and a page (with a name)
  const query =
    "[:find (pull ?p [*]) :where [?p :block/properties ?pr] [(get ?pr :public) ?t] [(= true ?t)][?p :block/name ?n]]";
  allPublicPages = await logseq.DB.datascriptQuery(query);
  allPublicPages = allPublicPages?.flat(); //FIXME is this needed?

  for (const x of allPublicPages) {
    allPublicLinks.push(x["original-name"].toLowerCase())
  }
  
  for (const x in allPublicPages) {
    if (x != `${allPublicPages.length - 1}`) {
      await getBlocksInPage({ page: allPublicPages[x] }, false, false);
    } else {
      await getBlocksInPage({ page: allPublicPages[x] }, false, true);
    }
  }
}

function hugoDate(timestamp) {
  let date = new Date(timestamp);

  //if date.getdate does not have a zero, add A ZERO BEFORE IT
  let month;
  if (date.getMonth() + 1 < 10) {
    month = `0${date.getMonth() + 1}`;
  } else {
    month = `${date.getMonth() + 1}`;
  }
  let day;
  if (date.getDate() < 10) {
    day = `0${date.getDate()}`;
  } else {
    day = `${date.getDate()}`;
  }

  return `${date.getFullYear()}-${month}-${day}`;
}

//parse files meta-data
async function parseMeta(
  curPage,
  tagsArray = [],
  dateArray = [],
  titleDetails = [],
  categoriesArray = []
) {
  let propList = [];

  //get all properties - fix later
  if (curPage?.page.properties != undefined) {
    propList = curPage?.page.properties;
  }
  //Title
  //FIXME is filename used?
  propList.title = curPage.page["original-name"];
  if (titleDetails.length > 0) {
    propList.title = titleDetails[0].noteName;
    propList.fileName = titleDetails[1].hugoFileName;
  }

  //Tags
  propList.tags = curPage?.page.properties.tags
    ? curPage?.page.properties.tags
    : [];
  if (tagsArray != []) {
    let formattedTagsArray = [];
    for (const tag in tagsArray) {
      formattedTagsArray.push(tagsArray[tag].tags);
    }
    if (propList.tags != undefined) {
      for (const tag in formattedTagsArray) {
        propList.tags.push(formattedTagsArray[tag]);
      }
    } else {
      propList.tags = formattedTagsArray;
    }
  }

  //Categories - 2 possible spellings!
  const tmpCat = curPage?.page.properties.category
    ? curPage?.page.properties.category
    : [];
  propList.categories = curPage?.page.properties.categories
    ? curPage?.page.properties.categories
    : tmpCat;
  if (categoriesArray != []) {
    let formattedCategoriesArray = [];
    for (const category in categoriesArray) {
      formattedCategoriesArray.push(categoriesArray[category].category);
    }
    if (propList.categories != undefined) {
      for (const category in formattedCategoriesArray) {
        propList.categories.push(formattedCategoriesArray[category]);
      }
    } else {
      propList.categories = formattedCategoriesArray;
    }
  }

  //Date - if not defined, convert Logseq timestamp
  propList.date = curPage?.page.properties.date
    ? curPage?.page.properties.date
    : hugoDate(curPage.page["created-at"]);
  propList.lastMod = curPage?.page.properties.lastmod
    ? curPage?.page.properties.lastmod
    : hugoDate(curPage.page["updated-at"]);
  if (dateArray.length > 0) {
    propList.date = dateArray[1].originalDate;
    propList.lastMod = dateArray[0].updatedDate;
  }

  //these properties should not be exported to Hugo
  const nope = ["filters", "public"]
  for (const nono of nope){
    delete propList[nono]
  }
  
  //convert propList to Hugo yaml
  // https://gohugo.io/content-management/front-matter/
  let ret = `---`;
  for (let [prop, value] of Object.entries(propList)) {
    if (Array.isArray(value)) {
      ret += `\n${prop}:`;
      value.forEach((element) => (ret += `\n- ${element}`));
    } else {
      ret += `\n${prop}: ${value}`;
    }
  }
  ret += "\n---";
  return ret;
}

export async function getBlocksInPage(
  e,
  singleFile,
  isLast,
  tagsArray = [],
  dateArray = [],
  titleDetails = [],
  categoriesArray = [],
  allPublicPages = []
) {
  //if e.page.originalName is undefined, set page to equal e.page.original-name
  let curPage = e.page;
  if (curPage.originalName != undefined) {
    curPage["original-name"] = curPage.originalName;
  }

  const docTree = await logseq.Editor.getPageBlocksTree(
    curPage["original-name"]
  );

  const metaData = await parseMeta(
    e,
    tagsArray,
    dateArray,
    titleDetails,
    categoriesArray
  );
  // parse page-content

  let finalString = await parsePage(metaData, docTree);

  // FIXME ??
  if (singleFile) {
    logseq.hideMainUI();
    handleClosePopup();
    download(`${titleDetails[1].hugoFileName}.md`, finalString);
  } else {
    // console.log(`e["original-name"]: ${e["original-name"]}`);
    //page looks better in the URL 
    zip.file(
      `pages/${curPage["original-name"].replaceAll(
        /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
        ""
      )}.md`,
      finalString
    );

    if (isLast) {
        //console.log(zip);
    await zip.generateAsync({ type: "blob" }).then(function (content) {
          // see FileSaver.js
          saveAs(content, "publicExport.zip");
          //wait one second
          // setTimeout(() => {
        //   saveAs(content, "publicExport.zip");
          // }, 1000);
          zip = new JSZip();
        });
    }
  }
}

// {{< ytime videoId=C2apEw9pgtw start=25 time=00:25 >}}
function youtubeTimestampShortcode(videoId: string, timestamp:string):string {
  return `{{ ytime videoId="${videoId}" start="${timestamp}" time="${displayTimestamp(timestamp)}" }}`;
}

function extractYoutubeTimestampSeconds(youtubeLink: string): string | null {
  const youtubeTimestampRegex = /{{youtube-timestamp\s(\d+)}}/g;
  const youtubeTimestamp = youtubeLink.match(youtubeTimestampRegex);
  if (youtubeTimestamp != null) {
    return youtubeTimestamp[0].match(/\d+/g)[0];
  }
  return null;
}

function displayTimestamp(seconds:string){
  const timeStampString = new Date(Number.parseInt(seconds) * 1000).toISOString().slice(11, 19);
  //remove leading zeros from hours but not minutes 00:01:26 -> 01:26 , 00:00:26 -> 0:26
  const splitTimestamp = timeStampString.split(":");
  if (splitTimestamp.length <= 2) {
    return timeStampString; 
  } else {
    //remove leading 00:
    if (splitTimestamp[0] === "00") {
      return splitTimestamp.slice(1).join(":");
    } else {
      return timeStampString;
    }
  }
}

// ref = {{< youtube C2apEw9pgtw >}}
function findPreviousYoutubeIdInRef(text:string): (string | null) {
  const youtubeRegex = /{{\s*youtube\s*([a-zA-Z0-9_-]+)\s*}}/g;
  const youtubeId = text.match(youtubeRegex);
  if (youtubeId != null) {
    return youtubeId[youtubeId.length - 1].match(/([a-zA-Z0-9_-]+)/g)[1];
  }
  return null;
}


async function parsePage(finalString: string, docTree) {
  // console.log("DB parsePage")
  for (const x in docTree) {
    // skip meta-data
    if (!(parseInt(x) === 0 && docTree[x].level === 1)) {

      //parseText will return 'undefined' if a block skipped
      const ret = await parseText(finalString, docTree[x])
      if (typeof ret != "undefined") {
        finalString = `${finalString}\n${ret}`;
      }

      if (docTree[x].children.length > 0)
        finalString = await parsePage(finalString, docTree[x].children);
    }
  }
  return finalString;
}

function replaceYoutubeTimestampsWithLinks(blockText: string, pageText:string): string {
  const youtubeTimestampRegex = /{{youtube-timestamp\s(\d+)}}/g;
  const youtubeTimestamps = blockText.match(youtubeTimestampRegex);
  if (youtubeTimestamps != null) {
    youtubeTimestamps.forEach((timestamp) => {
      const youtubeId = findPreviousYoutubeIdInRef(pageText);
      if (youtubeId != null) {
        blockText = blockText.replace(
          timestamp,
          youtubeTimestampShortcode(youtubeId, timestamp.match(/\d+/g)[0])
        );
      }
    });
  }
  return blockText;
}

function parseLinks_old(text: string, allPublicPages) {
  //returns text withh all links converted

  // FIXME This needs to be rewritten (later) so we don't loop all the pages twice
  // conversion of links to hugo syntax https://gohugo.io/content-management/cross-references/
  // Two kinds of links: [[a link]]
  //                     [A description]([[a link]])
  // Regular links are done by Hugo [logseq](https://logseq.com)
  const reLink:RegExp      = /\[\[.*?\]\]/g
  const reDescrLink:RegExp = /\[([a-zA-Z ]*?)\]\(\[\[(.*?)\]\]\)/g
                             //[garden]([[digital garden]])
  if (logseq.settings.linkFormat == "Without brackets") {
    text = text.replaceAll("[[", "");
    text = text.replaceAll("]]", "");
  }
  return text
}

function parseLinks(text: string, allPublicPages) {
  //returns text with all links converted

  // conversion of links to hugo syntax https://gohugo.io/content-management/cross-references/
  // Two kinds of links: [[a link]]
  //                     [A description]([[a link]])
  // Regular links are done by Hugo [logseq](https://logseq.com)
  const reLink:RegExp      = /\[\[(.*?)\]\]/gmi
  const reDescrLink:RegExp = /\[([a-zA-Z ]*?)\]\(\[\[(.*?)\]\]\)/gmi

  // FIXME why doesn't this work?
  // if (! reDescrLink.test(text) && ! reLink.test(text)) return text
  
  // let result
  // while(result = (reDescrLink.exec(text) || reLink.exec(text))) {
  //   if (allPublicLinks.includes(result[result.length - 1].toLowerCase())) {
  //     text = text.replace(result[0],`[${result[1]}]({{< sref "/pages/${result[result.length - 1]}" >}})`)
  //   }
  // } 
    if (logseq.settings.linkFormat == "Without brackets") {
      text = text.replaceAll("[[", "");
      text = text.replaceAll("]]", "");
    }
  return text
}

async function parseNamespaces(text: string, blockLevel: number) {
  const namespace:RegExp = /{{namespace\s([^}]+)}}/gmi

  let result
  while (result = (namespace.exec(text))) {
    const currentNamespaceName = result[result.length - 1];

    const query =
      `[:find (pull ?c [*]) :where [?p :block/name "${currentNamespaceName.toLowerCase()}"] [?c :block/namespace ?p]]`;
    let namespacePages = await logseq.DB.datascriptQuery(query);
    namespacePages = namespacePages?.flat(); //FIXME is this needed?

    let txtBeforeNamespacePage: string = "";
    if (logseq.settings.bulletHandling == "Convert Bullets") {
      txtBeforeNamespacePage = " ".repeat(blockLevel * 2) + "+ ";
    }
    
    let namespaceContent = `**Namespace [[${currentNamespaceName}]]**\n\n`;
    // if (allPublicLinks.includes(currentNamespaceName.toLowerCase())) {
    //   namespaceContent = namespaceContent.replace(`[[${currentNamespaceName}]]`,`[${currentNamespaceName}]({{< sref "/pages/${currentNamespaceName}" >}})`);
    // }

    // for (const page of namespacePages) {
    //   const pageOrigName = page["original-name"];
    //   if (allPublicLinks.includes(page["original-name"].toLowerCase())) {
    //     const pageName = pageOrigName.replace(`${currentNamespaceName}/`, "");
    //     namespaceContent = namespaceContent.concat(txtBeforeNamespacePage + `[${pageName}]({{< sref "/pages/${pageOrigName}" >}})\n\n`);
    //   }
    // }

    text = text.replace(result[0], namespaceContent);
  }

  return text;
}
async function parseText(textSoFar:string="", block: BlockEntity) {
  //returns either a hugo block or `undefined`
  let re: RegExp;
  let text = block.content;
  let txtBefore: string = "";
  let txtAfter: string = "\n";
  const prevBlock: BlockEntity = await logseq.Editor.getBlock(block.left.id, {
    includeChildren: false,
  });  
  //creAte regex to match each excalidraw block such as [[draws/2023-03-07-20-11-28.excalidraw]] and extract filename
  const reDraw:RegExp = /\[\[draws\/([0-9]{4}-[0-9]{2}-[0-9]{2}-[0-9]{2}-[0-9]{2}-[0-9]{2})\.excalidraw\]\]/gmi
  //match all results
  const matches = text.matchAll(reDraw)
  for (const match of matches) {
    try {
    const drawName = match[1]
    const filePath = `${path}/draws/${drawName}.excalidraw`;
    // load file
   const response = await fetch(filePath);
   const svgText = await response.json();
   const diagramSvg = await exportToSvg(svgText);
   const base64 = window.btoa(diagramSvg.outerHTML);
   zip.file(
    "assets/" + drawName + ".svg",
    base64,
    { base64: true }
  );
   } catch (e) {
    console.warn('error fetching file', match, e)
   }
   }

   //replace matches with image markdown tag like ![2021-03-07-20-11-28](/assets/2021-03-07-20-11-28.svg)
    text = text.replace( reDraw, `![$1](assets/$1.svg)`)

  //Block refs - needs to be at the beginning so the block gets parsed
  //FIXME they need some indicator that it *was* an embed
  const rxGetId = /\(\(([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\)\)/;
  const rxGetEd = /{{embed \(\(([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\)\)}}/;
  const blockId = ( rxGetEd.exec(text) || rxGetId.exec(text) )
  if (blockId != null) {
    const block = await logseq.Editor.getBlock(blockId[1], {
      includeChildren: true,
    });

    if (block != null) {
      text = text.replace(
        blockId[0],
        block.content.substring(0, block.content.indexOf("id::"))
      )
    }
  }
  
  // remove heading:: 1 from text
  text = text.replace(/heading:: \d/g, "");
  //task markers - skip
  if (block.marker && ! logseq.settings.exportTasks ) return

  //Images
  //FIXME ![image.png](../assets/image_1650196318593_0.png){:class medium, :height 506, :width 321}
  //Logseq has extra info: height and width that can be used in an image template
  //Get regex to check if text contains a md image
  const reImage = /!\[.*?\]\((.*?)\)/g;
  const imagePromises: Promise<void>[] = [];
  try {
    text.match(reImage).forEach((element) => {
      element.match(/(?<=!\[.*\])(.*)/g).forEach( (match) => {
        let finalLink = match.substring(1, match.length - 1);
        // return (match.substring(1, match.length - 1))
//        text = text.replace(match, match.toLowerCase());
        if (!finalLink.includes("http") || !finalLink.includes(".pdf")) {
          text = text.replace("../", "/");
          imageTracker.push(finalLink);
          imagePromises.push(addImageToZip(finalLink));
        }
      });
    });
    await Promise.all(imagePromises);
  } catch (error) { }

  // FIXME for now all indention is stripped out
  // Add indention — level zero is stripped of "-", rest are lists
  // Experiment, no more lists, unless + or numbers
  // (unless they're not)
  if (logseq.settings.bulletHandling == "Convert Bullets") {
    if (block.level > 1) {
      txtBefore = " ".repeat((block.level - 1) * 2) + "+ ";
      // txtBefore = "\n" + txtBefore
      if (prevBlock.level === block.level) txtAfter = "";
    }
  }
  if (prevBlock.level === block.level) txtAfter = "";
  //exceptions (logseq has "-" before every block, Hugo doesn't)
  if (text.substring(0, 3) === "```") txtBefore = "";
  // Don't - indent images
  if (reImage.test(text)) txtBefore = "";
  //indent text + add newline after block
  text = txtBefore + text + txtAfter;

  //internal links
  text = parseLinks(text, allPublicPages);

  //namespaces
  text = await parseNamespaces(text, block.level);


  //youtube embed
  //Change {{youtube url}} via regex
  const reYoutube = /{{(youtube|video)(.*?)}}/g;
  text = text.replaceAll(reYoutube, (match)=>{
    const youtubeRegex = /(youtu(?:.*\/v\/|.*v\=|\.be\/))([A-Za-z0-9_\-]{11})/
    const youtubeId = youtubeRegex.exec(match)
    if (youtubeId != null) {
      return `{{ youtube ${youtubeId[2]} }}`
    } else {
      return match;
    }
  });

  //twitter embed
  //Change {{(twitter|tweet) url}} via regex

  const reTwitter = /{{(twitter|tweet)(.*)}}/g;
  text = text.replaceAll(reTwitter, (match)=>{
    const twitterRegex = /https:\/\/twitter.com\/([a-zA-Z0-9_]{1,15})\/status\/([0-9]{1,20})/
    const twitterId = twitterRegex.exec(match)
    if (twitterId != null) {
      return `{{ tweet user="${twitterId[1]}" id="${twitterId[2]}" }}`
    } else {
      return match;
    }
  });

  text = replaceYoutubeTimestampsWithLinks(text,textSoFar);
  //height and width syntax regex
  // {:height 239, :width 363}
  const heightWidthRegex = /{:height\s*[0-9]*,\s*:width\s*[0-9]*}/g
  text = text.replaceAll(heightWidthRegex, "")

  //highlighted text, not supported in hugo by default!
  // re = /(==(.*?)==)/gm;
  // text = text.replace(re, "{{< logseq/mark >}}$2{{< / logseq/mark >}}");

  re = /#\+BEGIN_([A-Z]*)[^\n]*\n(.*)#\+END_[^\n]*/gms;
  text = text.replace(re, "$2");
  // text = text.toLowerCase();

  text = text.replace(/:LOGBOOK:|collapsed:: true/gi, "");
  if (text.includes("CLOCK: [")) {
    text = text.substring(0, text.indexOf("CLOCK: ["));
  }

  if (text.indexOf(`\nid:: `) === -1) {
    return text;
  } else {
    return text.substring(0, text.indexOf(`\nid:: `));
  }
}

async function getBase64Image2(url): Promise<string | null>{
  //if the url is a gif png or jpg return null regex
  if (url.match(/(gif|png|jpg|jpeg|webp|mp4)$/i) === null) return null;
// log if mp4
  const response = await fetch(url);
  const blob = await response.blob();
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
     const res = reader.result;
     if (typeof res === 'string'){
      const b64Regex = /^data:(image|video)\/(gif|png|jpg|jpeg|webp|mp4);base64,/;
      if (b64Regex.test(res)) {
       const b64 = res.replace(b64Regex, "");
       resolve(b64);
      } else {
        resolve(null);
      }
     } else {
      resolve(null);
     }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
function getBase64Image(img) {
  var canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  var ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  var dataURL = canvas.toDataURL("image/png");
  return dataURL.replace(/^data:image\/(png|jpg);base64,/, "");
}

async function addImageToZip(filePath) {
  // var element = document.createElement("img");
  let formattedFilePath = filePath.replace("..", path);
  // element.setAttribute("src", formattedFilePath);
  // element.style.display = "none";

  // document.body.appendChild(element);
  try {
    var base64: string = await getBase64Image2(formattedFilePath);
    // document.body.removeChild(element);
// data in base64 regex
    if (base64) {
      zip.file(
        "assets/" +
          filePath.split("/")[filePath.split("/").length - 1],
        base64,
        { base64: true }
      );
    } else {
      // console.log(base64);
    }
} catch (e) {
  console.error(`Error with ${filePath}`);
  }

}

//FIXME don't get it, but it works
function download(filename, text) {
  var element = document.createElement("a");
  element.setAttribute(
    "href",
    "data:text/plain;charset=utf-8," + encodeURIComponent(text)
  );
  // element.setAttribute('download', filename);
  element.setAttribute("download", filename);

  element.style.display = "none";
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}