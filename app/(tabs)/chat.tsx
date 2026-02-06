import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Platform,
  StatusBar,
  ActivityIndicator,
  Keyboard,
  Animated as RNAnimated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTextGeneration } from '@fastshot/ai';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

// Tab bar height constant (matches _layout.tsx: 64 + insets.bottom)
const TAB_BAR_BASE = 64;

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      text: 'Hello! How can I help you today with your services?',
      sender: 'ai',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const { generateText, isLoading } = useTextGeneration();

  // Keyboard height tracking
  const keyboardPadding = useRef(new RNAnimated.Value(0)).current;
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const tabBarHeight = TAB_BAR_BASE + insets.bottom;

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = (e: any) => {
      setKeyboardVisible(true);
      // Keyboard height minus the tab bar that gets hidden/overlapped
      const kbHeight = e.endCoordinates.height - tabBarHeight;
      const finalPadding = Math.max(kbHeight, 0);

      RNAnimated.timing(keyboardPadding, {
        toValue: finalPadding,
        duration: Platform.OS === 'ios' ? e.duration || 250 : 200,
        useNativeDriver: false,
      }).start();

      // Scroll to bottom after keyboard opens
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    };

    const onHide = (e: any) => {
      setKeyboardVisible(false);
      RNAnimated.timing(keyboardPadding, {
        toValue: 0,
        duration: Platform.OS === 'ios' ? (e?.duration || 250) : 200,
        useNativeDriver: false,
      }).start();
    };

    const sub1 = Keyboard.addListener(showEvent, onShow);
    const sub2 = Keyboard.addListener(hideEvent, onHide);

    return () => {
      sub1.remove();
      sub2.remove();
    };
  }, [insets.bottom, keyboardPadding]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const userInput = inputText.trim();
    setInputText('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const response = await generateText(
        `You are a helpful customer support assistant for i-net, a premium digital service marketplace. The user says: "${userInput}". Provide a helpful, concise, and friendly response about digital services, accounts, subscriptions, or general support. Keep responses under 150 words.`
      );

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response || 'I apologize, but I encountered an issue. Please try again.',
        sender: 'ai',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'I apologize, but I encountered an error. Please try again or contact support.',
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  const renderMessage = useCallback(({ item, index }: { item: Message; index: number }) => {
    const isUser = item.sender === 'user';

    return (
      <Animated.View
        entering={FadeInUp.delay(index * 50).duration(300)}
        style={[styles.messageContainer, isUser ? styles.userMessageContainer : styles.aiMessageContainer]}
      >
        {!isUser && (
          <View style={styles.aiAvatar}>
            <MaterialCommunityIcons name="robot-happy-outline" size={20} color={Colors.secondary} />
          </View>
        )}
        <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.aiBubble]}>
          {!isUser && <Text style={styles.aiLabel}>i-net AI Assistant</Text>}
          <Text style={[styles.messageText, isUser ? styles.userMessageText : styles.aiMessageText]}>
            {item.text}
          </Text>
          <Text style={[styles.timestamp, isUser ? styles.userTimestamp : styles.aiTimestamp]}>
            {item.timestamp.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
            })}
          </Text>
        </View>
        {isUser && (
          <View style={styles.userAvatar}>
            <Ionicons name="person" size={18} color={Colors.white} />
          </View>
        )}
      </Animated.View>
    );
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient colors={[Colors.primary, '#1E40AF']} style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={Colors.white} />
          </TouchableOpacity>
          <View style={styles.headerIconContainer}>
            <MaterialCommunityIcons name="robot-happy-outline" size={24} color={Colors.secondary} />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Support Chat</Text>
            <Text style={styles.headerSubtitle}>
              Powered by <Text style={styles.newellBrand}>Newell AI</Text>
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        style={styles.messagesFlatList}
      />

      {/* Loading Indicator */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <View style={styles.loadingBubble}>
            <ActivityIndicator size="small" color={Colors.secondary} />
            <Text style={styles.loadingText}>AI is typing...</Text>
          </View>
        </View>
      )}

      {/* Input Area — animated with keyboard */}
      <RNAnimated.View style={[styles.inputContainer, { paddingBottom: keyboardVisible ? Spacing.sm : Math.max(insets.bottom, Spacing.sm), marginBottom: keyboardPadding }]}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor={Colors.gray}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            editable={!isLoading}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!inputText.trim() || isLoading}
            activeOpacity={0.7}
            style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
          >
            <LinearGradient
              colors={
                inputText.trim() && !isLoading
                  ? [Colors.secondary, '#0891B2']
                  : [Colors.lightGray, Colors.gray]
              }
              style={styles.sendButtonGradient}
            >
              <Ionicons name="send" size={20} color={Colors.white} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </RNAnimated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderBottomLeftRadius: BorderRadius.lg,
    borderBottomRightRadius: BorderRadius.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: Spacing.sm,
  },
  headerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    ...Typography.h2,
    fontSize: 22,
    color: Colors.white,
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    ...Typography.small,
    color: Colors.lightGray,
  },
  newellBrand: {
    color: Colors.secondary,
    fontWeight: '600',
  },
  messagesFlatList: {
    flex: 1,
  },
  messagesList: {
    padding: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
    alignItems: 'flex-end',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  aiMessageContainer: {
    justifyContent: 'flex-start',
  },
  aiAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.secondary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.sm,
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.lg,
  },
  userBubble: {
    backgroundColor: Colors.secondary,
    borderBottomRightRadius: Spacing.xs,
  },
  aiBubble: {
    backgroundColor: Colors.white,
    borderBottomLeftRadius: Spacing.xs,
    ...Shadows.small,
  },
  aiLabel: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.secondary,
    marginBottom: Spacing.xs,
  },
  messageText: {
    ...Typography.body,
    lineHeight: 22,
  },
  userMessageText: {
    color: Colors.white,
  },
  aiMessageText: {
    color: Colors.dark,
  },
  timestamp: {
    ...Typography.caption,
    marginTop: Spacing.xs,
  },
  userTimestamp: {
    color: Colors.white,
    opacity: 0.7,
    textAlign: 'right',
  },
  aiTimestamp: {
    color: Colors.gray,
  },
  loadingContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    alignSelf: 'flex-start',
    marginLeft: 44,
    ...Shadows.small,
  },
  loadingText: {
    ...Typography.small,
    color: Colors.gray,
    marginLeft: Spacing.sm,
  },
  inputContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    ...Typography.body,
    color: Colors.dark,
    maxHeight: 100,
  },
  sendButton: {
    marginLeft: Spacing.sm,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.medium,
  },
});
