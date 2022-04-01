import React, { useRef, useState } from "react";
import ReactDOM from "react-dom";
import "./App.css";
import "./tailwind.css"
const App: React.FC = () => {
  return (
    <div>
      <div className="overlay">
      <div className="flex justify-center w-screen">
          <div className="smartblock-inserter">
            <h1 className=" w-max text-left text-xl">Hugo Export</h1>
            <div className="grid grid-cols-2 gap-4 place-items-auto">
              <p>Note Name</p>
              <input id="Note Name"type="text" />
              <p>Hugo File Name</p>
              <input id="Hugo File Name"type="text" />
              <p>Original Date</p>
              <input id="Original Date"type="text" />
              <p>Updated Post Date</p>
              <input id="Updated Post Date"type="text" />
            </div>
            </div>
      </div>
      </div>
    </div>
  );
};
export default App;
