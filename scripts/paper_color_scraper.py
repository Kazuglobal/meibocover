import requests
from bs4 import BeautifulSoup
import json
import os
from PIL import Image
import numpy as np
from urllib.parse import urljoin, urlparse
import time
import hashlib
from datetime import datetime

class PaperColorScraper:
    def __init__(self, base_url="https://www.shimeitehai.co.jp/cl2/234/cl234.htm"):
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
        self.data_dir = "paper_colors"
        self.images_dir = os.path.join(self.data_dir, "images")
        os.makedirs(self.images_dir, exist_ok=True)
        
    def fetch_page(self, url):
        """Webページを取得"""
        try:
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            response.encoding = 'shift_jis'  # 日本語サイトの場合
            return response.text
        except Exception as e:
            print(f"Error fetching {url}: {e}")
            return None
    
    def extract_colors(self, html_content):
        """HTMLから色情報を抽出"""
        soup = BeautifulSoup(html_content, 'html.parser')
        colors = []
        
        # 画像とリンクのペアを探す
        links = soup.find_all('a')
        
        for link in links:
            href = link.get('href', '')
            
            # 色見本ページのリンクと思われるもの（数字.htmパターン）
            if href.endswith('.htm') and any(char.isdigit() for char in href):
                # リンクテキストから色名を取得
                color_name = link.get_text(strip=True)
                
                # 画像を探す
                img = link.find('img')
                if img:
                    img_src = img.get('src', '')
                    
                    # サムネイル画像のURLを構築
                    img_url = urljoin(self.base_url, img_src)
                    
                    # 詳細ページのURLを構築
                    detail_url = urljoin(self.base_url, href)
                    
                    colors.append({
                        'name': color_name,
                        'thumbnail_url': img_url,
                        'detail_url': detail_url,
                        'href': href
                    })
        
        return colors
    
    def download_image(self, url, filename):
        """画像をダウンロード"""
        try:
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            
            filepath = os.path.join(self.images_dir, filename)
            with open(filepath, 'wb') as f:
                f.write(response.content)
            return filepath
        except Exception as e:
            print(f"Error downloading image {url}: {e}")
            return None
    
    def calculate_average_color(self, image_path):
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
            print(f"Error calculating average color for {image_path}: {e}")
            return None
    
    def extract_detailed_info(self, detail_url):
        """詳細ページから追加情報を抽出"""
        html = self.fetch_page(detail_url)
        if not html:
            return {}
        
        soup = BeautifulSoup(html, 'html.parser')
        info = {}
        
        # ページタイトルから銘柄情報を抽出
        title = soup.find('title')
        if title:
            title_text = title.get_text()
            info['page_title'] = title_text
            
            # 銘柄の判定
            if 'レザック66' in title_text or 'LEATHAC66' in title_text:
                info['brand'] = 'レザック66'
            elif 'レザック' in title_text or 'LEATHAC' in title_text:
                info['brand'] = 'レザック'
            elif 'NTほそおり' in title_text or 'ほそおり' in title_text:
                info['brand'] = 'NTほそおり'
            elif 'みやぎぬ' in title_text:
                info['brand'] = 'みやぎぬ'
            else:
                info['brand'] = 'その他'
        
        # ページ内容から連量などの情報を抽出
        text_content = soup.get_text()
        
        # 連量の抽出（数字+kgのパターン）
        import re
        weight_match = re.search(r'(\d+)\s*kg', text_content)
        if weight_match:
            info['weight'] = f"{weight_match.group(1)}kg"
        
        # サイズ情報の抽出
        size_match = re.search(r'(\d+)\s*×\s*(\d+)', text_content)
        if size_match:
            info['size'] = f"{size_match.group(1)}×{size_match.group(2)}"
        
        return info
    
    def scrape_all_colors(self):
        """すべての色情報をスクレイピング"""
        print("Starting paper color scraping...")
        
        # メインページを取得
        html = self.fetch_page(self.base_url)
        if not html:
            print("Failed to fetch main page")
            return []
        
        # 色情報を抽出
        colors = self.extract_colors(html)
        print(f"Found {len(colors)} colors")
        
        results = []
        
        for i, color in enumerate(colors):
            print(f"Processing {i+1}/{len(colors)}: {color['name']}")
            
            # 画像をダウンロード
            img_filename = f"{hashlib.md5(color['thumbnail_url'].encode()).hexdigest()}.jpg"
            img_path = self.download_image(color['thumbnail_url'], img_filename)
            
            # 平均色を計算
            avg_color = None
            if img_path:
                avg_color = self.calculate_average_color(img_path)
            
            # 詳細情報を取得
            detailed_info = self.extract_detailed_info(color['detail_url'])
            
            # 結果をまとめる
            result = {
                'id': hashlib.md5(color['name'].encode()).hexdigest()[:8],
                'name': color['name'],
                'brand': detailed_info.get('brand', 'その他'),
                'weight': detailed_info.get('weight'),
                'size': detailed_info.get('size'),
                'thumbnail_url': color['thumbnail_url'],
                'detail_url': color['detail_url'],
                'image_file': img_filename if img_path else None,
                'average_color': avg_color,
                'scraped_at': datetime.now().isoformat(),
                'page_title': detailed_info.get('page_title')
            }
            
            results.append(result)
            
            # サーバーに負荷をかけないよう少し待機
            time.sleep(1)
        
        return results
    
    def save_to_json(self, data, filename="paper_colors.json"):
        """データをJSONファイルに保存"""
        filepath = os.path.join(self.data_dir, filename)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        print(f"Data saved to {filepath}")
        return filepath
    
    def create_api_format(self, data):
        """API用のフォーマットに変換"""
        api_data = {
            'metadata': {
                'total_colors': len(data),
                'last_updated': datetime.now().isoformat(),
                'brands': {}
            },
            'colors': data
        }
        
        # ブランド別の統計を作成
        brand_stats = {}
        for color in data:
            brand = color['brand']
            if brand not in brand_stats:
                brand_stats[brand] = 0
            brand_stats[brand] += 1
        
        api_data['metadata']['brands'] = brand_stats
        
        return api_data


def main():
    """メイン実行関数"""
    scraper = PaperColorScraper()
    
    # スクレイピング実行
    colors = scraper.scrape_all_colors()
    
    if colors:
        # API形式でデータを保存
        api_data = scraper.create_api_format(colors)
        scraper.save_to_json(api_data, "paper_colors_api.json")
        
        # 生データも保存
        scraper.save_to_json(colors, "paper_colors_raw.json")
        
        print(f"Successfully scraped {len(colors)} colors")
        print(f"Brands found: {list(api_data['metadata']['brands'].keys())}")
    else:
        print("No colors found")


if __name__ == "__main__":
    main()