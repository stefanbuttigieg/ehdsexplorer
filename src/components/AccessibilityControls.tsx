import { Sun, Moon, Monitor, Plus, Minus, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/components/ThemeProvider";
import { useFontSize, FontSize } from "@/hooks/useFontSize";

export function AccessibilityControls() {
  const { theme, setTheme } = useTheme();
  const { fontSize, setFontSize, increaseFontSize, decreaseFontSize, fontSizeLabel } = useFontSize();

  const fontSizes: { value: FontSize; label: string }[] = [
    { value: "small", label: "Small (14px)" },
    { value: "medium", label: "Medium (16px)" },
    { value: "large", label: "Large (18px)" },
    { value: "x-large", label: "Extra Large (20px)" },
  ];

  return (
    <div className="flex items-center gap-1">
      {/* Font Size Controls */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8" title="Font size">
            <Type className="h-4 w-4" />
            <span className="sr-only">Font size</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-popover">
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            Font Size: {fontSizeLabel}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <div className="flex items-center justify-center gap-2 p-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={decreaseFontSize}
              disabled={fontSize === "small"}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="text-sm font-medium w-16 text-center">{fontSizeLabel}</span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={increaseFontSize}
              disabled={fontSize === "x-large"}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          <DropdownMenuSeparator />
          {fontSizes.map((size) => (
            <DropdownMenuItem
              key={size.value}
              onClick={() => setFontSize(size.value)}
              className={fontSize === size.value ? "bg-accent" : ""}
            >
              {size.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Theme Toggle */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8" title="Toggle theme">
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-popover">
          <DropdownMenuItem onClick={() => setTheme("light")}>
            <Sun className="mr-2 h-4 w-4" />
            Light
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("dark")}>
            <Moon className="mr-2 h-4 w-4" />
            Dark
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("system")}>
            <Monitor className="mr-2 h-4 w-4" />
            System
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
