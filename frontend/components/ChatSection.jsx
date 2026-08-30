import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { getSocket } from '../services/socket';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';

const QUICK_PROMPTS = [
  'I am heading out now 🏃',
  'Reached the store 🛒',
  'Item is out of stock, should I substitute?',
  'At your hostel gate 📍',
  'Delivered at your door! 📦',
];

export default function ChatSection({ errand, currentUser }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [peerTyping, setPeerTyping] = useState(null);

  const flatListRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Fetch past message history via REST API
  const fetchMessages = useCallback(async () => {
    try {
      const response = await api.get(`/errands/${errand._id}/messages`);
      setMessages(response.data.messages || []);
    } catch (error) {
      console.warn('[Fetch messages error]', error);
    } finally {
      setLoading(false);
    }
  }, [errand._id]);

  useEffect(() => {
    fetchMessages();

    const socket = getSocket();

    // Listen for incoming live chat messages
    const handleReceiveMessage = (newMsg) => {
      if (newMsg && newMsg.errandId === errand._id) {
        setMessages((prev) => {
          // Avoid duplicates
          if (prev.some((m) => m._id === newMsg._id)) {
            return prev;
          }
          return [...prev, newMsg];
        });
      }
    };

    // Listen for peer typing indicator
    const handleUserTyping = (data) => {
      if (data?.isTyping) {
        setPeerTyping(data.userName || 'Peer');
      } else {
        setPeerTyping(null);
      }
    };

    socket.on('receive_message', handleReceiveMessage);
    socket.on('user_typing', handleUserTyping);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
      socket.off('user_typing', handleUserTyping);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [errand._id, fetchMessages]);

  // Send message over Socket.io
  const handleSendMessage = (textToSend) => {
    const content = (textToSend || inputText).trim();
    if (!content) return;

    const socket = getSocket();
    socket.emit('send_message', {
      errandId: errand._id,
      senderId: currentUser?._id,
      text: content,
    });

    // Stop typing indicator immediately
    socket.emit('typing_stop', { errandId: errand._id });
    setInputText('');
  };

  // Handle typing indicator with debounce
  const handleTextChange = (text) => {
    setInputText(text);

    const socket = getSocket();
    socket.emit('typing_start', {
      errandId: errand._id,
      userName: currentUser?.name || 'User',
    });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing_stop', { errandId: errand._id });
    }, 2000);
  };

  const renderMessageItem = ({ item }) => {
    const isMe =
      item.senderId?._id === currentUser?._id ||
      item.senderId === currentUser?._id;

    const senderName = item.senderId?.name || (isMe ? 'You' : 'Peer');
    const timeFormatted = new Date(item.createdAt).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <View
        style={[
          styles.messageRow,
          isMe ? styles.messageRowMe : styles.messageRowOther,
        ]}
      >
        {!isMe ? (
          <View style={styles.senderAvatar}>
            <Text style={styles.senderAvatarText}>
              {senderName.charAt(0).toUpperCase()}
            </Text>
          </View>
        ) : null}

        <View
          style={[
            styles.messageBubble,
            isMe ? styles.messageBubbleMe : styles.messageBubbleOther,
          ]}
        >
          {!isMe ? <Text style={styles.senderNameLabel}>{senderName}</Text> : null}
          <Text
            style={[
              styles.messageText,
              isMe ? styles.messageTextMe : styles.messageTextOther,
            ]}
          >
            {item.text}
          </Text>
          <Text
            style={[
              styles.messageTime,
              isMe ? styles.messageTimeMe : styles.messageTimeOther,
            ]}
          >
            {timeFormatted}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header Info Banner */}
      <View style={styles.chatHeader}>
        <Ionicons name="chatbubbles" size={18} color={Colors.primary} />
        <Text style={styles.chatHeaderTitle}>
          Coordination Chat • {errand.title}
        </Text>
      </View>

      {/* Messages List */}
      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator color={Colors.primary} size="large" />
          <Text style={styles.loadingText}>Loading messages...</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item._id || Math.random().toString()}
          renderItem={renderMessageItem}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubble-ellipses-outline" size={44} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No messages yet</Text>
              <Text style={styles.emptySubtitle}>
                Coordinate pickup, substitutions, or delivery details in real time.
              </Text>
            </View>
          }
        />
      )}

      {/* Peer Typing Indicator */}
      {peerTyping ? (
        <View style={styles.typingBanner}>
          <Ionicons name="ellipsis-horizontal" size={16} color={Colors.primary} />
          <Text style={styles.typingText}>{peerTyping} is typing...</Text>
        </View>
      ) : null}

      {/* Quick Suggestion Prompts */}
      <View style={styles.quickPromptsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickPromptsScroll}>
          {QUICK_PROMPTS.map((prompt, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.quickPromptChip}
              onPress={() => handleSendMessage(prompt)}
            >
              <Text style={styles.quickPromptText}>{prompt}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Input Bar */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder="Type a message to peer..."
          placeholderTextColor={Colors.textMuted}
          value={inputText}
          onChangeText={handleTextChange}
          multiline
          maxLength={500}
        />

        <TouchableOpacity
          style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
          onPress={() => handleSendMessage()}
          disabled={!inputText.trim()}
        >
          <Ionicons name="send" size={18} color={Colors.white} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 520,
    backgroundColor: Colors.background,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  chatHeaderTitle: {
    fontSize: Typography.xs,
    fontWeight: 'bold',
    color: Colors.text,
  },
  messageList: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 3,
  },
  messageRowMe: {
    justifyContent: 'flex-end',
  },
  messageRowOther: {
    justifyContent: 'flex-start',
  },
  senderAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
    marginBottom: 2,
  },
  senderAvatarText: {
    fontSize: Typography.xs,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  messageBubble: {
    maxWidth: '78%',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  messageBubbleMe: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 2,
  },
  messageBubbleOther: {
    backgroundColor: Colors.card,
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  senderNameLabel: {
    fontSize: Typography.xs - 2,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 2,
  },
  messageText: {
    fontSize: Typography.sm,
    lineHeight: 18,
  },
  messageTextMe: {
    color: Colors.white,
  },
  messageTextOther: {
    color: Colors.text,
  },
  messageTime: {
    fontSize: Typography.xs - 3,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  messageTimeMe: {
    color: 'rgba(255,255,255,0.7)',
  },
  messageTimeOther: {
    color: Colors.textMuted,
  },
  typingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
  },
  typingText: {
    fontSize: Typography.xs - 1,
    color: Colors.primary,
    fontStyle: 'italic',
  },
  quickPromptsWrapper: {
    paddingVertical: 6,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  quickPromptsScroll: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs,
  },
  quickPromptChip: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  quickPromptText: {
    fontSize: Typography.xs - 1,
    color: Colors.primaryDark,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.sm,
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 90,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    fontSize: Typography.sm,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: Colors.border,
  },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.xs,
    fontSize: Typography.xs,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
    gap: Spacing.xs,
  },
  emptyTitle: {
    fontSize: Typography.base,
    fontWeight: 'bold',
    color: Colors.text,
  },
  emptySubtitle: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  },
});
