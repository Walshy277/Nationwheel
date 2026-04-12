import ReactMarkdown from "react-markdown";

export function WikiRenderer({ content }: { content: string }) {
  return (
    <article className="prose-nw max-w-none text-slate-300">
      <ReactMarkdown
        components={{
          h1: ({ children }) => (
            <h1 className="mb-4 text-3xl text-white">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="mb-3 mt-7 text-xl text-white">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-2 mt-6 text-lg text-white">{children}</h3>
          ),
          p: ({ children }) => <p className="my-4 leading-8">{children}</p>,
          ul: ({ children }) => (
            <ul className="my-4 list-disc space-y-2 pl-6">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="my-4 list-decimal space-y-2 pl-6">{children}</ol>
          ),
          li: ({ children }) => <li className="leading-7">{children}</li>,
          a: ({ children, href }) => (
            <a
              href={href}
              className="font-semibold text-emerald-200 underline decoration-emerald-300/40 underline-offset-4"
            >
              {children}
            </a>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-4 border-l-2 border-emerald-300/60 pl-4 text-slate-200">
              {children}
            </blockquote>
          ),
          code: ({ children }) => (
            <code className="rounded-md bg-slate-950 px-1.5 py-0.5 font-mono text-sm text-emerald-100">
              {children}
            </code>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
}
