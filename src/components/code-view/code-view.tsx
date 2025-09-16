import Prism from "prismjs";
import React, { useEffect } from "react";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-typescript";

import "./code-theme.css";

interface Props {
  code: string;
  lang: string;
}

const CodeView = ({ code, lang }: Props) => {
  useEffect(() => {
    Prism.highlightAll();
  }, [code]);
  return (
    <div className="p-2 bg-transparent border-none rounded-none m-0 text-xs">
      <code className={`language-${lang}`}>{code}</code>
    </div>
  );
};

export default CodeView;
