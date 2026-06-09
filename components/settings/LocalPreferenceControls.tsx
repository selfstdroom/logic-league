"use client";

import { useEffect, useMemo, useState } from "react";
import { PremiumBadge } from "@/components/ui/DesignSystem";
import { defaultNavigationIds, navigationItems, NAV_CONFIG_STORAGE_KEY, parseStoredNavigation } from "@/lib/navigation";

const localKeys = {
  theme: "logic-league-theme",
  motion: "logic-league-motion",
  density: "logic-league-density",
  notifications: "logic-league-notification-preferences",
  privacy: "logic-league-privacy-preferences",
  competition: "logic-league-competition-preferences",
};

function read(key: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  return window.localStorage.getItem(key) ?? fallback;
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 p-3 text-sm font-black text-white">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-5 w-5 rounded border-white/20 bg-white/10 text-league-gold focus:ring-league-gold" />
    </label>
  );
}

export function NavigationSummary() {
  const [ids, setIds] = useState(defaultNavigationIds);
  useEffect(() => {
    const load = () => setIds(parseStoredNavigation(window.localStorage.getItem(NAV_CONFIG_STORAGE_KEY)));
    load();
    window.addEventListener("logic-league-nav-updated", load);
    window.addEventListener("storage", load);
    return () => {
      window.removeEventListener("logic-league-nav-updated", load);
      window.removeEventListener("storage", load);
    };
  }, []);
  return <div className="flex flex-wrap gap-2">{ids.map((id) => <PremiumBadge key={id} tone="gold">{navigationItems[id].label}</PremiumBadge>)}</div>;
}

export function LocalDisplayControls({ initialTheme = "dark", initialDensity = "standard" }: { initialTheme?: string; initialDensity?: string }) {
  const [theme, setTheme] = useState(initialTheme === "system" ? "system" : "dark");
  const [motion, setMotion] = useState("standard");
  const [density, setDensity] = useState(initialDensity === "compact" ? "compact" : "standard");

  useEffect(() => {
    setTheme(read(localKeys.theme, initialTheme === "system" ? "system" : "dark"));
    setMotion(read(localKeys.motion, "standard"));
    setDensity(read(localKeys.density, initialDensity === "compact" ? "compact" : "standard"));
  }, [initialDensity, initialTheme]);

  function save(next: { theme?: string; motion?: string; density?: string }) {
    const values = { theme, motion, density, ...next };
    setTheme(values.theme); setMotion(values.motion); setDensity(values.density);
    window.localStorage.setItem(localKeys.theme, values.theme);
    window.localStorage.setItem(localKeys.motion, values.motion);
    window.localStorage.setItem(localKeys.density, values.density);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Select label="テーマ" value={theme} onChange={(value) => save({ theme: value })} options={[['dark','ダーク'], ['system','システム']]} />
      <Select label="Motion" value={motion} onChange={(value) => save({ motion: value })} options={[['standard','アニメーション標準'], ['reduced','アニメーション少なめ']]} />
      <Select label="Density" value={density} onChange={(value) => save({ density: value })} options={[['standard','標準'], ['compact','コンパクト']]} />
      <p className="text-xs leading-5 text-league-muted lg:col-span-3">TODO: user_settingsにmotion列が追加されたらSupabase保存へ移行します。現在は指定キーのlocalStorageへ即時保存します。</p>
    </div>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[][] }) {
  return <label className="block rounded-2xl border border-white/10 bg-black/20 p-4"><span className="text-sm font-black text-white">{label}</span><select value={value} onChange={(e)=>onChange(e.target.value)} className="premium-input mt-3">{options.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>;
}

export function LocalPreferenceGroup({ type }: { type: "notifications" | "privacy" | "competition" }) {
  const definitions = useMemo(() => ({
    notifications: ["返信通知", "反論通知", "投票結果通知", "Competitive Discussion開始通知", "Hall of Fame掲載通知", "Rank変動通知"],
    privacy: ["プロフィール公開", "回答履歴を公開", "Ratingを公開", "アーキタイプを公開", "コレクションを公開"],
    competition: ["Competitive Discussion reminders", "匿名表示を優先", "回答の既定公開設定"],
  }[type]), [type]);
  const [values, setValues] = useState<Record<string, boolean>>({});
  useEffect(() => {
    const stored = window.localStorage.getItem(localKeys[type]);
    let parsed: Record<string, boolean> = {};
    try {
      parsed = stored ? JSON.parse(stored) as Record<string, boolean> : {};
    } catch {
      parsed = {};
    }
    setValues(Object.fromEntries(definitions.map((label) => [label, parsed[label] ?? true])));
  }, [definitions, type]);
  const set = (label: string, checked: boolean) => {
    const next = { ...values, [label]: checked };
    setValues(next);
    window.localStorage.setItem(localKeys[type], JSON.stringify(next));
  };
  return <div className="grid gap-3 lg:grid-cols-2">{definitions.map((label) => <Toggle key={label} label={label} checked={values[label] ?? true} onChange={(v)=>set(label,v)} />)}<p className="text-xs leading-5 text-league-muted lg:col-span-2">TODO: 専用バックエンドが用意されたらlocalStorageからSupabaseへ移行します。</p></div>;
}

export function ClearLocalSettingsButton() {
  return <button type="button" onClick={() => { Object.values(localKeys).forEach((key) => window.localStorage.removeItem(key)); window.localStorage.removeItem(NAV_CONFIG_STORAGE_KEY); window.dispatchEvent(new Event("logic-league-nav-updated")); }} className="rounded-full border border-red-300/30 bg-red-500/10 px-5 py-3 text-sm font-black text-red-100">ローカル設定をクリア</button>;
}
