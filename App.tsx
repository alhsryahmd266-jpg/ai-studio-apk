import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, Image, Platform,
  KeyboardAvoidingView, StatusBar, Dimensions, Animated,
  Modal, FlatList, Clipboard
} from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

const { width: W, height: H } = Dimensions.get('window');

// ============================================================
//   7 GROQ KEYS — AUTO-ROTATE AFTER EVERY MESSAGE
//   مفتاح 1 → مفتاح 2 → ... → مفتاح 7 → مفتاح 1 → ...
// ============================================================
const GROQ_KEYS = [
  process.env.EXPO_PUBLIC_GROQ_KEY_1 || '',
  process.env.EXPO_PUBLIC_GROQ_KEY_2 || '',
  process.env.EXPO_PUBLIC_GROQ_KEY_3 || '',
  process.env.EXPO_PUBLIC_GROQ_KEY_4 || '',
  process.env.EXPO_PUBLIC_GROQ_KEY_5 || '',
  process.env.EXPO_PUBLIC_GROQ_KEY_6 || '',
  process.env.EXPO_PUBLIC_GROQ_KEY_7 || '',
].filter(Boolean);

let _keyIdx = 0;

/** Returns current key then advances to next — 1 key per message */
function nextKey(): { key: string; num: number } {
  const num = (_keyIdx % GROQ_KEYS.length) + 1;
  const key = GROQ_KEYS[_keyIdx % GROQ_KEYS.length];
  _keyIdx++;
  return { key, num };
}

const MODELS = {
  CHAT: 'llama-3.3-70b-versatile',
  VISION: 'llama-3.2-11b-vision-preview',
  FAST: 'llama-3.1-8b-instant',
};

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

// ============================================================
//   GROQ API
// ============================================================
async function callGroq(
  messages: any[],
  model: string,
  key: string,
): Promise<string> {
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, max_tokens: 8192, temperature: 0.7 }),
  });
  if (!res.ok) throw new Error(`Groq error ${res.status}`);
  const d = await res.json();
  return d.choices[0]?.message?.content || '';
}

async function webSearch(q: string): Promise<string> {
  try {
    const r = await fetch(`https://s.jina.ai/${encodeURIComponent(q)}`, {
      headers: { Accept: 'text/plain', 'X-Return-Format': 'text' },
    });
    return (await r.text()).slice(0, 3000);
  } catch {
    return '';
  }
}

// ============================================================
//   THEME — DEEP SPACE LUXURY
// ============================================================
const T = {
  bg: '#04040E',
  card: '#0B0B1A',
  card2: '#0F0F22',
  border: '#1A1A3A',
  border2: '#252550',
  accent: '#7C5CFF',
  accent2: '#00E5CC',
  gold: '#F5C842',
  red: '#FF4466',
  text: '#F0F0FF',
  sub: '#6A6A99',
  sub2: '#4A4A77',
  userBubble: '#1A0F3C',
  botBubble: '#070714',
  glow: 'rgba(124,92,255,0.35)',
  glow2: 'rgba(0,229,204,0.25)',
};

type Tab = 'chat' | 'vision' | 'search' | 'builder' | 'settings';
interface Msg { role: 'user' | 'assistant'; content: string; image?: string; keyNum?: number; model?: string; }

// ============================================================
//   ROOT
// ============================================================
export default function App() {
  const [tab, setTab] = useState<Tab>('chat');
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 2500, useNativeDriver: false }),
        Animated.timing(glow, { toValue: 0, duration: 2500, useNativeDriver: false }),
      ])
    ).start();
  }, []);

  const bgOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0.06, 0.14] });

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor={T.bg} />
      <View style={[S.root, { backgroundColor: T.bg }]}>
        {/* Ambient glow orbs */}
        <Animated.View style={[S.orb, S.orbLeft, { opacity: bgOpacity }]} />
        <Animated.View style={[S.orb, S.orbRight, { opacity: bgOpacity }]} />
        {tab === 'chat' && <ChatTab />}
        {tab === 'vision' && <VisionTab />}
        {tab === 'search' && <SearchTab />}
        {tab === 'builder' && <BuilderTab />}
        {tab === 'settings' && <SettingsTab />}
        <NavBar tab={tab} setTab={setTab} />
      </View>
    </SafeAreaProvider>
  );
}

// ============================================================
//   NAV BAR
// ============================================================
function NavBar({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  const insets = useSafeAreaInsets();
  const tabs: { id: Tab; icon: string; label: string; color: string }[] = [
    { id: 'chat', icon: 'chatbubble-ellipses', label: 'Chat', color: T.accent },
    { id: 'vision', icon: 'eye', label: 'Vision', color: T.accent2 },
    { id: 'search', icon: 'globe', label: 'Search', color: T.gold },
    { id: 'builder', icon: 'cube', label: 'Builder', color: '#FF6B9D' },
    { id: 'settings', icon: 'settings', label: 'Keys', color: T.sub },
  ];
  return (
    <View style={[S.nav, { paddingBottom: insets.bottom || 8 }]}>
      {tabs.map(t => {
        const active = tab === t.id;
        return (
          <TouchableOpacity key={t.id} style={S.navBtn} onPress={() => setTab(t.id)}>
            {active && <View style={[S.navGlow, { backgroundColor: t.color + '22' }]} />}
            <Ionicons
              name={(active ? t.icon : `${t.icon}-outline`) as any}
              size={22}
              color={active ? t.color : T.sub2}
            />
            <Text style={[S.navLabel, active && { color: t.color }]}>{t.label}</Text>
            {active && <View style={[S.navDot, { backgroundColor: t.color }]} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ============================================================
//   HEADER
// ============================================================
function Header({ title, sub, right }: { title: string; sub?: string; right?: React.ReactNode }) {
  return (
    <View style={S.header}>
      <View>
        <Text style={S.headerTitle}>{title}</Text>
        {sub && <Text style={S.headerSub}>{sub}</Text>}
      </View>
      {right}
    </View>
  );
}

// ============================================================
//   CHAT TAB
// ============================================================
function ChatTab() {
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: 'assistant', content: 'أهلاً! أنا مساعدك الذكي المدعوم بـ Groq ⚡\n\nأقدر أساعدك في:\n• الكود والبرمجة\n• تحليل الصور 👁️\n• البحث في الإنترنت 🔍\n• بناء تطبيقات\n• أي سؤال في أي مجال 🌍\n\nالمفاتيح السبعة جاهزة وتتبدل تلقائياً 🔑', keyNum: 0, model: 'system' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState<'CHAT' | 'FAST'>('CHAT');
  const [useSearch, setUseSearch] = useState(false);
  const scroll = useRef<ScrollView>(null);
  const inputAnim = useRef(new Animated.Value(1)).current;

  const pulse = () => {
    Animated.sequence([
      Animated.timing(inputAnim, { toValue: 0.97, duration: 80, useNativeDriver: true }),
      Animated.timing(inputAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
  };

  const send = useCallback(async () => {
    if (!input.trim() || loading) return;
    pulse();
    const text = input.trim();
    const { key, num } = nextKey(); // 🔑 ONE key per message
    const userMsg: Msg = { role: 'user', content: text, keyNum: num };
    const history = [...msgs, userMsg];
    setMsgs(history);
    setInput('');
    setLoading(true);

    try {
      let context = '';
      if (useSearch) {
        context = await webSearch(text);
      }

      const sysprompt = `أنت مساعد ذكاء اصطناعي متطور جداً — أفضل مساعد في العالم.
تتميز بـ:
• استدلال عميق وتفكير منطقي خطوة بخطوة
• كتابة كود احترافي بأي لغة برمجة
• تحليل شامل وإبداعي لأي موضوع
• دقة عالية في الإجابات
• تحدث العربية والإنجليزية بطلاقة تامة

${context ? `معلومات من الإنترنت:\n${context}\n\nاستخدم هذه المعلومات في إجابتك.` : ''}

أجب دائماً بشكل مفصل ومفيد وواضح.`;

      const apiMsgs = [
        { role: 'system', content: sysprompt },
        ...history.slice(-20).map(m => ({ role: m.role, content: m.content })),
      ];

      const reply = await callGroq(apiMsgs, MODELS[model], key);
      setMsgs(prev => [...prev, { role: 'assistant', content: reply, keyNum: num, model: MODELS[model] }]);
    } catch (e: any) {
      setMsgs(prev => [...prev, { role: 'assistant', content: `❌ خطأ: ${e.message}`, keyNum: num }]);
    }
    setLoading(false);
    setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 150);
  }, [input, loading, msgs, model, useSearch]);

  return (
    <KeyboardAvoidingView style={S.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView style={S.flex} edges={['top']}>
        <Header
          title="🧠 AI Studio"
          sub="مساعد ذكي متطور"
          right={
            <View style={S.row}>
              <TouchableOpacity style={[S.pill, useSearch && { backgroundColor: T.gold + '33', borderColor: T.gold }]}
                onPress={() => setUseSearch(v => !v)}>
                <Ionicons name="globe" size={13} color={useSearch ? T.gold : T.sub} />
                <Text style={[S.pillTxt, useSearch && { color: T.gold }]}>Web</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[S.pill, model === 'FAST' && { backgroundColor: T.accent2 + '22', borderColor: T.accent2 }]}
                onPress={() => setModel(m => m === 'CHAT' ? 'FAST' : 'CHAT')}>
                <Text style={[S.pillTxt, model === 'FAST' && { color: T.accent2 }]}>
                  {model === 'CHAT' ? '70B' : '⚡8B'}
                </Text>
              </TouchableOpacity>
            </View>
          }
        />

        <ScrollView ref={scroll} style={S.flex} contentContainerStyle={{ padding: 14 }}
          showsVerticalScrollIndicator={false}>
          {msgs.map((m, i) => <ChatBubble key={i} msg={m} />)}
          {loading && (
            <View style={[S.bubble, S.bubbleBot]}>
              <View style={S.typingRow}>
                {[0, 1, 2].map(i => <TypingDot key={i} delay={i * 180} />)}
              </View>
            </View>
          )}
        </ScrollView>

        <Animated.View style={{ transform: [{ scale: inputAnim }] }}>
          <View style={S.inputBar}>
            <TextInput
              style={S.input}
              placeholder="اكتب رسالتك..."
              placeholderTextColor={T.sub2}
              value={input}
              onChangeText={setInput}
              multiline
              returnKeyType="send"
              onSubmitEditing={send}
            />
            <TouchableOpacity
              style={[S.sendBtn, { opacity: loading || !input.trim() ? 0.4 : 1 }]}
              onPress={send}
              disabled={loading || !input.trim()}
            >
              <Ionicons name="send" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

// ============================================================
//   TYPING DOT
// ============================================================
function TypingDot({ delay }: { delay: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const t = setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: -6, duration: 350, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 350, useNativeDriver: true }),
        ])
      ).start();
    }, delay);
    return () => clearTimeout(t);
  }, []);
  return <Animated.View style={[S.dot, { transform: [{ translateY: anim }] }]} />;
}

// ============================================================
//   CHAT BUBBLE
// ============================================================
function ChatBubble({ msg }: { msg: Msg }) {
  const [copied, setCopied] = useState(false);
  const isUser = msg.role === 'user';
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(anim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 8 }).start();
  }, []);

  const copy = () => {
    Clipboard.setString(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Animated.View style={{ opacity: anim, transform: [{ scale: anim }] }}>
      <View style={[S.bubble, isUser ? S.bubbleUser : S.bubbleBot]}>
        {!isUser && msg.model !== 'system' && (
          <View style={S.botMeta}>
            <View style={S.botDot} />
            <Text style={S.botMetaTxt}>AI Studio</Text>
            {msg.keyNum !== undefined && msg.keyNum > 0 && (
              <View style={S.keyBadge}>
                <Text style={S.keyBadgeTxt}>🔑 {msg.keyNum}/7</Text>
              </View>
            )}
          </View>
        )}
        <Text style={[S.bubbleTxt, isUser && { color: '#E8E0FF' }]}>{msg.content}</Text>
        {!isUser && (
          <TouchableOpacity style={S.copyBtn} onPress={copy}>
            <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={13} color={copied ? T.accent2 : T.sub2} />
            <Text style={[S.copyTxt, copied && { color: T.accent2 }]}>{copied ? 'تم النسخ' : 'نسخ'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}

// ============================================================
//   VISION TAB
// ============================================================
function VisionTab() {
  const [image, setImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('حلل هذه الصورة بالتفصيل الكامل');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [keyNum, setKeyNum] = useState(0);

  const pick = async (camera = false) => {
    const perm = camera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('إذن مطلوب'); return; }
    const res = camera
      ? await ImagePicker.launchCameraAsync({ base64: true, quality: 0.8 })
      : await ImagePicker.launchImageLibraryAsync({ base64: true, quality: 0.8, allowsEditing: true });
    if (!res.canceled && res.assets[0].base64) setImage(res.assets[0].base64);
  };

  const analyze = async () => {
    if (!image) { Alert.alert('اختر صورة أولاً'); return; }
    const { key, num } = nextKey(); // 🔑 one key per analysis
    setKeyNum(num);
    setLoading(true);
    setResult('');
    try {
      const reply = await callGroq([{
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${image}` } },
        ],
      }], MODELS.VISION, key);
      setResult(reply);
    } catch (e: any) {
      setResult(`❌ ${e.message}`);
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={S.flex} edges={['top']}>
      <Header title="👁️ الرؤية البصرية" sub="Llama 3.2 Vision — تحليل صور" />
      <ScrollView style={S.flex} contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
        <View style={S.imgBox}>
          {image
            ? <Image source={{ uri: `data:image/jpeg;base64,${image}` }} style={S.previewImg} />
            : <View style={S.imgEmpty}>
              <Ionicons name="image-outline" size={56} color={T.sub2} />
              <Text style={S.imgEmptyTxt}>اختر صورة للتحليل</Text>
            </View>}
        </View>

        <View style={[S.row, { gap: 10, marginBottom: 14 }]}>
          <TouchableOpacity style={[S.actionBtn, { backgroundColor: T.accent + '22', borderColor: T.accent }]} onPress={() => pick(false)}>
            <Ionicons name="images" size={18} color={T.accent} />
            <Text style={[S.actionBtnTxt, { color: T.accent }]}>معرض</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[S.actionBtn, { backgroundColor: T.accent2 + '22', borderColor: T.accent2 }]} onPress={() => pick(true)}>
            <Ionicons name="camera" size={18} color={T.accent2} />
            <Text style={[S.actionBtnTxt, { color: T.accent2 }]}>كاميرا</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={[S.input, { marginHorizontal: 0, marginBottom: 12, minHeight: 60 }]}
          placeholder="ماذا تريد أن تعرف عن الصورة؟"
          placeholderTextColor={T.sub2}
          value={prompt}
          onChangeText={setPrompt}
          multiline
        />

        <TouchableOpacity style={[S.bigBtn, { opacity: loading ? 0.5 : 1 }]} onPress={analyze} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <><Ionicons name="scan" size={20} color="#fff" /><Text style={S.bigBtnTxt}>تحليل الصورة بالذكاء الاصطناعي</Text></>}
        </TouchableOpacity>

        {result ? (
          <View style={[S.resultCard, { marginTop: 16 }]}>
            <View style={[S.row, { justifyContent: 'space-between', marginBottom: 10 }]}>
              <Text style={S.resultTitle}>📋 نتيجة التحليل</Text>
              {keyNum > 0 && <View style={S.keyBadge}><Text style={S.keyBadgeTxt}>🔑 {keyNum}/7</Text></View>}
            </View>
            <Text style={S.resultTxt}>{result}</Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================================
//   SEARCH TAB
// ============================================================
function SearchTab() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [keyNum, setKeyNum] = useState(0);

  const search = async () => {
    if (!query.trim()) return;
    const { key, num } = nextKey(); // 🔑 one key per search
    setKeyNum(num);
    setLoading(true);
    setResult('');
    try {
      const web = await webSearch(query);
      const summary = await callGroq([
        { role: 'system', content: 'أنت محرك بحث ذكي. لخص المعلومات بشكل واضح ومفيد ودقيق باللغة العربية مع المصادر.' },
        { role: 'user', content: `السؤال: ${query}\n\nمعلومات من الإنترنت:\n${web}\n\nقدم ملخصاً شاملاً ومفيداً.` },
      ], MODELS.FAST, key);
      setResult(summary);
    } catch (e: any) {
      setResult(`❌ ${e.message}`);
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={S.flex} edges={['top']}>
      <Header title="🔍 البحث الذكي" sub="Jina AI + Llama 3.1 — بحث حقيقي" />
      <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
        <View style={S.inputBar}>
          <TextInput
            style={S.input}
            placeholder="ابحث في الإنترنت..."
            placeholderTextColor={T.sub2}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            onSubmitEditing={search}
          />
          <TouchableOpacity style={[S.sendBtn, { backgroundColor: T.gold, opacity: loading ? 0.5 : 1 }]} onPress={search}>
            <Ionicons name="search" size={18} color={T.bg} />
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView style={S.flex} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        {loading && <View style={{ alignItems: 'center', marginTop: 60 }}>
          <ActivityIndicator color={T.gold} size="large" />
          <Text style={[S.sub, { marginTop: 16 }]}>يبحث في الإنترنت...</Text>
        </View>}
        {result ? (
          <View style={S.resultCard}>
            <View style={[S.row, { justifyContent: 'space-between', marginBottom: 10 }]}>
              <Text style={S.resultTitle}>🌐 نتائج البحث</Text>
              {keyNum > 0 && <View style={S.keyBadge}><Text style={S.keyBadgeTxt}>🔑 {keyNum}/7</Text></View>}
            </View>
            <Text style={S.resultTxt}>{result}</Text>
          </View>
        ) : !loading && (
          <View style={{ alignItems: 'center', marginTop: 70 }}>
            <Ionicons name="globe-outline" size={80} color={T.border2} />
            <Text style={[S.sub, { marginTop: 20, textAlign: 'center', lineHeight: 24 }]}>
              ابحث في أي موضوع{'\n'}وسأقدم لك ملخصاً ذكياً فورياً
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================================
//   BUILDER TAB
// ============================================================
function BuilderTab() {
  const [desc, setDesc] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [keyNum, setKeyNum] = useState(0);

  const build = async () => {
    if (!desc.trim()) { Alert.alert('صف التطبيق الذي تريد بناءه'); return; }
    const { key, num } = nextKey();
    setKeyNum(num);
    setLoading(true);
    setResult('');
    try {
      const code = await callGroq([
        {
          role: 'system',
          content: `أنت مطور React Native خبير ذو مستوى عالمي.
بناءً على وصف المستخدم، اكتب كود تطبيق أندرويد كامل وجاهز للتشغيل باستخدام React Native.
الكود يجب أن:
1. يكون كاملاً ويعمل مباشرة
2. يستخدم واجهة جميلة مع خلفية داكنة
3. يشمل جميع المميزات المطلوبة
4. يكون منظماً وموثقاً
أرجع الكود فقط بدون شرح خارجي.`,
        },
        { role: 'user', content: `اكتب تطبيق React Native كامل لـ:\n${desc}` },
      ], MODELS.CHAT, key);
      setResult(code);
    } catch (e: any) {
      setResult(`❌ ${e.message}`);
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={S.flex} edges={['top']}>
      <Header title="📦 صانع التطبيقات" sub="AI App Builder — من الوصف إلى الكود" />
      <ScrollView style={S.flex} contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
        <View style={S.card}>
          <Text style={S.cardTitle}>🎯 صف تطبيقك بالعربية أو الإنجليزية</Text>
          <Text style={S.cardSub}>سيولد الذكاء الاصطناعي الكود الكامل لتطبيق أندرويد احترافي</Text>
          <TextInput
            style={[S.input, { marginHorizontal: 0, marginTop: 14, minHeight: 130, textAlignVertical: 'top' }]}
            placeholder={'مثال:\nتطبيق لتتبع المصاريف اليومية مع رسوم بيانية جميلة وإمكانية التصدير...'}
            placeholderTextColor={T.sub2}
            value={desc}
            onChangeText={setDesc}
            multiline
          />
          <TouchableOpacity
            style={[S.bigBtn, { marginTop: 14, opacity: loading ? 0.5 : 1 }]}
            onPress={build}
            disabled={loading}
          >
            {loading
              ? <><ActivityIndicator color="#fff" style={{ marginRight: 8 }} /><Text style={S.bigBtnTxt}>يبني التطبيق...</Text></>
              : <><Ionicons name="construct" size={20} color="#fff" /><Text style={S.bigBtnTxt}>ابنِ التطبيق الآن</Text></>}
          </TouchableOpacity>
        </View>

        {result ? (
          <View style={[S.resultCard, { marginTop: 16 }]}>
            <View style={[S.row, { justifyContent: 'space-between', marginBottom: 10 }]}>
              <Text style={S.resultTitle}>✅ الكود الجاهز</Text>
              {keyNum > 0 && <View style={S.keyBadge}><Text style={S.keyBadgeTxt}>🔑 {keyNum}/7</Text></View>}
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator>
              <Text style={[S.resultTxt, { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 11 }]}>
                {result}
              </Text>
            </ScrollView>
            <TouchableOpacity style={S.copyBigBtn} onPress={() => { Clipboard.setString(result); Alert.alert('✅ تم نسخ الكود'); }}>
              <Ionicons name="copy" size={16} color={T.accent2} />
              <Text style={{ color: T.accent2, marginLeft: 6, fontWeight: '600' }}>نسخ الكود</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================================
//   SETTINGS / KEYS STATUS TAB
// ============================================================
function SettingsTab() {
  const totalKeys = GROQ_KEYS.length;
  const currentKey = (_keyIdx % totalKeys) + 1;

  return (
    <SafeAreaView style={S.flex} edges={['top']}>
      <Header title="⚙️ الإعدادات" sub="حالة المفاتيح والنظام" />
      <ScrollView style={S.flex} contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
        <View style={S.card}>
          <Text style={S.cardTitle}>🔑 مفاتيح Groq API</Text>
          <Text style={S.cardSub}>تتبدل تلقائياً بعد كل رسالة — مفتاح بعد مفتاح</Text>
          <View style={[S.row, { flexWrap: 'wrap', marginTop: 14, gap: 8 }]}>
            {Array.from({ length: 7 }, (_, i) => {
              const kn = i + 1;
              const active = kn === currentKey;
              const hasKey = i < totalKeys;
              return (
                <View key={i} style={[S.keyCard, active && S.keyCardActive, !hasKey && { opacity: 0.3 }]}>
                  <Text style={[S.keyCardNum, active && { color: T.accent }]}>{kn}</Text>
                  <Ionicons name={hasKey ? 'key' : 'key-outline'} size={16} color={active ? T.accent : T.sub} />
                  {active && <Text style={S.keyActiveLabel}>جاري</Text>}
                </View>
              );
            })}
          </View>
          <View style={[S.statRow, { marginTop: 16 }]}>
            <Text style={S.statLabel}>المفاتيح المتاحة</Text>
            <Text style={[S.statVal, { color: T.accent2 }]}>{totalKeys} / 7</Text>
          </View>
          <View style={S.statRow}>
            <Text style={S.statLabel}>المفتاح التالي</Text>
            <Text style={[S.statVal, { color: T.accent }]}>🔑 {currentKey}</Text>
          </View>
          <View style={S.statRow}>
            <Text style={S.statLabel}>إجمالي الطلبات</Text>
            <Text style={[S.statVal, { color: T.gold }]}>{_keyIdx}</Text>
          </View>
        </View>

        <View style={[S.card, { marginTop: 14 }]}>
          <Text style={S.cardTitle}>🤖 النماذج المتاحة</Text>
          {[
            { name: 'Llama 3.3 70B', use: 'Chat عميق • كود • تحليل', color: T.accent, icon: '🧠' },
            { name: 'Llama 3.2 Vision', use: 'تحليل صور • رؤية بصرية', color: T.accent2, icon: '👁️' },
            { name: 'Llama 3.1 8B', use: 'استجابة فورية • بحث', color: T.gold, icon: '⚡' },
          ].map((m, i) => (
            <View key={i} style={[S.modelRow, i > 0 && { borderTopWidth: 1, borderTopColor: T.border }]}>
              <Text style={{ fontSize: 22 }}>{m.icon}</Text>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[S.modelName, { color: m.color }]}>{m.name}</Text>
                <Text style={S.modelUse}>{m.use}</Text>
              </View>
              <View style={[S.activeDot, { backgroundColor: m.color }]} />
            </View>
          ))}
        </View>

        <View style={[S.card, { marginTop: 14 }]}>
          <Text style={S.cardTitle}>🔍 Jina AI Search</Text>
          <Text style={[S.sub, { marginTop: 6 }]}>بحث ويب حقيقي مجاني • بدون مفتاح API</Text>
          <View style={[S.statRow, { marginTop: 10 }]}>
            <Text style={S.statLabel}>الحالة</Text>
            <Text style={[S.statVal, { color: T.accent2 }]}>✅ متصل</Text>
          </View>
        </View>

        <View style={[S.infoBox, { marginTop: 14 }]}>
          <Ionicons name="information-circle" size={16} color={T.accent} style={{ marginRight: 8 }} />
          <Text style={[S.sub, { flex: 1, lineHeight: 20 }]}>
            كل رسالة تستخدم مفتاحاً مختلفاً تلقائياً لضمان عدم التوقف وتوزيع الحمل على 7 مفاتيح.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================================
//   STYLES
// ============================================================
const S = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  orb: {
    position: 'absolute', width: W * 0.8, height: W * 0.8,
    borderRadius: W * 0.4,
  },
  orbLeft: { top: -W * 0.3, left: -W * 0.3, backgroundColor: '#6C63FF' },
  orbRight: { bottom: -W * 0.3, right: -W * 0.3, backgroundColor: '#00E5CC' },
  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: T.border,
    backgroundColor: T.card + 'CC',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: T.text, letterSpacing: 0.3 },
  headerSub: { fontSize: 11, color: T.sub, marginTop: 2 },
  // Nav
  nav: {
    flexDirection: 'row', backgroundColor: T.card,
    borderTopWidth: 1, borderTopColor: T.border,
  },
  navBtn: { flex: 1, alignItems: 'center', paddingTop: 10, position: 'relative' },
  navGlow: { position: 'absolute', top: 0, left: 4, right: 4, bottom: 0, borderRadius: 12 },
  navLabel: { fontSize: 10, color: T.sub2, marginTop: 3, marginBottom: 4, fontWeight: '600' },
  navDot: { width: 4, height: 4, borderRadius: 2, marginTop: 1 },
  // Chat
  msgList: { flex: 1 },
  bubble: { borderRadius: 18, padding: 13, marginVertical: 5, maxWidth: '88%' },
  bubbleUser: {
    backgroundColor: T.userBubble, alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
    borderWidth: 1, borderColor: T.accent + '44',
    shadowColor: T.accent, shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  bubbleBot: {
    backgroundColor: T.botBubble, alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    borderWidth: 1, borderColor: T.border2,
  },
  botMeta: { flexDirection: 'row', alignItems: 'center', marginBottom: 7, gap: 6 },
  botDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: T.accent2 },
  botMetaTxt: { fontSize: 10, color: T.accent2, fontWeight: '700', letterSpacing: 0.5 },
  keyBadge: {
    backgroundColor: T.accent + '22', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2,
    borderWidth: 1, borderColor: T.accent + '44',
  },
  keyBadgeTxt: { fontSize: 9, color: T.accent, fontWeight: '700' },
  bubbleTxt: { color: T.text, fontSize: 15, lineHeight: 23 },
  typingRow: { flexDirection: 'row', gap: 6, padding: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: T.accent },
  copyBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 4, alignSelf: 'flex-end' },
  copyTxt: { fontSize: 11, color: T.sub2 },
  // Input
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: 14, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: T.border,
    backgroundColor: T.card + 'DD',
  },
  input: {
    flex: 1, backgroundColor: T.card2, color: T.text,
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 11,
    fontSize: 15, borderWidth: 1, borderColor: T.border2,
    maxHeight: 130, lineHeight: 22,
  },
  sendBtn: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: T.accent, alignItems: 'center', justifyContent: 'center',
    marginLeft: 10,
    shadowColor: T.accent, shadowOpacity: 0.5, shadowRadius: 10, shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  // Pills
  row: { flexDirection: 'row', alignItems: 'center' },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10,
    borderWidth: 1, borderColor: T.border2, marginLeft: 6,
  },
  pillTxt: { fontSize: 11, color: T.sub, fontWeight: '700' },
  // Vision
  imgBox: {
    backgroundColor: T.card, borderRadius: 20, overflow: 'hidden',
    marginBottom: 14, minHeight: 210,
    borderWidth: 1, borderColor: T.border2,
  },
  previewImg: { width: '100%', height: 260, resizeMode: 'cover' },
  imgEmpty: { alignItems: 'center', justifyContent: 'center', height: 210 },
  imgEmptyTxt: { color: T.sub, marginTop: 14, fontSize: 14 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderRadius: 14, paddingVertical: 13, gap: 8, borderWidth: 1,
  },
  actionBtnTxt: { fontWeight: '700', fontSize: 15 },
  bigBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: T.accent, borderRadius: 16, paddingVertical: 15,
    shadowColor: T.accent, shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  bigBtnTxt: { color: '#fff', fontWeight: '800', fontSize: 16, letterSpacing: 0.3 },
  // Results
  resultCard: {
    backgroundColor: T.card, borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: T.border2,
  },
  resultTitle: { fontSize: 14, fontWeight: '700', color: T.text },
  resultTxt: { color: '#D0D0FF', fontSize: 14, lineHeight: 23 },
  // Builder
  card: {
    backgroundColor: T.card, borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: T.border2,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: T.text },
  cardSub: { fontSize: 12, color: T.sub, marginTop: 5, lineHeight: 18 },
  copyBigBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginTop: 12, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: T.border2,
  },
  // Settings
  keyCard: {
    width: (W - 32 - 48) / 7 + 6, alignItems: 'center', padding: 10,
    backgroundColor: T.card2, borderRadius: 12,
    borderWidth: 1, borderColor: T.border,
  },
  keyCardActive: {
    backgroundColor: T.accent + '22', borderColor: T.accent,
    shadowColor: T.accent, shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  keyCardNum: { fontSize: 13, fontWeight: '800', color: T.sub, marginBottom: 4 },
  keyActiveLabel: { fontSize: 8, color: T.accent, fontWeight: '700', marginTop: 3 },
  statRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: T.border,
  },
  statLabel: { fontSize: 13, color: T.sub },
  statVal: { fontSize: 14, fontWeight: '700' },
  modelRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  modelName: { fontSize: 14, fontWeight: '700' },
  modelUse: { fontSize: 12, color: T.sub, marginTop: 2 },
  activeDot: { width: 8, height: 8, borderRadius: 4 },
  infoBox: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: T.accent + '11', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: T.accent + '33',
  },
  sub: { fontSize: 13, color: T.sub },
});
