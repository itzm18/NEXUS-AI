import { Attachment, Conversation } from '../types';

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function detectFileType(file: File): Attachment['type'] {
  const mime = file.type.toLowerCase();
  const name = file.name.toLowerCase();

  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('audio/')) return 'audio';
  if (mime === 'application/pdf' || name.endsWith('.pdf')) return 'pdf';
  if (
    mime.includes('javascript') ||
    mime.includes('typescript') ||
    mime.includes('python') ||
    mime.includes('json') ||
    name.endsWith('.ts') ||
    name.endsWith('.tsx') ||
    name.endsWith('.js') ||
    name.endsWith('.jsx') ||
    name.endsWith('.py') ||
    name.endsWith('.css') ||
    name.endsWith('.html') ||
    name.endsWith('.json') ||
    name.endsWith('.sql') ||
    name.endsWith('.sh') ||
    name.endsWith('.yaml') ||
    name.endsWith('.yml')
  ) {
    return 'code';
  }
  return 'text';
}

export async function processFileToAttachment(file: File): Promise<Attachment> {
  const type = detectFileType(file);

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async () => {
      const dataUrl = reader.result as string;
      const base64Data = dataUrl.split(',')[1] || '';

      let textPreview: string | undefined = undefined;
      if (type === 'text' || type === 'code' || file.name.endsWith('.csv') || file.name.endsWith('.md')) {
        try {
          const textContent = await file.text();
          textPreview = textContent.slice(0, 10000); // preview up to 10k chars
        } catch {
          // ignore
        }
      }

      resolve({
        id: 'att_' + Math.random().toString(36).substring(2, 9),
        name: file.name,
        mimeType: file.type || 'application/octet-stream',
        size: file.size,
        data: base64Data,
        url: type === 'image' || type === 'audio' ? dataUrl : undefined,
        type,
        textPreview,
      });
    };

    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

export function exportConversationAsMarkdown(conv: Conversation): string {
  const dateStr = new Date(conv.createdAt).toLocaleString();
  let md = `# ${conv.title}\n*Created: ${dateStr}*\n\n---\n\n`;

  if (conv.systemPrompt) {
    md += `> **System Prompt:**\n> ${conv.systemPrompt.replace(/\n/g, '\n> ')}\n\n---\n\n`;
  }

  for (const msg of conv.messages) {
    const roleTitle = msg.role === 'user' ? '👤 User' : '🤖 NexusAI';
    const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    md += `### ${roleTitle} (${time})\n\n`;

    if (msg.thought) {
      md += `<details>\n<summary>Thinking Process</summary>\n\n${msg.thought}\n</details>\n\n`;
    }

    if (msg.attachments && msg.attachments.length > 0) {
      md += `*Attached files: ${msg.attachments.map(a => a.name).join(', ')}*\n\n`;
    }

    md += `${msg.content}\n\n---\n\n`;
  }

  return md;
}

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function estimateTokenCount(text: string): number {
  if (!text) return 0;
  // Approximation ~4 chars per token
  return Math.ceil(text.length / 4);
}
