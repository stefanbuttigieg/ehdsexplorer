import { Footnote } from "@/hooks/useFootnotes";

interface FootnotesSectionProps {
  footnotes: Footnote[];
}

const FootnotesSection = ({ footnotes }: FootnotesSectionProps) => {
  if (!footnotes || footnotes.length === 0) return null;

  return (
    <div className="mt-8 pt-6 border-t border-border">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
        Footnotes
      </h3>
      <div className="space-y-3">
        {footnotes.map((footnote) => (
          <div key={footnote.id} className="flex gap-3 text-sm">
            <span className="font-mono text-primary shrink-0">{footnote.marker}</span>
            <p className="text-muted-foreground">{footnote.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FootnotesSection;
