'use client';

import { useState, useRef, useEffect } from 'react';
import { Upload, Plus, Type, Download } from 'lucide-react';
import axios from 'axios';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface TextElement {
  id: string;
  text: string;
  x: number;
  y: number;
  font: string;
  size: number;
  isDragging: boolean;
}

interface LogoElement {
  id: string;
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isDragging: boolean;
  color?: string;
  hasBackground?: boolean;
}

interface PaperColor {
  name: string;
  hex: string;
  brand: string;
  thumbnailUrl: string;
  imageFile: string;
  localImageUrl: string | null;
  isOfficial: boolean;
  official_image?: string;
}

interface ApiColorResponse {
  name: string;
  average_color?: {
    hex: string;
  };
  brand: string;
  thumbnail_url?: string;
  official_image?: string;
  local_image_url?: string;
  image_file?: string;
}

export default function Home() {
  const [selectedPaper, setSelectedPaper] = useState('レザック白');
  const [selectedFoil, setSelectedFoil] = useState('なし');
  const [textElements, setTextElements] = useState<TextElement[]>([
    { id: 'title', text: '○○○高等学校', x: 50, y: 35, font: '小塚明朝体pro_H', size: 24, isDragging: false },
    { id: 'subtitle', text: '卒業アルバム', x: 50, y: 55, font: '小塚明朝体pro_H', size: 18, isDragging: false }
  ]);
  const [logoElements, setLogoElements] = useState<LogoElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [selectedElementType, setSelectedElementType] = useState<'text' | 'logo' | null>(null);
  const dragRef = useRef<{ offsetX: number; offsetY: number } | null>(null);

  const [papers, setPapers] = useState<PaperColor[]>([]);

  // テキストの幅を計算して適切なフォントサイズを決定する関数
  const getOptimalFontSize = (text: string, baseFontSize: number, maxWidth: number = 280) => {
    // 文字数とフォントサイズから大まかなテキスト幅を推定
    const estimatedWidth = text.length * baseFontSize * 0.6; // 0.6は文字幅の近似値
    if (estimatedWidth > maxWidth) {
      // テキストが長すぎる場合は、フォントサイズを調整
      const ratio = maxWidth / estimatedWidth;
      return Math.max(Math.floor(baseFontSize * ratio), 12); // 最小12px
    }
    return baseFontSize;
  };

  // PDF生成機能
  const generatePDF = async () => {
    const previewElement = document.querySelector('.preview-container') as HTMLElement;
    if (!previewElement) {
      alert('プレビューエリアが見つかりません');
      return;
    }

    try {
      // 高品質キャプチャのためにスケール調整
      const scale = 3; // 3倍の解像度でキャプチャ
      const originalWidth = previewElement.offsetWidth;
      const originalHeight = previewElement.offsetHeight;

      // html2canvasでプレビューをキャプチャ（高解像度）
      const options = {
        useCORS: true,
        allowTaint: true,
        scale,
        width: originalWidth,
        height: originalHeight,
        logging: false,
        backgroundColor: null,
        onclone: (clonedDoc: Document) => {
          // クローンされたドキュメント内の画像のCORSを処理
          const images = clonedDoc.querySelectorAll('img');
          images.forEach((img: HTMLImageElement) => {
            img.crossOrigin = 'anonymous';
          });
          
          // 高DPI表示のためのスタイル調整
          const style = clonedDoc.createElement('style');
          style.textContent = `
            * {
              -webkit-font-smoothing: antialiased !important;
              -moz-osx-font-smoothing: grayscale !important;
              text-rendering: optimizeLegibility !important;
            }
          `;
          clonedDoc.head.appendChild(style);
        }
      } satisfies Partial<{
        useCORS: boolean;
        allowTaint: boolean;
        scale: number;
        width: number;
        height: number;
        logging: boolean;
        backgroundColor: string | null;
        onclone: (clonedDoc: Document) => void;
      }>;
      
      const canvas: HTMLCanvasElement = await html2canvas(previewElement, options);

      // PDFドキュメントを作成（A4サイズ、高解像度）
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: false // 高品質のため圧縮を無効化
      });

      // 高品質画像データを取得
      const imgData = canvas.toDataURL('image/png', 1.0); // 最高品質
      
      // A4サイズに合わせて表紙のサイズを計算
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // 表紙のアスペクト比を維持（高解像度キャンバスサイズを考慮）
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / (imgWidth / scale), pdfHeight / (imgHeight / scale));
      
      const scaledWidth = (imgWidth / scale) * ratio;
      const scaledHeight = (imgHeight / scale) * ratio;
      
      // 中央配置
      const x = (pdfWidth - scaledWidth) / 2;
      const y = (pdfHeight - scaledHeight) / 2;

      // PDFに高解像度画像を追加
      pdf.addImage(imgData, 'PNG', x, y, scaledWidth, scaledHeight, '', 'FAST');

      // 2ページ目に仕様情報を追加（Canvas使用で日本語対応）
      pdf.addPage();
      
      // 生成日時
      const now = new Date();
      
      // 仕様情報用のCanvasを作成（高解像度）
      const specCanvas = document.createElement('canvas');
      const specScale = 2; // 仕様ページも高解像度化
      specCanvas.width = 600 * specScale;
      specCanvas.height = 800 * specScale;
      const ctx = specCanvas.getContext('2d');
      
      if (ctx) {
        // 高DPI対応
        ctx.scale(specScale, specScale);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        // 背景を白に設定
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, specCanvas.width, specCanvas.height);
        
        // 日本語フォントを設定
        ctx.fillStyle = 'black';
        
        // タイトル
        ctx.font = '24px "Hiragino Kaku Gothic ProN", "メイリオ", Meiryo, sans-serif';
        ctx.fillText('表紙デザイン仕様', 30, 50);
        
        // 用紙情報
        ctx.font = '18px "Hiragino Kaku Gothic ProN", "メイリオ", Meiryo, sans-serif';
        ctx.fillText('用紙:', 30, 100);
        ctx.fillText(selectedPaper, 80, 100);
        
        // 箔押し情報
        ctx.fillText('箔押し:', 30, 130);
        ctx.fillText(selectedFoil, 100, 130);
        
        // テキスト要素
        ctx.fillText('テキスト要素:', 30, 170);
        let yPos = 200;
        textElements.forEach((element, index) => {
          ctx.font = '14px "Hiragino Kaku Gothic ProN", "メイリオ", Meiryo, sans-serif';
          ctx.fillText(`${index + 1}. "${element.text}"`, 40, yPos);
          ctx.font = '12px "Hiragino Kaku Gothic ProN", "メイリオ", Meiryo, sans-serif';
          ctx.fillText(`   書体: ${element.font}`, 40, yPos + 20);
          ctx.fillText(`   サイズ: ${element.size}px`, 40, yPos + 40);
          yPos += 70;
        });
        
        // ロゴ情報
        if (logoElements.length > 0) {
          ctx.font = '18px "Hiragino Kaku Gothic ProN", "メイリオ", Meiryo, sans-serif';
          ctx.fillText('ロゴ/画像要素:', 30, yPos + 20);
          yPos += 50;
          logoElements.forEach((element, index) => {
            ctx.font = '14px "Hiragino Kaku Gothic ProN", "メイリオ", Meiryo, sans-serif';
            ctx.fillText(`${index + 1}. ロゴ/画像`, 40, yPos);
            ctx.font = '12px "Hiragino Kaku Gothic ProN", "メイリオ", Meiryo, sans-serif';
            ctx.fillText(`   サイズ: ${element.width}×${element.height}px`, 40, yPos + 20);
            yPos += 50;
          });
        }
        
        // 生成日時
        ctx.font = '12px "Hiragino Kaku Gothic ProN", "メイリオ", Meiryo, sans-serif';
        ctx.fillText(`生成日時: ${now.toLocaleString('ja-JP')}`, 30, specCanvas.height - 30);
        
        // CanvasをPDFに追加
        const specImgData = specCanvas.toDataURL('image/png');
        const specPdfWidth = pdf.internal.pageSize.getWidth();
        const specPdfHeight = pdf.internal.pageSize.getHeight();
        pdf.addImage(specImgData, 'PNG', 0, 0, specPdfWidth, specPdfHeight);
      }

      // ファイル名を生成（現在の日時）
      const filename = `表紙プレビュー_${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}.pdf`;

      // PDFをダウンロード
      pdf.save(filename);
    } catch (error) {
      console.error('PDF生成エラー:', error);
      alert('PDF生成中にエラーが発生しました');
    }
  };
  const fonts = [
    '小塚ゴシック体pro_H',
    '小塚ゴシック体pro_B', 
    'DF太丸ゴシック体Std',
    '小塚明朝体pro_H',
    '小塚明朝体pro_B',
    'DF太楷書体Std',
    'DF行楷書体StdW5',
    'DF隷書体StdW5',
    'DFPOP1体StdW9'
  ];
  const foilOptions = ['なし', '金箔', '銀箔', 'スミ（黒）'];

  // 紙色データを取得
  useEffect(() => {
    const fetchPaperColors = async () => {
      console.log('用紙データを取得中...');
      try {
        // 公式紙見本データを優先して取得
        const officialResponse = await axios.get('http://localhost:5000/api/official_colors');
        console.log('公式紙色データ取得成功:', officialResponse.data);
        const officialColors = officialResponse.data.colors || [];
        
        const paperData = officialColors.map((color: ApiColorResponse) => ({
          name: color.name,
          hex: color.average_color?.hex || '#ffffff',
          brand: color.brand,
          thumbnailUrl: color.thumbnail_url || '',
          imageFile: color.official_image,
          localImageUrl: color.local_image_url,
          isOfficial: true
        }));
        
        console.log('処理された用紙データ:', paperData);
        setPapers(paperData);
        
        // デフォルトで最初の色を選択
        if (paperData.length > 0) {
          setSelectedPaper(paperData[0].name);
        }
      } catch (error) {
        console.error('公式紙色データの取得に失敗しました。スクレイピングデータを使用します:', error);
        
        // フォールバック：スクレイピングデータを使用
        try {
          const response = await axios.get('http://localhost:5000/api/colors');
          const colors = response.data.colors || [];
          
          const paperData = colors.map((color: ApiColorResponse) => ({
            name: color.name,
            hex: color.average_color?.hex || '#ffffff',
            brand: color.brand || 'その他',
            thumbnailUrl: color.thumbnail_url,
            imageFile: color.image_file,
            localImageUrl: color.image_file ? `http://localhost:5000/images/${color.image_file}` : null,
            isOfficial: false
          }));
          
          setPapers(paperData);
          
          if (paperData.length > 0) {
            setSelectedPaper(paperData[0].name);
          }
        } catch (fallbackError) {
          console.error('スクレイピングデータの取得にも失敗しました:', fallbackError);
          setPapers([
            { name: 'デフォルト白', hex: '#ffffff', brand: 'デフォルト', thumbnailUrl: '', imageFile: '', localImageUrl: null, isOfficial: false },
            { name: 'デフォルト黒', hex: '#000000', brand: 'デフォルト', thumbnailUrl: '', imageFile: '', localImageUrl: null, isOfficial: false }
          ]);
          setSelectedPaper('デフォルト白');
        }
      }
    };

    fetchPaperColors();
  }, []);

  // 色をCSSフィルターに変換する関数（改良版）
  const getColorFilter = (hexColor: string) => {
    // HEXからRGBに変換
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;
    
    // RGBからHSLに変換
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;
    
    let hue = 0;
    if (diff !== 0) {
      if (max === r) {
        hue = ((g - b) / diff) % 6;
      } else if (max === g) {
        hue = (b - r) / diff + 2;
      } else {
        hue = (r - g) / diff + 4;
      }
    }
    hue = Math.round(hue * 60);
    if (hue < 0) hue += 360;
    
    const lightness = (max + min) / 2;
    const saturation = diff === 0 ? 0 : diff / (1 - Math.abs(2 * lightness - 1));
    
    // CSS フィルターに変換
    return `sepia(1) saturate(${Math.round(saturation * 300)}%) hue-rotate(${hue}deg) brightness(${Math.round(lightness * 150)}%)`;
  };

  const removeImageBackground = (imageSrc: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          
          // 背景除去アルゴリズム（改良版）
          // エッジと四隅のピクセルをサンプリング
          const edgePixels: number[][] = [];
          
          // 上下のエッジ
          for (let x = 0; x < canvas.width; x += 5) {
            edgePixels.push([x, 0]); // 上端
            edgePixels.push([x, canvas.height - 1]); // 下端
          }
          // 左右のエッジ
          for (let y = 0; y < canvas.height; y += 5) {
            edgePixels.push([0, y]); // 左端
            edgePixels.push([canvas.width - 1, y]); // 右端
          }
          
          // エッジピクセルの色を収集
          const bgColors = edgePixels.map(([x, y]) => {
            const idx = (y * canvas.width + x) * 4;
            return [data[idx], data[idx + 1], data[idx + 2]];
          });
          
          // 最頻色を背景色として判定
          const colorMap = new Map<string, number>();
          bgColors.forEach(([r, g, b]) => {
            // 色をグループ化（10の倍数に丸める）
            const key = `${Math.floor(r / 10) * 10}-${Math.floor(g / 10) * 10}-${Math.floor(b / 10) * 10}`;
            colorMap.set(key, (colorMap.get(key) || 0) + 1);
          });
          
          // 最も多い色を背景色とする
          let maxCount = 0;
          let dominantColor = [255, 255, 255];
          colorMap.forEach((count, colorKey) => {
            if (count > maxCount) {
              maxCount = count;
              const [r, g, b] = colorKey.split('-').map(Number);
              dominantColor = [r, g, b];
            }
          });
          
          const tolerance = 40; // 色の許容範囲
          
          // 背景除去処理
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // 背景色に近い色を透明にする
            const colorDiff = Math.sqrt(
              Math.pow(r - dominantColor[0], 2) +
              Math.pow(g - dominantColor[1], 2) +
              Math.pow(b - dominantColor[2], 2)
            );
            
            if (colorDiff < tolerance) {
              data[i + 3] = 0; // アルファチャンネルを0（透明）に設定
            }
            // 半透明処理（境界をなめらかにする）
            else if (colorDiff < tolerance * 1.5) {
              const alpha = Math.max(0, Math.min(255, 255 * (colorDiff - tolerance) / (tolerance * 0.5)));
              data[i + 3] = alpha;
            }
          }
          
          ctx.putImageData(imageData, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        }
      };
      img.src = imageSrc;
    });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>, removeBg: boolean = false) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        let imageSrc = e.target?.result as string;
        
        if (removeBg) {
          try {
            imageSrc = await removeImageBackground(imageSrc);
          } catch (error) {
            console.error('背景除去エラー:', error);
            alert('背景除去に失敗しました。元の画像を使用します。');
          }
        }
        
        const newLogo: LogoElement = {
          id: `logo_${Date.now()}`,
          src: imageSrc,
          x: 50,
          y: 20,
          width: 64,
          height: 64,
          isDragging: false,
          color: '#000000',
          hasBackground: !removeBg
        };
        setLogoElements([...logoElements, newLogo]);
      };
      reader.readAsDataURL(file);
    }
  };

  const addTextElement = () => {
    const newElement: TextElement = {
      id: `text_${Date.now()}`,
      text: '新しいテキスト',
      x: 50,
      y: 70,
      font: '小塚明朝体pro_H',
      size: 16,
      isDragging: false
    };
    setTextElements([...textElements, newElement]);
  };

  const updateTextElement = (id: string, updates: Partial<TextElement>) => {
    setTextElements(textElements.map(el => 
      el.id === id ? { ...el, ...updates } : el
    ));
  };

  const updateLogoElement = (id: string, updates: Partial<LogoElement>) => {
    setLogoElements(logoElements.map(el => 
      el.id === id ? { ...el, ...updates } : el
    ));
  };

  const handleMouseDown = (e: React.MouseEvent, id: string, type: 'text' | 'logo') => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const previewRect = e.currentTarget.closest('.preview-container')?.getBoundingClientRect();
    if (!previewRect) return;

    dragRef.current = {
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top
    };

    if (type === 'text') {
      updateTextElement(id, { isDragging: true });
    } else {
      updateLogoElement(id, { isDragging: true });
    }
    
    setSelectedElement(id);
    setSelectedElementType(type);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const draggingTextElement = textElements.find(el => el.isDragging);
    const draggingLogoElement = logoElements.find(el => el.isDragging);
    
    if ((!draggingTextElement && !draggingLogoElement) || !dragRef.current) return;

    const previewRect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - previewRect.left) / previewRect.width) * 100;
    const y = ((e.clientY - previewRect.top) / previewRect.height) * 100;

    if (draggingTextElement) {
      updateTextElement(draggingTextElement.id, {
        x: Math.max(5, Math.min(95, x)),
        y: Math.max(5, Math.min(95, y))
      });
    } else if (draggingLogoElement) {
      updateLogoElement(draggingLogoElement.id, {
        x: Math.max(5, Math.min(95, x)),
        y: Math.max(5, Math.min(95, y))
      });
    }
  };

  const handleMouseUp = () => {
    textElements.forEach(el => {
      if (el.isDragging) {
        updateTextElement(el.id, { isDragging: false });
      }
    });
    logoElements.forEach(el => {
      if (el.isDragging) {
        updateLogoElement(el.id, { isDragging: false });
      }
    });
    dragRef.current = null;
  };

  const deleteTextElement = (id: string) => {
    if (id !== 'title' && id !== 'subtitle') {
      setTextElements(textElements.filter(el => el.id !== id));
      setSelectedElement(null);
      setSelectedElementType(null);
    }
  };

  const deleteLogoElement = (id: string) => {
    setLogoElements(logoElements.filter(el => el.id !== id));
    setSelectedElement(null);
    setSelectedElementType(null);
  };

  const selectedTextData = selectedElementType === 'text' ? textElements.find(el => el.id === selectedElement) : null;
  const selectedLogoData = selectedElementType === 'logo' ? logoElements.find(el => el.id === selectedElement) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">名簿表紙デザインシステム</h1>
      </header>

      <div className="flex flex-col lg:flex-row">
        {/* 左側：設定パネル */}
        <div className="w-full lg:w-80 bg-white border-r p-6 space-y-6 overflow-y-auto max-h-screen">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              用紙
            </label>
            <select
              value={selectedPaper}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedPaper(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {/* カテゴリ別にグループ化（改良版） */}
              {(() => {
                // 紙をより適切にカテゴリ分けする関数
                const getCategoryAndDisplayName = (paper: PaperColor) => {
                  const name = paper.name;
                  
                  // レザック66シリーズ
                  if (name.includes('レザック66')) {
                    return {
                      category: 'レザック66シリーズ',
                      displayName: name.replace(/レザック66\s*/, '').replace(/\s*\(.*?\)\s*$/, '')
                    };
                  }
                  // レザック80つむぎシリーズ
                  else if (name.includes('レザック80つむぎ')) {
                    return {
                      category: 'レザック80つむぎシリーズ',
                      displayName: name.replace(/レザック80つむぎ\s*/, '').replace(/\s*\(.*?\)\s*$/, '')
                    };
                  }
                  // レザック80つきシリーズ
                  else if (name.includes('レザック80つき')) {
                    return {
                      category: 'レザック80つきシリーズ',
                      displayName: name.replace(/レザック80つき\s*/, '').replace(/\s*\(.*?\)\s*$/, '')
                    };
                  }
                  // レザック82ろうけつシリーズ
                  else if (name.includes('レザック82ろうけつ')) {
                    return {
                      category: 'レザック82ろうけつシリーズ',
                      displayName: name.replace(/レザック82ろうけつ\s*/, '').replace(/\s*\(.*?\)\s*$/, '')
                    };
                  }
                  // NTシリーズ
                  else if (name.includes('NT')) {
                    return {
                      category: 'NTシリーズ',
                      displayName: name.replace(/\s*\(.*?\)\s*$/, '')
                    };
                  }
                  // みやぎぬシリーズ
                  else if (name.includes('みやぎぬ')) {
                    return {
                      category: 'みやぎぬシリーズ',
                      displayName: name.replace(/\s*\(.*?\)\s*$/, '')
                    };
                  }
                  // その他のレザックシリーズ
                  else if (name.includes('レザック')) {
                    return {
                      category: 'その他レザックシリーズ',
                      displayName: name.replace(/\s*\(.*?\)\s*$/, '')
                    };
                  }
                  // デフォルト
                  else {
                    return {
                      category: paper.brand || 'その他',
                      displayName: name.replace(/\s*\(.*?\)\s*$/, '')
                    };
                  }
                };

                // カテゴリ別にグループ化
                const groups = papers.reduce((acc: Record<string, (PaperColor & { displayName: string })[]>, paper) => {
                  const { category, displayName } = getCategoryAndDisplayName(paper);
                  if (!acc[category]) acc[category] = [];
                  acc[category].push({ ...paper, displayName });
                  return acc;
                }, {});

                // カテゴリの順序を定義
                const categoryOrder = [
                  'レザック66シリーズ',
                  'レザック80つむぎシリーズ',
                  'レザック80つきシリーズ',
                  'レザック82ろうけつシリーズ',
                  'その他レザックシリーズ',
                  'NTシリーズ',
                  'みやぎぬシリーズ',
                  'その他'
                ];

                // 順序に従ってソート
                const sortedCategories = Object.keys(groups).sort((a, b) => {
                  const indexA = categoryOrder.indexOf(a);
                  const indexB = categoryOrder.indexOf(b);
                  const orderA = indexA === -1 ? 999 : indexA;
                  const orderB = indexB === -1 ? 999 : indexB;
                  return orderA - orderB;
                });

                return sortedCategories.map(category => (
                  <optgroup key={category} label={`━━ ${category} ━━`}>
                    {groups[category]
                      .sort((a, b) => a.displayName.localeCompare(b.displayName, 'ja'))
                      .map((paper) => (
                        <option key={paper.name} value={paper.name}>
                          {paper.displayName}
                        </option>
                      ))}
                  </optgroup>
                ));
              })()}
            </select>
            
            {/* 色プレビュー */}
            {selectedPaper && (
              <div className="mt-2 p-3 border rounded-md">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-8 h-8 rounded border shadow-sm relative overflow-hidden"
                    style={{ 
                      backgroundColor: papers.find(p => p.name === selectedPaper)?.hex || '#ffffff'
                    }}
                  >
                    {papers.find(p => p.name === selectedPaper)?.localImageUrl && (
                      <img
                        src={papers.find(p => p.name === selectedPaper)?.localImageUrl || ''}
                        alt={selectedPaper}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    )}
                  </div>
                  <div className="text-sm">
                    <div className="font-medium">{selectedPaper}</div>
                    <div className="text-gray-500">
                      {papers.find(p => p.name === selectedPaper)?.hex || '#ffffff'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              箔押し
            </label>
            <select
              value={selectedFoil}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedFoil(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {foilOptions.map((foil) => (
                <option key={foil} value={foil}>{foil}</option>
              ))}
            </select>
            <div className="text-xs text-gray-500 mt-1">
              ※通常1冊50円かかります
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              校章・ロゴ
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleLogoUpload(e, false)}
                className="hidden"
                id="logo-upload"
              />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleLogoUpload(e, true)}
                className="hidden"
                id="logo-upload-nobg"
              />
              <div className="space-y-2">
                <label htmlFor="logo-upload" className="cursor-pointer block">
                  <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">通常アップロード</p>
                </label>
                <div className="border-t pt-2">
                  <label htmlFor="logo-upload-nobg" className="cursor-pointer block">
                    <div className="flex items-center justify-center gap-1 text-blue-600">
                      <Upload className="h-4 w-4" />
                      <p className="text-xs">背景除去してアップロード</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                テキスト要素
              </label>
              <button
                onClick={addTextElement}
                className="flex items-center gap-1 px-2 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
              >
                <Plus className="h-4 w-4" />
                追加
              </button>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {textElements.map((element) => (
                <div
                  key={element.id}
                  className={`p-2 border rounded cursor-pointer ${
                    selectedElement === element.id && selectedElementType === 'text' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                  onClick={() => {
                    setSelectedElement(element.id);
                    setSelectedElementType('text');
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Type className="h-4 w-4 text-gray-500" />
                    <span className="text-sm truncate flex-1">{element.text}</span>
                    {element.id !== 'title' && element.id !== 'subtitle' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteTextElement(element.id);
                        }}
                        className="text-red-500 hover:text-red-700 text-xs"
                      >
                        削除
                      </button>
                    )}
                  </div>
                </div>
              ))}
              
              {logoElements.map((element) => (
                <div
                  key={element.id}
                  className={`p-2 border rounded cursor-pointer ${
                    selectedElement === element.id && selectedElementType === 'logo' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                  onClick={() => {
                    setSelectedElement(element.id);
                    setSelectedElementType('logo');
                  }}
                >
                  <div className="flex items-center gap-2">
                    <img src={element.src} alt="Logo" className="h-6 w-6 object-contain" />
                    <span className="text-sm truncate flex-1">ロゴ/画像</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteLogoElement(element.id);
                      }}
                      className="text-red-500 hover:text-red-700 text-xs"
                    >
                      削除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selectedTextData && (
            <div className="border-t pt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">選択中のテキスト設定</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">テキスト</label>
                  <input
                    type="text"
                    value={selectedTextData.text || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      updateTextElement(selectedElement!, { text: e.target.value });
                    }}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">書体</label>
                  <select
                    value={selectedTextData.font}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateTextElement(selectedElement!, { font: e.target.value })}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {fonts.map((font) => (
                      <option key={font} value={font}>{font}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">サイズ</label>
                  <input
                    type="range"
                    min="10"
                    max="48"
                    value={selectedTextData.size}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateTextElement(selectedElement!, { size: parseInt(e.target.value) })}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-500 text-center">{selectedTextData.size}px</div>
                </div>
              </div>
            </div>
          )}

          {selectedLogoData && (
            <div className="border-t pt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">選択中のロゴ/画像設定</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">幅</label>
                  <input
                    type="range"
                    min="20"
                    max="200"
                    value={selectedLogoData.width}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateLogoElement(selectedElement!, { width: parseInt(e.target.value) })}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-500 text-center">{selectedLogoData.width}px</div>
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">高さ</label>
                  <input
                    type="range"
                    min="20"
                    max="200"
                    value={selectedLogoData.height}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateLogoElement(selectedElement!, { height: parseInt(e.target.value) })}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-500 text-center">{selectedLogoData.height}px</div>
                </div>

                {!selectedLogoData.hasBackground && (
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">色変更</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={selectedLogoData.color || '#000000'}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateLogoElement(selectedElement!, { color: e.target.value })}
                        className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                      />
                      <span className="text-xs text-gray-500">
                        {selectedLogoData.color || '#000000'}
                      </span>
                      <button
                        onClick={() => updateLogoElement(selectedElement!, { color: '#000000' })}
                        className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded hover:bg-gray-200"
                      >
                        リセット
                      </button>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      ※背景除去された画像のみ色変更可能
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors">
              保存
            </button>
            <button 
              onClick={generatePDF}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
            >
              <Download className="h-4 w-4" />
              PDFダウンロード
            </button>
          </div>
        </div>

        {/* 右側：プレビュー */}
        <div className="flex-1 p-6">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">プレビュー</h2>
              <button 
                onClick={generatePDF}
                className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                PDFダウンロード
              </button>
            </div>
            
            <div className="flex gap-6">
              {/* 表紙プレビュー */}
              <div className="flex-shrink-0">
                <div 
                  className="aspect-[3/4] w-80 border-2 rounded-lg shadow-lg relative overflow-hidden cursor-crosshair preview-container"
                  style={{
                    backgroundColor: papers.find(p => p.name === selectedPaper)?.hex || '#ffffff',
                    backgroundImage: papers.find(p => p.name === selectedPaper)?.localImageUrl 
                      ? `url(${papers.find(p => p.name === selectedPaper)?.localImageUrl})`
                      : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat'
                  }}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                >
              
              {/* ドラッグ可能なロゴ要素 */}
              {logoElements.map((element) => (
                <div
                  key={element.id}
                  className={`absolute cursor-move select-none ${
                    selectedElement === element.id && selectedElementType === 'logo' ? 'ring-2 ring-blue-400 ring-opacity-50' : ''
                  } ${element.isDragging ? 'z-50' : 'z-10'}`}
                  style={{
                    left: `${element.x}%`,
                    top: `${element.y}%`,
                    transform: 'translate(-50%, -50%)',
                    width: `${element.width}px`,
                    height: `${element.height}px`
                  }}
                  onMouseDown={(e) => handleMouseDown(e, element.id, 'logo')}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedElement(element.id);
                    setSelectedElementType('logo');
                  }}
                >
                  <img 
                    src={element.src} 
                    alt="Logo" 
                    className="w-full h-full object-contain" 
                    draggable={false}
                    style={{
                      filter: !element.hasBackground && element.color && element.color !== '#000000' 
                        ? getColorFilter(element.color)
                        : 'none'
                    }}
                  />
                  {selectedElement === element.id && selectedElementType === 'logo' && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"></div>
                  )}
                </div>
              ))}
              
              {/* ドラッグ可能なテキスト要素 */}
              {textElements.map((element) => (
                <div
                  key={element.id}
                  className={`absolute cursor-move select-none no-wrap-text ${
                    selectedElement === element.id ? 'ring-2 ring-blue-400 ring-opacity-50' : ''
                  } ${element.isDragging ? 'z-50' : 'z-10'} ${
                    selectedFoil === '金箔' ? 'foil-gold' :
                    selectedFoil === '銀箔' ? 'foil-silver' :
                    selectedFoil === 'スミ（黒）' ? 'foil-black' : ''
                  }`}
                  style={{
                    left: `${element.x}%`,
                    top: `${element.y}%`,
                    transform: 'translate(-50%, -50%)',
                    fontSize: `${getOptimalFontSize(element.text, element.size)}px`,
                    fontFamily: (() => {
                      switch(element.font) {
                        case '小塚ゴシック体pro_H':
                          return '"Hiragino Kaku Gothic ProN", "メイリオ", Meiryo, sans-serif';
                        case '小塚ゴシック体pro_B':
                          return '"Hiragino Kaku Gothic ProN", "メイリオ", Meiryo, sans-serif';
                        case 'DF太丸ゴシック体Std':
                          return '"Hiragino Kaku Gothic ProN", "メイリオ", Meiryo, sans-serif';
                        case '小塚明朝体pro_H':
                          return '"Hiragino Mincho ProN", "游明朝", YuMincho, serif';
                        case '小塚明朝体pro_B':
                          return '"Hiragino Mincho ProN", "游明朝", YuMincho, serif';
                        case 'DF太楷書体Std':
                          return '"Hiragino Kaku Gothic ProN", "メイリオ", Meiryo, serif';
                        case 'DF行楷書体StdW5':
                          return '"Hiragino Kaku Gothic ProN", "メイリオ", Meiryo, serif';
                        case 'DF隷書体StdW5':
                          return '"Hiragino Kaku Gothic ProN", "メイリオ", Meiryo, serif';
                        case 'DFPOP1体StdW9':
                          return '"Hiragino Kaku Gothic ProN", "メイリオ", Meiryo, sans-serif';
                        default:
                          return '"Hiragino Mincho ProN", "游明朝", YuMincho, serif';
                      }
                    })(),
                    fontWeight: (() => {
                      if (selectedFoil !== 'なし') return 'bold';
                      if (element.font.includes('pro_B') || element.font.includes('太')) return 'bold';
                      return 'normal';
                    })(),
                    color: (() => {
                      const currentPaper = papers.find(p => p.name === selectedPaper);
                      
                      if (selectedFoil === '金箔') return '#fbbf24';
                      if (selectedFoil === '銀箔') return '#d1d5db';
                      if (selectedFoil === 'スミ（黒）') return '#000000';
                      
                      // RGB値から明度を判定
                      if (currentPaper?.hex) {
                        const hex = currentPaper.hex.replace('#', '');
                        const r = parseInt(hex.substr(0, 2), 16);
                        const g = parseInt(hex.substr(2, 2), 16);
                        const b = parseInt(hex.substr(4, 2), 16);
                        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
                        return brightness < 128 ? 'white' : '#1f2937';
                      }
                      
                      return '#1f2937';
                    })(),
                    textShadow: (() => {
                      if (selectedFoil === '金箔') return '0 1px 3px rgba(0,0,0,0.3), 0 0 10px rgba(251,191,36,0.5)';
                      if (selectedFoil === '銀箔') return '0 1px 2px rgba(0,0,0,0.2), 0 0 8px rgba(209,213,219,0.4)';
                      if (selectedFoil === 'スミ（黒）') return '0 2px 4px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.1)';
                      return '0 1px 2px rgba(0,0,0,0.1)';
                    })(),
                    // 改行を防ぐスタイル
                    whiteSpace: 'nowrap',
                    overflow: 'visible',
                    lineHeight: '1.1',
                    display: 'inline-block',
                    maxWidth: 'none'
                  }}
                  onMouseDown={(e) => handleMouseDown(e, element.id, 'text')}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedElement(element.id);
                    setSelectedElementType('text');
                  }}
                >
                  {element.text}
                  {selectedElement === element.id && selectedElementType === 'text' && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"></div>
                  )}
                </div>
              ))}
              
                  {/* クリックでテキスト選択を解除 */}
                  <div 
                    className="absolute inset-0 -z-10"
                    onClick={() => {
                      setSelectedElement(null);
                      setSelectedElementType(null);
                    }}
                  />
                </div>
              </div>

              {/* 実際の紙見本表示 */}
              <div className="flex-1 ml-6">
                <h3 className="text-md font-medium text-gray-900 mb-3">実際の紙見本</h3>
                
                {selectedPaper && (
                  <div className="space-y-4">
                    {/* 紙情報 */}
                    <div className="bg-white p-4 rounded-lg border shadow-sm">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="font-medium text-lg">{selectedPaper}</div>
                        <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {papers.find(p => p.name === selectedPaper)?.brand}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        色コード: {papers.find(p => p.name === selectedPaper)?.hex}
                      </div>
                    </div>

                    {/* 実際の紙見本画像 */}
                    <div className="bg-white p-4 rounded-lg border shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-gray-700">公式紙見本</h4>
                        {papers.find(p => p.name === selectedPaper)?.isOfficial && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                            ✓ 高品質
                          </span>
                        )}
                      </div>
                      
                      {papers.find(p => p.name === selectedPaper)?.localImageUrl ? (
                        <div className="space-y-3">
                          {/* 大きな一枚表示 */}
                          <div className="flex justify-center">
                            <img
                              src={papers.find(p => p.name === selectedPaper)?.localImageUrl || ''}
                              alt={selectedPaper}
                              className="max-w-full h-auto border rounded-lg shadow-lg"
                              style={{ 
                                maxHeight: '400px',
                                minHeight: '200px',
                                objectFit: 'contain',
                                backgroundColor: '#f8f9fa'
                              }}
                            />
                          </div>
                          
                          {/* 画像情報 */}
                          <div className="text-center">
                            <div className="text-xs text-gray-500 mb-1">
                              実際の紙見本（公式サイトより取得）
                            </div>
                            <div className="text-xs text-gray-400">
                              ※実物は光の当たり方や角度により見え方が異なります
                            </div>
                          </div>
                          
                          {/* 外部リンク */}
                          {papers.find(p => p.name === selectedPaper)?.thumbnailUrl && (
                            <div className="text-center">
                              <a 
                                href={papers.find(p => p.name === selectedPaper)?.thumbnailUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:text-blue-800 underline inline-flex items-center gap-1"
                              >
                                公式サイトで詳細を見る →
                              </a>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-12 text-gray-500">
                          <div className="mb-4">画像がありません</div>
                          <div 
                            className="w-full h-32 border rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: papers.find(p => p.name === selectedPaper)?.hex || '#ffffff' }}
                          >
                            <span className="text-sm text-gray-600">カラーコードのみ</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 質感の説明 */}
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <h4 className="text-sm font-medium text-blue-900 mb-2">紙の特徴</h4>
                      <div className="text-xs text-blue-700 space-y-1">
                        <div>• 上記画像は実際の紙見本から取得</div>
                        <div>• 表紙プレビューでは質感効果を追加して表示</div>
                        <div>• 実際の印刷では光沢や質感が異なる場合があります</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
