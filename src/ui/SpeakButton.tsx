import { Volume2 } from "lucide-react";
import { useState } from "react";
import { speak } from "../lib/speak";
import { useStore } from "../store/store";
import { toast } from "./Toast";

/** Say a word now (call inside a tap so phones allow audio). */
export function say(word: string, accent: "us" | "uk") {
  return speak(word, { accent }).then((r) => {
    if (!r.ok) toast("这台设备暂时放不出声音，检查一下静音键或网络哦", "warn");
    return r;
  });
}

export function SpeakButton({ word, big = false, label = "听发音" }: { word: string; big?: boolean; label?: string }) {
  const accent = useStore((s) => s.settings.accent);
  const [on, setOn] = useState(false);
  return (
    <button
      type="button"
      className={`speak-btn ${big ? "is-big" : ""} ${on ? "is-on" : ""}`}
      aria-label={`${label}：${word}`}
      onClick={(e) => {
        e.stopPropagation();
        setOn(true);
        void say(word, accent).finally(() => window.setTimeout(() => setOn(false), 600));
      }}
    >
      <Volume2 size={big ? 34 : 22} />
    </button>
  );
}
