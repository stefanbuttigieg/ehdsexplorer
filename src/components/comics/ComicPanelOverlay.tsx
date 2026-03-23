/**
 * Speech bubble overlays for comic panels.
 * Renders narration boxes and character speech bubbles on top of the illustration.
 */

interface ComicPanelOverlayProps {
  narration?: string;
  dialogue?: { character: string; text: string }[];
}

// Positions for speech bubbles — spread across the panel
const BUBBLE_POSITIONS = [
  { top: "6%", left: "4%", maxWidth: "44%" },
  { top: "6%", right: "4%", maxWidth: "44%" },
  { bottom: "18%", left: "4%", maxWidth: "44%" },
  { bottom: "18%", right: "4%", maxWidth: "44%" },
];

// Character color accents
const CHARACTER_COLORS: Record<string, string> = {
  Alex: "border-blue-400 bg-blue-50/95 dark:bg-blue-950/90",
  Mia: "border-purple-400 bg-purple-50/95 dark:bg-purple-950/90",
  "Professor Byte": "border-amber-400 bg-amber-50/95 dark:bg-amber-950/90",
  Luna: "border-pink-400 bg-pink-50/95 dark:bg-pink-950/90",
  Max: "border-green-400 bg-green-50/95 dark:bg-green-950/90",
  Sophie: "border-teal-400 bg-teal-50/95 dark:bg-teal-950/90",
  Kai: "border-orange-400 bg-orange-50/95 dark:bg-orange-950/90",
  Elena: "border-rose-400 bg-rose-50/95 dark:bg-rose-950/90",
};

const getCharacterStyle = (character: string) =>
  CHARACTER_COLORS[character] ?? "border-border bg-background/90";

export const ComicPanelOverlay = ({ narration, dialogue }: ComicPanelOverlayProps) => {
  const hasDialogue = dialogue && dialogue.length > 0;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Narration caption box at the top */}
      {narration && (
        <div
          className="absolute top-2 left-2 right-2 z-10"
          style={{ maxWidth: "92%" }}
        >
          <div className="bg-amber-50/95 dark:bg-amber-950/90 border border-amber-300 dark:border-amber-700 rounded px-3 py-1.5 shadow-md">
            <p className="text-[11px] sm:text-xs italic text-amber-900 dark:text-amber-100 leading-snug">
              {narration}
            </p>
          </div>
        </div>
      )}

      {/* Speech bubbles */}
      {hasDialogue &&
        dialogue.map((d, i) => {
          const pos = BUBBLE_POSITIONS[i % BUBBLE_POSITIONS.length];
          // Offset narration-caused bubbles downward
          const adjustedPos = narration
            ? { ...pos, top: pos.top ? `${parseInt(pos.top) + 10}%` : pos.top }
            : pos;

          return (
            <div
              key={i}
              className="absolute z-10"
              style={{
                ...adjustedPos,
                maxWidth: pos.maxWidth,
              }}
            >
              <div
                className={`relative border-2 rounded-2xl px-3 py-2 shadow-lg ${getCharacterStyle(d.character)}`}
              >
                {/* Character name badge */}
                <span className="absolute -top-2.5 left-3 bg-primary text-primary-foreground text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full leading-none">
                  {d.character}
                </span>
                <p className="text-[10px] sm:text-xs leading-snug mt-1 text-foreground">
                  {d.text}
                </p>
                {/* Speech bubble tail */}
                <div
                  className={`absolute -bottom-2 left-6 w-3 h-3 rotate-45 border-b-2 border-r-2 ${getCharacterStyle(d.character)}`}
                />
              </div>
            </div>
          );
        })}
    </div>
  );
};
