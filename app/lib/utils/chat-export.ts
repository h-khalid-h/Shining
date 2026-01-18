import { type Message } from '~/types/message';

export function exportChatToMarkdown(messages: Message[], chatDescription?: string): string {
    const timestamp = new Date().toLocaleString();
    const title = chatDescription || 'Chat Export';

    let markdown = `# ${title}\n\n`;
    markdown += `*Exported on ${timestamp}*\n\n---\n\n`;

    messages.forEach((message, index) => {
        const role = message.role === 'user' ? '👤 User' : '🤖 Assistant';
        markdown += `## ${role}\n\n`;
        markdown += `${message.content}\n\n`;

        if (index < messages.length - 1) {
            markdown += '---\n\n';
        }
    });

    return markdown;
}

export function downloadMarkdown(content: string, filename: string = 'chat-export.md') {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

export function exportChatToJSON(messages: Message[], chatDescription?: string): string {
    return JSON.stringify({
        description: chatDescription,
        exportedAt: new Date().toISOString(),
        messages: messages.map(m => ({
            role: m.role,
            content: m.content,
        })),
    }, null, 2);
}

export function downloadJSON(content: string, filename: string = 'chat-export.json') {
    const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
