import "@logseq/libs";
import {
  PageEntity,
  BlockEntity,
  SettingSchemaDesc,
} from "@logseq/libs/dist/LSPlugin";
import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import { handleClosePopup } from "./handleClosePopup";
import { getAllPublicPages, getBlocksInPage } from "./utils";

export var path = "";
let settings: SettingSchemaDesc[] = [
  {
    key: "linkFormat",
    type: "enum",
    enumChoices: ["Hugo Format", "Logseq Format [[]]", "Without brackets"],
    enumPicker: "radio",
    title: "How would you like Logseq's internal links to be formatted",
    description:
      "How would you like Logseq's internal links to be formatted, hugo's native style for internal links, logseq style with brackets or just as text with brackets removed?",
    default: "Hugo Format",
  },
];
const main = async () => {
  console.log("plugin loade2d");
  logseq.App.registerPageMenuItem("Export page to hugo", (e) => {
    ReactDOM.render(
      //Render react component
      <React.StrictMode>
        <App />
      </React.StrictMode>,
      document.getElementById("app")
    );
    logseq.showMainUI()
    handleClosePopup()
  });
  logseq.App.registerPageMenuItem(
    "Export all public pages to hugo",
    getAllPublicPages
  );
  logseq.useSettingsSchema(settings);
  path = (await logseq.App.getCurrentGraph()).path;
};

logseq.ready(main).catch(console.error);
