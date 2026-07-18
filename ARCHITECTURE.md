# Soccer Project Guide

このファイルは、どのファイルが何を担当しているかを迷わないための開発メモです。

## 全体像

このゲームは、ブラウザで動く3Dサッカーゲームです。

- 画面とゲーム本体: `index.html`, `styles.css`, `game.js`, `src/*.js`
- 3D描画: Three.js (`vendor/three.module.js`)
- オンライン対戦サーバー: Node.js の `server.mjs`
- 通信: HTTP API と Server-Sent Events
- デプロイ: Render (`render.yaml`)

基本の流れはこうです。

1. `server.mjs` がHTML/CSS/JSを配信する
2. ブラウザで `game.js` が起動する
3. `game.js` が `src/` のモジュールを読み込む
4. オンライン対戦ではブラウザが `/api/rooms` にアクセスする
5. サーバーが部屋、チーム、プレイヤー、同期メッセージを管理する

## ルートのファイル

| ファイル | 役割 |
| --- | --- |
| `README.md` | 起動方法、Renderへの公開方法など、使う人向けの短い説明 |
| `ARCHITECTURE.md` | このファイル。開発するときの見取り図 |
| `index.html` | 画面の部品。ボタン、ロビー、設定画面、ゲームキャンバスなど |
| `styles.css` | 見た目。ロビー、HUD、設定画面、ボタンなどのデザイン |
| `game.js` | ブラウザ側の中心。ゲーム進行、入力、AI、描画、オンライン処理をつなぐ |
| `server.mjs` | Node.jsサーバー。静的ファイル配信、部屋作成、入室、SSE通信を担当 |
| `package.json` | npmコマンドとNode設定。`npm start`, `npm run check` など |
| `render.yaml` | Renderでデプロイするときの設定 |
| `vendor/three.module.js` | Three.js本体。外部ライブラリなので基本的に編集しない |

## `src/` のファイル

### 設定系

| ファイル | 役割 |
| --- | --- |
| `src/appConfig.js` | 保存キー、オンライン同期間隔、ルームURL用のパラメータなど、アプリ全体の固定値 |
| `src/config.js` | フィールド、アイテム、戦術、チームカラー、キャラスキンなどゲーム内容の固定値 |
| `src/matchRules.js` | 3分制、先取点制など、勝利条件の判定補助 |
| `src/teamSettings.js` | チームごとの戦術、カラー設定を安全な値に整える |
| `src/storage.js` | localStorageへの保存と読み込み。名前、ステータス、キー設定、言語など |

よく触る例:

- フィールドの広さを変える: `src/config.js`
- アイテムの時間や強さを変える: `src/config.js`
- 保存される設定を増やす: `src/storage.js`
- 試合ルールを増やす: `src/appConfig.js` と `src/matchRules.js`

### プレイヤー・ステータス系

| ファイル | 役割 |
| --- | --- |
| `src/stats.js` | 速さ、体格、強さの計算。ステータス合計150、実速度、弾く力など |
| `src/playerModel.js` | キャラの大きさ、ロール表示、スタン時間など、プレイヤーのモデル寄りの計算 |
| `src/playerProfile.js` | プレイヤー名、オンラインチーム希望など、プロフィールの整形 |
| `src/aiProfiles.js` | 敵AIのランダムステータス、動きの個性、ロール別能力 |

よく触る例:

- ステータス差をもっと強く出す: `src/stats.js`
- 体格でキャラサイズを変える計算: `src/playerModel.js`
- 毎試合の敵AIの個性: `src/aiProfiles.js`
- チーム別AI難易度の合計値調整: `src/appConfig.js`, `src/teamSettings.js`, `src/aiProfiles.js`

### 入力・表示テキスト系

| ファイル | 役割 |
| --- | --- |
| `src/controls.js` | 操作キー、キー表示、入力欄でWASDが取られないようにする判定 |
| `src/i18n.js` | 日本語、英語などの翻訳テキスト |
| `src/labels.js` | アイテム名、戦術名、試合ルール名などを翻訳から取り出す補助 |

よく触る例:

- 操作方法を増やす: `src/controls.js`
- 表示文を変える: `src/i18n.js`
- 言語を増やす: `src/i18n.js`

### オンライン系

| ファイル | 役割 |
| --- | --- |
| `src/onlineRoom.js` | ルームコード、クライアントID、オンライン枠の表示名など |
| `src/onlineClient.js` | ブラウザからサーバーへ送る通信、部屋URL、共有リンク作成 |
| `src/onlineSnapshot.js` | ホストからゲストへ送る試合状態の作成と反映 |
| `src/onlineUi.js` | オンライン表示用の文字やプレイヤー一覧の表示データ |

オンライン対戦の流れ:

1. 部屋を作る、またはリンクから入る
2. `onlineClient.js` がサーバーAPIにアクセスする
3. `server.mjs` が部屋と参加者を管理する
4. ホスト側が試合をシミュレーションする
5. `onlineSnapshot.js` で状態をゲストへ同期する

よく触る例:

- リンク共有やURLまわり: `src/onlineClient.js`
- オンラインの名前や人数表示: `src/onlineUi.js`
- 同期される情報を増やす: `src/onlineSnapshot.js`
- サーバー側の部屋ルール: `server.mjs`

### 3D・見た目系

| ファイル | 役割 |
| --- | --- |
| `src/threeScene.js` | Three.js用の座標変換、素材作成、共通ジオメトリ |
| `vendor/three.module.js` | Three.js本体。外部ライブラリ |
| `styles.css` | HTML側の見た目。HUD、ロビー、設定画面 |

`game.js` にはまだ、スタジアム、ゴール、キャラ、アイテム、ロケットなどの3Dオブジェクト作成処理が残っています。今後さらに分けるなら、次はこのあたりです。

- `src/threePitch.js`: フィールド、ゴール、スタジアム
- `src/threePlayer.js`: キャラの3Dモデル
- `src/threeEffects.js`: ロケット、アイテム、衝撃エフェクト

よく触る例:

- キャラの形を変える: 今は主に `game.js` の `createPlayerObject`
- スタジアムを変える: 今は主に `game.js` の `createStadiumMesh`
- 3D素材の共通処理: `src/threeScene.js`

### 物理・試合ロジック系

| ファイル | 役割 |
| --- | --- |
| `src/math.js` | clamp、lerp、normalize、distanceなど、よく使う計算 |
| `src/fieldGeometry.js` | ゴール判定、端に行ったボールの救出方向、フィールド内への制限 |
| `src/itemLogic.js` | アイテムドロップ、拾う処理、効果時間、AIのアイテム使用判断 |
| `src/gamePhysics.js` | スライディング判定、ノックバック、衝撃エフェクトなどの物理補助 |

よく触る例:

- ボールが端で止まる問題: `src/fieldGeometry.js` と `game.js` のAI移動
- アイテムの出現や効果時間: `src/itemLogic.js` と `src/config.js`
- ロケット、ショックウェーブ、スライディングの当たり方: 今は主に `game.js` と `src/gamePhysics.js`

## どこを触ればいいか早見表

| やりたいこと | 主に見る場所 |
| --- | --- |
| ステータスの強さを調整したい | `src/stats.js` |
| 体格による吹っ飛び耐性を変えたい | `src/stats.js`, `src/playerModel.js` |
| アイテムを追加したい | `src/config.js`, `src/itemLogic.js`, `game.js`, `src/i18n.js` |
| ロケットやショックウェーブを調整したい | `src/config.js`, `src/gamePhysics.js`, `game.js` |
| オンライン部屋の人数やチーム処理を変えたい | `server.mjs`, `src/onlineRoom.js`, `src/onlineClient.js` |
| AI難易度の合計値を変えたい | `src/appConfig.js`, `src/teamSettings.js`, `src/aiProfiles.js`, `server.mjs` |
| オンライン同期を変えたい | `src/onlineSnapshot.js`, `game.js` |
| 操作キーを増やしたい | `src/controls.js`, `game.js`, `src/i18n.js` |
| 表示テキストを変えたい | `src/i18n.js` |
| キャラの見た目を変えたい | `game.js` の3D作成処理、今後は `src/threePlayer.js` に分ける予定 |
| スタジアムやゴールを変えたい | `game.js` の3D作成処理、今後は `src/threePitch.js` に分ける予定 |

## 使っている主な仕組み

### ES Modules

ブラウザ側は `import` / `export` でファイルを分けています。

例:

```js
import { speedDriveFromStat } from "./src/stats.js";
```

### Three.js

3D描画に使っています。

- `Scene`: 3D空間
- `Camera`: 視点
- `Mesh`: 立体オブジェクト
- `Geometry`: 形
- `Material`: 色や質感
- `Light`: 光

Three.js本体の `vendor/three.module.js` は長いですが、ライブラリなので編集しない方が安全です。

### localStorage

ブラウザに設定を保存するために使っています。

保存しているもの:

- 言語
- プレイヤー名
- ステータス
- 操作キー
- チームカラー
- 試合ルール

保存処理は `src/storage.js` にまとめています。

### HTTP API

オンライン部屋の作成、入室、プロフィール更新、メッセージ送信に使っています。

例:

- `POST /api/rooms`
- `POST /api/rooms/:roomCode/join`
- `POST /api/rooms/:roomCode/message`
- `POST /api/rooms/:roomCode/profile`

### Server-Sent Events

サーバーからブラウザへ、部屋情報やメッセージをリアルタイムに送るために使っています。

使っている場所:

- ブラウザ側: `src/onlineClient.js` と `game.js`
- サーバー側: `server.mjs`

## 開発するときの確認

コードを変えたら、まずこれを実行します。

```sh
npm run check
```

これは構文チェックです。ゲームが完璧に動くかまでは見ませんが、ファイル分割時の import ミスや文法ミスをかなり早く見つけられます。

## 今後さらに分けるなら

まだ `game.js` には大きい処理が残っています。次に分けるならこの順番がよさそうです。

1. `src/threePitch.js`: フィールド、ゴール、スタジアム
2. `src/threePlayer.js`: キャラモデル、走りアニメーション、名前ラベル
3. `src/combatItems.js`: ロケット、ショックウェーブ、シールド処理
4. `src/aiMovement.js`: AIの移動判断、守備、攻撃、ボール追跡

この順番だと、見た目、アイテム、AIを別々に調整しやすくなります。
