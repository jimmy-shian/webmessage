// Markdown格式支持

// 完整Markdown解析器
function parseMarkdown(text) {
    if (!text) return '';
    
    // 處理多行內容
    const lines = text.split('\n');
    let inCodeBlock = false;
    let inBlockquote = false;
    let inOrderedList = false;
    let inUnorderedList = false;
    let result = [];
    
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        
        // 處理代碼塊
        if (line.trim().startsWith('```')) {
            if (inCodeBlock) {
                result.push('</code></pre>');
                inCodeBlock = false;
            } else {
                const language = line.trim().substring(3).trim() || '';
                result.push(`<pre><code class="language-${language}">`);
                inCodeBlock = true;
            }
            continue;
        }
        
        if (inCodeBlock) {
            result.push(escapeHtml(line) + '\n');
            continue;
        }
        
        // 處理引用
        if (line.trim().startsWith('> ')) {
            if (!inBlockquote) {
                result.push('<blockquote>');
                inBlockquote = true;
            }
            line = line.substring(1).trim();
        } else if (inBlockquote) {
            result.push('</blockquote>');
            inBlockquote = false;
        }
        
        // 處理有序列表
        const orderedListMatch = line.match(/^(\d+)\.\s+(.*)/);
        if (orderedListMatch) {
            if (!inOrderedList) {
                result.push('<ol>');
                inOrderedList = true;
            }
            result.push(`<li>${parseInlineMarkdown(orderedListMatch[2])}</li>`);
            continue;
        } else if (inOrderedList) {
            result.push('</ol>');
            inOrderedList = false;
        }
        
        // 處理無序列表
        const unorderedListMatch = line.match(/^[-*+]\s+(.*)/);
        if (unorderedListMatch) {
            if (!inUnorderedList) {
                result.push('<ul>');
                inUnorderedList = true;
            }
            result.push(`<li>${parseInlineMarkdown(unorderedListMatch[1])}</li>`);
            continue;
        } else if (inUnorderedList) {
            result.push('</ul>');
            inUnorderedList = false;
        }
        
        // 處理標題
        const headingMatch = line.match(/^(#{1,6})\s+(.*)/);
        if (headingMatch) {
            const level = headingMatch[1].length;
            result.push(`<h${level}>${parseInlineMarkdown(headingMatch[2])}</h${level}>`);
            continue;
        }
        
        // 處理水平線
        if (line.match(/^[-*_]{3,}$/)) {
            result.push('<hr>');
            continue;
        }
        
        // 處理普通段落
        if (line.trim() !== '') {
            // 檢查是否是延續的段落內容
            if (i > 0 && lines[i-1].trim() !== '' && 
                !lines[i-1].trim().match(/^(#{1,6}|[-*+]|\d+\.|>|```)/)) {
                // 合併到上一個段落
                const lastIndex = result.length - 1;
                result[lastIndex] = result[lastIndex].replace(/<\/p>$/, '') + ' ' + parseInlineMarkdown(line) + '</p>';
            } else {
                result.push(`<p>${parseInlineMarkdown(line)}</p>`);
            }
        } else {
            // 空行，添加換行
            result.push('<br>');
        }
    }
    
    // 關閉所有未關閉的標籤
    if (inCodeBlock) result.push('</code></pre>');
    if (inBlockquote) result.push('</blockquote>');
    if (inOrderedList) result.push('</ol>');
    if (inUnorderedList) result.push('</ul>');
    
    return result.join('\n');
}

// 解析行內Markdown語法
function parseInlineMarkdown(text) {
    if (!text) return '';
    
    // 轉義HTML特殊字符
    let parsed = escapeHtml(text);
    
    // 圖片 ![alt](url)
    parsed = parsed.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, 
        (match, alt, src) => {
            // 檢查是否為圖片鏈接
            const isImage = /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(src.split('?')[0]);
            if (isImage) {
                return `<img src="${src}" alt="${alt || ''}" class="user-uploaded-image" loading="lazy">`;
            } else {
                // 如果不是圖片，則顯示為普通鏈接
                return `<a href="${src}" target="_blank" rel="noopener noreferrer">${alt || src}</a>`;
            }
        });
    
    // 鏈接 [text](url)
    parsed = parsed.replace(/\[([^\]]+)\]\(([^)]+)\)/g, 
        '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    
    // 自動鏈接 <https://example.com>
    parsed = parsed.replace(/<((https?:\/\/|www\.)[^\s>]+)>/g, 
        (match, url) => {
            const href = url.startsWith('http') ? url : `http://${url}`;
            return `<a href="${href}" target="_blank" rel="noopener noreferrer">${url}</a>`;
        });
    
    // 行內代碼 `code`
    parsed = parsed.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // 加粗 **text** 或 __text__
    parsed = parsed.replace(/\*\*([^*]+?)\*\*|__([^_]+?)__/g, '<strong>$1$2</strong>');
    
    // 斜體 *text* 或 _text_
    parsed = parsed.replace(/\*([^*]+?)\*|_([^_]+?)_/g, '<em>$1$2</em>');
    
    // 刪除線 ~~text~~
    parsed = parsed.replace(/~~(.*?)~~/g, '<del>$1</del>');
    
    // 隱藏文字 ||text||
    parsed = parsed.replace(/\|\|(.*?)\|\|/g, '<span class="spoiler">$1</span>');
    
    // 換行
    parsed = parsed.replace(/\n/g, '<br>');
    
    return parsed;
}

// 轉義HTML特殊字符
function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// 導出函數
window.parseMarkdown = parseMarkdown;