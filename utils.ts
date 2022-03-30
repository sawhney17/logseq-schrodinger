import '@logseq/libs'
export var blocks2 = []
export function getBlocksInPage() {
    logseq.Editor.getCurrentPageBlocksTree().then((block) => {
        console.log(block)
        for (const x in block) {
            parseBlocksTree(block[x]);
        }

    })
    createExport();
}

async function createExport() {
    var finalString = `# ${(await logseq.Editor.getCurrentPage()).originalName}`;
    // var finalString = ``;

    for (const x in blocks2) {
        var formattedText = await formatText(blocks2[x][0], x);
        finalString = `${finalString}\n${formattedText}`;
    }

    finalString = finalString.replaceAll("#+BEGIN_QUOTE", "");
    finalString = finalString.replaceAll("#+END_QUOTE", "");
    console.log(finalString)
    download(`${(await logseq.Editor.getCurrentPage()).originalName}.orig`, finalString);
}

function download(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}


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



export async function formatText(text2, number) {
    var text: string = text2.replace(/:LOGBOOK:|collapsed:: true/gi, "");
    if (text.includes("CLOCK: [")) {
        text = text.substring(0, text.indexOf("CLOCK: ["));
    }

    // if (logseq.settings[`${template}Options`].includes("Hide Page Properties")) {
    if (number == 0) {
        let count = 0
        //every second match should be inserted as "\n - (match). Else, it should insert (match:) "
        text = text.replaceAll(/((?<=::).*|.*::)/g, (match) => {
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
                    return ` ${match}`;
                }
            } else {
                console.log(match)
                return match.replaceAll("::", ":");
            }
        });
        /// Add --- above and below the text
        text = `---\n${text}\n---`;
    }

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

  //Conversions to be handled
  //1. Convert page properties
  //2. Remove bullets and indentation
  //3. Translate links from [[Logseq export]] should be translated as `[Logseq export]({{< ref "Logseq_export" >}})`
  //4. Convert to .orig file
