# kickcd

Kick.comコメントダウンローダー

![サンプル画像](sample.jpg)

Kick.comのコメントをニコニコ動画風のASS等の形式で保存することができます。

## ブラウザでの使用方法

下記のコードをURLとしてブックマークを作成してください。

```
javascript: const script = document.createElement('script'); script.type = 'module'; script.src = 'https://esm.sh/gh/ogawa0071/kickcd'; document.body.appendChild(script);
```

Kick.comの動画ページで、上記で作成したブックマークをクリックするとASS形式でダウンロードします。

# License

- License: MIT
- Fork from: [ts1/orcd](https://github.com/ts1/orcd)
