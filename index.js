import '@logseq/libs';

//Inputs 5 numbered blocks when called
async function insertSomeBlocks (e) {
  console.log('Open the calendar!')
  let numberArray = [1, 2, 3, 4, 5]
  for (const number in numberArray){
  logseq.App.showMsg("Function has been run")
  logseq.Editor.insertBlock(e.uuid, `This is block ${numberArray[number]}`, {sibling: true})}

  }
  

const main = async () => {
  console.log('plugin loaded');
  logseq.Editor.registerSlashCommand('insertBlocks', async (e) => {
    insertSomeBlocks(e)
  }
    
  )}

logseq.ready(main).catch(console.error);
