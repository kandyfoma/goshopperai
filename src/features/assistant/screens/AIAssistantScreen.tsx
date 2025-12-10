// AI Assistant Screen - Natural language queries about spending
import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useAuth} from '@/shared/contexts';
import {
  naturalLanguageService,
  QueryResult,
  ConversationMessage,
} from '@/shared/services/firebase';
import {COLORS} from '@/shared/utils/constants';

export function AIAssistantScreen() {
  const navigation = useNavigation();
  const {user} = useAuth();
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(naturalLanguageService.getSuggestedQueries());
  const flatListRef = useRef<FlatList>(null);

  // Load conversation history
  useEffect(() => {
    const history = naturalLanguageService.getConversationHistory();
    setMessages(history);
  }, []);

  const handleSend = async () => {
    if (!inputText.trim() || !user?.uid || isLoading) return;
    
    const query = inputText.trim();
    setInputText('');
    setIsLoading(true);
    
    // Add user message immediately
    const userMessage: ConversationMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    try {
      const result = await naturalLanguageService.processQuery(user.uid, query);
      
      // Add assistant response
      const assistantMessage: ConversationMessage = {
        id: `msg_${Date.now()}_resp`,
        role: 'assistant',
        content: result.answer,
        contentLingala: result.answerLingala,
        timestamp: new Date(),
        data: result,
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // Update suggestions based on response
      if (result.suggestions) {
        setSuggestions(result.suggestions.map(s => ({fr: s, lingala: ''})));
      }
      
    } catch (error) {
      console.error('Query error:', error);
      
      const errorMessage: ConversationMessage = {
        id: `msg_${Date.now()}_err`,
        role: 'assistant',
        content: 'Désolé, je n\'ai pas pu traiter votre demande. Réessayez.',
        contentLingala: 'Limbisa, nakoki te. Meka lisusu.',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionPress = (suggestion: string) => {
    setInputText(suggestion);
  };

  const handleClearHistory = () => {
    naturalLanguageService.clearHistory();
    setMessages([]);
    setSuggestions(naturalLanguageService.getSuggestedQueries());
  };

  const renderMessage = ({item}: {item: ConversationMessage}) => {
    const isUser = item.role === 'user';
    const queryResult = item.data as QueryResult | undefined;
    
    return (
      <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.assistantBubble]}>
        {!isUser && (
          <View style={styles.assistantAvatar}>
            <Text style={styles.avatarText}>🤖</Text>
          </View>
        )}
        
        <View style={[styles.messageContent, isUser ? styles.userContent : styles.assistantContent]}>
          <Text style={[styles.messageText, isUser && styles.userText]}>
            {item.content}
          </Text>
          
          {item.contentLingala && !isUser && (
            <Text style={styles.lingalaText}>
              {item.contentLingala}
            </Text>
          )}
          
          {/* Chart data preview */}
          {queryResult?.chartData && (
            <View style={styles.chartPreview}>
              <Text style={styles.chartTitle}>
                📊 {queryResult.chartData.datasets[0]?.label || 'Données'}
              </Text>
              {queryResult.chartData.labels.slice(0, 3).map((label, index) => (
                <View key={index} style={styles.chartRow}>
                  <Text style={styles.chartLabel}>{label}</Text>
                  <Text style={styles.chartValue}>
                    ${queryResult.chartData!.datasets[0].data[index]?.toFixed(2)}
                  </Text>
                </View>
              ))}
            </View>
          )}
          
          {/* Suggestions from response */}
          {queryResult?.suggestions && queryResult.suggestions.length > 0 && (
            <View style={styles.inlineSuggestions}>
              {queryResult.suggestions.slice(0, 2).map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.inlineSuggestionChip}
                  onPress={() => handleSuggestionPress(suggestion)}>
                  <Text style={styles.inlineSuggestionText}>{suggestion}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
        
        {isUser && (
          <View style={styles.userAvatar}>
            <Text style={styles.avatarText}>👤</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Retour</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Assistant IA</Text>
          <Text style={styles.headerSubtitle}>Posez vos questions</Text>
        </View>
        <TouchableOpacity onPress={handleClearHistory}>
          <Text style={styles.clearButton}>🗑️</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}>
        
        {/* Messages */}
        {messages.length === 0 ? (
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeIcon}>🤖</Text>
            <Text style={styles.welcomeTitle}>Bonjour!</Text>
            <Text style={styles.welcomeSubtitle}>Mbote!</Text>
            <Text style={styles.welcomeText}>
              Posez-moi des questions sur vos dépenses, vos factures, ou les prix.
            </Text>
            <Text style={styles.welcomeTextLingala}>
              Tuna ngai mituna na mbongo na yo, factures, to ntalo.
            </Text>
            
            {/* Initial Suggestions */}
            <View style={styles.welcomeSuggestions}>
              <Text style={styles.suggestionsTitle}>Essayez:</Text>
              {suggestions.slice(0, 4).map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.welcomeSuggestionButton}
                  onPress={() => handleSuggestionPress(suggestion.fr)}>
                  <Text style={styles.welcomeSuggestionText}>{suggestion.fr}</Text>
                  {suggestion.lingala && (
                    <Text style={styles.welcomeSuggestionLingala}>{suggestion.lingala}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          />
        )}

        {/* Quick Suggestions Bar */}
        {messages.length > 0 && suggestions.length > 0 && (
          <View style={styles.suggestionsBar}>
            <FlatList
              horizontal
              data={suggestions.slice(0, 5)}
              renderItem={({item}) => (
                <TouchableOpacity
                  style={styles.suggestionChip}
                  onPress={() => handleSuggestionPress(typeof item === 'string' ? item : item.fr)}>
                  <Text style={styles.suggestionChipText}>
                    {typeof item === 'string' ? item : item.fr}
                  </Text>
                </TouchableOpacity>
              )}
              keyExtractor={(item, index) => index.toString()}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.suggestionsScroll}
            />
          </View>
        )}

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Tapez votre question..."
            placeholderTextColor={COLORS.gray[400]}
            multiline
            maxLength={500}
            editable={!isLoading}
          />
          
          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || isLoading}>
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.sendButtonText}>→</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  backButton: {
    fontSize: 16,
    color: COLORS.primary[600],
    fontWeight: '600',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.gray[900],
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.gray[500],
  },
  clearButton: {
    fontSize: 20,
    padding: 4,
  },
  content: {
    flex: 1,
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  welcomeIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.gray[900],
  },
  welcomeSubtitle: {
    fontSize: 20,
    color: COLORS.gray[600],
    fontStyle: 'italic',
    marginBottom: 16,
  },
  welcomeText: {
    fontSize: 16,
    color: COLORS.gray[600],
    textAlign: 'center',
    lineHeight: 24,
  },
  welcomeTextLingala: {
    fontSize: 14,
    color: COLORS.gray[500],
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 32,
  },
  welcomeSuggestions: {
    width: '100%',
    alignItems: 'center',
  },
  suggestionsTitle: {
    fontSize: 14,
    color: COLORS.gray[500],
    marginBottom: 12,
  },
  welcomeSuggestionButton: {
    backgroundColor: '#fff',
    width: '100%',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  welcomeSuggestionText: {
    fontSize: 16,
    color: COLORS.gray[800],
    fontWeight: '500',
  },
  welcomeSuggestionLingala: {
    fontSize: 12,
    color: COLORS.gray[500],
    fontStyle: 'italic',
    marginTop: 4,
  },
  messagesList: {
    padding: 16,
    paddingBottom: 8,
  },
  messageBubble: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  userBubble: {
    justifyContent: 'flex-end',
  },
  assistantBubble: {
    justifyContent: 'flex-start',
  },
  assistantAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.gray[200],
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  avatarText: {
    fontSize: 18,
  },
  messageContent: {
    maxWidth: '75%',
    padding: 14,
    borderRadius: 16,
  },
  userContent: {
    backgroundColor: COLORS.primary[500],
    borderBottomRightRadius: 4,
  },
  assistantContent: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    color: COLORS.gray[800],
  },
  userText: {
    color: '#fff',
  },
  lingalaText: {
    fontSize: 13,
    color: COLORS.gray[500],
    fontStyle: 'italic',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
  },
  chartPreview: {
    marginTop: 12,
    padding: 12,
    backgroundColor: COLORS.gray[50],
    borderRadius: 8,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[700],
    marginBottom: 8,
  },
  chartRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  chartLabel: {
    fontSize: 13,
    color: COLORS.gray[600],
  },
  chartValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary[600],
  },
  inlineSuggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  inlineSuggestionChip: {
    backgroundColor: COLORS.primary[100],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  inlineSuggestionText: {
    fontSize: 12,
    color: COLORS.primary[700],
    fontWeight: '500',
  },
  suggestionsBar: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
  },
  suggestionsScroll: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  suggestionChip: {
    backgroundColor: COLORS.gray[100],
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
  },
  suggestionChipText: {
    fontSize: 13,
    color: COLORS.gray[700],
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: COLORS.gray[100],
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 16,
    color: COLORS.gray[900],
    maxHeight: 100,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.gray[300],
  },
  sendButtonText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
});
