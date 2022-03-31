import '@logseq/libs'
import { PageEntity, BlockEntity, SettingSchemaDesc } from '@logseq/libs/dist/LSPlugin';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
export var blocks2 = []

var zip = new JSZip();
export async function getAllPublicPages() {
    logseq.DB.q("(page-property public)").then((result) => {
        const mappedResults = result.map((page) => { return page.name })
        console.log(mappedResults)
        for (const x in mappedResults) {
            console.log(x)
            console.log(mappedResults.length)
            if (x != `${mappedResults.length-1}`){
            getBlocksInPage({ "page": mappedResults[x] }, false, false)
            }
            else{
                getBlocksInPage({ "page": mappedResults[x] }, false, true)
            }
        }

    })
}
export async function getBlocksInPage(e, singleFile, isLast) {
    // async function createExport2() {
    console.log
    let txt = ""
    const curPage = await logseq.Editor.getPage(e.page)
    console.log(curPage)
    const docTree = await logseq.Editor.getPageBlocksTree(curPage.originalName)
    console.log("docTree", docTree)

    //page meta-data
    let finalString = `---\ntitle: \"${curPage.originalName}\"`
    for (const prop in curPage.properties) {
        const pvalue = curPage.properties[prop].toLowerCase
        finalString = `${finalString}\n${prop}:`
        //FIXME ugly
        if ( Array.isArray(pvalue) ) { 
            for (const key in pvalue) finalString=`${finalString}\n- ${pvalue[key].replaceAll("[[", "")}`
        } else { 
            if ( pvalue === "category" ) pvalue = "categories"
            if ( pvalue in ["categories", "tags" ] ) txt = "\n-"
            finalString=`${finalString}${txt} ${pvalue}` 
        }
    }
    finalString = `${finalString}\n---`

    // parse page-content
    finalString = await parsePage(finalString, docTree)

    // finalString = finalString.replaceAll("#+BEGIN_QUOTE", "");
    // finalString = finalString.replaceAll("#+END_QUOTE", "");
    if (singleFile) {
        download(`${curPage.originalName}.md`, finalString);
    }
    else {
        zip.file(`${curPage.originalName}.md`, finalString);
        console.log("HI")
        console.log(isLast)
        if (isLast){
            console.log(zip)
            zip.generateAsync({ type: "blob" })
            .then(function (content) {
                // see FileSaver.js
                saveAs(content, "publicExport.zip");
                zip = new JSZip()
            });
        }
    }
}


async function parsePage(finalString: string, docTree) {
    for (const x in docTree) {
        // skip meta-data
        if (!(parseInt(x) === 0 && docTree[x].level === 1)) {
            // console.log("aq5",docTree[x].content)
            finalString = `${finalString}\n${await parseText(docTree[x])}`;
            if (docTree[x].children.length > 0) finalString = await parsePage(finalString, docTree[x].children)
            // console.log("aq5.5",finalString)      
        }
    }
    // console.log("aq6",finalString)
    return finalString
}


async function parseText(block: BlockEntity) {
    let re:RegExp
    let text = block.content
    // console.log("block", block)
    let txtBefore: string = ""
    let txtAfter: string = "\n"
    const prevBlock: BlockEntity = await logseq.Editor.getBlock(block.left.id, { includeChildren: false })
    // console.log("prevBlock", prevBlock)

    // Add indention — level zero is stripped of "-", rest are lists
    // (unless they're not)
    if (block.level > 1) {
        txtBefore = " ".repeat((block.level - 1) * 2) + "+ "
        // txtBefore = "\n" + txtBefore
        if (prevBlock.level === block.level) txtAfter = ""
    }
    //exceptions (logseq has "-" before every block, Hugo doesn't)
    if (text.substring(0, 3) === "```") txtBefore = ""
    //indent text + add newline after block
    text = txtBefore + text + txtAfter

    //conversion of links to hugo syntax https://gohugo.io/content-management/cross-references/
    if (logseq.settings.linkFormat == "Hugo Format") {
        text = text.replaceAll(/\[\[.*\]\]/g, (match) => {
            const txt = match.substring(2, match.length - 2)
            return `[${txt}]({{< ref ${txt.replaceAll(" ", "_")} >}})`
        })
    }
    if (logseq.settings.linkFormat == "Without brackets") {
        text = text.replaceAll("[[", "")
        text = text.replaceAll("]]", "")
    }

    re = /==(.*?)==/g;
    text = text.replace(re, '{{< logseq/lshighlight >}}$1{{< / logseq/lshighlight >}}');

    re = /#\+BEGIN_NOTE.*\n(.*)\n#\+END_NOTE/gm;
    text = text.replace(re, '{{< logseq/orgnote >}}$1{{< / logseq/orgnote >}}');

    re = /#\+BEGIN_CAUTION.*\n(.*)\n#\+END_CAUTION/gm;
    text = text.replace(re, '{{< logseq/orgcaution >}}$1{{< / logseq/orgcaution >}}');

    re = /#\+BEGIN_TIP.*\n(.*)\n#\+END_TIP/gm;
    text = text.replace(re, '{{< logseq/orgtip >}}$1{{< / logseq/orgtip >}}');

    re = /#\+BEGIN_IMPORTANT.*\n(.*)\n#\+END_IMPORTANT/gm;
    text = text.replace(re, '{{< logseq/orgimportant >}}$1{{< / logseq/orgimportant >}}');

    re = /#\+BEGIN_EXAMPLE.*\n(.*)\n#\+END_EXAMPLE/gm;
    text = text.replace(re, '{{< logseq/orgexample >}}$1{{< / logseq/orgexample >}}');

    re = /#\+BEGIN_PIN.*\n(.*)\n#\+END_PIN/gm;
    text = text.replace(re, '{{< logseq/orgpin >}}$1{{< / logseq/orgpin >}}');

    re = /#\+BEGIN_CAREFUL.*\n(.*)\n#\+END_CAREFUL/gm;
    text = text.replace(re, '{{< logseq/orgcareful >}}$1{{< / logseq/orgcareful >}}');

    re = /#\+BEGIN_WARNING.*\n(.*)\n#\+END_WARNING/gm;
    text = text.replace(re, '{{< logseq/orgwarning >}}$1{{< / logseq/orgwarning >}}');

    console.log("txt", text)
    return text
}

//import into parseText
export async function formatText(text2, number) {
    // console.log("formatText:", text2, number)
    var text: string = text2.replace(/:LOGBOOK:|collapsed:: true/gi, "");
    if (text.includes("CLOCK: [")) {
        text = text.substring(0, text.indexOf("CLOCK: ["));
    }

    const rxGetId = /\(\(([^)]*)\)\)/;
    const blockId = rxGetId.exec(text);
    if (blockId != null) {
        const block = await logseq.Editor.getBlock(blockId[1], {
            includeChildren: true,
        });

        if (block != null) {
            text = text.replace(
                `((${blockId[1]}))`,
                block.content.substring(0, block.content.indexOf("id::"))
            );
        }
    }

    if (text.indexOf(`\nid:: `) === -1) {
        return text;
    } else {
        return text.substring(0, text.indexOf(`\nid:: `));
    }
}

//FIXME don't get it, but it works
function download(filename, text) {
    // console.log("DB:download", filename, text)
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}
  //Conversions to be handled
  //1. DONE Convert page properties
  //2. Remove bullets and indentation ???? in progress
  //3. DONE Translate links from [[Logseq export]] should be translated as `[Logseq export]({{< ref "Logseq_export" >}})`
  //4. Convert to .orig file
