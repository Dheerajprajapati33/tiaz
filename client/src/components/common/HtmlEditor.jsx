import React, { useState, useRef, useEffect } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Heading1,
  Heading2,
  Link as LinkIcon,
  Unlink,
  List,
  ListOrdered,
  Code,
  Eye,
  Edit3,
  RotateCcw,
  Save,
  Check
} from 'lucide-react';
import Button from './Button.jsx';

export default function HtmlEditor({
  value = '',
  onChange,
  onSave,
  title,
  subtitle,
  placeholder = 'Write HTML content here...'
}) {
  const [htmlContent, setHtmlContent] = useState(value);
  const [viewMode, setViewMode] = useState('visual'); // 'visual' | 'code' | 'preview'
  const [isSaved, setIsSaved] = useState(false);
  const editorRef = useRef(null);

  // Sync internal state when incoming value changes
  useEffect(() => {
    setHtmlContent(value);
    if (editorRef.current && viewMode === 'visual') {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value;
      }
    }
  }, [value]);

  // Sync contentEditable when switching back to visual mode
  useEffect(() => {
    if (viewMode === 'visual' && editorRef.current) {
      if (editorRef.current.innerHTML !== htmlContent) {
        editorRef.current.innerHTML = htmlContent;
      }
    }
  }, [viewMode]);

  const handleVisualInput = () => {
    if (editorRef.current) {
      const newHtml = editorRef.current.innerHTML;
      setHtmlContent(newHtml);
      if (onChange) onChange(newHtml);
      setIsSaved(false);
    }
  };

  const handleCodeChange = (e) => {
    const newHtml = e.target.value;
    setHtmlContent(newHtml);
    if (onChange) onChange(newHtml);
    setIsSaved(false);
  };

  const executeCommand = (command, argument = null) => {
    if (viewMode !== 'visual') return;
    if (editorRef.current) {
      editorRef.current.focus();
    }
    document.execCommand(command, false, argument);
    handleVisualInput();
  };

  const handleAddLink = () => {
    const url = prompt('Enter URL (e.g. https://tiaz.gold or mailto:support@tiaz.gold):');
    if (url) {
      executeCommand('createLink', url);
    }
  };

  const handleSave = () => {
    if (onSave) onSave(htmlContent);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col">
      {/* Editor Header */}
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-gradient-to-r from-amber-50/50 via-white to-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          {title && (
            <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>{title}</span>
              <span className="text-[10px] uppercase font-bold text-amber-900 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded font-mono">
                Direct HTML
              </span>
            </h3>
          )}
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>

        {/* View mode toggle + Save Button */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('visual')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                viewMode === 'visual'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-600" />
              <span>Visual Editor</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('preview')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                viewMode === 'preview'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5 text-emerald-600" />
              <span>Live Preview</span>
            </button>
          </div>

          <Button
            variant="primary"
            size="sm"
            icon={isSaved ? Check : Save}
            onClick={handleSave}
            className="shrink-0"
          >
            {isSaved ? 'Saved!' : 'Save HTML'}
          </Button>
        </div>
      </div>

      {/* Formatting Toolbar (shown when in visual mode) */}
      {viewMode === 'visual' && (
        <div className="px-4 py-2 bg-slate-50/90 border-b border-slate-200 flex flex-wrap items-center gap-1 text-slate-700">
          <div className="flex items-center gap-0.5 border-r border-slate-200 pr-2 mr-1">
            <button
              type="button"
              onClick={() => executeCommand('formatBlock', '<h1>')}
              title="Heading 1 (H1)"
              className="p-1.5 rounded hover:bg-slate-200 hover:text-slate-900 transition-colors flex items-center gap-1 text-xs font-bold"
            >
              <Heading1 className="w-4 h-4" />
              <span>H1</span>
            </button>
            <button
              type="button"
              onClick={() => executeCommand('formatBlock', '<h2>')}
              title="Heading 2 (H2)"
              className="p-1.5 rounded hover:bg-slate-200 hover:text-slate-900 transition-colors flex items-center gap-1 text-xs font-bold"
            >
              <Heading2 className="w-4 h-4" />
              <span>H2</span>
            </button>
            <button
              type="button"
              onClick={() => executeCommand('formatBlock', '<p>')}
              title="Paragraph"
              className="px-2 py-1 rounded hover:bg-slate-200 hover:text-slate-900 transition-colors text-xs font-semibold"
            >
              Paragraph
            </button>
          </div>

          <div className="flex items-center gap-0.5 border-r border-slate-200 pr-2 mr-1">
            <button
              type="button"
              onClick={() => executeCommand('bold')}
              title="Bold (Ctrl+B)"
              className="p-1.5 rounded hover:bg-slate-200 hover:text-slate-900 transition-colors"
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => executeCommand('italic')}
              title="Italic (Ctrl+I)"
              className="p-1.5 rounded hover:bg-slate-200 hover:text-slate-900 transition-colors"
            >
              <Italic className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => executeCommand('underline')}
              title="Underline (Ctrl+U)"
              className="p-1.5 rounded hover:bg-slate-200 hover:text-slate-900 transition-colors"
            >
              <Underline className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-0.5 border-r border-slate-200 pr-2 mr-1">
            <button
              type="button"
              onClick={handleAddLink}
              title="Insert Link (<a> tag)"
              className="p-1.5 rounded hover:bg-slate-200 hover:text-slate-900 transition-colors"
            >
              <LinkIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => executeCommand('unlink')}
              title="Remove Link"
              className="p-1.5 rounded hover:bg-slate-200 hover:text-slate-900 transition-colors"
            >
              <Unlink className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-0.5 border-r border-slate-200 pr-2 mr-1">
            <button
              type="button"
              onClick={() => executeCommand('insertUnorderedList')}
              title="Bullet List"
              className="p-1.5 rounded hover:bg-slate-200 hover:text-slate-900 transition-colors"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => executeCommand('insertOrderedList')}
              title="Numbered List"
              className="p-1.5 rounded hover:bg-slate-200 hover:text-slate-900 transition-colors"
            >
              <ListOrdered className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => executeCommand('removeFormat')}
            title="Clear Formatting"
            className="p-1.5 rounded hover:bg-slate-200 hover:text-slate-900 transition-colors text-xs text-slate-500"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Editor Body */}
      <div className="p-4 sm:p-6 min-h-[380px] bg-white">
        {/* 1. Visual Mode (contentEditable) */}
        {viewMode === 'visual' && (
          <div
            ref={editorRef}
            contentEditable
            onInput={handleVisualInput}
            className="prose prose-sm max-w-none min-h-[340px] focus:outline-none text-slate-800 leading-relaxed font-sans [&_h1]:text-2xl [&_h1]:font-extrabold [&_h1]:text-slate-900 [&_h1]:mb-3 [&_h1]:border-b [&_h1]:border-slate-100 [&_h1]:pb-2 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-slate-900 [&_h2]:mt-4 [&_h2]:mb-2 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3 [&_li]:mb-1 [&_a]:text-amber-800 [&_a]:underline [&_a]:font-semibold [&_b]:font-bold"
            data-placeholder={placeholder}
          />
        )}

        {/* 2. Code Mode (Direct Raw HTML Textarea) */}
        {viewMode === 'code' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>Direct HTML Source (Sent directly to API / Mobile App)</span>
              <span>{htmlContent.length} characters</span>
            </div>
            <textarea
              value={htmlContent}
              onChange={handleCodeChange}
              rows={16}
              className="w-full font-mono text-xs sm:text-sm bg-slate-950 text-emerald-400 p-4 rounded-xl border border-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400/50 leading-relaxed resize-y"
              placeholder="<h1>Your HTML here...</h1>"
            />
          </div>
        )}

        {/* 3. Live Preview Mode */}
        {viewMode === 'preview' && (
          <div className="border border-slate-200 rounded-xl p-5 sm:p-7 bg-slate-50/50 min-h-[340px]">
            <div className="text-[11px] uppercase tracking-wider font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 w-fit mb-4">
              Client App Render Preview
            </div>
            <div
              className="prose prose-sm max-w-none text-slate-800 leading-relaxed [&_h1]:text-2xl [&_h1]:font-extrabold [&_h1]:text-slate-900 [&_h1]:mb-3 [&_h1]:border-b [&_h1]:border-slate-200 [&_h1]:pb-2 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-slate-900 [&_h2]:mt-5 [&_h2]:mb-2 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3 [&_li]:mb-1 [&_a]:text-amber-800 [&_a]:underline [&_a]:font-semibold [&_b]:font-bold"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          </div>
        )}
      </div>

      {/* Editor Footer / Info Bar */}
      <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-slate-500 gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
          <span>Supports: <b>H1/H2</b>, <b>Bold</b>, <b>Italic</b>, <b>&lt;a&gt; Links</b>, <b>Lists</b>, and <b>Raw HTML tags</b>.</span>
        </div>
        <div className="font-mono text-[11px] text-slate-400">
          Rendered via HTML API
        </div>
      </div>
    </div>
  );
}
