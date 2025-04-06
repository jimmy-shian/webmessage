// 全局变量
const API_URL = "http://ouo.freeserver.tw:24068";
// const API_URL = "http://127.0.0.1:5000";
let currentUser = null;
let currentChannel = 'channel1';
let isAdmin;
let adminSessionId;
let adminSessionCheckTimer;
let lastMessageTime = 0;
let channels = [
    { id: 'channel1', name: '頻道 1' },
    { id: 'channel2', name: '頻道 2' }
];
let isThemeMenuOpen = false;

// 用於取消請求的控制器
let currentMessageController = null;

// 用於檢查滾動是否在底部的變量
let isUserAtBottom = true;

// 重試計數器
let messageRetryCount = 0;
let announcementRetryCount = 0;
const MAX_RETRY_COUNT = 5;

// 常用表情符號列表
const commonEmojis = {
    // 常用表情符號
    "common": [
        '😀', '😁', '😂', '🤣', '😃', '😄', '😅', '😆',
        '😉', '😊', '😋', '😎', '😍', '😘', '🥰', '😗',
        '😙', '😚', '🙂', '🤗', '🤔', '🤨', '😐', '😑',
        '😶', '🙄', '😏', '😣', '😥', '😮', '🤐', '😯',
        '😪', '😫', '😴', '😌', '😛', '😜', '😝', '🤤',
        '😒', '😓', '😔', '😕', '🙃', '🤑', '😲', '☹️',
        '🙁', '😖', '😞', '😟', '😤', '😢', '😭', '😦',
        '😧', '😨', '😩', '🤯', '😬', '😰', '😱', '🥵',
        '🥶', '😳', '🤪', '😵', '😡', '😠', '🤬', '😷',
        '🤒', '🤕', '🤢', '🤮', '🤧', '😇', '🥳', '🥴',
        '🥺', '🤠', '🤡', '🤥', '🤫', '🤭', '🧐', '🤓',
        '😈', '👿', '👹', '👺', '💀', '👻', '👽', '💩'
    ],
  
    // 手勢 & 讚
    "gestures": [
        '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏',
        '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆',
        '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛',
        '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️',
        '💅', '🤳', '💪', '👂', '👃', '👀', '👁️', '👄',
        '👅', '💋'
    ],
  
    // 愛心 & 表達情感
    "hearts": [
        '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍',
        '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖',
        '💘', '💝', '💟', '💌', '💤', '💢', '💣', '💥',
        '💦', '💨', '💫', '💬', '🗯️', '💭', '🔥', '✨'
    ],
  
    // 火焰 & 物品
    "objects": [
      "🔥", "✨", "💫", "🌟", "⚡", "☀️", "🌙", "⭐",
      "🎉", "🎊", "🎈", "🎂", "🎁", "🍕", "🍔", "🍟",
      "🥤", "🍺", "🍷", "☕", "🍵", "🍎", "🍊", "🍉"
    ],
  
    // 交通工具 & 旅行
    "travel": [
      '🏠', '🏡', '🏢', '🏣', '🏤', '🏥', '🏦', '🏨',
      '🏩', '🏪', '🏫', '🏬', '🏭', '🏯', '🏰', '💒',
      '🗼', '🗽', '⛪', '🕌', '🕍', '⛩️', '🕋', '⛲',
      '⛺', '🌁', '🌃', '🌄', '🌅', '🌆', '🌇', '🌉',
      '🌌', '🎠', '🎡', '🎢', '🚂', '🚃', '🚄', '🚅',
      '🚆', '🚇', '🚈', '🚉', '🚊', '🚝', '🚞', '🚋',
      '🚌', '🚍', '🚎', '🚐', '🚑', '🚒', '🚓', '🚔',
      '🚕', '🚖', '🚗', '🚘', '🚙', '🚚', '🚛', '🚜',
      '🛴', '🚲', '🛵', '🏍️', '⛵', '🚤', '🛳️', '⛴️',
      '🚢', '✈️', '🛩️', '🛫', '🛬', '🚁', '🚀'
    ],
  
    // 動物
    "animals": [
      "🐶", "🐱", "🐭", "🐹", "🐰", "🐻", "🐼", "🐨",
      "🐯", "🦁", "🐮", "🐷", '🐽', "🐸", "🐵", "🦊",
      "🐺", "🐗", "🐴", "🦄", "🐔", "🐧", "🐦", "🐤", 
      "🐣", "🦉", "🦇", "🐍", "🦕", "🦖", "🐙", "🦑", 
      "🦀", "🦞", "🐡", "🐬", "🐳", "🐟", '🐥', '🦆', 
      '🦅', , '🐝', '🐛', '🦋', '🐌', '🐞', '🐜'
    ],
  
    // 植物和自然
    "nature": [
        '🌵', '🎄', '🌲', '🌳', '🌴', '🌱', '🌿', '☘️',
        '🍀', '🍁', '🍂', '🍃', '🌺', '🌸', '🌼', '🌻',
        '🌞', '🌝', '🌛', '🌜', '🌚', '🌕', '🌖', '🌗',
        '🌘', '🌑', '🌒', '🌓', '🌔', '🌙', '🌎', '🌍',
        '🌏', '💫', '⭐', '🌟', '✨', '⚡', '☄️', '💥',
        '🔥', '🌈', '☀️', '🌤️', '⛅', '🌥️', '☁️', '🌦️',
        '🌧️', '⛈️', '🌩️', '🌨️', '❄️', '☃️', '⛄', '💧',
        '💦', '☔', '🌊'
    ],

    // 運動 & 活動
    "sports": [
        '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉',
        '🎱', '🏓', '🏸', '🏒', '🏑', '🏏', '🥅', '⛳',
        '🏹', '🎣', '🥊', '🥋', '🎽', '🛹', '⛸️', '🎿',
        '⛷️', '🏂', '🏋️‍♀️', '🏋️‍♂️', '🤼‍♀️', '🤼‍♂️', '🤸‍♀️', '🤸‍♂️',
        '⛹️‍♀️', '⛹️‍♂️', '🤺', '🤾‍♀️', '🤾‍♂️', '🏌️‍♀️', '🏌️‍♂️', '🏇',
        '🧘‍♀️', '🧘‍♂️', '🏄‍♀️', '🏄‍♂️', '🏊‍♀️', '🏊‍♂️', '🤽‍♀️', '🤽‍♂️',
        '🚣‍♀️', '🚣‍♂️', '🧗‍♀️', '🧗‍♂️', '🚵‍♀️', '🚵‍♂️', '🚴‍♀️', '🚴‍♂️',
        '🏆', '🥇', '🥈', '🥉', '🏅', '🎖️', '🏵️', '🎪',
        '🎭', '🎨', '🎬', '🎤', '🎧', '🎼', '🎹', '🥁',
        '🎷', '🎺', '🎸', '🎻', '🎲', '🎯', '🎳', '🎮'
    ],
  
// 食物和飲料
    "foods": [
        '🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇',
        '🍓', '🍈', '🍒', '🍑', '🍍', '🥝', '🍅', '🥑',
        '🥦', '🥬', '🥒', '🌶️', '🌽', '🥕', '🧄', '🧅',
        '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀',
        '🥚', '🍳', '🧈', '🥞', '🥓', '🥩', '🍗', '🍖',
        '🌭', '🍔', '🍟', '🍕', '🥪', '🌮', '🌯', '🥗',
        '🥘', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟',
        '🍤', '🍙', '🍚', '🍘', '🍥', '🥠', '🍢', '🍡',
        '🍧', '🍨', '🍦', '🍰', '🎂', '🧁', '🥧', '🍮',
        '🍭', '🍬', '🍫', '🍿', '🍩', '🍪', '🥛', '☕',
        '🍵', '🍶', '🍺', '🍻', '🥂', '🍷', '🥃', '🍸',
        '🍹', '🍾', '🧊', '🥄', '🍴', '🍽️'
    ],

    // 物品和符號
    "objectEmojis": [
        '⌚', '📱', '📲', '💻', '⌨️', '🖥️', '🖨️', '🖱️',
        '📷', '📸', '📹', '🎥', '📽️', '🎞️', '📞', '☎️',
        '📟', '📠', '📺', '📻', '🎙️', '🎚️', '🎛️', '⏱️',
        '⏲️', '⏰', '🕰️', '⌛', '⏳', '📡', '🔋', '🔌',
        '💡', '🔦', '🕯️', '💸', '💵', '💴', '💶', '💷',
        '💰', '💳', '💎', '⚖️', '🔧', '🔨', '⚒️', '🛠️',
        '⛏️', '🔩', '⚙️', '⛓️', '🔫', '💣', '🔪', '🗡️',
        '⚔️', '🛡️', '🚬', '⚰️', '⚱️', '🏺', '🔮', '📿',
        '💈', '⚗️', '🔭', '🔬', '🕳️', '💊', '💉', '🩸',
        '🩹', '🩺', '🚽', '🚰', '🚿', '🛁', '🛀', '🧼',
        '🧽', '🧴', '👓', '🕶️', '👔', '👕', '👖', '🧣',
        '🧤', '🧥', '🧦', '👗', '👘', '👙', '👚', '👛',
        '👜', '👝', '🎒', '👞', '👟', '🥾', '🥿', '👠',
        '👡', '👢', '👑', '👒', '🎩', '🎓', '🧢', '⛑️',
        '📿', '💄', '💍', '💎'
    ],
    // 旗幟（台灣及周圍國家）
    "flags": [
        '🇹🇼', // 台灣
        '🇨🇳', // 中國
        '🇭🇰', // 香港
        '🇲🇴', // 澳門
        '🇯🇵', // 日本
        '🇰🇷', // 韓國
        '🇵🇭', // 菲律賓
        '🇻🇳', // 越南
        '🇲🇾', // 馬來西亞
        '🇸🇬', // 新加坡
        '🇮🇩', // 印尼
        '🇹🇭', // 泰國
        '🇺🇸', // 美國
        '🇬🇧', // 英國
        '🇫🇷', // 法國
        '🇩🇪', // 德國
        '🇮🇹', // 義大利
        '🇨🇦', // 加拿大
        '🇦🇺', // 澳洲
        '🇳🇿', // 紐西蘭
        '🇮🇳', // 印度
        '🇷🇺', // 俄羅斯
        '🇧🇷'  // 巴西
    ]

  };  

// 初始化應用
document.addEventListener('DOMContentLoaded', () => {
    initUser();
    setupEventListeners();
    
    // 創建懸浮通知容器
    createNotificationContainer();
    
    setupEmojiPicker();
    setupChannelToggle();
    
    loadMessages();
    loadAnnouncement();
    loadChannels();

    getOnlineUsersCount();
    sendHeartbeat();

    // 建立 SSE 連接
    const eventSource = new EventSource(`${API_URL}/events`);

    // eventSource.onmessage = function(event) {
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.messages && data.active_users) {
        updateMessages(data.messages, data.active_users);
      }
      if (data.channels) {
        // updateChannels(data.channels);
        channels = data.channels;
        updateChannelList();
      }
      if (data.announcement) {
        // updateAnnouncement(data.announcement);
        document.getElementById('announcement').textContent = data.announcement;
      }
    };
    
    // 添加用戶活動心跳，每5分鐘發送一次
    window.heartbeatInterval = setInterval(sendHeartbeat, 60000); // 每30秒發送一次心跳
});

// 設置頻道列表收合功能
function setupChannelToggle() {
    const toggleButton = document.getElementById('toggle-channels');
    const channelsContainer = document.querySelector('.channels');
    
    // 在手機模式下默認收起頻道列表
    if (window.innerWidth <= 576) {
        channelsContainer.classList.add('collapsed');
        toggleButton.classList.add('collapsed');
    }
    
    toggleButton.addEventListener('click', (event) => {
        channelsContainer.classList.toggle('collapsed');
        toggleButton.classList.toggle('collapsed');
        // 阻止事件冒泡，避免觸發document的點擊事件
        event.stopPropagation();
    });
    
    // 監聽窗口大小變化，在切換到手機模式時自動收起頻道列表
    window.addEventListener('resize', () => {
        if (window.innerWidth <= 576) {
            if (!channelsContainer.classList.contains('collapsed')) {
                channelsContainer.classList.add('collapsed');
                toggleButton.classList.add('collapsed');
            }
        } else {
            // 在大屏幕模式下始終展開頻道列表
            channelsContainer.classList.remove('collapsed');
            toggleButton.classList.remove('collapsed');
        }
    });
    
    // 點擊其他區域時收合頻道列表（僅在手機版）
    document.addEventListener('click', (event) => {
        if (window.innerWidth <= 576) {
            // 檢查點擊是否在頻道列表或頻道切換按鈕之外
            const isClickInsideChannels = channelsContainer.contains(event.target);
            const isClickOnToggleButton = toggleButton.contains(event.target);
            
            if (!isClickInsideChannels && !isClickOnToggleButton && !channelsContainer.classList.contains('collapsed')) {
                channelsContainer.classList.add('collapsed');
                toggleButton.classList.add('collapsed');
            }
        }
    });
    
    // 初始化頻道標題
    updateChannelHeader();
}

// 創建懸浮通知容器
function createNotificationContainer() {
    const notificationContainer = document.createElement('div');
    notificationContainer.id = 'notification-container';
    notificationContainer.className = 'notification-container';
    document.body.appendChild(notificationContainer);
}

// 顯示懸浮通知
function showNotification(message, type = 'info', duration = 3000) {
    const notificationContainer = document.getElementById('notification-container');
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    // 添加圖標
    let icon = '';
    switch(type) {
        case 'success': icon = '<i class="fas fa-check-circle"></i>'; break;
        case 'error': icon = '<i class="fas fa-exclamation-circle"></i>'; break;
        case 'warning': icon = '<i class="fas fa-exclamation-triangle"></i>'; break;
        default: icon = '<i class="fas fa-info-circle"></i>';
    }
    
    notification.innerHTML = `${icon} <span>${message}</span>`;
    
    // 添加關閉按鈕
    const closeBtn = document.createElement('button');
    closeBtn.className = 'notification-close';
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', () => {
        notification.classList.add('notification-hide');
        setTimeout(() => {
            notificationContainer.removeChild(notification);
        }, 300);
    });
    notification.appendChild(closeBtn);
    
    notificationContainer.appendChild(notification);
    
    // 顯示動畫
    setTimeout(() => {
        notification.classList.add('notification-show');
    }, 10);
    
    // 自動關閉
    if (duration > 0) {
        setTimeout(() => {
            notification.classList.add('notification-hide');
            setTimeout(() => {
                if (notification.parentNode === notificationContainer) {
                    notificationContainer.removeChild(notification);
                }
            }, 300);
        }, duration);
    }
    
    return notification;
}

// 顯示網絡錯誤通知
function showNetworkErrorNotification() {
    const notification = showNotification('網絡連接錯誤，請重新整理頁面並檢查網路連接', 'error', 0);
    
    // 添加重新整理按鈕
    const refreshBtn = document.createElement('button');
    refreshBtn.className = 'notification-refresh-btn';
    refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> 重新整理';
    refreshBtn.addEventListener('click', () => {
        window.location.reload();
    });
    
    // 將按鈕插入到通知中的文本後面
    notification.querySelector('span').appendChild(document.createElement('br'));
    notification.querySelector('span').appendChild(refreshBtn);
}

// getChannels
// 從Google Apps Script加載getChannels 名稱
function loadChannels() {
    console.log("START LOAD CHANNEL")
    $.get(API_URL, {
        action: 'getChannels'
    })
    .done(function(data) {
        if (data.success && data.channels) {
            console.log("channels:", data.channels); 
            channels = data.channels;
            updateChannelList();
            updateChannelHeader();
        }
    })
    .fail(function(error) {
        console.error('加載公告錯誤:', error);
    });
}

// 初始化用戶
function initUser() {
    // 檢查本地存儲中是否有用戶ID和特殊字串
    let userId = localStorage.getItem('userId');
    let userToken = localStorage.getItem('userToken');
    
    if (!userId || !userToken) {
        // 生成隨機4位數字作為用戶ID
        userId = Math.floor(1000 + Math.random() * 9000).toString();
        // 生成隨機16字元的特殊字串(英文大小寫+數字)
        userToken = Array(16).fill(0).map(() => {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            return chars[Math.floor(Math.random() * chars.length)];
        }).join('');
        
        // 儲存到本地
        localStorage.setItem('userId', userId);
        localStorage.setItem('userToken', userToken);
    }
    
    // 檢查用戶ID是否已存在於服務器
    checkAndRegisterUserId(userId, userToken);
    
    // 檢查是否有管理員會話ID
    adminSessionId = localStorage.getItem('adminSessionId');
    if (adminSessionId) {
        // 檢查管理員會話是否有效
        checkAdminSession();
    } else {
        isAdmin = false;
        updateAdminUI();
    }
}

// 檢查並註冊用戶ID
function checkAndRegisterUserId(userId, userToken) {
    $.get(API_URL, {
        action: 'checkUserId',
        userId: userId,
        userToken: userToken
    })
    .done(function(data) {
        if (data.success) {
            if (data.exists) {
                // ID已存在，生成新ID
                const newUserId = Math.floor(1000 + Math.random() * 9000).toString();
                checkAndRegisterUserId(newUserId, userToken);
            } else {
                // ID不存在，註冊ID
                registerUserId(userId, userToken);
            }
        } else {
            console.error('檢查用戶ID失敗:', data.error);
            // 出錯時使用本地ID
            setCurrentUser(userId);
        }
    })
    .fail(function(error) {
        console.error('檢查用戶ID錯誤:', error);
        // 出錯時使用本地ID
        setCurrentUser(userId);
    });
}

// 註冊用戶ID
function registerUserId(userId, userToken) {
    $.post(API_URL, {
        action: 'registerUserId',
        data: JSON.stringify({
            userId: userId,
            userToken: userToken,
            timestamp: new Date().toISOString() // 添加時間戳作為初始心跳
        })
    })
    .done(function(data) {
        if (data.success) {
            // 註冊成功，設置當前用戶
            localStorage.setItem('userId', userId);
            setCurrentUser(userId);
            // 立即發送第一次心跳
            sendHeartbeat();
        } else if (data.exists) {
            // ID已存在，生成新ID
            const newUserId = Math.floor(1000 + Math.random() * 9000).toString();
            checkAndRegisterUserId(newUserId, userToken);
        } else {
            console.error('註冊用戶ID失敗:', data.error);
            // 出錯時使用本地ID
            setCurrentUser(userId);
        }
    })
    .fail(function(error) {
        console.error('註冊用戶ID錯誤:', error);
        // 出錯時使用本地ID
        setCurrentUser(userId);
    });
}

// 釋放用戶ID
function releaseUserId() {
    const userId = localStorage.getItem('userId');
    if (userId) {
        // 使用同步請求確保在頁面關閉前完成
        navigator.sendBeacon(API_URL, new URLSearchParams({
            action: 'releaseUserId',
            data: JSON.stringify({
                userId: userId
            })
        }));
    }
}

// 發送用戶活動心跳
function sendHeartbeat() {
    const userId = localStorage.getItem('userId');
    if (userId) {
        $.post(API_URL, {
            action: 'userHeartbeat',
            data: JSON.stringify({
                userId: userId,
                timestamp: new Date().toISOString()
            })
        })
        .done(function(data) {
            if (data.success) {
                console.log('心跳發送成功');
            } else {
                console.error('心跳發送失敗:', data.error);
            }
        })
        .fail(function(error) {
            console.error('心跳發送錯誤:', error);
        });
    }
}

// 設置當前用戶
function setCurrentUser(userId) {
    currentUser = `User#${userId}`;
    document.getElementById('user-name').textContent = currentUser;
}

// 設置事件監聽器
function setupEventListeners() {
    // 發送消息
    document.getElementById('send-button').addEventListener('click', sendMessage);
    document.getElementById('message-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    // 格式幫助切換
    document.getElementById('format-help-toggle').addEventListener('click', toggleFormatHelpMenu);
    
    // 點擊其他地方關閉格式幫助菜單
    document.addEventListener('click', (e) => {
        const formatHelpMenu = document.getElementById('format-help-menu');
        const formatHelpToggle = document.getElementById('format-help-toggle');
        
        if (!formatHelpMenu.contains(e.target) && e.target !== formatHelpToggle && !formatHelpToggle.contains(e.target)) {
            formatHelpMenu.classList.add('hidden');
        }
    });
    
    // 為隱藏文字添加點擊事件（在文檔加載後）
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('spoiler')) {
            e.target.classList.toggle('revealed');
        }
    });
    
    // 切換頻道
    document.querySelectorAll('.channel').forEach(channel => {
        channel.addEventListener('click', () => {
            switchChannel(channel.dataset.channel);
        });
    });
    
    // 主題切換
    document.getElementById('theme-toggle').addEventListener('click', toggleThemeMenu);
    document.getElementById('theme-light').addEventListener('click', () => { setTheme('light'); toggleThemeMenu(); });
    document.getElementById('theme-gray').addEventListener('click', () => { setTheme('gray'); toggleThemeMenu(); });
    document.getElementById('theme-dark').addEventListener('click', () => { setTheme('dark'); toggleThemeMenu(); });
    
    // 字體大小切換
    document.getElementById('font-size-toggle').addEventListener('click', toggleFontSizeMenu);
    document.getElementById('font-size-small').addEventListener('click', () => { setFontSize('small'); toggleFontSizeMenu(); });
    document.getElementById('font-size-medium').addEventListener('click', () => { setFontSize('medium'); toggleFontSizeMenu(); });
    document.getElementById('font-size-large').addEventListener('click', () => { setFontSize('large'); toggleFontSizeMenu(); });
    
    // 點擊其他地方關閉主題選單和字體大小選單
    document.addEventListener('click', (e) => {
        const themeMenu = document.getElementById('theme-menu');
        const themeToggle = document.getElementById('theme-toggle');
        const fontSizeMenu = document.getElementById('font-size-menu');
        const fontSizeToggle = document.getElementById('font-size-toggle');
        
        if (!themeMenu.contains(e.target) && e.target !== themeToggle && !themeToggle.contains(e.target)) {
            themeMenu.classList.add('hidden');
            isThemeMenuOpen = false;
        }
        
        if (!fontSizeMenu.contains(e.target) && e.target !== fontSizeToggle && !fontSizeToggle.contains(e.target)) {
            fontSizeMenu.classList.add('hidden');
        }
    });
    
    // 管理員登錄
    document.getElementById('admin-login').addEventListener('click', showAdminModal);
    document.getElementById('admin-form').addEventListener('submit', handleAdminLogin);
    
    // 添加/編輯頻道
    document.getElementById('add-channel').addEventListener('click', showAddChannelModal);
    document.getElementById('channel-form').addEventListener('submit', handleChannelForm);
    
    // 關閉模態框
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', () => {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.classList.add('hidden');
            });
        });
    });
    
    // 添加公告編輯按鈕（僅管理員可見）
    const announcementContainer = document.querySelector('.marquee-container');
    const editAnnouncementBtn = document.createElement('button');
    editAnnouncementBtn.id = 'edit-announcement';
    editAnnouncementBtn.className = 'edit-announcement-btn admin-only hidden';
    editAnnouncementBtn.innerHTML = '<i class="fas fa-edit"></i>';
    editAnnouncementBtn.title = '編輯公告';
    editAnnouncementBtn.addEventListener('click', () => {
        showAnnouncementModal();
    });
    announcementContainer.appendChild(editAnnouncementBtn);

    document.getElementById('announcement-form').addEventListener('submit', handleAnnouncementForm);
    
    // 表情符號選擇器
    document.getElementById('emoji-button').addEventListener('click', toggleEmojiPicker);
    

    // 點擊其他地方關閉表情符號選擇器
    document.addEventListener('click', (e) => {
        const emojiPicker = document.querySelector('.emoji-picker');
        const emojiButtonContainer = document.querySelector('.emoji-picker-toggle'); // 取得按鈕的外層容器
    
        // 如果點擊的地方不是表情選擇器，也不是按鈕區域，就關閉
        if ( !emojiPicker.contains(e.target) && !emojiButtonContainer.contains(e.target)) {
            emojiPicker.classList.add('hidden');
        }
    });    
    
    // 加載保存的主題和字體大小
    const savedTheme = localStorage.getItem('theme') || 'light';
    const savedFontSize = localStorage.getItem('fontSize') || 'small';
    setTheme(savedTheme);
    setFontSize(savedFontSize);

    // 檢測用戶滾動位置
    const messagesContainer = document.getElementById('messages');
    messagesContainer.addEventListener('scroll', () => {
        const totalHeight = messagesContainer.scrollHeight;
        const visibleHeight = messagesContainer.clientHeight;
        const scrollTop = messagesContainer.scrollTop;
        isUserAtBottom = (scrollTop + visibleHeight >= totalHeight - 10);
    });
    
}

// 設置表情符號選擇器
function setupEmojiPicker() {
    const emojiPicker = document.getElementById('emoji-picker');
    emojiPicker.innerHTML = '';
    
    // 創建分類標籤容器
    const tabsContainer = document.createElement('div');
    tabsContainer.classList.add('emoji-tabs');
    emojiPicker.appendChild(tabsContainer);
    
    // 創建表情符號容器
    const emojisContainer = document.createElement('div');
    emojisContainer.classList.add('emoji-container');
    emojiPicker.appendChild(emojisContainer);
    
    // 為每個分類創建標籤和表情符號區域
    let isFirstCategory = true;
    Object.entries(commonEmojis).forEach(([category, emojis]) => {
        // 創建分類標籤
        const tabElement = document.createElement('div');
        tabElement.classList.add('emoji-tab');
        if (isFirstCategory) {
            tabElement.classList.add('active');
            isFirstCategory = false;
        }
        
        // 設置標籤圖標
        let tabIcon = '';
        switch(category) {
            case 'common': tabIcon = '😀'; break;
            case 'gestures': tabIcon = '👍'; break;
            case 'hearts': tabIcon = '❤️'; break;
            case 'objects': tabIcon = '🎁'; break;
            case 'travel': tabIcon = '✈️'; break;
            case 'animals': tabIcon = '🐱'; break;
            case 'nature': tabIcon = '🌿'; break;
            case 'sports': tabIcon = '⚽'; break;
            case 'foods': tabIcon = '🍔'; break;
            case 'objectEmojis': tabIcon = '📱'; break;
            case 'flags': tabIcon = '🇹🇼'; break;
            default: tabIcon = '😀';
        }
        
        tabElement.textContent = tabIcon;
        tabElement.dataset.category = category;
        tabsContainer.appendChild(tabElement);
        
        // 創建表情符號區域
        const categoryContainer = document.createElement('div');
        categoryContainer.classList.add('emoji-category');
        categoryContainer.dataset.category = category;
        if (isFirstCategory === false && category === Object.keys(commonEmojis)[0]) {
            categoryContainer.classList.add('active');
        } else {
            categoryContainer.classList.add('hidden');
        }
        
        // 添加表情符號
        emojis.forEach(emoji => {
            const emojiElement = document.createElement('div');
            emojiElement.classList.add('emoji');
            
            // 特殊處理國旗表情符號
            if (category === 'flags') {
                // 直接使用textContent設置表情符號，因為現在使用的是Unicode字符而非HTML實體
                emojiElement.textContent = emoji;
                // 添加特殊類別以便於樣式調整
                emojiElement.classList.add('flag-emoji');
            } else {
                emojiElement.textContent = emoji;
            }
            
            emojiElement.addEventListener('click', () => {
                const messageInput = document.getElementById('message-input');
                messageInput.value += emoji;
                messageInput.focus();
                // emojiPicker.classList.add('hidden');
            });
            categoryContainer.appendChild(emojiElement);
        });
        
        emojisContainer.appendChild(categoryContainer);
    });
    
    // 添加標籤點擊事件
    document.querySelectorAll('.emoji-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            // 更新標籤狀態
            document.querySelectorAll('.emoji-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // 更新表情符號區域顯示
            const category = tab.dataset.category;
            document.querySelectorAll('.emoji-category').forEach(container => {
                if (container.dataset.category === category) {
                    container.classList.remove('hidden');
                } else {
                    container.classList.add('hidden');
                }
            });
        });
    });
}

// 切換表情符號選擇器顯示/隱藏
function toggleEmojiPicker() {
    const emojiPicker = document.getElementById('emoji-picker');
    emojiPicker.classList.toggle('hidden');
}

// 切換主題選單顯示/隱藏
function toggleThemeMenu() {
    const themeMenu = document.getElementById('theme-menu');
    themeMenu.classList.toggle('hidden');
    isThemeMenuOpen = !isThemeMenuOpen;
    
    // 確保字體大小選單關閉
    document.getElementById('font-size-menu').classList.add('hidden');
}

// 切換字體大小選單顯示/隱藏
function toggleFontSizeMenu() {
    const fontSizeMenu = document.getElementById('font-size-menu');
    fontSizeMenu.classList.toggle('hidden');
    
    // 確保主題選單關閉
    document.getElementById('theme-menu').classList.add('hidden');
    isThemeMenuOpen = false;
    
    // 確保格式幫助菜單關閉
    document.getElementById('format-help-menu').classList.add('hidden');
}

// 切換格式幫助菜單顯示/隱藏
function toggleFormatHelpMenu() {
    const formatHelpMenu = document.getElementById('format-help-menu');
    formatHelpMenu.classList.toggle('hidden');
    
    // 確保主題選單關閉
    document.getElementById('theme-menu').classList.add('hidden');
    isThemeMenuOpen = false;
    
    // 確保字體大小選單關閉
    document.getElementById('font-size-menu').classList.add('hidden');
}

// 設置主題
function setTheme(theme) {
    // 保留當前字體大小設定
    const currentFontSize = document.body.dataset.fontSize || 'medium';
    document.body.className = `theme-${theme} font-size-${currentFontSize}`;
    document.querySelectorAll('.theme-option').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(`theme-${theme}`).classList.add('active');
    localStorage.setItem('theme', theme);
}

// 設置字體大小
function setFontSize(size) {
    // 保留當前主題設定
    const currentTheme = localStorage.getItem('theme') || 'light';
    document.body.dataset.fontSize = size;
    document.body.className = `theme-${currentTheme} font-size-${size}`;
    document.querySelectorAll('.font-size-option').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(`font-size-${size}`).classList.add('active');
    localStorage.setItem('fontSize', size);
}

// 切換頻道
function switchChannel(channelId) {
    // 取消之前的請求
    if (currentMessageController) {
        currentMessageController.abort();
        currentMessageController = null;
    }
    
    currentChannel = channelId;
    document.querySelectorAll('.channel').forEach(channel => {
        if (channel.dataset.channel === channelId) {
            channel.classList.add('active');
        } else {
            channel.classList.remove('active');
        }
    });
    
    // 清除當前消息並顯示載入中提示
    const messagesContainer = document.getElementById('messages');
    messagesContainer.innerHTML = `
        <div class="loading-container">
            <div class="loading-spinner"></div>
            <p>${channels.find(c => c.id === channelId)?.name || channelId} 頻道載入中...</p>
        </div>
    `;
    
    // 更新頻道標題顯示當前選擇的頻道名稱
    updateChannelHeader();
    
    // 在手機版中選擇頻道後自動收合頻道列表
    if (window.innerWidth <= 576) {
        const channelsContainer = document.querySelector('.channels');
        const toggleButton = document.getElementById('toggle-channels');
        channelsContainer.classList.add('collapsed');
        toggleButton.classList.add('collapsed');
    }
    
    // 載入新頻道的消息
    loadMessages();
}

// 發送消息
function sendMessage() {
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    const message = messageInput.value.trim();
    
    if (message === '') return;
    
    // 檢查消息發送頻率限制（3秒一條）
    const now = Date.now();
    if (now - lastMessageTime < 3000) {
        let counttime = ((now - lastMessageTime) / 1000).toFixed(1);
        showNotification(`請等待 ${counttime} 秒後再發送消息`, 'warning');
        return;
    }
    
    lastMessageTime = now;
    
    // 禁用按鈕並顯示加載狀態
    sendButton.disabled = true;
    sendButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    
    // 發送消息到Google Apps Script
    sendMessageToGAS(message, sendButton);
    
    // 清空輸入框
    messageInput.value = '';
    messageInput.focus();
    
    // 添加冷卻時間視覺提示
    let cooldownTime = 3;
    const cooldownInterval = setInterval(() => {
        cooldownTime--;
        if (cooldownTime > 0) {
            sendButton.innerHTML = `<span class="cooldown-text">${cooldownTime}</span>`;
        } else {
            clearInterval(cooldownInterval);
            sendButton.innerHTML = '<i class="fas fa-paper-plane"></i>';
            sendButton.disabled = false;
        }
    }, 1000);
}

// 發送消息到Google Apps Script
function sendMessageToGAS(message, sendButton) {
    // 構建消息對象
    const messageData = {
        sender: currentUser,
        content: message,
        channel: currentChannel,
        timestamp: new Date().toISOString()
    };

    // 使用jQuery的$.post方法發送消息
    $.post(API_URL, {
        action: 'sendMessage',   // 保留action參數
        data: JSON.stringify(messageData).toString(), // 傳送JSON字串
        sessionId: adminSessionId // 如果是管理員，傳送會話ID
    })
    .done(function(data) {
        if (data.success) {
            // 消息發送成功，立即加載最新消息
            loadMessages();
        } else {
            console.error('發送消息失敗:', data.error);
            showNotification('發送消息失敗：' + (data.error || '未知錯誤'), 'error');
        }
    })
    .fail(function(error) {
        console.error('發送消息錯誤:', error);
        showNotification('發送消息錯誤，請稍後再試', 'error');
    })
    .always(function() {
        // 恢復按鈕狀態
        if (sendButton) {
            sendButton.disabled = false;
            sendButton.innerHTML = '<i class="fas fa-paper-plane"></i>';
        }
    });
}


// 格式化時間戳，非當天消息顯示月日
function formatTimestamp(timestamp) {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.getDate() === now.getDate() && 
                   date.getMonth() === now.getMonth() && 
                   date.getFullYear() === now.getFullYear();
    
    // 格式化時間（時:分）
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;
    
    // 如果不是今天，添加月/日
    if (!isToday) {
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${month}/${day} ${timeStr}`;
    }
    
    return timeStr;
}

// 更新在線人數顯示
function updateOnlineUsersCount(count) {
    const countElement = document.getElementById('online-users-count');
    if (countElement) {
        countElement.textContent = `目前上線人數: ${count}`;
    }
}

// 從服務器獲取在線人數
function getOnlineUsersCount() {
    $.get(API_URL, {
        action: 'getMessages',
        channel: currentChannel
    })
    .done(function(data) {
        if (data.success) {
            // 從服務器響應中獲取活躍用戶數量
            const activeUsers = data.active_users || [];
            updateOnlineUsersCount(activeUsers.length);
        }
    })
    .fail(function(error) {
        console.error('獲取在線人數錯誤:', error);
    });
}

// 從Google Apps Script加載消息
let lastMessageCount = 0;
let lastMessageTimestamp = '';

function loadMessages() {
    // 取消之前的請求（如果存在）
    if (currentMessageController) {
        currentMessageController.abort();
    }
    
    // 創建新的AbortController
    currentMessageController = new AbortController();
    const signal = currentMessageController.signal;
    
    // 保存當前請求的頻道ID，用於檢查請求完成時頻道是否已經改變
    const requestChannelId = currentChannel;
    
    // 使用fetch API代替jQuery的$.get，以支持AbortController
    fetch(`${API_URL}?action=getMessages&channel=${requestChannelId}`, {
        method: 'GET',
        signal: signal
    })
    .then(response => response.json())
    .then(data => {
        // 如果在請求完成時頻道已經改變，則忽略此響應
        if (requestChannelId !== currentChannel) {
            console.log('忽略舊頻道的響應:', requestChannelId);
            return;
        }
        
        // 重置重試計數器
        messageRetryCount = 0;
        
        if (data.success) {
            // 檢查是否有新消息
            const messages = data.messages || [];
            const latestTimestamp = messages.length > 0 ? messages[messages.length - 1].timestamp : '';
            
            // 更新在線人數
            if (data.active_users) {
                updateOnlineUsersCount(data.active_users.length);
            }
            
            if (currentUser) {
                displayMessages(messages);
            } else {
                // 使用者未確定，顯示載入中
                switchChannel(currentChannel);
            }
        } else {
            console.error('加載消息失敗:', data.error);
        }
        
        // 清理控制器引用
        if (currentMessageController && currentMessageController.signal.aborted === false) {
            currentMessageController = null;
        }
    })
    .catch(error => {
        // 如果是取消請求導致的錯誤，則忽略
        if (error.name === 'AbortError') {
            console.log('請求已取消');
            return;
        }
        
        console.error('加載消息錯誤:', error);
        messageRetryCount++;
        
        if (messageRetryCount >= MAX_RETRY_COUNT) {
            // 停止重試
            clearInterval(window.messageInterval);
            // 顯示網絡錯誤通知
            showNetworkErrorNotification();
        } else {
            // 如果無法連接到服務器，顯示模擬數據（僅用於開發測試）
            displayMockMessages();
        }
        
        // 清理控制器引用
        currentMessageController = null;
    });
}


// 從Google Apps Script加載公告
function loadAnnouncement() {
    $.get(API_URL, {
        action: 'getAnnouncement'
    })
    .done(function(data) {
        // 重置重試計數器
        announcementRetryCount = 0;
        if (data.success && data.announcement) {
            document.getElementById('announcement').textContent = data.announcement;
        }
    })
    .fail(function(error) {
        console.error('加載公告錯誤:', error);
        announcementRetryCount++;
        
        if (announcementRetryCount >= MAX_RETRY_COUNT) {
            // 停止重試
            clearInterval(window.announcementInterval);
            // 顯示網絡錯誤通知
            showNetworkErrorNotification();
        }
    });
}

// 檢查管理員會話狀態
function checkAdminSession() {
    if (!adminSessionId) {
        isAdmin = false;
        updateAdminUI();
        return;
    }
    
    $.post(API_URL, {
        action: 'checkAdminSession',
        sessionId: adminSessionId
    })
    .done(function(data) {
        if (data.success && data.isValid) {
            isAdmin = true;
            // 設置定時器，在會話即將過期前重新檢查
            if (adminSessionCheckTimer) {
                clearTimeout(adminSessionCheckTimer);
            }
            // 設置為過期前5分鐘檢查
            const checkTime = Math.max(data.expiresIn - 5 * 60 * 1000, 60 * 1000);
            adminSessionCheckTimer = setTimeout(checkAdminSession, checkTime);
            // 確保會話ID保存在localStorage中
            localStorage.setItem('adminSessionId', adminSessionId);
        } else {
            // 會話無效，清除本地存儲
            adminLogout(false);
        }
        updateAdminUI();
    })
    .fail(function(error) {
        console.error('檢查管理員會話錯誤:', error);
        // 出錯時保守處理，假設會話無效
        adminLogout(false);
    });
}

// 管理員登出
function adminLogout(sendRequest = true) {
    if (sendRequest && adminSessionId) {
        // 發送登出請求到服務器
        $.post(API_URL, {
            action: 'adminLogout',
            sessionId: adminSessionId
        });
    }
    
    // 清除本地存儲和狀態
    localStorage.removeItem('adminSessionId');
    adminSessionId = null;
    isAdmin = false;
    
    if (adminSessionCheckTimer) {
        clearTimeout(adminSessionCheckTimer);
        adminSessionCheckTimer = null;
    }
    
    updateAdminUI();
    
    if (sendRequest) {
        showNotification('已登出管理員帳戶', 'info');
    }
}

// 處理管理員登錄
function handleAdminLogin(e) {
    e.preventDefault();
    
    const loginButton = document.querySelector('#admin-form button[type="submit"]');
    const username = document.getElementById('admin-username').value;
    const password = document.getElementById('admin-password').value;
    const uniquenum = document.getElementById('admin-uniquenum').value;
    const messageData = {
        username: username, 
        password: password, 
        uniquenum: uniquenum
    };
    
    // 禁用按鈕並顯示加載狀態
    loginButton.disabled = true;
    loginButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 登入中...';
    
    // 使用jQuery的$.post方法發送登錄請求
    $.post(API_URL, {
        action: 'adminLogin',
        data: JSON.stringify(messageData).toString()
    })
    .done(function(data) {
        if (data.success) {
            isAdmin = true;
            adminSessionId = data.sessionId;
            localStorage.setItem('adminSessionId', adminSessionId);
            
            // 設置會話檢查定時器
            if (adminSessionCheckTimer) {
                clearTimeout(adminSessionCheckTimer);
            }
            // 設置為過期前5分鐘檢查
            const checkTime = Math.max(data.expiresIn - 5 * 60 * 1000, 60 * 1000);
            adminSessionCheckTimer = setTimeout(checkAdminSession, checkTime);
            
            updateAdminUI();
            document.getElementById('admin-modal').classList.add('hidden');
            showNotification('管理員登錄成功！會話將在30分鐘後過期', 'success');
        } else {
            showNotification('登錄失敗：' + (data.error || '驗證信息不正確'), 'error');
        }
    })
    .fail(function(error) {
        console.error('登錄錯誤:', error);
        showNotification('登錄請求失敗，請稍後再試', 'error');
    })
    .always(function() {
        // 恢復按鈕狀態
        loginButton.disabled = false;
        loginButton.innerHTML = '登入';
    });
}

// 添加新頻道
function addChannel(channelName, submitButton) {
    // 生成唯一ID
    const channelId = 'channel' + (channels.length + 1);
    
    // 使用jQuery的$.post方法發送請求
    $.post(API_URL, {
        action: 'addChannel',
        data: `{ "id": "${channelId}", "name": "${channelName}" }`,
        sessionId: adminSessionId
    })
    .done(function(data) {
        if (data.success) {
            // 更新本地頻道列表
            channels.push({ id: channelId, name: channelName });
            updateChannelList();
            document.getElementById('channel-modal').classList.add('hidden');
            showNotification('頻道添加成功！', 'success');
        } else {
            showNotification('添加頻道失敗：' + (data.error || '未知錯誤'), 'error');
        }
    })
    .fail(function(error) {
        console.error('添加頻道錯誤:', error);
        showNotification('添加頻道請求失敗，請稍後再試', 'error');
    })
    .always(function() {
        // 恢復按鈕狀態
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.innerHTML = '儲存';
        }
    });
}

// 更新頻道
function updateChannel(channelId, channelName, submitButton) {
    // 使用jQuery的$.post方法發送請求
    $.post(API_URL, {
        action: 'updateChannel',
        data: `{ "id": "${channelId}", "name": "${channelName}" }`,
        sessionId: adminSessionId
    })
    .done(function(data) {
        if (data.success) {
            // 更新本地頻道列表
            const channelIndex = channels.findIndex(c => c.id === channelId);
            if (channelIndex !== -1) {
                channels[channelIndex].name = channelName;
                updateChannelList();
            }
            document.getElementById('channel-modal').classList.add('hidden');
            showNotification('頻道更新成功！', 'success');
        } else {
            showNotification('更新頻道失敗：' + (data.error || '未知錯誤'), 'error');
        }
    })
    .fail(function(error) {
        console.error('更新頻道錯誤:', error);
        showNotification('更新頻道請求失敗，請稍後再試', 'error');
    })
    .always(function() {
        // 恢復按鈕狀態
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.innerHTML = '儲存';
        }
    });
}

// 顯示編輯公告模態框
function showAnnouncementModal() {
    // 先顯示模態框和載入中提示
    const announcementTextarea = document.getElementById('announcement-text');
    announcementTextarea.value = '載入中...';
    document.getElementById('announcement-modal').classList.remove('hidden');
    
    // 使用jQuery的$.get方法獲取當前公告
    $.get(API_URL, {
        action: 'getAnnouncement'
    })
    .done(function(data) {
        if (data.success) {
            announcementTextarea.value = data.announcement || '';
        }
    })
    .fail(function(error) {
        console.error('獲取公告錯誤:', error);
        // 如果無法獲取，顯示錯誤提示
        announcementTextarea.value = '';
        showNotification('獲取公告失敗，請重新嘗試', 'error');
    });
}

// 處理公告表單提交
function handleAnnouncementForm(e) {
    e.preventDefault();
    
    const submitButton = document.querySelector('#announcement-form button[type="submit"]');
    let announcementText = document.getElementById('announcement-text').value;
    
    // 處理公告文字：將多行換行改為一行，將單一換行轉為\t
    announcementText = announcementText.replace(/\n\s*\n/g, ' ').replace(/\n/g, '\t');
    
    // 禁用按鈕並顯示加載狀態
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 處理中...';
    
    // 使用jQuery的$.post方法發送請求
    $.post(API_URL, {
        action: 'updateAnnouncement',
        data: `{ "announcement": "${announcementText}" }`,
        sessionId: adminSessionId
    })
    .done(function(data) {
        if (data.success) {
            document.getElementById('announcement').textContent = announcementText;
            document.getElementById('announcement-modal').classList.add('hidden');
            showNotification('公告更新成功！', 'success');
        } else {
            showNotification('更新公告失敗：' + (data.error || '未知錯誤'), 'error');
        }
    })
    .fail(function(error) {
        console.error('更新公告錯誤:', error);
        showNotification('更新公告請求失敗，請稍後再試', 'error');
    })
    .always(function() {
        // 恢復按鈕狀態
        submitButton.disabled = false;
        submitButton.innerHTML = '儲存';
    });
}

// 更新訊息（用於SSE事件）
function updateMessages(messagesData, active_users) {
    // 只處理當前頻道的訊息
    if (messagesData && messagesData[currentChannel]) {
        const messages = messagesData[currentChannel];
        // 使用與displayMessages相同的邏輯顯示訊息
        displayMessages(messages);
                    // 更新在線人數
        if (active_users) {
            updateOnlineUsersCount( active_users.length);
        }
    }
}

// 顯示消息
function displayMessages(messages) {
    const messagesContainer = document.getElementById('messages');
    messagesContainer.innerHTML = '';
    
    // 當頻道沒有消息時顯示提示
    if (!messages || messages.length === 0) {
        const emptyChannelElement = document.createElement('div');
        emptyChannelElement.classList.add('empty-channel-message');
        emptyChannelElement.innerHTML = '<i class="fas fa-comments"></i><p>此頻道還未有訊息，請開始你的交談～</p>';
        messagesContainer.appendChild(emptyChannelElement);
        return;
    }
    
    messages.forEach(msg => {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message');
        messageElement.dataset.id = msg.id || ''; // 保存消息ID用於刪除功能
        
        // 檢查是否是當前用戶發送的消息
        if (msg.sender == currentUser) {
            messageElement.classList.add('my-message');
        }
        
        const senderElement = document.createElement('div');
        senderElement.classList.add('message-sender');
        
        // 添加時間戳顯示
        const formattedTime = formatTimestamp(msg.timestamp);
        senderElement.textContent = `${msg.sender} ${formattedTime ? '· ' + formattedTime : ''}`;
        
        const contentElement = document.createElement('div');
        contentElement.classList.add('message-content');
        
        // 檢查是否是已刪除的消息
        if (msg.deleted) {
            contentElement.classList.add('deleted-message');
            contentElement.innerHTML = '<i class="fas fa-ban"></i> 此訊息已被管理員刪除';
        } else {
            // 使用Markdown解析器處理消息內容
            contentElement.innerHTML = window.parseMarkdown(msg.content);
            
            // 為管理員添加刪除按鈕
            if (isAdmin) {
                const deleteBtn = document.createElement('button');
                deleteBtn.classList.add('delete-message-btn');
                deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
                deleteBtn.title = '刪除訊息';
                deleteBtn.addEventListener('click', () => {
                    if (confirm('確定要刪除此訊息嗎？')) {
                        deleteMessage(msg, msg.channel || currentChannel);
                    }
                });
                contentElement.appendChild(deleteBtn);
            }
        }
        
        messageElement.appendChild(senderElement);
        messageElement.appendChild(contentElement);
        messagesContainer.appendChild(messageElement);
    });
    
    // 滾動到最新消息
    if (isUserAtBottom) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

// 顯示模擬消息（僅用於開發測試）
function displayMockMessages() {
    const mockMessages = [
        { id: '1', sender: 'User#1234', content: '你好，這是一條測試消息！', timestamp: new Date().toISOString(), deleted: false },
        { id: '2', sender: currentUser, content: '這是我發送的消息', timestamp: new Date().toISOString(), deleted: false },
        { id: '3', sender: 'User#5678', content: '歡迎來到聊天室！', timestamp: new Date().toISOString(), deleted: false }
    ];
    displayMessages(mockMessages);
}

// 刪除消息（僅管理員可用）
function deleteMessage(message, channel) {
    if (!isAdmin || !adminSessionId) {
        showNotification('需要管理員權限才能刪除消息', 'error');
        return;
    }
    
    // 使用jQuery的$.post方法發送請求
    $.post(API_URL, {
        action: 'deleteMessage',
        data: JSON.stringify({
            content: message.content,
            sender: message.sender,
            timestamp: message.timestamp,
            channel: channel
        }),
        sessionId: adminSessionId
    })
    .done(function(data) {
        if (data.success) {
            // 刪除成功，重新加載消息
            loadMessages();
            showNotification('消息已成功刪除', 'success');
        } else {
            showNotification('刪除消息失敗：' + (data.error || '未知錯誤'), 'error');
        }
    })
    .fail(function(error) {
        console.error('刪除消息錯誤:', error);
        showNotification('刪除消息請求失敗，請稍後再試', 'error');
    });
}

// 顯示管理員登錄模態框
function showAdminModal() {
    if (!isAdmin) {
        document.getElementById('admin-modal').classList.remove('hidden');
    }
}

// 更新管理員UI
function updateAdminUI() {
    const adminElements = document.querySelectorAll('.admin-only');
    const adminLoginBtn = document.getElementById('admin-login');
    const announcementContainer = document.querySelector('.marquee-container');
    
    if (isAdmin) {
        // 顯示管理員功能
        adminElements.forEach(el => el.classList.remove('hidden'));

        // 更改登入按鈕為登出按鈕
        adminLoginBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i>';
        adminLoginBtn.title = '管理員登出';
        adminLoginBtn.onclick = function() {
            if (confirm('確定要登出管理員帳戶嗎？')) {
                adminLogout();
            }
        };
        
        // 為頻道添加編輯和刪除按鈕
        updateChannelButtons();
        
        // 添加管理者模式樣式
        announcementContainer.classList.add('admin-mode');
    } else {
        // 隱藏管理員功能
        adminElements.forEach(el => el.classList.add('hidden'));
        
        // 恢復登入按鈕
        adminLoginBtn.innerHTML = '<i class="fas fa-user-shield"></i>';
        adminLoginBtn.title = '管理員登入';
        adminLoginBtn.onclick = showAdminModal;
        
        // 移除頻道編輯和刪除按鈕
        document.querySelectorAll('.channel-edit, .channel-delete').forEach(btn => btn.remove());
        
        // 移除管理者模式樣式
        announcementContainer.classList.remove('admin-mode');
    }
}

// 更新頻道按鈕（編輯和刪除）
function updateChannelButtons() {
    if (!isAdmin) return;
    
    document.querySelectorAll('.channel').forEach(channelEl => {
        const channelId = channelEl.dataset.channel;
        const channel = channels.find(c => c.id === channelId);
        
        // 檢查是否已經有編輯按鈕
        if (!channelEl.querySelector('.channel-edit')) {
            const editBtn = document.createElement('button');
            editBtn.classList.add('channel-edit');
            editBtn.innerHTML = '<i class="fas fa-edit"></i>';
            editBtn.style.float = 'right';
            editBtn.style.marginLeft = '5px';
            editBtn.style.background = 'none';
            editBtn.style.border = 'none';
            editBtn.style.cursor = 'pointer';
            editBtn.style.color = 'inherit';
            
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // 防止觸發頻道切換
                if (channel) {
                    showEditChannelModal(channel);
                }
            });
            
            channelEl.appendChild(editBtn);
        }
        
        // 檢查是否已經有刪除按鈕，且不是預設頻道
        if (!channelEl.querySelector('.channel-delete') && channelId !== 'channel1' && channelId !== 'channel2') {
            const deleteBtn = document.createElement('button');
            deleteBtn.classList.add('channel-delete');
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
            deleteBtn.style.float = 'right';
            deleteBtn.style.background = 'none';
            deleteBtn.style.border = 'none';
            deleteBtn.style.cursor = 'pointer';
            deleteBtn.style.color = 'inherit';
            
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // 防止觸發頻道切換
                if (confirm(`確定要刪除頻道 "${channel.name}" 嗎？此操作不可恢復。`)) {
                    deleteChannel(channelId);
                }
            });
            
            channelEl.appendChild(deleteBtn);
        }
    });
}


// 更新頻道列表UI
function updateChannelList() {
    const channelList = document.getElementById('channel-list');
    channelList.innerHTML = '';
    
    channels.forEach(channel => {
        const channelElement = document.createElement('li');
        channelElement.classList.add('channel');
        channelElement.dataset.channel = channel.id;
        channelElement.textContent = channel.name;
        
        if (channel.id === currentChannel) {
            channelElement.classList.add('active');
        }
        
        channelElement.addEventListener('click', () => {
            switchChannel(channel.id);
        });
        
        channelList.appendChild(channelElement);
    });
    
    // 如果是管理員，添加編輯按鈕
    updateChannelButtons();
}

// 顯示添加頻道模態框
function showAddChannelModal() {
    document.getElementById('channel-modal-title').textContent = '添加頻道';
    document.getElementById('channel-name').value = '';
    document.getElementById('channel-id').value = '';
    document.getElementById('channel-modal').classList.remove('hidden');
}

// 顯示編輯頻道模態框
function showEditChannelModal(channel) {
    document.getElementById('channel-modal-title').textContent = '編輯頻道';
    document.getElementById('channel-name').value = channel.name;
    document.getElementById('channel-id').value = channel.id;
    document.getElementById('channel-modal').classList.remove('hidden');
}

// 處理頻道表單提交
function handleChannelForm(e) {
    e.preventDefault();
    
    const submitButton = document.querySelector('#channel-form button[type="submit"]');
    const channelName = document.getElementById('channel-name').value;
    const channelId = document.getElementById('channel-id').value;
    
    // 禁用按鈕並顯示加載狀態
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 處理中...';
    
    if (channelId) {
        // 編輯現有頻道
        updateChannel(channelId, channelName, submitButton);
    } else {
        // 添加新頻道
        addChannel(channelName, submitButton);
    }
}

// 更新頻道標題顯示當前選擇的頻道名稱
function updateChannelHeader() {
    const channelHeader = document.querySelector('.channels-header h2');
    const currentChannelName = channels.find(c => c.id === currentChannel)?.name || '未知頻道';
    channelHeader.textContent = `頻道 [${currentChannelName}]`;
}

// 刪除頻道
function deleteChannel(channelId) {
    // 使用jQuery的$.post方法發送請求
    $.post(API_URL, {
        action: 'deleteChannel',
        data: `{ "id": "${channelId}" }`,
        sessionId: adminSessionId
    })
    .done(function(data) {
        if (data.success) {
            // 從本地頻道列表中移除
            const channelIndex = channels.findIndex(c => c.id === channelId);
            if (channelIndex !== -1) {
                channels.splice(channelIndex, 1);
                updateChannelList();
                
                // 如果當前頻道被刪除，切換到第一個頻道
                if (currentChannel === channelId && channels.length > 0) {
                    switchChannel(channels[0].id);
                }
            }
            showNotification('頻道刪除成功！', 'success');
        } else {
            showNotification('刪除頻道失敗：' + (data.error || '未知錯誤'), 'error');
        }
    })
    .fail(function(error) {
        console.error('刪除頻道錯誤:', error);
        showNotification('刪除頻道請求失敗，請稍後再試', 'error');
    });
}
