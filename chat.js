// Additional chat functionality can be added here
class ChatManager {
    constructor() {
        this.emojiMap = this.createEmojiMap();
    }

    createEmojiMap() {
        return {
            ':)': '😊',
            ':-)': '😊',
            ':(': '😞',
            ':-(': '😞',
            ':D': '😃',
            ':-D': '😃',
            ';)': '😉',
            ';-)': '😉',
            ':P': '😛',
            ':-P': '😛',
            ':O': '😮',
            ':-O': '😮',
            ':*': '😘',
            ':-*': '😘',
            '<3': '❤️'
        };
    }

    replaceEmoticons(text) {
        let newText = text;
        Object.keys(this.emojiMap).forEach(emoticon => {
            const regex = new RegExp(this.escapeRegExp(emoticon), 'g');
            newText = newText.replace(regex, this.emojiMap[emoticon]);
        });
        return newText;
    }

    escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    highlightMentions(text) {
        return text.replace(/@(\w+)/g, '<span class="mention">@$1</span>');
    }

    formatMessage(text) {
        let formattedText = this.replaceEmoticons(text);
        formattedText = this.highlightMentions(formattedText);
        formattedText = formattedText.replace(/\n/g, '<br>');
        return formattedText;
    }
}

// Initialize chat manager
window.chatManager = new ChatManager();