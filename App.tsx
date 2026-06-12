import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
  import {
    StyleSheet,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Image,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    Dimensions,
    Animated,
    StatusBar,
    Alert,
    Modal,
    FlatList,
    Pressable,
    Linking,
    Share,
  } from 'react-native';
  import { LinearGradient } from 'expo-linear-gradient';
  import * as ImagePicker from 'expo-image-picker';
  import * as SecureStore from 'expo-secure-store';
  import { Ionicons, MaterialCommunityIcons, FontAwesome5, Feather } from '@expo/vector-icons';
  import { BlurView } from 'expo-blur';

  const { width, height } = Dimensions.get('window');

  /**
   * NEBULA STUDIO PRO - ULTIMATE AI WORKSPACE
   * Designed for High-Performance Autonomous Operations
   */

  // --- CONSTANTS ---
  const THEME = {
    background: '#050508',
    card: 'rgba(255, 255, 255, 0.04)',
    cardBorder: 'rgba(255, 255, 255, 0.08)',
    primary: '#7c3aed',
    primaryGlow: '#4f46e5',
    secondary: '#0ea5e9',
    secondaryGlow: '#06b6d4',
    accent: '#14b8a6',
    text: '#ffffff',
    textSecondary: '#94a3b8',
    error: '#ef4444',
    success: '#22c55e',
  };

  const MODELS = [
    { id: 'meta-llama/llama-4-maverick-17b-128e-instruct', name: 'Llama 4 Maverick', icon: 'rocket' },
    { id: 'meta-llama/llama-4-scout-17b-16e-instruct', name: 'Llama 4 Scout', icon: 'search' },
    { id: 'deepseek-r1-distill-llama-70b', name: 'DeepSeek R1', icon: 'brain' },
    { id: 'qwen-qwq-32b', name: 'QwQ 32B', icon: 'comment-dots' },
    { id: 'llama-3.2-90b-vision-preview', name: 'Vision 90B', icon: 'eye' },
    { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', icon: 'layers' },
  ];

  const FALLBACK_MODELS = [
    'meta-llama/llama-4-maverick-17b-128e-instruct',
    'meta-llama/llama-4-scout-17b-16e-instruct',
    'deepseek-r1-distill-llama-70b',
    'qwen-qwq-32b',
    'llama-3.3-70b-versatile',
  ];

  // --- ANIMATED BACKGROUND COMPONENTS ---

  const StarField = () => {
    const stars = useMemo(() => [{"id":0,"size":1.907324325055817,"x":35.050717289395884,"y":29.805187966272584,"opacity":0.8580796832933582,"duration":4775.178464854356},{"id":1,"size":1.781199041026265,"x":21.68118621600188,"y":23.03240813926173,"opacity":0.413401305507771,"duration":4465.423139653571},{"id":2,"size":2.280704342728921,"x":86.00350234857679,"y":70.4753374535071,"opacity":0.9001783478418826,"duration":4732.210227565976},{"id":3,"size":1.5176597685598323,"x":48.38410395786064,"y":87.22659232214507,"opacity":0.3445357077712048,"duration":3219.26164122531},{"id":4,"size":2.418606472981928,"x":54.14596009118113,"y":4.9829507145225715,"opacity":0.912369602350072,"duration":2968.2429456311},{"id":5,"size":2.426682528055883,"x":26.6644314049018,"y":50.50814689934147,"opacity":0.5300514575210462,"duration":4763.457505148049},{"id":6,"size":2.239409716181638,"x":16.837851630177237,"y":10.411115693839745,"opacity":0.4531374367031348,"duration":4052.4891207648543},{"id":7,"size":1.212096106267746,"x":13.09160690349611,"y":71.42217813259353,"opacity":0.7973651164596045,"duration":3362.6796484224287},{"id":8,"size":1.2041165489229657,"x":1.480191090823757,"y":72.4555924807652,"opacity":0.9380244766930459,"duration":2728.42732538235},{"id":9,"size":1.1239959827012522,"x":47.7651512106398,"y":29.374185142449626,"opacity":0.9594848290727438,"duration":4666.641562071949},{"id":10,"size":1.8517433401669257,"x":77.96995980068237,"y":10.069497830585616,"opacity":0.9691223880436579,"duration":4289.724652752154},{"id":11,"size":2.7512528523802255,"x":82.1433060343676,"y":72.87296694384817,"opacity":0.6237210373631509,"duration":4975.653836048688},{"id":12,"size":1.1748854200612668,"x":30.469544490634213,"y":79.64103908807476,"opacity":0.7234103185393195,"duration":2725.125345659026},{"id":13,"size":2.626237980150955,"x":7.820808598817353,"y":82.82370642607131,"opacity":0.5233007190563294,"duration":3484.4235112323827},{"id":14,"size":1.3127570217832165,"x":0.8487383165203477,"y":28.848473913673047,"opacity":0.9384711080115757,"duration":2366.3932381693776},{"id":15,"size":2.171188209051307,"x":71.05166014783512,"y":24.31566855857501,"opacity":0.30039090905236404,"duration":3347.537982603584},{"id":16,"size":1.852615624649058,"x":97.81763431203998,"y":25.276599451592396,"opacity":0.7251992453602081,"duration":3409.769644227248},{"id":17,"size":1.0747985638379753,"x":29.50402769964031,"y":64.42012670436515,"opacity":0.6052331629027448,"duration":4502.1173192001515},{"id":18,"size":2.9755159085569085,"x":58.15827537966054,"y":34.63385331392577,"opacity":0.5624221091121315,"duration":4622.981850772603},{"id":19,"size":1.7607531261575025,"x":76.3207851826307,"y":69.58208159208834,"opacity":0.5049255208041308,"duration":2650.9119784821924},{"id":20,"size":1.0779076707623814,"x":59.003647114011734,"y":16.16185566742525,"opacity":0.9130067179631634,"duration":2084.1705105766573},{"id":21,"size":2.14751898299571,"x":91.54722092561462,"y":97.76994599801259,"opacity":0.4669786361612743,"duration":2452.07269738759},{"id":22,"size":2.1859475488873454,"x":50.53048357467289,"y":96.91287260004377,"opacity":0.5816184467664702,"duration":3019.0859251772963},{"id":23,"size":2.954997966265841,"x":10.1660336740943,"y":96.31571875256581,"opacity":0.8705910998219344,"duration":2897.2237408292685},{"id":24,"size":2.6343594315058882,"x":27.211676167582578,"y":43.84817950701512,"opacity":0.9740517895641896,"duration":4439.108731524862},{"id":25,"size":2.7956747445031707,"x":68.89166262249296,"y":94.57538908331682,"opacity":0.8259870476451627,"duration":4596.507049840906},{"id":26,"size":2.5662149989087144,"x":24.032427763059783,"y":79.76848156126228,"opacity":0.6481890071330672,"duration":4135.355241593276},{"id":27,"size":1.0622331635926523,"x":73.3006362990376,"y":82.85595664295566,"opacity":0.8259048677760681,"duration":3081.6799216268937},{"id":28,"size":2.6167767820147025,"x":57.72185332533819,"y":86.66611318107947,"opacity":0.6346384338711816,"duration":3586.986945216471},{"id":29,"size":1.0965490204626662,"x":32.32891382442882,"y":64.48639610558115,"opacity":0.6830965922486356,"duration":2645.984691657793},{"id":30,"size":2.886735985541546,"x":35.99092488806328,"y":38.16162105983734,"opacity":0.3791528572153776,"duration":3294.5871621827364},{"id":31,"size":1.2055138133156889,"x":45.967328623358775,"y":86.84099548032289,"opacity":0.5546617001344207,"duration":4867.715764465056},{"id":32,"size":2.9925301881721302,"x":27.015248620180344,"y":43.02069935981378,"opacity":0.5892124155369096,"duration":4690.361458516584},{"id":33,"size":2.4674888174116805,"x":13.972920062973305,"y":41.32710629483785,"opacity":0.34225858330818515,"duration":4244.658773578241},{"id":34,"size":2.0095341669193236,"x":55.39800763991123,"y":66.47084535863577,"opacity":0.9197183537022475,"duration":3702.965563878359},{"id":35,"size":1.3561519071383734,"x":95.81691905731402,"y":5.478117253784287,"opacity":0.7553313799441508,"duration":4091.590919025878},{"id":36,"size":2.064509776185302,"x":68.1977698892873,"y":55.810769285012896,"opacity":0.9863477230202582,"duration":4317.9191427761325},{"id":37,"size":2.192005312397168,"x":0.9174629582930249,"y":12.38482620068282,"opacity":0.7035459148373223,"duration":4419.797870835764},{"id":38,"size":2.6935352135250286,"x":74.84234166917054,"y":51.99609856380511,"opacity":0.43263296215613645,"duration":2451.066938989616},{"id":39,"size":1.081611183060779,"x":21.795047622439622,"y":68.31665725289466,"opacity":0.7245384224220099,"duration":2115.4509435684968},{"id":40,"size":1.5654387129200487,"x":66.45686531470632,"y":85.48496033008426,"opacity":0.8861204452211682,"duration":4423.066768265629},{"id":41,"size":2.8448610200816424,"x":83.31605157195894,"y":15.050519998835,"opacity":0.3374184960825646,"duration":3967.383700596854},{"id":42,"size":1.3144453786770343,"x":37.86189477849868,"y":72.13210987298402,"opacity":0.8616203376987019,"duration":3883.772909805217},{"id":43,"size":1.773885502326228,"x":3.3000921721096255,"y":6.768554178406383,"opacity":0.987214901350786,"duration":2165.4972640678043},{"id":44,"size":1.1138679942780718,"x":67.48385039651987,"y":65.62992382430772,"opacity":0.8153611546870203,"duration":4770.692933460292},{"id":45,"size":1.1803427403881446,"x":54.1092806493439,"y":83.43729116191842,"opacity":0.9105584920553109,"duration":3254.094856569296},{"id":46,"size":1.2045661642961054,"x":72.04920991083881,"y":23.36964130204604,"opacity":0.6813192277144677,"duration":3525.4009476177225},{"id":47,"size":1.9114884119097155,"x":54.438787599105765,"y":74.11500524228482,"opacity":0.7532755258510221,"duration":3947.910216987625},{"id":48,"size":1.1244767702525342,"x":73.97224978634513,"y":64.14964304020405,"opacity":0.6004784606224924,"duration":2279.8795228199297},{"id":49,"size":1.6945593682131355,"x":21.53604590069349,"y":16.87348210044619,"opacity":0.7319680398980667,"duration":4914.350380847587},{"id":50,"size":2.408109859993184,"x":14.787702697395488,"y":81.40975542179308,"opacity":0.499744119179647,"duration":4342.2609698924625},{"id":51,"size":2.7497597496676778,"x":55.30170899397935,"y":10.756925208833955,"opacity":0.8004016507287777,"duration":2037.6373600380591},{"id":52,"size":1.6186389877436644,"x":66.64265275530245,"y":97.82852082388938,"opacity":0.322911768211342,"duration":2903.90184410095},{"id":53,"size":1.2647801382969943,"x":64.79949695723255,"y":10.148365701792471,"opacity":0.8318832929371129,"duration":2696.9530135829173},{"id":54,"size":2.7973337470982917,"x":45.40061547012482,"y":86.47737872510031,"opacity":0.6739127746464231,"duration":2605.3443194437205},{"id":55,"size":1.1945926285736488,"x":74.12838444784668,"y":40.143725457968536,"opacity":0.6448650898347119,"duration":2627.6988423827747},{"id":56,"size":2.0507123004156718,"x":45.44162488185861,"y":30.39539753930738,"opacity":0.8576776460208495,"duration":3555.3751027032736},{"id":57,"size":2.9050855008649576,"x":19.16010707729503,"y":7.606563795067123,"opacity":0.3890498528376003,"duration":3441.2350483414284},{"id":58,"size":1.4870487192926225,"x":31.798828663217304,"y":38.48924700729799,"opacity":0.6638306498601386,"duration":2111.6571175033687},{"id":59,"size":1.1934594104930603,"x":7.374561002619595,"y":39.18037928797054,"opacity":0.5658049064307406,"duration":4489.6170436986995},{"id":60,"size":1.701442938819394,"x":37.017712903941245,"y":48.04355492649184,"opacity":0.4406769590032255,"duration":4411.132207257213},{"id":61,"size":1.716118858447996,"x":25.540779133024415,"y":79.98747630321436,"opacity":0.6316465222526297,"duration":2929.712288332512},{"id":62,"size":1.566388486313826,"x":38.8401316604261,"y":91.1380262232428,"opacity":0.905194954755816,"duration":3137.5346180316446},{"id":63,"size":2.987843098308939,"x":71.94854204136327,"y":66.32493657725725,"opacity":0.8389764406853559,"duration":3986.4353313988013},{"id":64,"size":1.7271616920379547,"x":5.55115913294788,"y":62.23872659926399,"opacity":0.46657170945451676,"duration":4987.562905958079},{"id":65,"size":1.3662776769812557,"x":96.3623899329883,"y":90.77377543795669,"opacity":0.4699333059916203,"duration":4991.591510894736},{"id":66,"size":2.7824862350429216,"x":5.812657880913519,"y":12.986109217859054,"opacity":0.8380587867320148,"duration":2502.94237454292},{"id":67,"size":2.047237731661845,"x":67.23562483654113,"y":17.988217067750135,"opacity":0.42332072003239896,"duration":3334.9398788959415},{"id":68,"size":1.0605533972395649,"x":98.96081143466256,"y":81.21656428496118,"opacity":0.3759707109156236,"duration":4372.381371901996},{"id":69,"size":2.6897192093938225,"x":90.28509804502029,"y":49.71564114898608,"opacity":0.6616846891541928,"duration":4463.697371868348},{"id":70,"size":1.1874621524742661,"x":11.571214737641,"y":26.459613901734656,"opacity":0.7745779474135874,"duration":4451.185433797581},{"id":71,"size":2.8121146218281976,"x":1.8067979475123286,"y":24.210177299634417,"opacity":0.6434314475089306,"duration":3099.2315230161535},{"id":72,"size":2.4397810922189893,"x":47.39967122732256,"y":52.758267804652846,"opacity":0.49601497751504586,"duration":3604.949575376519},{"id":73,"size":2.1759820821357727,"x":77.8077465136722,"y":63.49005639758476,"opacity":0.6509412408406043,"duration":2663.34309437927},{"id":74,"size":2.966060462776777,"x":51.00618906692973,"y":32.904829691695795,"opacity":0.531031698908278,"duration":3036.57913609565},{"id":75,"size":1.4340050774801485,"x":58.13214756351268,"y":84.99440526534198,"opacity":0.6767273112936597,"duration":4716.638463794768},{"id":76,"size":2.915138866013491,"x":12.330294278645937,"y":96.13305463758073,"opacity":0.5306255005807183,"duration":3164.4337490317566},{"id":77,"size":1.4291172045338296,"x":24.945717045266846,"y":59.543091867648016,"opacity":0.6029218019148368,"duration":2223.967992321765},{"id":78,"size":1.8262677379820302,"x":98.34780102147076,"y":58.18086895000085,"opacity":0.5043285373074573,"duration":2609.8545486021003},{"id":79,"size":2.5250319815519857,"x":0.7396693738903837,"y":73.42625228489015,"opacity":0.8180556679092044,"duration":3102.5693462171757}], []);
    
    return (
      <View style={StyleSheet.absoluteFill}>
        {stars.map((star) => (
          <Star key={star.id} {...star} />
        ))}
      </View>
    );
  };

  const Star = ({ size, x, y, opacity, duration }) => {
    const anim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration, useNativeDriver: true }),
        ])
      ).start();
    }, []);

    const alpha = anim.interpolate({
      inputRange: [0, 1],
      outputRange: [opacity * 0.3, opacity],
    });

    return (
      <Animated.View
        style={[
          styles.star,
          {
            width: size,
            height: size,
            left: `${x}%`,
            top: `${y}%`,
            opacity: alpha,
          },
        ]}
      />
    );
  };

  const NebulaOrbs = () => {
    const orb1 = useRef(new Animated.Value(0)).current;
    const orb2 = useRef(new Animated.Value(0)).current;
    const orb3 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      const animate = (val, duration) => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(val, { toValue: 1, duration, useNativeDriver: true }),
            Animated.timing(val, { toValue: 0, duration, useNativeDriver: true }),
          ])
        ).start();
      };
      animate(orb1, 8000);
      animate(orb2, 12000);
      animate(orb3, 10000);
    }, []);

    const t1 = orb1.interpolate({ inputRange: [0, 1], outputRange: [-50, 50] });
    const r1 = orb1.interpolate({ inputRange: [0, 1], outputRange: [1, 1.2] });

    const t2 = orb2.interpolate({ inputRange: [0, 1], outputRange: [50, -50] });
    const r2 = orb2.interpolate({ inputRange: [0, 1], outputRange: [1.2, 0.9] });

    const t3 = orb3.interpolate({ inputRange: [0, 1], outputRange: [0, 100] });
    const r3 = orb3.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.1] });

    return (
      <View style={StyleSheet.absoluteFill}>
        <Animated.View style={[styles.orb, { backgroundColor: THEME.primary, top: '20%', left: '10%', opacity: 0.2, transform: [{ translateX: t1 }, { scale: r1 }] }]} />
        <Animated.View style={[styles.orb, { backgroundColor: THEME.secondary, bottom: '20%', right: '10%', opacity: 0.15, transform: [{ translateX: t2 }, { scale: r2 }] }]} />
        <Animated.View style={[styles.orb, { backgroundColor: THEME.accent, top: '50%', left: '40%', opacity: 0.1, transform: [{ translateY: t3 }, { scale: r3 }] }]} />
      </View>
    );
  };

  // --- HELPER COMPONENTS ---

  const GlassCard = ({ children, style }) => (
    <View style={[styles.glassCard, style]}>
      <BlurView intensity={10} style={StyleSheet.absoluteFill} tint="dark" />
      {children}
    </View>
  );

  const PremiumButton = ({ title, onPress, icon, style, loading }) => (
    <TouchableOpacity onPress={onPress} disabled={loading} activeOpacity={0.8} style={[styles.btnContainer, style]}>
      <LinearGradient colors={[THEME.primary, THEME.primaryGlow]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.btnGradient}>
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <View style={styles.btnContent}>
            {icon && <Ionicons name={icon} size={20} color="#fff" style={{ marginRight: 8 }} />}
            <Text style={styles.btnText}>{title}</Text>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );

  const ShimmerLoading = () => {
    const anim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
      Animated.loop(Animated.timing(anim, { toValue: 1, duration: 1500, useNativeDriver: true })).start();
    }, []);
    const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [-width, width] });
    return (
      <View style={styles.shimmerBox}>
        <Animated.View style={[styles.shimmerLine, { transform: [{ translateX }] }]}>
          <LinearGradient colors={['transparent', 'rgba(255,255,255,0.1)', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
        </Animated.View>
      </View>
    );
  };

  // --- MAIN APP ---

  export default function App() {
    const [activeTab, setActiveTab] = useState('Chat');
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedModel, setSelectedModel] = useState(MODELS[0].id);
    const [keys, setKeys] = useState({});
    const [showVault, setShowVault] = useState(false);
    
    // Agent State
    const [agentGoal, setAgentGoal] = useState('');
    const [agentSteps, setAgentSteps] = useState([]);
    const [agentRunning, setAgentRunning] = useState(false);
    const [agentMemory, setAgentMemory] = useState({});
    const [agentHistory, setAgentHistory] = useState([]);

    // Vision State
    const [visionImage, setVisionImage] = useState(null);
    const [visionResult, setVisionResult] = useState('');

    // Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);

    // Create State
    const [createPrompt, setCreatePrompt] = useState('');
    const [creationImage, setCreationImage] = useState(null);
    const [storyboard, setStoryboard] = useState(null);

    // Build State
    const [buildPrompt, setBuildPrompt] = useState('');
    const [buildCode, setBuildCode] = useState('');
    const [lastCommitUrl, setLastCommitUrl] = useState('');

    const groqIndex = useRef(0);
    const scrollRef = useRef();

    useEffect(() => {
      loadKeys();
    }, []);

    const loadKeys = async () => {
      try {
        const savedKeys = {
          GITHUB_TOKEN: await SecureStore.getItemAsync('GITHUB_TOKEN') || process.env.EXPO_PUBLIC_GITHUB_TOKEN,
          JINA_KEY: await SecureStore.getItemAsync('JINA_KEY'),
          GROQ_OVERRIDE: await SecureStore.getItemAsync('GROQ_OVERRIDE'),
        };
        setKeys(savedKeys);
        if (!savedKeys.GITHUB_TOKEN) setShowVault(true);
      } catch (e) {
        console.error('Keys load error', e);
      }
    };

    const saveKey = async (key, val) => {
      await SecureStore.setItemAsync(key, val);
      setKeys(prev => ({ ...prev, [key]: val }));
    };

    const getGroqKey = () => {
      if (keys.GROQ_OVERRIDE) return keys.GROQ_OVERRIDE;
      const n = (groqIndex.current % 7) + 1;
      groqIndex.current++;
      return process.env['EXPO_PUBLIC_GROQ_KEY_' + n] || '';
    };

    const callGroq = async (prompt, model, history = [], system = '') => {
      const key = getGroqKey();
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + key,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            ...(system ? [{ role: 'system', content: system }] : []),
            ...history,
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
        }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || 'Groq API Error');
      }
      return await response.json();
    };

    // --- TAB: CHAT ---

    const handleSend = async () => {
      if (!input.trim() || loading) return;
      const userMsg = { id: Date.now().toString(), role: 'user', content: input };
      setMessages(prev => [...prev, userMsg]);
      setInput('');
      setLoading(true);

      try {
        const res = await callGroq(input, selectedModel, messages.map(m => ({ role: m.role, content: m.content })));
        const aiMsg = { id: (Date.now() + 1).toString(), role: 'assistant', content: res.choices[0].message.content };
        setMessages(prev => [...prev, aiMsg]);
      } catch (e) {
        Alert.alert('Error', e.message);
      } finally {
        setLoading(false);
      }
    };

    // --- TAB: VISION ---

    const pickVisionImage = async () => {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.5,
        base64: true,
      });
      if (!result.canceled) setVisionImage(result.assets[0]);
    };

    const analyzeVision = async () => {
      if (!visionImage || loading) return;
      setLoading(true);
      setVisionResult('');
      try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + getGroqKey(), 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'llama-3.2-90b-vision-preview',
            messages: [{
              role: 'user',
              content: [
                { type: 'text', text: 'Analyze this image in extreme detail.' },
                { type: 'image_url', image_url: { url: 'data:image/jpeg;base64,' + visionImage.base64 } }
              ]
            }]
          })
        });
        const data = await res.json();
        setVisionResult(data.choices[0].message.content);
      } catch (e) {
        Alert.alert('Vision Error', e.message);
      } finally {
        setLoading(false);
      }
    };

    // --- TAB: SEARCH ---

    const handleSearch = async () => {
      if (!searchQuery.trim() || loading) return;
      setLoading(true);
      setSearchResults([]);
      try {
        const r = await fetch('https://s.jina.ai/' + encodeURIComponent(searchQuery), {
          headers: { 'Accept': 'application/json', 'X-Return-Format': 'markdown' }
        });
        const d = await r.json();
        setSearchResults(d.data || []);
      } catch (e) {
        Alert.alert('Search Error', e.message);
      } finally {
        setLoading(false);
      }
    };

    // --- TAB: CREATE ---

    const handleGenerateImage = () => {
      if (!createPrompt.trim()) return;
      const url = 'https://image.pollinations.ai/prompt/' + encodeURIComponent(createPrompt) + '?width=1024&height=1024&nologo=true&seed=' + Date.now();
      setCreationImage(url);
    };

    const handleStoryboard = async () => {
      if (!createPrompt.trim() || loading) return;
      setLoading(true);
      try {
        const res = await callGroq(`Create a 4-scene storyboard for: ${createPrompt}. Return JSON: [{"scene":1,"prompt":"..."},{"scene":2,"prompt":"..."}]`, 'meta-llama/llama-4-maverick-17b-128e-instruct');
        const text = res.choices[0].message.content;
        const scenes = JSON.parse(text.match(/\[[\s\S]*\]/)[0]);
        setStoryboard(scenes.map(s => ({
          ...s,
          url: 'https://image.pollinations.ai/prompt/' + encodeURIComponent(s.prompt) + '?width=512&height=512&nologo=true&seed=' + Math.random()
        })));
      } catch (e) {
        Alert.alert('Storyboard Error', e.message);
      } finally {
        setLoading(false);
      }
    };

    // --- TAB: BUILD ---

    const handleBuild = async () => {
      if (!buildPrompt.trim() || loading) return;
      setLoading(true);
      setBuildCode('');
      try {
        const res = await callGroq(`Write a single-file React Native Expo App.tsx for: ${buildPrompt}. Return ONLY code, no markdown.`, 'meta-llama/llama-4-maverick-17b-128e-instruct');
        const code = res.choices[0].message.content;
        setBuildCode(code);
        
        if (keys.GITHUB_TOKEN) {
          const repo = 'alhsryahmd266-jpg/ai-studio-apk';
          const path = 'generated_app.tsx';
          const msg = 'Build from Nebula Studio Pro';
          
          const shaRes = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, { headers: { Authorization: 'token ' + keys.GITHUB_TOKEN } });
          const shaJson = await shaRes.json();
          
          const pushRes = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
            method: 'PUT',
            headers: { Authorization: 'token ' + keys.GITHUB_TOKEN, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: msg,
              content: btoa(unescape(encodeURIComponent(code))),
              ...(shaJson.sha ? { sha: shaJson.sha } : {})
            })
          });
          const pushData = await pushRes.json();
          if (pushData.commit) setLastCommitUrl(pushData.commit.html_url);
        }
      } catch (e) {
        Alert.alert('Build Error', e.message);
      } finally {
        setLoading(false);
      }
    };

    // --- TAB: AGENT ---

    const AGENT_SYSTEM = `You are an autonomous AI agent with full tool access.
  You operate in a ReAct loop: Think → Act → Observe → Repeat.

  TOOLS (call with exact syntax):
    [TOOL: search_web    | {"query":"..."}]
    [TOOL: fetch_url     | {"url":"https://..."}]
    [TOOL: calculate     | {"expr":"2+2"}]
    [TOOL: get_datetime  | {}]
    [TOOL: generate_image| {"prompt":"..."}]
    [TOOL: build_app     | {"description":"..."}]
    [TOOL: push_github   | {"token":"...","repo":"owner/repo","path":"App.tsx","content":"...","message":"..."}]
    [TOOL: read_memory   | {"key":"..."}]
    [TOOL: save_memory   | {"key":"...","value":"..."}]
    [TOOL: fix_error     | {"error":"...","context":"..."}]

  RULES:
  1. Start with THOUGHT: analyse the goal.
  2. Use exactly one tool per step.
  3. After OBSERVATION, decide next step.
  4. Write FINAL ANSWER: when done.
  5. If something fails, call fix_error to diagnose and retry.
  6. You have up to 10 iterations — be efficient.`;

    const agentTools = {
      search_web: async ({ query }) => {
        try {
          const r = await fetch('https://s.jina.ai/' + encodeURIComponent(query), { headers: { Accept: 'application/json' } });
          const d = await r.json();
          return JSON.stringify(d).slice(0, 3000);
        } catch (e) { return 'Search failed: ' + e.message; }
      },
      fetch_url: async ({ url }) => {
        try {
          const r = await fetch('https://r.jina.ai/' + url, { headers: { Accept: 'text/plain' } });
          return (await r.text()).slice(0, 3000);
        } catch (e) { return 'Fetch failed: ' + e.message; }
      },
      calculate: ({ expr }) => { try { return String(eval(expr)); } catch (e) { return 'Calc error: ' + e.message; } },
      get_datetime: () => new Date().toLocaleString(),
      generate_image: async ({ prompt }) => 'IMAGE_URL::https://image.pollinations.ai/prompt/' + encodeURIComponent(prompt) + '?width=768&height=768&nologo=true&seed=' + Date.now(),
      build_app: async ({ description }) => {
        try {
          const res = await callGroq('Write complete React Native code for: ' + description, 'meta-llama/llama-4-maverick-17b-128e-instruct');
          return res.choices[0].message.content.slice(0, 4000);
        } catch (e) { return 'Build failed: ' + e.message; }
      },
      push_github: async ({ token, repo, path, content, message }) => {
        try {
          const tk = token || keys.GITHUB_TOKEN;
          if (!tk) return 'Error: No GitHub token.';
          const shaRes = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, { headers: { Authorization: 'token ' + tk } });
          const shaJson = await shaRes.json();
          const r = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
            method: 'PUT',
            headers: { Authorization: 'token ' + tk, 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, content: btoa(unescape(encodeURIComponent(content))), ...(shaJson.sha ? { sha: shaJson.sha } : {}) })
          });
          const j = await r.json();
          return j.commit ? 'Pushed ✅ ' + j.commit.sha.slice(0, 8) : 'Push failed';
        } catch (e) { return 'Push error: ' + e.message; }
      },
      read_memory: ({ key }) => agentMemory[key] || 'Not found',
      save_memory: ({ key, value }) => { setAgentMemory(p => ({ ...p, [key]: value })); return 'Saved'; },
      fix_error: async ({ error, context }) => {
        try {
          const res = await callGroq(`Diagnose error: ${error}. Context: ${context}`, 'deepseek-r1-distill-llama-70b');
          return res.choices[0].message.content;
        } catch (e) { return 'Diagnosis failed'; }
      }
    };

    const runAgent = async () => {
      if (!agentGoal.trim() || agentRunning) return;
      setAgentRunning(true);
      setAgentSteps([{ id: 1, type: 'goal', text: '🎯 Goal: ' + agentGoal, ts: new Date().toLocaleTimeString() }]);
      
      let history = [];
      let iteration = 0;
      const MAX_ITER = 10;

      try {
        while (iteration < MAX_ITER) {
          iteration++;
          const prompt = iteration === 1 ? 'GOAL: ' + agentGoal : 'Next step? History so far:\n' + history.slice(-3).map(h => h.role + ': ' + h.content.slice(0, 200)).join('\n');
          
          const llmRes = await callGroq(prompt, selectedModel, history, AGENT_SYSTEM);
          const rawText = llmRes.choices[0].message.content;
          history.push({ role: 'assistant', content: rawText });

          const thinkMatch = rawText.match(/<think>([\s\S]*?)<\/think>/i);
          if (thinkMatch) {
            setAgentSteps(p => [...p, { id: Date.now() + 1, type: 'thought', text: '💭 ' + thinkMatch[1].trim(), ts: new Date().toLocaleTimeString() }]);
          }

          if (/FINAL ANSWER:/i.test(rawText)) {
            const answer = rawText.split(/FINAL ANSWER:/i)[1]?.trim() || rawText;
            setAgentSteps(p => [...p, { id: Date.now() + 2, type: 'done', text: '✅ Final: ' + answer, ts: new Date().toLocaleTimeString() }]);
            setAgentHistory(p => [{ goal: agentGoal, answer, ts: new Date().toISOString() }, ...p]);
            break;
          }

          const toolMatch = rawText.match(/\[TOOL:\s*(\w+)\s*\|\s*(\{[^\]]*\})\]/s);
          if (toolMatch) {
            const name = toolMatch[1].trim();
            const args = JSON.parse(toolMatch[2]);
            setAgentSteps(p => [...p, { id: Date.now() + 3, type: 'tool_call', text: '🔧 Tool: ' + name, ts: new Date().toLocaleTimeString() }]);
            
            let obs = '';
            try {
              const res = await agentTools[name](args);
              obs = typeof res === 'string' ? res : JSON.stringify(res);
            } catch (e) { obs = 'Error: ' + e.message; }
            
            const isImg = obs.startsWith('IMAGE_URL::');
            setAgentSteps(p => [...p, {
              id: Date.now() + 4,
              type: isImg ? 'image' : 'observation',
              text: isImg ? obs.replace('IMAGE_URL::', '') : '👁️ Result: ' + obs.slice(0, 500),
              ts: new Date().toLocaleTimeString(),
              imageUrl: isImg ? obs.replace('IMAGE_URL::', '') : null
            }]);
            history.push({ role: 'user', content: 'OBSERVATION: ' + obs.slice(0, 2000) });
          } else if (iteration >= MAX_ITER) {
             setAgentSteps(p => [...p, { id: Date.now() + 5, type: 'done', text: '⚠️ Limit reached. Last: ' + rawText.slice(0, 300), ts: new Date().toLocaleTimeString() }]);
          }
        }
      } catch (e) {
        setAgentSteps(p => [...p, { id: Date.now() + 6, type: 'error', text: '❌ Agent Error: ' + e.message, ts: new Date().toLocaleTimeString() }]);
      } finally {
        setAgentRunning(false);
      }
    };

    // --- RENDER HELPERS ---

    const renderTabIcon = (name, icon, lib = 'Ionicons') => {
      const active = activeTab === name;
      const IconComp = lib === 'Ionicons' ? Ionicons : FontAwesome5;
      return (
        <TouchableOpacity onPress={() => setActiveTab(name)} style={styles.tabItem}>
          <IconComp name={icon} size={24} color={active ? THEME.primary : THEME.textSecondary} />
          <Text style={[styles.tabLabel, { color: active ? THEME.primary : THEME.textSecondary }]}>{name}</Text>
          {active && <View style={styles.activeDot} />}
        </TouchableOpacity>
      );
    };

    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <StarField />
        <NebulaOrbs />

        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={styles.nebulaText}>NEBULA</Text>
            <Text style={styles.studioText}>STUDIO PRO</Text>
          </View>
          <TouchableOpacity onPress={() => setShowVault(true)}>
            <Ionicons name="key-outline" size={24} color={keys.GITHUB_TOKEN ? THEME.success : THEME.textSecondary} />
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <View style={styles.tabContent}>
            {activeTab === 'Chat' && (
              <View style={{ flex: 1 }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.modelBar}>
                  {MODELS.map(m => (
                    <TouchableOpacity
                      key={m.id}
                      onPress={() => setSelectedModel(m.id)}
                      style={[styles.modelChip, selectedModel === m.id && styles.modelChipActive]}
                    >
                      <FontAwesome5 name={m.icon} size={12} color={selectedModel === m.id ? '#fff' : THEME.textSecondary} />
                      <Text style={[styles.modelChipText, { color: selectedModel === m.id ? '#fff' : THEME.textSecondary }]}>{m.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <FlatList
                  ref={scrollRef}
                  data={messages}
                  keyExtractor={m => m.id}
                  contentContainerStyle={{ padding: 16 }}
                  onContentSizeChange={() => scrollRef.current?.scrollToEnd()}
                  renderItem={({ item }) => (
                    <View style={[styles.msgWrapper, item.role === 'user' ? styles.msgUser : styles.msgAI]}>
                      <GlassCard style={styles.msgCard}>
                        <Text style={styles.msgText}>{item.content}</Text>
                      </GlassCard>
                    </View>
                  )}
                />
                {loading && <ShimmerLoading />}
                <View style={styles.inputArea}>
                  <GlassCard style={styles.inputGlass}>
                    <TextInput
                      value={input}
                      onChangeText={setInput}
                      placeholder="Enter message..."
                      placeholderTextColor={THEME.textSecondary}
                      style={styles.textInput}
                      multiline
                    />
                    <TouchableOpacity onPress={handleSend} style={styles.sendBtn}>
                      <LinearGradient colors={[THEME.primary, THEME.primaryGlow]} style={styles.sendGradient}>
                        <Ionicons name="send" size={20} color="#fff" />
                      </LinearGradient>
                    </TouchableOpacity>
                  </GlassCard>
                </View>
              </View>
            )}

            {activeTab === 'Vision' && (
              <ScrollView contentContainerStyle={{ padding: 20 }}>
                <Text style={styles.tabTitle}>Vision 90B</Text>
                <TouchableOpacity onPress={pickVisionImage} style={styles.dropZone}>
                  {visionImage ? (
                    <Image source={{ uri: visionImage.uri }} style={styles.previewImg} />
                  ) : (
                    <View style={styles.dropContent}>
                      <Ionicons name="image-outline" size={48} color={THEME.textSecondary} />
                      <Text style={styles.dropText}>Select Image to Analyze</Text>
                    </View>
                  )}
                </TouchableOpacity>
                <PremiumButton title="Analyze Image" onPress={analyzeVision} icon="eye" loading={loading} />
                {visionResult && (
                  <GlassCard style={styles.resultCard}>
                    <Text style={styles.resultTitle}>Analysis</Text>
                    <Text style={styles.resultText}>{visionResult}</Text>
                  </GlassCard>
                )}
              </ScrollView>
            )}

            {activeTab === 'Search' && (
              <View style={{ flex: 1, padding: 16 }}>
                <GlassCard style={styles.searchBar}>
                  <Ionicons name="search" size={20} color={THEME.textSecondary} />
                  <TextInput
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Deep search the web..."
                    placeholderTextColor={THEME.textSecondary}
                    style={styles.searchInput}
                    onSubmitEditing={handleSearch}
                  />
                </GlassCard>
                <FlatList
                  data={searchResults}
                  keyExtractor={(item, idx) => idx.toString()}
                  renderItem={({ item }) => (
                    <GlassCard style={styles.searchResultCard}>
                      <Text style={styles.searchResultTitle}>{item.title}</Text>
                      <Text style={styles.searchResultDesc} numberOfLines={3}>{item.description || item.content}</Text>
                      <TouchableOpacity onPress={() => Linking.openURL(item.url)}>
                        <Text style={styles.searchResultUrl}>{item.url}</Text>
                      </TouchableOpacity>
                    </GlassCard>
                  )}
                />
              </View>
            )}

            {activeTab === 'Create' && (
              <ScrollView contentContainerStyle={{ padding: 16 }}>
                <Text style={styles.tabTitle}>Studio Engine</Text>
                <GlassCard style={styles.createInputCard}>
                  <TextInput
                    value={createPrompt}
                    onChangeText={setCreatePrompt}
                    placeholder="Describe your masterpiece..."
                    placeholderTextColor={THEME.textSecondary}
                    style={styles.createInput}
                    multiline
                  />
                </GlassCard>
                <View style={styles.btnRow}>
                  <PremiumButton title="Image" onPress={handleGenerateImage} icon="image" style={{ flex: 1, marginRight: 8 }} />
                  <PremiumButton title="Storyboard" onPress={handleStoryboard} icon="film" style={{ flex: 1 }} loading={loading} />
                </View>
                {creationImage && (
                  <View style={styles.creationWrapper}>
                    <Image source={{ uri: creationImage }} style={styles.creationImg} />
                    <PremiumButton title="Download" onPress={() => Share.share({ url: creationImage })} icon="download" style={styles.absBtn} />
                  </View>
                )}
                {storyboard && (
                  <View style={styles.storyboardGrid}>
                    {storyboard.map((s, i) => (
                      <GlassCard key={i} style={styles.storyCard}>
                        <Image source={{ uri: s.url }} style={styles.storyImg} />
                        <Text style={styles.storyText}>Scene {s.scene}</Text>
                      </GlassCard>
                    ))}
                  </View>
                )}
              </ScrollView>
            )}

            {activeTab === 'Build' && (
              <ScrollView contentContainerStyle={{ padding: 16 }}>
                <Text style={styles.tabTitle}>Nebula Forge</Text>
                <GlassCard style={styles.buildCard}>
                  <TextInput
                    value={buildPrompt}
                    onChangeText={setBuildPrompt}
                    placeholder="What app should I build for you?"
                    placeholderTextColor={THEME.textSecondary}
                    style={styles.buildInput}
                    multiline
                  />
                </GlassCard>
                <PremiumButton title="Generate & Push to GitHub" onPress={handleBuild} icon="code-slash" loading={loading} />
                {lastCommitUrl && (
                  <TouchableOpacity onPress={() => Linking.openURL(lastCommitUrl)} style={styles.commitLink}>
                    <Ionicons name="logo-github" size={16} color={THEME.success} />
                    <Text style={styles.commitText}>View Commit on GitHub</Text>
                  </TouchableOpacity>
                )}
                {buildCode && (
                  <GlassCard style={styles.codePreview}>
                    <Text style={styles.codeText}>{buildCode.slice(0, 1000)}...</Text>
                  </GlassCard>
                )}
              </ScrollView>
            )}

            {activeTab === 'Vault' && (
              <ScrollView contentContainerStyle={{ padding: 20 }}>
                <Text style={styles.tabTitle}>Neural Vault</Text>
                <GlassCard style={styles.vaultCard}>
                  <VaultItem label="GitHub Token" value={keys.GITHUB_TOKEN} onSave={v => saveKey('GITHUB_TOKEN', v)} />
                  <VaultItem label="Jina AI Key" value={keys.JINA_KEY} onSave={v => saveKey('JINA_KEY', v)} />
                  <VaultItem label="Groq Override" value={keys.GROQ_OVERRIDE} onSave={v => saveKey('GROQ_OVERRIDE', v)} />
                </GlassCard>
                <PremiumButton title="Close Vault" onPress={() => setShowVault(false)} />
              </ScrollView>
            )}

            {activeTab === 'Agent' && (
              <View style={{ flex: 1 }}>
                <View style={{ padding: 16 }}>
                  <GlassCard style={styles.agentInputCard}>
                    <TextInput
                      value={agentGoal}
                      onChangeText={setAgentGoal}
                      placeholder="Set autonomous goal..."
                      placeholderTextColor={THEME.textSecondary}
                      style={styles.agentInput}
                    />
                    <TouchableOpacity onPress={runAgent} disabled={agentRunning} style={styles.runAgentBtn}>
                      {agentRunning ? <ActivityIndicator color="#fff" /> : <Ionicons name="play" size={24} color="#fff" />}
                    </TouchableOpacity>
                  </GlassCard>
                </View>
                <FlatList
                  data={agentSteps}
                  keyExtractor={s => s.id.toString()}
                  contentContainerStyle={{ padding: 16 }}
                  renderItem={({ item }) => (
                    <GlassCard style={[styles.agentStep, styles['agentStep_' + item.type]]}>
                      <View style={styles.stepHeader}>
                        <Text style={styles.stepType}>{item.type.toUpperCase()}</Text>
                        <Text style={styles.stepTs}>{item.ts}</Text>
                      </View>
                      {item.type === 'image' ? (
                         <Image source={{ uri: item.imageUrl }} style={styles.stepImage} />
                      ) : (
                         <Text style={styles.stepText}>{item.text}</Text>
                      )}
                    </GlassCard>
                  )}
                />
              </View>
            )}
          </View>
        </KeyboardAvoidingView>

        <BlurView intensity={20} tint="dark" style={styles.bottomBar}>
          <View style={styles.tabsInner}>
            {renderTabIcon('Chat', 'chatbubble-ellipses-outline')}
            {renderTabIcon('Vision', 'eye-outline')}
            {renderTabIcon('Search', 'search-outline')}
            {renderTabIcon('Create', 'color-palette-outline')}
            {renderTabIcon('Build', 'code-outline')}
            {renderTabIcon('Vault', 'lock-closed-outline')}
            {renderTabIcon('Agent', 'hardware-chip-outline')}
          </View>
        </BlurView>

        <Modal visible={showVault && activeTab !== 'Vault'} animationType="slide" transparent>
           <BlurView intensity={80} style={StyleSheet.absoluteFill}>
              <SafeAreaView style={{ flex: 1, justifyContent: 'center' }}>
                 <TouchableOpacity style={styles.modalClose} onPress={() => setShowVault(false)}>
                    <Ionicons name="close" size={32} color="#fff" />
                 </TouchableOpacity>
                 <VaultScreen keys={keys} saveKey={saveKey} />
              </SafeAreaView>
           </BlurView>
        </Modal>
      </SafeAreaView>
    );
  }

  const VaultItem = ({ label, value, onSave }) => {
    const [val, setVal] = useState(value || '');
    return (
      <View style={styles.vaultItem}>
        <Text style={styles.vaultLabel}>{label}</Text>
        <View style={styles.vaultRow}>
          <TextInput
            value={val}
            onChangeText={setVal}
            secureTextEntry
            placeholder="••••••••"
            placeholderTextColor={THEME.textSecondary}
            style={styles.vaultInput}
          />
          <TouchableOpacity onPress={() => onSave(val)} style={styles.vaultSave}>
            <Ionicons name="checkmark" size={20} color={THEME.success} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const VaultScreen = ({ keys, saveKey }) => (
    <View style={{ padding: 20 }}>
      <Text style={styles.tabTitle}>Neural Vault</Text>
      <GlassCard style={styles.vaultCard}>
        <VaultItem label="GitHub Token" value={keys.GITHUB_TOKEN} onSave={v => saveKey('GITHUB_TOKEN', v)} />
        <VaultItem label="Jina AI Key" value={keys.JINA_KEY} onSave={v => saveKey('JINA_KEY', v)} />
        <VaultItem label="Groq Override" value={keys.GROQ_OVERRIDE} onSave={v => saveKey('GROQ_OVERRIDE', v)} />
      </GlassCard>
    </View>
  );

  /**
   * CORE STYLESHEET
   * Optimized for Glassmorphism and Neon Effects
   */
  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: THEME.background },
    star: { position: 'absolute', backgroundColor: '#fff', borderRadius: 10 },
    orb: { position: 'absolute', width: 300, height: 300, borderRadius: 150 },
    header: {
      height: 60,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      borderBottomWidth: 1,
      borderBottomColor: THEME.cardBorder,
    },
    titleRow: { flexDirection: 'row', alignItems: 'center' },
    nebulaText: { fontSize: 20, fontWeight: '900', color: THEME.primary, letterSpacing: 4 },
    studioText: { fontSize: 20, fontWeight: '900', color: '#fff', letterSpacing: 4, marginLeft: 8 },
    tabContent: { flex: 1 },
    bottomBar: { height: 85, borderTopWidth: 1, borderTopColor: THEME.cardBorder },
    tabsInner: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
    tabItem: { alignItems: 'center', flex: 1 },
    tabLabel: { fontSize: 10, marginTop: 4 },
    activeDot: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: THEME.primary,
      marginTop: 4,
      shadowColor: THEME.primary,
      shadowRadius: 5,
      shadowOpacity: 1,
    },
    glassCard: {
      backgroundColor: THEME.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: THEME.cardBorder,
      overflow: 'hidden',
    },
    btnContainer: { height: 50, borderRadius: 25, overflow: 'hidden', marginVertical: 10 },
    btnGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    btnContent: { flexDirection: 'row', alignItems: 'center' },
    btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    shimmerBox: { height: 4, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden', marginHorizontal: 20 },
    shimmerLine: { width: '100%', height: '100%' },
    modelBar: { maxHeight: 50, paddingHorizontal: 16, marginVertical: 10 },
    modelChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.05)',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      marginRight: 8,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    modelChipActive: { borderColor: THEME.primary, backgroundColor: 'rgba(124, 58, 237, 0.2)' },
    modelChipText: { fontSize: 12, marginLeft: 6, fontWeight: '600' },
    msgWrapper: { marginVertical: 8, maxWidth: '85%' },
    msgUser: { alignSelf: 'flex-end' },
    msgAI: { alignSelf: 'flex-start' },
    msgCard: { padding: 12 },
    msgText: { color: '#fff', lineHeight: 20 },
    inputArea: { padding: 16 },
    inputGlass: { flexDirection: 'row', alignItems: 'center', padding: 8 },
    textInput: { flex: 1, color: '#fff', fontSize: 16, maxHeight: 100, paddingHorizontal: 12 },
    sendBtn: { width: 40, height: 40, borderRadius: 20, overflow: 'hidden' },
    sendGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    tabTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 20 },
    dropZone: {
      height: 200,
      borderRadius: 16,
      borderWidth: 2,
      borderColor: THEME.cardBorder,
      borderStyle: 'dashed',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.02)',
      marginBottom: 20,
    },
    dropContent: { alignItems: 'center' },
    dropText: { color: THEME.textSecondary, marginTop: 12 },
    previewImg: { width: '100%', height: '100%', borderRadius: 14 },
    resultCard: { padding: 16, marginTop: 20 },
    resultTitle: { color: THEME.primary, fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
    resultText: { color: '#fff', lineHeight: 22 },
    searchBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 50, marginBottom: 16 },
    searchInput: { flex: 1, color: '#fff', marginLeft: 10 },
    searchResultCard: { padding: 16, marginBottom: 12 },
    searchResultTitle: { color: THEME.secondary, fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
    searchResultDesc: { color: THEME.textSecondary, fontSize: 14, lineHeight: 18 },
    searchResultUrl: { color: THEME.primary, fontSize: 12, marginTop: 8 },
    createInputCard: { padding: 16, marginBottom: 16 },
    createInput: { color: '#fff', fontSize: 16, minHeight: 80 },
    btnRow: { flexDirection: 'row', marginBottom: 16 },
    creationWrapper: { borderRadius: 16, overflow: 'hidden', marginTop: 10 },
    creationImg: { width: '100%', aspectRatio: 1, borderRadius: 16 },
    absBtn: { position: 'absolute', bottom: 10, right: 10, width: 140 },
    storyboardGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 10 },
    storyCard: { width: '48%', marginBottom: 16 },
    storyImg: { width: '100%', aspectRatio: 1 },
    storyText: { color: '#fff', padding: 8, fontSize: 12, textAlign: 'center' },
    buildCard: { padding: 16, marginBottom: 16 },
    buildInput: { color: '#fff', fontSize: 16, minHeight: 120 },
    codePreview: { padding: 16, marginTop: 20, backgroundColor: '#000' },
    codeText: { color: '#0f0', fontFamily: 'monospace', fontSize: 10 },
    commitLink: { flexDirection: 'row', alignItems: 'center', marginTop: 12, alignSelf: 'center' },
    commitText: { color: THEME.success, marginLeft: 8, fontSize: 14 },
    vaultCard: { padding: 16 },
    vaultItem: { marginBottom: 20 },
    vaultLabel: { color: THEME.textSecondary, fontSize: 12, marginBottom: 8 },
    vaultRow: { flexDirection: 'row', alignItems: 'center' },
    vaultInput: { flex: 1, color: '#fff', borderBottomWidth: 1, borderBottomColor: THEME.cardBorder, paddingVertical: 4 },
    vaultSave: { marginLeft: 12 },
    modalClose: { alignSelf: 'flex-end', marginRight: 20, marginBottom: 10 },
    agentInputCard: { flexDirection: 'row', alignItems: 'center', padding: 8 },
    agentInput: { flex: 1, color: '#fff', paddingHorizontal: 12 },
    runAgentBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: THEME.primary, justifyContent: 'center', alignItems: 'center' },
    agentStep: { padding: 12, marginBottom: 12 },
    stepHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    stepType: { fontSize: 10, fontWeight: 'bold' },
    stepTs: { fontSize: 10, color: THEME.textSecondary },
    stepText: { color: '#fff', fontSize: 14 },
    stepImage: { width: '100%', aspectRatio: 1, borderRadius: 8, marginTop: 8 },
    agentStep_goal: { borderColor: THEME.secondary },
    agentStep_thinking: { opacity: 0.6 },
    agentStep_thought: { fontStyle: 'italic' },
    agentStep_tool_call: { borderColor: THEME.primary },
    agentStep_observation: { borderColor: THEME.accent },
    agentStep_done: { borderColor: THEME.success },
    agentStep_error: { borderColor: THEME.error },
  });

  // END OF NEBULA STUDIO PRO CORE
  