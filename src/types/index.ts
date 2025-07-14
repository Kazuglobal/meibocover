// 用紙タイプ
export type PaperType = 
  | 'レザック66_白'
  | 'レザック66_クリーム'
  | 'レザック66_うぐいす'
  | 'レザック66_あじさい'
  | 'レザック75_白'
  | 'レザック75_クリーム'
  | 'プレスコート_白'
  | 'プレスコート_クリーム';

// 書体タイプ
export type FontType = 
  | 'ゴシック体'
  | '明朝体'
  | '楷書体'
  | '行書体'
  | '隷書体'
  | '草書体'
  | '篆書体'
  | 'POP体'
  | '毛筆体';

// 箔押しタイプ
export type FoilType = 'none' | 'gold' | 'silver';

// プロジェクトステータス
export type ProjectStatus = 'draft' | 'submitted' | 'in_review' | 'approved' | 'in_production' | 'completed';

// アクセスレベル
export type AccessLevel = 'customer' | 'sales' | 'production' | 'none';

// デザインデータ
export interface DesignData {
  id?: string;
  projectId: string;
  paperType: PaperType;
  titleText: string;
  titleFont: FontType;
  schoolLogoUrl?: string;
  foilType: FoilType;
  previewUrl?: string;
  isDraft: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// プロジェクトデータ
export interface ProjectData {
  id: string;
  customerId: string;
  schoolName: string;
  contactName: string;
  email: string;
  year: number;
  status: ProjectStatus;
  customerUrl: string;
  salesUrl: string;
  productionUrl: string;
  createdAt: string;
  updatedAt: string;
}

// 顧客データ
export interface CustomerData {
  id: string;
  schoolName: string;
  contactName: string;
  email: string;
  phone?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

// プロジェクトURL情報
export interface ProjectUrls {
  customer: string;
  sales: string;
  production: string;
}

// API レスポンス型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
} 