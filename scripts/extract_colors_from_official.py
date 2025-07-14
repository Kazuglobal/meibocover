import json
import os
from PIL import Image
import numpy as np

def calculate_average_color(image_path):
    """画像の平均色を計算"""
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
        print(f"Error calculating average color for {image_path}: {e}")
        return None

def update_official_colors_with_averages():
    """公式紙見本データに平均色を追加"""
    data_file = 'paper_colors/official_paper_colors.json'
    images_dir = 'paper_colors/official_images'
    
    if not os.path.exists(data_file):
        print("Official paper colors data not found")
        return
    
    # データを読み込み
    with open(data_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    updated_colors = []
    
    for color in data['colors']:
        image_file = color.get('official_image')
        if image_file:
            image_path = os.path.join(images_dir, image_file)
            if os.path.exists(image_path):
                avg_color = calculate_average_color(image_path)
                if avg_color:
                    color['average_color'] = avg_color
                    print(f"Updated {color['name']}: {avg_color['hex']}")
                else:
                    print(f"Failed to calculate color for {color['name']}")
            else:
                print(f"Image not found: {image_path}")
        
        updated_colors.append(color)
    
    # データを更新
    data['colors'] = updated_colors
    
    # ファイルに保存
    with open(data_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"Updated {len(updated_colors)} colors with average color data")

if __name__ == "__main__":
    update_official_colors_with_averages()