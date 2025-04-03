/**
 * 更新前端API_URL的腳本
 * 此腳本用於將前端script.js中的Google Apps Script URL替換為本地服務器URL
 */

const fs = require('fs');
const path = require('path');

// 配置
const scriptPath = path.join(__dirname, '..', 'script.js');
const nodeServerUrl = 'http://localhost:3000';
const pythonServerUrl = 'http://localhost:5000';

// 讀取script.js文件
fs.readFile(scriptPath, 'utf8', (err, data) => {
  if (err) {
    console.error('讀取script.js文件失敗:', err);
    return;
  }

  // 保存原始URL以便恢復
  const originalUrlMatch = data.match(/const API_URL = '([^']+)';/);
  if (!originalUrlMatch) {
    console.error('無法在script.js中找到API_URL');
    return;
  }
  
  const originalUrl = originalUrlMatch[1];
  
  // 創建備份文件
  const backupPath = `${scriptPath}.backup`;
  if (!fs.existsSync(backupPath)) {
    fs.writeFileSync(backupPath, data, 'utf8');
    console.log(`已創建備份文件: ${backupPath}`);
  }

  // 詢問用戶選擇哪個服務器
  console.log('請選擇要使用的服務器:');
  console.log('1. Node.js 服務器 (http://localhost:3000)');
  console.log('2. Python 服務器 (http://localhost:5000)');
  console.log('3. 恢復原始 Google Apps Script URL');

  // 模擬用戶輸入 (在實際使用時，這裡應該使用readline或類似的模塊來獲取用戶輸入)
  const choice = process.argv[2] || '1';
  
  let newUrl;
  switch (choice) {
    case '1':
      newUrl = nodeServerUrl;
      break;
    case '2':
      newUrl = pythonServerUrl;
      break;
    case '3':
      newUrl = originalUrl;
      break;
    default:
      console.log('無效的選擇，使用Node.js服務器');
      newUrl = nodeServerUrl;
  }

  // 替換API_URL
  const updatedData = data.replace(/const API_URL = '[^']+';/, `const API_URL = '${newUrl}';`);

  // 寫入更新後的文件
  fs.writeFile(scriptPath, updatedData, 'utf8', (err) => {
    if (err) {
      console.error('更新script.js文件失敗:', err);
      return;
    }
    console.log(`已成功將API_URL更新為: ${newUrl}`);
  });
});

console.log('使用方法:');
console.log('node update_api_url.js 1  # 使用Node.js服務器');
console.log('node update_api_url.js 2  # 使用Python服務器');
console.log('node update_api_url.js 3  # 恢復原始Google Apps Script URL');