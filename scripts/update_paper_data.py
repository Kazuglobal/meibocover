import json
import os
import shutil
from datetime import datetime

# 実際の紙見本画像パスと対応する色名のマッピング
paper_image_mapping = {
    # レザック66シリーズ
    'レザック66うすみどり': r'C:\Users\SALAT\Pictures\Screenshots\レザック66うすみどり.png',
    'レザック66うすむらさき': r'C:\Users\SALAT\Pictures\Screenshots\レザック66うすむらさき.png',
    'レザック66ダークグレイ': r'C:\Users\SALAT\Pictures\Screenshots\レザック66ダークグレイ.png',
    'レザック66ホワイトグレイ': r'C:\Users\SALAT\Pictures\Screenshots\レザック66ホワイトグレイ.png',
    'レザック66ライトグリーン': r'C:\Users\SALAT\Pictures\Screenshots\レザック66ライトグリーン.png',
    'レザック66ライトグレイ': r'C:\Users\SALAT\Pictures\Screenshots\レザック66ライトグレイ.png',
    'レザック66レモン': r'C:\Users\SALAT\Pictures\Screenshots\レザック66レモン.png',
    'レザック66らくだ': r'C:\Users\SALAT\Pictures\Screenshots\レザック66らくだ.png',
    
    # レザック80つむぎシリーズ
    'レザック80つむぎんねず': r'C:\Users\SALAT\Pictures\Screenshots\レザック80つむいぎんねず.png',
    'レザック80つむぎあい': r'C:\Users\SALAT\Pictures\Screenshots\レザック80つむぎあい.png',
    'レザック80つむぎあお': r'C:\Users\SALAT\Pictures\Screenshots\レザック80つむぎあお.png',
    'レザック80つむぎあおねず': r'C:\Users\SALAT\Pictures\Screenshots\レザック80つむぎあおねず.png',
    'レザック80つむぎあさぎ': r'C:\Users\SALAT\Pictures\Screenshots\レザック80つむぎあさぎ.png',
    'レザック80つむぎうすずみ': r'C:\Users\SALAT\Pictures\Screenshots\レザック80つむぎうすずみ.png',
    'レザック80つむぎうめ': r'C:\Users\SALAT\Pictures\Screenshots\レザック80つむぎうめ.png',
    'レザック80つむぎきいろ': r'C:\Users\SALAT\Pictures\Screenshots\レザック80つむぎきいろ.png',
    'レザック80つむぎきぬ': r'C:\Users\SALAT\Pictures\Screenshots\レザック80つむぎきぬ.png',
    'レザック80つむぎきんちゃ': r'C:\Users\SALAT\Pictures\Screenshots\レザック80つむぎきんちゃ.png',
    'レザック80つむぎくちば': r'C:\Users\SALAT\Pictures\Screenshots\レザック80つむぎくちば.png',
    'レザック80つむぎくり': r'C:\Users\SALAT\Pictures\Screenshots\レザック80つむぎくり.png',
    'レザック80つむぎこうぞ': r'C:\Users\SALAT\Pictures\Screenshots\レザック80つむぎこうぞ.png',
    'レザック80つむぎこけ': r'C:\Users\SALAT\Pictures\Screenshots\レザック80つむぎこけ.png',
    'レザック80つむぎこそめ': r'C:\Users\SALAT\Pictures\Screenshots\レザック80つむぎこそめ.png',
    'レザック80つむぎしらちゃ': r'C:\Users\SALAT\Pictures\Screenshots\レザック80つむぎしらちゃ.png',
    'レザック80つむぎすいせん': r'C:\Users\SALAT\Pictures\Screenshots\レザック80つむぎすいせん.png',
    'レザック80つむぎすみ': r'C:\Users\SALAT\Pictures\Screenshots\レザック80つむぎすみ.png',
    'レザック80つむぎそら': r'C:\Users\SALAT\Pictures\Screenshots\レザック80つむぎそら.png',
    'レザック80つむぎつゆくさ': r'C:\Users\SALAT\Pictures\Screenshots\レザック80つむぎつゆくさ.png',
    'レザック80つむぎはだ': r'C:\Users\SALAT\Pictures\Screenshots\レザック80つむぎはだ.png',
    'レザック80つむぎひすい': r'C:\Users\SALAT\Pictures\Screenshots\レザック80つむぎひすい.png',
    'レザック80つむぎふじ': r'C:\Users\SALAT\Pictures\Screenshots\レザック80つむぎふじ.png',
    'レザック80つむぎべに': r'C:\Users\SALAT\Pictures\Screenshots\レザック80つむぎべに.png',
    'レザック80つむぎほのお': r'C:\Users\SALAT\Pictures\Screenshots\レザック80つむぎほのお.png',
    'レザック80つむぎみどり': r'C:\Users\SALAT\Pictures\Screenshots\レザック80つむぎみどり.png',
    'レザック80つむぎむらさき': r'C:\Users\SALAT\Pictures\Screenshots\レザック80つむぎむらさき.png',
    'レザック80つむぎもえぎ': r'C:\Users\SALAT\Pictures\Screenshots\レザック80つむぎもえぎ.png',
    'レザック80つむぎもも': r'C:\Users\SALAT\Pictures\Screenshots\レザック80つむぎもも.png',
    'レザック80つむぎよもぎ': r'C:\Users\SALAT\Pictures\Screenshots\レザック80つむぎよもぎ.png',
    'レザック80つむぎらくだ': r'C:\Users\SALAT\Pictures\Screenshots\レザック80つむぎらくだ.png',
    'レザック80つむぎわかくさ': r'C:\Users\SALAT\Pictures\Screenshots\レザック80つむぎわかくさ.png',
    
    # レザック82ろうけつシリーズ
    'レザック82ろうけつあい': r'C:\Users\SALAT\Pictures\Screenshots\レザック82ろうけつあい.png',
    'レザック82ろうけつあさぎ': r'C:\Users\SALAT\Pictures\Screenshots\レザック82ろうけつあさぎ.png',
    'レザック82ろうけつこがね': r'C:\Users\SALAT\Pictures\Screenshots\レザック82ろうけつこがね.png',
    'レザック82ろうけつこそめ': r'C:\Users\SALAT\Pictures\Screenshots\レザック82ろうけつこそめ.png',
    'レザック82ろうけつしゅ': r'C:\Users\SALAT\Pictures\Screenshots\レザック82ろうけつしゅ.png',
    'レザック82ろうけつしらちゃ': r'C:\Users\SALAT\Pictures\Screenshots\レザック82ろうけつしらちゃ.png',
    'レザック82ろうけつしろ': r'C:\Users\SALAT\Pictures\Screenshots\レザック82ろうけつしろ.png',
    'レザック82ろうけつすみ': r'C:\Users\SALAT\Pictures\Screenshots\レザック82ろうけつすみ.png',
    'レザック82ろうけつぞうげ': r'C:\Users\SALAT\Pictures\Screenshots\レザック82ろうけつぞうげ.png',
    'レザック82ろうけつねずみ': r'C:\Users\SALAT\Pictures\Screenshots\レザック82ろうけつねずみ.png',
    'レザック82ろうけつはだ': r'C:\Users\SALAT\Pictures\Screenshots\レザック82ろうけつはだ.png',
    'レザック82ろうけつみず': r'C:\Users\SALAT\Pictures\Screenshots\レザック82ろうけつみず.png',
    'レザック82ろうけつみどり': r'C:\Users\SALAT\Pictures\Screenshots\レザック82ろうけつみどり.png'
}

def copy_paper_images():
    """紙見本画像をプロジェクトディレクトリにコピー"""
    images_dir = "paper_colors/official_images"
    os.makedirs(images_dir, exist_ok=True)
    
    copied_files = {}
    
    for paper_name, source_path in paper_image_mapping.items():
        if os.path.exists(source_path):
            # ファイル名を正規化
            filename = f"{paper_name}.png"
            dest_path = os.path.join(images_dir, filename)
            
            try:
                shutil.copy2(source_path, dest_path)
                copied_files[paper_name] = filename
                print(f"Copied: {paper_name} -> {filename}")
            except Exception as e:
                print(f"Error copying {paper_name}: {e}")
        else:
            print(f"Source file not found: {source_path}")
    
    return copied_files

def create_official_paper_data():
    """公式紙見本データを作成"""
    copied_files = copy_paper_images()
    
    paper_data = []
    
    for paper_name, filename in copied_files.items():
        # 銘柄を判定
        if 'レザック66' in paper_name:
            brand = 'レザック66'
        elif 'レザック80つむぎ' in paper_name:
            brand = 'レザック80つむぎ'
        elif 'レザック82ろうけつ' in paper_name:
            brand = 'レザック82ろうけつ'
        else:
            brand = 'レザック'
        
        paper_info = {
            'id': f"official_{len(paper_data)}",
            'name': paper_name,
            'brand': brand,
            'weight': '135kg' if 'レザック66' in paper_name else '80kg' if 'つむぎ' in paper_name else '82kg',
            'size': '636×939mm',
            'official_image': filename,
            'local_image_url': f"http://localhost:5000/official_images/{filename}",
            'is_official': True,
            'scraped_at': datetime.now().isoformat()
        }
        
        paper_data.append(paper_info)
    
    # APIデータ形式で保存
    api_data = {
        'metadata': {
            'total_colors': len(paper_data),
            'last_updated': datetime.now().isoformat(),
            'brands': {}
        },
        'colors': paper_data
    }
    
    # ブランド統計
    brand_stats = {}
    for paper in paper_data:
        brand = paper['brand']
        if brand not in brand_stats:
            brand_stats[brand] = 0
        brand_stats[brand] += 1
    
    api_data['metadata']['brands'] = brand_stats
    
    # ファイルに保存
    with open('paper_colors/official_paper_colors.json', 'w', encoding='utf-8') as f:
        json.dump(api_data, f, ensure_ascii=False, indent=2)
    
    print(f"Created official paper data with {len(paper_data)} colors")
    print(f"Brands: {list(brand_stats.keys())}")
    
    return api_data

if __name__ == "__main__":
    create_official_paper_data()