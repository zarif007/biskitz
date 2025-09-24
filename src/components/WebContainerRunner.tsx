'use client';

import { useEffect, useRef, useState } from 'react';
import { WebContainer, FileSystemTree } from '@webcontainer/api';

interface FileCollection {
  [path: string]: string;
}

interface Props {
  files: FileCollection;
}

// Global WebContainer instance
let globalWebContainer: WebContainer | null = null;
let isBooting = false;

export default function WebContainerRunner({ files }: Props) {
  const [webcontainer, setWebcontainer] = useState<WebContainer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [output, setOutput] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string>('');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  // Convert flat file structure to WebContainer's nested structure
  const convertToFileSystemTree = (files: FileCollection): FileSystemTree => {
    const tree: FileSystemTree = {};
    
    Object.entries(files).forEach(([path, contents]) => {
      const parts = path.split('/').filter(part => part !== ''); // Remove empty parts
      let current = tree;
      
      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (!current[part]) {
          current[part] = {
            directory: {}
          };
        }
        
        // Type guard to ensure we're working with a directory
        if ('directory' in current[part]) {
          current = current[part].directory!;
        } else {
          throw new Error(`Conflicting file/directory at path: ${parts.slice(0, i + 1).join('/')}`);
        }
      }
      
      const fileName = parts[parts.length - 1];
      current[fileName] = {
        file: {
          contents
        }
      };
    });
    
    return tree;
  };

  // Initialize WebContainer
  useEffect(() => {
    let mounted = true;

    const initWebContainer = async () => {
      if (typeof window === 'undefined') {
        console.log('Not in browser environment');
        return;
      }
      
      try {
        console.log('Initializing WebContainer...');
        
        // If we already have a global instance, use it
        if (globalWebContainer) {
          console.log('Using existing WebContainer instance');
          if (mounted) {
            setWebcontainer(globalWebContainer);
            setIsLoading(false);
          }
          return;
        }

        // If already booting, wait for it
        if (isBooting) {
          console.log('WebContainer is already booting, waiting...');
          const checkInterval = setInterval(() => {
            if (globalWebContainer && mounted) {
              setWebcontainer(globalWebContainer);
              setIsLoading(false);
              clearInterval(checkInterval);
            }
          }, 100);
          return;
        }

        // Boot new instance
        isBooting = true;
        console.log('Booting new WebContainer instance...');
        
        const container = await WebContainer.boot();
        globalWebContainer = container;
        isBooting = false;
        
        console.log('WebContainer booted successfully');
        
        if (mounted) {
          setWebcontainer(container);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('WebContainer initialization error:', err);
        isBooting = false;
        if (mounted) {
          setError(`Failed to initialize WebContainer: ${err}`);
          setIsLoading(false);
        }
      }
    };

    initWebContainer();

    return () => {
      mounted = false;
    };
  }, []);

  // Mount files when webcontainer is ready or files change
  useEffect(() => {
    if (!webcontainer || !files || Object.keys(files).length === 0) {
      console.log('Skipping file mount:', { hasContainer: !!webcontainer, hasFiles: Object.keys(files || {}).length > 0 });
      return;
    }

    const mountFiles = async () => {
      try {
        console.log('Mounting files...');
        setError('');
        const fileSystemTree = convertToFileSystemTree(files);
        console.log('FileSystemTree:', fileSystemTree);
        await webcontainer.mount(fileSystemTree);
        setOutput(prev => prev + '\n📁 Files mounted successfully');
        console.log('Files mounted successfully');
      } catch (err) {
        console.error('File mounting error:', err);
        setError(`Failed to mount files: ${err}`);
      }
    };

    mountFiles();
  }, [webcontainer, files]);

  // Install dependencies
  const installDependencies = async () => {
    if (!webcontainer) {
      setError('WebContainer not ready');
      return;
    }

    try {
      setIsRunning(true);
      setError('');
      setOutput(prev => prev + '\n📦 Installing dependencies...');

      const installProcess = await webcontainer.spawn('npm', ['install']);
      
      installProcess.output.pipeTo(
        new WritableStream({
          write(data) {
            setOutput(prev => prev + data);
          },
        })
      );

      const exitCode = await installProcess.exit;
      if (exitCode !== 0) {
        throw new Error(`Installation failed with exit code ${exitCode}`);
      }

      setOutput(prev => prev + '\n✅ Dependencies installed successfully');
    } catch (err) {
      console.error('Installation error:', err);
      setError(`Installation failed: ${err}`);
    } finally {
      setIsRunning(false);
    }
  };

  // Run the application
  const runApplication = async () => {
    if (!webcontainer) {
      setError('WebContainer not ready');
      return;
    }

    try {
      setIsRunning(true);
      setError('');
      setOutput(prev => prev + '\n🚀 Starting application...');

      const startProcess = await webcontainer.spawn('npm', ['start']);
      
      startProcess.output.pipeTo(
        new WritableStream({
          write(data) {
            setOutput(prev => prev + data);
          },
        })
      );

      // Listen for server ready event
      webcontainer.on('server-ready', (port, url) => {
        if (iframeRef.current) {
          iframeRef.current.src = url;
        }
        setOutput(prev => prev + `\n🌐 Server ready at ${url}`);
      });

    } catch (err) {
      console.error('Application start error:', err);
      setError(`Failed to start application: ${err}`);
    } finally {
      setIsRunning(false);
    }
  };

  // Execute a specific command
  const executeCommand = async (command: string, args: string[] = []) => {
    if (!webcontainer) {
      setError('WebContainer not ready');
      return;
    }

    try {
      setError('');
      setOutput(prev => prev + `\n$ ${command} ${args.join(' ')}`);
      
      const process = await webcontainer.spawn(command, args);
      
      process.output.pipeTo(
        new WritableStream({
          write(data) {
            setOutput(prev => prev + data);
          },
        })
      );

      const exitCode = await process.exit;
      setOutput(prev => prev + `\nProcess exited with code ${exitCode}`);
    } catch (err) {
      console.error('Command execution error:', err);
      setError(`Command execution failed: ${err}`);
    }
  };

  // Clear output
  const clearOutput = () => {
    setOutput('');
    setError('');
  };

  // Auto-scroll output
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-3">Initializing WebContainer...</span>
        <div className="ml-4 text-sm text-gray-500">
          Check browser console for details
        </div>
      </div>
    );
  }

  if (error && !webcontainer) {
    return (
      <div className="p-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Initialization Error:</strong> {error}
          <div className="mt-2 text-sm">
            Make sure you're running in a supported browser and check the console for more details.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-gray-50">
      {/* Status Bar */}
      <div className="bg-gray-800 text-white px-4 py-2 text-sm flex justify-between">
        <span>WebContainer Status: {webcontainer ? '✅ Ready' : '❌ Not Ready'}</span>
        <span>Files: {Object.keys(files).length}</span>
      </div>

      {/* Controls */}
      <div className="bg-white border-b p-4 flex gap-2 flex-wrap">
        <button
          onClick={installDependencies}
          disabled={!webcontainer || isRunning}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Install Dependencies
        </button>
        
        <button
          onClick={runApplication}
          disabled={!webcontainer || isRunning}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Run Application
        </button>
        
        <button
          onClick={() => executeCommand('npm', ['run', 'build'])}
          disabled={!webcontainer || isRunning}
          className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Build
        </button>
        
        <button
          onClick={clearOutput}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Clear Output
        </button>
        
        {isRunning && (
          <div className="flex items-center ml-4">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-sm text-gray-600">Running...</span>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex">
        {/* Output Terminal */}
        <div className="w-1/2 flex flex-col">
          <div className="bg-gray-800 text-white p-2 text-sm font-semibold">
            Output
          </div>
          <div
            ref={outputRef}
            className="flex-1 bg-black text-green-400 p-4 font-mono text-sm overflow-auto"
            style={{ minHeight: '400px' }}
          >
            {output || 'Ready to run commands...'}
          </div>
        </div>

        {/* Preview Area */}
        <div className="w-1/2 flex flex-col border-l">
          <div className="bg-gray-800 text-white p-2 text-sm font-semibold">
            Preview
          </div>
          <div className="flex-1 bg-white">
            <iframe
              ref={iframeRef}
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-same-origin allow-forms allow-modals"
              title="WebContainer Preview"
            />
          </div>
        </div>
      </div>

      {/* File Explorer */}
      <div className="border-t bg-white p-4">
        <details>
          <summary className="cursor-pointer font-semibold mb-2">
            Files ({Object.keys(files).length})
          </summary>
          <div className="max-h-32 overflow-auto bg-gray-50 p-2 rounded text-sm">
            {Object.keys(files).map(path => (
              <div key={path} className="font-mono text-gray-600">
                {path}
              </div>
            ))}
          </div>
        </details>
      </div>
    </div>
  );
}