import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import { BlockEntity, PageEntity } from '@logseq/libs/dist/LSPlugin';
import { exportToSvg } from '@excalidraw/utils';
import { linkFormats, path } from './index';

let allPublicPages: PageEntity[];
let allPublicLinks: string[] = [];
let zip = new JSZip();
let imageTracker: string[] = [];

export async function getAllPublicPages() {
  const query = `[:find (pull ?p [*]) :where [?p :block/properties ?pr] [(get ?pr :public) ?t] [(= true ?t)] [?p :block/name ?n]]`;
  allPublicPages = (await logseq.DB.datascriptQuery(query))?.flat() || [];
  allPublicLinks = allPublicPages.map((page) => page['original-name'].toLowerCase());

  for (let i = 0; i < allPublicPages.length; i++) {
    await getBlocksInPage(allPublicPages[i], i === allPublicPages.length - 1);
  }
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}
async function parsePageProperties(page: PageEntity) {
  const properties = page.properties || {};
  const nameParts = page['original-name'].split('/');

  const metadata = {
    title: properties.title || page['original-name'],
    slug: properties.slug
    ? properties.slug.toLowerCase().replace(/\s+/g, '-')
    : nameParts.join('/').replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '').toLowerCase().replace(/\s+/g, '-'),
    tags: properties.tags || [],
    categories: properties.categories || properties.category || [],
    date: properties.date || formatDate(page['created-at']),
    lastMod: properties.lastmod || formatDate(page['updated-at']),
    public: properties.public || false,
    blogtitle: properties.blogtitle || '',
    description: properties.description || ''
  };

  if (properties.coverimage) {
    metadata['coverimage'] = `../..${properties.coverimage.replace(/^"(.*)"$/, '$1')}`;
  }

  let yamlString = '---';
  for (const [key, value] of Object.entries(metadata)) {
    if (value && value.length > 0) {
      if (Array.isArray(value)) {
        if (key === 'tags') {
          yamlString += `\n${key}:`;
          for (const tag of value) {
            yamlString += `\n  - ${tag}`;
          }
        } else {
          yamlString += `\n${key}: ${value.map(v => `${v}`).join(', ')}`;
        }
      } else {
        yamlString += `\n${key}: ${value}`;
      }
    }
  }
  yamlString += '\n---\n\n';
  yamlString = yamlString.trim();

  return yamlString;
}

export async function getBlocksInPage(page: PageEntity, isLastPage: boolean) {
  const pageTitle = 'originalName' in page ? page['original-name'] : page.name;
  const pageBlocks = await logseq.Editor.getPageBlocksTree(pageTitle);
  const yamlString = await parsePageProperties(page);
  let markdownString = await parseBlocks(yamlString, pageBlocks);

  const fileName = `${pageTitle.split('/').pop()?.replace(/\s+/g, '-') || 'untitled'}.md`;
  zip.file(`pages/${fileName}`, markdownString);

  if (isLastPage) {
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, 'logseq-export.zip');
    zip = new JSZip();
  }
}

async function parseBlocks(markdownString: string, blocks: BlockEntity[]): Promise<string> {
  for (const block of blocks) {
    if (block.content) {
      markdownString += (await parseBlockContent(block)) + '\n\n';
    }
    if (block.children.length > 0) {
      markdownString = await parseBlocks(markdownString, block.children);
    }
  }
  return markdownString;
}

async function parseBlockContent(block: BlockEntity): Promise<string> {
  let content = block.content;
  content = content.replace(/^[a-z]+::.*\n/gim, '');


  // Convert Excalidraw blocks to image links
  const excalidrawRegex = /\[\[draws\/([0-9]{4}-[0-9]{2}-[0-9]{2}-[0-9]{2}-[0-9]{2}-[0-9]{2})\.excalidraw\]\]/gi;
  const excalidrawMatches = content.matchAll(excalidrawRegex);
  for (const match of excalidrawMatches) {
    const drawName = match[1];
    const filePath = `${path}/draws/${drawName}.excalidraw`;
    const response = await fetch(filePath);
    const json = await response.json();
    const svg = await exportToSvg(json);
    const base64 = window.btoa(svg.outerHTML);
    zip.file(`assets/${drawName}.svg`, base64, { base64: true });
    content = content.replace(match[0], `![${drawName}](/assets/${drawName}.svg)`);
  }

  // Expand block references
  const blockRefRegex = /\(\(([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\)\)/gi;
  const blockRefMatches = content.matchAll(blockRefRegex);
  for (const match of blockRefMatches) {
    const refBlock = await logseq.Editor.getBlock(match[1], { includeChildren: true });
    if (refBlock) {
      content = content.replace(match[0], refBlock.content.replace(/\s*id::.*/i, ''));
    }
  }

  // Remove heading properties and task markers
  content = content.replace(/heading:: \d|NOW|\[\]|LATER|DOING|DONE|WAITING|CANCELED/gi, '');

  // Convert image links and add images to the ZIP file
  const imageRegex = /!\[.*?\]\((.*?)\)/gi;
  const imageMatches = content.matchAll(imageRegex);
  for (const match of imageMatches) {
    let imagePath = match[1].replace(/^\.?\//, '');
    if (!imagePath.startsWith('http') && !imagePath.endsWith('.pdf')) {
      try {
        imagePath = imagePath.replace(/\.\.\//g, '/');

        const response = await fetch(`${path}/${imagePath}`);
        const blob = await response.blob();
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
        zip.file(`assets/${imagePath.split('/').pop()}`, base64.split(',')[1], { base64: true });
        content = content.replace(match[1], `/assets/${imagePath.split('/').pop()}`);
      } catch (error) {
        console.error(`Error processing image: ${imagePath} ${error}`);
      }
    }
    const imagePropertiesRegex = /{:height\s*\d+,\s*:width\s*\d+}/gi;
    content = content.replace(imagePropertiesRegex, '');
  }

  // Convert YouTube and Twitter links to Hugo shortcodes
  content = content.replace(/{{\s*(?:youtube|video)\s+(https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([^\s}]+))\s*}}/gi, (_, url, videoId) => `{{< youtube ${videoId} >}}`);

  content = content.replace(/{{(twitter|tweet)\s+(https?:\/\/twitter\.com\/[a-z0-9_]+\/status\/\d+(?:\?[^}\s]+)?)\s*}}/gi, (match, _, tweetUrl) => {
    const [, username, tweetId] = tweetUrl.match(/twitter\.com\/([a-z0-9_]+)\/status\/(\d+)/i) || [];
    return username && tweetId ? `{{< tweet user="${username}" id="${tweetId}" >}}` : tweetUrl;
  });
  // Remove code block properties and logbook entries
  content = content.replace(/(?:(?:```[a-z]*\n)?(?::LOGBOOK:.*\n)+(?:END:.*\n)?```?|:LOGBOOK:.*:END:)/gis, '');
   // Convert org mode quotes to Markdown blockquotes
  content = content.replace(/^#\+BEGIN_QUOTE\s*([\s\S]*?)#\+END_QUOTE/gms, (_, quote) => {
    return quote.split('\n').map(line => `> ${line}`).join('\n') + '\n';
  });
  // Remove indentation and dashes
  content = content.replace(/^\s*[-+*]\s*/gm, '');

  return content;
}

logseq.ready(getAllPublicPages).catch(console.error);