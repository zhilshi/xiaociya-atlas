import { Volume2 } from "lucide-react";
import { useState } from "react";
import type { WordRef } from "../atlas/types";
import { audioUrl } from "../lib/media";
import { speak } from "../lib/speak";
import { useStore } from "../store/store";
import { toast } from "./Toast";

/** Say a word now (call inside a tap so phones allow audio). */
export function say(word: string, accent: "us" | "uk", src?: string) {
  return speak(word, { accent, src }).then((r) => {
    if (!r.ok) toast("这台设备暂时放不出声音，检查一下静音键或网络哦", "warn");
    return r;
  });
}

/** Say a lexicon word: its Word Atlas recording first, then device voice / Youdao / Google. */
export function sayWord(w: WordRef, accent: "us" | "uk") {
  return say(w.word, accent, audioUrl(w, accent) || undefined);
}

export function SpeakButton({ word, w, big = false, label = "听发音" }: { word?: string; w?: WordRef; big?: boolean; label?: string }) {
  const accent = useStore((s) => s.settings.accent);
  word = word ?? w?.word ?? "";
  const [on, setOn] = useState(false);
  return (
    <button
      type="button"
      className={`speak-btn ${big ? "is-big" : ""} ${on ? "is-on" : ""}`}
      aria-label={`${label}：${word}`}
      onClick={(e) => {
        e.stopPropagation();
        setOn(true);
        void (w ? sayWord(w, accent) : say(word!, accent)).finally(() => window.setTimeout(() => setOn(false), 600));
      }}
    >
      <Volume2 size={big ? 34 : 22} />
    </button>
  );
}
