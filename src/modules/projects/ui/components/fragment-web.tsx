import React, { useState } from "react";
import {
  Monitor,
  Moon,
  Sun,
  RefreshCw,
  ArrowLeft,
  ArrowRight,
  Home,
  Shield,
  Lock,
  ExternalLink,
  Check,
} from "lucide-react";
import { Fragment } from "@/generated/prisma";

interface Props {
  activeFragment: Fragment;
}

const FragmentWeb = ({ activeFragment }: Props) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(displayUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const displayUrl = activeFragment.sandboxUrl || "https://example.com";

  return (
    <div className={`flex flex-col w-full h-full ${isDarkMode ? "dark" : ""}`}>
      <div className="bg-gray-100 dark:bg-gray-950 border-b border-gray-200 dark:border-gray-700 transition-colors duration-200">
        <div className="flex items-center px-4 py-3 space-x-3">
          <div className="flex items-center space-x-1">
            <button
              className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              disabled
            >
              <ArrowLeft className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </button>
            <button
              className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              disabled
            >
              <ArrowRight className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </button>
            <button
              onClick={handleRefresh}
              className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
              disabled={isLoading}
            >
              <RefreshCw
                className={`w-4 h-4 text-gray-500 dark:text-gray-400 ${
                  isLoading ? "animate-spin" : ""
                }`}
              />
            </button>
            <button className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200">
              <Home className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          <div className="flex-1 flex items-center bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1 shadow-sm">
            <div
              onClick={handleCopy}
              className="flex items-center space-x-2 flex-1 cursor-pointer group"
              title="Click to copy"
            >
              {displayUrl.startsWith("https://") ? (
                <Lock className="w-4 h-4 text-green-500" />
              ) : (
                <Shield className="w-4 h-4 text-gray-400" />
              )}
              <span className="text-sm text-gray-700 dark:text-gray-300 truncate group-hover:underline">
                {displayUrl}
              </span>
              {copied && (
                <Check className="w-4 h-4 text-green-500 transition-opacity duration-200" />
              )}
            </div>
            <button
              onClick={() => window.open(displayUrl, "_blank")}
              className="ml-2 p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              <ExternalLink className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-white dark:bg-gray-900 relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white dark:bg-gray-900 flex items-center justify-center z-10">
            <div className="flex items-center space-x-2">
              <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
              <span className="text-gray-600 dark:text-gray-400">
                Loading...
              </span>
            </div>
          </div>
        )}
        <iframe
          key={activeFragment.sandboxUrl}
          className="w-full h-full border-0"
          sandbox="allow-forms allow-scripts allow-same-origin"
          loading="lazy"
          src={activeFragment.sandboxUrl ?? "google.com"}
          title="Fragment Content"
        />
      </div>
    </div>
  );
};

export default FragmentWeb;
