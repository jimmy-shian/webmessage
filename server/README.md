# 聊天應用後端服務器

這是一個使用Node.js實現的聊天應用後端服務器，用於替代原有的Google Apps Script後端。此服務器提供相同的API端點，但使用本地JSON文件存儲數據，避免了Google Apps Script的使用限制。

## 安裝步驟

1. 確保已安裝Node.js (建議版本 14.x 或更高)
2. 在server目錄中運行以下命令安裝依賴：
   ```
   npm install
   ```

## 啟動服務器

開發模式（自動重啟）：
```
npm run dev
```

生產模式：
```
npm start
```

服務器默認運行在 http://localhost:3000

## 前端配置

需要修改前端的API_URL以指向新的後端服務器。在script.js文件中找到以下行：

```javascript
const API_URL = '';
```

將其修改為：

```javascript
const API_URL = 'http://localhost:3000';
```

## 數據存儲

所有數據都存儲在 `db/db.json` 文件中，包括：
- 頻道列表
- 消息記錄
- 管理員帳戶
- 公告內容

## 默認管理員帳戶

- 用戶名：admin
- 密碼：password
- 唯一碼：123456

## API端點

服務器實現了與原Google Apps Script相同的API端點：

### GET請求
- `/?action=getMessages&channel=channel1` - 獲取指定頻道的消息
- `/?action=getAnnouncement` - 獲取公告
- `/?action=getChannels` - 獲取頻道列表

### POST請求
- `/?action=sendMessage` - 發送消息
- `/?action=adminLogin` - 管理員登入
- `/?action=adminLogout` - 管理員登出
- `/?action=checkAdminSession` - 檢查管理員會話
- `/?action=addChannel` - 添加頻道
- `/?action=updateChannel` - 更新頻道
- `/?action=deleteChannel` - 刪除頻道
- `/?action=updateAnnouncement` - 更新公告