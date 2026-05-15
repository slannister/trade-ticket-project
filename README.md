# 票券交易交流站（TikSwap）

## 產品概述

輕量級的票券與收藏品交易平台，支援競標定價或以交換為導向的刊登方式。透過結構化的出售、快速交換與透明的談判紀錄，取代在社群平台上零散的私訊交易。

## 技術架構

### 後端
- **Framework**: Flask 3.0
- **ORM**: Flask-SQLAlchemy 3.1
- **認證**: Flask-JWT-Extended 4.6 + Bcrypt
- **資料庫**: SQLite（開發）/ PostgreSQL（生產）
- **API**: RESTful JSON API

### 前端
- **原生 JavaScript**（無框架）
- **模組化架構**: Utils / API Client / Modules 三層分離
- **CSS**: 原生 CSS Variables（支援深色/淺色主題）

### 專案結構

```
trade-ticket-project/
├── app.py                      # Flask 主應用工廠
├── config.py                   # 環境變數設定
├── requirements.txt           # Python 依賴
│
├── src/                        # 後端 src
│   ├── extensions.py          # Flask extensions（db, jwt, bcrypt）
│   ├── models.py               # SQLAlchemy Models（M）
│   │
│   ├── services/              # 商業邏輯層（BL）
│   │   ├── __init__.py
│   │   ├── auth_service.py    # 認證服務
│   │   ├── listing_service.py # 刊登服務
│   │   ├── inquiry_service.py # 詢問服務
│   │   └── favorite_service.py
│   │
│   ├── routes/                # 控制器層（C）
│   │   ├── __init__.py        # 路由註冊
│   │   ├── auth.py            # 認證路由
│   │   ├── listings.py        # 刊登路由
│   │   ├── inquiries.py       # 詢問路由
│   │   ├── favorites.py       # 最愛路由
│   │   └── upload.py          # 上傳路由
│   │
│   └── utils/                 # 工具函式
│       ├── responses.py        # 統一 API 響應格式
│       └── validators.py      # 輸入驗證
│
├── static/                     # 前端靜態資源
│   ├── css/
│   │   └── styles.css
│   └── js/
│       ├── app.js             # 主頁入口
│       ├── detail.js          # 詳情頁入口
│       ├── api/               # API 客戶端
│       │   ├── client.js      # Fetch wrapper
│       │   ├── auth.js
│       │   ├── listings.js
│       │   └── inquiries.js
│       ├── modules/           # 功能模組
│       │   ├── auth.js
│       │   ├── listings.js
│       │   ├── favorites.js
│       │   ├── messages.js
│       │   ├── filters.js
│       │   └── pagination.js
│       └── utils/             # 工具函式
│           ├── date.js
│           ├── dom.js
│           ├── storage.js
│           └── toast.js
│
├── templates/                  # Jinja2 模板
│   ├── index.html
│   └── detail.html
│
└── uploads/                   # 圖片上傳目錄
    └── listings/
```

## 設計模式

### MVC + Service Layer

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Routes    │ ──▶ │  Services   │ ──▶ │   Models    │
│ (Controller)│     │    (BL)     │     │     (M)     │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       │            ┌──────┴──────┐            │
       │            │             │            │
       ▼            ▼             ▼            ▼
   HTTP Request  Business    Data Access    SQLAlchemy
   Response      Logic       Operations     Models
```

### 分層職責

| 層級 | 職責 | 範例 |
|------|------|------|
| **Routes (C)** | HTTP 請求處理、引數驗證、響應格式化 | `@auth_bp.route("/login")` |
| **Services (BL)** | 商業邏輯、資料校驗、跨表操作 | `AuthService.login()` |
| **Models (M)** | 資料結構、ORM 映射、`to_dict()` 序列化 | `User.query.filter_by()` |
| **Utils** | 共用工具：響應格式、驗證器、日期處理 | `success()`, `validate_email()` |

## API 端點

### 認證 `/api/auth`
| Method | Endpoint | 說明 | Auth |
|--------|----------|------|------|
| POST | `/register` | 註冊 | - |
| POST | `/login` | 登入 | - |
| POST | `/logout` | 登出 | JWT |
| GET | `/me` | 當前用戶 | JWT |
| POST | `/password/reset` | 重設密碼 | - |

### 刊登 `/api/listings`
| Method | Endpoint | 說明 | Auth |
|--------|----------|------|------|
| GET | `` | 列表（分頁/篩選） | - |
| POST | `` | 建立刊登 | JWT |
| GET | `/<id>` | 詳情 | - |
| PUT | `/<id>` | 更新 | JWT |
| DELETE | `/id>` | 刪除 | JWT |
| GET | `/mine` | 我的刊登 | JWT |

### 詢問 `/api/inquiries`
| Method | Endpoint | 說明 | Auth |
|--------|----------|------|------|
| GET | `` | 我的訊息 | JWT |
| POST | `` | 發送詢問 | - |

### 最愛 `/api/favorites`
| Method | Endpoint | 說明 | Auth |
|--------|----------|------|------|
| GET | `` | 我的最愛 | JWT |
| POST | `/<listing_id>` | 加入最愛 | JWT |
| DELETE | `/<listing_id>` | 移除最愛 | JWT |

## 本機執行

```bash
cd trade-ticket-project
pip install -r requirements.txt
python app.py
```

瀏覽器開啟 http://localhost:5000

## 環境變數

```bash
SECRET_KEY=your-secret-key
JWT_SECRET_KEY=your-jwt-secret
DATABASE_URL=sqlite:///tikswap.db
```

## 未來增強方向

- [ ] 串接 PostgreSQL 做生產部署
- [ ] 新增郵件發送（註冊驗證、密碼重設）
- [ ] 推播通知
- [ ] 多幣別與面額比對
- [ ] 行動版 UI 優化
- [ ] 多語系（中文、英文）