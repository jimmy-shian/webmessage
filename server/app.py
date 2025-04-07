# 聊天應用後端服務器 (Python版本)
import os
import json
import uuid
import time
from datetime import datetime
from flask import Flask, request, jsonify, stream_with_context, Response
from flask_cors import CORS

app = Flask(__name__)
# 開啟所有來源的 CORS，包含 null（檔案直開情況）
CORS(app, resources={r"/*": {"origins": "*"}})

# 裝飾器設定回應快取控制 response
@app.after_request
def disable_cache(response):
    response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
    response.headers['Expires'] = '-1'
    response.headers['Pragma'] = 'no-cache'
    return response

# 管理員會話緩存
admin_sessions = {}
# 最後推送的數據狀態
last_pushed_data = {
    'messages': {},
    'active_users': [],
    'channels': [],
    'announcement': ''
}
# 管理員會話超時時間（30分鐘，單位：秒）
ADMIN_SESSION_TIMEOUT = 30 * 60
# 用戶心跳超時時間（1分鐘，單位：秒）
USER_HEARTBEAT_TIMEOUT = 1 * 60

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
            "placard": [{"announcement": "歡迎使用聊天應用！"}],
            "active_users": [],
            "user_tokens": {},
            "user_heartbeats": {}
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
        db = None
        # db[collection_name] = []
        # save_db(db)
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

# 檢查是否有新消息
def has_new_message(db=None):
    db = db or load_db()
    
    active_users = db.get('active_users', [])
    last_active_users = last_pushed_data['active_users']
    # 快速檢查：人數
    if len(active_users) != len(last_active_users):
        return True
    
    for channel in db.get('channels', []):
        channel_id = channel['id']
        current_messages = db.get(f"{channel_id}_message", [])
        last_messages = last_pushed_data['messages'].get(channel_id, [])

        # 快速檢查：消息數量不同
        if len(current_messages) != len(last_messages):
            return True
            
        # 如果數量相同，檢查最後修改時間
        if current_messages and last_messages:
            current_last_time = current_messages[-1].get('timestamp')
            last_last_time = last_messages[-1].get('timestamp')
            if current_last_time != last_last_time:
                return True
    
    return False

# 檢查是否有新頻道
def has_new_channel(db=None):
    db = db or load_db()
    current_channels = db.get('channels', [])
    if len(current_channels) != len(last_pushed_data['channels']):
        return True
    # 檢查每個頻道的ID和名稱是否相同
    for i, channel in enumerate(current_channels):
        if (channel['id'] != last_pushed_data['channels'][i]['id'] or 
            channel['name'] != last_pushed_data['channels'][i]['name']):
            return True
    return False

# 檢查是否有新公告
def has_new_announcement(db=None):
    db = db or load_db()
    current_announcement = db.get('placard', [{}])[0].get('announcement', '')
    return current_announcement != last_pushed_data.get('announcement', '')

# 獲取新消息
def get_new_messages(db=None):
    db = db or load_db()
    messages = {}
    active_users = db.get('active_users', [])
    
    for channel in db.get('channels', []):
        channel_id = channel['id']
        messages[channel_id] = db.get(f"{channel_id}_message", [])
    
    # 只保存必要的參考數據
    last_pushed_data['messages'] = {
        channel['id']: [{'timestamp': msg['timestamp']} for msg in messages[channel['id']]] 
        for channel in db.get('channels', [])
    }
        # 只保存必要的參考數據
    last_pushed_data['active_users'] = active_users
    return messages, active_users

# 獲取新頻道
def get_new_channels(db=None):
    db = db or load_db()
    channels = db.get('channels', [])
    last_pushed_data['channels'] = channels
    return channels

# 獲取新公告
def get_new_announcement(db=None):
    db = db or load_db()
    announcement = db.get('placard', [{}])[0].get('announcement', '')
    last_pushed_data['announcement'] = announcement
    return announcement

# SSE事件流路由
@app.route('/events')
def sse_stream():
    def event_stream():
        while True:
            try:
                db = None
                # 檢查是否有新消息、頻道或公告更新
                if has_new_message(db) or has_new_channel(db) or has_new_announcement(db):
                    messages, active_users = get_new_messages(db)
                    data = {
                        'messages': messages,
                        'active_users': active_users,
                        'channels': get_new_channels(db),
                        'announcement': get_new_announcement(db)
                    }
                    yield f"data: {json.dumps(data)}\n\n"
                time.sleep(2)
            except Exception as e:
                print(f"SSE推送錯誤: {e}")
                time.sleep(10)  # 錯誤時等待更長時間
    return Response(stream_with_context(event_stream()), mimetype="text/event-stream")

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
        elif action == 'checkUserId':
            return check_user_id(request.args.get('userId'), request.args.get('userToken'))
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
        admin_actions = ['addChannel', 'updateChannel', 'updateAnnouncement', 'deleteChannel', 'deleteMessage']
        
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
        elif action == 'registerUserId':
            return register_user_id(data)
        elif action == 'releaseUserId':
            return release_user_id(data)
        elif action == 'userHeartbeat':
            return handle_user_heartbeat(data)
        elif action == 'deleteMessage':
            return delete_message(data, session_id)
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
        
        # 生成唯一消息ID
        message_id = str(uuid.uuid4())
        
        # 添加新消息
        db[collection_name].append({
            'id': message_id,
            'sender': sender,
            'content': content,
            'timestamp': timestamp,
            'deleted': False
        })
        
        # 保留最新的50條消息
        if len(db[collection_name]) > 50:
            db[collection_name] = db[collection_name][-50:]
        
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
        active_users = db.get('active_users', [])
        
        return jsonify({
            'success': True,
            'messages': messages,
            'active_users': active_users
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

# 檢查用戶ID是否存在
def check_user_id(user_id, user_token=None):
    try:
        if not user_id:
            return jsonify({
                'success': False,
                'error': '用戶ID不能為空'
            })
        
        db = load_db()
        active_users = db.get('active_users', [])
        user_tokens = db.get('user_tokens', {})
        
        # 檢查ID是否已經存在
        exists = user_id in active_users
        
        # 如果有提供token，檢查是否匹配
        if exists and user_token and user_id in user_tokens:
            exists = (user_tokens[user_id] == user_token)
        
            return jsonify({
                'success': True,
                'exists': False
            })
        else:
            return jsonify({
               'success': True,
                'exists': exists
            })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })

# 註冊用戶ID
def register_user_id(data):
    try:
        if isinstance(data, str):
            data = json.loads(data)
        
        user_id = data.get('userId')
        user_token = data.get('userToken')
        if not user_id or not user_token:
            return jsonify({
                'success': False,
                'error': '用戶ID和token不能為空'
            })
        
        db = load_db()
        active_users = set(db.get('active_users', [])) 
        user_tokens = db.get('user_tokens', {})
        
        # 檢查ID是否已經存在
        if user_id in active_users and user_id in user_tokens:
            # 如果token匹配，則允許使用現有ID
            if user_tokens[user_id] == user_token:
                return jsonify({
                    'success': True,
                    'exists': False
                })
            else:
                return jsonify({
                    'success': False,
                    'error': '用戶ID已存在',
                    'exists': True
                })
        
        # 添加新用戶ID和token
        active_users.add(user_id)
        user_tokens[user_id] = user_token
        db['active_users'] = list(active_users)
        db['user_tokens'] = user_tokens
        save_db(db)
        
        return jsonify({
            'success': True,
            'exists': False
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })

# 釋放用戶ID
def release_user_id(data):
    try:
        if isinstance(data, str):
            data = json.loads(data)
        
        user_id = data.get('userId')
        if not user_id:
            return jsonify({
                'success': False,
                'error': '用戶ID不能為空'
            })
        
        db = load_db()
        active_users = db.get('active_users', [])
        
        # 從活躍用戶列表中移除
        if user_id in active_users:
            active_users.remove(user_id)
            db['active_users'] = active_users
            save_db(db)
        
        return jsonify({
            'success': True
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })

# 處理用戶心跳
def handle_user_heartbeat(data):
    try:
        if isinstance(data, str):
            data = json.loads(data)
        
        user_id = data.get('userId')
        timestamp = data.get('timestamp', datetime.now().isoformat())
        
        if not user_id:
            return jsonify({
                'success': False,
                'error': '用戶ID不能為空'
            })
        
        db = load_db()
        
        # 更新用戶心跳時間
        user_heartbeats = db.get('user_heartbeats', {})
        user_heartbeats[user_id] = timestamp
        db['user_heartbeats'] = user_heartbeats
        
        # 確保用戶在活躍列表中
        active_users = set(db.get('active_users', [])) 
        if user_id not in active_users:
            active_users.add(user_id)
            db['active_users'] = list(active_users)
        
        save_db(db)
        
        return jsonify({
            'success': True
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })

# 刪除消息（僅管理員可用）
def delete_message(data, session_id):
    try:
        if not validate_admin_session(session_id):
            return jsonify({
                'success': False,
                'error': '需要管理員權限或會話已過期'
            })
            
        if isinstance(data, str):
            data = json.loads(data)
        
        content = data.get('content')
        sender = data.get('sender')
        timestamp = data.get('timestamp')
        channel = data.get('channel')
        
        if not all([content, sender, timestamp, channel]):
            return jsonify({
                'success': False,
                'error': '消息內容、發送者、時間戳記和頻道不能為空'
            })
        
        collection_name = f"{channel}_message"
        db = load_db()
        
        # 檢查集合是否存在
        if collection_name not in db:
            return jsonify({
                'success': False,
                'error': '頻道不存在'
            })
        
        # 查找消息並標記為已刪除
        message_found = False
        for message in db[collection_name]:
            if (message.get('content') == content and
                message.get('sender') == sender and
                message.get('timestamp') == timestamp):
                message['deleted'] = True
                message_found = True
                break
        
        if not message_found:
            return jsonify({
                'success': False,
                'error': '消息不存在'
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

# 清理過期用戶ID
def cleanup_expired_users():

    try:
        db = load_db()
        active_users = db.get('active_users', [])
        if len(active_users) == 0:
            return
        print(f'檢查用戶ID')
        
        user_tokens = db.get('user_tokens', {})
        user_heartbeats = db.get('user_heartbeats', {})
        current_time = time.time()
        cleaned = 0
        
        # 創建一個新的活躍用戶列表
        new_active_users = []
        
        for user_id in active_users:
            # 獲取最後心跳時間，如果沒有則設為0
            last_heartbeat = 0
            if user_id in user_heartbeats:
                try:
                    last_heartbeat = time.mktime( datetime.fromisoformat(user_heartbeats[user_id].replace('Z', '+00:00')).timetuple() )
                    
                except (ValueError, TypeError):
                    # 如果日期格式不正確，使用當前時間
                    last_heartbeat = 0
            print(f'用戶 {user_id} 心跳相差時間: {(current_time - last_heartbeat)}')
            if int(current_time - last_heartbeat) <= USER_HEARTBEAT_TIMEOUT:
                new_active_users.append(user_id)
            else:
                if user_id in user_heartbeats:
                    try:
                        del user_tokens[user_id]
                    except:
                        print(f"用戶 {user_id} 無 user_tokens")
                    del user_heartbeats[user_id]
                cleaned += 1
                print(f'用戶 {user_id} 超過 1分鐘 心跳，刪除')
        
        # 更新活躍用戶列表和心跳記錄
        db['active_users'] = new_active_users
        db['user_tokens'] = user_tokens
        db['user_heartbeats'] = user_heartbeats
        save_db(db)
        
        if cleaned > 0:
            print(f'已清理 {cleaned} 個過期用戶ID')
            
    except Exception as e:
        print(f'清理過期用戶ID錯誤: {e}')

# 初始化數據庫
init_db()

if __name__ == '__main__':

    # 啟動服務器
    port = int(os.environ.get('PORT', 5000))
    print(f"服務器運行在 http://localhost:{port}")
    print('請將前端API_URL更新為此地址')

    # # 啟動服務器，設定端口為 24068
    # port = int(os.environ.get('PORT', 24068))  # 預設端口改為 24068
    # print(f"服務器運行在 http://ouo.freeserver.tw:{port}")
    # print('請將前端API_URL更新為此地址')
    
    # 設置定期清理過期用戶ID的任務
    import threading
    def cleanup_task():
        while True:
            cleanup_expired_users()
            time.sleep(75)  # 每分鐘檢查一次
    
    # 啟動清理線程
    cleanup_thread = threading.Thread(target=cleanup_task)
    cleanup_thread.daemon = True  # 設置為守護線程，主程序結束時自動結束
    cleanup_thread.start()
    
    app.run(host='0.0.0.0', port=port, debug=True)