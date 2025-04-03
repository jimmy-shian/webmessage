# 聊天應用後端服務器遷移指南

本指南將幫助您將聊天應用從Google Apps Script後端遷移到本地服務器，以避免Google Apps Script的使用限制。我們提供了兩種實現方式：Node.js和Python。

## 為什麼要遷移？

- **避免使用限制**：Google Apps Script有每日配額限制，可能導致高流量時服務中斷
- **更好的性能**：本地服務器通常提供更快的響應時間
- **完全控制**：您可以完全控制數據存儲和服務器配置
- **擴展性**：更容易添加新功能和擴展應用

## 選擇實現方式

### Node.js 版本
- 適合有JavaScript經驗的開發者
- 使用Express框架和LowDB進行數據存儲
- 詳細說明請參閱 [README.md](./README.md)

### Python 版本
- 適合有Python經驗的開發者
- 使用Flask框架和JSON文件進行數據存儲
- 詳細說明請參閱 [README_PYTHON.md](./README_PYTHON.md)

## 快速開始

### 安裝依賴

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

### 啟動服務器

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

### 更新前端API_URL

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

## 數據存儲

兩個版本都使用本地JSON文件存儲數據，位於 `server/db/db.json`。這個文件包含：

- 頻道列表
- 消息記錄
- 管理員帳戶
- 公告內容

## 默認管理員帳戶

- 用戶名：admin
- 密碼：password
- 唯一碼：123456

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

## 故障排除

### 常見問題

1. **無法連接到服務器**
   - 確保服務器正在運行
   - 檢查前端API_URL是否正確
   - 確保沒有防火牆阻止連接

2. **管理員登錄失敗**
   - 確認使用默認管理員帳戶或檢查db.json中的管理員信息

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