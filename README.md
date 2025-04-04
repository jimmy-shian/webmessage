# 聊天應用使用說明

這是一個基於HTML、JavaScript的簡易聊天應用，支援多頻道聊天、主題切換、表情符號和管理員功能。應用提供兩種後端選擇：Google Apps Script或本地服務器(Node.js/Python)。

## 功能特點

- 雙頻道聊天系統，管理員可新增更多頻道
- 每個頻道最多保留100條訊息
- 使用者自動分配唯一ID (User#XXXX)
- 三種主題顏色切換（白色、灰色、黑色）
- 頂部公告跑馬燈（管理員可編輯）
- 表情符號支援
- 管理員特權功能（編輯頻道、發布公告）
- 訊息發送頻率限制（3秒一條）

## 後端選擇

本應用提供兩種後端實現方式，您可以根據需求選擇：

### 1. Google Apps Script 版本
- 優點：設置簡單，無需本地服務器
- 缺點：有每日配額限制，高流量時可能服務中斷
- 適合：小型團隊或個人使用，快速部署

### 2. 本地服務器版本
- 優點：無使用限制，更好的性能，完全控制，易於擴展
- 缺點：需要本地服務器或雲端主機
- 提供兩種實現：
  - **Node.js版本**：適合有JavaScript經驗的開發者
  - **Python版本**：適合有Python經驗的開發者

## 設定步驟 (Google Apps Script 版本)

### 1. 建立Google Sheets

1. 造訪 [Google Sheets](https://sheets.google.com) 並建立一個新的試算表
2. 記下試算表的ID（在URL中，格式為：`https://docs.google.com/spreadsheets/d/[這裡是ID]/edit`）

### 2. 設定Google Apps Script

1. 在Google Sheets中，點擊「擴充功能」>「Apps Script」
2. 刪除編輯器中的預設程式碼，並貼上 `gas_code.js` 檔案中的全部程式碼
3. 將程式碼中的 `YOUR_SPREADSHEET_ID` 替換為你的Google Sheets ID
4. 點擊「儲存」按鈕
5. 點擊「執行」>「執行函數」>「initialize」來初始化試算表
6. 點擊「部署」>「新增部署」
7. 部署類型選擇「網路應用程式」
8. 設定以下選項：
   - 執行方式：選擇「以我的身份（你的電子郵件）」
   - 有權存取的使用者：選擇「所有人」
   - 點擊「部署」
9. 複製產生的網路應用程式URL

### 3. 配置前端程式碼

1. 開啟 `script.js` 檔案
2. 將所有 `YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL` 替換為你在上一步複製的URL
3. 儲存檔案

## 設定步驟 (本地服務器版本)

### 1. 安裝依賴

**Node.js版本：**
```
cd server
npm install
```

**Python版本：**
```
cd server
pip install -r requirements.txt
```

### 2. 啟動服務器

**Node.js版本：**
```
npm start
```
服務器將運行在 http://localhost:3000

**Python版本：**
```
python app.py
```
服務器將運行在 http://localhost:5000

### 3. 更新前端API_URL

我們提供了一個簡單的腳本來更新前端的API_URL：

```
node update_api_url.js 1  # 使用Node.js服務器
```
或
```
node update_api_url.js 2  # 使用Python服務器
```

您也可以手動修改 `script.js` 文件中的API_URL：

```javascript
// 將此行
const API_URL = 'https://script.google.com/macros/s/AKfycbyRkTVHepbhkMbyf-t0GMV-lIhes7BwgDJwBf2AYqzL_98u-jjRe90K9Z35M6FC-i3mmg/exec';

// 修改為
const API_URL = 'http://localhost:3000';  // Node.js版本
// 或
const API_URL = 'http://localhost:5000';  // Python版本
```

## 設定管理員帳號

預設的管理員帳號為：
- 使用者名稱：admin
- 密碼：password
- 唯一碼：123456

**Google Apps Script版本**：你可以直接在Google Sheets的「admin」工作表中修改或新增管理員帳號。

**本地服務器版本**：你可以修改 `server/db/db.json` 文件中的管理員信息。

## 使用說明

### 普通使用者

1. 開啟 `index.html` 檔案，系統會自動為你分配一個User#XXXX的ID
2. 在左側選擇要進入的頻道
3. 在底部輸入框中輸入訊息，按Enter鍵或點擊發送按鈕發送
4. 使用表情按鈕可以插入表情符號
5. 使用頂部的主題按鈕可以切換介面顏色

### 管理員

1. 點擊頂部右側的盾牌圖示，輸入管理員帳號、密碼和唯一碼
2. 登入成功後，你可以：
   - 點擊頻道旁的「+」按鈕新增頻道
   - 點擊頻道旁的編輯圖示修改頻道名稱
   - 點擊頂部的公告文字編輯公告內容

## 注意事項

- 每位使用者每3秒只能發送一條訊息
- 每個頻道最多保留100條最新訊息，舊訊息會自動刪除
- 使用者ID儲存在瀏覽器的本地儲存中，清除瀏覽器資料會重置ID
- 管理員狀態也儲存在本地儲存中，清除瀏覽器資料會登出管理員狀態

## 故障排除

### 常見問題

1. **無法連接到服務器**
   - 確保服務器正在運行
   - 檢查前端API_URL是否正確
   - 確保沒有防火牆阻止連接

2. **管理員登錄失敗**
   - 確認使用默認管理員帳戶或檢查管理員信息

3. **消息未顯示**
   - 檢查瀏覽器控制台是否有錯誤
   - 確認服務器日誌中是否有錯誤信息

## 進階配置

### 自定義端口

**Node.js版本：**
```
PORT=8080 npm start
```

**Python版本：**
```
PORT=8080 python app.py
```

### 部署到公共服務器

如果您想讓其他人通過互聯網訪問您的聊天應用，您需要將服務器部署到公共可訪問的服務器上，並確保更新前端API_URL指向該公共URL。

## 技術說明

- 前端：HTML, CSS, JavaScript
- 後端選項：
  - Google Apps Script + Google Sheets
  - Node.js + Express + JSON文件
  - Python + Flask + JSON文件
- 表情符號：使用emoji-toolkit庫

## 功能對比

| 功能 | Google Apps Script | 本地服務器 |
|------|-------------------|------------|
| 消息發送/接收 | ✅ | ✅ |
| 頻道管理 | ✅ | ✅ |
| 管理員功能 | ✅ | ✅ |
| 公告管理 | ✅ | ✅ |
| 數據存儲 | Google Sheets | 本地JSON文件 |
| 使用限制 | 有每日配額 | 無限制 |
| 部署難度 | 簡單 | 需要本地服務器 |

## 自訂開發

如果你想進一步自訂或擴充此應用，可以修改以下檔案：

- `index.html`：修改頁面結構
- `style.css`：修改介面樣式和主題
- `script.js`：修改前端邏輯
- `gas_code.js`：修改Google Apps Script後端邏輯
- `server.js`：修改Node.js後端邏輯
- `app.py`：修改Python後端邏輯
