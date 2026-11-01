import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { audioUrls, pickVoice, setSpeechEnv, speak } from "./speak";

type V = SpeechSynthesisVoice;
const voice = (name: string, lang: string, localService = true) => ({ name, lang, localService, default: false, voiceURI: name }) as V;

function env(voices: V[], fail: string[] = []) {
  const spoken: string[] = [];
  const played: string[] = [];
  class U {
    lang = "";
    rate = 1;
    pitch = 1;
    voice: V | null = null;
    constructor(public text: string) {}
  }
  setSpeechEnv({
    synth: { getVoices: () => voices, speak: (u: SpeechSynthesisUtterance) => void spoken.push(u.text), cancel() {} },
    Utterance: U as unknown as new (t: string) => SpeechSynthesisUtterance,
    playAudio: async (url) => {
      played.push(url);
      if (fail.some((f) => url.includes(f))) throw new Error("blocked");
    },
  });
  return { spoken, played };
}

afterEach(() => setSpeechEnv(null));

test("uses speechSynthesis when an English voice exists (local or remote)", async () => {
  const e = env([voice("Ting-Ting", "zh-CN"), voice("Google US English", "en-US", false)]);
  const r = await speak("dog");
  assert.equal(r.ok, true);
  assert.equal(r.via, "remote");
  assert.deepEqual(e.spoken, ["dog"]);
  assert.deepEqual(e.played, []);
});

test("prefers a local English voice", () => {
  const v = pickVoice([voice("Remote", "en-US", false), voice("Samantha", "en-US", true)]);
  assert.equal(v?.name, "Samantha");
});

test("no English voice: Youdao first, Google second", async () => {
  const e = env([voice("Ting-Ting", "zh-CN")]);
  const r = await speak("ice cream");
  assert.equal(r.via, "audio");
  assert.equal(e.played.length, 1);
  assert.match(e.played[0], /^https:\/\/dict\.youdao\.com\/dictvoice\?audio=ice%20cream&type=2$/);

  const e2 = env([], ["youdao"]);
  await speak("cat");
  assert.equal(e2.played.length, 2);
  assert.match(e2.played[1], /^https:\/\/translate\.google\.com\/translate_tts\?.*tl=en.*q=cat/);
});

test("British accent uses Youdao type=1", () => {
  assert.match(audioUrls("tomato", "en-GB", "uk")[0], /type=1$/);
  assert.match(audioUrls("tomato", "en-US", "us")[0], /type=2$/);
});

test("all sources failing reports no-english-voice", async () => {
  env([], ["youdao", "google"]);
  const r = await speak("cat");
  assert.equal(r.ok, false);
  assert.equal(r.reason, "no-english-voice");
});
