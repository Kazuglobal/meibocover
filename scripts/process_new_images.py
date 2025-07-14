import json
import os
from PIL import Image
import numpy as np
from datetime import datetime

def calculate_average_color(image_path):
    """画像の平均色を計算してRGB/HEXに変換"""
    try:
        with Image.open(image_path) as img:
            # RGBに変換
            img = img.convert('RGB')
            
            # NumPy配列に変換
            img_array = np.array(img)
            
            # 平均色を計算
            avg_color = np.mean(img_array, axis=(0, 1))
            
            # RGB値を整数に変換
            r, g, b = [int(c) for c in avg_color]
            
            # HEX値に変換
            hex_color = f"#{r:02x}{g:02x}{b:02x}"
            
            return {
                'rgb': [r, g, b],
                'hex': hex_color
            }
    except Exception as e:
        print(f"Error calculating color for {image_path}: {e}")
        return None

def update_paper_colors_with_real_images():
    """実際の画像サンプルでデータベースを更新"""
    
    # 現在のデータを読み込み
    with open('paper_colors/official_paper_colors.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # 新しい画像ファイルのマッピング
    new_images = [
        'レザック66アーモンド.png',
        'レザック66うすみどり.png',
        'レザック66ダークグレイ.png',
        'レザック66ホワイトグレイ.png',
        'レザック66ライトグリーン.png',
        'レザック66ライトグレイ.png'
    ]
    
    # 各画像に対して処理
    for image_file in new_images:
        paper_name = image_file.replace('.png', '')
        image_path = f'paper_colors/official_images/{image_file}'
        
        # 画像が存在するかチェック
        if os.path.exists(image_path):
            # 平均色を計算
            avg_color = calculate_average_color(image_path)
            
            if avg_color:
                # 既存のデータを更新または新規追加
                found = False
                for color_data in data['colors']:
                    if color_data['name'] == paper_name:
                        # 既存データを更新
                        color_data['official_image'] = image_file
                        color_data['local_image_url'] = f"http://localhost:5000/official_images/{image_file}"
                        color_data['average_color'] = avg_color
                        color_data['is_official'] = True
                        color_data['scraped_at'] = datetime.now().isoformat()
                        found = True
                        print(f"Updated: {paper_name}")
                        break
                
                if not found:
                    # 新規データを追加
                    max_id = max([int(c['id'].split('_')[1]) for c in data['colors']])
                    new_color = {
                        "id": f"official_{max_id + 1}",
                        "name": paper_name,
                        "brand": "レザック66",
                        "weight": "135kg",
                        "size": "636×939mm",
                        "official_image": image_file,
                        "local_image_url": f"http://localhost:5000/official_images/{image_file}",
                        "is_official": True,
                        "scraped_at": datetime.now().isoformat(),
                        "average_color": avg_color
                    }
                    data['colors'].append(new_color)
                    print(f"Added: {paper_name}")
        else:
            print(f"Image not found: {image_path}")
    
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
    
    print(f"Updated database with {len(new_images)} images")
    print(f"Total colors: {len(data['colors'])}")

if __name__ == "__main__":
    update_paper_colors_with_real_images()