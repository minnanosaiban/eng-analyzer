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

## データの保存とクラウド同期

- 英文・単語・グループ・解析結果は、まず各自のブラウザ(localStorage)に保存されます。API キーはブラウザ内だけで、同期しません。
- 「⚙ 設定」→「クラウド同期」を有効にすると、英文・単語・グループを **端末側で暗号化してから** Cloudflare D1 に保存し、PC とスマホで共有できます。
  - 暗号化: パスフレーズから PBKDF2(SHA-256・60万回)で鍵を作り、AES-GCM で暗号化。パスフレーズと鍵は送信しないため、サーバー側からは中身を読めません。パスフレーズを忘れると復元できません。
  - 認証: 初回作成時に発行される「同期キー」(保管庫ID.秘密)で接続します。2台目以降は、設定画面の QR コードをスマホで読み取ると同期キーが入力済みの状態で開きます(キーは URL の `#` 以降に入れるのでサーバーには送られません)。サーバーは秘密の SHA-256 だけを保存します。
  - 保管庫の作成にはセットアップコード(Worker のシークレット `SETUP_CODE`)が必要で、作成できる数は `MAX_VAULTS`(既定 1)までです。
  - 変更は数秒後に自動で同期されます。同じ英文が両方の端末にあれば1つにまとめます。
- 「バックアップ保存」「復元」で JSON ファイルにも書き出せます(このファイルは暗号化されません)。

## AI の使い方

- **Gemini API**: 「⚙ 設定」で [Google AI Studio](https://aistudio.google.com/apikey) の API キーを入力します。呼び出しはボタンを押したときだけです。
- **コピペモード**: API キー不要。プロンプトをコピーして Gemini アプリ等に貼り、回答を貼り戻します(一括解析は 10 文ずつ)。

## 構成

```
public/            公開されるファイル一式
  index.html       アプリ本体(HTML/CSS/JS を1ファイルに)
  sw.js            Service Worker(オフライン用キャッシュ)
  manifest.json    PWA 設定
  relagrid/        RelaGrid の描画部分(minnanosaiban/relagrid の js/ からコピー)
src/worker.js      同期 API(/api/*)。暗号文の保存・取得のみ
migrations/        D1 のテーブル定義
wrangler.jsonc     Cloudflare Workers(静的アセット + D1)の設定
```

## ローカルで動かす

```bash
npx wrangler d1 migrations apply eng-analyzer-db --local
```

```bash
npx wrangler dev
```

ローカルでセットアップコードを使う場合は `.dev.vars` に `SETUP_CODE=...` を書きます(Git 管理外)。

## 公開(Cloudflare)

```bash
npx wrangler deploy
```

`public/sw.js` の `CACHE` の版番号を上げると、利用者の端末のキャッシュが更新されます。

## ライセンス

[MIT License](LICENSE)

## 外部素材

- 絵文字: [OpenMoji](https://openmoji.org/) — [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)(jsDelivr から読み込み。このリポジトリには含みません。アプリで作った絵文字シーンを配布する場合はこのライセンスに従ってください)
- QR コード: [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator)(MIT、Kazuhiko Arase。`public/vendor/qrcode.js` に同梱)
- 関係図: [RelaGrid](https://github.com/minnanosaiban/relagrid)(同じ作者のプロジェクト。`public/relagrid/` に描画部分を同梱)
