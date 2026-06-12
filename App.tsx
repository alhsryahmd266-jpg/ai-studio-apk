import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  StyleSheet, View, Text, TextInput, TouchableOpacity,
  ScrollView, Image, ActivityIndicator, KeyboardAvoidingView,
  Platform, SafeAreaView, Dimensions, Animated, StatusBar,
  Alert, Modal, FlatList, Pressable, Linking, Share,
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
  { id: 'Vision', icon: 'eye-outline', label: 'Vision', color: C.pink },
  { id: 'Search', icon: 'search-outline', label: 'Search', color: C.cyan },
  { id: 'Create', icon: 'color-palette-outline', label: 'Create', color: C.gold },
  { id: 'Build', icon: 'code-slash-outline', label: 'Build', color: C.teal },
  { id: 'Vault', icon: 'lock-closed-outline', label: 'Vault', color: C.orange },
];

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

// ════════════════════════════════════════════════
//  MAIN APP
// ════════════════════════════════════════════════

export default function App() {
  const [tab, setTab] = useState('Agent');
  const [model, setModel] = useState(MODELS[0].id);
  const [keys, setKeys] = useState({});
  const [showVaultModal, setShowVaultModal] = useState(false);
  const groqIdx = useRef(0);

  // Chat
  const [msgs, setMsgs] = useState([
    { id: '0', role: 'assistant', content: '🌌 أهلاً بك في NEBULA STUDIO PRO\n\nأنا وكيل ذكاء اصطناعي قادر على:\n• تصفح الإنترنت بنفسي\n• تحليل الصور والتفكير البصري\n• كتابة وتنفيذ الكود\n• 24 أداة احترافية\n\nما الذي تريده اليوم؟' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Agent
  const [agentGoal, setAgentGoal] = useState('');
  const [agentSteps, setAgentSteps] = useState([]);
  const [agentRunning, setAgentRunning] = useState(false);
  const [agentMemory, setAgentMemory] = useState({});

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
        const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: mdl || model, messages, temperature: 0.7, max_tokens: maxTokens }),
        });
        if (r.status === 429 || r.status === 401) {
          lastErr = new Error('Key ' + (base + t) % 7 + 1 + ' rate limited');
          continue;
        }
        if (!r.ok) { const e = await r.json(); throw new Error(e.error?.message || 'Groq error'); }
        const d = await r.json();
        return d.choices[0].message.content;
      } catch (e) {
        if (e.message?.includes('rate') || e.message?.includes('limit')) { lastErr = e; continue; }
        throw e;
      }
    }
    throw lastErr || new Error('جميع مفاتيح Groq استُنزفت');
  };

  // ─── 24 AGENT TOOLS ─────────────────────────────
  const tools = useMemo(() => ({
    // 1. تصفح الإنترنت - بحث
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

    // 2. جلب أي صفحة ويب
    fetch_url: async ({ url }) => {
      try {
        const r = await fetch('https://r.jina.ai/' + url, {
          headers: { 'Accept': 'text/plain', 'X-Return-Format': 'markdown' }
        });
        return (await r.text()).slice(0, 4000);
      } catch (e) { return 'فشل جلب الصفحة: ' + e.message; }
    },

    // 3. الطقس
    get_weather: async ({ city }) => {
      try {
        const r = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=j1`);
        const d = await r.json();
        const c = d.current_condition[0];
        const desc = c.weatherDesc[0].value;
        return `🌤 ${city}: ${desc}\n🌡 ${c.temp_C}°C (يشعر بـ ${c.FeelsLikeC}°C)\n💧 رطوبة: ${c.humidity}%\n💨 رياح: ${c.windspeedKmph} كم/س`;
      } catch (e) { return 'فشل جلب الطقس: ' + e.message; }
    },

    // 4. البحث في GitHub
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

    // 5. بناء تطبيق
    build_app: async ({ description }) => {
      try {
        const code = await callGroq([
          { role: 'system', content: 'أنت مطور React Native خبير. اكتب كود كامل قابل للتشغيل فوراً.' },
          { role: 'user', content: 'اكتب App.tsx كاملاً لـ: ' + description + '\nأرجع الكود فقط بدون markdown.' }
        ], 'meta-llama/llama-4-maverick-17b-128e-instruct', 8000);
        return code.slice(0, 5000);
      } catch (e) { return 'فشل البناء: ' + e.message; }
    },

    // 6. تحليل الكود
    analyze_code: async ({ code, goal = 'review' }) => {
      try {
        const g = goal === 'debug' ? 'ابحث عن الأخطاء وأصلحها' : goal === 'improve' ? 'حسّن وطوّر' : 'راجع وقيّم';
        return await callGroq([
          { role: 'system', content: 'أنت مراجع كود خبير. قدّم تحليلاً دقيقاً ومفيداً.' },
          { role: 'user', content: g + ':\n\n' + code.slice(0, 4000) }
        ], 'deepseek-r1-distill-llama-70b');
      } catch (e) { return 'فشل التحليل: ' + e.message; }
    },

    // 7. تنفيذ JavaScript
    execute_code: async ({ code }) => {
      try {
        const fn = new Function(code);
        const result = fn();
        return String(result !== undefined ? result : 'تم التنفيذ بنجاح');
      } catch (e) { return 'خطأ في التنفيذ: ' + e.message; }
    },

    // 8. إصلاح خطأ
    fix_error: async ({ error, context = '' }) => {
      try {
        return await callGroq([
          { role: 'system', content: 'أنت مصحح أخطاء خبير. قدّم الحل المباشر.' },
          { role: 'user', content: `الخطأ: ${error}\n\nالسياق:\n${context}\n\nكيف أصلح هذا؟` }
        ], 'deepseek-r1-distill-llama-70b');
      } catch (e) { return 'فشل الإصلاح: ' + e.message; }
    },

    // 9. رفع ملف على GitHub
    push_github: async ({ repo, path, content, message }) => {
      try {
        if (!keys.GITHUB) return '❌ GitHub token مطلوب — اذهب لـ Vault';
        const shaRes = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
          headers: { Authorization: 'token ' + keys.GITHUB }
        });
        const shaData = await shaRes.json();
        const body = { message, content: btoa(unescape(encodeURIComponent(content))) };
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

    // 10. قراءة ملف من GitHub
    read_github_file: async ({ repo, path }) => {
      try {
        const hdrs = keys.GITHUB ? { Authorization: 'token ' + keys.GITHUB } : {};
        const r = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, { headers: hdrs });
        const d = await r.json();
        if (d.content) return Buffer ? Buffer.from(d.content, 'base64').toString() : atob(d.content.replace(/\n/g, '')).slice(0, 3000);
        return JSON.stringify(d).slice(0, 1000);
      } catch (e) { return 'فشل القراءة: ' + e.message; }
    },

    // 11. قائمة ملفات GitHub
    list_github_files: async ({ repo, dir = '' }) => {
      try {
        const hdrs = keys.GITHUB ? { Authorization: 'token ' + keys.GITHUB } : {};
        const r = await fetch(`https://api.github.com/repos/${repo}/contents/${dir}`, { headers: hdrs });
        const d = await r.json();
        return (Array.isArray(d) ? d : []).map(f => `${f.type === 'dir' ? '📁' : '📄'} ${f.name} (${f.size || 0} bytes)`).join('\n');
      } catch (e) { return 'فشل القائمة: ' + e.message; }
    },

    // 12. إنشاء issue على GitHub
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

    // 13. توليد صورة
    generate_image: async ({ prompt }) => {
      const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true&seed=${Date.now()}`;
      return `IMAGE:${url}`;
    },

    // 14. تحليل صورة (تفكير بصري)
    analyze_image: async ({ url, question = 'ما الذي تراه في هذه الصورة؟' }) => {
      try {
        groqIdx.current = (groqIdx.current + 1) % 7;
        const base = groqIdx.current;
        let lastErr;
        for (let t = 0; t < 7; t++) {
          const key = getGroqKey(base + t);
          if (!key) continue;
          try {
            const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
              method: 'POST',
              headers: { 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                model: 'llama-3.2-90b-vision-preview',
                messages: [{ role: 'user', content: [
                  { type: 'text', text: question },
                  { type: 'image_url', image_url: { url } }
                ]}],
                max_tokens: 2048,
              })
            });
            if (r.status === 429 || r.status === 401) { lastErr = new Error('rate limit'); continue; }
            const d = await r.json();
            return d.choices[0].message.content;
          } catch (e) { if (e.message?.includes('rate')) { lastErr = e; continue; } throw e; }
        }
        throw lastErr;
      } catch (e) { return 'فشل تحليل الصورة: ' + e.message; }
    },

    // 15. تلخيص نص
    summarize_text: async ({ text, lang = 'ar' }) => {
      try {
        return await callGroq([
          { role: 'system', content: `لخّص النص التالي بشكل موجز ومفيد باللغة ${lang === 'ar' ? 'العربية' : 'الإنجليزية'}.` },
          { role: 'user', content: text.slice(0, 6000) }
        ], 'meta-llama/llama-4-maverick-17b-128e-instruct');
      } catch (e) { return 'فشل التلخيص: ' + e.message; }
    },

    // 16. ترجمة
    translate_text: async ({ text, to = 'en' }) => {
      try {
        const langs = { en: 'الإنجليزية', ar: 'العربية', fr: 'الفرنسية', de: 'الألمانية', es: 'الإسبانية', zh: 'الصينية' };
        return await callGroq([
          { role: 'user', content: `ترجم إلى ${langs[to] || to}:\n\n${text.slice(0, 3000)}` }
        ], 'meta-llama/llama-4-maverick-17b-128e-instruct');
      } catch (e) { return 'فشل الترجمة: ' + e.message; }
    },

    // 17. إنشاء خطة
    create_plan: async ({ goal, steps = 5 }) => {
      try {
        return await callGroq([
          { role: 'system', content: 'أنت مخطط استراتيجي خبير. اصنع خططاً مفصلة وقابلة للتنفيذ.' },
          { role: 'user', content: `ضع خطة مفصلة من ${steps} خطوات لتحقيق: ${goal}` }
        ], 'meta-llama/llama-4-maverick-17b-128e-instruct');
      } catch (e) { return 'فشل إنشاء الخطة: ' + e.message; }
    },

    // 18. تفكير عميق
    deep_think: async ({ question }) => {
      try {
        return await callGroq([
          { role: 'system', content: 'أنت مفكر فلسفي وعلمي عميق. فكّر بعمق وتأمل.' },
          { role: 'user', content: 'فكّر بعمق في: ' + question }
        ], 'deepseek-r1-distill-llama-70b', 8000);
      } catch (e) { return 'فشل التفكير العميق: ' + e.message; }
    },

    // 19. قراءة الذاكرة
    read_memory: async ({ key }) => {
      return agentMemory[key] !== undefined ? `🧠 ${key}: ${String(agentMemory[key])}` : `❌ لا يوجد: ${key}`;
    },

    // 20. حفظ في الذاكرة
    save_memory: async ({ key, value }) => {
      setAgentMemory(p => ({ ...p, [key]: value }));
      return `✅ تم حفظ "${key}" في الذاكرة`;
    },

    // 21. قائمة الذاكرة
    list_memory: async () => {
      const entries = Object.entries(agentMemory);
      if (!entries.length) return '🧠 الذاكرة فارغة';
      return '🧠 الذاكرة:\n' + entries.map(([k, v]) => `• ${k}: ${String(v).slice(0, 100)}`).join('\n');
    },

    // 22. حساب
    calculate: async ({ expr }) => {
      try {
        const result = Function('"use strict"; return (' + expr + ')')();
        return `🔢 ${expr} = ${result}`;
      } catch (e) { return 'خطأ: ' + e.message; }
    },

    // 23. التاريخ والوقت
    get_datetime: async () => {
      const now = new Date();
      return `📅 ${now.toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\n⏰ ${now.toLocaleTimeString('ar-EG')}`;
    },

    // 24. تنسيق JSON
    format_json: async ({ data }) => {
      try {
        const parsed = typeof data === 'string' ? JSON.parse(data) : data;
        return JSON.stringify(parsed, null, 2);
      } catch (e) { return 'خطأ في التنسيق: ' + e.message; }
    },
  }), [keys, agentMemory, model]);

  // ─── AGENT SYSTEM PROMPT ──────────────────────
  const AGENT_SYS = `أنت وكيل ذكاء اصطناعي احترافي مستقل — NEBULA AI AGENT.
لديك 24 أداة قوية تمكّنك من:
• تصفح الإنترنت بنفسك وجلب أي محتوى
• التفكير البصري وتحليل الصور
• كتابة وتنفيذ الكود
• التفاعل مع GitHub
• التخطيط والتفكير العميق
• الذاكرة الدائمة

الأدوات المتاحة (استخدمها بالصيغة الدقيقة):

【ويب وبيانات】
[TOOL: search_web | {"query":"..."}] — ابحث في الإنترنت
[TOOL: fetch_url | {"url":"https://..."}] — اجلب أي صفحة ويب
[TOOL: get_weather | {"city":"القاهرة"}] — الطقس
[TOOL: search_github | {"query":"...","type":"repositories"}] — بحث GitHub

【كود وبناء】
[TOOL: build_app | {"description":"..."}] — بناء تطبيق
[TOOL: analyze_code | {"code":"...","goal":"review"}] — تحليل كود
[TOOL: execute_code | {"code":"..."}] — تنفيذ JavaScript
[TOOL: fix_error | {"error":"...","context":"..."}] — إصلاح خطأ

【GitHub】
[TOOL: push_github | {"repo":"owner/repo","path":"file","content":"...","message":"..."}]
[TOOL: read_github_file | {"repo":"owner/repo","path":"file"}]
[TOOL: list_github_files | {"repo":"owner/repo","dir":""}]
[TOOL: create_github_issue | {"repo":"owner/repo","title":"...","body":"..."}]

【ذكاء اصطناعي ووسائط】
[TOOL: generate_image | {"prompt":"..."}] — توليد صورة
[TOOL: analyze_image | {"url":"https://...","question":"..."}] — تحليل صورة (تفكير بصري)
[TOOL: summarize_text | {"text":"...","lang":"ar"}] — تلخيص
[TOOL: translate_text | {"text":"...","to":"en"}] — ترجمة

【تخطيط وتفكير】
[TOOL: create_plan | {"goal":"...","steps":5}] — خطة مفصلة
[TOOL: deep_think | {"question":"..."}] — تفكير عميق

【ذاكرة】
[TOOL: read_memory | {"key":"..."}]
[TOOL: save_memory | {"key":"...","value":"..."}]
[TOOL: list_memory | {}]

【أدوات】
[TOOL: calculate | {"expr":"2+2"}]
[TOOL: get_datetime | {}]
[TOOL: format_json | {"data":"..."}]

قواعد الوكيل:
1. ابدأ بـ THOUGHT: حلّل الهدف
2. استخدم أداة واحدة في كل خطوة بصيغة [TOOL: اسم_الأداة | {...}]
3. بعد OBSERVATION: قرر الخطوة التالية
4. اكتب FINAL ANSWER: عند الانتهاء
5. للمهام المعقدة: ابدأ بـ create_plan
6. عند الفشل: استخدم fix_error وأعد المحاولة
7. حتى 15 تكراراً — خطط بكفاءة`;

  // ─── RUN AGENT ───────────────────────────────
  const addStep = (type, content, extra = {}) => {
    const step = { id: Date.now().toString() + Math.random(), type, content, ts: new Date().toLocaleTimeString('ar'), ...extra };
    setAgentSteps(p => [...p, step]);
    return step;
  };

  const runAgent = useCallback(async () => {
    if (!agentGoal.trim() || agentRunning) return;
    setAgentRunning(true);
    setAgentSteps([]);
    const goal = agentGoal.trim();

    addStep('goal', goal);

    const history = [{ role: 'system', content: AGENT_SYS }];
    history.push({ role: 'user', content: `الهدف: ${goal}` });

    for (let iter = 0; iter < 15; iter++) {
      addStep('thinking', `التكرار ${iter + 1}/15 — أفكر...`);
      let reply;
      try {
        reply = await callGroq(history, 'meta-llama/llama-4-maverick-17b-128e-instruct', 3000);
      } catch (e) {
        addStep('error', 'خطأ في الاتصال: ' + e.message);
        break;
      }
      history.push({ role: 'assistant', content: reply });

      // Extract THOUGHT
      const thoughtMatch = reply.match(/THOUGHT:\s*([\s\S]*?)(?:\[TOOL:|FINAL ANSWER:|$)/);
      if (thoughtMatch?.[1]?.trim()) addStep('thought', thoughtMatch[1].trim());

      // Check FINAL ANSWER
      if (reply.includes('FINAL ANSWER:')) {
        const ans = reply.split('FINAL ANSWER:')[1]?.trim() || reply;
        addStep('done', ans);
        break;
      }

      // Extract TOOL call
      const toolMatch = reply.match(/\[TOOL:\s*(\w+)\s*\|\s*(\{[\s\S]*?\})\]/);
      if (!toolMatch) {
        // No tool call, treat as final
        addStep('done', reply.replace(/THOUGHT:[\s\S]*?(?=\n|$)/g, '').trim() || reply);
        break;
      }

      const [, toolName, argsStr] = toolMatch;
      let args = {};
      try { args = JSON.parse(argsStr); } catch { args = { raw: argsStr }; }

      addStep('tool_call', `🔧 ${toolName}`, { tool: toolName, args });

      const toolFn = tools[toolName];
      let observation;
      if (toolFn) {
        try { observation = await toolFn(args); }
        catch (e) { observation = 'خطأ: ' + e.message; }
      } else {
        observation = `❌ أداة غير معروفة: ${toolName}`;
      }

      // Handle image results
      const isImage = typeof observation === 'string' && observation.startsWith('IMAGE:');
      const imageUrl = isImage ? observation.slice(6) : null;
      const obsText = isImage ? `تم توليد الصورة: ${imageUrl}` : String(observation).slice(0, 2000);

      addStep('observation', obsText, { imageUrl });
      history.push({ role: 'user', content: `OBSERVATION: ${obsText}` });
    }

    setAgentRunning(false);
  }, [agentGoal, agentRunning, tools, model]);

  // ─── CHAT ─────────────────────────────────────
  const sendChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const txt = chatInput.trim();
    const userMsg = { id: Date.now().toString(), role: 'user', content: txt };
    setMsgs(p => [...p, userMsg]);
    setChatInput('');
    setChatLoading(true);
    try {
      const history = msgs.slice(-20).map(m => ({ role: m.role, content: m.content }));
      history.push({ role: 'user', content: txt });
      const reply = await callGroq(history);
      setMsgs(p => [...p, { id: (Date.now() + 1).toString(), role: 'assistant', content: reply }]);
    } catch (e) {
      Alert.alert('خطأ', e.message);
    } finally {
      setChatLoading(false);
      setTimeout(() => chatScroll.current?.scrollToEnd({ animated: true }), 200);
    }
  };

  // ─── VISION ───────────────────────────────────
  const pickImage = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, quality: 0.7, base64: true,
    });
    if (!r.canceled) setVisImg(r.assets[0]);
  };

  const analyzeVision = async () => {
    if (!visImg || visLoading) return;
    setVisLoading(true); setVisResult('');
    try {
      const dataUrl = `data:image/jpeg;base64,${visImg.base64}`;
      groqIdx.current = (groqIdx.current + 1) % 7;
      const base = groqIdx.current;
      let reply, lastErr;
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
                { type: 'text', text: visPrompt || 'حلّل هذه الصورة بتفصيل كامل' },
                { type: 'image_url', image_url: { url: dataUrl } },
              ]}],
              max_tokens: 2048,
            }),
          });
          if (r.status === 429 || r.status === 401) { lastErr = new Error('rate limit'); continue; }
          if (!r.ok) { const e = await r.json(); throw new Error(e.error?.message); }
          const d = await r.json();
          reply = d.choices[0].message.content;
          break;
        } catch (e) { if (e.message?.includes('rate')) { lastErr = e; continue; } throw e; }
      }
      if (reply) setVisResult(reply);
      else throw lastErr || new Error('فشل جميع المفاتيح');
    } catch (e) {
      Alert.alert('خطأ Vision', e.message);
    } finally { setVisLoading(false); }
  };

  // ─── SEARCH ───────────────────────────────────
  const doSearch = async () => {
    if (!srchQ.trim() || srchLoading) return;
    setSrchLoading(true); setSrchResults([]);
    try {
      const r = await fetch('https://s.jina.ai/' + encodeURIComponent(srchQ), {
        headers: { Accept: 'application/json', 'X-Return-Format': 'markdown' }
      });
      const d = await r.json();
      setSrchResults(d.data || []);
    } catch (e) { Alert.alert('خطأ', e.message); }
    finally { setSrchLoading(false); }
  };

  // ─── CREATE ───────────────────────────────────
  const genImage = () => {
    if (!createPrompt.trim()) return;
    setCreateImg(`https://image.pollinations.ai/prompt/${encodeURIComponent(createPrompt)}?width=1024&height=1024&nologo=true&seed=${Date.now()}`);
  };

  const genStoryboard = async () => {
    if (!createPrompt.trim() || createLoading) return;
    setCreateLoading(true);
    try {
      const res = await callGroq([
        { role: 'user', content: `اصنع storyboard من 4 مشاهد لـ: ${createPrompt}\nأرجع JSON فقط: [{"scene":1,"title":"...","prompt":"..."},...]` }
      ], 'meta-llama/llama-4-maverick-17b-128e-instruct');
      const scenes = JSON.parse(res.match(/\[[\s\S]*\]/)[0]);
      setStoryboard(scenes.map(s => ({
        ...s,
        url: `https://image.pollinations.ai/prompt/${encodeURIComponent(s.prompt)}?width=512&height=512&nologo=true&seed=${Math.random() * 9999 | 0}`
      })));
    } catch (e) { Alert.alert('خطأ', e.message); }
    finally { setCreateLoading(false); }
  };

  // ─── BUILD ────────────────────────────────────
  const doBuild = async () => {
    if (!buildPrompt.trim() || buildLoading) return;
    setBuildLoading(true); setBuildCode(''); setCommitUrl('');
    try {
      const code = await callGroq([
        { role: 'system', content: 'أنت مطور React Native Expo خبير. اكتب كود كامل قابل للتشغيل.' },
        { role: 'user', content: 'اكتب App.tsx كامل لـ: ' + buildPrompt + '\nأرجع الكود فقط.' }
      ], 'meta-llama/llama-4-maverick-17b-128e-instruct', 8000);
      setBuildCode(code);
      if (keys.GITHUB) {
        const repo = 'alhsryahmd266-jpg/ai-studio-apk';
        const shaR = await fetch(`https://api.github.com/repos/${repo}/contents/generated_app.tsx`, {
          headers: { Authorization: 'token ' + keys.GITHUB }
        });
        const shaJ = await shaR.json();
        const pushR = await fetch(`https://api.github.com/repos/${repo}/contents/generated_app.tsx`, {
          method: 'PUT',
          headers: { Authorization: 'token ' + keys.GITHUB, 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: '🤖 Built by Nebula Studio Pro', content: btoa(unescape(encodeURIComponent(code))), ...(shaJ.sha ? { sha: shaJ.sha } : {}) })
        });
        const pushJ = await pushR.json();
        if (pushJ.commit) setCommitUrl(pushJ.commit.html_url);
      }
    } catch (e) { Alert.alert('خطأ', e.message); }
    finally { setBuildLoading(false); }
  };

  // ─── RENDERS ──────────────────────────────────
  const renderAgent = () => (
    <View style={{ flex: 1 }}>
      <View style={S.sectionPad}>
        <Text style={S.sectionTitle}>🤖 وكيل ذكاء اصطناعي مستقل</Text>
        <Text style={S.sectionSub}>24 أداة · تصفح الإنترنت · تفكير بصري · ذاكرة دائمة</Text>
        <Glass style={S.inputGlass} glow={agentRunning ? C.purple : undefined}>
          <TextInput
            style={S.agentInput}
            value={agentGoal}
            onChangeText={setAgentGoal}
            placeholder="ما الهدف؟ مثل: ابحث عن أحدث أخبار الذكاء الاصطناعي وقدّم ملخصاً"
            placeholderTextColor={C.gray}
            multiline
            editable={!agentRunning}
          />
        </Glass>
        <GBtn
          onPress={runAgent}
          disabled={agentRunning || !agentGoal.trim()}
          colors={agentRunning ? [C.grayDark, C.grayDark] : [C.purple, C.purpleDark]}
          icon={agentRunning ? undefined : 'play-outline'}
          label={agentRunning ? 'يعمل...' : '▶ تشغيل الوكيل'}
          style={{ marginTop: 12 }}
        />
        {agentRunning && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 }}>
            <PulseDot color={C.purple} />
            <Text style={{ color: C.gray, fontSize: 12 }}>الوكيل يعمل...</Text>
          </View>
        )}
      </View>
      <ScrollView ref={agentScroll} style={{ flex: 1 }} contentContainerStyle={S.sectionPad}
        onContentSizeChange={() => agentScroll.current?.scrollToEnd({ animated: true })}>
        {agentSteps.map(step => <AgentStepCard key={step.id} step={step} />)}
      </ScrollView>
    </View>
  );

  const renderChat = () => (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Model picker */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={S.modelBar} contentContainerStyle={{ paddingHorizontal: 16 }}>
        {MODELS.map(m => (
          <TouchableOpacity key={m.id} onPress={() => setModel(m.id)} style={[S.modelChip, model === m.id && { borderColor: m.color, backgroundColor: m.color + '22' }]}>
            <Ionicons name={m.icon} size={14} color={model === m.id ? m.color : C.gray} />
            <Text style={[S.modelChipText, { color: model === m.id ? m.color : C.gray }]}>{m.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <ScrollView ref={chatScroll} style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        {msgs.map(m => <ChatBubble key={m.id} msg={m} />)}
        {chatLoading && (
          <View style={[S.bubble, S.bubbleAI]}>
            <ActivityIndicator size="small" color={C.purple} />
          </View>
        )}
      </ScrollView>
      <View style={S.chatBar}>
        <Glass style={S.chatInputGlass}>
          <TextInput style={S.chatInput} value={chatInput} onChangeText={setChatInput}
            placeholder="اكتب رسالتك..." placeholderTextColor={C.gray} multiline />
          <TouchableOpacity onPress={sendChat} disabled={chatLoading || !chatInput.trim()}>
            <LinearGradient colors={[C.purple, C.purpleDark]} style={S.sendBtn}>
              <Ionicons name="send" size={18} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </Glass>
      </View>
    </KeyboardAvoidingView>
  );

  const renderVision = () => (
    <ScrollView contentContainerStyle={S.sectionPad}>
      <Text style={S.sectionTitle}>👁 تفكير بصري</Text>
      <Text style={S.sectionSub}>نموذج Vision 90B · يحلل الصور بدقة عالية</Text>
      <TouchableOpacity onPress={pickImage} style={S.dropZone}>
        {visImg ? (
          <Image source={{ uri: visImg.uri }} style={S.dropImg} />
        ) : (
          <View style={S.dropContent}>
            <Ionicons name="image-outline" size={64} color={C.pink} />
            <Text style={{ color: C.gray, marginTop: 12, fontSize: 16 }}>اضغط لاختيار صورة</Text>
            <Text style={{ color: C.grayDark, marginTop: 4, fontSize: 12 }}>JPG, PNG, WEBP</Text>
          </View>
        )}
      </TouchableOpacity>
      <Glass style={{ padding: 12, marginBottom: 16 }}>
        <Text style={{ color: C.gray, fontSize: 12, marginBottom: 6 }}>سؤالك عن الصورة:</Text>
        <TextInput
          style={{ color: C.white, fontSize: 14, minHeight: 60 }}
          value={visPrompt}
          onChangeText={setVisPrompt}
          multiline
          placeholder="حلّل هذه الصورة..."
          placeholderTextColor={C.grayDark}
        />
      </Glass>
      <GBtn onPress={analyzeVision} disabled={!visImg || visLoading}
        colors={[C.pink, '#be185d']} icon="eye-outline"
        label={visLoading ? 'يحلل...' : 'تحليل الصورة بالذكاء الاصطناعي'} />
      {visLoading && <ActivityIndicator color={C.pink} size="large" style={{ marginTop: 24 }} />}
      {visResult !== '' && (
        <Glass style={S.resultCard} glow={C.pink}>
          <Text style={{ color: C.pink, fontSize: 12, fontWeight: '700', marginBottom: 10 }}>🧠 التحليل البصري:</Text>
          <Text style={{ color: C.white, lineHeight: 24, fontSize: 15 }}>{visResult}</Text>
        </Glass>
      )}
    </ScrollView>
  );

  const renderSearch = () => (
    <View style={{ flex: 1 }}>
      <View style={S.sectionPad}>
        <Text style={S.sectionTitle}>🌐 تصفح الإنترنت</Text>
        <Text style={S.sectionSub}>Jina AI · جلب محتوى حقيقي من الويب</Text>
        <Glass style={S.searchBar2} glow={srchLoading ? C.cyan : undefined}>
          <Ionicons name="search-outline" size={20} color={C.cyan} style={{ marginRight: 8 }} />
          <TextInput style={S.searchInput2} value={srchQ} onChangeText={setSrchQ}
            placeholder="ابحث عن أي شيء..." placeholderTextColor={C.gray}
            onSubmitEditing={doSearch} returnKeyType="search" />
          <TouchableOpacity onPress={doSearch}>
            <LinearGradient colors={[C.cyan, C.blue]} style={{ borderRadius: 16, padding: 8 }}>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </Glass>
      </View>
      {srchLoading && <ActivityIndicator color={C.cyan} size="large" style={{ marginTop: 40 }} />}
      <FlatList data={srchResults} keyExtractor={(_, i) => i.toString()} contentContainerStyle={S.sectionPad}
        renderItem={({ item, index }) => (
          <Glass style={S.srchCard} glow={index === 0 ? C.cyan + '44' : undefined}>
            <Text style={{ color: C.cyan, fontSize: 15, fontWeight: '700', marginBottom: 6 }} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={{ color: C.gray, fontSize: 12, marginBottom: 8 }} numberOfLines={1}>{item.url}</Text>
            <Text style={{ color: C.white, fontSize: 13, lineHeight: 20 }} numberOfLines={5}>
              {item.content?.slice(0, 300)}
            </Text>
            <TouchableOpacity onPress={() => Linking.openURL(item.url)} style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="open-outline" size={14} color={C.cyan} />
              <Text style={{ color: C.cyan, fontSize: 12, marginLeft: 4 }}>فتح في المتصفح</Text>
            </TouchableOpacity>
          </Glass>
        )} />
    </View>
  );

  const renderCreate = () => (
    <ScrollView contentContainerStyle={S.sectionPad}>
      <Text style={S.sectionTitle}>🎨 الإبداع بالذكاء الاصطناعي</Text>
      <Text style={S.sectionSub}>Pollinations AI · 1024×1024 · Storyboard تلقائي</Text>
      <Glass style={{ padding: 16, marginBottom: 16 }}>
        <TextInput style={{ color: C.white, fontSize: 15, minHeight: 80 }}
          value={createPrompt} onChangeText={setCreatePrompt}
          placeholder="صف ما تريد إنشاءه..." placeholderTextColor={C.grayDark} multiline />
      </Glass>
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
        <GBtn onPress={genImage} colors={[C.gold, '#b45309']} icon="image-outline" label="صورة" style={{ flex: 1 }} />
        <GBtn onPress={genStoryboard} disabled={createLoading} colors={[C.orange, '#c2410c']} icon="film-outline" label="Storyboard" style={{ flex: 1 }} />
      </View>
      {createLoading && <ActivityIndicator color={C.gold} size="large" style={{ marginTop: 20 }} />}
      {createImg && !storyboard && (
        <View style={{ borderRadius: 20, overflow: 'hidden', marginBottom: 16 }}>
          <Image source={{ uri: createImg }} style={{ width: '100%', aspectRatio: 1 }} resizeMode="cover" />
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)']} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16 }}>
            <TouchableOpacity onPress={() => Share.share({ url: createImg })}>
              <Text style={{ color: C.gold, fontWeight: '700' }}>⬇ مشاركة الصورة</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      )}
      {storyboard && (
        <View>
          <Text style={{ color: C.white, fontSize: 16, fontWeight: '700', marginBottom: 12 }}>🎬 Storyboard:</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {storyboard.map((s, i) => (
              <Glass key={i} style={{ width: (width - 52) / 2, borderRadius: 16, overflow: 'hidden' }}>
                <Image source={{ uri: s.url }} style={{ width: '100%', aspectRatio: 1 }} />
                <View style={{ padding: 8 }}>
                  <Text style={{ color: C.gold, fontSize: 11, fontWeight: '700' }}>مشهد {s.scene}</Text>
                  <Text style={{ color: C.white, fontSize: 11, marginTop: 4 }}>{s.title}</Text>
                </View>
              </Glass>
            ))}
          </View>
          <GBtn onPress={() => setStoryboard(null)} colors={[C.grayDark, '#1e293b']} icon="trash-outline" label="مسح" style={{ marginTop: 16 }} />
        </View>
      )}
    </ScrollView>
  );

  const renderBuild = () => (
    <ScrollView contentContainerStyle={S.sectionPad}>
      <Text style={S.sectionTitle}>⚙ بناء التطبيقات</Text>
      <Text style={S.sectionSub}>Llama 4 Maverick · React Native · رفع تلقائي GitHub</Text>
      <Glass style={{ padding: 16, marginBottom: 16 }}>
        <TextInput style={{ color: C.white, fontSize: 15, minHeight: 120 }}
          value={buildPrompt} onChangeText={setBuildPrompt}
          placeholder="صف التطبيق الذي تريد بناءه..." placeholderTextColor={C.grayDark} multiline />
      </Glass>
      <GBtn onPress={doBuild} disabled={buildLoading}
        colors={[C.teal, '#0f766e']} icon="rocket-outline"
        label={buildLoading ? 'يبني...' : 'ابنِ التطبيق'} />
      {buildLoading && <ActivityIndicator color={C.teal} size="large" style={{ marginTop: 20 }} />}
      {buildCode !== '' && (
        <Glass style={{ padding: 16, marginTop: 20, backgroundColor: '#000' }} glow={C.teal}>
          <Text style={{ color: C.teal, fontSize: 12, fontWeight: '700', marginBottom: 8 }}>الكود المولّد:</Text>
          <ScrollView horizontal>
            <Text style={{ color: '#4ade80', fontFamily: 'monospace', fontSize: 11, lineHeight: 18 }}>
              {buildCode.slice(0, 3000)}
            </Text>
          </ScrollView>
          {commitUrl !== '' && (
            <TouchableOpacity onPress={() => Linking.openURL(commitUrl)} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
              <Ionicons name="logo-github" size={16} color={C.green} />
              <Text style={{ color: C.green, marginLeft: 6, fontSize: 13 }}>تم الرفع على GitHub ✓</Text>
            </TouchableOpacity>
          )}
        </Glass>
      )}
    </ScrollView>
  );

  const renderVault = () => <VaultScreen keys={keys} saveKey={saveKey} />;

  const tabContent = {
    Agent: renderAgent,
    Chat: renderChat,
    Vision: renderVision,
    Search: renderSearch,
    Create: renderCreate,
    Build: renderBuild,
    Vault: renderVault,
  };

  const activeTab = TABS.find(t => t.id === tab);

  return (
    <SafeAreaView style={S.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <StarBed />
      <NebulaOrbs />

      {/* Header */}
      <LinearGradient colors={['rgba(3,1,10,0.98)', 'rgba(3,1,10,0.85)']} style={S.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <LinearGradient colors={[C.purple, C.purpleDark]} style={S.logoBox}>
            <Text style={S.logoText}>N</Text>
          </LinearGradient>
          <View style={{ marginLeft: 10 }}>
            <Text style={S.appName}>NEBULA STUDIO PRO</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <PulseDot color={C.green} size={6} />
              <Text style={{ color: C.green, fontSize: 10, fontWeight: '600' }}>24 TOOLS · ONLINE</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity onPress={() => setTab('Vault')}>
          <LinearGradient colors={['rgba(139,92,246,0.2)', 'rgba(109,40,217,0.2)']} style={{ borderRadius: 12, padding: 8, borderWidth: 1, borderColor: C.purple + '44' }}>
            <Ionicons name="lock-closed-outline" size={20} color={C.purple} />
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>

      {/* Content */}
      <View style={{ flex: 1 }}>
        {tabContent[tab]?.()}
      </View>

      {/* Bottom Nav */}
      <View style={S.bottomNav}>
        <LinearGradient colors={['rgba(3,1,10,0.97)', 'rgba(7,3,15,0.99)']} style={S.bottomNavInner}>
          {TABS.map(t => {
            const active = tab === t.id;
            return (
              <TouchableOpacity key={t.id} onPress={() => setTab(t.id)} style={S.navItem}>
                {active && (
                  <LinearGradient colors={[t.color + '33', t.color + '11']} style={S.navActiveGlow} />
                )}
                <Ionicons name={t.icon} size={22} color={active ? t.color : C.grayDark} />
                <Text style={[S.navLabel, { color: active ? t.color : C.grayDark }]}>{t.label}</Text>
                {active && <View style={[S.navDot, { backgroundColor: t.color }]} />}
              </TouchableOpacity>
            );
          })}
        </LinearGradient>
      </View>
    </SafeAreaView>
  );
}

// ─── AGENT STEP CARD ──────────────────────────
const STEP_STYLES = {
  goal: { color: C.cyan, icon: 'flag-outline', bg: C.cyan + '15', border: C.cyan + '40' },
  thinking: { color: C.grayDark, icon: 'ellipsis-horizontal', bg: 'transparent', border: 'transparent' },
  thought: { color: C.gold, icon: 'bulb-outline', bg: C.gold + '10', border: C.gold + '30' },
  tool_call: { color: C.purple, icon: 'construct-outline', bg: C.purple + '15', border: C.purple + '40' },
  observation: { color: C.teal, icon: 'eye-outline', bg: C.teal + '10', border: C.teal + '30' },
  done: { color: C.green, icon: 'checkmark-circle-outline', bg: C.green + '15', border: C.green + '40' },
  error: { color: C.red, icon: 'alert-circle-outline', bg: C.red + '15', border: C.red + '40' },
};

const AgentStepCard = ({ step }) => {
  const st = STEP_STYLES[step.type] || STEP_STYLES.thought;
  if (step.type === 'thinking') return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
      <ActivityIndicator size="small" color={C.purple} />
      <Text style={{ color: C.grayDark, fontSize: 12 }}>{step.content}</Text>
    </View>
  );
  return (
    <View style={{ backgroundColor: st.bg, borderWidth: 1, borderColor: st.border, borderRadius: 14, padding: 14, marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name={st.icon} size={14} color={st.color} />
          <Text style={{ color: st.color, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>
            {step.type === 'tool_call' ? `أداة: ${step.tool}` : step.type}
          </Text>
        </View>
        <Text style={{ color: C.grayDark, fontSize: 10 }}>{step.ts}</Text>
      </View>
      {step.type === 'tool_call' && step.args && (
        <View style={{ backgroundColor: '#000', borderRadius: 8, padding: 8, marginBottom: 8 }}>
          <Text style={{ color: C.purple, fontFamily: 'monospace', fontSize: 11 }}>
            {JSON.stringify(step.args, null, 2).slice(0, 300)}
          </Text>
        </View>
      )}
      <Text style={{ color: C.white, lineHeight: 22, fontSize: 14 }}>{step.content}</Text>
      {step.imageUrl && (
        <View style={{ borderRadius: 12, overflow: 'hidden', marginTop: 10 }}>
          <Image source={{ uri: step.imageUrl }} style={{ width: '100%', aspectRatio: 1 }} resizeMode="cover" />
        </View>
      )}
    </View>
  );
};

// ─── CHAT BUBBLE ──────────────────────────────
const ChatBubble = ({ msg }) => {
  const isUser = msg.role === 'user';
  return (
    <View style={[S.msgWrap, isUser ? S.msgWrapUser : S.msgWrapAI]}>
      {!isUser && (
        <LinearGradient colors={[C.purple, C.purpleDark]} style={S.msgAvatar}>
          <Text style={{ color: '#fff', fontSize: 10, fontWeight: '900' }}>N</Text>
        </LinearGradient>
      )}
      <View style={[S.bubble, isUser ? S.bubbleUser : S.bubbleAI]}>
        <Text style={S.msgText}>{msg.content}</Text>
      </View>
    </View>
  );
};

// ─── VAULT SCREEN ─────────────────────────────
const VaultScreen = ({ keys, saveKey }) => {
  const fields = [
    { k: 'GITHUB', label: 'GitHub Token', icon: 'logo-github', color: C.white, hint: 'ghp_...' },
    { k: 'JINA', label: 'Jina AI Key', icon: 'search', color: C.cyan, hint: 'jina_...' },
    { k: 'GROQ_OVR', label: 'Groq Override', icon: 'key-outline', color: C.purple, hint: 'gsk_...' },
  ];
  return (
    <ScrollView contentContainerStyle={S.sectionPad}>
      <Text style={S.sectionTitle}>🔐 Neural Vault</Text>
      <Text style={S.sectionSub}>مشفّر بـ Android Keystore</Text>
      {fields.map(f => <VaultField key={f.k} {...f} value={keys[f.k]} onSave={v => saveKey(f.k, v)} />)}
      <Glass style={{ padding: 16, marginTop: 8 }}>
        <Text style={{ color: C.gray, fontSize: 13, lineHeight: 22 }}>
          🔑 مفاتيح Groq (1-7): محفوظة داخل الـ APK{'\n'}
          يمكنك إضافة Groq Override لاستخدام مفتاحك الخاص
        </Text>
      </Glass>
    </ScrollView>
  );
};

const VaultField = ({ k, label, icon, color, hint, value, onSave }) => {
  const [v, setV] = useState(value || '');
  const [saved, setSaved] = useState(false);
  const save = () => { onSave(v); setSaved(true); setTimeout(() => setSaved(false), 2000); };
  return (
    <Glass style={{ padding: 16, marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 }}>
        <Ionicons name={icon} size={18} color={color} />
        <Text style={{ color, fontSize: 13, fontWeight: '700' }}>{label}</Text>
        {saved && <Badge label="✓ محفوظ" color={C.green} />}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <TextInput style={{ flex: 1, color: C.white, borderBottomWidth: 1, borderBottomColor: C.glassBorder, paddingVertical: 8, fontSize: 14 }}
          value={v} onChangeText={setV} secureTextEntry placeholder={hint} placeholderTextColor={C.grayDark} />
        <TouchableOpacity onPress={save}>
          <LinearGradient colors={[C.purple, C.purpleDark]} style={{ borderRadius: 20, padding: 10 }}>
            <Ionicons name="checkmark" size={16} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </Glass>
  );
};

// ════════════════════════════════════════════════
//  STYLESHEET — MAXIMUM QUALITY
// ════════════════════════════════════════════════
const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  orb: { position: 'absolute' },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.glassBorder },
  logoBox: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  logoText: { color: '#fff', fontSize: 20, fontWeight: '900', fontStyle: 'italic' },
  appName: { color: C.white, fontSize: 15, fontWeight: '900', letterSpacing: 3 },

  // Glass
  glass: { backgroundColor: C.glass, borderRadius: 16, borderWidth: 1, borderColor: C.glassBorder },

  // Gradient button
  gbtnWrap: { height: 50, borderRadius: 25, overflow: 'hidden' },
  gbtnInner: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', borderRadius: 25 },
  gbtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  // Bottom nav
  bottomNav: { borderTopWidth: 1, borderTopColor: C.glassBorder },
  bottomNavInner: { flexDirection: 'row', paddingVertical: 8, paddingBottom: Platform.OS === 'ios' ? 20 : 8 },
  navItem: { flex: 1, alignItems: 'center', paddingVertical: 4, position: 'relative' },
  navActiveGlow: { position: 'absolute', top: -4, left: 4, right: 4, bottom: -4, borderRadius: 14 },
  navLabel: { fontSize: 9, marginTop: 3, fontWeight: '600' },
  navDot: { width: 3, height: 3, borderRadius: 2, marginTop: 2 },

  // Section
  sectionPad: { padding: 16 },
  sectionTitle: { color: C.white, fontSize: 22, fontWeight: '900', marginBottom: 4 },
  sectionSub: { color: C.gray, fontSize: 12, marginBottom: 20 },

  // Agent
  inputGlass: { padding: 12 },
  agentInput: { color: C.white, fontSize: 15, minHeight: 80 },

  // Chat
  modelBar: { maxHeight: 44, marginVertical: 8 },
  modelChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.glass, borderWidth: 1, borderColor: C.glassBorder, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, marginRight: 8 },
  modelChipText: { fontSize: 12, fontWeight: '600', marginLeft: 6 },
  chatBar: { padding: 12, borderTopWidth: 1, borderTopColor: C.glassBorder },
  chatInputGlass: { flexDirection: 'row', alignItems: 'flex-end', padding: 10, gap: 10 },
  chatInput: { flex: 1, color: C.white, fontSize: 15, maxHeight: 100 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  msgWrap: { flexDirection: 'row', marginBottom: 14, maxWidth: '88%' },
  msgWrapUser: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
  msgWrapAI: { alignSelf: 'flex-start' },
  msgAvatar: { width: 28, height: 28, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  bubble: { borderRadius: 16, padding: 12, maxWidth: '100%' },
  bubbleUser: { backgroundColor: C.purple + 'cc', borderBottomRightRadius: 4 },
  bubbleAI: { backgroundColor: C.glass, borderWidth: 1, borderColor: C.glassBorder, borderBottomLeftRadius: 4 },
  msgText: { color: C.white, fontSize: 14, lineHeight: 22 },

  // Vision
  dropZone: { height: 220, borderRadius: 20, borderWidth: 2, borderColor: C.pink + '44', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', marginBottom: 16, overflow: 'hidden', backgroundColor: C.pink + '08' },
  dropImg: { width: '100%', height: '100%', borderRadius: 18 },
  dropContent: { alignItems: 'center' },
  resultCard: { padding: 16, marginTop: 16 },

  // Search
  searchBar2: { flexDirection: 'row', alignItems: 'center', padding: 12, marginBottom: 4 },
  searchInput2: { flex: 1, color: C.white, fontSize: 15 },
  srchCard: { padding: 16, marginBottom: 14 },
});
