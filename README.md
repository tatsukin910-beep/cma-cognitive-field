# CMA Cognitive Field v5.1

**Complex Multilayered Abuse (CMA) フレームワークの現象学的可視化ツール**

React + Three.js で実装された、CMAの5層構造を動的に表現するインタラクティブビジュアライゼーション。

## 特徴

- **5層の認知フィールド**: Isolation → Dependency → Normalization → Institution → Somatization
- **3つのObserver観点**:
  - **A (External View)**: マクロに層を鳥瞰する客観主義的観点
  - **B (Support View)**: 制度の框組と支援の空白にフォーカス
  - **C (Lived Experience)**: 当事者主観の現象学的世界、体の脈動
- **Invisible Witness 自動巡回モード**: 20秒無操作で自動で観点が切り替わる
- **Epistemic Filter**: モードによって各層の可視性・不透明度が動的に変化

## 使い方

1. 下部の3つのボタンで手動で観点を切り替える
2. 20秒操作しないと自動巡回モードに復帰
3. テレメトリ・ステータスで現在の状態を確認

## テクノロジー

- React 18 + Vite
- Three.js (Points, custom glow texture, trail effect)
- GitHub Pages 自動デプロイ

## 開発

```bash
npm install
npm run dev
```

## 公開URL

https://tatsukin910-beep.github.io/cma-cognitive-field/

---

**Complex Multilayered Abuse (CMA) 理論の可視化・研索ツールとして開発中**

当事者研索・学術発信用に作成。
