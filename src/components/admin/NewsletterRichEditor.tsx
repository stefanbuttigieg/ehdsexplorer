import React, { useMemo } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

interface NewsletterRichEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const NewsletterRichEditor: React.FC<NewsletterRichEditorProps> = ({ value, onChange, placeholder }) => {
  const modules = useMemo(() => ({
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ color: [] }, { background: [] }],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ align: [] }],
      ['link', 'image'],
      ['blockquote', 'code-block'],
      ['clean'],
    ],
  }), []);

  const formats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'list', 'align',
    'link', 'image',
    'blockquote', 'code-block',
  ];

  return (
    <div className="newsletter-editor">
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder || 'Write your newsletter content here...'}
        style={{ minHeight: '250px' }}
      />
      <style>{`
        .newsletter-editor .ql-container {
          min-height: 200px;
          font-size: 14px;
          border-bottom-left-radius: 0.5rem;
          border-bottom-right-radius: 0.5rem;
        }
        .newsletter-editor .ql-toolbar {
          border-top-left-radius: 0.5rem;
          border-top-right-radius: 0.5rem;
          background: hsl(var(--muted));
        }
        .newsletter-editor .ql-editor {
          min-height: 200px;
        }
        .newsletter-editor .ql-toolbar,
        .newsletter-editor .ql-container {
          border-color: hsl(var(--border));
        }
        .dark .newsletter-editor .ql-toolbar {
          background: hsl(var(--muted));
        }
        .dark .newsletter-editor .ql-editor {
          color: hsl(var(--foreground));
        }
        .dark .newsletter-editor .ql-stroke {
          stroke: hsl(var(--foreground));
        }
        .dark .newsletter-editor .ql-fill {
          fill: hsl(var(--foreground));
        }
        .dark .newsletter-editor .ql-picker-label {
          color: hsl(var(--foreground));
        }
      `}</style>
    </div>
  );
};

export default NewsletterRichEditor;
