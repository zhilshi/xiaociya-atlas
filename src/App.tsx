import { Dumbbell, Flower2, Sun, User } from "lucide-react";
import { useEffect } from "react";
import { AtlasContext } from "./atlas/context";
import { atlas } from "./atlas/data";
import { gradeConfig } from "./lib/grade";
import { closeWord, useLocation, type Route } from "./lib/router";
import { About } from "./pages/About";
import { Garden } from "./pages/Garden";
import { Learn } from "./pages/Learn";
import { Me } from "./pages/Me";
import { Onboarding } from "./pages/Onboarding";
import { Practice } from "./pages/Practice";
import { Today } from "./pages/Today";
import { store, useStore } from "./store/store";
import { Logo } from "./ui/Logo";
import { Sheet } from "./ui/Sheet";
import { Toasts } from "./ui/Toast";
import { WordCard } from "./ui/WordCard";

store.useDataset({ id: atlas.id, aliases: atlas.aliases, has: (id) => atlas.byId.has(id) });

const NAV: { page: Route["page"]; label: string; icon: typeof Sun }[] = [
  { page: "today", label: "今天", icon: Sun },
  { page: "garden", label: "花园", icon: Flower2 },
  { page: "practice", label: "练习", icon: Dumbbell },
  { page: "me", label: "我的", icon: User },
];

/** Bigger type and touch targets for younger grades (CSS reads --k and data-band). */
function useGradeScale() {
  const grade = useStore((s) => s.settings.grade);
  useEffect(() => {
    const cfg = gradeConfig(grade);
    const root = document.documentElement;
    root.dataset.band = String(cfg.band);
    root.style.setProperty("--k", String(cfg.scale));
  }, [grade]);
}

export default function App() {
  useGradeScale();
  const onboarded = useStore((s) => s.settings.onboarded);
  return (
    <AtlasContext.Provider value={atlas}>
      {onboarded ? <Shell /> : <Onboarding />}
      <Toasts />
    </AtlasContext.Provider>
  );
}

function Shell() {
  const { route, word } = useLocation();
  const focus = route.page === "learn";
  useEffect(() => {
    if (!word) window.scrollTo({ top: 0 });
  }, [route.page]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className={`app ${focus ? "is-focus" : ""}`}>
      {!focus && (
        <header className="topbar">
          <a href="#/" aria-label="小词芽首页">
            <Logo />
          </a>
        </header>
      )}
      <main className="main" id="main">
        {route.page === "today" && <Today />}
        {route.page === "garden" && <Garden bed={route.bed} />}
        {route.page === "learn" && <Learn />}
        {route.page === "practice" && <Practice />}
        {route.page === "me" && <Me />}
        {route.page === "about" && <About />}
      </main>
      {!focus && (
        <nav className="tabbar" aria-label="主导航">
          {NAV.map(({ page, label, icon: Icon }) => {
            const on = route.page === page || (page === "me" && route.page === "about");
            return (
              <a key={page} href={page === "today" ? "#/" : `#/${page}`} className={on ? "is-on" : ""} aria-current={on ? "page" : undefined}>
                <Icon size={26} strokeWidth={on ? 2.6 : 2} />
                <span>{label}</span>
              </a>
            );
          })}
        </nav>
      )}
      <Sheet open={!!word} onClose={closeWord} label="单词卡">
        {word && <WordCard id={word} />}
      </Sheet>
    </div>
  );
}
