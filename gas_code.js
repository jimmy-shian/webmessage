// Google Apps Script代碼
// 將此代碼複製到Google Apps Script編輯器中

// 設置Google Sheets ID
const SPREADSHEET_ID = ''; // 替換為你的Google Sheets ID

// 管理員會話緩存
const adminSessions = {};
// 管理員會話超時時間（30分鐘，單位：毫秒）
const ADMIN_SESSION_TIMEOUT = 30 * 60 * 1000;

// 處理來自Web應用的請求
function doGet(e) {
  const action = e.parameter.action;
  
  try {
    switch (action) {
      case 'getMessages':
        return getMessages(e.parameter.channel);
      case 'getAnnouncement':
        return getAnnouncement();
      case 'getChannels':
        return getChannels();
      case 'checkUserId':
        return checkUserId(e.parameter.userId);
      default:
        return ContentService.createTextOutput(JSON.stringify({
          success: false,
          error: '無效的操作'
        })).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

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

// 處理POST請求
function doPost(e) {
  try {
    const data = e.parameter.data;
    const action = e.parameter.action;
    const sessionId = e.parameter.sessionId;
    
    // 需要管理員權限的操作
    const adminActions = ['addChannel', 'updateChannel', 'updateAnnouncement', 'deleteChannel'];
    
    // 檢查是否需要管理員權限
    if (adminActions.includes(action) && !validateAdminSession(sessionId)) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: '需要管理員權限或會話已過期'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    switch (action) {
      case 'sendMessage':
        return sendMessage(data);
      case 'adminLogin':
        return adminLogin(data);
      case 'adminLogout':
        return adminLogout(sessionId);
      case 'checkAdminSession':
        return checkAdminSession(sessionId);
      case 'addChannel':
        return addChannel(data);
      case 'updateChannel':
        return updateChannel(data);
      case 'deleteChannel':
        return deleteChannel(data);
      case 'updateAnnouncement':
        return updateAnnouncement(data);
      case 'registerUserId':
        return registerUserId(data);
      case 'releaseUserId':
        return releaseUserId(data);
      default:
        return ContentService.createTextOutput(JSON.stringify({
          success: false,
          error: '無效的操作'
        })).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: "post解析失敗"
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// 獲取電子表格和工作表
function getSpreadsheet() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function getOrCreateSheet(sheetName) {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    
    // 根據工作表類型設置標題行
    if (sheetName === 'channel1_message' || sheetName === 'channel2_message') {
      sheet.appendRow(['sender', 'content', 'timestamp']);
    } else if (sheetName === 'admin') {
      sheet.appendRow(['account', 'password', 'uniquenum']);
    } else if (sheetName === 'channels') {
      sheet.appendRow(['id', 'name']);
      // 添加默認頻道
      sheet.appendRow(['channel1', '頻道 1']);
      sheet.appendRow(['channel2', '頻道 2']);
    } else if (sheetName === 'placard') {
      sheet.appendRow(['announcement']);
      sheet.appendRow(['歡迎使用聊天應用！']); // 默認公告
    }
  }
  
  return sheet;
}

// 發送消息
function sendMessage(messageData) {
  // messageData = '{"sender":"User#4581","content":"qqqq","channel":"channel1","timestamp":"2025-04-02T13:43:57.253Z"}';
  try {
    messageData = JSON.parse(messageData);
    const { sender, content, channel, timestamp } = messageData;
    const sheetName = `${channel}_message`;
    const sheet = getOrCreateSheet(sheetName);
    
    // 添加新消息
    sheet.appendRow([sender, content, timestamp]);
    
    // 保留最新的100條消息
    const numRows = sheet.getLastRow();
    if (numRows > 101) { // 標題行 + 100條消息
      sheet.deleteRows(2, numRows - 101);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// 獲取消息
function getMessages(channel) {
  try {
    const sheetName = `${channel}_message`;
    const sheet = getOrCreateSheet(sheetName);
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const messages = [];
    
    // 从第二行开始（跳过标题行）
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const message = {};
      
      // 将每一列映射到相應的字段
      for (let j = 0; j < headers.length; j++) {
        message[headers[j]] = row[j];
      }
      
      messages.push(message);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      messages: messages
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// 管理員登錄驗證
function adminLogin(loginData) {
  try {
    loginData = JSON.parse(loginData);
    const { username, password, uniquenum } = loginData;
    const sheet = getOrCreateSheet('admin');
    
    const data = sheet.getDataRange().getValues();
    
    // 从第二行开始（跳过标题行）
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const account = row[0];
      const storedPassword = row[1];
      const storedUniquenum = row[2];

      if ( 
        String(account) === String(username) &&
        String(storedPassword) === String(password) &&
        String(storedUniquenum) === String(uniquenum)) {
          // 生成唯一的會話ID
          const sessionId = Utilities.getUuid();
          // 設置會話信息，包括用戶名和過期時間
          adminSessions[sessionId] = {
            username: username,
            expireTime: new Date().getTime() + ADMIN_SESSION_TIMEOUT
          };
          
          return ContentService.createTextOutput(JSON.stringify({
            success: true,
            sessionId: sessionId,
            expiresIn: ADMIN_SESSION_TIMEOUT
          })).setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    // 如果没有找到匹配的管理员
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: '验证信息不正确'
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// 獲取公告
function getAnnouncement() {
  try {
    const sheet = getOrCreateSheet('placard');
    const data = sheet.getDataRange().getValues();
    
    // 獲取最新的公告（第二行，第一列）
    const announcement = data.length > 1 ? data[1][0] : '';
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      announcement: announcement
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// 更新公告
function updateAnnouncement(data) {
  try {
    data = JSON.parse(data);
    const { announcement } = data;
    const sheet = getOrCreateSheet('placard');
    
    // 如果只有標題行，添加一行
    if (sheet.getLastRow() === 1) {
      sheet.appendRow([announcement]);
    } else {
      // 更新第二行的公告
      sheet.getRange(2, 1).setValue(announcement);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// 獲取頻道列表
function getChannels() {
  try {
    const sheet = getOrCreateSheet('channels');
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const channels = [];
    
    // 从第二行开始（跳过标题行）
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const channel = {};
      
      // 将每一列映射到相應的字段
      for (let j = 0; j < headers.length; j++) {
        channel[headers[j]] = row[j];
      }
      
      channels.push(channel);
    }
    Logger.log("channels: " + JSON.stringify(channels));
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      channels: channels
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    Logger.log("error.toString(): " + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// 添加新頻道
function addChannel(channelData) {
  
  try {
    channelData = JSON.parse(channelData);
    const { id, name } = channelData;
    const sheet = getOrCreateSheet('channels');
    
    // 檢查頻道ID是否已存在
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === id) {
        return ContentService.createTextOutput(JSON.stringify({
          success: false,
          error: '頻道ID已存在'
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    // 添加新頻道
    sheet.appendRow([id, name]);
    
    // 創建新頻道的消息工作表
    getOrCreateSheet(`${id}_message`);
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// 更新頻道
function updateChannel(channelData) {
  try {
    channelData = JSON.parse(channelData);
    const { id, name } = channelData;
    const sheet = getOrCreateSheet('channels');
    
    const data = sheet.getDataRange().getValues();
    let rowIndex = -1;
    
    // 查找頻道ID所在的行
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === id) {
        rowIndex = i + 1; // +1 因為getRange是從1開始的
        break;
      }
    }
    
    if (rowIndex === -1) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: '頻道不存在'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // 更新頻道名稱
    sheet.getRange(rowIndex, 2).setValue(name);
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// 刪除頻道
function deleteChannel(channelData) {
  try {
    channelData = JSON.parse(channelData);
    const { id } = channelData;
    const sheet = getOrCreateSheet('channels');
    
    // 不允許刪除預設頻道
    if (id === 'channel1' || id === 'channel2') {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: '不能刪除預設頻道'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    const data = sheet.getDataRange().getValues();
    let rowIndex = -1;
    
    // 查找頻道ID所在的行
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === id) {
        rowIndex = i + 1; // +1 因為getRange是從1開始的
        break;
      }
    }
    
    if (rowIndex === -1) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: '頻道不存在'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // 刪除頻道行
    sheet.deleteRow(rowIndex);
    
    // 嘗試刪除對應的消息工作表
    try {
      const ss = getSpreadsheet();
      const messageSheet = ss.getSheetByName(`${id}_message`);
      if (messageSheet) {
        ss.deleteSheet(messageSheet);
      }
    } catch (e) {
      // 忽略刪除工作表時的錯誤
      Logger.log('刪除頻道工作表錯誤: ' + e.toString());
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// 管理員登出
function adminLogout(sessionId) {
  if (sessionId && adminSessions[sessionId]) {
    delete adminSessions[sessionId];
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    success: true
  })).setMimeType(ContentService.MimeType.JSON);
}

// 檢查管理員會話狀態
function checkAdminSession(sessionId) {
  const isValid = validateAdminSession(sessionId);
  
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    isValid: isValid,
    expiresIn: isValid ? (adminSessions[sessionId].expireTime - new Date().getTime()) : 0
  })).setMimeType(ContentService.MimeType.JSON);
}

// 檢查用戶ID是否存在
function checkUserId(userId) {
  try {
    if (!userId) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: '用戶ID不能為空'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // 獲取或創建活躍用戶工作表
    const sheet = getOrCreateSheet('active_users');
    const data = sheet.getDataRange().getValues();
    
    // 檢查ID是否已經存在
    let exists = false;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === userId) {
        exists = true;
        break;
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      exists: exists
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// 註冊用戶ID
function registerUserId(data) {
  try {
    data = JSON.parse(data);
    const userId = data.userId;
    
    if (!userId) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: '用戶ID不能為空'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // 獲取或創建活躍用戶工作表
    const sheet = getOrCreateSheet('active_users');
    const existingData = sheet.getDataRange().getValues();
    
    // 檢查ID是否已經存在
    for (let i = 1; i < existingData.length; i++) {
      if (existingData[i][0] === userId) {
        return ContentService.createTextOutput(JSON.stringify({
          success: false,
          error: '用戶ID已存在',
          exists: true
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    // 添加新用戶ID
    sheet.appendRow([userId]);
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      exists: false
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// 釋放用戶ID
function releaseUserId(data) {
  try {
    data = JSON.parse(data);
    const userId = data.userId;
    
    if (!userId) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: '用戶ID不能為空'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // 獲取活躍用戶工作表
    const sheet = getOrCreateSheet('active_users');
    const existingData = sheet.getDataRange().getValues();
    
    // 查找用戶ID所在的行
    let rowIndex = -1;
    for (let i = 1; i < existingData.length; i++) {
      if (existingData[i][0] === userId) {
        rowIndex = i + 1; // +1 因為getRange是從1開始的
        break;
      }
    }
    
    // 如果找到了用戶ID，刪除該行
    if (rowIndex !== -1) {
      sheet.deleteRow(rowIndex);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// 設置Web應用部署URL
function getScriptUrl() {
  return ScriptApp.getService().getUrl();
}

// 初始化函數，可以用來設置初始數據
function initialize() {
  // 創建必要的工作表
  getOrCreateSheet('channel1_message');
  getOrCreateSheet('channel2_message');
  getOrCreateSheet('admin');
  getOrCreateSheet('channels');
  getOrCreateSheet('placard');
  getOrCreateSheet('active_users'); // 添加活躍用戶工作表
  
  // 如果admin工作表為空，添加一個默認管理員
  const adminSheet = getOrCreateSheet('admin');
  if (adminSheet.getLastRow() === 1) {
    adminSheet.appendRow(['admin', 'password', '123456']); // 默認管理員賬號
  }
  
  return '初始化完成';
}