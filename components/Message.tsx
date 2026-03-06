import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { type ChatMessage, MessageRole } from '../types';
import { AivaAvatar } from './icons';

interface MessageProps {
    message: ChatMessage;
}

const Message: React.FC<MessageProps> = ({ message }) => {
    const isModel = message.role === MessageRole.MODEL;
    
    return (
        <div className={`flex items-start gap-3 ${!isModel ? 'justify-end' : ''}`}>
            {isModel && <AivaAvatar />}
            <div
                className={`flex flex-col ${
                    isModel ? 'items-start' : 'items-end'
                }`}
            >
                <div
                    className={`max-w-md md:max-w-lg px-4 py-2 rounded-2xl ${
                        isModel
                            ? 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-bl-none'
                            : 'bg-brand-primary text-white rounded-br-none'
                    }`}
                >
                    {message.attachment && (
                        <div className="mb-2">
                            <img src={message.attachment.url} alt="attachment" className="max-w-xs rounded-lg" />
                        </div>
                    )}
                    <div className="prose prose-sm dark:prose-invert max-w-none break-words">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Message;
