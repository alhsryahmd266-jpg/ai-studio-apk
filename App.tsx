import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, Image, Platform,
  KeyboardAvoidingView, StatusBar, Dimensions
} from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

const { width: W } = Dimensions.get('window');

// ======= GROQ KEY ROTATION (7 KEYS) =======
const GROQ_KEYS = [
  process.env.EXPO_PUBLIC_GROQ_KEY_1 || '',
  process.env.EXPO_PUBLIC_GROQ_KEY_2 || '',
  process.env.EXPO_PUBLIC_GROQ_KEY_3 || '',
  process.env.EXPO_PUBLIC_GROQ_KEY_4 || '',
  process.env.EXPO_PUBLIC_GROQ_KEY_5 || '',
  process.env.EXPO_PUBLIC_GROQ_KEY_6 || '',
  process.env.EXPO_PUBLIC_GROQ_KEY_7 || '',
].filter(Boolean);

let keyIndex = 0;
const getKey = () => {
  const key = GROQ_KEYS[keyIndex % GROQ_KEYS.length];
  keyIndex++;
  return key;
};

const MODELS = {
  CHAT: 'llama-3.3-70b-versatile',
  VISION: 'llama-3.2-11b-vision-preview',
  FAST: 'llama-3.1-8b-instant',
};

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

interface Message { role: 'user' | 'assistant'; content: string; image?: string; }

// ======= GROQ API CALLS =======
async function callGroq(messages: any[], model: string): Promise<string> {
  const key = getKey();
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, max_tokens: 4096, temperature: 0.7 }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq error ${res.status}: ${err}`);
  }
  const data = await res.json();
  return data.choices[0]?.message?.content || 'No response';
}

async function webSearch(query: string): Promise<string> {
  try {
    const res = await fetch(`https://s.jina.ai/${encodeURIComponent(query)}`, {
      headers: { Accept: 'text/plain', 'X-Return-Format': 'text' },
    });
    const text = await res.text();
    return text.slice(0, 3000);
  } catch {
    return `Search failed for: ${query}`;
  }
}

// ======= COLORS =======
const C = {
  bg: '#080810', card: '#11111f', accent: '#6c63ff',
  accent2: '#00d4aa', text: '#f0f0ff', sub: '#8888aa',
  border: '#1e1e35', user: '#1a1a3e', bot: '#0d1a0d',
  danger: '#ff4444', success: '#00cc77', warn: '#ffaa00',
};

// ======= TABS =======
type Tab = 'chat' | 'vision' | 'search' | 'builder';

export default function App() {
  const [tab, setTab] = useState<Tab>('chat');
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <View style={S.root}>
        {tab === 'chat' && <ChatTab />}
        {tab === 'vision' && <VisionTab />}
        {tab === 'search' && <SearchTab />}
        {tab === 'builder' && <BuilderTab />}
        <BottomNav tab={tab} setTab={setTab} />
      </View>
    </SafeAreaProvider>
  );
}

// ======= BOTTOM NAV =======
function BottomNav({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  const insets = useSafeAreaInsets();
  const tabs: { id: Tab; icon: any; label: string }[] = [
    { id: 'chat', icon: 'chatbubble-ellipses', label: 'Chat' },
    { id: 'vision', icon: 'eye', label: 'Vision' },
    { id: 'search', icon: 'search', label: 'Search' },
    { id: 'builder', icon: 'cube', label: 'Builder' },
  ];
  return (
    <View style={[S.nav, { paddingBottom: insets.bottom || 8 }]}>
      {tabs.map(t => (
        <TouchableOpacity key={t.id} style={S.navItem} onPress={() => setTab(t.id)}>
          <Ionicons name={tab === t.id ? t.icon : `${t.icon}-outline` as any}
            size={24} color={tab === t.id ? C.accent : C.sub} />
          <Text style={[S.navLabel, tab === t.id && { color: C.accent }]}>{t.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ======= CHAT TAB =======
function ChatTab() {
  const [msgs, setMsgs] = useState<Message[]>([
    { role: 'assistant', content: '👋 مرحباً! أنا مساعدك الذكي المدعوم بـ Groq و Llama 3.3 70B. كيف يمكنني مساعدتك اليوم؟' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState<'CHAT' | 'FAST'>('CHAT');
  const scroll = useRef<ScrollView>(null);

  const send = useCallback(async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: 'user', content: input.trim() };
    const newMsgs = [...msgs, userMsg];
    setMsgs(newMsgs);
    setInput('');
    setLoading(true);
    try {
      const history = newMsgs.slice(-20).map(m => ({ role: m.role, content: m.content }));
      history.unshift({ role: 'system', content: 'أنت مساعد ذكاء اصطناعي متقدم تتحدث العربية والإنجليزية. أجب بشكل مفيد ومفصل.' });
      const reply = await callGroq(history, MODELS[model]);
      setMsgs(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (e: any) {
      setMsgs(prev => [...prev, { role: 'assistant', content: `❌ خطأ: ${e.message}` }]);
    }
    setLoading(false);
    setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 100);
  }, [input, loading, msgs, model]);

  return (
    <KeyboardAvoidingView style={S.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView style={S.flex} edges={['top']}>
        <View style={S.header}>
          <Text style={S.headerTitle}>🧠 AI Studio Chat</Text>
          <View style={S.modelPicker}>
            <TouchableOpacity style={[S.modelBtn, model === 'CHAT' && S.modelBtnActive]}
              onPress={() => setModel('CHAT')}>
              <Text style={[S.modelBtnTxt, model === 'CHAT' && { color: C.accent }]}>70B</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[S.modelBtn, model === 'FAST' && S.modelBtnActive]}
              onPress={() => setModel('FAST')}>
              <Text style={[S.modelBtnTxt, model === 'FAST' && { color: C.accent2 }]}>⚡8B</Text>
            </TouchableOpacity>
          </View>
        </View>
        <ScrollView ref={scroll} style={S.msgList} contentContainerStyle={{ padding: 12 }}>
          {msgs.map((m, i) => (
            <View key={i} style={[S.bubble, m.role === 'user' ? S.bubbleUser : S.bubbleBot]}>
              {m.role === 'assistant' && <Text style={S.botLabel}>🤖 AI Studio</Text>}
              <Text style={S.bubbleTxt}>{m.content}</Text>
            </View>
          ))}
          {loading && <View style={S.bubbleBot}>
            <ActivityIndicator color={C.accent} />
          </View>}
        </ScrollView>
        <View style={S.inputRow}>
          <TextInput style={S.input} placeholder="اكتب رسالة..." placeholderTextColor={C.sub}
            value={input} onChangeText={setInput} multiline onSubmitEditing={send}
            returnKeyType="send" />
          <TouchableOpacity style={[S.sendBtn, { opacity: loading ? 0.5 : 1 }]} onPress={send}>
            <Ionicons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

// ======= VISION TAB =======
function VisionTab() {
  const [image, setImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('ما الذي تراه في هذه الصورة؟ اشرح بالتفصيل');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const pick = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('الإذن مطلوب', 'يرجى السماح بالوصول إلى المعرض'); return; }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true, quality: 0.7, allowsEditing: true,
    });
    if (!res.canceled && res.assets[0].base64) setImage(res.assets[0].base64);
  };

  const camera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) { Alert.alert('الإذن مطلوب', 'يرجى السماح بالوصول إلى الكاميرا'); return; }
    const res = await ImagePicker.launchCameraAsync({ base64: true, quality: 0.7 });
    if (!res.canceled && res.assets[0].base64) setImage(res.assets[0].base64);
  };

  const analyze = async () => {
    if (!image) { Alert.alert('تنبيه', 'يرجى اختيار صورة أولاً'); return; }
    setLoading(true); setResult('');
    try {
      const text = await callGroq([{
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${image}` } }
        ]
      }], MODELS.VISION);
      setResult(text);
    } catch (e: any) { setResult(`❌ خطأ: ${e.message}`); }
    setLoading(false);
  };

  return (
    <SafeAreaView style={S.flex} edges={['top']}>
      <View style={S.header}>
        <Text style={S.headerTitle}>👁️ رؤية بصرية</Text>
        <Text style={S.headerSub}>Llama 3.2 Vision</Text>
      </View>
      <ScrollView style={S.flex} contentContainerStyle={{ padding: 16 }}>
        <View style={S.imgBox}>
          {image ? <Image source={{ uri: `data:image/jpeg;base64,${image}` }} style={S.previewImg} />
            : <View style={S.imgPlaceholder}>
              <Ionicons name="image-outline" size={60} color={C.sub} />
              <Text style={S.imgPlaceholderTxt}>اختر صورة للتحليل</Text>
            </View>}
        </View>
        <View style={S.btnRow}>
          <TouchableOpacity style={[S.actionBtn, { backgroundColor: C.accent }]} onPress={pick}>
            <Ionicons name="images" size={20} color="#fff" />
            <Text style={S.actionBtnTxt}>معرض</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[S.actionBtn, { backgroundColor: C.accent2 }]} onPress={camera}>
            <Ionicons name="camera" size={20} color="#fff" />
            <Text style={S.actionBtnTxt}>كاميرا</Text>
          </TouchableOpacity>
        </View>
        <TextInput style={[S.input, { marginHorizontal: 0, marginBottom: 12, minHeight: 60 }]}
          placeholder="ماذا تريد أن تعرف عن الصورة؟"
          placeholderTextColor={C.sub} value={prompt} onChangeText={setPrompt} multiline />
        <TouchableOpacity style={[S.analyzeBtn, { opacity: loading ? 0.5 : 1 }]} onPress={analyze} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <><Ionicons name="scan" size={20} color="#fff" /><Text style={S.analyzeBtnTxt}>تحليل الصورة</Text></>}
        </TouchableOpacity>
        {result ? <View style={S.resultBox}><Text style={S.resultTxt}>{result}</Text></View> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

// ======= SEARCH TAB =======
function SearchTab() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true); setResult('');
    try {
      const webData = await webSearch(query);
      const summary = await callGroq([
        { role: 'system', content: 'أنت محرك بحث ذكي. لخص نتائج البحث بشكل واضح ومفيد بالعربية.' },
        { role: 'user', content: `السؤال: ${query}\n\nنتائج البحث:\n${webData}\n\nلخص هذه المعلومات بشكل مفيد وواضح.` }
      ], MODELS.FAST);
      setResult(summary);
    } catch (e: any) { setResult(`❌ خطأ: ${e.message}`); }
    setLoading(false);
  };

  return (
    <SafeAreaView style={S.flex} edges={['top']}>
      <View style={S.header}>
        <Text style={S.headerTitle}>🔍 بحث ذكي</Text>
        <Text style={S.headerSub}>Jina AI + Llama 3.1</Text>
      </View>
      <View style={{ padding: 16 }}>
        <View style={S.inputRow}>
          <TextInput style={S.input} placeholder="ابحث في الإنترنت..." placeholderTextColor={C.sub}
            value={query} onChangeText={setQuery} returnKeyType="search" onSubmitEditing={search} />
          <TouchableOpacity style={[S.sendBtn, { opacity: loading ? 0.5 : 1 }]} onPress={search}>
            <Ionicons name="search" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView style={S.flex} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}>
        {loading && <ActivityIndicator color={C.accent} style={{ marginTop: 40 }} />}
        {result ? <View style={S.resultBox}><Text style={S.resultTxt}>{result}</Text></View> : null}
        {!result && !loading && <View style={{ alignItems: 'center', marginTop: 60 }}>
          <Ionicons name="globe-outline" size={80} color={C.border} />
          <Text style={[S.sub, { marginTop: 16, textAlign: 'center' }]}>ابحث في الإنترنت واحصل على ملخص ذكي فوري</Text>
        </View>}
      </ScrollView>
    </SafeAreaView>
  );
}

// ======= BUILDER TAB =======
function BuilderTab() {
  const [desc, setDesc] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const build = async () => {
    if (!desc.trim()) { Alert.alert('تنبيه', 'صف التطبيق الذي تريد بناءه'); return; }
    setLoading(true); setResult('');
    try {
      const code = await callGroq([
        { role: 'system', content: `أنت مطور React Native خبير. بناءً على الوصف، اكتب كود تطبيق أندرويد كامل بـ React Native.
يجب أن يكون الكود:
1. كامل وقابل للتشغيل مباشرة
2. يستخدم expo-image-picker و @expo/vector-icons
3. واجهة جميلة مع خلفية داكنة
4. يشمل كل المميزات المطلوبة

أرجع الكود فقط بدون شرح.` },
        { role: 'user', content: `اكتب تطبيق React Native كامل لـ: ${desc}` }
      ], MODELS.CHAT);
      setResult(code);
    } catch (e: any) { setResult(`❌ خطأ: ${e.message}`); }
    setLoading(false);
  };

  return (
    <SafeAreaView style={S.flex} edges={['top']}>
      <View style={S.header}>
        <Text style={S.headerTitle}>📦 صانع التطبيقات</Text>
        <Text style={S.headerSub}>AI App Builder</Text>
      </View>
      <ScrollView style={S.flex} contentContainerStyle={{ padding: 16 }}>
        <View style={S.card}>
          <Text style={S.cardTitle}>صف تطبيقك</Text>
          <Text style={S.sub}>اكتب وصفاً لتطبيقك وسيولد الذكاء الاصطناعي الكود الكامل له</Text>
          <TextInput style={[S.input, { marginHorizontal: 0, marginTop: 12, minHeight: 120 }]}
            placeholder="مثال: تطبيق لتتبع المصاريف اليومية مع رسوم بيانية ومزامنة سحابية..."
            placeholderTextColor={C.sub} value={desc} onChangeText={setDesc}
            multiline textAlignVertical="top" />
          <TouchableOpacity style={[S.analyzeBtn, { opacity: loading ? 0.5 : 1, marginTop: 12 }]}
            onPress={build} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <><Ionicons name="construct" size={20} color="#fff" /><Text style={S.analyzeBtnTxt}>ابنِ التطبيق</Text></>}
          </TouchableOpacity>
        </View>
        {result ? <View style={[S.resultBox, { marginTop: 16 }]}>
          <Text style={[S.cardTitle, { marginBottom: 8 }]}>✅ الكود المولّد</Text>
          <Text style={[S.resultTxt, { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 11 }]}>{result}</Text>
        </View> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

// ======= STYLES =======
const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  flex: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: C.border },
  headerTitle: { fontSize: 20, fontWeight: '700', color: C.text },
  headerSub: { fontSize: 12, color: C.sub },
  modelPicker: { flexDirection: 'row', backgroundColor: C.card, borderRadius: 8, overflow: 'hidden' },
  modelBtn: { paddingHorizontal: 10, paddingVertical: 5 },
  modelBtnActive: { backgroundColor: C.border },
  modelBtnTxt: { color: C.sub, fontSize: 12, fontWeight: '600' },
  msgList: { flex: 1 },
  bubble: { borderRadius: 16, padding: 12, marginVertical: 4, maxWidth: '85%' },
  bubbleUser: { backgroundColor: C.user, alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  bubbleBot: { backgroundColor: C.card, alignSelf: 'flex-start', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: C.border },
  botLabel: { fontSize: 10, color: C.accent, marginBottom: 4, fontWeight: '600' },
  bubbleTxt: { color: C.text, fontSize: 15, lineHeight: 22 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', padding: 12, paddingTop: 8, borderTopWidth: 1, borderTopColor: C.border },
  input: { flex: 1, backgroundColor: C.card, color: C.text, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, borderWidth: 1, borderColor: C.border, maxHeight: 120, marginHorizontal: 16 },
  sendBtn: { backgroundColor: C.accent, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  imgBox: { backgroundColor: C.card, borderRadius: 16, overflow: 'hidden', marginBottom: 12, minHeight: 200, borderWidth: 1, borderColor: C.border },
  previewImg: { width: '100%', height: 250, resizeMode: 'cover' },
  imgPlaceholder: { alignItems: 'center', justifyContent: 'center', height: 200 },
  imgPlaceholderTxt: { color: C.sub, marginTop: 12, fontSize: 14 },
  btnRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 12, paddingVertical: 12, gap: 8 },
  actionBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 15 },
  analyzeBtn: { backgroundColor: C.accent, borderRadius: 12, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  analyzeBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 16 },
  resultBox: { backgroundColor: C.card, borderRadius: 16, padding: 16, marginTop: 12, borderWidth: 1, borderColor: C.border },
  resultTxt: { color: C.text, fontSize: 14, lineHeight: 22 },
  nav: { flexDirection: 'row', backgroundColor: C.card, borderTopWidth: 1, borderTopColor: C.border },
  navItem: { flex: 1, alignItems: 'center', paddingTop: 10 },
  navLabel: { fontSize: 11, color: C.sub, marginTop: 4, marginBottom: 4 },
  card: { backgroundColor: C.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.border },
  cardTitle: { fontSize: 16, fontWeight: '700', color: C.text },
  sub: { fontSize: 13, color: C.sub, marginTop: 4 },
});
