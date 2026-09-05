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
import { Send, MessageSquare, Clock, Sparkles, ShieldCheck } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import api from '../services/api';
import { getSocket } from '../services/socket';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../constants/theme';

const QUICK_PROMPTS = [
  'I am heading out now 🏃',
  'Reached the store 🛒',
  'Item is out of stock, should I substitute?',
  'At your hostel gate 📍',
  'Delivered at your door! 📦',
];

/**
 * ChatSection Component
 * Dual REST & WebSocket communication channel between Requester and Runner.
 */
export default function ChatSection({ errand, currentUser }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [peerTyping, setPeerTyping] = useState(null);

  const flatListRef = useRef(null);
  const typingTimeoutRef = useRef(null);

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
    const roomName = `errand_${errand._id}`;

    socket.emit('join_errand_room', {
      errandId: errand._id,
      user: { _id: currentUser?._id, name: currentUser?.name },
    });

    const handleReceiveMessage = (newMessage) => {
      setMessages((prev) => {
        const exists = prev.some((m) => m._id === newMessage._id);
        if (exists) return prev;
        return [...prev, newMessage];
      });
      setPeerTyping(null);
    };

    const handlePeerTyping = (data) => {
      if (data.userId !== currentUser?._id) {
        setPeerTyping(data.userName || 'Peer');
      }
    };

    const handlePeerStopTyping = (data) => {
      if (data.userId !== currentUser?._id) {
        setPeerTyping(null);
      }
    };

    socket.on('receive_message', handleReceiveMessage);
    socket.on('peer_typing', handlePeerTyping);
    socket.on('peer_stop_typing', handlePeerStopTyping);

    return () => {
      socket.emit('leave_errand_room', { errandId: errand._id });
      socket.off('receive_message', handleReceiveMessage);
      socket.off('peer_typing', handlePeerTyping);
      socket.off('peer_stop_typing', handlePeerStopTyping);
    };
  }, [errand._id, currentUser, fetchMessages]);

  const handleTextChange = (text) => {
    setInputText(text);

    const socket = getSocket();
    if (text.length > 0) {
      socket.emit('typing_start', {
        errandId: errand._id,
        user: { _id: currentUser?._id, name: currentUser?.name },
      });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing_stop', {
          errandId: errand._id,
          user: { _id: currentUser?._id, name: currentUser?.name },
        });
      }, 2000);
    } else {
      socket.emit('typing_stop', {
        errandId: errand._id,
        user: { _id: currentUser?._id, name: currentUser?.name },
      });
    }
  };

  const handleSendMessage = async (customText) => {
    const textToSend = customText || inputText;
    if (!textToSend.trim()) return;

    if (!customText) setInputText('');

    const socket = getSocket();
    socket.emit('typing_stop', {
      errandId: errand._id,
      user: { _id: currentUser?._id, name: currentUser?.name },
    });

    try {
      const response = await api.post(`/errands/${errand._id}/messages`, {
        text: textToSend.trim(),
      });

      const sentMsg = response.data.data;
      setMessages((prev) => {
        const exists = prev.some((m) => m._id === sentMsg._id);
        if (exists) return prev;
        return [...prev, sentMsg];
      });

      socket.emit('send_message', {
        errandId: errand._id,
        message: sentMsg,
      });
    } catch (error) {
      console.warn('[Send message error]', error);
    }
  };

  const renderMessageItem = ({ item }) => {
    const isMe =
      item.senderId?._id === currentUser?._id || item.senderId === currentUser?._id;

    return (
      <View style={[styles.messageRow, isMe ? styles.messageRowMe : styles.messageRowOther]}>
        {!isMe ? (
          <View style={styles.senderAvatar}>
            <Text style={styles.senderAvatarText}>
              {item.senderId?.name ? item.senderId.name.charAt(0).toUpperCase() : 'P'}
            </Text>
          </View>
        ) : null}

        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
          {!isMe && item.senderId?.name ? (
            <Text style={styles.senderName}>{item.senderId.name}</Text>
          ) : null}
          <Text style={[styles.messageText, isMe ? styles.messageTextMe : styles.messageTextOther]}>
            {item.text}
          </Text>
          <Text style={[styles.timeText, isMe ? styles.timeTextMe : styles.timeTextOther]}>
            {new Date(item.createdAt || Date.now()).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
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
      <View style={styles.chatHeader}>
        <ShieldCheck size={16} color={Colors.powderBlue} />
        <Text style={styles.chatHeaderTitle}>End-to-End Campus Errand Channel</Text>
      </View>

      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator color={Colors.powderBlue} />
          <Text style={styles.loadingText}>Connecting to errand chat...</Text>
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
              <MessageSquare size={40} color={Colors.powderBlue} />
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
              activeOpacity={0.8}
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
          activeOpacity={0.85}
        >
          <Send size={16} color="#FFFFFF" strokeWidth={2.6} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 520,
    backgroundColor: Colors.inkBlack,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1.2,
    borderColor: 'rgba(226, 232, 240, 0.90)',
    ...Shadows.subtle,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 232, 240, 0.85)',
  },
  chatHeaderTitle: {
    fontSize: Typography.xs,
    fontWeight: '800',
    color: Colors.porcelain,
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
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.20)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
    marginBottom: 2,
  },
  senderAvatarText: {
    fontSize: Typography.xs - 2,
    fontWeight: '800',
    color: Colors.powderBlue,
  },
  bubble: {
    maxWidth: '78%',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  bubbleMe: {
    backgroundColor: Colors.powderBlue,
    borderBottomRightRadius: BorderRadius.xs,
    ...Shadows.glow,
  },
  bubbleOther: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: BorderRadius.xs,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.90)',
    ...Shadows.subtle,
  },
  senderName: {
    fontSize: Typography.xs - 2,
    fontWeight: '800',
    color: Colors.powderBlue,
    marginBottom: 2,
  },
  messageText: {
    fontSize: Typography.sm,
    lineHeight: 18,
  },
  messageTextMe: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  messageTextOther: {
    color: Colors.porcelain,
  },
  timeText: {
    fontSize: Typography.xs - 4,
    marginTop: 3,
    alignSelf: 'flex-end',
    fontWeight: '600',
  },
  timeTextMe: {
    color: 'rgba(255, 255, 255, 0.85)',
  },
  timeTextOther: {
    color: '#94A3B8',
  },
  typingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    backgroundColor: 'rgba(5, 150, 105, 0.08)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(5, 150, 105, 0.20)',
  },
  typingText: {
    fontSize: Typography.xs - 1,
    color: Colors.drySage,
    fontStyle: 'italic',
    fontWeight: '600',
  },
  quickPromptsWrapper: {
    backgroundColor: 'rgba(241, 245, 249, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(226, 232, 240, 0.85)',
    paddingVertical: 6,
  },
  quickPromptsScroll: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs,
  },
  quickPromptChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: Spacing.sm + 4,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.90)',
  },
  quickPromptText: {
    fontSize: Typography.xs - 1,
    color: Colors.porcelain,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(226, 232, 240, 0.85)',
  },
  textInput: {
    flex: 1,
    backgroundColor: 'rgba(248, 250, 252, 0.90)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm - 2,
    fontSize: Typography.sm,
    color: Colors.porcelain,
    maxHeight: 80,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.90)',
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.powderBlue,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.glow,
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.sm,
    color: Colors.powderBlue,
    fontSize: Typography.xs,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    fontSize: Typography.base,
    fontWeight: '800',
    color: Colors.porcelain,
    marginTop: Spacing.xs,
  },
  emptySubtitle: {
    fontSize: Typography.xs,
    color: Colors.powderBlue,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
});
