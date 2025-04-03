# 聊天應用後端服務器 (Python版本)
import os
import json
import uuid
import time
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # 啟用跨域資源共享

# 管理員會話緩存
admin_sessions = {}
# 管理員會話超時時間（30分鐘，單位：秒）
ADMIN_SESSION_TIMEOUT = 30 * 60

# 確保數據目錄存在
db_dir = os.path.join(os.path.dirname(__file__), 'db')
os.makedirs(db_dir, exist_ok=True)
db_file = os.path.join(db_dir, 'db.json')

# 初始化數據庫
def init_db():
    if not os.path.exists(db_file):
        default_data = {
            "channel1_message": [],
            "channel2_message": [],
            "admin": [
                {
                    "account": "admin",
                    "password": "password",
                    "uniquenum": "123456"
                }
            ],
            "channels": [
                {"id": "channel1", "name": "頻道 1"},
                {"id": "channel2", "name": "頻道 2"}
            ],
            "placard": [{"announcement": "歡迎使用聊天應用！"}]
        }
        with open(db_file, 'w', encoding='utf-8') as f:
            json.dump(default_data, f, ensure_ascii=False, indent=2)
    return load_db()

# 加載數據庫
def load_db():
    try:
        with open(db_file, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"加載數據庫錯誤: {e}")
        return init_db()

# 保存數據庫
def save_db(data):
    try:
        with open(db_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        return True
    except Exception as e:
        print(f"保存數據庫錯誤: {e}")
        return False

# 獲取或創建集合
def get_or_create_collection(collection_name):
    db = load_db()
    if collection_name not in db:
        db[collection_name] = []
        save_db(db)
    return db

# 驗證管理員會話
def validate_admin_session(session_id):
    if not session_id or session_id not in admin_sessions:
        return False
    
    session = admin_sessions[session_id]
    current_time = time.time()
    
    # 檢查會話是否過期
    if current_time > session['expire_time']:
        # 刪除過期會話
        del admin_sessions[session_id]
        return False
    
    # 更新會話過期時間（延長會話）
    session['expire_time'] = current_time + ADMIN_SESSION_TIMEOUT
    return True

# 處理GET和POST請求的統一入口
@app.route('/', methods=['GET', 'POST'])
def handle_request():
    if request.method == 'GET':
        return handle_get_request()
    else:  # POST
        return handle_post_request()

# 處理GET請求
def handle_get_request():
    action = request.args.get('action')
    
    try:
        if action == 'getMessages':
            return get_messages()
        elif action == 'getAnnouncement':
            return get_announcement()
        elif action == 'getChannels':
            return get_channels()
        else:
            return jsonify({
                'success': False,
                'error': '無效的操作'
            })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })

# 處理POST請求
def handle_post_request():
    try:
        # 嘗試從JSON和表單數據獲取參數
        if request.is_json:
            req_data = request.get_json()
        else:
            req_data = request.form
        
        data = req_data.get('data')
        action = req_data.get('action')
        session_id = req_data.get('sessionId')
        
        # 需要管理員權限的操作
        admin_actions = ['addChannel', 'updateChannel', 'updateAnnouncement', 'deleteChannel']
        
        # 檢查是否需要管理員權限
        if action in admin_actions and not validate_admin_session(session_id):
            return jsonify({
                'success': False,
                'error': '需要管理員權限或會話已過期'
            })
        
        print("action: ", action)

        if action == 'sendMessage':
            return send_message(data)
        elif action == 'adminLogin':
            return admin_login(data)
        elif action == 'adminLogout':
            return admin_logout(session_id)
        elif action == 'checkAdminSession':
            return check_admin_session(session_id)
        elif action == 'addChannel':
            return add_channel(data)
        elif action == 'updateChannel':
            return update_channel(data)
        elif action == 'deleteChannel':
            return delete_channel(data)
        elif action == 'updateAnnouncement':
            return update_announcement(data)
        else:
            return jsonify({
                'success': False,
                'error': '無效的操作'
            })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f"post解析失敗: {str(e)}"
        })

# 發送消息
def send_message(message_data):
    try:
        if isinstance(message_data, str):
            message_data = json.loads(message_data)
        
        sender = message_data.get('sender')
        content = message_data.get('content')
        channel = message_data.get('channel')
        timestamp = message_data.get('timestamp')
        
        collection_name = f"{channel}_message"
        db = get_or_create_collection(collection_name)
        
        # 添加新消息
        db[collection_name].append({
            'sender': sender,
            'content': content,
            'timestamp': timestamp
        })
        
        # 保留最新的100條消息
        if len(db[collection_name]) > 100:
            db[collection_name] = db[collection_name][-100:]
        
        save_db(db)
        
        return jsonify({
            'success': True
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })

# 獲取消息
def get_messages():
    try:
        channel = request.args.get('channel')
        collection_name = f"{channel}_message"
        db = get_or_create_collection(collection_name)
        
        messages = db[collection_name]
        
        return jsonify({
            'success': True,
            'messages': messages
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })

# 管理員登錄驗證
def admin_login(login_data):
    try:
        if isinstance(login_data, str):
            login_data = json.loads(login_data)
        
        username = login_data.get('username')
        password = login_data.get('password')
        uniquenum = login_data.get('uniquenum')
        
        db = load_db()
        admins = db.get('admin', [])
        
        # 查找匹配的管理員
        for admin in admins:
            if (str(admin.get('account')) == str(username) and
                str(admin.get('password')) == str(password) and
                str(admin.get('uniquenum')) == str(uniquenum)):
                
                # 生成唯一的會話ID
                session_id = str(uuid.uuid4())
                # 設置會話信息，包括用戶名和過期時間
                admin_sessions[session_id] = {
                    'username': username,
                    'expire_time': time.time() + ADMIN_SESSION_TIMEOUT
                }
                
                return jsonify({
                    'success': True,
                    'sessionId': session_id,
                    'expiresIn': ADMIN_SESSION_TIMEOUT * 1000  # 轉換為毫秒
                })
        
        # 如果没有找到匹配的管理员
        return jsonify({
            'success': False,
            'error': '验证信息不正确'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })

# 獲取公告
def get_announcement():
    try:
        db = load_db()
        placards = db.get('placard', [])
        announcement = placards[0].get('announcement', '') if placards else ''
        
        return jsonify({
            'success': True,
            'announcement': announcement
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })

# 更新公告
def update_announcement(data):
    try:
        if isinstance(data, str):
            data = json.loads(data)
        
        announcement = data.get('announcement')
        db = load_db()
        
        # 如果公告集合為空，添加一個新公告
        if not db.get('placard'):
            db['placard'] = [{'announcement': announcement}]
        else:
            # 更新現有公告
            db['placard'][0]['announcement'] = announcement
        
        save_db(db)
        
        return jsonify({
            'success': True
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })

# 獲取頻道列表
def get_channels():
    try:
        db = load_db()
        channels = db.get('channels', [])
        
        return jsonify({
            'success': True,
            'channels': channels
        })
    except Exception as e:
        print(f"獲取頻道錯誤: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        })

# 添加新頻道
def add_channel(channel_data):
    try:
        if isinstance(channel_data, str):
            channel_data = json.loads(channel_data)
        
        channel_id = channel_data.get('id')
        name = channel_data.get('name')
        db = load_db()
        
        # 檢查頻道ID是否已存在
        for channel in db.get('channels', []):
            if channel.get('name') == name:
                return jsonify({
                    'success': False,
                    'error': '頻道 名稱 已存在'
                })
        
        # 添加新頻道
        db['channels'].append({'id': channel_id, 'name': name})
        
        # 創建新頻道的消息集合
        db[f"{channel_id}_message"] = []
        
        save_db(db)
        
        return jsonify({
            'success': True
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })

# 更新頻道
def update_channel(channel_data):
    try:
        if isinstance(channel_data, str):
            channel_data = json.loads(channel_data)
        
        channel_id = channel_data.get('id')
        name = channel_data.get('name')
        db = load_db()
        
        # 查找頻道
        channel_found = False
        for channel in db.get('channels', []):
            if channel.get('id') == channel_id:
                channel['name'] = name
                channel_found = True
                break
        
        if not channel_found:
            return jsonify({
                'success': False,
                'error': '頻道不存在'
            })
        
        save_db(db)
        
        return jsonify({
            'success': True
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })

# 刪除頻道
def delete_channel(channel_data):
    try:
        if isinstance(channel_data, str):
            channel_data = json.loads(channel_data)
        
        channel_id = channel_data.get('id')
        
        # 不允許刪除預設頻道
        if channel_id in ['channel1', 'channel2']:
            return jsonify({
                'success': False,
                'error': '不能刪除預設頻道'
            })
        
        db = load_db()
        
        # 查找頻道
        channel_found = False
        channels = db.get('channels', [])
        for i, channel in enumerate(channels):
            if channel.get('id') == channel_id:
                del channels[i]
                channel_found = True
                break
        
        if not channel_found:
            return jsonify({
                'success': False,
                'error': '頻道不存在'
            })
        
        # 刪除對應的消息集合
        if f"{channel_id}_message" in db:
            del db[f"{channel_id}_message"]
        
        save_db(db)
        
        return jsonify({
            'success': True
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })

# 管理員登出
def admin_logout(session_id):
    if session_id and session_id in admin_sessions:
        del admin_sessions[session_id]
    
    return jsonify({
        'success': True
    })

# 檢查管理員會話狀態
def check_admin_session(session_id):
    is_valid = validate_admin_session(session_id)
    
    return jsonify({
        'success': True,
        'isValid': is_valid,
        'expiresIn': (admin_sessions[session_id]['expire_time'] - time.time()) * 1000 if is_valid else 0  # 轉換為毫秒
    })

# 初始化數據庫
init_db()

if __name__ == '__main__':
    # 啟動服務器
    port = int(os.environ.get('PORT', 5000))
    print(f"服務器運行在 http://localhost:{port}")
    print('請將前端API_URL更新為此地址')
    app.run(host='0.0.0.0', port=port, debug=True)