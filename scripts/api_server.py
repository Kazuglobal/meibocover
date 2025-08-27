from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import json
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)  # フロントエンドからのアクセスを許可

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

class PaperColorAPI:
    def __init__(self, data_file=os.path.join(BASE_DIR, "paper_colors", "paper_colors_api.json")):
        self.data_file = data_file
        self._data = None
        self._last_loaded = None
    
    def load_data(self):
        """データを読み込み（キャッシュ機能付き）"""
        try:
            # ファイルが更新されている場合のみ再読み込み
            if os.path.exists(self.data_file):
                file_mtime = os.path.getmtime(self.data_file)
                if self._last_loaded is None or file_mtime > self._last_loaded:
                    with open(self.data_file, 'r', encoding='utf-8') as f:
                        self._data = json.load(f)
                    self._last_loaded = file_mtime
                return self._data
        except Exception as e:
            print(f"Error loading data: {e}")
        return None
    
    def get_all_colors(self):
        """すべての色データを取得"""
        data = self.load_data()
        return data if data else {"error": "Data not available"}
    
    def get_colors_by_brand(self, brand):
        """銘柄別の色データを取得"""
        data = self.load_data()
        if not data:
            return {"error": "Data not available"}
        
        colors = [color for color in data.get('colors', []) 
                 if color.get('brand', '').lower() == brand.lower()]
        
        return {
            "brand": brand,
            "total": len(colors),
            "colors": colors
        }
    
    def search_colors(self, query):
        """色名での検索"""
        data = self.load_data()
        if not data:
            return {"error": "Data not available"}
        
        query = query.lower()
        colors = [color for color in data.get('colors', []) 
                 if query in color.get('name', '').lower()]
        
        return {
            "query": query,
            "total": len(colors),
            "colors": colors
        }
    
    def get_color_by_id(self, color_id):
        """IDで特定の色を取得"""
        data = self.load_data()
        if not data:
            return {"error": "Data not available"}
        
        for color in data.get('colors', []):
            if color.get('id') == color_id:
                return color
        
        return {"error": "Color not found"}

# APIインスタンスを作成
api = PaperColorAPI()

@app.route('/api/colors', methods=['GET'])
def get_colors():
    """すべての色データを取得"""
    return jsonify(api.get_all_colors())

@app.route('/api/colors/brands', methods=['GET'])
def get_brands():
    """利用可能な銘柄一覧を取得"""
    data = api.load_data()
    if not data:
        return jsonify({"error": "Data not available"})
    
    return jsonify({
        "brands": list(data.get('metadata', {}).get('brands', {}).keys())
    })

@app.route('/api/colors/brand/<brand>', methods=['GET'])
def get_colors_by_brand(brand):
    """銘柄別の色データを取得"""
    return jsonify(api.get_colors_by_brand(brand))

@app.route('/api/colors/search', methods=['GET'])
def search_colors():
    """色名で検索"""
    query = request.args.get('q', '')
    if not query:
        return jsonify({"error": "Query parameter 'q' is required"})
    
    return jsonify(api.search_colors(query))

@app.route('/api/colors/<color_id>', methods=['GET'])
def get_color(color_id):
    """特定の色データを取得"""
    return jsonify(api.get_color_by_id(color_id))

@app.route('/api/status', methods=['GET'])
def get_status():
    """APIの状態を取得"""
    data = api.load_data()
    if not data:
        return jsonify({
            "status": "error",
            "message": "Data not available"
        })
    
    metadata = data.get('metadata', {})
    return jsonify({
        "status": "ok",
        "total_colors": metadata.get('total_colors', 0),
        "last_updated": metadata.get('last_updated'),
        "brands": metadata.get('brands', {}),
        "api_version": "1.0"
    })

@app.route('/api/colors/rgb/<int:r>/<int:g>/<int:b>', methods=['GET'])
def find_similar_colors(r, g, b):
    """RGB値に近い色を検索"""
    data = api.load_data()
    if not data:
        return jsonify({"error": "Data not available"})
    
    target_rgb = [r, g, b]
    similar_colors = []
    
    for color in data.get('colors', []):
        avg_color = color.get('average_color')
        if avg_color and 'rgb' in avg_color:
            color_rgb = avg_color['rgb']
            
            # RGB距離を計算
            distance = sum((a - b) ** 2 for a, b in zip(target_rgb, color_rgb)) ** 0.5
            
            if distance < 50:  # 閾値は調整可能
                similar_colors.append({
                    **color,
                    'distance': round(distance, 2)
                })
    
    # 距離順でソート
    similar_colors.sort(key=lambda x: x['distance'])
    
    return jsonify({
        "target_rgb": target_rgb,
        "total": len(similar_colors),
        "colors": similar_colors[:10]  # 上位10件
    })

@app.route('/images/<filename>')
def serve_image(filename):
    """画像ファイルを提供"""
    try:
        return send_from_directory('paper_colors/images', filename)
    except FileNotFoundError:
        return jsonify({"error": "Image not found"}), 404

@app.route('/official_images/<filename>')
def serve_official_image(filename):
    """公式紙見本画像を提供"""
    try:
        return send_from_directory(os.path.join(BASE_DIR, 'paper_colors/official_images'), filename)
    except FileNotFoundError:
        return jsonify({"error": "Official image not found"}), 404

@app.route('/api/official_colors', methods=['GET'])
def get_official_colors():
    """公式紙見本データを取得"""
    try:
        with open(os.path.join(BASE_DIR, 'paper_colors', 'official_paper_colors.json'), 'r', encoding='utf-8') as f:
            data = json.load(f)
        return jsonify(data)
    except FileNotFoundError:
        return jsonify({"error": "Official paper colors data not found"}), 404

@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Endpoint not found"}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Internal server error"}), 500

if __name__ == '__main__':
    print("Starting Paper Color API Server...")
    print("Available endpoints:")
    print("  GET /api/colors - すべての色データ")
    print("  GET /api/colors/brands - 銘柄一覧")
    print("  GET /api/colors/brand/<brand> - 銘柄別色データ")
    print("  GET /api/colors/search?q=<query> - 色名検索")
    print("  GET /api/colors/<id> - 特定色データ")
    print("  GET /api/colors/rgb/<r>/<g>/<b> - RGB類似色検索")
    print("  GET /api/status - API状態")
    
    app.run(debug=True, host='0.0.0.0', port=5000)