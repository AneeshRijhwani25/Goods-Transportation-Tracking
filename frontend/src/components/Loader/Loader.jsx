import React from "react";

const Loader = ({ show }) => {
  return (
    show && (
      <div
        className={`fixed inset-0 flex items-center justify-center bg-white bg-opacity-80 ${
          show ? "z-50" : "hidden"
        }`}
      >
        <div className="flex flex-row gap-2 text-center">
          <div className="w-4 h-4 rounded-full bg-blue-700 animate-bounce [animation-delay:.7s]"></div>
          <div className="w-4 h-4 rounded-full bg-blue-700 animate-bounce [animation-delay:.3s]"></div>
          <div className="w-4 h-4 rounded-full bg-blue-700 animate-bounce [animation-delay:.7s]"></div>
        </div>
      </div>
    )
  );
};

export default Loader;
