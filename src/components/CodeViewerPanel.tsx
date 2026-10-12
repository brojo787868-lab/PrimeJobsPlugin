import React, { useMemo, useState } from 'react';
import { Copy, Check, Download, FileCode, FolderArchive } from 'lucide-react';
import { PluginConfig } from '../types/plugin';
import { downloadMavenProjectZip, generatePluginFiles } from '../utils/codeGenerator';

interface CodeViewerPanelProps {
  config: PluginConfig;
}

export const CodeViewerPanel: React.FC<CodeViewerPanelProps> = ({ config }) => {
  const files = useMemo(() => generatePluginFiles(config), [config]);
  const [selectedFileIndex, setSelectedFileIndex] = useState<number>(0);
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  const currentFile = files[selectedFileIndex] || files[0];

  const handleCopy = async () => {
    if (!currentFile) return;
    try {
      await navigator.clipboard.writeText(currentFile.content);
      setCopiedPath(currentFile.path);
      setTimeout(() => setCopiedPath(null), 1800);
    } catch {
      // Fallback
    }
  };

  const handleDownloadSingleFile = () => {
    if (!currentFile) return;
    const blob = new Blob([currentFile.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentFile.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const lines = currentFile ? currentFile.content.split('\n') : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Sidebar (4 cols): Maven Project File Explorer */}
      <div className="lg:col-span-4 flex flex-col gap-4">
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-5">
          <div className="pb-3 mb-3 border-b border-slate-800">
            <h2 className="text-sm font-semibold text-white">
              Generated Maven Project Tree
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {files.length} production files · Synchronized with your 5 jobs
            </p>
          </div>

          <div className="space-y-1.5 mb-4">
            {files.map((file, idx) => {
              const isSelected = idx === selectedFileIndex;
              return (
                <button
                  key={file.path}
                  onClick={() => setSelectedFileIndex(idx)}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-500/15 border border-emerald-500/40 text-white'
                      : 'bg-slate-900/60 border border-slate-800/70 text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileCode
                      className={`w-4 h-4 shrink-0 ${
                        file.language === 'java'
                          ? 'text-amber-400'
                          : file.language === 'yaml'
                          ? 'text-emerald-400'
                          : 'text-sky-400'
                      }`}
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-mono font-medium truncate">
                        {file.filename}
                      </div>
                      <div className="text-[10px] font-mono text-slate-500 truncate">
                        {file.path}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase shrink-0">
                    {file.language}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => downloadMavenProjectZip(config)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <FolderArchive className="w-4 h-4" />
            Download Full Maven Project (.zip)
          </button>
        </div>
      </div>

      {/* Right Viewer (8 cols): Code Inspector with Line Numbers */}
      <div className="lg:col-span-8">
        <div className="bg-[#111827] border border-slate-800 rounded-xl overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-slate-900/90 border-b border-slate-800">
            <div>
              <div className="text-xs font-mono font-semibold text-white">
                {currentFile.path}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                {currentFile.description}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                {copiedPath === currentFile.path ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy Code
                  </>
                )}
              </button>

              <button
                onClick={handleDownloadSingleFile}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                Download {currentFile.filename}
              </button>
            </div>
          </div>

          <div className="max-h-[640px] overflow-auto bg-[#090C12] p-4 font-mono text-xs leading-relaxed">
            <table className="w-full border-collapse">
              <tbody>
                {lines.map((line, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/60">
                    <td className="select-none pr-4 text-right text-slate-600 tabular-nums w-10 align-top">
                      {idx + 1}
                    </td>
                    <td className="text-slate-200 whitespace-pre">
                      {line || ' '}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
