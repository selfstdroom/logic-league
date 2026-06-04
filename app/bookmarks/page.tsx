import { EmptyState } from "@/components/ui/EmptyState";
import { HeroPanel, PageShell } from "@/components/ui/DesignSystem";

export default function BookmarksPage() {
  return (
    <PageShell>
      <HeroPanel eyebrow="ブックマーク" title="保存した知的資産">
        後で読み返したい議論や回答を保存するためのページです。保存機能が有効になると、ここに一覧表示されます。
      </HeroPanel>
      <section className="mt-8">
        <EmptyState kind="bookmarks" title="ブックマークはまだありません。">
          重要な議論や優れた回答を保存すると、ここから素早くアクセスできます。
        </EmptyState>
      </section>
    </PageShell>
  );
}
