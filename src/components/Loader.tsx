// Filename - loader.js

import React from "react";
import { TailSpin } from "react-loader-spinner";

interface LoaderProps {
  height?: string;
  width?: string;
}

const LoaderComp: React.FC<LoaderProps> = ({ height }) => {
  return (
    <TailSpin
      height={`${height ? height : 80}`}
      width="80"
      color="#3b82f6"
      ariaLabel="tail-spin-loading"
      radius="1"
      wrapperStyle={{}}
      wrapperClass=""
      visible={true}
    />
  );
};

export default LoaderComp;
