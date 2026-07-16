# Haru Soccer Online

4v4のTPSサッカーゲームです。`server.mjs` がゲーム画面とリンク対戦用APIを同じURLから配信するので、Node対応ホスティングに載せると、その公開URLがそのままオンライン対戦URLになります。

## ローカル起動

```sh
npm start
```

起動後に `http://127.0.0.1:4210/` を開きます。

## オンライン公開

GitHub Pagesだけではオンライン対戦は動きません。このゲームは `/api/rooms` とServer-Sent Eventsを使うため、Node.jsサーバーが必要です。

おすすめの流れ:

1. このフォルダをGitHubリポジトリへpushする
2. RenderなどのNode対応サービスで、そのGitHubリポジトリをWeb Serviceとしてデプロイする
3. 公開URLを開いて部屋を作る
4. コピーしたルームリンクを友達に共有する

Render setup:

- Build command: `npm install`
- Start command: `npm start`
- Health check path: `/api/health`
