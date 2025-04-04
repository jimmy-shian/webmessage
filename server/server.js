// 聊天應用後端服務器
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

// 創建數據目錄
const dbDir = path.join(__dirname, 'db');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir);
}

// 初始化數據庫
const adapter = new FileSync(path.join(dbDir, 'db.json'));
const db = low(adapter);

// 設置默認數據結構
db.defaults({
  channel1_message: [],
  channel2_message: [],
  admin: [],
  channels: [
    { id: 'channel1', name: '頻道 1' },
    { id: 'channel2', name: '頻道 2' }
  ],
  placard: [{ announcement: '歡迎使用聊天應用！' }],
  active_users: [],  // 添加活躍用戶ID列表
  user_heartbeats: {}  // 添加用戶心跳時間記錄
}).write();

// 檢查並初始化管理員賬號
if (db.get('admin').size().value() === 0) {
  db.get('admin').push({
    account: 'admin',
    password: 'password',
    uniquenum: '123456'
  }).write();
}

// 管理員會話緩存
const adminSessions = {};
// 管理員會話超時時間（30分鐘，單位：毫秒）
const ADMIN_SESSION_TIMEOUT = 30 * 60 * 1000;
// 用戶心跳超時時間（5分鐘，單位：毫秒）
const USER_HEARTBEAT_TIMEOUT = 5 * 60 * 1000;

// 創建Express應用
const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// 驗證管理員會話
function validateAdminSession(sessionId) {
  if (!sessionId || !adminSessions[sessionId]) {
    return false;
  }
  
  const session = adminSessions[sessionId];
  const currentTime = new Date().getTime();
  
  // 檢查會話是否過期
  if (currentTime > session.expireTime) {
    // 刪除過期會話
    delete adminSessions[sessionId];
    return false;
  }
  
  // 更新會話過期時間（延長會話）
  session.expireTime = currentTime + ADMIN_SESSION_TIMEOUT;
  return true;
}

// 處理GET請求
app.get('/', (req, res) => {
  const action = req.query.action;
  
  try {
    switch (action) {
      case 'getMessages':
        return getMessages(req, res);
      case 'getAnnouncement':
        return getAnnouncement(req, res);
      case 'getChannels':
        return getChannels(req, res);
      case 'checkUserId':
        return checkUserId(req, res);
      default:
        return res.json({
          success: false,
          error: '無效的操作'
        });
    }
  } catch (error) {
    return res.json({
      success: false,
      error: error.toString()
    });
  }
});

// 處理POST請求
app.post('/', (req, res) => {
  try {
    const data = req.body.data;
    const action = req.body.action;
    const sessionId = req.body.sessionId;
    
    // 需要管理員權限的操作
    const adminActions = ['addChannel', 'updateChannel', 'updateAnnouncement', 'deleteChannel'];
    
    // 檢查是否需要管理員權限
    if (adminActions.includes(action) && !validateAdminSession(sessionId)) {
      return res.json({
        success: false,
        error: '需要管理員權限或會話已過期'
      });
    }
    
    switch (action) {
      case 'sendMessage':
        return sendMessage(req, res);
      case 'adminLogin':
        return adminLogin(req, res);
      case 'adminLogout':
        return adminLogout(req, res);
      case 'checkAdminSession':
        return checkAdminSession(req, res);
      case 'addChannel':
        return addChannel(req, res);
      case 'updateChannel':
        return updateChannel(req, res);
      case 'deleteChannel':
        return deleteChannel(req, res);
      case 'updateAnnouncement':
        return updateAnnouncement(req, res);
      case 'registerUserId':
        return registerUserId(req, res);
      case 'releaseUserId':
        return releaseUserId(req, res);
      case 'userHeartbeat':
        return handleUserHeartbeat(req, res);
      default:
        return res.json({
          success: false,
          error: '無效的操作'
        });
    }
  } catch (error) {
    return res.json({
      success: false,
      error: "post解析失敗: " + error.toString()
    });
  }
});

// 獲取或創建集合
function getOrCreateCollection(collectionName) {
  // 檢查集合是否存在
  if (!db.has(collectionName).value()) {
    // 創建新集合
    db.set(collectionName, []).write();
    
    // 如果是消息集合，確保它有正確的結構
    if (collectionName.endsWith('_message')) {
      // 消息集合不需要特殊初始化，因為它們只是消息數組
    }
  }
  
  return db.get(collectionName);
}

// 發送消息
function sendMessage(req, res) {
  try {
    let messageData;
    try {
      messageData = JSON.parse(req.body.data);
    } catch (e) {
      // 如果已經是對象，不需要解析
      messageData = req.body.data;
    }
    
    const { sender, content, channel, timestamp } = messageData;
    const collectionName = `${channel}_message`;
    const collection = getOrCreateCollection(collectionName);
    
    // 添加新消息
    collection.push({
      sender,
      content,
      timestamp
    }).write();
    
    // 保留最新的100條消息
    const messages = collection.value();
    if (messages.length > 100) {
      collection.remove((_, index) => index < messages.length - 100).write();
    }
    
    return res.json({
      success: true
    });
  } catch (error) {
    return res.json({
      success: false,
      error: error.toString()
    });
  }
}

// 獲取消息
function getMessages(req, res) {
  try {
    const channel = req.query.channel;
    const collectionName = `${channel}_message`;
    const collection = getOrCreateCollection(collectionName);
    
    const messages = collection.value();
    
    return res.json({
      success: true,
      messages: messages
    });
  } catch (error) {
    return res.json({
      success: false,
      error: error.toString()
    });
  }
}

// 管理員登錄驗證
function adminLogin(req, res) {
  try {
    let loginData;
    try {
      loginData = JSON.parse(req.body.data);
    } catch (e) {
      // 如果已經是對象，不需要解析
      loginData = req.body.data;
    }
    
    const { username, password, uniquenum } = loginData;
    const admins = db.get('admin').value();
    
    // 查找匹配的管理員
    const admin = admins.find(a => 
      String(a.account) === String(username) &&
      String(a.password) === String(password) &&
      String(a.uniquenum) === String(uniquenum)
    );
    
    if (admin) {
      // 生成唯一的會話ID
      const sessionId = uuidv4();
      // 設置會話信息，包括用戶名和過期時間
      adminSessions[sessionId] = {
        username: username,
        expireTime: new Date().getTime() + ADMIN_SESSION_TIMEOUT
      };
      
      return res.json({
        success: true,
        sessionId: sessionId,
        expiresIn: ADMIN_SESSION_TIMEOUT
      });
    }
    
    // 如果没有找到匹配的管理员
    return res.json({
      success: false,
      error: '验证信息不正确'
    });
  } catch (error) {
    return res.json({
      success: false,
      error: error.toString()
    });
  }
}

// 獲取公告
function getAnnouncement(req, res) {
  try {
    const placards = db.get('placard').value();
    const announcement = placards.length > 0 ? placards[0].announcement : '';
    
    return res.json({
      success: true,
      announcement: announcement
    });
  } catch (error) {
    return res.json({
      success: false,
      error: error.toString()
    });
  }
}

// 更新公告
function updateAnnouncement(req, res) {
  try {
    let data;
    try {
      data = JSON.parse(req.body.data);
    } catch (e) {
      // 如果已經是對象，不需要解析
      data = req.body.data;
    }
    
    const { announcement } = data;
    const placards = db.get('placard');
    
    // 如果公告集合為空，添加一個新公告
    if (placards.size().value() === 0) {
      placards.push({ announcement }).write();
    } else {
      // 更新現有公告
      placards.first().assign({ announcement }).write();
    }
    
    return res.json({
      success: true
    });
  } catch (error) {
    return res.json({
      success: false,
      error: error.toString()
    });
  }
}

// 獲取頻道列表
function getChannels(req, res) {
  try {
    const channels = db.get('channels').value();
    
    return res.json({
      success: true,
      channels: channels
    });
  } catch (error) {
    console.error("獲取頻道錯誤:", error);
    return res.json({
      success: false,
      error: error.toString()
    });
  }
}

// 添加新頻道
function addChannel(req, res) {
  try {
    let channelData;
    try {
      channelData = JSON.parse(req.body.data);
    } catch (e) {
      // 如果已經是對象，不需要解析
      channelData = req.body.data;
    }
    
    const { id, name } = channelData;
    const channels = db.get('channels');
    
    // 檢查頻道ID是否已存在
    const existingChannel = channels.find({ id }).value();
    if (existingChannel) {
      return res.json({
        success: false,
        error: '頻道ID已存在'
      });
    }
    
    // 添加新頻道
    channels.push({ id, name }).write();
    
    // 創建新頻道的消息集合
    getOrCreateCollection(`${id}_message`);
    
    return res.json({
      success: true
    });
  } catch (error) {
    return res.json({
      success: false,
      error: error.toString()
    });
  }
}

// 更新頻道
function updateChannel(req, res) {
  try {
    let channelData;
    try {
      channelData = JSON.parse(req.body.data);
    } catch (e) {
      // 如果已經是對象，不需要解析
      channelData = req.body.data;
    }
    
    const { id, name } = channelData;
    const channels = db.get('channels');
    
    // 查找頻道
    const channel = channels.find({ id }).value();
    if (!channel) {
      return res.json({
        success: false,
        error: '頻道不存在'
      });
    }
    
    // 更新頻道名稱
    channels.find({ id }).assign({ name }).write();
    
    return res.json({
      success: true
    });
  } catch (error) {
    return res.json({
      success: false,
      error: error.toString()
    });
  }
}

// 刪除頻道
function deleteChannel(req, res) {
  try {
    let channelData;
    try {
      channelData = JSON.parse(req.body.data);
    } catch (e) {
      // 如果已經是對象，不需要解析
      channelData = req.body.data;
    }
    
    const { id } = channelData;
    
    // 不允許刪除預設頻道
    if (id === 'channel1' || id === 'channel2') {
      return res.json({
        success: false,
        error: '不能刪除預設頻道'
      });
    }
    
    const channels = db.get('channels');
    
    // 查找頻道
    const channel = channels.find({ id }).value();
    if (!channel) {
      return res.json({
        success: false,
        error: '頻道不存在'
      });
    }
    
    // 刪除頻道
    channels.remove({ id }).write();
    
    // 刪除對應的消息集合
    db.unset(`${id}_message`).write();
    
    return res.json({
      success: true
    });
  } catch (error) {
    return res.json({
      success: false,
      error: error.toString()
    });
  }
}

// 管理員登出
function adminLogout(req, res) {
  const sessionId = req.body.sessionId;
  if (sessionId && adminSessions[sessionId]) {
    delete adminSessions[sessionId];
  }
  
  return res.json({
    success: true
  });
}

// 檢查管理員會話狀態
function checkAdminSession(req, res) {
  const sessionId = req.body.sessionId;
  const isValid = validateAdminSession(sessionId);
  
  return res.json({
    success: true,
    isValid: isValid,
    expiresIn: isValid ? (adminSessions[sessionId].expireTime - new Date().getTime()) : 0
  });
}

// 檢查用戶ID是否存在
function checkUserId(req, res) {
  try {
    const userId = req.query.userId;
    
    if (!userId) {
      return res.json({
        success: false,
        error: '用戶ID不能為空'
      });
    }
    
    const activeUsers = db.get('active_users').value();
    
    // 檢查ID是否已經存在
    const exists = activeUsers.includes(userId);
    
    return res.json({
      success: true,
      exists: exists
    });
  } catch (error) {
    return res.json({
      success: false,
      error: error.toString()
    });
  }
}

// 註冊用戶ID
function registerUserId(req, res) {
  try {
    let userData;
    try {
      userData = JSON.parse(req.body.data);
    } catch (e) {
      // 如果已經是對象，不需要解析
      userData = req.body.data;
    }
    
    const userId = userData.userId;
    const timestamp = userData.timestamp || new Date().toISOString();
    
    if (!userId) {
      return res.json({
        success: false,
        error: '用戶ID不能為空'
      });
    }
    
    const activeUsers = db.get('active_users');
    
    // 檢查ID是否已經存在
    if (activeUsers.value().includes(userId)) {
      return res.json({
        success: false,
        error: '用戶ID已存在',
        exists: true
      });
    }
    
    // 添加新用戶ID
    activeUsers.push(userId).write();
    
    // 記錄用戶心跳時間
    const userHeartbeats = db.get('user_heartbeats').value() || {};
    userHeartbeats[userId] = timestamp;
    db.set('user_heartbeats', userHeartbeats).write();
    
    return res.json({
      success: true,
      exists: false
    });
  } catch (error) {
    return res.json({
      success: false,
      error: error.toString()
    });
  }
}

// 釋放用戶ID
function releaseUserId(req, res) {
  try {
    let userData;
    try {
      userData = JSON.parse(req.body.data);
    } catch (e) {
      // 如果已經是對象，不需要解析
      userData = req.body.data;
    }
    
    const userId = userData.userId;
    
    if (!userId) {
      return res.json({
        success: false,
        error: '用戶ID不能為空'
      });
    }
    
    const activeUsers = db.get('active_users');
    
    // 從活躍用戶列表中移除
    activeUsers.remove(id => id === userId).write();
    
    return res.json({
      success: true
    });
  } catch (error) {
    return res.json({
      success: false,
      error: error.toString()
    });
  }
}

// 定期清理過期用戶ID
function cleanupExpiredUsers() {
  try {
    const userHeartbeats = db.get('user_heartbeats').value() || {};
    const activeUsers = db.get('active_users');
    const currentTime = new Date().getTime();
    let cleaned = 0;
    
    // 檢查每個活躍用戶的最後心跳時間
    activeUsers.value().forEach(userId => {
      const lastHeartbeat = userHeartbeats[userId] ? new Date(userHeartbeats[userId]).getTime() : 0;
      
      // 如果用戶超過5分鐘沒有心跳，則移除
      if (currentTime - lastHeartbeat > USER_HEARTBEAT_TIMEOUT) {
        activeUsers.remove(id => id === userId).write();
        delete userHeartbeats[userId];
        cleaned++;
      }
    });
    
    // 更新心跳記錄
    db.set('user_heartbeats', userHeartbeats).write();
    
    if (cleaned > 0) {
      console.log(`已清理 ${cleaned} 個過期用戶ID`);
    }
  } catch (error) {
    console.error('清理過期用戶ID錯誤:', error);
  }
}

// 處理用戶心跳
function handleUserHeartbeat(req, res) {
  try {
    let userData;
    try {
      userData = JSON.parse(req.body.data);
    } catch (e) {
      // 如果已經是對象，不需要解析
      userData = req.body.data;
    }
    
    const userId = userData.userId;
    const timestamp = userData.timestamp || new Date().toISOString();
    
    if (!userId) {
      return res.json({
        success: false,
        error: '用戶ID不能為空'
      });
    }
    
    // 更新用戶心跳時間
    const userHeartbeats = db.get('user_heartbeats').value() || {};
    userHeartbeats[userId] = timestamp;
    db.set('user_heartbeats', userHeartbeats).write();
    
    // 確保用戶在活躍列表中
    const activeUsers = db.get('active_users');
    if (!activeUsers.value().includes(userId)) {
      activeUsers.push(userId).write();
    }
    
    return res.json({
      success: true
    });
  } catch (error) {
    return res.json({
      success: false,
      error: error.toString()
    });
  }
}

// 啟動服務器
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`服務器運行在 http://localhost:${PORT}`);
  console.log('請將前端API_URL更新為此地址');
  
  // 設置定期清理過期用戶ID的任務（每分鐘檢查一次）
  setInterval(cleanupExpiredUsers, 60 * 1000);
});