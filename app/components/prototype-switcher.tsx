import { useEffect } from "react";
import { useSearchParams } from "react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface VariantOption {
  key: string;
  name: string;
  description: string;
}

interface PrototypeSwitcherProps {
  variants: VariantOption[];
  current: string;
}

export function PrototypeSwitcher({ variants, current }: PrototypeSwitcherProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  const currentIndex = variants.findIndex((v) => v.key.toUpperCase() === current.toUpperCase());
  const activeIndex = currentIndex >= 0 ? currentIndex : 0;
  const activeVariant = variants[activeIndex];

  const goToIndex = (index: number) => {
    const nextIndex = (index + variants.length) % variants.length;
    const nextVariant = variants[nextIndex];
    const newParams = new URLSearchParams(searchParams);
    newParams.set("variant", nextVariant.key);
    setSearchParams(newParams, { replace: true });
  };

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goToIndex(activeIndex - 1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goToIndex(activeIndex + 1);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex, variants, searchParams]);

  if (process.env.NODE_ENV === "production") {
    return null;
  }

  return (
    <aside
      aria-label="UI Prototype Switcher"
      className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 flex items-center gap-3 rounded-full bg-slate-900/95 px-4 py-2.5 text-white shadow-2xl backdrop-blur border border-slate-700/60 ring-1 ring-white/10"
    >
      <button
        type="button"
        onClick={() => goToIndex(activeIndex - 1)}
        className="rounded-full p-1 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
        title="Previous variant (Left arrow)"
        aria-label="Previous variant"
      >
        <ChevronLeft className="size-4" />
      </button>

      <div className="flex flex-col items-center min-w-[200px] text-center px-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
          Prototype Variant {activeVariant.key}
        </span>
        <span className="text-sm font-medium text-slate-100">
          {activeVariant.name}
        </span>
      </div>

      <button
        type="button"
        onClick={() => goToIndex(activeIndex + 1)}
        className="rounded-full p-1 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
        title="Next variant (Right arrow)"
        aria-label="Next variant"
      >
        <ChevronRight className="size-4" />
      </button>
    </aside>
  );
}
