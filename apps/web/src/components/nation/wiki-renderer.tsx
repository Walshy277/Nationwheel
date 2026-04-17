import Image from "next/image";
import ReactMarkdown from "react-markdown";

function bbcodeToMarkdown(content: string) {
  return content
    .replace(/\[h1\]([\s\S]*?)\[\/h1\]/gi, "# $1")
    .replace(/\[h2\]([\s\S]*?)\[\/h2\]/gi, "## $1")
    .replace(/\[h3\]([\s\S]*?)\[\/h3\]/gi, "### $1")
    .replace(/\[b\]([\s\S]*?)\[\/b\]/gi, "**$1**")
    .replace(/\[i\]([\s\S]*?)\[\/i\]/gi, "_$1_")
    .replace(/\[s\]([\s\S]*?)\[\/s\]/gi, "~~$1~~")
    .replace(/\[quote\]([\s\S]*?)\[\/quote\]/gi, (_, text: string) =>
      text
        .trim()
        .split(/\r?\n/)
        .map((line) => `> ${line}`)
        .join("\n"),
    )
    .replace(/\[code\]([\s\S]*?)\[\/code\]/gi, "\n```\n$1\n```\n")
    .replace(/\[url=([^\]]+)\]([\s\S]*?)\[\/url\]/gi, "[$2]($1)")
    .replace(/\[url\]([\s\S]*?)\[\/url\]/gi, "[$1]($1)")
    .replace(/\[img\]([\s\S]*?)\[\/img\]/gi, "![]($1)")
    .replace(/\[list\]([\s\S]*?)\[\/list\]/gi, (_, text: string) =>
      text.replace(/\[\*\]/g, "\n- ").trim(),
    );
}

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
              rel="noreferrer"
              target={href?.startsWith("http") ? "_blank" : undefined}
              className="font-semibold text-emerald-200 underline decoration-emerald-300/40 underline-offset-4"
            >
              {children}
            </a>
          ),
          img: ({ src, alt }) => (
            <Image
              src={typeof src === "string" ? src : ""}
              alt={alt ?? ""}
              width={900}
              height={520}
              unoptimized
              className="my-5 h-auto max-h-[520px] w-auto max-w-full rounded-lg border border-white/10 object-contain"
            />
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
        {bbcodeToMarkdown(content)}
      </ReactMarkdown>
    </article>
  );
}
