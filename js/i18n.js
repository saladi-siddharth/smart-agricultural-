/**
 * FarmPilot Agricultural OS — Multilingual Localization & Full-Page Translation Engine
 * Converts 100% of UI elements, navigation, cards, alerts, and metrics to 24 Regional & Global Languages
 */

(function () {
  const LANGUAGES = [
    { code: 'en', name: 'English', native: 'English', flag: '🌐', region: 'Global' },
    { code: 'te', name: 'Telugu', native: 'తెలుగు', flag: '🌾', region: 'Andhra Pradesh & Telangana' },
    { code: 'hi', name: 'Hindi', native: 'हिन्दी', flag: '🇮🇳', region: 'National / North India' },
    { code: 'ta', name: 'Tamil', native: 'தமிழ்', flag: '🌾', region: 'Tamil Nadu' },
    { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ', flag: '🌾', region: 'Karnataka' },
    { code: 'ml', name: 'Malayalam', native: 'മലയാളം', flag: '🌴', region: 'Kerala' },
    { code: 'mr', name: 'Marathi', native: 'मराठी', flag: '🌾', region: 'Maharashtra' },
    { code: 'bn', name: 'Bengali', native: 'বাংলা', flag: '🌾', region: 'West Bengal' },
    { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી', flag: '🌾', region: 'Gujarat' },
    { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ', flag: '🌾', region: 'Punjab & Haryana' },
    { code: 'or', name: 'Odia', native: 'ଓଡ଼ିଆ', flag: '🌾', region: 'Odisha' },
    { code: 'as', name: 'Assamese', native: 'অসমীয়া', flag: '🍃', region: 'Assam' },
    { code: 'ur', name: 'Urdu', native: 'اردو', flag: '🌾', region: 'South Asia' },
    { code: 'es', name: 'Spanish', native: 'Español', flag: '🇪🇸', region: 'Latin America / Spain' },
    { code: 'fr', name: 'French', native: 'Français', flag: '🇫🇷', region: 'France / Francophone Africa' },
    { code: 'de', name: 'German', native: 'Deutsch', flag: '🇩🇪', region: 'Europe' },
    { code: 'pt', name: 'Portuguese', native: 'Português', flag: '🇧🇷', region: 'Brazil / Portugal' },
    { code: 'sw', name: 'Swahili', native: 'Kiswahili', flag: '🌍', region: 'East Africa' },
    { code: 'ar', name: 'Arabic', native: 'العربية', flag: '🇸🇦', region: 'Middle East & North Africa' },
    { code: 'ja', name: 'Japanese', native: '日本語', flag: '🇯🇵', region: 'Japan' },
    { code: 'zh', name: 'Chinese', native: '简体中文', flag: '🇨🇳', region: 'East Asia' },
    { code: 'id', name: 'Indonesian', native: 'Bahasa Indonesia', flag: '🇮🇩', region: 'Southeast Asia' },
    { code: 'ru', name: 'Russian', native: 'Русский', flag: '🇷🇺', region: 'Eurasia' },
    { code: 'vi', name: 'Vietnamese', native: 'Tiếng Việt', flag: '🇻🇳', region: 'Vietnam' }
  ];

  // Comprehensive multi-lingual agronomic & UI phrases dictionary
  const PHRASES = {
    // Navigation & Core Modules
    "Dashboard": { te: "డ్యాష్‌బోర్డ్", hi: "डैशबोर्ड", ta: "முகப்பு பலகை", kn: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್", ml: "ഡാഷ്‌ബോർഡ്", mr: "डॅशबोर्ड", bn: "ড্যাশবোর্ড", gu: "ડેશબોર્ડ", pa: "ਡੈਸ਼ਬੋਰਡ", or: "ଡ୍ୟାସବୋର୍ଡ", as: "ডেশ্ববৰ্ড", ur: "ڈیش بورڈ", es: "Panel Principal", fr: "Tableau de bord", de: "Übersicht", pt: "Painel", sw: "Dashibodi", ar: "لوحة التحكم", ja: "ダッシュボード", zh: "仪表盘", id: "Dasbor", ru: "Панель", vi: "Bảng điều khiển" },
    "Executive Dashboard": { te: "ప్రధాన డ్యాష్‌బోర్డ్", hi: "कार्यकारी डैशबोर्ड", ta: "நிர்வாக முகப்பு பலகை", kn: "ಕಾರ್ಯನಿರ್ವಾಹಕ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್", mr: "कार्यकारी डॅशबोर्ड", es: "Panel Ejecutivo", fr: "Tableau de Bord Exécutif" },
    "Farms Portfolio": { te: "వ్యవసాయ క్షేత్రాలు", hi: "फार्म पोर्टफोलियो", ta: "பண்ணை நிலங்கள்", kn: "ಕೃಷಿ ಜಮೀನುಗಳು", ml: "കൃഷിയിടങ്ങൾ", mr: "शेती पोर्टफोलिओ", bn: "খামার পোর্টফোলিও", gu: "ખેતરો", pa: "ਖੇਤ ਪੋਰਟਫੋਲੀਓ", es: "Portafolio de Fincas", fr: "Portefeuille Agricole", de: "Höfe-Portfolio" },
    "Crop Cycles": { te: "పంట చక్రాలు", hi: "फसल चक्र", ta: "பயிர் சுழற்சிகள்", kn: "ಬೆಳೆ ಚಕ್ರಗಳು", ml: "വിള ചക്രങ്ങൾ", mr: "पीक चक्रे", bn: "ফসল চক্র", gu: "પાક ચક્ર", pa: "ਫ਼ਸਲ ਚੱਕਰ", es: "Ciclos de Cultivo", fr: "Cycles de Cultures", de: "Anbauzyklen" },
    "Field Operations & AWD": { te: "క్షేత్ర పనులు & AWD", hi: "खेत के कार्य एवं AWD", ta: "வயல் பணிகள் & AWD", kn: "ಕ್ಷೇತ್ರ ಕಾರ್ಯಾಚರಣೆಗಳು & AWD", mr: "शेतातील कामे आणि AWD", es: "Operaciones de Campo y AWD", fr: "Opérations Agricoles & AWD" },
    "Field Operations & Tasks": { te: "క్షేత్ర పనులు & కార్యకలాపాలు", hi: "खेत के कार्य एवं गतिविधियां", ta: "வயல் பணிகள் & வேலைகள்", kn: "ಕ್ಷೇತ್ರ ಕಾರ್ಯಾಚರಣೆಗಳು", es: "Operaciones de Campo", fr: "Opérations de Terrain" },
    "Activities & Tasks": { te: "పనులు & కార్యకలాపాలు", hi: "कार्य एवं गतिविधियां", ta: "செயல்பாடுகள் & பணிகள்", kn: "ಚಟುವಟಿಕೆಗಳು & ಕೆಲಸಗಳು", es: "Actividades y Tareas", fr: "Activités et Tâches" },
    "Labour & Shifts": { te: "కూలీలు & షిఫ్టులు", hi: "श्रमिक एवं शिफ्ट", ta: "பணியாளர்கள் & ஷிப்ட்", kn: "ಕಾರ್ಮಿಕರು & ಪಾಳಿಗಳು", ml: "തൊഴിലാളികൾ", mr: "कामगार व पाळ्या", bn: "শ্রমিক ও শিফট", es: "Mano de Obra y Turnos", fr: "Main-d'œuvre & Équipes" },
    "Labour Management": { te: "కూలీల నిర్వహణ", hi: "श्रमिक प्रबंधन", ta: "பணியாளர் மேலாண்மை", kn: "ಕಾರ್ಮಿಕ ನಿರ್ವಹಣೆ", es: "Gestión de Mano de Obra", fr: "Gestion de la Main-d'œuvre" },
    "Inputs & Stock": { te: "ఎరువులు & నిల్వలు", hi: "उर्वरक एवं बीज भंडार", ta: "உரங்கள் & இருப்பு", kn: "ಗೊಬ್ಬರ & ದಾಸ್ತಾನು", mr: "खते व साठा", es: "Insumos y Existencias", fr: "Intrants & Stocks" },
    "Inputs & Fertilizers": { te: "ఎరువులు & పురుగుమందులు", hi: "उर्वरक एवं खाद", ta: "உரங்கள் & பூச்சிக்கொல்லிகள்", kn: "ಗೊಬ್ಬರ ಮತ್ತು ಬೀಜಗಳು", es: "Insumos y Fertilizantes", fr: "Intrants & Engrais" },
    "Financials & Budget": { te: "ఆర్థిక వ్యయాలు & బడ్జెట్", hi: "लागत एवं वित्तीय बजट", ta: "செலவு மற்றும் நிதி", kn: "ಖರ್ಚು ಮತ್ತು ಆಯವ್ಯಯ", ml: "ധനകാര്യം & ബജറ്റ്", mr: "खर्च व अंदाजपत्रक", bn: "আর্থিক ও বাজেট", es: "Finanzas y Presupuesto", fr: "Finances & Budget" },
    "Community Ag Exchange": { te: "రైతు కమ్యూనిటీ వేదిక", hi: "किसान समुदाय एवं मंडी", ta: "விவசாயிகள் சமூகம்", kn: "ರೈತ ಸಮುದಾಯ", mr: "शेतकरी समुदाय", bn: "কৃষক কমিউনিটি", es: "Comunidad Agrícola", fr: "Échange Agricole Communautaire" },
    "Farm Action Center": { te: "వ్యవసాయ కార్యాచరణ కేంద్రం", hi: "फार्म इंटेलिजेंस सेंटर", ta: "விவசாய நுண்ணறிவு மையம்", kn: "ಕೃಷಿ ಬುದ್ಧಿಮತ್ತೆ ಕೇಂದ್ರ", es: "Centro de Acción Agrícola", fr: "Centre d'Action Agricole" },
    "Alert Center": { te: "హెచ్చరికల కేంద్రం", hi: "अलर्ट केंद्र", ta: "எச்சரிக்கை மையம்", kn: "ಎಚ್ಚರಿಕೆಗಳು", mr: "सूचना केंद्र", es: "Centro de Alertas", fr: "Centre d'Alertes" },
    "Roles & Staff Matrix": { te: "సిబ్బంది & పాత్రలు", hi: "भूमिका एवं कर्मचारी", ta: "பணிகள் மற்றும் பொறுப்புகள்", kn: "ಪಾತ್ರಗಳು & ಸಿಬ್ಬಂದಿ", es: "Roles y Permisos", fr: "Rôles & Personnel" },
    "Settings & FarmPilot AI": { te: "సెట్టింగ్‌లు & ఫార్మ్‌పైలట్ AI", hi: "सेटिंग्स एवं फार्मपायलट AI", ta: "அமைப்புகள் & ஃபார்ம்பைலட் AI", kn: "ಸಂಯೋಜನೆಗಳು & ಫಾರ್ಮ್‌ಪೈಲಟ್ AI", es: "Configuración e IA FarmPilot", fr: "Paramètres & IA FarmPilot" },
    "Settings & Gemini AI": { te: "సెట్టింగ్‌లు & ఫార్మ్‌పైలట్ AI", hi: "सेटिंग्स एवं फार्मपायलट AI", ta: "அமைப்புகள் & ஃபார்ம்பைலட் AI", kn: "ಸಂಯೋಜನೆಗಳು & ಫಾರ್ಮ್‌ಪೈಲಟ್ AI", es: "Configuración e IA FarmPilot", fr: "Paramètres & IA FarmPilot" },
    "Settings & AI Integration": { te: "సెట్టింగ్‌లు & AI ఇంటిగ్రేషన్", hi: "सेटिंग्स एवं AI एकीकरण", ta: "அமைப்புகள் & AI", kn: "ಸಂಯೋಜನೆಗಳು & AI", es: "Configuración e IA", fr: "Paramètres & IA" },
    "Audit History": { te: "ఆడిట్ చరిత్ర", hi: "ऑडिट इतिहास", ta: "தணிக்கை வரலாறு", kn: "ಆಡಿಟ್ ಇತಿಹಾಸ", es: "Historial de Auditoría", fr: "Historique d'Audit" },
    "Forensic Audit Ledger": { te: "ఫోరెన్సిక్ ఆడిట్ లెడ్జర్", hi: "फोरेंसिक ऑडिट लेजर", ta: "தடயவியல் தணிக்கை ஏடு", kn: "ಆಡಿಟ್ ಲೆಡ್ಜರ್", es: "Registro Forense de Auditoría", fr: "Registre d'Audit Forensique" },
    "Agronomic Reports": { te: "వ్యవసాయ నివేదికలు", hi: "कृषि रिपोर्ट", ta: "விவசாய அறிக்கைகள்", kn: "ಕೃಷಿ ವರದಿಗಳು", es: "Informes Agronómicos", fr: "Rapports Agronomiques" },
    "Mobile Worker View": { te: "మొబైల్ వర్కర్ వీక్షణ", hi: "मोबाइल वर्कर दृश्य", ta: "மொபைல் தொழிலாளர் பார்வை", kn: "ಮೊಬೈಲ್ ಕೆಲಸಗಾರರ ವೀಕ್ಷಣೆ", es: "Vista Móvil de Trabajador", fr: "Vue Mobile Ouvrier" },

    // Top Header & Actions
    "Sign In / Roles": { te: "లాగిన్ / పాత్రలు", hi: "साइन इन / भूमिकाएं", ta: "உள்நுழைவு / பணிகள்", kn: "ಸೈನ್ ಇನ್ / ಪಾತ್ರಗಳು", es: "Iniciar Sesión / Roles", fr: "Connexion / Rôles" },
    "Sign In": { te: "లాగిన్ చేయండి", hi: "साइन इन", ta: "உள்நுழைக", kn: "ಸೈನ್ ಇನ್", es: "Iniciar Sesión", fr: "Connexion" },
    "Sign Out of FarmPilot": { te: "ఫార్మ్‌పైలట్ నుండి లాగ్ అవుట్ చేయండి", hi: "FarmPilot से साइन आउट करें", ta: "FarmPilot இலிருந்து வெளியேறு", kn: "ಫಾರ್ಮ್‌ಪೈಲಟ್‌ನಿಂದ ಸೈನ್ ಔಟ್", es: "Cerrar Sesión de FarmPilot", fr: "Se Déconnecter de FarmPilot" },
    "Sign Out": { te: "లాగ్ అవుట్", hi: "साइन आउट", ta: "வெளியேறு", kn: "ಸೈನ್ ಔಟ್", es: "Cerrar Sesión", fr: "Déconnexion" },
    "Install App": { te: "యాప్‌ను ఇన్‌స్టాల్ చేయండి", hi: "ऐप इंस्टॉल करें", ta: "பயன்பாட்டை நிறுவு", kn: "ಆ್ಯಪ್ ಇನ್‌ಸ್ಟಾಲ್ ಮಾಡಿ", es: "Instalar App", fr: "Installer l'Appli" },
    "Install Web App (Offline Ready)": { te: "వెబ్ యాప్‌ను ఇన్‌స్టాల్ చేయండి (ఆఫ్‌లైన్ సిద్ధం)", hi: "वेब ऐप इंस्टॉल करें (ऑफलाइन तैयार)", ta: "பயன்பாட்டை நிறுவு (ஆஃப்லைன் தயார்)", kn: "ಆ್ಯಪ್ ಇನ್‌ಸ್ಟಾಲ್ ಮಾಡಿ (ಆಫ್‌ಲೈನ್ ಸಿದ್ಧ)", es: "Instalar App Web (Offline)", fr: "Installer l'Appli Web (Hors-Ligne)" },
    "Test Remote Field Mode (Offline)": { te: "ఆఫ్‌లైన్ ఫీల్డ్ మోడ్ పరీక్షించండి", hi: "ऑफलाइन फील्ड मोड का परीक्षण करें", ta: "ஆஃப்லைன் கள பயன்முறையை சோதிக்கவும்", kn: "ಆಫ್‌ಲೈನ್ ಕ್ಷೇತ್ರ ಮೋಡ್ ಪರೀಕ್ಷಿಸಿ", es: "Probar Modo Offline", fr: "Tester le Mode Hors-Ligne" },
    "Toggle Offline Field Mode": { te: "ఆఫ్‌లైన్ ఫీల్డ్ మోడ్ మార్చండి", hi: "ऑफलाइन फील्ड मोड बदलें", ta: "ஆஃப்லைன் பயன்முறையை மாற்றவும்", kn: "ಆಫ್‌ಲೈನ್ ಮೋಡ್ ಬದಲಾಯಿಸಿ", es: "Alternar Modo Offline", fr: "Basculer Mode Hors-Ligne" },
    "Launch Command Center": { te: "కమాండ్ సెంటర్‌ను ప్రారంభించండి", hi: "कमांड सेंटर शुरू करें", ta: "கட்டளை மையத்தைத் தொடங்கு", kn: "ಕಮಾಂಡ್ ಸೆಂಟರ್ ಪ್ರಾರಂಭಿಸಿ", es: "Iniciar Centro de Mando", fr: "Lancer le Centre de Commande" },
    "Online Cloud Sync Active": { te: "ఆన్‌లైన్ క్లౌడ్ సింక్ చురుకుగా ఉంది", hi: "ऑनलाइन क्लाउड सिंक सक्रिय", ta: "ஆன்லைன் கிளவுட் ஒத்திசைவு செயலில் உள்ளது", kn: "ಆನ್‌ಲೈನ್ ಕ್ಲೌಡ್ ಸಿಂಕ್ ಸಕ್ರಿಯ", es: "Sincronización en la Nube Activa", fr: "Synchronisation Cloud Active" },

    // KPIs & Agronomic Intelligence
    "Farm Health Index": { te: "వ్యవసాయ ఆరోగ్య సూచిక", hi: "फार्म स्वास्थ्य सूचकांक", ta: "பண்ணை நல்வாழ்வு குறியீடு", kn: "ಕೃಷಿ ಆರೋಗ್ಯ ಸೂಚ್ಯಂಕ", ml: "കൃഷി ആരോഗ്യ സൂചിക", mr: "शेती आरोग्य निर्देशांक", bn: "খামার স্বাস্থ্য সূচক", es: "Índice de Salud Agrícola", fr: "Indice de Santé de la Ferme" },
    "Optimal Condition": { te: "అనుకూల స్థితి", hi: "उत्कृष्ट स्थिति", ta: "சிறந்த நிலை", kn: "ಉತ್ತಮ ಸ್ಥಿತಿ", es: "Condición Óptima", fr: "Condition Optimale" },
    "Attention Required": { te: "శ్రద్ధ అవసరం", hi: "ध्यान देने की आवश्यकता", ta: "கவனம் தேவை", kn: "ಗಮನ ಅಗತ್ಯ", es: "Atención Requerida", fr: "Attention Requise" },
    "Critical Alert": { te: "అత్యవసర హెచ్చరిక", hi: "गंभीर चेतावनी", ta: "முக்கிய எச்சரிக்கை", kn: "ತುರ್ತು ಎಚ್ಚರಿಕೆ", es: "Alerta Crítica", fr: "Alerte Critique" },
    "Active Tillering": { te: "చురుకైన పిలకల దశ (Tillering)", hi: "सक्रिय कल्ले फूटने की अवस्था", ta: "தூர் கட்டும் பருவம்", kn: "ತೆನೆ ಒಡೆಯುವ ಹಂತ", es: "Macollamiento Activo", fr: "Tallage Actif" },
    "Overdue Operation": { te: "గడువు ముగిసిన పని", hi: "अतिदेय कार्य", ta: "தாமதமான பணி", kn: "ವಿಳಂಬವಾದ ಕೆಲಸ", es: "Operación Vencida", fr: "Opération en Retard" },
    "Mark Complete": { te: "పూర్తయినట్లు గుర్తించు", hi: "पूर्ण चिह्नित करें", ta: "முடிந்தது எனக் குறிக்கவும்", kn: "ಪೂರ್ಣಗೊಳಿಸಲಾಗಿದೆ", es: "Marcar como Completado", fr: "Marquer comme Terminé" },
    "Mark Complete & Log Actuals": { te: "పూర్తయినట్లు గుర్తించి వివరాలు నమోదు చేయండి", hi: "पूर्ण चिह्नित करें और विवरण दर्ज करें", ta: "முடிந்தது எனக் குறித்து விவரங்களை பதிவு செய்", kn: "ಪೂರ್ಣಗೊಳಿಸಲಾಗಿದೆ ಎಂದು ಗುರುತಿಸಿ", es: "Completar y Registrar", fr: "Terminer et Enregistrer" },
    "Break-Even Yield": { te: "లాభ-నష్టాల సమాన దిగుబడి", hi: "लाभ-हानि संतुलन उपज", ta: "சமநிலை மகசூல்", kn: "ಸಮತೋಲನ ಇಳುವರಿ", es: "Rendimiento de Equilibrio", fr: "Rendement d'Équilibre" },
    "Mandi Rates": { te: "మార్కెట్ ధరలు (మండి రేట్లు)", hi: "मंडी भाव", ta: "சந்தை விலைகள் (மண்டி)", kn: "ಮಂಡಿ ದರಗಳು", es: "Precios de Mercado", fr: "Cours du Marché" },
    "AWD Water Depth": { te: "AWD నీటి మట్టం", hi: "AWD जल स्तर", ta: "AWD நீர் ஆழம்", kn: "AWD ನೀರಿನ ಆಳ", es: "Profundidad de Agua AWD", fr: "Profondeur d'Eau AWD" },
    "Soil Moisture": { te: "నేల తేమ శాతం", hi: "मिट्टी की नमी", ta: "மண் ஈரப்பதம்", kn: "ಮಣ್ಣಿನ ತೇವಾಂಶ", es: "Humedad del Suelo", fr: "Humidité du Sol" },
    "Next Irrigation": { te: "తదుపరి నీటి పారుదల", hi: "अगली सिंचाई", ta: "அடுத்த பாசனம்", kn: "ಮುಂದಿನ ನೀರಾವರಿ", es: "Próximo Riego", fr: "Prochaine Irrigation" },
    "Target Quantity": { te: "లక్ష్య పరిమాణం", hi: "लक्षित मात्रा", ta: "இலக்கு அளவு", kn: "ಗುರಿ ಪ್ರಮಾಣ", es: "Cantidad Objetivo", fr: "Quantité Cible" },
    "Actual Quantity": { te: "వాస్తవ పరిమాణం", hi: "वास्तविक मात्रा", ta: "உண்மையான அளவு", kn: "ನಿಜವಾದ ಪ್ರಮಾಣ", es: "Cantidad Real", fr: "Quantité Réelle" },
    "Hours Worked": { te: "పని చేసిన గంటలు", hi: "कार्य के घंटे", ta: "வேலை செய்த நேரம்", kn: "ಕೆಲಸ ಮಾಡಿದ ಗಂಟೆಗಳು", es: "Horas Trabajadas", fr: "Heures Travaillées" },
    "Field Notes": { te: "ఫీల్డ్ నోట్స్ (క్షేత్ర సమాచారం)", hi: "खेत की टिप्पणियां", ta: "வயல் குறிப்புகள்", kn: "ಕ್ಷೇತ್ರ ಟಿಪ್ಪಣಿಗಳು", es: "Notas de Campo", fr: "Notes de Terrain" },
    "Total Revenue": { te: "మొత్తం ఆదాయం", hi: "कुल राजस्व", ta: "மொத்த வருவாய்", kn: "ಒಟ್ಟು ಆದಾಯ", es: "Ingresos Totales", fr: "Revenu Total" },
    "Net Profit": { te: "నికర లాభం", hi: "शुद्ध लाभ", ta: "நிகர லாபம்", kn: "ನಿವ್ವಳ ಲಾಭ", es: "Ganancia Neta", fr: "Bénéfice Net" },
    "Profit Margin": { te: "లాభ శాతం", hi: "लाभ मार्जिन", ta: "லாப வரம்பு", kn: "ಲಾಭದ ಪ್ರಮಾಣ", es: "Margen de Ganancia", fr: "Marge Bénéficiaire" },
    "Safety Buffer": { te: "రక్షణ బఫర్", hi: "सुरक्षा बफर", ta: "பாதுகாப்பு இடைவெளி", kn: "ಸುರಕ್ಷತಾ ಬಫರ್", es: "Margen de Seguridad", fr: "Marge de Sécurité" },

    // Buttons & Form Fields
    "Save": { te: "భద్రపరచు", hi: "सहेजें", ta: "சேமி", kn: "ಉಳಿಸಿ", es: "Guardar", fr: "Enregistrer" },
    "Save Changes": { te: "మార్పులను భద్రపరచు", hi: "परिवर्तन सहेजें", ta: "மாற்றங்களைச் சேமிக்கவும்", kn: "ಬದಲಾವಣೆಗಳನ್ನು ಉಳಿಸಿ", es: "Guardar Cambios", fr: "Enregistrer les Modifications" },
    "Cancel": { te: "రద్దు చేయి", hi: "रद्द करें", ta: "ரத்து செய்", kn: "ರದ್ದುಮಾಡು", es: "Cancelar", fr: "Annuler" },
    "Delete": { te: "తొలగించు", hi: "हटाएं", ta: "நீக்கு", kn: "ಅಳಿಸಿ", es: "Eliminar", fr: "Supprimer" },
    "Edit": { te: "సవరించు", hi: "संपादित करें", ta: "திருத்து", kn: "ತಿದ್ದು", es: "Editar", fr: "Modifier" },
    "Search": { te: "వెతకండి", hi: "खोजें", ta: "தேடுக", kn: "ಹುಡುಕಿ", es: "Buscar", fr: "Rechercher" },
    "Filter": { te: "వడపోత", hi: "फ़िल्टर", ta: "வடிகட்டு", kn: "ಫಿಲ್ಟರ್", es: "Filtrar", fr: "Filtrer" },
    "Close": { te: "మూసివేయి", hi: "बंद करें", ta: "மூடு", kn: "ಮುಚ್ಚು", es: "Cerrar", fr: "Fermer" },
    "Ask FarmPilot AI": { te: "ఫార్మ్‌పైలట్ AI ని అడగండి", hi: "FarmPilot AI से पूछें", ta: "FarmPilot AI இடம் கேளுங்கள்", kn: "FarmPilot AI ಕೇಳಿ", es: "Preguntar a FarmPilot IA", fr: "Consulter FarmPilot IA" },
    "Daily Farm Brief": { te: "రోజువారీ వ్యవసాయ నివేదిక", hi: "दैनिक कृषि सारांश", ta: "தினசரி சுருக்கம்", kn: "ದೈನಂದಿನ ವರದಿ", es: "Resumen Diario Agrícola", fr: "Brief Quotidien" },

    // Home Page Specific Headings
    "The Autonomous OS for Precision Agriculture": {
      te: "ఖచ్చితమైన వ్యవసాయం కోసం స్వయంప్రతిపత్తి ఆపరేటింగ్ సిస్టమ్",
      hi: "सटीक और आधुनिक कृषि के लिए स्वायत्त ऑपरेटिंग सिस्टम",
      ta: "துல்லிய விவசாயத்திற்கான தன்னாட்சி இயக்க முறைமை",
      kn: "ನಿಖರ ಕೃಷಿಗಾಗಿ ಸ್ವಾಯತ್ತ ಆಪರೇಟಿಂಗ್ ಸಿಸ್ಟಮ್",
      es: "El Sistema Operativo Autónomo para la Agricultura de Precisión",
      fr: "Le Système d'Exploitation Autonome pour l'Agriculture de Précision"
    },
    "Complete Operational Workflow": {
      te: "సంపూర్ణ కార్యాచరణ వర్క్‌ఫ్లో",
      hi: "संपूर्ण परिचालन कार्यप्रवाह",
      ta: "முழுமையான செயல்பாட்டு பணிப்பாய்வு",
      kn: "ಸಂಪೂರ್ಣ ಕಾರ್ಯಾಚರಣೆಯ ಹರಿವು",
      es: "Flujo Operativo Completo",
      fr: "Flux Opérationnel Complet"
    },
    "100% Offline Remote Field Architecture": {
      te: "100% ఆఫ్‌లైన్ క్షేత్ర నిర్మాణ శైలి",
      hi: "100% ऑफलाइन सुदूर क्षेत्र आर्किटेक्चर",
      ta: "100% ஆஃப்லைன் தொலைதூர கள கட்டமைப்பு",
      kn: "100% ಆಫ್‌ಲೈನ್ ಕ್ಷೇತ್ರ ವಾಸ್ತುಶಿಲ್ಪ",
      es: "Arquitectura 100% Offline para el Campo Remoto",
      fr: "Architecture 100% Hors-Ligne pour les Champs Isolés"
    },
    "Local Agronomic Brain": {
      te: "స్థానిక వ్యవసాయ మేధస్సు (Local Brain)",
      hi: "स्थानीय कृषि मस्तिष्क (Local Brain)",
      ta: "உள்ளூர் விவசாய மூளை",
      kn: "ಸ್ಥಳೀಯ ಕೃಷಿ ಬುದ್ಧಿಮತ್ತೆ",
      es: "Cerebro Agronómico Local",
      fr: "Cerveau Agronomique Local"
    },
    "24 Languages in the Field": {
      te: "క్షేత్రంలో 24 భాషల మద్దతు",
      hi: "खेत में 24 भारतीय एवं वैश्विक भाषाएं",
      ta: "களத்தில் 24 மொழிகள்",
      kn: "ಕ್ಷೇತ್ರದಲ್ಲಿ 24 ಭಾಷೆಗಳು",
      es: "24 Idiomas en el Campo",
      fr: "24 Langues sur le Terrain"
    },
    "Auto-Sync Storage Queue": {
      te: "స్వయంచాలక నిల్వ సమన్వయ క్యూ",
      hi: "स्वचालित सिंक स्टोरेज कतार",
      ta: "தானியங்கி ஒத்திசைவு வரிசை",
      kn: "ಸ್ವಯಂಚಾಲಿತ ಸಿಂಕ್ ಕ್ಯೂ",
      es: "Cola de Almacenamiento Auto-Sincronizada",
      fr: "File de Stockage Auto-Synchronisée"
    },
    "Native Standalone App": {
      te: "స్థానిక స్వతంత్ర యాప్ (PWA)",
      hi: "मूल स्टैंडअलोन ऐप (PWA)",
      ta: "சொந்த தனித்த பயன்பாடு (PWA)",
      kn: "ಸ್ಥಳೀಯ ಸ್ವತಂತ್ರ ಆ್ಯಪ್",
      es: "Aplicación Nativa Independiente",
      fr: "Application Autonome Native"
    }
  };

  // Legacy DICTIONARY for backward compatibility
  const DICTIONARY = {
    en: {},
    te: {},
    hi: {},
    ta: {},
    kn: {},
    es: {},
    fr: {}
  };
  // Populate legacy dictionary
  for (const [key, transObj] of Object.entries(PHRASES)) {
    const slug = key.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    for (const lang of Object.keys(transObj)) {
      if (!DICTIONARY[lang]) DICTIONARY[lang] = {};
      DICTIONARY[lang][slug] = transObj[lang];
    }
  }

  // Sample prompt chips for AI chat
  const SAMPLE_QUESTIONS = {
    en: [
      "What needs immediate attention today?",
      "Why is North Block Paddy flagged as at risk?",
      "How much have we spent on fertilizers this cycle?",
      "What is my break-even yield and safety buffer?"
    ],
    te: [
      "ఈరోజు అత్యవసరంగా చేయవలసిన పని ఏమిటి?",
      "నార్త్ బ్లాక్ వరి పంట ఎందుకు ప్రమాదంలో ఉంది?",
      "ఈ పంట కాలంలో ఎరువులపై ఎంత ఖర్చు చేశాము?",
      "నా లాభ-నష్ట సమాన దిగుబడి (Break-even yield) ఎంత?"
    ],
    hi: [
      "आज खेत में सबसे पहले क्या काम करना है?",
      "नॉर्थ ब्लॉक में धान की फसल जोखिम में क्यों है?",
      "अब तक उर्वरक और खाद पर कुल कितना खर्च हुआ है?",
      "मेरा ब्रेक-इवन उत्पादन और लाभ सुरक्षा बफर कितना है?"
    ],
    ta: [
      "இன்று உடனடியாக கவனிக்க வேண்டிய பணி என்ன?",
      "வடக்கு தொகுதி நெல் பயிர் ஏன் ஆபத்தில் உள்ளது?",
      "இந்த பயிர் சுழற்சியில் உரங்களுக்கு எவ்வளவு செலவிடப்பட்டது?",
      "எனது சமநிலை மகசூல் மற்றும் பாதுகாப்பு வரம்பு என்ன?"
    ],
    kn: [
      "ಇಂದು ತಕ್ಷಣ ಗಮನಿಸಬೇಕಾದ ಕೆಲಸ ಯಾವುದು?",
      "ನಾರ್ತ್ ಬ್ಲಾಕ್ ಭತ್ತದ ಬೆಳೆ ಏಕೆ ಅಪಾಯದಲ್ಲಿದೆ?",
      "ಈ ಋತುವಿನಲ್ಲಿ ರಸಗೊಬ್ಬರಗಳಿಗೆ ಎಷ್ಟು ವೆಚ್ಚ ಮಾಡಲಾಗಿದೆ?",
      "ನನ್ನ ಸಮತೋಲನ ಇಳುವರಿ (Break-even yield) ಎಷ್ಟು?"
    ],
    es: [
      "¿Qué necesita atención inmediata hoy?",
      "¿Por qué el arroz del Bloque Norte está en riesgo?",
      "¿Cuánto hemos gastado en fertilizantes?",
      "¿Cuál es mi rendimiento de equilibrio y margen de ganancia?"
    ],
    fr: [
      "Qu'est-ce qui nécessite une attention immédiate aujourd'hui ?",
      "Pourquoi le riz du bloc Nord est-il à risque ?",
      "Combien avons-nous dépensé en engrais ?",
      "Quel est mon rendement de seuil de rentabilité ?"
    ]
  };

  // WeakMaps to remember original English text on DOM nodes
  const textNodeOrigMap = new WeakMap();
  let sortedPhrases = null;

  function getSortedPhrases() {
    if (!sortedPhrases) {
      sortedPhrases = Object.keys(PHRASES).sort((a, b) => b.length - a.length);
    }
    return sortedPhrases;
  }

  function translateText(text, langCode) {
    if (!text || typeof text !== 'string') return text;
    if (langCode === 'en') return text;

    const trimmed = text.trim();
    if (!trimmed || trimmed.length <= 1) return text;

    // 1. Direct exact phrase match
    if (PHRASES[trimmed] && PHRASES[trimmed][langCode]) {
      return text.replace(trimmed, PHRASES[trimmed][langCode]);
    }

    // 2. Substring phrase match (longest first)
    let result = text;
    const keys = getSortedPhrases();
    for (const key of keys) {
      if (PHRASES[key][langCode] && result.includes(key)) {
        result = result.split(key).join(PHRASES[key][langCode]);
      }
    }
    return result;
  }

  /**
   * Recursive Full-DOM Text Walker
   */
  function walkAndTranslate(rootNode, langCode) {
    if (!rootNode || !rootNode.nodeType) return;
    const isEn = langCode === 'en';

    // Walk all text nodes
    const walker = document.createTreeWalker(
      rootNode,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          if (!node.parentElement) return NodeFilter.FILTER_REJECT;
          const tag = node.parentElement.tagName;
          if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT' || tag === 'TEXTAREA' || tag === 'CODE' || tag === 'PRE') {
            return NodeFilter.FILTER_REJECT;
          }
          if (node.parentElement.closest('#header-lang-dropdown') || node.parentElement.closest('.skiptranslate')) {
            return NodeFilter.FILTER_REJECT;
          }
          if (!node.nodeValue.trim()) return NodeFilter.FILTER_SKIP;
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    const nodes = [];
    while (walker.nextNode()) {
      nodes.push(walker.currentNode);
    }

    for (const node of nodes) {
      let orig = textNodeOrigMap.get(node);
      if (!orig) {
        orig = node.nodeValue;
        textNodeOrigMap.set(node, orig);
      }
      if (isEn) {
        node.nodeValue = orig;
      } else {
        const translated = translateText(orig, langCode);
        if (translated !== node.nodeValue) {
          node.nodeValue = translated;
        }
      }
    }

    // Also translate input placeholders and element titles
    const inputs = rootNode.querySelectorAll ? rootNode.querySelectorAll('input[placeholder], textarea[placeholder], [title]') : [];
    inputs.forEach(el => {
      if (el.closest('#header-lang-dropdown') || el.closest('.skiptranslate')) return;

      if (el.placeholder) {
        let origPh = el.getAttribute('data-fp-orig-placeholder');
        if (!origPh) {
          origPh = el.placeholder;
          el.setAttribute('data-fp-orig-placeholder', origPh);
        }
        el.placeholder = isEn ? origPh : translateText(origPh, langCode);
      }

      if (el.title) {
        let origTitle = el.getAttribute('data-fp-orig-title');
        if (!origTitle) {
          origTitle = el.title;
          el.setAttribute('data-fp-orig-title', origTitle);
        }
        el.title = isEn ? origTitle : translateText(origTitle, langCode);
      }
    });
  }

  /**
   * Google Translate Automated Website Bridge (For 100% Neural Paragraph Translation)
   */
  function syncGoogleTranslate(langCode) {
    const googleCodeMap = {
      zh: 'zh-CN',
      pa: 'pa',
      or: 'or',
      as: 'as'
    };
    const gCode = langCode === 'en' ? 'en' : (googleCodeMap[langCode] || langCode);

    try {
      // Set google translation cookie
      const domain = window.location.hostname;
      document.cookie = `googtrans=/en/${gCode}; path=/;`;
      if (domain && domain !== 'localhost' && !domain.includes('127.0.0.1')) {
        document.cookie = `googtrans=/en/${gCode}; domain=.${domain}; path=/;`;
      }

      // If Google combo exists, trigger programmatic change
      const combo = document.querySelector('.goog-te-combo');
      if (combo) {
        combo.value = gCode;
        combo.dispatchEvent(new Event('change'));
      }
    } catch (err) {
      console.warn('Google Translate sync note:', err);
    }
  }

  function initGoogleTranslate() {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    if (document.getElementById('google-translate-script')) return;

    // Inject invisible container
    if (!document.getElementById('google_translate_element')) {
      const el = document.createElement('div');
      el.id = 'google_translate_element';
      el.style.display = 'none';
      document.body.appendChild(el);
    }

    // Inject CSS to suppress all Google branding overlays
    if (!document.getElementById('google-translate-hider-css')) {
      const style = document.createElement('style');
      style.id = 'google-translate-hider-css';
      style.textContent = `
        .goog-te-banner-frame.skiptranslate,
        .goog-te-banner-frame,
        #goog-gt-tt,
        .goog-te-balloon-frame,
        .goog-te-spinner-pos {
          display: none !important;
        }
        body {
          top: 0px !important;
        }
        .goog-text-highlight {
          background: none !important;
          box-shadow: none !important;
        }
        font[style] {
          background: transparent !important;
        }
      `;
      document.head.appendChild(style);
    }

    window.googleTranslateElementInit = function () {
      try {
        new window.google.translate.TranslateElement({
          pageLanguage: 'en',
          autoDisplay: false,
          layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE
        }, 'google_translate_element');
        
        // After init, sync current language
        const cur = window.FarmPilotI18n ? window.FarmPilotI18n.getCurrentLanguage().code : 'en';
        if (cur !== 'en') {
          syncGoogleTranslate(cur);
        }
      } catch (e) {
        // Fallback gracefully to offline dictionary
      }
    };

    const s = document.createElement('script');
    s.id = 'google-translate-script';
    s.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    s.async = true;
    s.onerror = function() {
      // Offline mode: silently continue with built-in dictionary
    };
    document.head.appendChild(s);
  }

  window.FarmPilotI18n = {
    getLanguages() {
      return LANGUAGES;
    },

    getCurrentLanguage() {
      const code = localStorage.getItem('farmpilot_language') || 'en';
      return LANGUAGES.find(l => l.code === code) || LANGUAGES[0];
    },

    setLanguage(code) {
      const match = LANGUAGES.find(l => l.code === code) || LANGUAGES[0];
      localStorage.setItem('farmpilot_language', match.code);
      document.documentElement.lang = match.code;

      // 1. Perform instantaneous local DOM translation
      this.applyTranslations(match.code);

      // 2. Sync Google Translate neural bridge
      syncGoogleTranslate(match.code);

      // 3. Dispatch broadcast event
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('farmpilot:language-changed', { detail: match }));
      }
      return match;
    },

    t(key, defaultText) {
      const current = this.getCurrentLanguage().code;
      // 1. Exact match in Phrases
      if (PHRASES[key] && PHRASES[key][current]) {
        return PHRASES[key][current];
      }
      // 2. Slug match in legacy dictionary
      const slug = key.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
      if (DICTIONARY[current] && DICTIONARY[current][slug]) {
        return DICTIONARY[current][slug];
      }
      if (DICTIONARY.en && DICTIONARY.en[slug]) {
        return DICTIONARY.en[slug];
      }
      return defaultText || key;
    },

    getSampleQuestions(langCode) {
      const code = langCode || this.getCurrentLanguage().code;
      return SAMPLE_QUESTIONS[code] || SAMPLE_QUESTIONS.en;
    },

    applyTranslations(explicitCode) {
      const current = explicitCode ? (LANGUAGES.find(l => l.code === explicitCode) || LANGUAGES[0]) : this.getCurrentLanguage();
      document.documentElement.lang = current.code;

      // 1. Translate elements with explicit [data-i18n]
      document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const translated = this.t(key);
        if (translated) {
          if (el.tagName === 'INPUT' && (el.type === 'text' || el.type === 'search')) {
            el.placeholder = translated;
          } else {
            el.textContent = translated;
          }
        }
      });

      // 2. Translate entire DOM (Sidebar, Header, Main Cards, Buttons, Headings, Tables)
      if (document.body) {
        walkAndTranslate(document.body, current.code);
      }
    },

    /**
     * Build Grounded Agricultural System Prompt for FarmPilot AI Engine
     */
    buildGeminiSystemPrompt(farmData = {}) {
      const current = this.getCurrentLanguage();
      const farmName = farmData.farmName || 'Green Valley Farm';
      const crop = farmData.crop || 'Paddy (BPT-5204 Samba Mahsuri)';
      const stage = farmData.stage || 'Active Tillering (Day 38 of 120)';
      const health = farmData.healthScore || 82;
      const overdueTask = farmData.overdueTask || 'Zinc Sulfate Micronutrient Spray (Overdue by 2 days in North Block)';
      const totalCost = farmData.totalCost || '₹1,42,500 spent of ₹2,40,000 budget (+14.3% variance in fertilizer)';
      const breakEven = farmData.breakEven || '1.81 Tonnes/Acre at ₹28/kg selling price';

      return `You are FarmPilot's World-Class Principal Agricultural Intelligence Engine & Precision Agronomist.

IMPORTANT OPERATIONAL CONTEXT (Verified Audited Farm Facts):
- Farm Name: ${farmName}
- Active Crop & Variety: ${crop}
- Phenological Crop Stage: ${stage}
- Farm Health Index: ${health}/100
- Critical Overdue Milestone: ${overdueTask}
- Cultivation Financials: ${totalCost}
- Economic Break-Even Yield: ${breakEven}
- Target Acreage: 18.5 Acres across North Block, South Canal Block, East River Terrace.

INSTRUCTIONS:
1. You MUST respond completely and naturally in the following language: ${current.name} (${current.native}).
2. Do NOT hallucinate data or assume random numbers. Strictly base your calculations, agronomic advice, and stage observations on the verified farm facts above.
3. Be respectful, highly practical, and actionable for farmers, estate managers, and agricultural operators.
4. If asked in another language, respond in that language or in ${current.name}.
5. Format your response cleanly with clear bullet points and bold key numbers where appropriate.`;
    }
  };

  // Initialize on DOM ready
  if (typeof document !== 'undefined') {
    const onReady = function () {
      initGoogleTranslate();
      const cur = window.FarmPilotI18n.getCurrentLanguage().code;
      if (cur !== 'en') {
        window.FarmPilotI18n.applyTranslations(cur);
      }

      // Mutation observer to translate dynamically added elements (cards, toasts, modals)
      const observer = new MutationObserver((mutations) => {
        const lang = window.FarmPilotI18n.getCurrentLanguage().code;
        if (lang === 'en') return;
        for (const mut of mutations) {
          for (const node of mut.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              walkAndTranslate(node, lang);
            }
          }
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', onReady);
    } else {
      onReady();
    }
  }
})();
