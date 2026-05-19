# TikSwap - 票券交易交流站

![Python](https://img.shields.io/badge/Python-3.7+-blue.svg)
![Flask](https://img.shields.io/badge/Flask-3.0-green.svg)
![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-3.1-orange.svg)

輕量級的票券與收藏品交易平台，支援競標定價或以交換為導向的刊登方式。透過結構化的出售、快速交換與透明的談判紀錄，取代在社群平台上零散的私訊交易。

## 功能特色

- **多語系支援** - 繁體中文 / 英文一鍵切換
- **即時聊天** - 買賣雙方可直接在站內對話
- **未讀追蹤** - 訊息已讀/未讀狀態，紅色標記提醒
- **我的最愛** - 收藏感興趣的刊登
- **我的刊登** - 管理已發布的票券
- **我的訊息** - 集中管理所有買家詢問
- **刊登管理** - 可標記為已售出
- **深色/淺色主題** - 一鍵切換

## 技術架構

### 後端
- **Framework**: Flask 3.0
- **ORM**: Flask-SQLAlchemy 3.1
- **認證**: Flask-JWT-Extended 4.6 + Bcrypt
- **資料庫**: SQLite（開發）/ PostgreSQL（生產）
- **API**: RESTful JSON API

### 前端
- **原生 JavaScript**（無框架）
- **模組化架構**: Utils / API Client / Modules / i18n 四層分離
- **CSS**: 原生 CSS Variables（支援深色/淺色主題切換）
- **多語系**: i18n 模組（static/js/i18n/）

## 專案結構

```
trade-ticket-project/
├── run.py                      # 應用程式入口
├── config.py                   # 環境變數設定
├── requirements.txt           # Python 依賴
│
├── src/                        # 後端 src
│   ├── extensions.py          # Flask extensions（db, jwt, bcrypt）
│   ├── models.py               # SQLAlchemy Models
│   │
│   ├── services/              # 商業邏輯層
│   │   ├── __init__.py
│   │   ├── auth_service.py    # 認證服務
│   │   ├── listing_service.py # 刊登服務
│   │   ├── inquiry_service.py # 詢問服務
│   │   └── favorite_service.py # 最愛服務
│   │
│   ├── routes/                # 路由控制器
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
│   │   └── styles.css         # 全域樣式
│   └── js/
│       ├── app.js             # 主頁入口
│       ├── detail.js          # 詳情頁入口
│       ├── api/               # API 客戶端
│       │   ├── client.js      # Fetch wrapper
│       │   ├── auth.js
│       │   ├── listings.js
│       │   └── inquiries.js
│       ├── modules/           # 功能模組
│       │   ├── auth.js        # 登入/登出/驗證
│       │   ├── chat.js        # 即時聊天面板
│       │   ├── listings.js    # 刊登管理
│       │   ├── favorites.js   # 我的最愛
│       │   ├── messages.js   # 訊息列表
│       │   ├── filters.js    # 篩選器
│       │   └── pagination.js # 分頁
│       ├── i18n/              # 多語系
│       │   ├── index.js       # i18n 主模組
│       │   ├── en.js          # 英文翻譯
│       │   └── zh-TW.js       # 繁中翻譯
│       └── utils/             # 工具函式
│           ├── date.js
│           ├── dom.js
│           ├── storage.js
│           └── toast.js
│
├── templates/                  # Jinja2 模板
│   ├── index.html             # 主頁
│   ├── detail.html            # 詳情頁
│   ├── profile.html           # 會員資料頁
│   └── reset_password.html    # 重設密碼頁
│
├── instance/                   # 資料庫目錄
│   └── tikswap.db             # SQLite 資料庫
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
```

## API 端點

### 認證 `/api/auth`
| Method | Endpoint | 說明 | Auth |
|--------|----------|------|------|
| POST | `/register` | 註冊 | - |
| POST | `/login` | 登入 | - |
| POST | `/logout` | 登出 | JWT |
| GET | `/me` | 當前用戶 | JWT |
| PUT | `/profile` | 更新會員資料 | JWT |
| POST | `/password/reset` | 重設密碼 | - |
| POST | `/password/update` | 更新密碼 | JWT |

### 刊登 `/api/listings`
| Method | Endpoint | 說明 | Auth |
|--------|----------|------|------|
| GET | `` | 列表（分頁/篩選） | - |
| POST | `` | 建立刊登 | JWT |
| GET | `/mine` | 我的刊登 | JWT |
| GET | `/favorites` | 我的最愛 | JWT |
| GET | `/<id>` | 詳情 | - |
| PUT | `/<id>` | 更新 | JWT |
| PUT | `/<id>/status` | 更新狀態（sold/closed） | JWT |
| DELETE | `/<id>` | 刪除 | JWT |

### 詢問 `/api/inquiries`
| Method | Endpoint | 說明 | Auth |
|--------|----------|------|------|
| GET | `` | 我的訊息（所有對話） | JWT |
| POST | `` | 發送詢問 | - |
| POST | `/<id>/reply` | 回覆訊息 | JWT |
| GET | `/<id>/replies` | 取得回覆列表 | JWT |
| GET | `/unread-count` | 未讀數量 | JWT |
| PUT | `/<id>/read` | 標記為已讀 | JWT |

### 最愛 `/api/favorites`
| Method | Endpoint | 說明 | Auth |
|--------|----------|------|------|
| GET | `` | 我的最愛列表 | JWT |
| POST | `/<listing_id>` | 加入最愛 | JWT |
| DELETE | `/<listing_id>` | 移除最愛 | JWT |

### 上傳 `/api/upload`
| Method | Endpoint | 說明 | Auth |
|--------|----------|------|------|
| POST | `` | 上傳圖片 | JWT |

## 本機執行

```bash
cd trade-ticket-project
pip install -r requirements.txt
python run.py
```

瀏覽器開啟 http://localhost:5000

## 環境變數

```bash
SECRET_KEY=your-secret-key
JWT_SECRET_KEY=your-jwt-secret
DATABASE_URL=sqlite:///instance/tikswap.db
UPLOAD_FOLDER=uploads
```

## 未來增強方向

- [ ] 串接 PostgreSQL 做生產部署
- [ ] 新增郵件發送（註冊驗證、密碼重設）
- [ ] 推播通知
- [ ] 多幣別與面額比對
- [ ] 行動版 UI 優化
- [ ] 更多語系支援