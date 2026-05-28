Campfire Photo Inspired Final

起動方法

このプロジェクトは ES Modules を使っているため、index.html を file:/// で直接開くと
ブラウザの CORS / セキュリティ制限で main.js を読み込めません。

PowerShell などでこのフォルダに移動して、ローカルサーバーから開いてください。

  python -m http.server 8000

その後、ブラウザで次を開きます。

  http://localhost:8000

特徴

- 写真のような左に流れる煙を意識した flame ribbon 方式
- 赤い火床を常時発光
- 黒煙に柔らかい内部発光を追加
- 熱の揺らぎ、火、灰、地面の粒を描画
- audio フォルダの mp3 を順番に再生
