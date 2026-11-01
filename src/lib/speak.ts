/* Ported from the earlier 小词芽 PWA (phone-first pronunciation). */
/**
 * speak(text) —— 手机优先可听：
 * 1. 同步取 voices：有英文（本地或远程）就用 speechSynthesis
 * 2. 否则立刻播有道词典发音（国内可达），失败再试 Google TTS
 * 不长时间 await，避免丢掉用户点击手势导致 Audio.play 被拦。
 */
export type SpeakOptions = {
  /** us → en-US voice and Youdao type=2; uk → en-GB voice and Youdao type=1. */
  accent?: 'us' | 'uk';
  rate?: number;
  lang?: string;
  voiceName?: string;
  pitch?: number;
  cancelPrevious?: boolean;
  /** Recorded pronunciation (Word Atlas mp3) tried before every other voice. */
  src?: string;
};
export type SpeakResult = {
  ok: boolean;
  reason?: 'unsupported' | 'no-english-voice' | 'error';
  voice?: string;
  via?: 'local' | 'remote' | 'audio';
};

type SynthLike = Pick<SpeechSynthesis, 'speak' | 'cancel' | 'getVoices'> & {
  addEventListener?: SpeechSynthesis['addEventListener'];
};
type UtteranceCtor = new (text: string) => SpeechSynthesisUtterance;

export type SpeechEnv = {
  synth?: SynthLike;
  Utterance?: UtteranceCtor;
  playAudio?: (url: string) => Promise<void>;
};

const QUALITY_HINTS = [
  'google us english',
  'samantha',
  'natural',
  'enhanced',
  'premium',
  'neural',
  'aria',
  'jenny',
  'ava',
  'allison',
  'google',
];

export const DEFAULT_RATE = 0.85;

function defaultEnv(): SpeechEnv {
  if (typeof window === 'undefined') return {};
  return { synth: window.speechSynthesis, Utterance: window.SpeechSynthesisUtterance };
}

let env: SpeechEnv | null = null;
let listeners: Array<() => void> = [];
let currentAudio: HTMLAudioElement | null = null;
let audioUnlocked = false;

export function setSpeechEnv(e: SpeechEnv | null) {
  env = e;
}
function getEnv() {
  return env ?? defaultEnv();
}

function isEnglish(v: SpeechSynthesisVoice) {
  return v.lang.replace('_', '-').toLowerCase().startsWith('en');
}

function scoreVoice(v: SpeechSynthesisVoice) {
  const n = v.name.toLowerCase();
  const i = QUALITY_HINTS.findIndex((h) => n.includes(h));
  return i === -1 ? 100 : i;
}

function bestOf(list: SpeechSynthesisVoice[]) {
  if (!list.length) return undefined;
  return list.slice().sort((a, b) => scoreVoice(a) - scoreVoice(b))[0];
}

function pickFromPool(
  voices: readonly SpeechSynthesisVoice[],
  lang: string,
  preferredName?: string,
  localOnly = false,
): SpeechSynthesisVoice | undefined {
  const pool = localOnly ? voices.filter((v) => v.localService) : [...voices];
  if (preferredName) {
    const named = pool.find((v) => v.name === preferredName && isEnglish(v));
    if (named) return named;
  }
  const norm = (s: string) => s.replace('_', '-').toLowerCase();
  const exact = pool.filter((v) => norm(v.lang) === lang.toLowerCase());
  const anyEn = pool.filter(isEnglish);
  return bestOf(exact) ?? bestOf(anyEn);
}

export function pickVoice(
  voices: readonly SpeechSynthesisVoice[],
  lang = 'en-US',
  preferredName?: string,
): SpeechSynthesisVoice | undefined {
  return (
    pickFromPool(voices, lang, preferredName, true) ??
    pickFromPool(voices, lang, preferredName, false)
  );
}

/** 短等 voices；默认 150ms，避免丢掉点击手势 */
export function loadVoices(timeoutMs = 150): Promise<SpeechSynthesisVoice[]> {
  const { synth } = getEnv();
  if (!synth) return Promise.resolve([]);
  const now = synth.getVoices();
  if (now.length) return Promise.resolve(now);
  return new Promise((resolve) => {
    const done = () => resolve(synth.getVoices());
    const t = setTimeout(done, timeoutMs);
    synth.addEventListener?.(
      'voiceschanged',
      () => {
        clearTimeout(t);
        done();
      },
      { once: true } as AddEventListenerOptions,
    );
  });
}

export function hasEnglishVoice(voices: readonly SpeechSynthesisVoice[]) {
  return !!pickVoice(voices);
}

export function onNoEnglishVoice(fn: () => void) {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter((l) => l !== fn);
  };
}

/** 在首次点击时调用，解锁移动端 Audio 自动播放限制 */
export function unlockAudio() {
  if (audioUnlocked) return;
  if (typeof Audio === 'undefined') return;
  try {
    const a = new Audio(
      'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA/+M4wAAAAAAAAAAAAEluZm8AAAAPAAAAAwAAAbAAqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV////////////////////////////////////////////AAAAAExhdmM1OC4xMwAAAAAAAAAAAAAAACQDkAAAAAAAAAGw9wrctAAAAAAAAAAAAAAAAAAAA/+MYxAAAAANIAAAAAExBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV/+MYxDsAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV',
    );
    a.volume = 0.01;
    void a.play().then(() => {
      a.pause();
      audioUnlocked = true;
    }).catch(() => {
      /* ignore */
    });
  } catch {
    /* ignore */
  }
}

/** Network fallbacks in order: Youdao (reachable in mainland China), then Google translate TTS. */
export function audioUrls(text: string, lang: string, accent: 'us' | 'uk' = 'us'): string[] {
  const q = encodeURIComponent(text.trim());
  const tl = lang.toLowerCase().startsWith('en') ? 'en' : lang.split(/[-_]/)[0] || 'en';
  return [
    `https://dict.youdao.com/dictvoice?audio=${q}&type=${accent === 'uk' ? 1 : 2}`,
    `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${encodeURIComponent(tl)}&q=${q}`,
  ];
}

function stopAudio() {
  if (!currentAudio) return;
  try {
    currentAudio.pause();
    currentAudio.removeAttribute('src');
    currentAudio.load();
  } catch {
    /* ignore */
  }
  currentAudio = null;
}

async function playNetworkAudio(text: string, lang: string, accent: 'us' | 'uk', only?: string[]): Promise<boolean> {
  const urls = only ?? audioUrls(text, lang, accent);
  const custom = getEnv().playAudio;
  if (custom) {
    for (const url of urls) {
      try {
        await custom(url);
        return true;
      } catch {
        /* try next */
      }
    }
    return false;
  }
  if (typeof Audio === 'undefined') return false;

  for (const url of urls) {
    try {
      stopAudio();
      const audio = new Audio();
      currentAudio = audio;
      audio.preload = 'auto';
      // 先挂 handlers 再设 src，尽快 play 保住手势链
      const played = new Promise<boolean>((resolve) => {
        let settled = false;
        const ok = () => {
          if (settled) return;
          settled = true;
          resolve(true);
        };
        const bad = () => {
          if (settled) return;
          settled = true;
          resolve(false);
        };
        audio.addEventListener('ended', ok, { once: true });
        audio.addEventListener('error', bad, { once: true });
        // 有的机型 play() resolve 即表示开始播放成功
        audio.src = url;
        const p = audio.play();
        if (p && typeof p.then === 'function') {
          p.then(() => {
            audioUnlocked = true;
          }).catch(bad);
        }
        // 8s 超时
        setTimeout(bad, 8000);
        // Short words end quickly; count a started playback as success after 1.5s.
        audio.addEventListener('playing', () => setTimeout(ok, 1500), { once: true });
      });
      if (await played) return true;
    } catch {
      /* next url */
    } finally {
      if (currentAudio) currentAudio = null;
    }
  }
  return false;
}

function speakWithVoice(
  text: string,
  voice: SpeechSynthesisVoice | undefined,
  lang: string,
  opts: SpeakOptions,
): SpeakResult | null {
  const { synth, Utterance } = getEnv();
  if (!synth || !Utterance) return null;
  try {
    if (opts.cancelPrevious !== false) {
      synth.cancel();
      stopAudio();
    }
    const u = new Utterance(text);
    u.lang = voice?.lang || lang;
    u.rate = opts.rate ?? DEFAULT_RATE;
    u.pitch = opts.pitch ?? 1.05;
    if (voice) u.voice = voice;
    synth.speak(u);
    if (voice) {
      return {
        ok: true,
        voice: voice.name,
        via: voice.localService ? 'local' : 'remote',
      };
    }
    // 无 voice 时仍尝试系统默认引擎，不算稳妥成功
    return { ok: true, voice: 'default', via: 'remote' };
  } catch {
    return null;
  }
}

export async function speak(text: string, opts: SpeakOptions = {}): Promise<SpeakResult> {
  const { synth, Utterance } = getEnv();
  const accent = opts.accent ?? 'us';
  const lang = opts.lang ?? (accent === 'uk' ? 'en-GB' : 'en-US');
  unlockAudio();

  // 1. 自带录音（Word Atlas，离线缓存后也能播）
  if (opts.src) {
    getEnv().synth?.cancel();
    if (await playNetworkAudio(text, lang, accent, [opts.src])) return { ok: true, via: 'audio', voice: 'recording' };
  }

  // 2. 同步优先：已有 voices 立刻用，不等
  if (synth && Utterance) {
    let voices = synth.getVoices();
    if (!voices.length) voices = await loadVoices(150);
    const voice = pickVoice(voices, lang, opts.voiceName);
    if (voice) {
      const r = speakWithVoice(text, voice, lang, opts);
      if (r?.ok) return r;
    }
  }

  // 音频兜底（有道 → Google），在点击后尽快 play
  const played = await playNetworkAudio(text, lang, accent);
  if (played) return { ok: true, via: 'audio', voice: 'network-tts' };

  // 有合成器但无英文 voice 且音频失败：尽量按 lang 念一声，仍提示
  if (synth && Utterance) {
    speakWithVoice(text, undefined, lang, opts);
  }

  if (!synth && !getEnv().playAudio && typeof Audio === 'undefined') {
    return { ok: false, reason: 'unsupported' };
  }
  listeners.forEach((l) => l());
  return { ok: false, reason: 'no-english-voice' };
}
