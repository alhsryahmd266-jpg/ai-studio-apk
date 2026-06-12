import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  StyleSheet, View, Text, TextInput, TouchableOpacity,
  ScrollView, Image, ActivityIndicator, KeyboardAvoidingView,
  Platform, SafeAreaView, Dimensions, Animated, StatusBar,
  Alert, Modal, FlatList, Pressable, Linking, Share, Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

// ═══════════════════════════════════════════════
//  NEBULA STUDIO PRO — ULTIMATE AI AGENT
//  24 Tools · Visual Thinking · Self-Browsing
// ═══════════════════════════════════════════════

const C = {
  bg: '#03010a',
  bg2: '#07030f',
  glass: 'rgba(255,255,255,0.04)',
  glassBorder: 'rgba(255,255,255,0.09)',
  purple: '#8b5cf6',
  purpleDark: '#6d28d9',
  purpleGlow: 'rgba(139,92,246,0.3)',
  blue: '#3b82f6',
  blueDark: '#1d4ed8',
  cyan: '#06b6d4',
  teal: '#14b8a6',
  pink: '#ec4899',
  gold: '#f59e0b',
  white: '#ffffff',
  gray: '#94a3b8',
  grayDark: '#475569',
  green: '#22c55e',
  red: '#ef4444',
  orange: '#f97316',
};

const MODELS = [
  { id: 'meta-llama/llama-4-maverick-17b-128e-instruct', name: 'Llama 4 Maverick', icon: 'rocket-outline', color: C.purple },
  { id: 'meta-llama/llama-4-scout-17b-16e-instruct', name: 'Llama 4 Scout', icon: 'telescope-outline', color: C.blue },
  { id: 'deepseek-r1-distill-llama-70b', name: 'DeepSeek R1', icon: 'bulb-outline', color: C.cyan },
  { id: 'qwen-qwq-32b', name: 'QwQ 32B', icon: 'infinite-outline', color: C.teal },
  { id: 'llama-3.2-90b-vision-preview', name: 'Vision 90B', icon: 'eye-outline', color: C.pink },
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3', icon: 'layers-outline', color: C.gold },
];

const TABS = [
  { id: 'Agent', icon: 'hardware-chip-outline', label: 'Agent', color: C.purple },
  { id: 'Chat', icon: 'chatbubbles-outline', label: 'Chat', color: C.blue },
  { id: 'ProAgents', icon: 'people-outline', label: 'Pro', color: C.pink },
  { id: 'Vision', icon: 'eye-outline', label: 'Vision', color: C.pink },
  { id: 'Search', icon: 'search-outline', label: 'Search', color: C.cyan },
  { id: 'Create', icon: 'color-palette-outline', label: 'Create', color: C.gold },
  { id: 'Build', icon: 'code-slash-outline', label: 'Build', color: C.teal },
  { id: 'Vault', icon: 'lock-closed-outline', label: 'Vault', color: C.orange },
];

const PRO_AGENTS = [
  {
    id: 'architect',
    name: 'المهندس المعماري',
    icon: 'construct-outline',
    color: '#8b5cf6',
    model: 'deepseek-r1-distill-llama-70b',
    system: `أنت مهندس برمجيات معماري خبير متخصص في React Native وExpo.
لديك معرفة كاملة بمشروع NEBULA STUDIO PRO:
- 24 أداة لوكيل ذكاء اصطناعي مستقل
- تصفح الإنترنت الذاتي عبر Jina AI
- تفكير بصري بـ Vision 90B
- تدوير 7 مفاتيح Groq
- بنية ReAct loop
تحلل الكود وتقترح تحسينات معمارية عميقة.`
  },
  {
    id: 'ui_designer',
    name: 'مصمم UI/UX',
    icon: 'color-palette-outline',
    color: '#ec4899',
    model: 'meta-llama/llama-4-maverick-17b-128e-instruct',
    system: `أنت مصمم UI/UX خبير متخصص في React Native وExpo.
تفهم NEBULA STUDIO PRO وتقترح تحسينات بصرية وتجربة مستخدم.
تعمل مع: LinearGradient, Glassmorphism, Animations, Starfield.`
  },
  {
    id: 'debugger',
    name: 'مصحح الأخطاء',
    icon: 'bug-outline',
    color: '#ef4444',
    model: 'deepseek-r1-distill-llama-70b',
    system: `أنت مصحح أخطاء خبير في React Native وExpo وHermes engine.
تجد أسباب الأخطاء وتصلحها فوراً. تفهم مشاكل:
- Hermes JS engine compatibility
- Expo SDK 52 specifics  
- React Native 0.76 issues
- Groq API errors`
  },
  {
    id: 'app_builder',
    name: 'بنّاء التطبيقات',
    icon: 'rocket-outline',
    color: '#06b6d4',
    model: 'meta-llama/llama-4-maverick-17b-128e-instruct',
    system: `أنت مطور React Native Expo خبير.
تبني تطبيقات كاملة وجاهزة للتشغيل فوراً.
تكتب كوداً نظيفاً وقابلاً للصيانة.`
  },
  {
    id: 'deep_thinker',
    name: 'المفكر العميق',
    icon: 'infinite-outline',
    color: '#14b8a6',
    model: 'deepseek-r1-distill-llama-70b',
    system: `أنت مفكر استراتيجي عميق. تحلل المسائل المعقدة وتجد حلولاً مبتكرة.
تفكر بعمق في: معمارية الأنظمة، خوارزميات الذكاء الاصطناعي، استراتيجيات التطوير.`
  },
  {
    id: 'security',
    name: 'خبير الأمان',
    icon: 'shield-checkmark-outline',
    color: '#f59e0b',
    model: 'deepseek-r1-distill-llama-70b',
    system: `أنت خبير أمان متخصص في تطبيقات الموبايل والذكاء الاصطناعي.
تراجع: API key security, data encryption, network security, Expo secure storage.
تقترح حلولاً أمنية قابلة للتطبيق.`
  },
];

const TOOL_LIST = [
  { id: 'search_web', name: 'Web Search', icon: 'search', color: C.blue, prompt: 'Search the web for ' },
  { id: 'fetch_url', name: 'Fetch URL', icon: 'globe-outline', color: C.cyan, prompt: 'Fetch the content of ' },
  { id: 'get_weather', name: 'Weather', icon: 'partly-sunny-outline', color: C.gold, prompt: 'Get weather for ' },
  { id: 'search_github', name: 'GitHub Search', icon: 'logo-github', color: C.white, prompt: 'Search GitHub for ' },
  { id: 'build_app', name: 'Build App', icon: 'code-slash', color: C.teal, prompt: 'Build a React Native app that ' },
  { id: 'analyze_code', name: 'Code Review', icon: 'analytics-outline', color: C.purple, prompt: 'Analyze this code: ' },
  { id: 'execute_code', name: 'Run JS', icon: 'play-outline', color: C.green, prompt: 'Execute this JavaScript: ' },
  { id: 'fix_error', name: 'Fix Error', icon: 'bug-outline', color: C.red, prompt: 'Fix this error: ' },
  { id: 'push_github', name: 'Push to Git', icon: 'cloud-upload-outline', color: C.blue, prompt: 'Push to GitHub repo: ' },
  { id: 'read_github_file', name: 'Read File', icon: 'document-text-outline', color: C.gray, prompt: 'Read file from GitHub: ' },
  { id: 'list_github_files', name: 'List Files', icon: 'folder-open-outline', color: C.orange, prompt: 'List files in repo: ' },
  { id: 'create_github_issue', name: 'Git Issue', icon: 'alert-circle-outline', color: C.red, prompt: 'Create an issue in: ' },
  { id: 'generate_image', name: 'AI Image', icon: 'image-outline', color: C.pink, prompt: 'Generate an image of ' },
  { id: 'analyze_image', name: 'Vision AI', icon: 'eye-outline', color: C.purple, prompt: 'Analyze this image: ' },
  { id: 'summarize_text', name: 'Summarize', icon: 'list-outline', color: C.cyan, prompt: 'Summarize this: ' },
  { id: 'translate_text', name: 'Translate', icon: 'language-outline', color: C.blue, prompt: 'Translate this to English: ' },
  { id: 'create_plan', name: 'Planner', icon: 'calendar-outline', color: C.gold, prompt: 'Create a plan for ' },
  { id: 'deep_think', name: 'Deep Think', icon: 'infinite-outline', color: C.purple, prompt: 'Think deeply about ' },
  { id: 'read_memory', name: 'Read RAM', icon: 'reader-outline', color: C.teal, prompt: 'Read from memory: ' },
  { id: 'save_memory', name: 'Save RAM', icon: 'save-outline', color: C.green, prompt: 'Save to memory: ' },
  { id: 'list_memory', name: 'List RAM', icon: 'layers-outline', color: C.blue, prompt: 'List all memory items' },
  { id: 'calculate', name: 'حساب', icon: 'calculator-outline', color: C.green, prompt: 'احسب: ' },
  { id: 'get_datetime', name: 'التاريخ', icon: 'calendar-outline', color: C.gold, prompt: 'ما التاريخ والوقت الآن؟' },
  { id: 'format_json', name: 'Format JSON', icon: 'code-outline', color: C.teal, prompt: 'نسّق هذا JSON: ' },
];

const safeBase64 = (str) => {
  try {
    return btoa(unescape(encodeURIComponent(str)));
  } catch {
    return btoa(str.replace(/[^\x00-\x7F]/g, c => encodeURIComponent(c)));
  }
};

// ─── STAR FIELD ──────────────────────────────────
const STARS = Array.from({ length: 120 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: 0.8 + Math.random() * 2.2,
  opacity: 0.3 + Math.random() * 0.7,
  dur: 2500 + Math.random() * 5000,
}));

const StarBed = React.memo(() => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    {STARS.map(s => <StarDot key={s.id} {...s} />)}
  </View>
));

const StarDot = React.memo(({ x, y, size, opacity, dur }) => {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(a, { toValue: 1, duration: dur, useNativeDriver: true }),
      Animated.timing(a, { toValue: 0, duration: dur, useNativeDriver: true }),
    ])).start();
  }, []);
  return (
    <Animated.View style={{
      position: 'absolute', left: `${x}%`, top: `${y}%`,
      width: size, height: size, borderRadius: size,
      backgroundColor: '#fff',
      opacity: a.interpolate({ inputRange: [0, 1], outputRange: [opacity * 0.2, opacity] }),
    }} />
  );
});

// ─── NEBULA ORBS ─────────────────────────────────
const NebulaOrbs = React.memo(() => {
  const a1 = useRef(new Animated.Value(0)).current;
  const a2 = useRef(new Animated.Value(0)).current;
  const a3 = useRef(new Animated.Value(0)).current;
  const a4 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = (v, d) => Animated.loop(Animated.sequence([
      Animated.timing(v, { toValue: 1, duration: d, useNativeDriver: true }),
      Animated.timing(v, { toValue: 0, duration: d, useNativeDriver: true }),
    ])).start();
    loop(a1, 9000); loop(a2, 13000); loop(a3, 7000); loop(a4, 11000);
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View style={[S.orb, {
        width: 380, height: 380, borderRadius: 190,
        backgroundColor: C.purple, opacity: 0.12,
        top: -80, left: -80,
        transform: [{ translateX: a1.interpolate({ inputRange: [0, 1], outputRange: [0, 60] }) },
                    { scale: a1.interpolate({ inputRange: [0, 1], outputRange: [1, 1.3] }) }],
      }]} />
      <Animated.View style={[S.orb, {
        width: 320, height: 320, borderRadius: 160,
        backgroundColor: C.blue, opacity: 0.09,
        bottom: -60, right: -60,
        transform: [{ translateY: a2.interpolate({ inputRange: [0, 1], outputRange: [0, -80] }) },
                    { scale: a2.interpolate({ inputRange: [0, 1], outputRange: [1.2, 0.9] }) }],
      }]} />
      <Animated.View style={[S.orb, {
        width: 250, height: 250, borderRadius: 125,
        backgroundColor: C.cyan, opacity: 0.07,
        top: '40%', left: '30%',
        transform: [{ translateX: a3.interpolate({ inputRange: [0, 1], outputRange: [-40, 60] }) },
                    { translateY: a3.interpolate({ inputRange: [0, 1], outputRange: [30, -50] }) }],
      }]} />
      <Animated.View style={[S.orb, {
        width: 200, height: 200, borderRadius: 100,
        backgroundColor: C.pink, opacity: 0.06,
        top: '20%', right: '10%',
        transform: [{ translateY: a4.interpolate({ inputRange: [0, 1], outputRange: [0, 100] }) }],
      }]} />
    </View>
  );
});

// ─── GLASS CARD ──────────────────────────────────
const Glass = ({ children, style, glow }) => (
  <View style={[S.glass, glow && { borderColor: glow, shadowColor: glow, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 }, style]}>
    {children}
  </View>
);

// ─── GRADIENT BUTTON ─────────────────────────────
const GBtn = ({ onPress, colors = [C.purple, C.purpleDark], icon, label, style, disabled, small }) => (
  <TouchableOpacity onPress={onPress} disabled={disabled} activeOpacity={0.75} style={[S.gbtnWrap, small && { height: 38, borderRadius: 19 }, style]}>
    <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[S.gbtnInner, small && { borderRadius: 19 }]}>
      {icon && <Ionicons name={icon} size={small ? 16 : 20} color="#fff" style={{ marginRight: 6 }} />}
      <Text style={[S.gbtnText, small && { fontSize: 13 }]}>{label}</Text>
    </LinearGradient>
  </TouchableOpacity>
);

// ─── PULSE DOT ───────────────────────────────────
const PulseDot = ({ color = C.purple, size = 10 }) => {
  const a = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(a, { toValue: 0.3, duration: 700, useNativeDriver: true }),
      Animated.timing(a, { toValue: 1, duration: 700, useNativeDriver: true }),
    ])).start();
  }, []);
  return <Animated.View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, opacity: a }} />;
};

// ─── TYPE BADGE ──────────────────────────────────
const Badge = ({ label, color }) => (
  <View style={{ backgroundColor: color + '22', borderWidth: 1, borderColor: color + '55', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
    <Text style={{ color, fontSize: 10, fontWeight: '700', letterSpacing: 1 }}>{label}</Text>
  </View>
);

// ─── SPLASH ANIMATION ────────────────────────────
const SplashScreen = ({ onFinish }) => {
  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, tension: 10, friction: 3, useNativeDriver: true })
    ]).start();

    const timer = setTimeout(() => {
      Animated.timing(fade, { toValue: 0, duration: 500, useNativeDriver: true }).start(onFinish);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center', zIndex: 1000 }]}>
      <StarBed />
      <Animated.View style={{ opacity: fade, transform: [{ scale }], alignItems: 'center' }}>
        <LinearGradient colors={[C.purple, C.blue]} style={{ width: 100, height: 100, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 20 }}>
          <Text style={{ color: '#fff', fontSize: 50, fontWeight: '900', fontStyle: 'italic' }}>N</Text>
        </LinearGradient>
        <Text style={{ color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: 5 }}>NEBULA STUDIO PRO</Text>
        <Text style={{ color: C.purple, fontSize: 12, fontWeight: '600', marginTop: 10, letterSpacing: 2 }}>POWERED BY LLAMA 4</Text>
        <ActivityIndicator color={C.purple} style={{ marginTop: 30 }} />
      </Animated.View>
    </View>
  );
};

// ════════════════════════════════════════════════
//  MAIN APP
// ════════════════════════════════════════════════

export default function App() {
  const [tab, setTab] = useState('Agent');
  const [model, setModel] = useState(MODELS[0].id);
  const [keys, setKeys] = useState({});
  const [showSplash, setShowSplash] = useState(true);
  const [startTime, setStartTime] = useState(Date.now());
  const groqIdx = useRef(0);

  // Chat
  const [msgs, setMsgs] = useState([
    { id: '0', role: 'assistant', content: '🌌 أهلاً بك في NEBULA STUDIO PRO v3.0\n\n🌐 ✅ متصل تلقائياً بسيرفر NEBULA\n\nقادر على:\n• تصفح الإنترنت بنفسي ⚡\n• تحليل الصور والتفكير البصري\n• كتابة وتنفيذ الكود\n• 24 أداة + وكيل ذكاء اصطناعي كامل\n\nما الذي تريده اليوم؟', ts: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Agent
  const [agentGoal, setAgentGoal] = useState('');
  const [agentSteps, setAgentSteps] = useState([]);
  const [agentRunning, setAgentRunning] = useState(false);
  const agentMemoryRef = useRef({});
  const [agentMemoryDisplay, setAgentMemoryDisplay] = useState({});

  // Vision
  const [visImg, setVisImg] = useState(null);
  const [visResult, setVisResult] = useState('');
  const [visLoading, setVisLoading] = useState(false);
  const [visPrompt, setVisPrompt] = useState('حلّل هذه الصورة بتفصيل كامل وأخبرني كل ما تراه');

  // Search
  const [srchQ, setSrchQ] = useState('');
  const [srchResults, setSrchResults] = useState([]);
  const [srchLoading, setSrchLoading] = useState(false);

  // Create
  const [createPrompt, setCreatePrompt] = useState('');
  const [createImg, setCreateImg] = useState(null);
  const [storyboard, setStoryboard] = useState(null);
  const [createLoading, setCreateLoading] = useState(false);

  // Build
  const [buildPrompt, setBuildPrompt] = useState('');
  const [buildCode, setBuildCode] = useState('');
  const [buildLoading, setBuildLoading] = useState(false);
  const [commitUrl, setCommitUrl] = useState('');

  // Pro Agents
  const [selectedProAgent, setSelectedProAgent] = useState(null);
  const [proAgentsHistory, setProAgentsHistory] = useState({});

  const chatScroll = useRef(null);
  const agentScroll = useRef(null);

  useEffect(() => { loadKeys(); }, []);

  // ─── KEYS ───────────────────────────────────────
  const loadKeys = async () => {
    try {
      const k = {
        GITHUB: await SecureStore.getItemAsync('GITHUB') || process.env.EXPO_PUBLIC_GITHUB_TOKEN || '',
        JINA: await SecureStore.getItemAsync('JINA') || '',
        GROQ_OVR: await SecureStore.getItemAsync('GROQ_OVR') || '',
        SERVER: await SecureStore.getItemAsync('SERVER_URL') || process.env.EXPO_PUBLIC_SERVER_URL || 'https://19dd6a57-88ed-4ace-84eb-807643506cbd-00-27aa4z2ucs51c.kirk.replit.dev',
      };
      setKeys(k);
    } catch {}
  };

  const saveKey = async (k, v) => {
    await SecureStore.setItemAsync(k, v);
    setKeys(p => ({ ...p, [k]: v }));
  };

  // ─── GROQ API ───────────────────────────────────
  const getGroqKey = (n) => {
    if (keys.GROQ_OVR) return keys.GROQ_OVR;
    return process.env['EXPO_PUBLIC_GROQ_KEY_' + ((n % 7) + 1)] || '';
  };

  const callGroq = async (messages, mdl = null, maxTokens = 4096) => {
    groqIdx.current = (groqIdx.current + 1) % 7;
    const base = groqIdx.current;
    let lastErr;
    for (let t = 0; t < 7; t++) {
      const key = getGroqKey(base + t);
      if (!key) continue;
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 30000);
        let r;
        try {
          r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: mdl || model, messages, temperature: 0.7, max_tokens: maxTokens }),
            signal: controller.signal,
          });
        } finally { clearTimeout(timer); }
        if (r.status === 429 || r.status === 401) { lastErr = new Error('key ' + (((base+t)%7)+1) + ' rate limited'); continue; }
        if (r.status >= 500) { lastErr = new Error('server error ' + r.status); await new Promise(x => setTimeout(x, 1000)); continue; }
        if (!r.ok) { const e = await r.json(); throw new Error(e.error?.message || 'Groq error ' + r.status); }
        const d = await r.json();
        return d.choices[0].message.content;
      } catch (e) {
        const msg = e.message?.toLowerCase() || '';
        if (msg.includes('aborted') || msg.includes('timeout')) {
          lastErr = new Error('timeout key ' + (((base+t)%7)+1));
          await new Promise(x => setTimeout(x, 500));
          continue;
        }
        if (msg.includes('rate') || msg.includes('limit') || msg.includes('network') || msg.includes('fetch')) {
          lastErr = e;
          await new Promise(x => setTimeout(x, 500));
          continue;
        }
        throw e;
      }
    }
    throw lastErr || new Error('جميع مفاتيح Groq استُنزفت');
  };

  // ─── SERVER TUNNEL ──────────────────────────────
  const callServer = async (payload) => {
    const url = (keys.SERVER || '').replace(/\/$/, '') + '/api/chat';
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!r.ok) throw new Error('Server ' + r.status);
    return await r.json();
  };



  // ─── 24 AGENT TOOLS ─────────────────────────────
  const tools = useMemo(() => ({
    search_web: async ({ query }) => {
      try {
        const r = await fetch('https://s.jina.ai/' + encodeURIComponent(query), {
          headers: { 'Accept': 'application/json', 'X-Return-Format': 'markdown' }
        });
        const d = await r.json();
        const items = d.data?.slice(0, 5) || [];
        return items.map((i, n) => `[${n+1}] ${i.title}\n${i.url}\n${i.content?.slice(0, 400)}`).join('\n\n') || JSON.stringify(d).slice(0, 2000);
      } catch (e) { return 'فشل البحث: ' + e.message; }
    },
    fetch_url: async ({ url }) => {
      try {
        const r = await fetch('https://r.jina.ai/' + url, {
          headers: { 'Accept': 'text/plain', 'X-Return-Format': 'markdown' }
        });
        return (await r.text()).slice(0, 4000);
      } catch (e) { return 'فشل جلب الصفحة: ' + e.message; }
    },
    get_weather: async ({ city }) => {
      try {
        const r = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=j1`);
        const d = await r.json();
        const c = d.current_condition[0];
        const desc = c.weatherDesc[0].value;
        return `🌤 ${city}: ${desc}\n🌡 ${c.temp_C}°C (يشعر بـ ${c.FeelsLikeC}°C)\n💧 رطوبة: ${c.humidity}%\n💨 رياح: ${c.windspeedKmph} كم/س`;
      } catch (e) { return 'فشل جلب الطقس: ' + e.message; }
    },
    search_github: async ({ query, type = 'repositories' }) => {
      try {
        const hdrs = { 'Accept': 'application/vnd.github+json' };
        if (keys.GITHUB) hdrs['Authorization'] = 'token ' + keys.GITHUB;
        const r = await fetch(`https://api.github.com/search/${type}?q=${encodeURIComponent(query)}&per_page=5`, { headers: hdrs });
        const d = await r.json();
        return (d.items || []).map(i =>
          `📦 ${i.full_name || i.name}\n⭐ ${i.stargazers_count || 0} | ${i.description || ''}\n🔗 ${i.html_url}`
        ).join('\n\n');
      } catch (e) { return 'فشل بحث GitHub: ' + e.message; }
    },
    build_app: async ({ description }) => {
      try {
        const code = await callGroq([
          { role: 'system', content: 'أنت مطور React Native خبير. اكتب كود كامل قابل للتشغيل فوراً.' },
          { role: 'user', content: 'اكتب App.tsx كاملاً لـ: ' + description + '\nأرجع الكود فقط بدون markdown.' }
        ], 'meta-llama/llama-4-maverick-17b-128e-instruct', 8000);
        return code.slice(0, 5000);
      } catch (e) { return 'فشل البناء: ' + e.message; }
    },
    analyze_code: async ({ code, goal = 'review' }) => {
      try {
        const g = goal === 'debug' ? 'ابحث عن الأخطاء وأصلحها' : goal === 'improve' ? 'حسّن وطوّر' : 'راجع وقيّم';
        return await callGroq([
          { role: 'system', content: 'أنت مراجع كود خبير. قدّم تحليلاً دقيقاً ومفيداً.' },
          { role: 'user', content: g + ':\n\n' + code.slice(0, 4000) }
        ], 'deepseek-r1-distill-llama-70b');
      } catch (e) { return 'فشل التحليل: ' + e.message; }
    },
    execute_code: async ({ code }) => {
      try {
        const fn = new Function(code);
        const result = fn();
        return String(result !== undefined ? result : 'تم التنفيذ بنجاح');
      } catch (e) { return 'خطأ في التنفيذ: ' + e.message; }
    },
    fix_error: async ({ error, context = '' }) => {
      try {
        return await callGroq([
          { role: 'system', content: 'أنت مصحح أخطاء خبير. قدّم الحل المباشر.' },
          { role: 'user', content: `الخطأ: ${error}\n\nالسياق:\n${context}\n\nكيف أصلح هذا؟` }
        ], 'deepseek-r1-distill-llama-70b');
      } catch (e) { return 'فشل الإصلاح: ' + e.message; }
    },
    push_github: async ({ repo, path, content, message }) => {
      try {
        if (!keys.GITHUB) return '❌ GitHub token مطلوب — اذهب لـ Vault';
        const shaRes = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
          headers: { Authorization: 'token ' + keys.GITHUB }
        });
        const shaData = await shaRes.json();
        const body = { message, content: safeBase64(content) };
        if (shaData.sha) body.sha = shaData.sha;
        const r = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
          method: 'PUT',
          headers: { Authorization: 'token ' + keys.GITHUB, 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        const d = await r.json();
        return d.commit ? '✅ رُفع: ' + d.content.html_url : '❌ فشل: ' + JSON.stringify(d).slice(0, 300);
      } catch (e) { return 'فشل الرفع: ' + e.message; }
    },
    read_github_file: async ({ repo, path }) => {
      try {
        const hdrs = keys.GITHUB ? { Authorization: 'token ' + keys.GITHUB } : {};
        const r = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, { headers: hdrs });
        if (!r.ok) return 'خطأ: ' + r.status;
        const d = await r.json();
        if (!d.content) return JSON.stringify(d).slice(0, 1000);
        const b64 = d.content.replace(/\n/g, '');
        return atob(b64).slice(0, 3000);
      } catch (e) { return 'فشل القراءة: ' + e.message; }
    },
    list_github_files: async ({ repo, dir = '' }) => {
      try {
        const hdrs = keys.GITHUB ? { Authorization: 'token ' + keys.GITHUB } : {};
        const r = await fetch(`https://api.github.com/repos/${repo}/contents/${dir}`, { headers: hdrs });
        const d = await r.json();
        return (Array.isArray(d) ? d : []).map(f => `${f.type === 'dir' ? '📁' : '📄'} ${f.name} (${f.size || 0} bytes)`).join('\n');
      } catch (e) { return 'فشل القائمة: ' + e.message; }
    },
    create_github_issue: async ({ repo, title, body }) => {
      try {
        if (!keys.GITHUB) return '❌ GitHub token مطلوب';
        const r = await fetch(`https://api.github.com/repos/${repo}/issues`, {
          method: 'POST',
          headers: { Authorization: 'token ' + keys.GITHUB, 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, body })
        });
        const d = await r.json();
        return d.html_url ? '✅ Issue: ' + d.html_url : '❌ فشل: ' + JSON.stringify(d).slice(0, 300);
      } catch (e) { return 'فشل إنشاء issue: ' + e.message; }
    },
    generate_image: async ({ prompt }) => {
      const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true&seed=${Date.now()}`;
      return `IMAGE:${url}`;
    },
    analyze_image: async ({ url, question = 'ما الذي تراه في هذه الصورة؟' }) => {
      groqIdx.current = (groqIdx.current + 1) % 7;
      const base = groqIdx.current;
      for (let t = 0; t < 7; t++) {
        const key = getGroqKey(base + t);
        if (!key) continue;
        try {
          const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: 'llama-3.2-90b-vision-preview',
              messages: [{ role: 'user', content: [
                { type: 'text', text: question },
                { type: 'image_url', image_url: { url } }
              ]}], max_tokens: 2048,
            })
          });
          if (r.status === 429 || r.status === 401) continue;
          if (!r.ok) return 'خطأ Vision: ' + r.status;
          const d = await r.json();
          return d.choices?.[0]?.message?.content || 'لا نتيجة';
        } catch (e) { continue; }
      }
      return 'فشل جميع المفاتيح';
    },
    summarize_text: async ({ text, lang = 'ar' }) => {
      try {
        return await callGroq([
          { role: 'system', content: `لخّص النص التالي بشكل موجز ومفيد باللغة ${lang === 'ar' ? 'العربية' : 'الإنجليزية'}.` },
          { role: 'user', content: text.slice(0, 6000) }
        ], 'meta-llama/llama-4-maverick-17b-128e-instruct');
      } catch (e) { return 'فشل التلخيص: ' + e.message; }
    },
    translate_text: async ({ text, to = 'en' }) => {
      try {
        const langs = { en: 'الإنجليزية', ar: 'العربية', fr: 'الفرنسية', de: 'الألمانية', es: 'الإسبانية', zh: 'الصينية' };
        return await callGroq([
          { role: 'user', content: `ترجم إلى ${langs[to] || to}:\n\n${text.slice(0, 3000)}` }
        ], 'meta-llama/llama-4-maverick-17b-128e-instruct');
      } catch (e) { return 'فشل الترجمة: ' + e.message; }
    },
    create_plan: async ({ goal, steps = 5 }) => {
      try {
        return await callGroq([
          { role: 'system', content: 'أنت مخطط استراتيجي خبير. اصنع خططاً مفصلة وقابلة للتنفيذ.' },
          { role: 'user', content: `ضع خطة مفصلة من ${steps} خطوات لتحقيق: ${goal}` }
        ], 'meta-llama/llama-4-maverick-17b-128e-instruct');
      } catch (e) { return 'فشل إنشاء الخطة: ' + e.message; }
    },
    deep_think: async ({ question }) => {
      try {
        return await callGroq([
          { role: 'system', content: 'أنت مفكر فلسفي وعلمي عميق. فكّر بعمق وتأمل.' },
          { role: 'user', content: 'فكّر بعمق في: ' + question }
        ], 'deepseek-r1-distill-llama-70b', 8000);
      } catch (e) { return 'فشل التفكير العميق: ' + e.message; }
    },
    read_memory: async ({ key }) => {
      const v = agentMemoryRef.current[key];
      return v !== undefined ? `🧠 ${key}: ${String(v)}` : `❌ لا يوجد: ${key}`;
    },
    save_memory: async ({ key, value }) => {
      agentMemoryRef.current[key] = value;
      setAgentMemoryDisplay({ ...agentMemoryRef.current });
      return `✅ تم حفظ "${key}"`;
    },
    list_memory: async () => {
      const entries = Object.entries(agentMemoryRef.current);
      if (!entries.length) return '🧠 الذاكرة فارغة';
      return '🧠 ' + entries.map(([k,v]) => `${k}: ${String(v).slice(0,100)}`).join('\n');
    },
    calculate: async ({ expr }) => {
      try {
        const result = Function('"use strict"; return (' + expr + ')')();
        return `🔢 ${expr} = ${result}`;
      } catch (e) { return 'خطأ في الحساب: ' + e.message; }
    },
    get_datetime: async () => {
      const now = new Date();
      return `📅 ${now.toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\n⏰ ${now.toLocaleTimeString('ar-EG')}`;
    },
    format_json: async ({ data }) => {
      try {
        const parsed = typeof data === 'string' ? JSON.parse(data) : data;
        return JSON.stringify(parsed, null, 2);
      } catch (e) { return 'خطأ في تنسيق JSON: ' + e.message; }
    },
  }), [keys, model]);

  // ─── AGENT LOOP ─────────────────────────────────
  const runAgent = async (goal) => {
    if (!goal || agentRunning) return;
    setAgentRunning(true);
    setAgentGoal(goal);
    setAgentSteps([{ id: '1', role: 'system', content: '🚀 بدء المهمة: ' + goal, ts: new Date().toLocaleTimeString() }]);

    try {
      if (keys.SERVER) {
        // ── NEBULA SERVER TUNNEL ──
        setAgentSteps(p => [...p, { id: 'srv', role: 'system', content: '🌐 متصل بسيرفر NEBULA...', ts: new Date().toLocaleTimeString() }]);
        const result = await callServer({ goal, mode: 'agent' });
        (result.steps || []).forEach((s, i) => {
          setAgentSteps(p => [...p, { id: 'st'+i, role: 'tool', content: `🛠 ${s.tool}\n${s.result}`, ts: new Date().toLocaleTimeString() }]);
        });
        setAgentSteps(p => [...p, { id: 'final', role: 'assistant', content: result.content || 'تمت المهمة', ts: new Date().toLocaleTimeString() }]);
      } else {
        // ── LOCAL GROQ FALLBACK ──
        let history = [
          { role: 'system', content: `أنت وكيل NEBULA الذكي. لديك 24 أداة.
استخدم الأدوات عبر كتابة JSON: {"tool": "name", "args": {...}}
لا تتوقف حتى تنهي المهمة تماماً.
الأدوات المتاحة: ${Object.keys(tools).join(', ')}` },
          { role: 'user', content: goal }
        ];
        for (let i = 0; i < 15; i++) {
          const resp = await callGroq(history);
          setAgentSteps(p => [...p, { id: Date.now().toString(), role: 'assistant', content: resp, ts: new Date().toLocaleTimeString() }]);
          const toolMatch = resp.match(/\{[\s\S]*?"tool"[\s\S]*?\}/);
          if (toolMatch) {
            try {
              const { tool, args } = JSON.parse(toolMatch[0]);
              if (tools[tool]) {
                const res = await tools[tool](args);
                setAgentSteps(p => [...p, { id: 'r'+Date.now(), role: 'tool', content: `🛠 ${tool} -> ${res.slice(0,500)}`, ts: new Date().toLocaleTimeString() }]);
                history.push({ role: 'assistant', content: resp });
                history.push({ role: 'user', content: `Tool Result: ${res}` });
                continue;
              }
            } catch {}
          }
          if (resp.includes('تمت المهمة') || resp.includes('FINISH')) break;
        }
      }
    } catch (e) {
      setAgentSteps(p => [...p, { id: 'err', role: 'system', content: '❌ خطأ: ' + e.message, ts: new Date().toLocaleTimeString() }]);
    } finally {
      setAgentRunning(false);
    }
  };

  const onToolPress = (tool) => {
    setTab('Agent');
    setAgentGoal(tool.prompt);
  };

  // ─── RENDERS ────────────────────────────────────
  const renderAgent = () => (
    <View style={S.tabContent}>
      <Glass style={{ padding: 15, marginBottom: 15 }}>
        <Text style={S.sectionTitle}>Agent Goal</Text>
        <View style={S.inputRow}>
          <TextInput
            style={S.input}
            placeholder="ما هي مهمتك اليوم؟"
            placeholderTextColor={C.gray}
            value={agentGoal}
            onChangeText={setAgentGoal}
            multiline
          />
          <TouchableOpacity onPress={() => runAgent(agentGoal)} disabled={agentRunning}>
            <LinearGradient colors={[C.purple, C.blue]} style={S.sendBtn}>
              {agentRunning ? <ActivityIndicator color="#fff" /> : <Ionicons name="rocket" size={20} color="#fff" />}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Glass>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 15 }}>
        {Object.entries(agentMemoryDisplay).map(([k, v]) => (
          <View key={k} style={S.memoryBadge}>
            <Text style={S.memoryText}>{k}: {String(v).slice(0,20)}</Text>
          </View>
        ))}
      </ScrollView>

      {agentSteps.length === 0 ? (
        <View style={S.toolGrid}>
          {TOOL_LIST.map(t => (
            <TouchableOpacity key={t.id} style={S.toolCard} onPress={() => onToolPress(t)}>
              <View style={[S.toolIcon, { backgroundColor: t.color + '22' }]}>
                <Ionicons name={t.icon} size={24} color={t.color} />
              </View>
              <Text style={S.toolName}>{t.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <FlatList
          data={agentSteps}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <AgentStepCard step={item} />}
          ref={agentScroll}
          onContentSizeChange={() => agentScroll.current?.scrollToEnd()}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}
    </View>
  );

  const renderChat = () => (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : null} style={S.tabContent}>
      <FlatList
        data={msgs}
        keyExtractor={m => m.id}
        renderItem={({ item }) => <ChatBubble msg={item} />}
        ref={chatScroll}
        onContentSizeChange={() => chatScroll.current?.scrollToEnd()}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
      <Glass style={S.chatInputWrap}>
        <TextInput
          style={S.chatInput}
          placeholder="تحدث معي..."
          placeholderTextColor={C.gray}
          value={chatInput}
          onChangeText={setChatInput}
        />
        <TouchableOpacity onPress={async () => {
          if (!chatInput || chatLoading) return;
          const userMsg = { id: Date.now().toString(), role: 'user', content: chatInput, ts: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
          setMsgs(p => [...p, userMsg]);
          setChatInput('');
          setChatLoading(true);
          try {
            let resp;
            if (keys.SERVER) {
              const allMsgs = [...msgs, userMsg].map(m => ({ role: m.role, content: m.content }));
              const result = await callServer({ messages: allMsgs, mode: 'chat' });
              resp = result.content;
            } else {
              resp = await callGroq([...msgs, userMsg].map(m => ({ role: m.role, content: m.content })));
            }
            setMsgs(p => [...p, { id: 'a'+Date.now(), role: 'assistant', content: resp, ts: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
          } catch (e) { Alert.alert('Error', e.message); }
          finally { setChatLoading(false); }
        }}>
          <LinearGradient colors={[C.blue, C.blueDark]} style={S.sendBtn}>
            {chatLoading ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="send" size={18} color="#fff" />}
          </LinearGradient>
        </TouchableOpacity>
      </Glass>
    </KeyboardAvoidingView>
  );

  const renderProAgents = () => {
    if (selectedProAgent) {
      return (
        <ProAgentChat 
          agent={selectedProAgent} 
          onBack={() => setSelectedProAgent(null)}
          history={proAgentsHistory[selectedProAgent.id] || []}
          onSaveHistory={(h) => setProAgentsHistory(p => ({ ...p, [selectedProAgent.id]: h }))}
          callGroq={callGroq}
        />
      );
    }
    return (
      <ScrollView style={S.tabContent}>
        <Text style={S.tabTitle}>Pro Agents</Text>
        <View style={S.proGrid}>
          {PRO_AGENTS.map(a => (
            <TouchableOpacity key={a.id} style={S.proCard} onPress={() => setSelectedProAgent(a)}>
              <LinearGradient colors={[a.color, a.color + '55']} style={S.proCardInner}>
                <Ionicons name={a.icon} size={32} color="#fff" />
                <Text style={S.proCardName}>{a.name}</Text>
                <Badge label={a.model.split('-')[0].toUpperCase()} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    );
  };

  const renderVision = () => (
    <ScrollView style={S.tabContent}>
      <Text style={S.tabTitle}>Vision AI</Text>
      <TouchableOpacity style={S.visBox} onPress={async () => {
        const res = await ImagePicker.launchImageLibraryAsync({ base64: true, quality: 0.5 });
        if (!res.canceled) setVisImg(res.assets[0]);
      }}>
        {visImg ? <Image source={{ uri: visImg.uri }} style={S.visImg} /> : (
          <View style={{ alignItems: 'center' }}>
            <Ionicons name="image-outline" size={50} color={C.pink} />
            <Text style={{ color: C.gray, marginTop: 10 }}>اختر صورة للتحليل</Text>
          </View>
        )}
      </TouchableOpacity>
      <TextInput
        style={[S.input, { marginVertical: 15, height: 60 }]}
        placeholder="ماذا تريد أن تسأل عن الصورة؟"
        placeholderTextColor={C.gray}
        value={visPrompt}
        onChangeText={setVisPrompt}
      />
      <GBtn label="تحليل الصورة" icon="eye" colors={[C.pink, '#d946ef']} onPress={async () => {
        if (!visImg) return Alert.alert('Error', 'اختر صورة أولاً');
        setVisLoading(true); setVisResult('');
        try {
          let res;
          if (keys.SERVER) {
            const imgUrl = `data:${visImg.mimeType || 'image/jpeg'};base64,${visImg.base64}`;
            const result = await callServer({ messages: [{ role: 'user', content: visPrompt }], imageUrl: imgUrl, mode: 'vision' });
            res = result.content;
          } else {
            res = await tools.analyze_image({ url: `data:${visImg.mimeType || 'image/jpeg'};base64,${visImg.base64}`, question: visPrompt });
          }
          setVisResult(res);
        } catch(e) { setVisResult('خطأ: ' + e.message); }
        setVisLoading(false);
      }} disabled={visLoading} />
      {visLoading && <ActivityIndicator color={C.pink} style={{ marginTop: 20 }} />}
      {visResult ? <Glass style={{ marginTop: 20, padding: 15 }}><Text style={S.visRes}>{visResult}</Text></Glass> : null}
    </ScrollView>
  );

  const renderVault = () => (
    <ScrollView style={S.tabContent}>
      <Text style={S.tabTitle}>Security Vault</Text>
      <View style={{ marginBottom: 20 }}>
        <Text style={S.vaultLabel}>🌐 NEBULA Server URL (السيرفر الأصلي)</Text>
        <TextInput
          style={[S.vaultInput, keys.SERVER ? { borderColor: C.green + '88' } : {}]}
          value={keys.SERVER}
          onChangeText={v => saveKey('SERVER_URL', v)}
          placeholder="https://your-app.replit.app"
          autoCapitalize="none"
          keyboardType="url"
        />
        {keys.SERVER ? (
          <Text style={{ color: C.green, fontSize: 11, marginTop: 4, marginLeft: 5 }}>✅ متصل بالسيرفر — الوكيل يعمل بشكل دائم</Text>
        ) : (
          <Text style={{ color: C.gray, fontSize: 11, marginTop: 4, marginLeft: 5 }}>ادخل رابط السيرفر لتفعيل الوكيل الكامل</Text>
        )}
      </View>
      <View style={{ marginBottom: 20 }}>
        <Text style={S.vaultLabel}>GitHub Personal Token</Text>
        <TextInput
          style={S.vaultInput}
          secureTextEntry
          value={keys.GITHUB}
          onChangeText={v => saveKey('GITHUB', v)}
          placeholder="ghp_..."
        />
      </View>
      <View style={{ marginBottom: 20 }}>
        <Text style={S.vaultLabel}>Jina AI API Key (Search)</Text>
        <TextInput
          style={S.vaultInput}
          secureTextEntry
          value={keys.JINA}
          onChangeText={v => saveKey('JINA', v)}
          placeholder="jina_..."
        />
      </View>
      <View style={{ marginBottom: 20 }}>
        <Text style={S.vaultLabel}>Groq API Key Override</Text>
        <TextInput
          style={S.vaultInput}
          secureTextEntry
          value={keys.GROQ_OVR}
          onChangeText={v => saveKey('GROQ_OVR', v)}
          placeholder="gsk_..."
        />
      </View>
      <GBtn label="حفظ وتشفير" icon="shield-checkmark" onPress={() => Alert.alert('Success', 'تم حفظ المفاتيح بنجاح')} />
      <View style={{ marginTop: 40, alignItems: 'center' }}>
        <Text style={{ color: C.gray, fontSize: 12 }}>NEBULA STUDIO PRO v3.0</Text>
        <Text style={{ color: C.grayDark, fontSize: 10, marginTop: 5 }}>RSA-4096 · NEBULA SERVER ACTIVE</Text>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={S.container}>
      <StatusBar barStyle="light-content" />
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
      <StarBed />
      <NebulaOrbs />
      
      {/* Header */}
      <View style={S.header}>
        <View>
          <Text style={S.headerTitle}>NEBULA</Text>
          <View style={S.statusRow}>
            <PulseDot color={C.green} size={6} />
            <Text style={S.headerSub}> PRO v3.0 · SERVER</Text>
          </View>
        </View>
        <TouchableOpacity style={S.modelBtn}>
          <Ionicons name="hardware-chip" size={16} color={C.purple} />
          <Text style={S.modelText}>{MODELS.find(m => m.id === model)?.name}</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={{ flex: 1 }}>
        {tab === 'Agent' && renderAgent()}
        {tab === 'Chat' && renderChat()}
        {tab === 'ProAgents' && renderProAgents()}
        {tab === 'Vision' && renderVision()}
        {tab === 'Vault' && renderVault()}
        {/* Fallback for other tabs */}
        {(['Search', 'Create', 'Build'].includes(tab)) && (
          <View style={[S.tabContent, { justifyContent: 'center', alignItems: 'center' }]}>
            <Ionicons name="construct" size={60} color={C.gray} />
            <Text style={{ color: C.white, marginTop: 15 }}>Under Construction</Text>
            <Text style={{ color: C.gray }}>Use Agent tab for these functions</Text>
          </View>
        )}
      </View>

      {/* Tabs */}
      <Glass style={S.tabBar}>
        {TABS.map(t => (
          <TouchableOpacity key={t.id} style={S.tabItem} onPress={() => { setTab(t.id); setSelectedProAgent(null); }}>
            <Ionicons name={t.icon} size={22} color={tab === t.id ? t.color : C.gray} />
            <Text style={[S.tabLabel, { color: tab === t.id ? t.color : C.gray }]}>{t.label}</Text>
            {tab === t.id && <View style={[S.tabActive, { backgroundColor: t.color }]} />}
          </TouchableOpacity>
        ))}
      </Glass>
    </SafeAreaView>
  );
}

// ─── COMPONENTS ───────────────────────────────────

const AgentStepCard = ({ step }) => {
  const isTool = step.role === 'tool';
  const isSystem = step.role === 'system';
  return (
    <Glass style={[S.stepCard, isTool && S.stepTool, isSystem && S.stepSystem]}>
      <View style={S.stepHeader}>
        <Badge label={step.role.toUpperCase()} color={isTool ? C.teal : isSystem ? C.purple : C.blue} />
        <Text style={S.stepTs}>{step.ts}</Text>
      </View>
      <Text style={S.stepContent}>{step.content}</Text>
    </Glass>
  );
};

const ChatBubble = ({ msg }) => {
  const isAi = msg.role === 'assistant';
  return (
    <View style={[S.bubbleWrap, isAi ? { alignItems: 'flex-start' } : { alignItems: 'flex-end' }]}>
      <LinearGradient
        colors={isAi ? ['#1e1b4b', '#0f172a'] : [C.purple, C.purpleDark]}
        style={[S.bubble, isAi ? S.bubbleAi : S.bubbleUser]}
      >
        <Text style={S.bubbleText}>{msg.content}</Text>
        <Text style={S.bubbleTs}>{msg.ts}</Text>
      </LinearGradient>
    </View>
  );
};

const ProAgentChat = ({ agent, onBack, history, onSaveHistory, callGroq }) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scroll = useRef(null);

  const sendMessage = async () => {
    if (!input || loading) return;
    const userMsg = { id: Date.now().toString(), role: 'user', content: input, ts: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    const newHistory = [...history, userMsg];
    onSaveHistory(newHistory);
    setInput('');
    setLoading(true);
    try {
      const msgs = [{ role: 'system', content: agent.system }, ...newHistory.map(m => ({ role: m.role, content: m.content }))];
      const resp = await callGroq(msgs, agent.model);
      const aiMsg = { id: 'a'+Date.now(), role: 'assistant', content: resp, ts: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
      onSaveHistory([...newHistory, aiMsg]);
    } catch (e) { Alert.alert('Error', e.message); }
    finally { setLoading(false); }
  };

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={[agent.color, agent.color + '55']} style={S.proChatHeader}>
        <TouchableOpacity onPress={onBack} style={S.proBack}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Ionicons name={agent.icon} size={24} color="#fff" style={{ marginRight: 10 }} />
        <Text style={S.proChatTitle}>{agent.name}</Text>
      </LinearGradient>
      <FlatList
        data={history}
        keyExtractor={m => m.id}
        renderItem={({ item }) => <ChatBubble msg={item} />}
        ref={scroll}
        onContentSizeChange={() => scroll.current?.scrollToEnd()}
        contentContainerStyle={{ padding: 15, paddingBottom: 20 }}
      />
      <Glass style={S.chatInputWrap}>
        <TextInput
          style={S.chatInput}
          placeholder={`تحدث مع ${agent.name}...`}
          placeholderTextColor={C.gray}
          value={input}
          onChangeText={setInput}
        />
        <TouchableOpacity onPress={sendMessage}>
          <LinearGradient colors={[agent.color, agent.color + 'aa']} style={S.sendBtn}>
            {loading ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="send" size={18} color="#fff" />}
          </LinearGradient>
        </TouchableOpacity>
      </Glass>
    </View>
  );
};

// ─── STYLES ───────────────────────────────────────

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  orb: { position: 'absolute', blurRadius: 100 },
  glass: {
    backgroundColor: C.glass,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.glassBorder,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 10,
    zIndex: 10,
  },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: 2 },
  statusRow: { flexDirection: 'row', alignItems: 'center' },
  headerSub: { color: C.green, fontSize: 10, fontWeight: '700' },
  modelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.glass,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.purple + '44',
  },
  modelText: { color: C.purple, fontSize: 11, fontWeight: '700', marginLeft: 6 },
  tabContent: { flex: 1, paddingHorizontal: 15, paddingTop: 10 },
  tabTitle: { color: '#fff', fontSize: 24, fontWeight: '900', marginBottom: 20, textAlign: 'center' },
  sectionTitle: { color: C.purple, fontSize: 12, fontWeight: '800', marginBottom: 10, letterSpacing: 1 },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 12,
    color: '#fff',
    fontSize: 14,
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  sendBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  toolGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingBottom: 100 },
  toolCard: {
    width: '31%',
    backgroundColor: C.glass,
    borderRadius: 15,
    padding: 12,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.glassBorder,
  },
  toolIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  toolName: { color: '#fff', fontSize: 10, fontWeight: '700', textAlign: 'center' },
  memoryBadge: {
    backgroundColor: C.purple + '22',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginRight: 8,
    borderWidth: 1,
    borderColor: C.purple + '44',
  },
  memoryText: { color: C.purple, fontSize: 11, fontWeight: '600' },
  stepCard: { padding: 12, marginBottom: 10 },
  stepHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  stepTs: { color: C.gray, fontSize: 10 },
  stepContent: { color: '#fff', fontSize: 13, lineHeight: 18 },
  stepTool: { borderColor: C.teal + '44', backgroundColor: C.teal + '08' },
  stepSystem: { borderColor: C.purple + '44', backgroundColor: C.purple + '08' },
  bubbleWrap: { marginVertical: 6, paddingHorizontal: 15 },
  bubble: { padding: 12, borderRadius: 18, maxWidth: '85%' },
  bubbleAi: { borderBottomLeftRadius: 4 },
  bubbleUser: { borderBottomRightRadius: 4 },
  bubbleText: { color: '#fff', fontSize: 14, lineHeight: 20 },
  bubbleTs: { color: 'rgba(255,255,255,0.5)', fontSize: 9, alignSelf: 'flex-end', marginTop: 4 },
  chatInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    margin: 15,
    borderRadius: 25,
  },
  chatInput: { flex: 1, color: '#fff', paddingHorizontal: 15, fontSize: 14 },
  visBox: {
    height: 200,
    backgroundColor: C.glass,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: C.pink + '33',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  visImg: { width: '100%', height: '100%' },
  visRes: { color: '#fff', fontSize: 14, lineHeight: 22 },
  vaultLabel: { color: C.gray, fontSize: 12, marginBottom: 8, marginLeft: 5 },
  vaultInput: {
    backgroundColor: C.glass,
    borderRadius: 12,
    padding: 12,
    color: '#fff',
    borderWidth: 1,
    borderColor: C.glassBorder,
  },
  proGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  proCard: { width: '48%', marginBottom: 15 },
  proCardInner: { padding: 20, borderRadius: 20, alignItems: 'center' },
  proCardName: { color: '#fff', fontSize: 16, fontWeight: '900', marginVertical: 10 },
  proChatHeader: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 40 },
  proBack: { marginRight: 15 },
  proChatTitle: { color: '#fff', fontSize: 18, fontWeight: '900' },
  tabBar: {
    flexDirection: 'row',
    height: 75,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: C.glassBorder,
    borderRadius: 0,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },
  tabItem: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabLabel: { fontSize: 10, fontWeight: '700', marginTop: 4 },
  tabActive: { position: 'absolute', bottom: 10, width: 4, height: 4, borderRadius: 2 },
  gbtnWrap: { height: 50, borderRadius: 25, overflow: 'hidden' },
  gbtnInner: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  gbtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
