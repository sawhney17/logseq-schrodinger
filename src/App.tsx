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
              <label>HI</label>
              <label>Bye</label>
              <label>You are cool</label>
              <label>You are mean</label>
            </div>
      </div>
      </div>
    </div>
  );
};
export default App;
