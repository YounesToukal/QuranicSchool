import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { messageApi } from '@/lib/api';
import { MessageCircle, Trash2, Eye, Mail, MailOpen, User, Calendar, AtSign } from 'lucide-react';

interface Message {
  id: number;
  sender_id: number;
  sender_name: string;
  sender_role: string;
  subject: string;
  message: string;
  is_read: boolean;
  created_at: string;
  reply_email?: string;
  message_type?: string;
}

interface AdminMessagesPanelProps {
  onCountChange?: () => void;
}

export default function AdminMessagesPanel({ onCountChange }: AdminMessagesPanelProps) {
  const { t, i18n } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await messageApi.getAllMessages();
      setMessages(response.data);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await messageApi.markAsRead(id);
      setMessages(messages.map(msg =>
        msg.id === id ? { ...msg, is_read: true } : msg
      ));
      if (selectedMessage?.id === id) {
        setSelectedMessage({ ...selectedMessage, is_read: true });
      }
      onCountChange?.();
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('admin.messagesDeleteConfirm'))) return;
    try {
      await messageApi.deleteMessage(id);
      setMessages(messages.filter(msg => msg.id !== id));
      if (selectedMessage?.id === id) setSelectedMessage(null);
      onCountChange?.();
    } catch (error) {
      console.error('Error deleting message:', error);
      alert(t('common.errorDeletingMessage'));
    }
  };

  const handleMessageClick = (message: Message) => {
    setSelectedMessage(message);
    if (!message.is_read) handleMarkAsRead(message.id);
  };

  const formatDate = (dateString: string) => {
    const locale = i18n.language === 'ar' ? 'ar-DZ' : 'fr-FR';
    return new Date(dateString).toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRoleBadge = (role: string) => {
    if (role === 'teacher') {
      return (
        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
          {t('admin.roleTeacher')}
        </span>
      );
    }
    if (role === 'visitor') {
      return (
        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">
          {t('admin.roleVisitor')}
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
        {t('admin.roleParent')}
      </span>
    );
  };

  const filteredMessages = filter === 'unread'
    ? messages.filter(msg => !msg.is_read)
    : messages;

  const unreadCount = messages.filter(msg => !msg.is_read).length;

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-primary flex items-center gap-2">
          <MessageCircle className="w-6 h-6" />
          {t('admin.messagesTab')}
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
              {unreadCount}
            </span>
          )}
        </h3>

        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              filter === 'all'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {t('admin.messagesAll')} ({messages.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              filter === 'unread'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {t('admin.messagesUnread')} ({unreadCount})
          </button>
        </div>
      </div>

      {filteredMessages.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <MessageCircle className="w-16 h-16 mx-auto mb-3 opacity-30" />
          <p>{t('admin.messagesNone')}</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-4">
          {/* Messages List */}
          <div className="lg:col-span-1 space-y-2 max-h-[600px] overflow-y-auto">
            {filteredMessages.map((message) => (
              <div
                key={message.id}
                onClick={() => handleMessageClick(message)}
                className={`p-3 border rounded-lg cursor-pointer transition-all ${
                  selectedMessage?.id === message.id
                    ? 'border-primary bg-primary/5'
                    : message.is_read
                    ? 'border-gray-200 hover:border-gray-300 bg-white'
                    : 'border-primary/30 bg-primary/5 hover:border-primary/50'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {message.is_read ? (
                      <MailOpen className="w-4 h-4 text-gray-400" />
                    ) : (
                      <Mail className="w-4 h-4 text-primary" />
                    )}
                    <span className={`text-sm font-medium ${
                      message.is_read ? 'text-gray-600' : 'text-gray-900'
                    }`}>
                      {message.sender_name}
                    </span>
                  </div>
                  {getRoleBadge(message.sender_role)}
                </div>
                <div className={`text-sm mb-1 ${
                  message.is_read ? 'text-gray-700' : 'text-gray-900 font-semibold'
                }`}>
                  {message.subject}
                </div>
                <div className="text-xs text-gray-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(message.created_at)}
                </div>
              </div>
            ))}
          </div>

          {/* Message Detail */}
          <div className="lg:col-span-2">
            {selectedMessage ? (
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-4 pb-4 border-b">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-5 h-5 text-gray-400" />
                      <span className="font-semibold text-lg">{selectedMessage.sender_name}</span>
                      {getRoleBadge(selectedMessage.sender_role)}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(selectedMessage.created_at)}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(selectedMessage.id)}
                    className="text-red-500 hover:text-red-700 transition-colors p-2"
                    title={t('common.delete')}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                <h4 className="text-xl font-semibold mb-3 text-primary">
                  {selectedMessage.subject}
                </h4>

                {selectedMessage.reply_email && (
                  <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-primary/5 border border-primary/15 rounded-lg">
                    <AtSign className="w-4 h-4 text-primary/60 flex-shrink-0" />
                    <span className="text-xs text-gray-500">{i18n.language === 'ar' ? 'بريد الرد:' : 'Répondre à :'}</span>
                    <a
                      href={`mailto:${selectedMessage.reply_email}`}
                      className="text-sm font-medium text-primary hover:underline truncate"
                      dir="ltr"
                    >
                      {selectedMessage.reply_email}
                    </a>
                  </div>
                )}

                <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {selectedMessage.message}
                </div>

                {!selectedMessage.is_read && (
                  <button
                    onClick={() => handleMarkAsRead(selectedMessage.id)}
                    className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    {t('admin.messagesMarkRead')}
                  </button>
                )}
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg p-12 text-center text-gray-400">
                <MessageCircle className="w-16 h-16 mx-auto mb-3 opacity-30" />
                <p>{t('admin.messagesSelectPrompt')}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
