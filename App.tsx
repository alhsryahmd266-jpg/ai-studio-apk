import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, Image, Platform,
  KeyboardAvoidingView, StatusBar, Dimensions, Animated,
  Modal, Clipboard, Pressable,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';

const { width: W, height: H } = Dimensions.get('window');

// ============================================================
//  LATEST GROQ MODELS
// ============================================================
const MODELS = {
  LLAMA4_MAV:  'meta-llama/llama-4-maverick-17b-128e-instruct',
  LLAMA4_SCT:  'meta-llama/llama-4-scout-17b-16e-instruct',
  LLAMA33_70B: 'llama-3.3-70b-versatile',
  DEEPSEEK_R1: 'deepseek-r1-distill-llama-70b',
  QWQ_32B:     'qwen-qwq-32b',
  VISION_90B:  'llama-3.2-90b-vision-preview',
  VISION_11B:  'llama-3.2-11b-vision-preview',
  FAST:        'llama-3.1-8b-instant',
};

const MODEL_LABELS: Record<string,string> = {
  [MODELS.LLAMA4_MAV]:  'Llama 4 Maverick ✨',
  [MODELS.LLAMA4_SCT]:  'Llama 4 Scout ⚡',
  [MODELS.LLAMA33_70B]: 'Llama 3.3 70B 💪',
  [MODELS.DEEPSEEK_R1]: 'DeepSeek R1 🤔',
  [MODELS.QWQ_32B]:     'QwQ 32B 🧩',
  [MODELS.VISION_90B]:  'Vision 90B 👁',
  [MODELS.VISION_11B]:  'Vision 11B 👁',
  [MODELS.FAST]:        'Llama 3.1 8B ⚡',
};
const THINKING_MODELS = [MODELS.DEEPSEEK_R1, MODELS.QWQ_32B];

// ============================================================
//  7 GROQ KEYS — AUTO-ROTATE + EXTRA VAULT KEYS
// ============================================================
const BUILTIN_KEYS = [
  process.env.EXPO_PUBLIC_GROQ_KEY_1 || '',
  process.env.EXPO_PUBLIC_GROQ_KEY_2 || '',
  process.env.EXPO_PUBLIC_GROQ_KEY_3 || '',
  process.env.EXPO_PUBLIC_GROQ_KEY_4 || '',
  process.env.EXPO_PUBLIC_GROQ_KEY_5 || '',
  process.env.EXPO_PUBLIC_GROQ_KEY_6 || '',
  process.env.EXPO_PUBLIC_GROQ_KEY_7 || '',
].filter(Boolean);

let _keyIdx = 0;
let _extraKeys: string[] = [];

function allKeys() { return [...BUILTIN_KEYS, ..._extraKeys].filter(Boolean); }
function nextKey(): { key: string; num: number } {
  const keys = allKeys();
  if (!keys.length) return { key: '', num: 0 };
  const num = (_keyIdx % keys.length) + 1;
  const key = keys[_keyIdx % keys.length];
  _keyIdx++;
  return { key, num };
}

// ============================================================
//  SECURE VAULT — expo-secure-store
// ============================================================
const SK_GROQ   = 'AI_STUDIO_GROQ_EXTRAS';
const SK_GITHUB = 'AI_STUDIO_GITHUB_TOKEN';

async function vaultSave(k: string, v: string) { try { await SecureStore.setItemAsync(k, v); } catch {} }
async function vaultLoad(k: string): Promise<string> { try { return (await SecureStore.getItemAsync(k)) || ''; } catch { return ''; } }

async function loadExtraKeys() {
  const raw = await vaultLoad(SK_GROQ);
  if (raw) _extraKeys = raw.split('||').filter(Boolean);
}
async function saveExtraKey(key: string) {
  if (!key.trim()) return;
  _extraKeys = [..._extraKeys.filter(k => k !== key.trim()), key.trim()];
  await vaultSave(SK_GROQ, _extraKeys.join('||'));
}
async function removeExtraKey(key: string) {
  _extraKeys = _extraKeys.filter(k => k !== key);
  await vaultSave(SK_GROQ, _extraKeys.join('||'));
}

// ============================================================
//  GROQ API
// ============================================================
async function callGroq(messages: any[], model: string, key: string, maxTokens = 8192): Promise<string> {
  if (!key) throw new Error('لا يوجد مفتاح Groq — أضفه من خزنة المفاتيح');
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, max_tokens: maxTokens, temperature: 0.7 }),
  });
  if (!res.ok) { const e = await res.text(); throw new Error(`Groq ${res.status}: ${e.slice(0,200)}`); }
  const d = await res.json();
  return d.choices[0]?.message?.content || '';
}

// ============================================================
//  REAL WEB BROWSING — JINA AI (no API key needed)
// ============================================================
async function fetchWebPage(url: string): Promise<string> {
  try {
    const r = await fetch(`https://r.jina.ai/${encodeURIComponent(url)}`, {
      headers: { Accept: 'text/plain', 'X-Return-Format': 'text' },
    });
    return (await r.text()).slice(0, 6000);
  } catch (e: any) { return `فشل جلب الصفحة: ${e.message}`; }
}

async function searchWeb(query: string): Promise<string> {
  try {
    const r = await fetch(`https://s.jina.ai/${encodeURIComponent(query)}`, {
      headers: { Accept: 'text/plain', 'X-Return-Format': 'text' },
    });
    return (await r.text()).slice(0, 5000);
  } catch (e: any) { return `فشل البحث: ${e.message}`; }
}

// ============================================================
//  IMAGE GENERATION — POLLINATIONS AI (completely free)
// ============================================================
function pollinationsUrl(prompt: string, w = 1024, h = 1024) {
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${w}&height=${h}&nologo=true&enhance=true&seed=${Date.now()}`;
}

// ============================================================
//  THINKING PARSER — DeepSeek-R1 / QwQ show internal thought
// ============================================================
function parseThinking(raw: string): { thinking: string; answer: string } {
  const m = raw.match(/<think>([\s\S]*?)<\/think>/i);
  if (m) return { thinking: m[1].trim(), answer: raw.replace(/<think>[\s\S]*?<\/think>/i, '').trim() };
  return { thinking: '', answer: raw };
}

// ============================================================
//  TOOL ENGINE — AI uses real internet + tools
// ============================================================
const TOOL_SYSTEM = `أنت مساعد ذكاء اصطناعي متطور يتصفح الإنترنت الحقيقي.
لديك هذه الأدوات — استخدمها حرفياً بهذا الشكل:

[TOOL: search_web | {"query":"ما تبحث عنه"}]
[TOOL: fetch_url | {"url":"https://example.com"}]
[TOOL: calculate | {"expr":"25 * 4 + 10"}]
[TOOL: get_datetime | {}]
[TOOL: generate_image | {"prompt":"وصف الصورة بالإنجليزية"}]

قواعد:
- ابحث في الإنترنت دائماً للمعلومات الحديثة والأحداث الجارية
- عند إعطائك رابط، استخدم fetch_url مباشرة لجلب محتواه الحقيقي
- اعرض تفكيرك قبل الإجابة عند استخدام نموذج التفكير
- إذا فشل شيء، جرب طريقة مختلفة تلقائياً
- أجب بعمق وتفصيل كامل`;

interface ToolCall { tool: string; args: Record<string,any>; }

function extractToolCalls(text: string): ToolCall[] {
  const calls: ToolCall[] = [];
  const re = /\[TOOL:\s*(\w+)\s*\|\s*(\{[^}]*\})\]/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    try { calls.push({ tool: m[1], args: JSON.parse(m[2]) }); } catch {}
  }
  return calls;
}

async function executeTool(c: ToolCall): Promise<string> {
  switch (c.tool) {
    case 'search_web':    return searchWeb(c.args.query || '');
    case 'fetch_url':     return fetchWebPage(c.args.url || '');
    case 'calculate':
      try { return `= ${Function('"use strict";return(' + c.args.expr + ')')()}`; }
      catch { return 'خطأ في الحساب'; }
    case 'get_datetime':  return `الآن: ${new Date().toLocaleString('ar-EG')}`;
    case 'generate_image': return `[IMG_READY:${c.args.prompt}]`;
    default:              return `أداة غير معروفة: ${c.tool}`;
  }
}

async function runWithTools(
  userMsg: string,
  history: any[],
  model: string,
  key: string,
  onTool?: (t: string) => void,
): Promise<{ answer: string; thinking: string; toolsUsed: string[]; images: string[] }> {
  const msgs = [{ role: 'system', content: TOOL_SYSTEM }, ...history, { role: 'user', content: userMsg }];
  const toolsUsed: string[] = [];
  const images: string[] = [];

  for (let i = 0; i < 5; i++) {
    const raw = await callGroq(msgs, model, key, 8192);
    const calls = extractToolCalls(raw);
    if (!calls.length) {
      const { thinking, answer } = parseThinking(raw);
      const imgRe = /\[IMG_READY:([^\]]+)\]/g;
      let m; let clean = answer;
      while ((m = imgRe.exec(answer)) !== null) { images.push(m[1]); clean = clean.replace(m[0], `[صورة مولّدة]`); }
      return { answer: clean, thinking, toolsUsed, images };
    }
    let toolResults = raw;
    for (const call of calls) {
      onTool?.(call.tool);
      toolsUsed.push(call.tool);
      const result = await executeTool(call);
      if (call.tool === 'generate_image') images.push(call.args.prompt || '');
      toolResults = toolResults.replace(`[TOOL: ${call.tool} | ${JSON.stringify(call.args)}]`, `[نتيجة: ${result}]`);
    }
    msgs.push({ role: 'assistant', content: raw });
    msgs.push({ role: 'user', content: `نتائج الأدوات:\n${toolResults}\nأكمل إجابتك:` });
  }
  return { answer: 'انتهت الحدّ الأقصى من المحاولات', thinking: '', toolsUsed, images };
}

// ============================================================
//  THEME — NEBULA ULTRA (highest graphics)
// ============================================================
const T = {
  bg:        '#030310',
  bg2:       '#06061A',
  card:      '#0A0A20',
  card2:     '#0E0E28',
  border:    '#1E1E46',
  border2:   '#2A2A5C',
  accent:    '#7B61FF',
  accent2:   '#00F5C4',
  gold:      '#F5C418',
  red:       '#FF3366',
  pink:      '#FF6B9D',
  teal:      '#4ECDC4',
  text:      '#F0EFFF',
  text2:     '#A0A0D0',
  sub:       '#6A6A9A',
  sub2:      '#3A3A68',
  userBg:    '#160F36',
  botBg:     '#06061A',
  thinkBg:   '#0C1828',
  thinkBord: '#1A4866',
};

type Tab = 'chat' | 'vision' | 'search' | 'create' | 'build' | 'vault';
interface Msg {
  role: 'user' | 'assistant';
  content: string;
  thinking?: string;
  image?: string;
  keyNum?: number;
  model?: string;
  toolsUsed?: string[];
  images?: string[];
  isError?: boolean;
}

// ============================================================
//  VAULT MODAL — opens on-demand for secure key entry
// ============================================================
function VaultModal({ visible, title, placeholder, onSave, onClose }: {
  visible: boolean; title: string; placeholder: string;
  onSave: (v: string) => void; onClose: () => void;
}) {
  const [val, setVal] = useState('');
  const [show, setShow] = useState(false);
  const scale = useRef(new Animated.Value(0.9)).current;
  useEffect(() => {
    if (visible) Animated.spring(scale, { toValue: 1, tension: 100, friction: 8, useNativeDriver: true }).start();
    else scale.setValue(0.9);
  }, [visible]);
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <Pressable style={VM.overlay} onPress={onClose}>
        <Animated.View style={[VM.box, { transform: [{ scale }] }]}>
          <Pressable onPress={() => {}}>
            <View style={VM.headerRow}>
              <View style={VM.lockCircle}><Ionicons name="lock-closed" size={20} color={T.accent2} /></View>
              <View>
                <Text style={VM.title}>{title}</Text>
                <Text style={VM.sub}>مشفر محلياً — لا يغادر جهازك أبداً</Text>
              </View>
            </View>
            <View style={VM.inputWrap}>
              <TextInput
                style={VM.input} value={val} onChangeText={setVal}
                placeholder={placeholder} placeholderTextColor={T.sub2}
                secureTextEntry={!show} autoCapitalize="none" autoCorrect={false}
              />
              <TouchableOpacity onPress={() => setShow(v => !v)} style={VM.eyeBtn}>
                <Ionicons name={show ? 'eye-off' : 'eye'} size={17} color={T.sub} />
              </TouchableOpacity>
            </View>
            <View style={VM.btns}>
              <TouchableOpacity style={VM.btnCancel} onPress={onClose}>
                <Text style={VM.cancelTxt}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity style={VM.btnSave} onPress={() => { if (val.trim()) { onSave(val.trim()); setVal(''); } }}>
                <Ionicons name="shield-checkmark" size={16} color="#fff" />
                <Text style={VM.saveTxt}>حفظ مشفر</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}
const VM = StyleSheet.create({
  overlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  box:       { width: W * 0.88, backgroundColor: T.card2, borderRadius: 26, padding: 24, borderWidth: 1, borderColor: T.accent + '55', shadowColor: T.accent, shadowOpacity: 0.3, shadowRadius: 20, elevation: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  lockCircle:{ width: 44, height: 44, borderRadius: 22, backgroundColor: T.accent2 + '22', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: T.accent2 + '44' },
  title:     { fontSize: 17, fontWeight: '900', color: T.text },
  sub:       { fontSize: 11, color: T.sub, marginTop: 3 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: T.bg2, borderRadius: 14, borderWidth: 1, borderColor: T.border2, marginBottom: 18 },
  input:     { flex: 1, color: T.text, fontSize: 14, paddingHorizontal: 16, paddingVertical: 14, fontFamily: Platform.OS === 'android' ? 'monospace' : 'Courier' },
  eyeBtn:    { padding: 12 },
  btns:      { flexDirection: 'row', gap: 10 },
  btnCancel: { flex: 1, paddingVertical: 13, borderRadius: 14, borderWidth: 1, borderColor: T.border2, alignItems: 'center' },
  cancelTxt: { color: T.sub, fontWeight: '700' },
  btnSave:   { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13, borderRadius: 14, backgroundColor: T.accent2, shadowColor: T.accent2, shadowOpacity: 0.4, shadowRadius: 10, elevation: 6 },
  saveTxt:   { color: '#fff', fontWeight: '900', fontSize: 14 },
});

// ============================================================
//  THINKING BLOCK — collapsible internal reasoning
// ============================================================
function ThinkingBlock({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;
  const toggle = () => {
    const toVal = open ? 0 : 1;
    Animated.timing(anim, { toValue: toVal, duration: 280, useNativeDriver: false }).start();
    setOpen(v => !v);
  };
  const maxH = anim.interpolate({ inputRange: [0,1], outputRange: [0, 350] });
  return (
    <View style={TH.wrap}>
      <TouchableOpacity style={TH.hdr} onPress={toggle} activeOpacity={0.7}>
        <View style={TH.pulse} />
        <Text style={TH.label}>💭 عملية التفكير الداخلية</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={13} color={T.accent2} />
      </TouchableOpacity>
      <Animated.View style={{ maxHeight: maxH, overflow: 'hidden' }}>
        <ScrollView style={TH.body} nestedScrollEnabled showsVerticalScrollIndicator={false}>
          <Text style={TH.txt}>{text}</Text>
        </ScrollView>
      </Animated.View>
    </View>
  );
}
const TH = StyleSheet.create({
  wrap:  { backgroundColor: T.thinkBg, borderRadius: 14, marginBottom: 8, borderWidth: 1, borderColor: T.thinkBord },
  hdr:   { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12 },
  pulse: { width: 8, height: 8, borderRadius: 4, backgroundColor: T.accent2 },
  label: { flex: 1, fontSize: 12, color: T.accent2, fontWeight: '800', letterSpacing: 0.3 },
  body:  { padding: 12, paddingTop: 0, maxHeight: 350 },
  txt:   { color: '#88BBEE', fontSize: 12, lineHeight: 20, fontFamily: Platform.OS === 'android' ? 'monospace' : 'Courier' },
});

// ============================================================
//  TOOL BADGE
// ============================================================
function ToolBadge({ name }: { name: string }) {
  const MAP: Record<string,string> = { search_web:'🌐', fetch_url:'🔗', calculate:'🔢', get_datetime:'🕐', generate_image:'🎨' };
  return (
    <View style={{ flexDirection:'row', alignItems:'center', gap:4, backgroundColor: T.accent+'22', paddingHorizontal:8, paddingVertical:3, borderRadius:8, borderWidth:1, borderColor: T.accent+'44', marginRight:5, marginBottom:4 }}>
      <Text style={{ fontSize:11 }}>{MAP[name]||'🔧'}</Text>
      <Text style={{ fontSize:10, color: T.accent, fontWeight:'700' }}>{name.replace('_',' ')}</Text>
    </View>
  );
}

// ============================================================
//  TYPING INDICATOR
// ============================================================
function TypingDot({ delay }: { delay: number }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const t = setTimeout(() => {
      Animated.loop(Animated.sequence([
        Animated.timing(a, { toValue: -8, duration: 400, useNativeDriver: true }),
        Animated.timing(a, { toValue: 0,  duration: 400, useNativeDriver: true }),
      ])).start();
    }, delay);
    return () => clearTimeout(t);
  }, []);
  return <Animated.View style={[S.dot, { transform: [{ translateY: a }] }]} />;
}

// ============================================================
//  MESSAGE BUBBLE
// ============================================================
function MsgBubble({ msg }: { msg: Msg }) {
  const [copied, setCopied] = useState(false);
  const isUser = msg.role === 'user';
  const scale = useRef(new Animated.Value(0.9)).current;
  useEffect(() => {
    Animated.spring(scale, { toValue:1, tension:90, friction:8, useNativeDriver:true }).start();
  }, []);
  const copy = () => { Clipboard.setString(msg.content); setCopied(true); setTimeout(() => setCopied(false), 1500); };
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      {msg.thinking ? <ThinkingBlock text={msg.thinking} /> : null}
      {msg.toolsUsed?.length ? (
        <View style={{ flexDirection:'row', flexWrap:'wrap', marginBottom:6 }}>
          {msg.toolsUsed.map((t,i) => <ToolBadge key={i} name={t} />)}
        </View>
      ) : null}
      <View style={[S.bubble, isUser ? S.bUser : S.bBot, msg.isError && { borderColor: T.red+'66' }]}>
        {!isUser && msg.model && msg.model !== 'system' && (
          <View style={S.botMeta}>
            <View style={[S.botDot, { backgroundColor: THINKING_MODELS.includes(msg.model||'') ? T.gold : T.accent2 }]} />
            <Text style={[S.botMetaTxt, { color: THINKING_MODELS.includes(msg.model||'') ? T.gold : T.accent2 }]}>
              {MODEL_LABELS[msg.model] || 'AI Studio'}
            </Text>
            {msg.keyNum ? <View style={S.keyBadge}><Text style={S.keyTxt}>🔑{msg.keyNum}</Text></View> : null}
          </View>
        )}
        {msg.image ? <Image source={{ uri: `data:image/jpeg;base64,${msg.image}` }} style={S.msgImg} /> : null}
        <Text style={[S.bubbleTxt, isUser && { color:'#DDD8FF' }, msg.isError && { color: T.red }]}>
          {msg.content}
        </Text>
        {msg.images?.map((prompt,i) => (
          <View key={i} style={{ marginTop:10, borderRadius:16, overflow:'hidden', borderWidth:1, borderColor: T.border2 }}>
            <Image source={{ uri: pollinationsUrl(prompt) }} style={{ width:'100%', height:220 }} resizeMode="cover" />
            <View style={{ backgroundColor:'rgba(0,0,0,0.7)', padding:8 }}>
              <Text style={{ color: T.text2, fontSize:11 }}>🎨 {prompt.slice(0,80)}</Text>
            </View>
          </View>
        ))}
        {!isUser && (
          <TouchableOpacity style={S.copyBtn} onPress={copy}>
            <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={12} color={copied ? T.accent2 : T.sub2} />
            <Text style={[S.copyTxt, copied && { color: T.accent2 }]}>{copied ? 'تم' : 'نسخ'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}

// ============================================================
//  HEADER
// ============================================================
function Header({ title, sub, right }: { title:string; sub?:string; right?: React.ReactNode }) {
  return (
    <View style={S.header}>
      <View style={{ flex:1 }}>
        <Text style={S.hTitle}>{title}</Text>
        {sub ? <Text style={S.hSub}>{sub}</Text> : null}
      </View>
      {right}
    </View>
  );
}

// ============================================================
//  NAV BAR
// ============================================================
function NavBar({ tab, setTab }: { tab:Tab; setTab:(t:Tab)=>void }) {
  const insets = useSafeAreaInsets();
  const tabs: { id:Tab; icon:string; label:string; color:string }[] = [
    { id:'chat',   icon:'chatbubble-ellipses', label:'Chat',   color: T.accent },
    { id:'vision', icon:'eye',                 label:'Vision', color: T.accent2 },
    { id:'search', icon:'globe',               label:'Search', color: T.gold },
    { id:'create', icon:'color-palette',       label:'Create', color: T.pink },
    { id:'build',  icon:'cube',                label:'Build',  color: T.teal },
    { id:'vault',  icon:'lock-closed',         label:'Vault',  color: T.sub },
  ];
  return (
    <View style={[S.nav, { paddingBottom: insets.bottom || 8 }]}>
      {tabs.map(t => {
        const active = tab === t.id;
        return (
          <TouchableOpacity key={t.id} style={S.navBtn} onPress={() => setTab(t.id)} activeOpacity={0.7}>
            {active && <View style={[S.navGlow, { backgroundColor: t.color+'28' }]} />}
            <Ionicons name={(active ? t.icon : t.icon+'-outline') as any} size={21} color={active ? t.color : T.sub2} />
            <Text style={[S.navLabel, active && { color: t.color }]}>{t.label}</Text>
            {active && <View style={[S.navDot, { backgroundColor: t.color }]} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ============================================================
//  MODEL PICKER ROW
// ============================================================
function ModelPicker({ value, onChange, visionMode=false }: { value:string; onChange:(m:string)=>void; visionMode?:boolean }) {
  const opts = visionMode
    ? [{ id: MODELS.VISION_90B, label:'👁 90B', color: T.pink },{ id: MODELS.VISION_11B, label:'⚡ 11B', color: T.pink }]
    : [
        { id: MODELS.LLAMA4_MAV,  label:'Llama4 Mav ✨', color: T.accent },
        { id: MODELS.LLAMA4_SCT,  label:'Llama4 Scout ⚡', color: T.accent },
        { id: MODELS.DEEPSEEK_R1, label:'DeepSeek R1 🤔', color: T.gold },
        { id: MODELS.QWQ_32B,     label:'QwQ 32B 🧩',    color: T.gold },
        { id: MODELS.LLAMA33_70B, label:'70B 💪',         color: T.accent2 },
        { id: MODELS.FAST,        label:'8B ⚡',           color: T.sub },
      ];
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap:6, paddingHorizontal:14, paddingVertical:8 }}>
      {opts.map(o => (
        <TouchableOpacity key={o.id} onPress={() => onChange(o.id)} activeOpacity={0.75}
          style={{ paddingHorizontal:12, paddingVertical:6, borderRadius:20, borderWidth:1,
            borderColor: value===o.id ? o.color : T.border2,
            backgroundColor: value===o.id ? o.color+'22' : T.card }}>
          <Text style={{ fontSize:11, color: value===o.id ? o.color : T.sub, fontWeight:'700' }}>{o.label}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

// ============================================================
//  CHAT TAB
// ============================================================
function ChatTab() {
  const [msgs, setMsgs] = useState<Msg[]>([{
    role:'assistant',
    content:'أهلاً بك في AI Studio v2 🚀

أنا أتصفح الإنترنت الحقيقي وأفكر بعمق.

🌐 أعطني أي رابط وسأجلب محتواه
🔍 اطلب أي بحث وسأبحث فعلياً
🤔 اختر DeepSeek-R1 لرؤية تفكيري الداخلي
🎨 قل "ولّد صورة..." وسأصنعها
🔢 اطلب أي حساب رياضي',
    model:'system',
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState(MODELS.LLAMA4_MAV);
  const [activeTool, setActiveTool] = useState('');
  const scroll = useRef<ScrollView>(null);

  const TOOL_LABELS: Record<string,string> = {
    search_web:'🌐 يبحث في الإنترنت...',
    fetch_url:'🔗 يجلب الصفحة...',
    calculate:'🔢 يحسب...',
    get_datetime:'🕐 يجلب الوقت...',
    generate_image:'🎨 يولّد صورة...',
  };

  const send = useCallback(async () => {
    if (!input.trim() || loading) return;
    const text = input.trim();
    const { key, num } = nextKey();
    const userMsg: Msg = { role:'user', content:text, keyNum:num };
    const history = [...msgs, userMsg];
    setMsgs(history); setInput(''); setLoading(true); setActiveTool('');
    const apiHistory = history.filter(m => m.model!=='system').slice(-16).map(m => ({ role:m.role, content:m.content }));
    const fallbacks = [model, MODELS.LLAMA4_SCT, MODELS.LLAMA33_70B, MODELS.FAST];
    let done = false;
    for (const tryModel of fallbacks) {
      try {
        const { answer, thinking, toolsUsed, images } = await runWithTools(
          text, apiHistory.slice(0,-1), tryModel, key, t => setActiveTool(t)
        );
        setMsgs(prev => [...prev, { role:'assistant', content:answer, thinking, keyNum:num, model:tryModel, toolsUsed, images }]);
        done = true;
        break;
      } catch {}
    }
    if (!done) setMsgs(prev => [...prev, { role:'assistant', content:'❌ فشلت جميع المحاولات. تأكد من صحة المفاتيح.', model:model, isError:true }]);
    setLoading(false); setActiveTool('');
    setTimeout(() => scroll.current?.scrollToEnd({ animated:true }), 150);
  }, [input, loading, msgs, model]);

  return (
    <KeyboardAvoidingView style={{ flex:1 }} behavior={Platform.OS==='ios' ? 'padding' : undefined}>
      <SafeAreaView style={{ flex:1 }} edges={['top']}>
        <Header title="🧠 AI Studio v2" sub="تصفح الإنترنت · تفكير عميق · أدوات" />
        <ModelPicker value={model} onChange={setModel} />
        <ScrollView ref={scroll} style={{ flex:1 }} contentContainerStyle={{ padding:12 }} showsVerticalScrollIndicator={false}>
          {msgs.map((m,i) => <MsgBubble key={i} msg={m} />)}
          {loading && (
            <View style={[S.bubble, S.bBot]}>
              {activeTool
                ? <View style={{ flexDirection:'row', alignItems:'center', gap:8 }}><ActivityIndicator size="small" color={T.accent2} /><Text style={{ color:T.accent2, fontSize:12 }}>{TOOL_LABELS[activeTool]||'⚙️ يعمل...'}</Text></View>
                : <View style={{ flexDirection:'row', gap:6, padding:2 }}><TypingDot delay={0} /><TypingDot delay={160} /><TypingDot delay={320} /></View>}
            </View>
          )}
        </ScrollView>
        <View style={S.inputBar}>
          <TextInput style={S.input} placeholder="اكتب رسالتك أو أعطني رابطاً..."
            placeholderTextColor={T.sub2} value={input} onChangeText={setInput}
            multiline returnKeyType="send" onSubmitEditing={send} />
          <TouchableOpacity style={[S.sendBtn, (!input.trim()||loading) && { opacity:0.35 }]}
            onPress={send} disabled={!input.trim()||loading}>
            <Ionicons name="send" size={17} color="#fff" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

// ============================================================
//  VISION TAB
// ============================================================
function VisionTab() {
  const [image, setImage] = useState<string|null>(null);
  const [prompt, setPrompt] = useState('حلّل هذه الصورة بعمق كامل خطوة بخطوة');
  const [result, setResult] = useState('');
  const [thinking, setThinking] = useState('');
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState(MODELS.VISION_90B);

  const pick = async (cam=false) => {
    const p = cam ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!p.granted) { Alert.alert('إذن مطلوب'); return; }
    const r = cam
      ? await ImagePicker.launchCameraAsync({ base64:true, quality:0.9 })
      : await ImagePicker.launchImageLibraryAsync({ base64:true, quality:0.9, allowsEditing:true });
    if (!r.canceled && r.assets[0].base64) setImage(r.assets[0].base64);
  };

  const analyze = async () => {
    if (!image) { Alert.alert('اختر صورة أولاً'); return; }
    const { key } = nextKey();
    setLoading(true); setResult(''); setThinking('');
    const sys = `أنت خبير رؤية بصرية متخصص بالتحليل العميق.
قم بتحليل الصورة بالخطوات:
1. وصف دقيق لكل ما تراه
2. تحليل الألوان والتكوين البصري
3. استخراج كل النصوص المرئية
4. تفسير المعنى والسياق
5. ملاحظات احترافية وخلاصة`;
    for (const m of [model, MODELS.VISION_11B]) {
      try {
        const raw = await callGroq([
          { role:'system', content:sys },
          { role:'user', content:[
            { type:'text', text:prompt },
            { type:'image_url', image_url:{ url:`data:image/jpeg;base64,${image}` } },
          ]},
        ], m, key, 6000);
        const { thinking:th, answer } = parseThinking(raw);
        setThinking(th); setResult(answer); break;
      } catch (e:any) { if (m === MODELS.VISION_11B) setResult(`❌ ${e.message}`); }
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={{ flex:1 }} edges={['top']}>
      <Header title="👁 الرؤية البصرية" sub="Llama Vision 90B — تحليل عميق" />
      <ScrollView style={{ flex:1 }} contentContainerStyle={{ padding:16 }} showsVerticalScrollIndicator={false}>
        <View style={S.imgBox}>
          {image
            ? <Image source={{ uri:`data:image/jpeg;base64,${image}` }} style={{ width:'100%', height:260, resizeMode:'cover' }} />
            : <View style={{ alignItems:'center', justifyContent:'center', height:200 }}>
                <Ionicons name="eye-outline" size={58} color={T.sub2} />
                <Text style={{ color:T.sub, marginTop:12, fontSize:14 }}>اختر صورة للتحليل البصري العميق</Text>
              </View>}
        </View>
        <View style={{ flexDirection:'row', gap:10, marginBottom:14 }}>
          <TouchableOpacity style={[S.actionBtn, { flex:1, borderColor:T.accent }]} onPress={() => pick(false)}>
            <Ionicons name="images" size={18} color={T.accent} />
            <Text style={[S.actionTxt, { color:T.accent }]}>معرض</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[S.actionBtn, { flex:1, borderColor:T.accent2 }]} onPress={() => pick(true)}>
            <Ionicons name="camera" size={18} color={T.accent2} />
            <Text style={[S.actionTxt, { color:T.accent2 }]}>كاميرا</Text>
          </TouchableOpacity>
        </View>
        <ModelPicker value={model} onChange={setModel} visionMode />
        <TextInput style={[S.input, { borderRadius:14, paddingHorizontal:14, marginBottom:12, minHeight:48 }]}
          value={prompt} onChangeText={setPrompt} placeholder="سؤالك عن الصورة..." placeholderTextColor={T.sub2} multiline />
        <TouchableOpacity style={[S.bigBtn, { opacity: loading||!image ? 0.45 : 1 }]} onPress={analyze} disabled={loading||!image}>
          {loading ? <><ActivityIndicator size="small" color="#fff" /><Text style={S.bigBtnTxt}>يحلل بعمق...</Text></>
                   : <><Ionicons name="scan" size={19} color="#fff" /><Text style={S.bigBtnTxt}>تحليل بصري عميق</Text></>}
        </TouchableOpacity>
        {thinking ? <ThinkingBlock text={thinking} /> : null}
        {result ? <View style={[S.resultCard, { marginTop:14 }]}><Text style={S.resultTxt}>{result}</Text></View> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================================
//  SEARCH TAB — real internet, fetch any URL
// ============================================================
function SearchTab() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState('');
  const [thinking, setThinking] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'search'|'browse'>('search');

  const run = async () => {
    const target = (mode==='search' ? query : query).trim();
    if (!target) return;
    const { key } = nextKey();
    setLoading(true); setResult(''); setThinking('');
    try {
      const raw = mode==='search' ? await searchWeb(target) : await fetchWebPage(target);
      const sys = mode==='search'
        ? 'أنت محلل معلومات خبير. لخّص نتائج البحث الحقيقية هذه واستخرج أهم المعلومات بعمق وتفصيل.'
        : 'أنت محلل محتوى خبير. لخّص محتوى الصفحة واستخرج أهم المعلومات بشكل منظم ومفيد.';
      const fullRaw = await callGroq([
        { role:'system', content:sys },
        { role:'user', content:`${mode==='search' ? `بحث: "${target}"
` : `صفحة: ${target}
`}${raw}` },
      ], MODELS.LLAMA4_MAV, key, 6000);
      const { thinking:th, answer } = parseThinking(fullRaw);
      setThinking(th); setResult(answer);
    } catch (e:any) { setResult(`❌ ${e.message}`); }
    setLoading(false);
  };

  return (
    <SafeAreaView style={{ flex:1 }} edges={['top']}>
      <Header title="🌐 الإنترنت الحقيقي" sub="بحث + تصفح مباشر بدون قيود" />
      <ScrollView style={{ flex:1 }} contentContainerStyle={{ padding:16 }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection:'row', gap:8, marginBottom:14 }}>
          {(['search','browse'] as const).map(m => (
            <TouchableOpacity key={m} onPress={() => setMode(m)} activeOpacity={0.75}
              style={{ flex:1, paddingVertical:10, borderRadius:14, borderWidth:1, alignItems:'center',
                borderColor: mode===m ? T.gold : T.border2, backgroundColor: mode===m ? T.gold+'22' : T.card }}>
              <Text style={{ color: mode===m ? T.gold : T.sub, fontWeight:'700', fontSize:13 }}>
                {m==='search' ? '🔍 بحث ويب' : '🔗 فتح رابط'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput style={[S.input, { borderRadius:16, paddingHorizontal:16, marginBottom:12, height:50 }]}
          value={query} onChangeText={setQuery}
          placeholder={mode==='search' ? 'ابحث عن أي شيء...' : 'https://...'}
          placeholderTextColor={T.sub2} returnKeyType="search" onSubmitEditing={run}
          autoCapitalize="none" autoCorrect={false} />
        <TouchableOpacity style={[S.bigBtn, { backgroundColor: T.gold+'CC', shadowColor: T.gold, opacity: loading ? 0.45 : 1 }]}
          onPress={run} disabled={loading}>
          {loading
            ? <><ActivityIndicator size="small" color="#fff" /><Text style={S.bigBtnTxt}>يجلب من الإنترنت...</Text></>
            : <><Ionicons name={mode==='search' ? 'search' : 'globe'} size={18} color="#fff" /><Text style={S.bigBtnTxt}>{mode==='search' ? 'ابحث الآن' : 'افتح الصفحة'}</Text></>}
        </TouchableOpacity>
        {thinking ? <ThinkingBlock text={thinking} /> : null}
        {result ? (
          <View style={[S.resultCard, { marginTop:14 }]}>
            <Text style={{ color:T.gold, fontWeight:'800', fontSize:13, marginBottom:10 }}>
              {mode==='search' ? `🔍 ${query}` : `🔗 ${query.slice(0,50)}`}
            </Text>
            <Text style={S.resultTxt}>{result}</Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================================
//  CREATE TAB — image generation + video storyboard
// ============================================================
function CreateTab() {
  const [mode, setMode] = useState<'image'|'video'>('image');
  const [prompt, setPrompt] = useState('');
  const [imgUrl, setImgUrl] = useState('');
  const [storyboard, setStoryboard] = useState('');
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    if (mode==='image') {
      setImgUrl(''); 
      await new Promise(r => setTimeout(r, 100));
      setImgUrl(pollinationsUrl(prompt));
      setLoading(false);
    } else {
      setStoryboard('');
      const { key } = nextKey();
      try {
        const res = await callGroq([
          { role:'system', content:`أنت مخرج أفلام وكاتب سيناريو احترافي.
اكتب Storyboard كامل للفيديو يحتوي على:
- 6 إلى 8 مشاهد مفصلة
- لكل مشهد: الرقم، الوصف البصري الدقيق، الحوار أو النص، المؤثرات الصوتية، المدة
- الانتقالات بين المشاهد
- الموسيقى والأجواء الصوتية
- ملاحظات الإخراج
اكتبه بأسلوب هوليوودي احترافي.` },
          { role:'user', content:`اكتب storyboard لفيديو عن: ${prompt}` },
        ], MODELS.LLAMA4_MAV, key, 4000);
        setStoryboard(res);
      } catch (e:any) { setStoryboard(`❌ ${e.message}`); }
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex:1 }} edges={['top']}>
      <Header title="🎨 الإبداع الرقمي" sub="توليد صور مجاناً · سيناريو فيديو" />
      <ScrollView style={{ flex:1 }} contentContainerStyle={{ padding:16 }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection:'row', gap:8, marginBottom:16 }}>
          {(['image','video'] as const).map(m => (
            <TouchableOpacity key={m} onPress={() => setMode(m)} activeOpacity={0.75}
              style={{ flex:1, paddingVertical:10, borderRadius:14, borderWidth:1, alignItems:'center',
                borderColor: mode===m ? T.pink : T.border2, backgroundColor: mode===m ? T.pink+'22' : T.card }}>
              <Text style={{ color: mode===m ? T.pink : T.sub, fontWeight:'700', fontSize:13 }}>
                {m==='image' ? '🖼 توليد صورة' : '🎬 سيناريو فيديو'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput
          style={[S.input, { borderRadius:16, paddingHorizontal:16, marginBottom:12, minHeight:90, textAlignVertical:'top', paddingTop:14 }]}
          value={prompt} onChangeText={setPrompt}
          placeholder={mode==='image' ? 'صف الصورة التي تريدها...' : 'صف الفيديو الذي تريد صنعه...'}
          placeholderTextColor={T.sub2} multiline />
        <TouchableOpacity style={[S.bigBtn, { backgroundColor: T.pink+'CC', shadowColor: T.pink, opacity: loading ? 0.45 : 1 }]}
          onPress={generate} disabled={loading}>
          {loading
            ? <><ActivityIndicator size="small" color="#fff" /><Text style={S.bigBtnTxt}>{mode==='image' ? 'يولّد الصورة...' : 'يكتب السيناريو...'}</Text></>
            : <><Ionicons name={mode==='image' ? 'sparkles' : 'film'} size={18} color="#fff" /><Text style={S.bigBtnTxt}>{mode==='image' ? 'ولّد الصورة مجاناً' : 'اصنع السيناريو'}</Text></>}
        </TouchableOpacity>
        {mode==='image' && imgUrl ? (
          <View style={{ marginTop:16, borderRadius:22, overflow:'hidden', borderWidth:1, borderColor: T.border2, shadowColor: T.pink, shadowOpacity:0.3, shadowRadius:15, elevation:8 }}>
            <Image source={{ uri:imgUrl }} style={{ width:'100%', height:320 }} resizeMode="cover" />
            <View style={{ backgroundColor: T.card, padding:12 }}>
              <Text style={{ color: T.sub, fontSize:10 }}>✅ مولّدة بـ Pollinations AI — مجاناً بالكامل</Text>
              <Text style={{ color: T.text2, fontSize:12, marginTop:4 }}>{prompt}</Text>
            </View>
          </View>
        ) : null}
        {mode==='video' && storyboard ? (
          <View style={[S.resultCard, { marginTop:14 }]}>
            <Text style={{ color:T.pink, fontWeight:'800', fontSize:14, marginBottom:10 }}>🎬 السيناريو المرئي</Text>
            <Text style={S.resultTxt}>{storyboard}</Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================================
//  BUILD TAB — full Android app builder + GitHub publish
// ============================================================
function BuildTab() {
  const [desc, setDesc] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [repoName, setRepoName] = useState('');
  const [pushing, setPushing] = useState(false);
  const [pushResult, setPushResult] = useState('');
  const [copied, setCopied] = useState(false);
  const [githubToken, setGithubToken] = useState('');
  const [vaultVisible, setVaultVisible] = useState(false);

  useEffect(() => { vaultLoad(SK_GITHUB).then(t => setGithubToken(t)); }, []);

  const buildApp = async () => {
    if (!desc.trim()) return;
    const { key } = nextKey();
    setLoading(true); setCode(''); setPushResult('');
    const fallbacks = [MODELS.LLAMA4_MAV, MODELS.LLAMA33_70B];
    for (const m of fallbacks) {
      try {
        const res = await callGroq([
          { role:'system', content:`أنت مهندس React Native / Expo خبير عالمي.
اكتب تطبيق Android كامل وجاهز للنشر.
المتطلبات:
- App.tsx كامل مع كل المكونات والأنماط
- واجهة احترافية جميلة ومتجاوبة
- TypeScript صارم بدون أخطاء
- يعمل مباشرة بعد npm install
- أضف تعليقات توضيحية مفيدة
اكتب الكود الكامل فقط بدون مقدمات.` },
          { role:'user', content:`ابنِ تطبيق Android كامل: ${desc}` },
        ], m, key, 8192);
        setCode(res); break;
      } catch {}
    }
    if (!code) setCode('❌ فشل توليد الكود. حاول مرة أخرى.');
    setLoading(false);
  };

  const pushToGithub = async () => {
    if (!code.trim() || !repoName.trim()) { Alert.alert('تنبيه', 'تأكد من وجود الكود واسم المستودع'); return; }
    if (!githubToken) { setVaultVisible(true); return; }
    setPushing(true); setPushResult('');
    try {
      await fetch('https://api.github.com/user/repos', {
        method:'POST',
        headers:{ Authorization:`token ${githubToken}`, 'Content-Type':'application/json' },
        body: JSON.stringify({ name:repoName.trim(), description:desc, private:false, auto_init:true }),
      });
      const uRes = await fetch('https://api.github.com/user', { headers:{ Authorization:`token ${githubToken}` } });
      const { login } = await uRes.json();
      await new Promise(r => setTimeout(r, 1500));
      const content = btoa(unescape(encodeURIComponent(code)));
      const putRes = await fetch(`https://api.github.com/repos/${login}/${repoName}/contents/App.tsx`, {
        method:'PUT',
        headers:{ Authorization:`token ${githubToken}`, 'Content-Type':'application/json' },
        body: JSON.stringify({ message:`🤖 Built by AI Studio: ${desc.slice(0,50)}`, content }),
      });
      if (putRes.status === 422) {
        const { sha } = await (await fetch(`https://api.github.com/repos/${login}/${repoName}/contents/App.tsx`, { headers:{ Authorization:`token ${githubToken}` } })).json();
        await fetch(`https://api.github.com/repos/${login}/${repoName}/contents/App.tsx`, {
          method:'PUT',
          headers:{ Authorization:`token ${githubToken}`, 'Content-Type':'application/json' },
          body: JSON.stringify({ message:`🤖 Built by AI Studio: ${desc.slice(0,50)}`, content, sha }),
        });
      }
      setPushResult(`✅ تم النشر على GitHub!
https://github.com/${login}/${repoName}`);
    } catch (e:any) { setPushResult(`❌ ${e.message}`); }
    setPushing(false);
  };

  const copyCode = () => { Clipboard.setString(code); setCopied(true); setTimeout(() => setCopied(false), 1500); };

  return (
    <SafeAreaView style={{ flex:1 }} edges={['top']}>
      <Header title="🔧 صانع التطبيقات" sub="Android كامل + نشر GitHub" />
      <ScrollView style={{ flex:1 }} contentContainerStyle={{ padding:16 }} showsVerticalScrollIndicator={false}>
        <TextInput style={[S.input, { borderRadius:16, paddingHorizontal:16, marginBottom:12, minHeight:110, textAlignVertical:'top', paddingTop:14 }]}
          value={desc} onChangeText={setDesc}
          placeholder="صف التطبيق الذي تريد بناءه بالتفصيل الكامل..."
          placeholderTextColor={T.sub2} multiline />
        <TouchableOpacity style={[S.bigBtn, { backgroundColor: T.teal+'CC', shadowColor: T.teal, opacity: loading ? 0.45 : 1 }]}
          onPress={buildApp} disabled={loading}>
          {loading ? <><ActivityIndicator size="small" color="#fff" /><Text style={S.bigBtnTxt}>يبني التطبيق...</Text></>
                   : <><Ionicons name="hammer" size={19} color="#fff" /><Text style={S.bigBtnTxt}>ابنِ التطبيق بالذكاء الاصطناعي</Text></>}
        </TouchableOpacity>
        {code ? (
          <>
            <View style={[S.resultCard, { marginTop:14, maxHeight:300 }]}>
              <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:10 }}>
                <Text style={{ color: T.teal, fontWeight:'800', fontSize:13 }}>📱 الكود المولّد</Text>
                <TouchableOpacity onPress={copyCode} style={{ flexDirection:'row', alignItems:'center', gap:5 }}>
                  <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={14} color={copied ? T.accent2 : T.sub} />
                  <Text style={{ color: copied ? T.accent2 : T.sub, fontSize:12 }}>{copied ? 'تم' : 'نسخ'}</Text>
                </TouchableOpacity>
              </View>
              <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
                <Text style={{ color:'#A8D8B8', fontSize:11, fontFamily: Platform.OS==='android' ? 'monospace' : 'Courier', lineHeight:18 }}>{code}</Text>
              </ScrollView>
            </View>
            <View style={{ marginTop:16, backgroundColor: T.card, borderRadius:20, padding:16, borderWidth:1, borderColor: T.border2 }}>
              <Text style={{ color: T.text, fontWeight:'800', fontSize:14, marginBottom:12 }}>🚀 نشر على GitHub</Text>
              <TextInput style={[S.input, { borderRadius:12, paddingHorizontal:14, marginBottom:10, height:48 }]}
                value={repoName} onChangeText={setRepoName}
                placeholder="اسم المستودع (بدون مسافات)"
                placeholderTextColor={T.sub2} autoCapitalize="none" autoCorrect={false} />
              {!githubToken ? (
                <TouchableOpacity onPress={() => setVaultVisible(true)}
                  style={{ flexDirection:'row', alignItems:'center', gap:8, paddingVertical:11, paddingHorizontal:14, backgroundColor: T.accent+'22', borderRadius:12, borderWidth:1, borderColor: T.accent+'44', marginBottom:10 }}>
                  <Ionicons name="lock-closed" size={15} color={T.accent2} />
                  <Text style={{ color: T.accent2, fontSize:13, fontWeight:'700' }}>أضف GitHub Token مشفر</Text>
                </TouchableOpacity>
              ) : (
                <View style={{ flexDirection:'row', alignItems:'center', gap:8, marginBottom:10 }}>
                  <Ionicons name="shield-checkmark" size={15} color={T.accent2} />
                  <Text style={{ color: T.accent2, fontSize:12, flex:1 }}>GitHub Token محمي ✅</Text>
                  <TouchableOpacity onPress={() => setVaultVisible(true)}>
                    <Text style={{ color: T.sub, fontSize:11, textDecorationLine:'underline' }}>تغيير</Text>
                  </TouchableOpacity>
                </View>
              )}
              <TouchableOpacity style={[S.bigBtn, { opacity: pushing ? 0.45 : 1 }]}
                onPress={pushToGithub} disabled={pushing}>
                {pushing ? <><ActivityIndicator size="small" color="#fff" /><Text style={S.bigBtnTxt}>يرفع...</Text></>
                         : <><Ionicons name="logo-github" size={18} color="#fff" /><Text style={S.bigBtnTxt}>انشر على GitHub</Text></>}
              </TouchableOpacity>
              {pushResult ? (
                <View style={{ marginTop:12, padding:12, borderRadius:12, backgroundColor: pushResult.startsWith('✅') ? T.accent2+'22' : T.red+'22' }}>
                  <Text style={{ color: pushResult.startsWith('✅') ? T.accent2 : T.red, fontSize:13 }}>{pushResult}</Text>
                </View>
              ) : null}
            </View>
          </>
        ) : null}
      </ScrollView>
      <VaultModal visible={vaultVisible} title="GitHub Token" placeholder="ghp_xxxxxxxxxxxxxxxx"
        onSave={async v => { await vaultSave(SK_GITHUB, v); setGithubToken(v); setVaultVisible(false); }}
        onClose={() => setVaultVisible(false)} />
    </SafeAreaView>
  );
}

// ============================================================
//  VAULT TAB — manage all encrypted keys
// ============================================================
function VaultTab() {
  const [extras, setExtras] = useState<string[]>([]);
  const [github, setGithub] = useState('');
  const [groqVisible, setGroqVisible] = useState(false);
  const [ghVisible, setGhVisible] = useState(false);

  useEffect(() => {
    loadExtraKeys().then(() => setExtras([..._extraKeys]));
    vaultLoad(SK_GITHUB).then(setGithub);
  }, []);

  const removeKey = async (k: string) => { await removeExtraKey(k); setExtras(prev => prev.filter(x => x !== k)); };
  const total = BUILTIN_KEYS.length + extras.length;

  return (
    <SafeAreaView style={{ flex:1 }} edges={['top']}>
      <Header title="🔐 خزنة المفاتيح" sub="تشفير محلي — لا يغادر جهازك" />
      <ScrollView style={{ flex:1 }} contentContainerStyle={{ padding:16 }} showsVerticalScrollIndicator={false}>

        <View style={[S.card, { marginBottom:14 }]}>
          <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <Text style={{ color: T.text, fontWeight:'900', fontSize:15 }}>🔑 مفاتيح Groq</Text>
            <View style={{ backgroundColor: T.accent+'33', paddingHorizontal:12, paddingVertical:4, borderRadius:12 }}>
              <Text style={{ color: T.accent, fontWeight:'900', fontSize:13 }}>{total} مفتاح</Text>
            </View>
          </View>
          <View style={{ flexDirection:'row', flexWrap:'wrap', gap:8, marginBottom:14 }}>
            {Array.from({ length: BUILTIN_KEYS.length }, (_,i) => (
              <View key={i} style={{ paddingHorizontal:12, paddingVertical:6, backgroundColor: T.accent+'22', borderRadius:12, borderWidth:1, borderColor: T.accent+'44' }}>
                <Text style={{ color: T.accent, fontSize:12, fontWeight:'700' }}>🔑 {i+1}</Text>
              </View>
            ))}
            {extras.map((k,i) => (
              <View key={i} style={{ flexDirection:'row', alignItems:'center', gap:5, paddingHorizontal:10, paddingVertical:6, backgroundColor: T.accent2+'22', borderRadius:12, borderWidth:1, borderColor: T.accent2+'44' }}>
                <Text style={{ color: T.accent2, fontSize:12, fontWeight:'700' }}>🔑+ {BUILTIN_KEYS.length+i+1}</Text>
                <TouchableOpacity onPress={() => removeKey(k)}>
                  <Ionicons name="close-circle" size={15} color={T.red+'BB'} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
          <TouchableOpacity onPress={() => setGroqVisible(true)} activeOpacity={0.8}
            style={{ flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8, paddingVertical:13, borderRadius:14, backgroundColor: T.accent2+'22', borderWidth:1, borderColor: T.accent2+'44' }}>
            <Ionicons name="add-circle" size={18} color={T.accent2} />
            <Text style={{ color: T.accent2, fontWeight:'800', fontSize:14 }}>أضف مفتاح Groq جديد</Text>
          </TouchableOpacity>
        </View>

        <View style={[S.card, { marginBottom:14 }]}>
          <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
            <Text style={{ color: T.text, fontWeight:'900', fontSize:15 }}>
              <Ionicons name="logo-github" size={15} color={T.text} />{"  "}GitHub Token
            </Text>
            <Ionicons name={github ? 'shield-checkmark' : 'warning'} size={18} color={github ? T.accent2 : T.gold} />
          </View>
          <Text style={{ color: T.sub, fontSize:12, marginBottom:12, lineHeight:18 }}>
            {github ? '✅ محفوظ ومشفر — يُستخدم لنشر التطبيقات على GitHub' : '⚠️ غير مُضاف — مطلوب لنشر التطبيقات على GitHub'}
          </Text>
          <TouchableOpacity onPress={() => setGhVisible(true)} activeOpacity={0.8}
            style={{ flexDirection:'row', alignItems:'center', justifyContent:'center', gap:8, paddingVertical:12, borderRadius:14, backgroundColor: T.card2, borderWidth:1, borderColor: T.border2 }}>
            <Ionicons name={github ? 'create' : 'add-circle'} size={16} color={github ? T.sub : T.accent2} />
            <Text style={{ color: github ? T.sub : T.accent2, fontWeight:'700', fontSize:13 }}>
              {github ? 'تحديث GitHub Token' : 'إضافة GitHub Token'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[S.card]}>
          <Text style={{ color: T.text, fontWeight:'900', fontSize:15, marginBottom:14 }}>🤖 النماذج المتاحة</Text>
          {[
            { name:'Llama 4 Maverick ✨', cap:'أحدث نموذج من Meta — متعدد الأغراض', color: T.accent, badge:'NEW' },
            { name:'Llama 4 Scout ⚡',    cap:'سريع ودقيق من Meta',                color: T.accent, badge:'NEW' },
            { name:'DeepSeek R1 🤔',      cap:'تفكير عميق خطوة بخطوة مع chain-of-thought', color: T.gold, badge:'THINK' },
            { name:'QwQ 32B 🧩',          cap:'استدلال متقدم ومنطق رياضي معمق',    color: T.gold, badge:'THINK' },
            { name:'Llama 3.3 70B 💪',    cap:'قوي ومتوازن — ممتاز للكود والتحليل', color: T.accent2, badge:null },
            { name:'Vision 90B 👁',       cap:'أقوى نموذج رؤية بصرية في العالم',   color: T.pink, badge:'VISION' },
            { name:'Vision 11B ⚡',       cap:'رؤية بصرية سريعة وخفيفة',           color: T.pink, badge:'VISION' },
            { name:'Llama 3.1 8B ⚡',     cap:'فائق السرعة — استجابة فورية',       color: T.sub, badge:'FAST' },
          ].map((m,i) => (
            <View key={i} style={{ flexDirection:'row', alignItems:'center', paddingVertical:10, borderTopWidth:i>0?1:0, borderTopColor:T.border }}>
              <View style={{ flex:1 }}>
                <Text style={{ color:m.color, fontWeight:'700', fontSize:13 }}>{m.name}</Text>
                <Text style={{ color:T.sub, fontSize:11, marginTop:2 }}>{m.cap}</Text>
              </View>
              {m.badge && <View style={{ paddingHorizontal:8, paddingVertical:3, borderRadius:8, backgroundColor:m.color+'22' }}><Text style={{ color:m.color, fontSize:9, fontWeight:'900' }}>{m.badge}</Text></View>}
              <View style={{ width:8, height:8, borderRadius:4, backgroundColor:m.color, marginLeft:10 }} />
            </View>
          ))}
        </View>
      </ScrollView>
      <VaultModal visible={groqVisible} title="مفتاح Groq API" placeholder="gsk_xxxxxxxxxxxxxxxxxxxx"
        onSave={async v => { await saveExtraKey(v); setExtras([..._extraKeys]); setGroqVisible(false); }}
        onClose={() => setGroqVisible(false)} />
      <VaultModal visible={ghVisible} title="GitHub Personal Token" placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
        onSave={async v => { await vaultSave(SK_GITHUB, v); setGithub(v); setGhVisible(false); }}
        onClose={() => setGhVisible(false)} />
    </SafeAreaView>
  );
}

// ============================================================
//  ROOT APP
// ============================================================
export default function App() {
  const [tab, setTab] = useState<Tab>('chat');
  const gl1 = useRef(new Animated.Value(0)).current;
  const gl2 = useRef(new Animated.Value(0)).current;
  const gl3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadExtraKeys();
    const loop = (v: Animated.Value, dur: number, delay: number) => {
      setTimeout(() => {
        Animated.loop(Animated.sequence([
          Animated.timing(v, { toValue:1, duration:dur, useNativeDriver:false }),
          Animated.timing(v, { toValue:0, duration:dur, useNativeDriver:false }),
        ])).start();
      }, delay);
    };
    loop(gl1, 3200, 0);
    loop(gl2, 2800, 500);
    loop(gl3, 3600, 1000);
  }, []);

  const op1 = gl1.interpolate({ inputRange:[0,1], outputRange:[0.05, 0.16] });
  const op2 = gl2.interpolate({ inputRange:[0,1], outputRange:[0.04, 0.13] });
  const op3 = gl3.interpolate({ inputRange:[0,1], outputRange:[0.03, 0.10] });

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor={T.bg} />
      <View style={{ flex:1, backgroundColor: T.bg }}>
        <Animated.View style={{ position:'absolute', width:W*0.9, height:W*0.9, borderRadius:W*0.45, top:-W*0.38, left:-W*0.28, backgroundColor:'#6C3FFF', opacity:op1 }} />
        <Animated.View style={{ position:'absolute', width:W*0.75, height:W*0.75, borderRadius:W*0.375, bottom:-W*0.28, right:-W*0.22, backgroundColor:'#00C8A0', opacity:op2 }} />
        <Animated.View style={{ position:'absolute', width:W*0.5, height:W*0.5, borderRadius:W*0.25, top:H*0.42, left:W*0.28, backgroundColor:'#FF6B9D', opacity:op3 }} />
        {tab==='chat'   && <ChatTab />}
        {tab==='vision' && <VisionTab />}
        {tab==='search' && <SearchTab />}
        {tab==='create' && <CreateTab />}
        {tab==='build'  && <BuildTab />}
        {tab==='vault'  && <VaultTab />}
        <NavBar tab={tab} setTab={setTab} />
      </View>
    </SafeAreaProvider>
  );
}

// ============================================================
//  STYLES — NEBULA ULTRA
// ============================================================
const S = StyleSheet.create({
  dot:      { width:9, height:9, borderRadius:4.5, backgroundColor: T.accent },
  header:   { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:18, paddingVertical:13, borderBottomWidth:1, borderBottomColor: T.border, backgroundColor:'rgba(6,6,26,0.94)' },
  hTitle:   { fontSize:19, fontWeight:'900', color: T.text, letterSpacing:0.2 },
  hSub:     { fontSize:11, color: T.sub, marginTop:2 },
  nav:      { flexDirection:'row', backgroundColor:'rgba(8,8,26,0.97)', borderTopWidth:1, borderTopColor: T.border },
  navBtn:   { flex:1, alignItems:'center', paddingTop:9, position:'relative' },
  navGlow:  { position:'absolute', top:0, left:3, right:3, bottom:0, borderRadius:10 },
  navLabel: { fontSize:9, color: T.sub2, marginTop:2, marginBottom:3, fontWeight:'700' },
  navDot:   { width:4, height:4, borderRadius:2, marginTop:1 },
  bubble:   { borderRadius:20, padding:14, marginVertical:5, maxWidth:'91%' },
  bUser:    { backgroundColor: T.userBg, alignSelf:'flex-end', borderBottomRightRadius:4, borderWidth:1, borderColor: T.accent+'55', shadowColor: T.accent, shadowOpacity:0.25, shadowRadius:10, shadowOffset:{ width:0, height:3 }, elevation:5 },
  bBot:     { backgroundColor: T.botBg, alignSelf:'flex-start', borderBottomLeftRadius:4, borderWidth:1, borderColor: T.border2 },
  botMeta:  { flexDirection:'row', alignItems:'center', marginBottom:8, gap:6 },
  botDot:   { width:7, height:7, borderRadius:3.5 },
  botMetaTxt:{ fontSize:10, fontWeight:'900', letterSpacing:0.4 },
  keyBadge: { backgroundColor: T.accent+'22', borderRadius:8, paddingHorizontal:7, paddingVertical:2, borderWidth:1, borderColor: T.accent+'44' },
  keyTxt:   { fontSize:9, color: T.accent, fontWeight:'700' },
  bubbleTxt:{ color: T.text, fontSize:15, lineHeight:24 },
  msgImg:   { width:'100%', height:200, borderRadius:12, marginBottom:10, resizeMode:'cover' },
  copyBtn:  { flexDirection:'row', alignItems:'center', marginTop:8, gap:5, alignSelf:'flex-end' },
  copyTxt:  { fontSize:11, color: T.sub2 },
  inputBar: { flexDirection:'row', alignItems:'flex-end', paddingHorizontal:12, paddingVertical:10, borderTopWidth:1, borderTopColor: T.border, backgroundColor:'rgba(6,6,26,0.97)' },
  input:    { flex:1, backgroundColor: T.card2, color: T.text, borderRadius:16, paddingHorizontal:15, paddingVertical:12, fontSize:15, borderWidth:1, borderColor: T.border2, maxHeight:140, lineHeight:22 },
  sendBtn:  { width:48, height:48, borderRadius:24, backgroundColor: T.accent, alignItems:'center', justifyContent:'center', marginLeft:10, shadowColor: T.accent, shadowOpacity:0.55, shadowRadius:12, shadowOffset:{ width:0, height:3 }, elevation:8 },
  imgBox:   { backgroundColor: T.card, borderRadius:22, overflow:'hidden', marginBottom:14, minHeight:200, borderWidth:1, borderColor: T.border2 },
  actionBtn:{ flex:1, flexDirection:'row', alignItems:'center', justifyContent:'center', borderRadius:14, paddingVertical:12, gap:7, borderWidth:1 },
  actionTxt:{ fontWeight:'700', fontSize:14 },
  bigBtn:   { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:10, backgroundColor: T.accent, borderRadius:18, paddingVertical:15, shadowColor: T.accent, shadowOpacity:0.45, shadowRadius:14, shadowOffset:{ width:0, height:4 }, elevation:8, marginBottom:4 },
  bigBtnTxt:{ color:'#fff', fontWeight:'900', fontSize:15, letterSpacing:0.2 },
  resultCard:{ backgroundColor: T.card, borderRadius:20, padding:16, borderWidth:1, borderColor: T.border2 },
  resultTxt:{ color: T.text2, fontSize:14, lineHeight:24 },
  card:     { backgroundColor: T.card, borderRadius:20, padding:16, borderWidth:1, borderColor: T.border2 },
});
