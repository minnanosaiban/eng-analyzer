# 英文構造アナライザー

TOEIC 対策向けの英文学習アプリです。集めた英文を AI(Gemini)で構造化し、グループ化・関係図・イラスト・音声で学習します。
ブラウザだけで動く静的サイト(PWA)で、スマホのホーム画面に追加して使えます。

- 公開版: https://eng-analyzer.scratch-2026-10-07-cb3f9c.workers.dev
- 参考: [英文構造を一発で分解するアプリ(Qiita)](https://qiita.com/oguro_swada/items/17bc234b152a5ae6d0a1)(OCR 機能は除いています)

## モード

| モード | 内容 |
|---|---|
| ⑴ 構造化 | 和訳・スラッシュリーディング・SVOC・5文型・時制/文法・単語・TOEIC の観点・Part 5 風 4択問題 |
| ⑵ 英文グループ化 | 解析結果からの自動分類(API 不要)/ AI によるグループ案 |
| ⑶ 関係図化 | [RelaGrid](https://github.com/minnanosaiban/relagrid) で S/V/O/C/M・節の関係を図示 |
| ⑷ イラスト化 | OpenMoji の絵文字シーン / AI による簡易 SVG イラスト |
| ⑸ 音声化 | 端末の読み上げ機能で連続再生・シャドーイング・ディクテーション |
| ⑹ 英単語グループ化 | 単語帳と、品詞・頻出度・意味などによるグループ分け |

## データと API キー

- 英文・単語・グループ・解析結果・API キーは、すべて各自のブラウザ(localStorage)に保存されます。サーバーには送りません。
- 端末間の移動は「バックアップ保存」→「復元」で行います。
- AI 機能を使うには、右上の「⚙ 設定」で [Google AI Studio](https://aistudio.google.com/apikey) の Gemini API キーを入力します。呼び出しはボタンを押したときだけです。

## 構成

```
public/            公開されるファイル一式
  index.html       アプリ本体(HTML/CSS/JS を1ファイルに)
  sw.js            Service Worker(オフライン用キャッシュ)
  manifest.json    PWA 設定
  relagrid/        RelaGrid の描画部分(minnanosaiban/relagrid の js/ からコピー)
wrangler.jsonc     Cloudflare Workers(静的アセット)の設定
```

## ローカルで動かす

```bash
python -m http.server 8611 -d public
```

## 公開(Cloudflare)

```bash
npx wrangler deploy
```

`public/sw.js` の `CACHE` の版番号を上げると、利用者の端末のキャッシュが更新されます。

## ライセンス

[MIT License](LICENSE)

## 外部素材

- 絵文字: [OpenMoji](https://openmoji.org/) — [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)(jsDelivr から読み込み。このリポジトリには含みません。アプリで作った絵文字シーンを配布する場合はこのライセンスに従ってください)
- 関係図: [RelaGrid](https://github.com/minnanosaiban/relagrid)(同じ作者のプロジェクト。`public/relagrid/` に描画部分を同梱)
