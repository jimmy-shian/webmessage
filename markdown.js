// Markdown格式支持

// 簡易Markdown解析器
function parseMarkdown(text) {
    if (!text) return '';
    
    // 轉義HTML特殊字符
    let parsed = text.replace(/&/g, '&amp;')
                     .replace(/</g, '&lt;')
                     .replace(/>/g, '&gt;');
    
    // 加粗 **文字** 或 __文字__
    parsed = parsed.replace(/\*\*(.*?)\*\*|__(.*?)__/g, '<strong>$1$2</strong>');
    
    // 斜體 *文字* 或 _文字_
    parsed = parsed.replace(/\*(.*?)\*|_(.*?)_/g, '<em>$1$2</em>');
    
    // 刪除線 ~~文字~~
    parsed = parsed.replace(/~~(.*?)~~/g, '<del>$1</del>');
    
    // 代碼 `文字`
    parsed = parsed.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // 隱藏文字 ||文字||
    parsed = parsed.replace(/\|\|(.*?)\|\|/g, '<span class="spoiler">$1</span>');
    
    // 換行
    parsed = parsed.replace(/\n/g, '<br>');
    
    return parsed;
}

// 導出函數
window.parseMarkdown = parseMarkdown;