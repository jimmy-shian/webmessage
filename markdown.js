// Markdown格式支持

// 解析Markdown文本
function parseMarkdown(text) {
    if (!text) return '';
    
    // 處理內聯格式（粗體、斜體、刪除線、隱藏文字、行內代碼、連結、圖片）
    function parseInline(text) {
        if (!text) return '';
        console.log(text);
        // 圖片 ![alt](url)
        text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, 
            (match, alt, src) => {
                console.log(src);
                // 檢查是否為圖片鏈接
                const isImage = /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(src.split('?')[0]);
                if (isImage) {
                    return `<a href="${src}" target="_blank" rel="noopener noreferrer"><img src="${src}" alt="${alt || ''}" class="user-uploaded-image" loading="lazy"></a>`;
                }
            });
        
        // 鏈接 [text](url)
        text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, 
            '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
        
        // 自動鏈接 <https://example.com>
        text = text.replace(/<((?:https?:\/\/|www\.)[^\s<>]+)>/g, 
        (match, url) => {
            // 移除可能的跳脫字元
            url = url.replace(/\([\(\)\[\]]\)/g, '$1')
                    .replace(/^<|>$/g, '')
                    .trim();
            const href = url.startsWith('http') ? url : `http://${url}`;
            return `<a href="${href}" target="_blank" rel="noopener noreferrer">${url}</a>`;
        });
    
        // 純文字URL自動轉為連結 (不需要 < > 包裹)
        text = text.replace(/(?<!["'])(https?:\/\/[^\s<>\)\]\{\}\|`]+)/g, 
            (url) => {
                // 確保URL沒有被其他標籤包裹
                if (url.match(/<[^>]*$/)) return url;
                const href = url.startsWith('http') ? url : `http://${url}`;
                return `<a href="${href}" target="_blank" rel="noopener noreferrer">${url}</a>`;
            });
        
        // 處理粗體 **text** 或 __text__
        text = text.replace(/\*\*([^*]+?)\*\*|__([^_]+?)__/g, 
            '<strong>$1$2</strong>');
            
        // 處理斜體 *text* 或 _text_
        text = text.replace(/\*([^*]+?)\*|_([^_]+?)_/g, 
            '<em>$1$2</em>');
            
        // 處理刪除線 ~~text~~
        text = text.replace(/~~([^~]+)~~/g, 
            '<del>$1</del>');
            
        // 處理隱藏文字 ||text||
        text = text.replace(/\|\|([^|]+)\|\|/g, 
            '<span class="spoiler">$1</span>');
            
        // 處理行內代碼 `code`
        text = text.replace(/`([^`]+)`/g, 
            '<code class="inline-code">$1</code>');
            
        // 使用正則表達式替換所有 <em> 和 </em> 標籤為底線
        return text.replace(/<\/em>|<em>/g, "_");
    }
    
    // 處理程式碼區塊
    function parseCodeBlock(text, language = '') {
        if (!text) return '';
        const langClass = language ? ` class="language-${language}"` : '';
        return `<pre><code${langClass}>${escapeHtml(text)}</code></pre>`;
    }
    
    const lines = text.split('\n');
    let result = [];
    let inOrderedList = false;
    let inUnorderedList = false;
    let inBlockquote = false;
    let inCodeBlock = false;
    let codeBlockContent = [];
    let codeBlockLanguage = '';
    
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        
        // 處理程式碼區塊
        if (line.startsWith('```')) {
            if (inCodeBlock) {
                // 結束程式碼區塊
                result.push(parseCodeBlock(codeBlockContent.join('\n'), codeBlockLanguage));
                inCodeBlock = false;
                codeBlockContent = [];
                codeBlockLanguage = '';
            } else {
                // 開始新的程式碼區塊
                inCodeBlock = true;
                codeBlockLanguage = line.substring(3).trim();
            }
            continue;
        }
        
        if (inCodeBlock) {
            codeBlockContent.push(line);
            continue;
        }
        
        // 處理分隔線
        if (line === '---' || line === '***') {
            result.push('<hr>');
            continue;
        }
        
        // 處理空行
        if (!line) {
            if (inOrderedList || inUnorderedList) {
                result.push('');
            } else {
                result.push('');
            }
            continue;
        }
        
        // 處理區塊引用
        if (line.startsWith('>')) {
            const content = line.substring(1).trim();
            const isList = content.match(/^(\d+\.|[-*+])\s+/);
            
            // 如果是新的區塊引用，開始一個新的區塊引用
            if (!inBlockquote) {
                // 關閉之前的列表（如果有的話）
                if (inOrderedList) {
                    result.push('</ol>');
                    inOrderedList = false;
                } else if (inUnorderedList) {
                    result.push('</ul>');
                    inUnorderedList = false;
                }
                result.push('<blockquote>');
                inBlockquote = true;
                
                // 如果是列表項目，開始對應的列表
                if (content.match(/^\d+\.\s+/)) {
                    result.push('<ol start="1">');
                    inOrderedList = true;
                } else if (content.match(/^[-*+]\s+/)) {
                    result.push('<ul>');
                    inUnorderedList = true;
                }
            }
            
            // 處理區塊引用中的內容
            if (content.match(/^\d+\.\s+/)) {
                // 如果當前不在有序列表中，開始一個新的有序列表
                if (!inOrderedList) {
                    if (inUnorderedList) {
                        result.push('</ul>');
                        inUnorderedList = false;
                    }
                    result.push('<ol start="1">');
                    inOrderedList = true;
                }
                const itemText = content.replace(/^\d+\.\s*/, '');
                result.push(`<li data-text="1.">${escapeHtml(itemText)}</li>`);
            } else if (content.match(/^[-*+]\s+/)) {
                // 如果是無序列表，直接添加 <li> 而不包裝 <ul>
                if (inOrderedList) {
                    result.push('</ol>');
                    inOrderedList = false;
                } else if (inUnorderedList) {
                    result.push('</ul>');
                    inUnorderedList = false;
                }
                const itemText = content.replace(/^[-*+]\s*/, '');
                result.push(`<li data-text="-">${escapeHtml(itemText)}</li>`);
            } else {
                // 如果不是列表項目，確保關閉之前的列表
                if (inOrderedList) {
                    result.push('</ol>');
                    inOrderedList = false;
                } else if (inUnorderedList) {
                    result.push('</ul>');
                    inUnorderedList = false;
                }
                result.push(`<p>${escapeHtml(content)}</p>`);
            }
            
            // 檢查是否需要關閉區塊引用
            if (i === lines.length - 1 || !lines[i + 1].trim().startsWith('>')) {
                if (inOrderedList) {
                    result.push('</ol>');
                    inOrderedList = false;
                } else if (inUnorderedList) {
                    result.push('</ul>');
                    inUnorderedList = false;
                }
                if (inBlockquote) {
                    result.push('</blockquote>');
                    inBlockquote = false;
                }
            }
            continue;
        }
        
        // 處理有序列表
        if (line.match(/^\d+\.\s+/)) {
            if (!inOrderedList) {
                if (inUnorderedList) {
                    result.push('</ul>');
                    inUnorderedList = false;
                }
                result.push('<ol>');
                inOrderedList = true;
            }
            const itemText = line.replace(/^\d+\.\s*/, '');
            result.push(`<li data-text="${line.match(/^\d+/)[0]}.">${escapeHtml(itemText)}</li>`);
            continue;
        }
        
        // 處理無序列表
        if (line.match(/^[-*+]\s+/)) {
            if (!inUnorderedList) {
                if (inOrderedList) {
                    result.push('</ol>');
                    inOrderedList = false;
                }
                result.push('<ul>');
                inUnorderedList = true;
            }
            const itemText = line.replace(/^[-*+]\s*/, '');
            result.push(`<li data-text="-">${escapeHtml(itemText)}</li>`);
            continue;
        }
        
        // 處理普通段落
        if (inOrderedList) {
            result.push('</ol>');
            inOrderedList = false;
        } else if (inUnorderedList) {
            result.push('</ul>');
            inUnorderedList = false;
        }
        
        // 處理標題
        const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
        if (headingMatch) {
            const level = headingMatch[1].length;
            const content = headingMatch[2].trim();
            result.push(`<h${level}>${parseInline(content)}</h${level}>`);
            continue;
        }
        
        // 處理普通文本
        result.push(`<p>${parseInline(line)}</p>`);
    }
    
    // 關閉所有未關閉的標籤
    if (inOrderedList) result.push('</ol>');
    if (inUnorderedList) result.push('</ul>');
    if (inBlockquote) result.push('</blockquote>');
    if (inCodeBlock) result.push(parseCodeBlock(codeBlockContent.join('\n'), codeBlockLanguage));
    
    return result.join('\n');
}

// 轉義HTML特殊字符
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
