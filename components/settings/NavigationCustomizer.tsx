"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { LeagueIcon } from "@/components/ui/LeagueIcon";
import { allNavigationIds, defaultNavigationIds, NAV_CONFIG_STORAGE_KEY, navigationItems, normalizeNavigationIds, parseStoredNavigation, type NavigationItemId } from "@/lib/navigation";

export function NavigationCustomizer() {
  const [selectedIds, setSelectedIds] = useState<NavigationItemId[]>(defaultNavigationIds);
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  useEffect(() => setSelectedIds(parseStoredNavigation(window.localStorage.getItem(NAV_CONFIG_STORAGE_KEY))), []);

  function persist(nextIds: NavigationItemId[]) {
    const normalized = normalizeNavigationIds(nextIds);
    setSelectedIds(normalized);
    window.localStorage.setItem(NAV_CONFIG_STORAGE_KEY, JSON.stringify({ selectedIds: normalized }));
    window.dispatchEvent(new Event("logic-league-nav-updated"));
  }

  function toggle(id: NavigationItemId) {
    if (selectedSet.has(id)) {
      if (selectedIds.length <= 3) return;
      persist(selectedIds.filter((item) => item !== id));
      return;
    }
    if (selectedIds.length >= 5) return;
    persist([...selectedIds, id]);
  }

  function move(id: NavigationItemId, direction: -1 | 1) {
    const index = selectedIds.indexOf(id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= selectedIds.length) return;
    const next = [...selectedIds];
    [next[index], next[target]] = [next[target], next[index]];
    persist(next);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
      <section className="rounded-[1.5rem] border border-amber-300/20 bg-amber-300/10 p-4">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-league-gold">Preview</p>
        <h2 className="mt-2 text-2xl font-black text-white">現在のメニュー</h2>
        <p className="mt-2 text-sm leading-6 text-league-silver">下部ナビは最大5件・最小3件です。設定を外した場合も、ヘッダーから設定へ移動できます。</p>
        <div className="mt-5 rounded-[1.5rem] border border-white/10 bg-[#05070d] p-3">
          <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${selectedIds.length}, minmax(0, 1fr))` }}>
            {selectedIds.map((id) => {
              const item = navigationItems[id];
              return <Link key={id} href={item.href} className="rounded-2xl border border-white/10 bg-white/[0.055] p-3 text-center"><LeagueIcon name={item.icon} size={20} className="mx-auto text-league-gold" /><span className="mt-2 block truncate text-[0.68rem] font-black text-white">{item.label}</span></Link>;
            })}
          </div>
        </div>
        <div className="mt-5 rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
          <p className="text-sm font-black text-white">デスクトップサイドバー Preview</p>
          <div className="mt-3 space-y-2">
            {selectedIds.map((id) => {
              const item = navigationItems[id];
              return <div key={id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-black text-league-silver"><LeagueIcon name={item.icon} size={18} className="text-league-gold" />{item.label}</div>;
            })}
          </div>
        </div>
      </section>

      <section className="space-y-3">
        {allNavigationIds.map((id) => {
          const item = navigationItems[id];
          const enabled = selectedSet.has(id);
          const index = selectedIds.indexOf(id);
          const cannotAdd = !enabled && selectedIds.length >= 5;
          const cannotRemove = enabled && selectedIds.length <= 3;
          return (
            <div key={id} className={`rounded-[1.35rem] border p-4 ${enabled ? "border-amber-300/25 bg-amber-300/10" : "border-white/10 bg-white/[0.035]"}`}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <LeagueIcon name={item.icon} size={22} className={enabled ? "text-league-gold" : "text-league-silver"} />
                  <div className="min-w-0"><p className="font-black text-white">{item.label} <span className="text-xs text-league-muted">/ {item.englishLabel}</span></p><p className="text-xs leading-5 text-league-muted">{item.href} · {item.description}</p></div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {enabled ? <button type="button" disabled={index === 0} onClick={() => move(id, -1)} className="rounded-full border border-white/10 px-3 py-2 text-xs font-black text-white disabled:opacity-40">上へ</button> : null}
                  {enabled ? <button type="button" disabled={index === selectedIds.length - 1} onClick={() => move(id, 1)} className="rounded-full border border-white/10 px-3 py-2 text-xs font-black text-white disabled:opacity-40">下へ</button> : null}
                  <button type="button" disabled={cannotAdd || cannotRemove} onClick={() => toggle(id)} className={`rounded-full px-4 py-2 text-xs font-black ${enabled ? "border border-red-300/30 bg-red-500/10 text-red-100" : "border border-amber-300/30 bg-amber-300/10 text-league-gold"} disabled:cursor-not-allowed disabled:opacity-40`}>{enabled ? "OFF" : "ON"}</button>
                </div>
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
