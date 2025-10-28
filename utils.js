class Utils {
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    static generateId() {
        return Math.random().toString(36).substr(2, 9);
    }

    static formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    static isValidImage(file) {
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        return validTypes.includes(file.type);
    }

    static getFileIcon(type) {
        const icons = {
            'pdf': 'fas fa-file-pdf',
            'word': 'fas fa-file-word',
            'excel': 'fas fa-file-excel',
            'image': 'fas fa-file-image',
            'audio': 'fas fa-file-audio',
            'video': 'fas fa-file-video',
            'archive': 'fas fa-file-archive',
            'default': 'fas fa-file'
        };

        if (type.includes('pdf')) return icons.pdf;
        if (type.includes('word') || type.includes('document')) return icons.word;
        if (type.includes('excel') || type.includes('spreadsheet')) return icons.excel;
        if (type.includes('image')) return icons.image;
        if (type.includes('audio')) return icons.audio;
        if (type.includes('video')) return icons.video;
        if (type.includes('zip') || type.includes('rar') || type.includes('tar')) return icons.archive;
        
        return icons.default;
    }

    static formatMessageTime(timestamp) {
        const now = new Date();
        const messageTime = new Date(timestamp);
        const diffInHours = (now - messageTime) / (1000 * 60 * 60);

        if (diffInHours < 24) {
            return messageTime.toLocaleTimeString('fa-IR', {
                hour: '2-digit',
                minute: '2-digit'
            });
        } else {
            return messageTime.toLocaleDateString('fa-IR') + ' ' + 
                   messageTime.toLocaleTimeString('fa-IR', {
                       hour: '2-digit',
                       minute: '2-digit'
                   });
        }
    }
}