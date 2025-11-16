import React, { useMemo } from 'react';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const parsedContent = useMemo(() => {
    if (!content) return [];

    const parseInlineFormatting = (text: string) => {
      // Basic HTML escaping for security before applying markdown.
      const escapedText = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      
      return escapedText
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>');
    };

    // Split content into blocks separated by one or more empty lines.
    const blocks = content.split(/\n\s*\n/);

    return blocks.map((block, index) => {
        if (!block.trim()) return null;

        const lines = block.trim().split('\n');
        const isList = lines.every(line => line.trim().startsWith('- '));

        if (isList) {
            return (
                <ul key={`ul-${index}`} className="list-disc list-inside">
                    {lines.map((item, itemIndex) => (
                        <li key={`li-${itemIndex}`} dangerouslySetInnerHTML={{ __html: parseInlineFormatting(item.trim().substring(2)) }} />
                    ))}
                </ul>
            );
        } else {
            // Join lines with newline characters to be handled by whitespace-pre-wrap
            return <p key={`p-${index}`} dangerouslySetInnerHTML={{ __html: parseInlineFormatting(block) }} />;
        }
    });
  }, [content]);

  return (
    <div className="text-sm whitespace-pre-wrap prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0.5 prose-strong:text-f1-text-light dark:prose-strong:text-white">
      {parsedContent}
    </div>
  );
};

export default MarkdownRenderer;
