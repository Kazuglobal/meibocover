-- 名簿表紙デザインシステム データベース初期化

-- UUID生成に必要な拡張機能
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 顧客テーブル
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- デザインプロジェクトテーブル
CREATE TABLE design_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id),
    year INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'draft',
    customer_url VARCHAR(255) UNIQUE,
    sales_url VARCHAR(255) UNIQUE,
    production_url VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 表紙デザインテーブル
CREATE TABLE cover_designs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES design_projects(id),
    paper_type VARCHAR(100),
    title_text VARCHAR(500),
    title_font VARCHAR(100),
    school_logo_url VARCHAR(500),
    foil_type VARCHAR(20),
    preview_url VARCHAR(500),
    is_draft BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 原稿アップロードテーブル
CREATE TABLE manuscripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES design_projects(id),
    type VARCHAR(50), -- 'front_endpaper', 'pictorial_1-8', 'greeting'
    file_url VARCHAR(500),
    file_name VARCHAR(255),
    file_type VARCHAR(50),
    ocr_text TEXT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 進捗履歴テーブル
CREATE TABLE progress_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES design_projects(id),
    status VARCHAR(50),
    changed_by VARCHAR(50), -- 'customer', 'sales', 'production'
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- インデックス作成
CREATE INDEX idx_customers_school_name ON customers(school_name);
CREATE INDEX idx_projects_status ON design_projects(status);
CREATE INDEX idx_projects_year ON design_projects(year); 