import '@logseq/libs'
import { PageEntity, BlockEntity, SettingSchemaDesc } from '@logseq/libs/dist/LSPlugin';
export var blocks2 = []

export async function getBlocksInPage() {
// async function createExport2() {
    let txt = ""
    const curPage = await logseq.Editor.getCurrentPage()
    const docTree = await logseq.Editor.getCurrentPageBlocksTree()
    
//page meta-data
    let finalString = `---\ntitle: \"${curPage.originalName}\"`
    for (const prop in curPage.properties) {
        const pvalue = curPage.properties[prop]
        finalString = `${finalString}\n${prop}:`
        //FIXME ugly
        if ( Array.isArray(pvalue) ) { 
            for (const key in pvalue) finalString=`${finalString}\n- ${pvalue[key]}`
        } else { 
            if ( pvalue in ["category", "tags" ] ) txt = "\n-"
            finalString=`${finalString}${txt} ${pvalue}` 
        }
    } 
    finalString = `${finalString}\n---`

// parse page-content
    finalString = await parsePage(finalString, docTree)

    // finalString = finalString.replaceAll("#+BEGIN_QUOTE", "");
    // finalString = finalString.replaceAll("#+END_QUOTE", "");
    download(`${curPage.originalName}.orig`, finalString);
}


async function parsePage(finalString:string, docTree) {
    for (const x in docTree) { 
        // skip meta-data
        if ( ! (parseInt(x) === 0 && docTree[x].level === 1) ) {
            // console.log("aq5",docTree[x].content)
            finalString = `${finalString}\n${await parseText(docTree[x])}`;  
            if (docTree[x].children.length > 0) finalString = await parsePage(finalString, docTree[x].children)
            // console.log("aq5.5",finalString)      
        }
    }
    // console.log("aq6",finalString)
    return finalString
}


async function parseText(block:BlockEntity) {
    let text = block.content
    console.log("block",block)
    let txtBefore:string = ""
    let txtAfter:string  = "\n"
    const prevBlock:BlockEntity = await logseq.Editor.getBlock(block.left.id, {includeChildren: false})
    console.log("prevBlock",prevBlock)

    //add ?
    if ( block.level > 1 ) {
        txtBefore = " ".repeat((block.level -1) * 2) + "+ " 
        // txtBefore = "\n" + txtBefore
        if ( prevBlock.level === block.level ) txtAfter = ""
    }
    //exceptions
    if ( text.substring(0,3) === "```" ) txtBefore = ""
    //indent text + add newline after block
    text = txtBefore + text + txtAfter

    //conversion of links to hugo syntax https://gohugo.io/content-management/cross-references/
    if (logseq.settings.linkFormat == "Hugo Format") {
        text = text.replaceAll(/\[\[.*\]\]/g, (match) => {
            const txt = match.substring(2, match.length - 2)
            return `[${txt}]({{< ref ${txt.replaceAll(" ", "_")} >}})`
        })
    }
    if  (logseq.settings.linkFormat == "Without brackets") {
        text = text.replaceAll("[[", "")
        text = text.replaceAll("]]", "")
    }


    
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
