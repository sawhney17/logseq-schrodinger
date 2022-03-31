import '@logseq/libs';
import { PageEntity, BlockEntity, SettingSchemaDesc } from '@logseq/libs/dist/LSPlugin';
import { getBlocksInPage } from './utils';

let settings: SettingSchemaDesc[] = [
  {
    key: "linkFormat",
    type: "enum",
    enumChoices: ["Hugo Format", "Logseq Format [[]]", "Without brackets"],
    enumPicker: "radio",
    title: "How would you like Logseq's internal links to be formatted",
    description: "How would you like Logseq's internal links to be formatted, hugo's native style for internal links, logseq style with brackets or just as text with brackets removed?",
    default: "Hugo Format",
  },
]
const main = async () => {
  console.log('plugin loaded');
  logseq.App.registerPageMenuItem("Export page to hugo", getBlocksInPage);
  logseq.useSettingsSchema(settings)
}

logseq.ready(main).catch(console.error);
