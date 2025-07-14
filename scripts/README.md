# 紙色見本スクレイピングシステム

指定製本の紙色見本サイトから色情報を自動取得し、JSON APIとして利用できる形式で保存するシステムです。

## 機能

### 1. 初回スクレイピング (`paper_color_scraper.py`)
- 紙色見本サイトから色名・画像・メタ情報を取得
- 画像の平均色をRGB/HEX値で算出
- 銘柄（レザック66、NTほそおり、みやぎぬ等）の自動分類
- JSON形式での出力

### 2. 差分チェック (`differential_checker.py`)
- 定期実行用の差分検出システム
- 新規追加・削除・変更の検出
- バックアップ機能
- 変更ログの保存

## セットアップ

```bash
# 依存関係のインストール
pip install -r requirements.txt

# 初回スクレイピング実行
python paper_color_scraper.py

# 差分チェック実行
python differential_checker.py
```

## 出力ファイル

### `paper_colors_api.json`
```json
{
  "metadata": {
    "total_colors": 150,
    "last_updated": "2025-01-14T...",
    "brands": {
      "レザック66": 46,
      "NTほそおり": 50,
      "みやぎぬ": 28,
      "その他": 26
    }
  },
  "colors": [
    {
      "id": "a1b2c3d4",
      "name": "レザック66白",
      "brand": "レザック66",
      "weight": "135kg",
      "size": "636×939",
      "thumbnail_url": "https://...",
      "detail_url": "https://...",
      "image_file": "abc123.jpg",
      "average_color": {
        "rgb": [245, 245, 240],
        "hex": "#f5f5f0"
      },
      "scraped_at": "2025-01-14T..."
    }
  ]
}
```

### ディレクトリ構造
```
paper_colors/
├── paper_colors_api.json      # API用データ
├── paper_colors_raw.json      # 生データ
├── change_log.json           # 変更履歴
├── images/                   # ダウンロード画像
│   ├── abc123.jpg
│   └── ...
└── backups/                  # バックアップ
    ├── paper_colors_backup_20250114_120000.json
    └── ...
```

## 定期実行設定

### Windows (タスクスケジューラ)
```batch
# 毎日午前2時に実行
schtasks /create /tn "PaperColorCheck" /tr "python C:\path\to\differential_checker.py" /sc daily /st 02:00
```

### Linux (cron)
```bash
# 毎日午前2時に実行
0 2 * * * /usr/bin/python3 /path/to/differential_checker.py
```

## 社内システムでの利用

```javascript
// フロントエンドでの利用例
fetch('/api/paper-colors')
  .then(response => response.json())
  .then(data => {
    const colors = data.colors;
    colors.forEach(color => {
      console.log(`${color.name}: ${color.average_color.hex}`);
    });
  });
```

```python
# バックエンドでの利用例
import json

def load_paper_colors():
    with open('paper_colors/paper_colors_api.json', 'r', encoding='utf-8') as f:
        return json.load(f)

def get_colors_by_brand(brand_name):
    data = load_paper_colors()
    return [color for color in data['colors'] if color['brand'] == brand_name]
```

## 注意事項

1. **レート制限**: サーバーに負荷をかけないよう1秒間隔でアクセス
2. **エンコーディング**: 日本語サイトのためShift_JISでデコード
3. **画像保存**: ローカルに画像を保存してからRGB値を計算
4. **エラーハンドリング**: ネットワークエラーや画像読み込みエラーに対応
5. **バックアップ**: 変更前のデータは自動でバックアップ保存

## トラブルシューティング

### よくあるエラー
- **SSL証明書エラー**: `requests.get(url, verify=False)` で回避
- **エンコーディングエラー**: `response.encoding = 'shift_jis'` で修正
- **画像読み込みエラー**: PIL/Pillowの画像フォーマット対応確認

### ログ確認
```python
# 変更履歴の確認
with open('paper_colors/change_log.json', 'r', encoding='utf-8') as f:
    logs = json.load(f)
    for log in logs[-5:]:  # 最新5件
        print(f"{log['timestamp']}: {log['changes']}")
```