import type { ArchetypeName } from "@/types/logic-league";

export const archetypes: Record<ArchetypeName, { ja: string; description: string; strength: string; weakness: string }> = {
  Architect: { ja: "設計者", description: "複雑な課題を構造化し、全体設計を考えるタイプ。", strength: "全体像、制度設計、長期戦略。", weakness: "現場の細部や短期実行が弱くなりやすい。" },
  Strategist: { ja: "戦略家", description: "限られた資源から勝ち筋を探すタイプ。", strength: "優先順位、資源配分、現実解。", weakness: "独創性よりも既存の成功パターンに寄りやすい。" },
  Analyst: { ja: "分析者", description: "情報を整理し、因果関係を見抜くタイプ。", strength: "分析、検証、論理性。", weakness: "行動や意思決定が遅くなりやすい。" },
  Challenger: { ja: "挑戦者", description: "常識を疑い、既存ルールを壊すタイプ。", strength: "独創性、破壊的発想。", weakness: "実現可能性や調整を軽視しやすい。" },
  Builder: { ja: "構築者", description: "実行可能な形に落とし込むタイプ。", strength: "実行計画、現場感覚、具体化。", weakness: "大きな構造変化や長期ビジョンが弱くなりやすい。" },
  Oracle: { ja: "予見者", description: "未来の変化やトレンドを読むタイプ。", strength: "未来予測、変化察知。", weakness: "具体的な実行計画が薄くなりやすい。" },
  Diplomat: { ja: "調停者", description: "利害関係者の対立を整理し、合意形成を考えるタイプ。", strength: "組織課題、政治的調整、合意形成。", weakness: "大胆な打ち手が弱くなりやすい。" },
  Explorer: { ja: "探究者", description: "未知の領域や新しい可能性を探るタイプ。", strength: "好奇心、新規発見、探索。", weakness: "焦点が散りやすい。" },
  Reformer: { ja: "改革者", description: "制度や社会構造を変えようとするタイプ。", strength: "社会課題、制度設計、大局観。", weakness: "実装の細部が弱くなりやすい。" },
  Synthesizer: { ja: "統合者", description: "異なる領域を組み合わせ、新しい解を作るタイプ。", strength: "横断思考、異分野融合。", weakness: "専門性や深掘りが弱くなりやすい。" },
  Commander: { ja: "指揮官", description: "意思決定と推進を重視するタイプ。", strength: "実行速度、決断力、組織運用。", weakness: "慎重な検証が不足しやすい。" },
  Researcher: { ja: "研究者", description: "深く調べ、精度を高めるタイプ。", strength: "調査、検証、精密さ。", weakness: "スピードや大胆さが不足しやすい。" },
  Economist: { ja: "経済家", description: "インセンティブや市場構造で問題を見るタイプ。", strength: "資源配分、制度設計、経済合理性。", weakness: "感情や文化的要因を軽視しやすい。" },
  Philosopher: { ja: "哲学者", description: "前提そのものを疑うタイプ。", strength: "根本原因、問いの再定義。", weakness: "実装や具体策が弱くなりやすい。" },
  Negotiator: { ja: "交渉者", description: "人間関係や駆け引きから解決策を作るタイプ。", strength: "対人戦略、利害調整。", weakness: "構造分析が弱くなりやすい。" },
  Visionary: { ja: "先見者", description: "大きな未来像を描くタイプ。", strength: "ビジョン、未来構想、理想設計。", weakness: "現実的な手順が弱くなりやすい。" },
};
