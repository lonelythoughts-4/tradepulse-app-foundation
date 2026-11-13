export type LanguageCode = "en" | "ru" | "hi" | "es" | "it" | "zh" | "ja" | "ro";

export type DeskMessageKey =
  | "nav.dashboard"
  | "nav.bots"
  | "nav.synthetic"
  | "nav.wallet"
  | "nav.earn"
  | "nav.account"
  | "nav.protection"
  | "nav.liveDesk"
  | "nav.community"
  | "nav.help"
  | "nav.admin"
  | "nav.more"
  | "header.workspace"
  | "header.signedIn"
  | "header.controlRoom"
  | "header.notifications"
  | "admin.environmentChanged"
  | "admin.environmentError"
  | "account.title"
  | "account.language"
  | "account.languageIntro"
  | "activation.continue"
  | "activation.back"
  | "activation.join"
  | "activation.checking"
  | "activation.recheck"
  | "activation.membershipPending"
  | "activation.membershipUnavailable"
  | "activation.channelIntro"
  | "activation.acceptError"
  | "error.request"
  | "error.timeout"
  | "error.network"
  | "error.400"
  | "error.401"
  | "error.403"
  | "error.404"
  | "error.409"
  | "error.429"
  | "error.500"
  | "error.reference";

const catalog: Record<LanguageCode, Record<DeskMessageKey, string>> = {
  en: {
    "nav.dashboard": "Dashboard", "nav.bots": "Bots", "nav.synthetic": "Synthetic", "nav.wallet": "Wallet",
    "nav.earn": "Earn", "nav.account": "Account", "nav.protection": "Protection", "nav.liveDesk": "Live Desk",
    "nav.community": "Community", "nav.help": "Help", "nav.admin": "Admin", "nav.more": "More",
    "header.workspace": "WORKSPACE", "header.signedIn": "SIGNED IN AS", "header.controlRoom": "Open control room",
    "header.notifications": "Open notifications", "account.title": "Account settings",
    "admin.environmentChanged": "Admin workspace switched to {environment}. Other admins and users are unaffected.",
    "admin.environmentError": "Could not switch the admin workspace.",
    "account.language": "Language preference", "account.languageIntro": "Choose the language used across TradePulse and Telegram.",
    "activation.continue": "Continue", "activation.back": "Back", "activation.join": "Join TradePulse channel",
    "activation.checking": "Checking Telegram…", "activation.recheck": "I joined · recheck",
    "activation.membershipPending": "Membership is not confirmed yet. Join the channel, then recheck.",
    "activation.membershipUnavailable": "We couldn't check your membership. Try again shortly or contact support.",
    "activation.channelIntro": "Join the TradePulse channel, then return here and recheck.",
    "activation.acceptError": "Could not save your terms acceptance.",
    "error.request": "TradePulse could not complete this request. Please try again.",
    "error.timeout": "The request took too long. Please try again.",
    "error.network": "TradePulse could not connect. Check your connection and try again.",
    "error.400": "Please check your information and try again.", "error.401": "Your secure session ended. Reconnect with Telegram to continue.",
    "error.403": "You are not allowed to perform this action.", "error.404": "This item is no longer available.",
    "error.409": "This item changed. Refresh and try again.", "error.429": "Too many requests. Wait a moment and try again.",
    "error.500": "TradePulse is temporarily unavailable. Please try again shortly.", "error.reference": "Reference",
  },
  ru: {
    "nav.dashboard": "Обзор", "nav.bots": "Боты", "nav.synthetic": "Синтетика", "nav.wallet": "Кошелёк",
    "nav.earn": "Доход", "nav.account": "Аккаунт", "nav.protection": "Защита", "nav.liveDesk": "Рынок",
    "nav.community": "Сообщество", "nav.help": "Помощь", "nav.admin": "Админ", "nav.more": "Ещё",
    "header.workspace": "РАБОЧЕЕ ПРОСТРАНСТВО", "header.signedIn": "ВЫ ВОШЛИ КАК", "header.controlRoom": "Открыть панель управления",
    "header.notifications": "Открыть уведомления", "account.title": "Настройки аккаунта",
    "admin.environmentChanged": "Рабочее пространство администратора переключено на {environment}. Это не затрагивает других администраторов и пользователей.",
    "admin.environmentError": "Не удалось переключить рабочее пространство администратора.",
    "account.language": "Язык", "account.languageIntro": "Выберите язык TradePulse и сообщений в Telegram.",
    "activation.continue": "Продолжить", "activation.back": "Назад", "activation.join": "Присоединиться к каналу TradePulse",
    "activation.checking": "Проверяем Telegram…", "activation.recheck": "Я вступил · проверить",
    "activation.membershipPending": "Участие ещё не подтверждено. Вступите в канал и проверьте снова.",
    "activation.membershipUnavailable": "Не удалось проверить участие. Попробуйте позже или обратитесь в поддержку.",
    "activation.channelIntro": "Вступите в канал TradePulse и вернитесь сюда, чтобы проверить участие.",
    "activation.acceptError": "Не удалось сохранить подтверждение условий.",
    "error.request": "Не удалось выполнить запрос. Попробуйте ещё раз.", "error.timeout": "Истекло время ожидания. Попробуйте ещё раз.",
    "error.network": "Не удалось подключиться к TradePulse. Проверьте соединение и повторите попытку.",
    "error.400": "Проверьте введённые данные и попробуйте ещё раз.", "error.401": "Срок защищённого сеанса истёк. Подключитесь снова через Telegram.",
    "error.403": "У вас нет разрешения на это действие.", "error.404": "Этот элемент больше недоступен.",
    "error.409": "Данные изменились. Обновите страницу и повторите попытку.", "error.429": "Слишком много запросов. Подождите и повторите попытку.",
    "error.500": "TradePulse временно недоступен. Попробуйте позже.", "error.reference": "Номер обращения",
  },
  hi: {
    "nav.dashboard": "डैशबोर्ड", "nav.bots": "बॉट", "nav.synthetic": "सिंथेटिक", "nav.wallet": "वॉलेट",
    "nav.earn": "कमाई", "nav.account": "खाता", "nav.protection": "सुरक्षा", "nav.liveDesk": "लाइव डेस्क",
    "nav.community": "समुदाय", "nav.help": "मदद", "nav.admin": "एडमिन", "nav.more": "और",
    "header.workspace": "कार्यस्थान", "header.signedIn": "लॉगिन उपयोगकर्ता", "header.controlRoom": "कंट्रोल रूम खोलें",
    "header.notifications": "सूचनाएँ खोलें", "account.title": "खाता सेटिंग",
    "admin.environmentChanged": "एडमिन कार्यस्थान {environment} पर बदला गया। अन्य एडमिन और उपयोगकर्ता प्रभावित नहीं होंगे।",
    "admin.environmentError": "एडमिन कार्यस्थान नहीं बदला जा सका।",
    "account.language": "भाषा",
    "account.languageIntro": "TradePulse और Telegram संदेशों की भाषा चुनें।",
    "activation.continue": "जारी रखें", "activation.back": "वापस", "activation.join": "TradePulse चैनल से जुड़ें",
    "activation.checking": "Telegram जाँचा जा रहा है…", "activation.recheck": "मैं जुड़ गया · फिर जाँचें",
    "activation.membershipPending": "सदस्यता की पुष्टि नहीं हुई। चैनल से जुड़कर फिर जाँचें।",
    "activation.membershipUnavailable": "सदस्यता जाँची नहीं जा सकी। बाद में फिर कोशिश करें या सहायता लें।",
    "activation.channelIntro": "TradePulse चैनल से जुड़ें, फिर यहाँ लौटकर दोबारा जाँचें।",
    "activation.acceptError": "नियमों की स्वीकृति सहेजी नहीं जा सकी।",
    "error.request": "अनुरोध पूरा नहीं हुआ। फिर से कोशिश करें।", "error.timeout": "अनुरोध में बहुत समय लगा। फिर से कोशिश करें।",
    "error.network": "TradePulse से कनेक्ट नहीं हो सका। कनेक्शन जाँचकर फिर कोशिश करें।",
    "error.400": "जानकारी जाँचकर फिर कोशिश करें।", "error.401": "सुरक्षित सत्र समाप्त हो गया। जारी रखने के लिए Telegram से फिर जुड़ें।",
    "error.403": "आपको यह कार्रवाई करने की अनुमति नहीं है।", "error.404": "यह आइटम अब उपलब्ध नहीं है।",
    "error.409": "यह आइटम बदल गया है। रीफ़्रेश करके फिर कोशिश करें।", "error.429": "बहुत अधिक अनुरोध हैं। थोड़ी देर बाद कोशिश करें।",
    "error.500": "TradePulse अभी उपलब्ध नहीं है। थोड़ी देर बाद कोशिश करें।", "error.reference": "संदर्भ",
  },
  es: {
    "nav.dashboard": "Panel", "nav.bots": "Bots", "nav.synthetic": "Sintéticos", "nav.wallet": "Cartera",
    "nav.earn": "Ganancias", "nav.account": "Cuenta", "nav.protection": "Protección", "nav.liveDesk": "Mercado",
    "nav.community": "Comunidad", "nav.help": "Ayuda", "nav.admin": "Admin", "nav.more": "Más",
    "header.workspace": "ESPACIO DE TRABAJO", "header.signedIn": "SESIÓN DE", "header.controlRoom": "Abrir control",
    "header.notifications": "Abrir notificaciones", "account.title": "Ajustes de cuenta",
    "admin.environmentChanged": "El espacio de administración cambió a {environment}. No afecta a otros administradores ni usuarios.",
    "admin.environmentError": "No se pudo cambiar el espacio de administración.",
    "account.language": "Idioma", "account.languageIntro": "Elige el idioma de TradePulse y de los mensajes de Telegram.",
    "activation.continue": "Continuar", "activation.back": "Atrás", "activation.join": "Unirse al canal de TradePulse",
    "activation.checking": "Comprobando Telegram…", "activation.recheck": "Ya me uní · comprobar",
    "activation.membershipPending": "Aún no se confirma la membresía. Únete al canal y vuelve a comprobarlo.",
    "activation.membershipUnavailable": "No se pudo comprobar la membresía. Inténtalo más tarde o contacta con soporte.",
    "activation.channelIntro": "Únete al canal de TradePulse y vuelve aquí para comprobarlo.",
    "activation.acceptError": "No se pudo guardar la aceptación de los términos.",
    "error.request": "No se pudo completar la solicitud. Inténtalo de nuevo.", "error.timeout": "La solicitud tardó demasiado. Inténtalo de nuevo.",
    "error.network": "No se pudo conectar con TradePulse. Revisa la conexión e inténtalo de nuevo.",
    "error.400": "Revisa la información e inténtalo de nuevo.", "error.401": "La sesión segura terminó. Vuelve a conectar con Telegram.",
    "error.403": "No tienes permiso para realizar esta acción.", "error.404": "Este elemento ya no está disponible.",
    "error.409": "El elemento cambió. Actualiza e inténtalo de nuevo.", "error.429": "Hay demasiadas solicitudes. Espera e inténtalo de nuevo.",
    "error.500": "TradePulse no está disponible temporalmente. Inténtalo más tarde.", "error.reference": "Referencia",
  },
  it: {
    "nav.dashboard": "Riepilogo", "nav.bots": "Bot", "nav.synthetic": "Sintetici", "nav.wallet": "Portafoglio",
    "nav.earn": "Guadagni", "nav.account": "Account", "nav.protection": "Protezione", "nav.liveDesk": "Mercato",
    "nav.community": "Community", "nav.help": "Aiuto", "nav.admin": "Admin", "nav.more": "Altro",
    "header.workspace": "AREA DI LAVORO", "header.signedIn": "ACCESSO COME", "header.controlRoom": "Apri controllo",
    "header.notifications": "Apri notifiche", "account.title": "Impostazioni account",
    "admin.environmentChanged": "Area amministratore passata a {environment}. Gli altri amministratori e utenti non sono coinvolti.",
    "admin.environmentError": "Impossibile cambiare l'area amministratore.",
    "account.language": "Lingua", "account.languageIntro": "Scegli la lingua di TradePulse e dei messaggi Telegram.",
    "activation.continue": "Continua", "activation.back": "Indietro", "activation.join": "Unisciti al canale TradePulse",
    "activation.checking": "Verifica di Telegram…", "activation.recheck": "Mi sono unito · ricontrolla",
    "activation.membershipPending": "Iscrizione non ancora confermata. Unisciti al canale e ricontrolla.",
    "activation.membershipUnavailable": "Impossibile verificare l'iscrizione. Riprova più tardi o contatta l'assistenza.",
    "activation.channelIntro": "Unisciti al canale TradePulse, poi torna qui e ricontrolla.",
    "activation.acceptError": "Impossibile salvare l'accettazione dei termini.",
    "error.request": "Impossibile completare la richiesta. Riprova.", "error.timeout": "La richiesta ha impiegato troppo tempo. Riprova.",
    "error.network": "Impossibile connettersi a TradePulse. Controlla la connessione e riprova.",
    "error.400": "Controlla i dati e riprova.", "error.401": "La sessione sicura è terminata. Riconnettiti con Telegram.",
    "error.403": "Non hai l'autorizzazione per eseguire questa azione.", "error.404": "Questo elemento non è più disponibile.",
    "error.409": "L'elemento è cambiato. Aggiorna e riprova.", "error.429": "Troppe richieste. Attendi e riprova.",
    "error.500": "TradePulse è temporaneamente non disponibile. Riprova più tardi.", "error.reference": "Riferimento",
  },
  zh: {
    "nav.dashboard": "总览", "nav.bots": "机器人", "nav.synthetic": "合成市场", "nav.wallet": "钱包",
    "nav.earn": "收益", "nav.account": "账户", "nav.protection": "保障", "nav.liveDesk": "行情",
    "nav.community": "社区", "nav.help": "帮助", "nav.admin": "管理", "nav.more": "更多",
    "header.workspace": "工作区", "header.signedIn": "当前账户", "header.controlRoom": "打开控制室",
    "header.notifications": "打开通知", "account.title": "账户设置",
    "admin.environmentChanged": "管理员工作区已切换至 {environment}。其他管理员和普通用户不受影响。",
    "admin.environmentError": "无法切换管理员工作区。",
    "account.language": "语言",
    "account.languageIntro": "选择 TradePulse 和 Telegram 消息使用的语言。",
    "activation.continue": "继续", "activation.back": "返回", "activation.join": "加入 TradePulse 频道",
    "activation.checking": "正在检查 Telegram…", "activation.recheck": "我已加入 · 重新检查",
    "activation.membershipPending": "尚未确认已加入。加入频道后请重新检查。",
    "activation.membershipUnavailable": "无法检查加入状态。请稍后重试或联系支持。",
    "activation.channelIntro": "加入 TradePulse 频道后返回此处重新检查。",
    "activation.acceptError": "无法保存您对条款的确认。",
    "error.request": "无法完成请求，请重试。", "error.timeout": "请求超时，请重试。",
    "error.network": "无法连接 TradePulse。请检查网络后重试。", "error.400": "请检查信息后重试。",
    "error.401": "安全会话已结束。请通过 Telegram 重新连接。", "error.403": "您没有权限执行此操作。",
    "error.404": "此项目已不可用。", "error.409": "此项目已更改。请刷新后重试。",
    "error.429": "请求过于频繁。请稍后重试。", "error.500": "TradePulse 暂时不可用，请稍后重试。",
    "error.reference": "参考编号",
  },
  ja: {
    "nav.dashboard": "ダッシュボード", "nav.bots": "ボット", "nav.synthetic": "合成市場", "nav.wallet": "ウォレット",
    "nav.earn": "収益", "nav.account": "アカウント", "nav.protection": "保護", "nav.liveDesk": "マーケット",
    "nav.community": "コミュニティ", "nav.help": "ヘルプ", "nav.admin": "管理", "nav.more": "その他",
    "header.workspace": "ワークスペース", "header.signedIn": "ログイン中", "header.controlRoom": "管理画面を開く",
    "header.notifications": "通知を開く", "account.title": "アカウント設定",
    "admin.environmentChanged": "管理者ワークスペースを {environment} に切り替えました。他の管理者やユーザーには影響しません。",
    "admin.environmentError": "管理者ワークスペースを切り替えられませんでした。",
    "account.language": "言語",
    "account.languageIntro": "TradePulse と Telegram メッセージの言語を選択してください。",
    "activation.continue": "続行", "activation.back": "戻る", "activation.join": "TradePulse チャンネルに参加",
    "activation.checking": "Telegram を確認中…", "activation.recheck": "参加しました · 再確認",
    "activation.membershipPending": "参加を確認できません。チャンネルに参加して再確認してください。",
    "activation.membershipUnavailable": "参加状況を確認できませんでした。後ほど再試行するかサポートに連絡してください。",
    "activation.channelIntro": "TradePulse チャンネルに参加してから、ここに戻って再確認してください。",
    "activation.acceptError": "利用規約への同意を保存できませんでした。",
    "error.request": "リクエストを完了できませんでした。もう一度お試しください。",
    "error.timeout": "リクエストがタイムアウトしました。もう一度お試しください。",
    "error.network": "TradePulse に接続できません。接続を確認して再試行してください。",
    "error.400": "入力内容を確認して再試行してください。", "error.401": "安全なセッションが終了しました。Telegram で再接続してください。",
    "error.403": "この操作を行う権限がありません。", "error.404": "この項目は利用できなくなりました。",
    "error.409": "項目が変更されました。更新して再試行してください。", "error.429": "リクエストが多すぎます。しばらくしてから再試行してください。",
    "error.500": "TradePulse は一時的に利用できません。しばらくしてからお試しください。", "error.reference": "参照番号",
  },
  ro: {
    "nav.dashboard": "Panou", "nav.bots": "Boți", "nav.synthetic": "Sintetice", "nav.wallet": "Portofel",
    "nav.earn": "Câștiguri", "nav.account": "Cont", "nav.protection": "Protecție", "nav.liveDesk": "Piață",
    "nav.community": "Comunitate", "nav.help": "Ajutor", "nav.admin": "Admin", "nav.more": "Mai mult",
    "header.workspace": "SPAȚIU DE LUCRU", "header.signedIn": "CONECTAT CA", "header.controlRoom": "Deschide panoul",
    "header.notifications": "Deschide notificările", "account.title": "Setările contului",
    "admin.environmentChanged": "Spațiul administratorului a fost schimbat la {environment}. Ceilalți administratori și utilizatorii nu sunt afectați.",
    "admin.environmentError": "Spațiul administratorului nu a putut fi schimbat.",
    "account.language": "Limbă", "account.languageIntro": "Alege limba pentru TradePulse și mesajele Telegram.",
    "activation.continue": "Continuă", "activation.back": "Înapoi", "activation.join": "Alătură-te canalului TradePulse",
    "activation.checking": "Se verifică Telegram…", "activation.recheck": "M-am alăturat · verifică din nou",
    "activation.membershipPending": "Aderarea nu este încă confirmată. Alătură-te canalului și verifică din nou.",
    "activation.membershipUnavailable": "Aderarea nu a putut fi verificată. Încearcă mai târziu sau contactează asistența.",
    "activation.channelIntro": "Alătură-te canalului TradePulse, apoi revino aici și verifică din nou.",
    "activation.acceptError": "Acceptarea termenilor nu a putut fi salvată.",
    "error.request": "Solicitarea nu a putut fi finalizată. Încearcă din nou.",
    "error.timeout": "Solicitarea a durat prea mult. Încearcă din nou.",
    "error.network": "Conectarea la TradePulse a eșuat. Verifică conexiunea și încearcă din nou.",
    "error.400": "Verifică informațiile și încearcă din nou.", "error.401": "Sesiunea securizată s-a încheiat. Reconectează-te prin Telegram.",
    "error.403": "Nu ai permisiunea de a efectua această acțiune.", "error.404": "Acest element nu mai este disponibil.",
    "error.409": "Elementul s-a modificat. Reîmprospătează și încearcă din nou.",
    "error.429": "Prea multe solicitări. Așteaptă și încearcă din nou.",
    "error.500": "TradePulse este temporar indisponibil. Încearcă din nou mai târziu.", "error.reference": "Referință",
  },
};

export function translateDesk(language: LanguageCode | string | undefined, key: DeskMessageKey): string {
  const selected = language && language in catalog ? language as LanguageCode : "en";
  return catalog[selected][key] || catalog.en[key];
}

export function localizeApiError(
  language: LanguageCode,
  message: string,
  status: number,
  reference?: string,
): string {
  const translated = language === "en"
    ? message || translateDesk("en", "error.request")
    : translateDesk(language, status === 401 ? "error.401" : status === 400 ? "error.400" :
      status === 403 ? "error.403" : status === 404 ? "error.404" : status === 409 ? "error.409" :
        status === 429 ? "error.429" : status >= 500 ? "error.500" : "error.request");
  return reference ? `${translated} ${translateDesk(language, "error.reference")}: ${reference}` : translated;
}
