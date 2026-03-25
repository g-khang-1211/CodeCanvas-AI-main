import ReactMarkdown from 'react-markdown';

interface MarkdownRendererProps {
  content: string;
  variant?: 'lesson' | 'chat';
  userMessage?: boolean;
}

export const MarkdownRenderer = ({ content, variant = 'lesson', userMessage = false }: MarkdownRendererProps) => {
  const proseClassName = variant === 'chat'
    ? `prose prose-sm dark:prose-invert max-w-none ${userMessage ? 'prose-headings:text-white prose-p:text-white prose-strong:text-white prose-code:text-white' : ''}`
    : 'prose prose-lg dark:prose-invert max-w-none';

  return (
    <div className={proseClassName}>
      <ReactMarkdown
        components={{
          h1: ({ children }) => variant === 'lesson' ? <h1 className="text-4xl font-extrabold mt-12 mb-6 text-gray-900 dark:text-white leading-tight">{children}</h1> : <h1>{children}</h1>,
          h2: ({ children }) => variant === 'lesson' ? <h2 className="text-2xl font-bold mt-12 mb-6 text-gray-800 dark:text-white border-b border-gray-200 dark:border-gray-800 pb-3">{children}</h2> : <h2>{children}</h2>,
          h3: ({ children }) => variant === 'lesson' ? <h3 className="text-xl font-bold mt-8 mb-4 text-gray-800 dark:text-gray-200">{children}</h3> : <h3>{children}</h3>,
          p: ({ children }) => variant === 'lesson' ? <p className="text-lg leading-loose mb-6 text-gray-700 dark:text-gray-300">{children}</p> : <p>{children}</p>,
          ul: ({ children }) => variant === 'lesson' ? <ul className="list-disc pl-6 mb-6 space-y-3 text-lg text-gray-700 dark:text-gray-300">{children}</ul> : <ul>{children}</ul>,
          ol: ({ children }) => variant === 'lesson' ? <ol className="list-decimal pl-6 mb-6 space-y-3 text-lg text-gray-700 dark:text-gray-300">{children}</ol> : <ol>{children}</ol>,
          li: ({ children }) => variant === 'lesson' ? <li className="pl-2">{children}</li> : <li>{children}</li>,
          code: ({ children, ...props }: any) => {
            const codeText = String(children).replace(/\n$/, '');
            const isInlineCode = !codeText.includes('\n');

            if (isInlineCode) {
              return (
                <code className="bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 px-2 py-0.5 rounded-md text-[0.9em] font-mono border border-indigo-100 dark:border-indigo-800/50 align-middle" {...props}>
                  {children}
                </code>
              );
            }

            if (variant === 'chat') {
              return (
                <div className="my-2 rounded-lg overflow-hidden shadow-lg bg-[#1e1e1e] border border-gray-700/50 text-left">
                  <div className="flex items-center gap-1.5 px-3 py-2 bg-[#2d2d2d] border-b border-gray-700/50">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
                  </div>
                  <div className="p-3 overflow-x-auto">
                    <code className="font-mono text-xs text-gray-200 leading-relaxed" {...props}>
                      {children}
                    </code>
                  </div>
                </div>
              );
            }

            return (
              <div className="my-10 rounded-2xl overflow-hidden shadow-2xl bg-[#1e1e1e] border border-gray-700/50 transform transition-transform hover:scale-[1.01] duration-300">
                <div className="flex items-center gap-2 px-5 py-3 bg-[#2d2d2d] border-b border-gray-700/50">
                  <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                  <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                  <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
                  <div className="ml-auto text-xs text-gray-500 font-mono opacity-50">code</div>
                </div>
                <div className="p-6 overflow-x-auto">
                  <code className="font-mono text-sm text-gray-200 leading-relaxed block" {...props}>
                    {children}
                  </code>
                </div>
              </div>
            );
          },
          blockquote: ({ children }) => variant === 'lesson' ? (
            <blockquote className="border-l-4 border-blue-500 pl-6 py-2 my-8 italic bg-blue-50/50 dark:bg-blue-900/10 rounded-r-xl text-gray-700 dark:text-gray-300">
              {children}
            </blockquote>
          ) : <blockquote>{children}</blockquote>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
