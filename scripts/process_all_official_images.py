import json
import os
from PIL import Image
import numpy as np
from datetime import datetime
import glob

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

def get_brand_from_name(name):
    """紙名からブランドを判定"""
    if 'レザック66' in name:
        return 'レザック66'
    elif 'レザック80つむぎ' in name:
        return 'レザック80つむぎ'
    elif 'レザック82ろうけつ' in name:
        return 'レザック82ろうけつ'
    elif 'レザック80つき' in name:
        return 'レザック80つき'
    elif 'レザック' in name:
        return 'その他レザック'
    elif 'NT' in name:
        return 'NT'
    elif 'みやぎぬ' in name:
        return 'みやぎぬ'
    else:
        return 'その他'

def process_all_official_images():
    """official_imagesディレクトリの全画像を処理"""
    
    # 画像ディレクトリのパス
    images_dir = 'paper_colors/official_images'
    
    # 全画像ファイルを取得
    image_files = glob.glob(os.path.join(images_dir, '*.png'))
    
    print(f"Found {len(image_files)} image files")
    
    # 新しいデータベースを作成
    colors = []
    
    for i, image_path in enumerate(image_files):
        # ファイル名から紙名を取得
        filename = os.path.basename(image_path)
        paper_name = filename.replace('.png', '')
        
        # ブランドを判定
        brand = get_brand_from_name(paper_name)
        
        # 平均色を計算
        avg_color = calculate_average_color(image_path)
        
        if avg_color:
            color_data = {
                "id": f"official_{i}",
                "name": paper_name,
                "brand": brand,
                "weight": "135kg",
                "size": "636×939mm",
                "official_image": filename,
                "local_image_url": f"http://localhost:5000/official_images/{filename}",
                "is_official": True,
                "scraped_at": datetime.now().isoformat(),
                "average_color": avg_color
            }
            colors.append(color_data)
            print(f"Processed: {paper_name} ({brand})")
        else:
            print(f"Failed to process: {paper_name}")
    
    # ブランド数を計算
    brand_counts = {}
    for color in colors:
        brand = color['brand']
        brand_counts[brand] = brand_counts.get(brand, 0) + 1
    
    # データベース構造を作成
    database = {
        "metadata": {
            "total_colors": len(colors),
            "last_updated": datetime.now().isoformat(),
            "brands": brand_counts
        },
        "colors": colors
    }
    
    # データを保存
    with open('paper_colors/official_paper_colors.json', 'w', encoding='utf-8') as f:
        json.dump(database, f, ensure_ascii=False, indent=2)
    
    print(f"\\nDatabase updated successfully!")
    print(f"Total colors: {len(colors)}")
    print("Brand distribution:")
    for brand, count in brand_counts.items():
        print(f"  {brand}: {count}")

if __name__ == "__main__":
    process_all_official_images()