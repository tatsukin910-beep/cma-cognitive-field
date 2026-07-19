# CMA Cognitive Field v5.1

React + Three.js ビジュアライゼーションで構築された **Complex Multilayered Abuse (CMA)** の認知フィールド・デモプロジェクトです。

## 概要

このプロジェクトは、复雑多層的辛役 (Complex Multilayered Abuse: CMA) 理論の5層構造をインタラクティブに可視化します。
当事者研究者の中村達希 (tatsukin910-beep) が開発する CMA フレームワークの一環として作成されました。

### 5つの層 (LAYER_DEFINITIONS)

- **Isolation** (隔離): 最外層、孤立的な状態
- **Dependency** (依存): 依存関係
- **Normalization** (正常化): 正常化・消化
- **Institution** (制度): 制度・組織的困境
- **Somatization** (身体化): 身体化、最深部の生命軸

各層は円柱状の点群として表現され、各自獨自の波動アニメーションを持ちます。

### 3つの観察者視点 (VIEW_MODES)

- **OBSERVER A: EXTERNAL VIEW** — マクロでの客観主義的な視点 (LOW ambiguity)
- **OBSERVER B: SUPPORT VIEW** — 支援の空白と制度にフォーカスするメソ視点 (MEDIUM)
- **OBSERVER C: LIVED EXPERIENCE** — 当事者主観の現象学的世界 (MAX ambiguity, RAW_LIVED)

ボタンで手動切り替え可能。操作を停止すると **Invisible Witness** モードで自動巡回します。

### 視觚的特徴

- Additive Blending とグローテクスチャによる柔らかい光の点群
- Persistence of Vision (残像) トレイル効果で、点の動きを連続した流れとして知視
- Epistemic Filter: モード毎に各層の opacity が変化し、構造的な可視性がフィルタリングされる
- Observer C では中心軸が身体の揺らぎのように振動

## 使い方

```bash
git clone https://github.com/tatsukin910-beep/cma-cognitive-field.git
cd cma-cognitive-field
npm install
npm run dev
```

ブラウザで http://localhost:5173 を開くと、フルスクリーンのビジュアライゼーションが表示されます。

ボタンで観点を切り替えられ、自動巡回モードは20秒無操作で復帰します。

## CMA理論について

このビジュアライゼーションは、中村達希 (tatsukin910-beep / X: @tatsu97910) が研究・開発する **Complex Multilayered Abuse (CMA)** フレームワークに基づいています。

CMAは、辛役の多層的・構造的性質を当事者研究の観点から明らかにするための理論模式です。
2026年に文化庁登録済み。

詳細は X (@tatsu97910) や今後の学術論文発表をご覧ください。

## 技術スタック

- React 18 + Vite
- Three.js (WebGL ポイントクラウド・アニメーション)
- Canvas 生成グローテクスチャと残像トレイル効果

## ライセンス

このプロジェクトは研究・教育目的で公開されています。
CMA理論を引用する場合は出典を明記してください。

---

**Created by** 中村達希 (tatsukin910-beep)  
X: [@tatsu97910](https://x.com/tatsu97910)  

*Structural Ambiguity & Epistemic Filter*