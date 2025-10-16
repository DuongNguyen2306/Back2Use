import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../../../context/AuthProvider';

const { width } = Dimensions.get('window');

interface ChatMessage {
    id: string;
    type: 'user' | 'bot';
    message: string;
    timestamp: Date;
}

const FAQ_RESPONSES: { [key: string]: string } = {
    "how do i return":
        "To return a container: 1) Visit any partner store 2) Show the container to staff 3) They'll scan the QR code 4) Your deposit will be refunded instantly!",
    "where can i return":
        "You can return containers at any Back2Use partner store. Use our store locator in the app to find the nearest location.",
    "what if i lose":
        "If you lose a container, the deposit amount will be charged to your account. We recommend setting up return reminders to avoid this.",
    "how do i earn points":
        "You earn 10 points for every on-time return, 5 points for late returns, and bonus points for consecutive returns!",
    "deposit amount":
        "Deposit amounts vary by container type: Cups ($3), Containers ($5), Bowls ($4). The full amount is refunded upon return.",
    "late fees": "Late fees are $0.50 per hour after the due time. Return containers on time to avoid charges!",
    "store hours":
        "Store hours vary by location. Check the store details in our app or website for specific operating hours.",
    "how to register":
        "Download our app, create an account with your email, verify your phone number, and you're ready to start borrowing!",
    "payment methods":
        "We accept credit cards, debit cards, and digital wallets. You can manage payment methods in your app settings.",
    sustainability:
        "Every container reuse saves approximately 50g of plastic waste and reduces CO₂ emissions by 30g. Together we're making a difference!",
};

export default function AIChat() {
    const auth = useAuth();
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: "1",
            type: "bot",
            message:
                "Hi! I'm your Back2Use assistant. I can help you with questions about returning containers, earning points, store locations, and more. What would you like to know?",
            timestamp: new Date(),
        },
    ]);
    const [inputMessage, setInputMessage] = useState("");
    const [isTyping, setIsTyping] = useState(false);

    const getTimeBasedGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    const getCurrentTime = () => {
        const now = new Date();
        return now.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: false 
        });
    };

    const generateResponse = (userMessage: string): string => {
        const lowerMessage = userMessage.toLowerCase();

        // Find matching FAQ response
        for (const [key, response] of Object.entries(FAQ_RESPONSES)) {
            if (lowerMessage.includes(key)) {
                return response;
            }
        }

        // Default responses for common patterns
        if (lowerMessage.includes("hello") || lowerMessage.includes("hi")) {
            return "Hello! How can I help you with Back2Use today?";
        }

        if (lowerMessage.includes("thank")) {
            return "You're welcome! Is there anything else I can help you with?";
        }

        if (lowerMessage.includes("help")) {
            return "I can help you with: returning containers, finding stores, earning points, deposit amounts, late fees, and sustainability impact. What specific topic interests you?";
        }

        // Default fallback
        return "I'm not sure about that specific question, but I can help you with container returns, store locations, reward points, deposits, and sustainability. Could you rephrase your question or ask about one of these topics?";
    };

    const handleSendMessage = async () => {
        if (!inputMessage.trim()) return;

        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            type: "user",
            message: inputMessage,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInputMessage("");
        setIsTyping(true);

        // Simulate AI thinking time
        setTimeout(
            () => {
                const botResponse: ChatMessage = {
                    id: (Date.now() + 1).toString(),
                    type: "bot",
                    message: generateResponse(inputMessage),
                    timestamp: new Date(),
                };

                setMessages((prev) => [...prev, botResponse]);
                setIsTyping(false);
            },
            1000 + Math.random() * 1000,
        );
    };

    const quickQuestions = [
        "How do I return a container?",
        "Where can I return containers?",
        "How do I earn points?",
        "What are the deposit amounts?",
    ];

    const renderMessage = (message: ChatMessage) => {
        const isUser = message.type === 'user';
        
        return (
            <View key={message.id} style={[styles.messageContainer, isUser ? styles.userMessageContainer : styles.botMessageContainer]}>
                {!isUser && (
                    <View style={styles.botAvatar}>
                        <Ionicons name="chatbubble-ellipses" size={16} color="#00704A" />
                    </View>
                )}
                
                <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.botBubble]}>
                    <Text style={[styles.messageText, isUser ? styles.userMessageText : styles.botMessageText]}>
                        {message.message}
                    </Text>
                    <Text style={[styles.timestamp, isUser ? styles.userTimestamp : styles.botTimestamp]}>
                        {message.timestamp.toLocaleTimeString()}
                    </Text>
                </View>

                {isUser && (
                    <View style={styles.userAvatar}>
                        <Ionicons name="person" size={16} color="#00704A" />
                    </View>
                )}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.heroHeaderArea}>
                {/* Status Bar */}
                <View style={styles.statusBar}>
                    <Text style={styles.timeText}>{getCurrentTime()}</Text>
                    <View style={styles.statusIcons}>
                        <View style={styles.statusIcon}>
                            <Ionicons name="arrow-up" size={12} color="#FFFFFF" />
                        </View>
                        <View style={styles.statusIcon}>
                            <Text style={styles.signalText}>A</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.topBar}>
                    <Text style={styles.brandTitle}>BACK2USE</Text>
                </View>
                
                <View style={styles.greetingRow}>
                    <View>
                        <Text style={styles.greetingSub}>{getTimeBasedGreeting()},</Text>
                        <Text style={styles.greetingName}>User Name</Text>
                    </View>
                    <View style={styles.avatarLg}>
                        <Text style={styles.avatarLgText}>U</Text>
                    </View>
                </View>
            </View>

            <KeyboardAvoidingView 
                style={styles.chatContainer} 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                {/* Section Title */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>AI Assistant</Text>
                    <View style={styles.onlineBadge}>
                        <View style={styles.onlineDot} />
                        <Text style={styles.onlineText}>Online</Text>
                    </View>
                </View>

                {/* Quick Questions */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickQuestionsContainer}>
                    {quickQuestions.map((question, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.quickQuestionButton}
                            onPress={() => setInputMessage(question)}
                        >
                            <Ionicons name="help-circle" size={12} color="#00704A" />
                            <Text style={styles.quickQuestionText}>{question}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Messages */}
                <ScrollView style={styles.messagesContainer} showsVerticalScrollIndicator={false}>
                    {messages.map(renderMessage)}
                    
                    {isTyping && (
                        <View style={styles.typingContainer}>
                            <View style={styles.botAvatar}>
                                <Ionicons name="chatbubble-ellipses" size={16} color="#00704A" />
                            </View>
                            <View style={styles.typingBubble}>
                                <View style={styles.typingDots}>
                                    <View style={[styles.typingDot, styles.typingDot1]} />
                                    <View style={[styles.typingDot, styles.typingDot2]} />
                                    <View style={[styles.typingDot, styles.typingDot3]} />
                                </View>
                            </View>
                        </View>
                    )}
                </ScrollView>

                {/* Input */}
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.textInput}
                        value={inputMessage}
                        onChangeText={setInputMessage}
                        placeholder="Ask me anything about Back2Use..."
                        placeholderTextColor="#9CA3AF"
                        multiline
                        maxLength={500}
                    />
                    <TouchableOpacity 
                        style={[styles.sendButton, !inputMessage.trim() && styles.sendButtonDisabled]} 
                        onPress={handleSendMessage}
                        disabled={!inputMessage.trim()}
                    >
                        <Ionicons name="send" size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    heroHeaderArea: {
        backgroundColor: '#00704A',
        paddingHorizontal: 16,
        paddingTop: 40,
        paddingBottom: 32,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    statusBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    timeText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    statusIcons: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusIcon: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
    },
    signalText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    brandTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    greetingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    greetingSub: {
        fontSize: 16,
        color: '#E5E7EB',
        marginBottom: 4,
    },
    greetingName: {
        fontSize: 20,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    avatarLg: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    avatarLgText: {
        fontSize: 20,
        fontWeight: '600',
        color: '#00704A',
    },
    chatContainer: {
        flex: 1,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 16,
    },
    sectionTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#111827',
    },
    onlineBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0FDF4',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    onlineDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#10B981',
        marginRight: 6,
    },
    onlineText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#10B981',
    },
    quickQuestionsContainer: {
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    quickQuestionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    quickQuestionText: {
        fontSize: 12,
        color: '#00704A',
        marginLeft: 4,
        maxWidth: 120,
    },
    messagesContainer: {
        flex: 1,
        paddingHorizontal: 20,
    },
    messageContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginBottom: 16,
    },
    userMessageContainer: {
        justifyContent: 'flex-end',
    },
    botMessageContainer: {
        justifyContent: 'flex-start',
    },
    botAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F0FDF4',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    userAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F0FDF4',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
    },
    messageBubble: {
        maxWidth: width * 0.7,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 20,
    },
    userBubble: {
        backgroundColor: '#00704A',
        borderBottomRightRadius: 4,
    },
    botBubble: {
        backgroundColor: '#FFFFFF',
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    messageText: {
        fontSize: 14,
        lineHeight: 20,
    },
    userMessageText: {
        color: '#FFFFFF',
    },
    botMessageText: {
        color: '#111827',
    },
    timestamp: {
        fontSize: 11,
        marginTop: 4,
    },
    userTimestamp: {
        color: 'rgba(255, 255, 255, 0.7)',
    },
    botTimestamp: {
        color: '#9CA3AF',
    },
    typingContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginBottom: 16,
    },
    typingBubble: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 20,
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    typingDots: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    typingDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#9CA3AF',
        marginHorizontal: 2,
    },
    typingDot1: {
        animationDelay: '0s',
    },
    typingDot2: {
        animationDelay: '0.2s',
    },
    typingDot3: {
        animationDelay: '0.4s',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    textInput: {
        flex: 1,
        backgroundColor: '#F9FAFB',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 14,
        color: '#111827',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginRight: 12,
        maxHeight: 100,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#00704A',
        alignItems: 'center',
        justifyContent: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: '#9CA3AF',
    },
});
