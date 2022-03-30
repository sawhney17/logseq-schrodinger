import '@logseq/libs'
import { PageEntity, BlockEntity, SettingSchemaDesc } from '@logseq/libs/dist/LSPlugin';
export var blocks2 = []
export function getBlocksInPage() {
    // logseq.Editor.getCurrentPageBlocksTree().then((block) => {
    //     console.log(block)
    //     for (const x in block) {
    //         parseBlocksTree(block[x]);
    //     }

    // })
    // createExport();
    createExport2()
}

async function parsePage(finalString:string, docTree) {
    // console.log("aq3",docTree)
    for (const x in docTree) { 
        // console.log("x",x, docTree[x])
        // skip meta-data
        if ( ! (parseInt(x) === 0 && docTree[x].level === 1) ) {
            // console.log("aq5",docTree[x].content)
            finalString = `${finalString}\n${docTree[x].content}`;  
            if (docTree[x].children.length > 0) finalString = await parsePage(finalString, docTree[x].children)
            // console.log("aq5.5",finalString)      
        }
        console.log("x",x)
    }
    console.log("aq6",finalString)
    return finalString
}

async function createExport2() {
    let curPage = await logseq.Editor.getCurrentPage()
    console.log("aq-o", curPage)
    let finalString = `---\ntitle: \"${curPage.originalName}\"`
    
    const docTree = await logseq.Editor.getCurrentPageBlocksTree()
    console.log("aq-1", docTree)

    //page meta-data
    for (const prop in curPage.properties) {
        const pvalue = curPage.properties[prop]
        finalString = `${finalString}\n${prop}::::`
        //FIXME ugly
        if ( Array.isArray(pvalue) ) { for (const key in pvalue) finalString=`${finalString}\n- ${pvalue[key]}`
        } else { finalString=`${finalString}\n- ${pvalue}` }
    } 
    finalString = `${finalString}\n---`

    // parse page-content
    finalString = await parsePage(finalString, docTree)
    console.log("aq-2",finalString)

    // finalString = finalString.replaceAll("#+BEGIN_QUOTE", "");
    // finalString = finalString.replaceAll("#+END_QUOTE", "");
    download(`${curPage.originalName}.md`, finalString);
}

export async function parseMeta(metaLine) {
    console.log("parseMata:",metaLine)
    let count = 0
    //every second match should be inserted as "\n - (match). Else, it should insert (match:) "
    metaLine = metaLine.replaceAll(/((?<=::).*|.*::)/g, (match) => {
        count++;
        if (count % 2 == 0) {
            //if the value  of "match", split with , is greater than 1, then for each value, insert  "\n - (match) else simply insert match 
            if (match.split(",").length > 1) {
                let finalString = "";
                match.split(",").map(x => {
                    finalString = `${finalString}\n - ${x}`;
                })
                console.log(finalString)
                return finalString.replaceAll("::", ":");
            }
            else {
                console.log("PPP1 match?",match)
                return ` ${match}`;
            }
        } else {
            console.log("PPP2 match?",match.replaceAll("::", ":"))
            return match.replaceAll("::", ":");
        }
    });
}


export async function formatText(text2, number) {
    console.log("formatText:", text2, number)
    var text: string = text2.replace(/:LOGBOOK:|collapsed:: true/gi, "");
    if (text.includes("CLOCK: [")) {
        text = text.substring(0, text.indexOf("CLOCK: ["));
    }

    // // if (logseq.settings[`${template}Options`].includes("Hide Page Properties")) {
    // if (number == 0) {
    //     let count = 0
    //     //every second match should be inserted as "\n - (match). Else, it should insert (match:) "
    //     text = text.replaceAll(/((?<=::).*|.*::)/g, (match) => {
    //         count++;
    //         if (count % 2 == 0) {
    //             //if the value  of "match", split with , is greater than 1, then for each value, insert  "\n - (match) else simply insert match 
    //             if (match.split(",").length > 1) {
    //                 let finalString = "";
    //                 match.split(",").map(x => {
    //                     finalString = `${finalString}\n - ${x}`;
    //                 })
    //                 console.log(finalString)
    //                 return finalString.replaceAll("::", ":");
    //             }
    //             else {
    //                 return ` ${match}`;
    //             }
    //         } else {
    //             console.log("match?",match)
    //             return match.replaceAll("::", ":");
    //         }
    //     });
    // }

    //conversion of links to hugo syntax
    if (logseq.settings.linkFormat == "Hugo Format") {
        text = text.replaceAll(/\[\[.*\]\]/g, (match) => {
            return `[${match.substring(2, match.length - 2)}]({{${match.substring(2, match.length - 2).replaceAll(" ", "_")}}}`
        })
    }
    if  (logseq.settings.linkFormat == "Without brackets") {
        text = text.replaceAll("[[", "")
        text = text.replaceAll("]]", "")
    }

    //convert code blocks and replace every second match with a newline at start
    let count = 0;
    text = text.replaceAll(/(?<!`)`(?!`)/g, (match) => { count += 1; return count % 2 == 0 ? "\n```" : "```\n" })



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
  //2. Remove bullets and indentation
  //3. Translate links from [[Logseq export]] should be translated as `[Logseq export]({{< ref "Logseq_export" >}})`
  //4. Convert to .orig file

  //OLD

export function parseBlocksTree(obj) {
    conductParsing(obj);
    function conductParsing(obj) {
        if (obj.content) {
            let content2 = obj.content
            let level = obj.level;
            blocks2.push([content2, level]);
        }
        obj.children.map(conductParsing);
    }
}


async function createExport() {}
