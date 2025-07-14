import json
import os
import hashlib
from datetime import datetime
from paper_color_scraper import PaperColorScraper

class DifferentialChecker:
    def __init__(self, data_dir="paper_colors"):
        self.data_dir = data_dir
        self.current_file = os.path.join(data_dir, "paper_colors_api.json")
        self.backup_dir = os.path.join(data_dir, "backups")
        os.makedirs(self.backup_dir, exist_ok=True)
    
    def load_current_data(self):
        """現在のデータを読み込み"""
        if os.path.exists(self.current_file):
            with open(self.current_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        return None
    
    def create_backup(self, data):
        """現在のデータをバックアップ"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_file = os.path.join(self.backup_dir, f"paper_colors_backup_{timestamp}.json")
        
        with open(backup_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        return backup_file
    
    def calculate_data_hash(self, colors):
        """データのハッシュ値を計算（変更検出用）"""
        # 色名とURLの組み合わせでハッシュを作成
        data_str = ""
        for color in sorted(colors, key=lambda x: x.get('name', '')):
            data_str += f"{color.get('name', '')}{color.get('thumbnail_url', '')}"
        
        return hashlib.md5(data_str.encode()).hexdigest()
    
    def compare_data(self, old_data, new_data):
        """データの差分を比較"""
        if not old_data or not new_data:
            return {
                'has_changes': True,
                'changes': ['Initial data or complete refresh']
            }
        
        old_colors = old_data.get('colors', [])
        new_colors = new_data.get('colors', [])
        
        # ハッシュ値で全体の変更を検出
        old_hash = self.calculate_data_hash(old_colors)
        new_hash = self.calculate_data_hash(new_colors)
        
        if old_hash == new_hash:
            return {
                'has_changes': False,
                'changes': []
            }
        
        # 詳細な差分を分析
        changes = []
        
        # 色名をキーとした辞書を作成
        old_colors_dict = {color.get('name', ''): color for color in old_colors}
        new_colors_dict = {color.get('name', ''): color for color in new_colors}
        
        # 新規追加の検出
        new_names = set(new_colors_dict.keys()) - set(old_colors_dict.keys())
        if new_names:
            changes.append(f"新規追加: {len(new_names)}色 - {list(new_names)[:5]}")
        
        # 削除の検出
        removed_names = set(old_colors_dict.keys()) - set(new_colors_dict.keys())
        if removed_names:
            changes.append(f"削除: {len(removed_names)}色 - {list(removed_names)[:5]}")
        
        # 変更の検出
        modified_colors = []
        for name in set(old_colors_dict.keys()) & set(new_colors_dict.keys()):
            old_color = old_colors_dict[name]
            new_color = new_colors_dict[name]
            
            # URLや平均色の変更をチェック
            if (old_color.get('thumbnail_url') != new_color.get('thumbnail_url') or
                old_color.get('average_color') != new_color.get('average_color')):
                modified_colors.append(name)
        
        if modified_colors:
            changes.append(f"変更: {len(modified_colors)}色 - {modified_colors[:5]}")
        
        return {
            'has_changes': len(changes) > 0,
            'changes': changes,
            'summary': {
                'added': len(new_names),
                'removed': len(removed_names),
                'modified': len(modified_colors),
                'total_old': len(old_colors),
                'total_new': len(new_colors)
            }
        }
    
    def run_differential_check(self):
        """差分チェックを実行"""
        print("Starting differential check...")
        
        # 現在のデータを読み込み
        current_data = self.load_current_data()
        
        # 新しいデータをスクレイピング
        scraper = PaperColorScraper()
        new_colors = scraper.scrape_all_colors()
        
        if not new_colors:
            print("Failed to scrape new data")
            return False
        
        # API形式に変換
        new_data = scraper.create_api_format(new_colors)
        
        # 差分を比較
        diff_result = self.compare_data(current_data, new_data)
        
        print(f"Differential check completed:")
        print(f"Has changes: {diff_result['has_changes']}")
        
        if diff_result['has_changes']:
            print("Changes detected:")
            for change in diff_result['changes']:
                print(f"  - {change}")
            
            if 'summary' in diff_result:
                summary = diff_result['summary']
                print(f"\nSummary:")
                print(f"  Added: {summary['added']}")
                print(f"  Removed: {summary['removed']}")
                print(f"  Modified: {summary['modified']}")
                print(f"  Total: {summary['total_old']} → {summary['total_new']}")
            
            # バックアップを作成
            if current_data:
                backup_file = self.create_backup(current_data)
                print(f"Backup created: {backup_file}")
            
            # 新しいデータを保存
            scraper.save_to_json(new_data, "paper_colors_api.json")
            scraper.save_to_json(new_colors, "paper_colors_raw.json")
            
            # 変更ログを保存
            self.save_change_log(diff_result)
            
            print("Data updated successfully")
        else:
            print("No changes detected")
        
        return diff_result['has_changes']
    
    def save_change_log(self, diff_result):
        """変更ログを保存"""
        log_file = os.path.join(self.data_dir, "change_log.json")
        
        log_entry = {
            'timestamp': datetime.now().isoformat(),
            'changes': diff_result['changes'],
            'summary': diff_result.get('summary', {})
        }
        
        # 既存のログを読み込み
        logs = []
        if os.path.exists(log_file):
            try:
                with open(log_file, 'r', encoding='utf-8') as f:
                    logs = json.load(f)
            except:
                logs = []
        
        # 新しいログエントリを追加
        logs.append(log_entry)
        
        # 最新100件のみ保持
        logs = logs[-100:]
        
        # ログファイルに保存
        with open(log_file, 'w', encoding='utf-8') as f:
            json.dump(logs, f, ensure_ascii=False, indent=2)


def main():
    """メイン実行関数"""
    checker = DifferentialChecker()
    checker.run_differential_check()


if __name__ == "__main__":
    main()