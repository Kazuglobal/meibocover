import json
from datetime import datetime

def add_common_papers():
    """一般的なレザック66の色を追加"""
    
    # 現在のデータを読み込み
    with open('paper_colors/official_paper_colors.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # 既存のレザック66の色名を取得
    existing_colors = [c['name'] for c in data['colors'] if 'レザック66' in c['name']]
    
    # 追加すべきレザック66の色とその近似色
    additional_colors = [
        ('レザック66白', '#ffffff'),
        ('レザック66黒', '#2d2d2d'),
        ('レザック66赤', '#dc2626'),
        ('レザック66青', '#2563eb'),
        ('レザック66緑', '#16a34a'),
        ('レザック66黄', '#eab308'),
        ('レザック66紫', '#9333ea'),
        ('レザック66オレンジ', '#ea580c'),
        ('レザック66ピンク', '#ec4899'),
        ('レザック66茶', '#a16207'),
        ('レザック66グレー', '#6b7280'),
        ('レザック66ベージュ', '#fbbf24'),
        ('レザック66クリーム', '#fef3c7'),
        ('レザック66ネイビー', '#1e3a8a'),
        ('レザック66マルーン', '#7c2d12'),
        ('レザック66ゴールド', '#d97706'),
        ('レザック66シルバー', '#94a3b8'),
        ('レザック66ローズ', '#f43f5e'),
        ('レザック66ミント', '#10b981'),
        ('レザック66ラベンダー', '#a78bfa')
    ]
    
    # 現在の最大IDを取得
    max_id = max([int(c['id'].split('_')[1]) for c in data['colors']])
    
    # 新しい色を追加
    new_colors = []
    for color_name, hex_color in additional_colors:
        if color_name not in existing_colors:
            # RGB値を計算
            hex_color = hex_color.lstrip('#')
            r = int(hex_color[0:2], 16)
            g = int(hex_color[2:4], 16)
            b = int(hex_color[4:6], 16)
            
            max_id += 1
            new_color = {
                "id": f"official_{max_id}",
                "name": color_name,
                "brand": "レザック66",
                "weight": "135kg",
                "size": "636×939mm",
                "official_image": f"{color_name}.png",
                "local_image_url": f"http://localhost:5000/official_images/{color_name}.png",
                "is_official": False,  # 手動追加のため
                "scraped_at": datetime.now().isoformat(),
                "average_color": {
                    "rgb": [r, g, b],
                    "hex": f"#{hex_color}"
                }
            }
            new_colors.append(new_color)
    
    # 新しい色をデータに追加
    data['colors'].extend(new_colors)
    
    # メタデータを更新
    data['metadata']['total_colors'] = len(data['colors'])
    data['metadata']['last_updated'] = datetime.now().isoformat()
    
    # ブランド数を更新
    brand_counts = {}
    for color in data['colors']:
        brand = color['brand']
        brand_counts[brand] = brand_counts.get(brand, 0) + 1
    data['metadata']['brands'] = brand_counts
    
    # データを保存
    with open('paper_colors/official_paper_colors.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"Added {len(new_colors)} new レザック66 colors")
    print(f"Total レザック66 colors: {brand_counts.get('レザック66', 0)}")
    print(f"Total colors: {len(data['colors'])}")

if __name__ == "__main__":
    add_common_papers()