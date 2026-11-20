import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext.tsx';

const T = {
  en: {
    brand: 'Aura Store and Perfume',
    eyebrow: 'Boutique Inventory & POS',
    head: 'Every piece counted. Every sale <em>accounted for.</em>',
    pitch: 'Stock, sales and reports for the shop floor, in one quiet, fast terminal.',
    online: 'Terminal online',
    location: 'Hawassa Piyassa Mall · 1st Floor',
    title: 'Welcome back',
    sub: 'Sign in to the Aura Store and Perfume terminal.',
    user: 'Email or username',
    pass: 'Password',
    caps: 'Caps Lock is on',
    keep: 'Keep me signed in',
    forgot: 'Forgot password?',
    go: 'Login',
    secure: 'Authorized personnel only. Activity is logged.',
    need: 'Enter your email or username and password.',
    bad: 'Incorrect email/username or password.',
    busy: 'Signing in…',
    ph1: 'admin@aurastore.et',
    ph2: 'Enter your password',
    btn: 'Language',
    footer: 'Aura Store and Perfume © 2026 · Hawassa, Ethiopia',
    forgotModalTitle: 'Reset Terminal Access',
    forgotModalBody: 'To reset your password or regain terminal access, please contact the boutique system administrator or IT security at admin@aurastore.et or call +251 91 123 4567.',
    close: 'Close'
  },
  am: {
    brand: 'Aura Store and Perfume',
    eyebrow: 'የቡቲክ ክምችት እና ሽያጭ',
    head: 'እያንዳንዱ ዕቃ ተቆጥሯል። እያንዳንዱ ሽያጭ <em>ተመዝግቧል።</em>',
    pitch: 'ክምችት፣ ሽያጭ እና ሪፖርቶች በአንድ ፈጣንና ንጹሕ ተርሚናል።',
    online: 'ተርሚናል በመስመር ላይ ነው',
    location: 'ሐዋሳ ፒያሳ ሞል · 1ኛ ፎቅ',
    title: 'እንኳን ደህና መጡ',
    sub: 'ወደ Aura Store and Perfume ተርሚናል ይግቡ።',
    user: 'ኢሜይል ወይም የተጠቃሚ ስም',
    pass: 'የይለፍ ቃል',
    caps: 'Caps Lock በርቷል',
    keep: 'ገብቼ ልቆይ',
    forgot: 'የይለፍ ቃል ረስተዋል?',
    go: 'ግባ',
    secure: 'ለተፈቀደላቸው ሠራተኞች ብቻ። እንቅስቃሴ ይመዘገባል።',
    need: 'ኢሜይል ወይም የተጠቃሚ ስም እና የይለፍ ቃል ያስገቡ።',
    bad: 'ኢሜይሉ/የተጠቃሚ ስሙ ወይም የይለፍ ቃሉ ትክክል አይደለም።',
    busy: 'በመግባት ላይ…',
    ph1: 'admin@aurastore.et',
    ph2: 'የይለፍ ቃልዎን ያስገቡ',
    btn: 'ቋንቋ',
    footer: 'Aura Store and Perfume © 2026 · ሐዋሳ፣ ኢትዮጵያ',
    forgotModalTitle: 'የተርሚናል መዳረሻ መልሶ ማግኘት',
    forgotModalBody: 'የይለፍ ቃልዎን ዳግም ለማስጀመር ወይም የተርሚናል መዳረሻ ለማግኘት፣ እባክዎ የቡቲክ አስተዳዳሪውን በ admin@aurastore.et ወይም በስልክ ቁጥር +251 91 123 4567 ያግኙ።',
    close: 'ዝጋ'
  }
};

export function LoginView() {
  const { login } = useAuth();

  const [lang, setLang] = useState<'en' | 'am'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('aura_lang');
      if (saved === 'am' || saved === 'en') return saved;
    }
    return 'en';
  });

  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const rootTheme = document.documentElement.getAttribute('data-theme');
      if (rootTheme === 'dark') return true;
      if (rootTheme === 'light') return false;
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const [credential, setCredential] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [capsLockOn, setCapsLockOn] = useState<boolean>(false);
  const [keepSignedIn, setKeepSignedIn] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [shake, setShake] = useState<boolean>(false);
  const [showForgotModal, setShowForgotModal] = useState<boolean>(false);

  // Live Clock in Africa/Addis_Ababa
  const [timeStr, setTimeStr] = useState<string>('--:--');
  const [dateStr, setDateStr] = useState<string>('');

  const passwordInputRef = useRef<HTMLInputElement>(null);

  // Sync lang & theme to document
  useEffect(() => {
    document.documentElement.lang = lang;
    localStorage.setItem('aura_lang', lang);
  }, [lang]);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.setAttribute('data-theme', 'dark');
      localStorage.setItem('aura_theme', 'dark');
    } else {
      root.setAttribute('data-theme', 'light');
      localStorage.setItem('aura_theme', 'light');
    }
  }, [isDark]);

  // Live Addis Ababa clock
  useEffect(() => {
    const updateClock = () => {
      try {
        const now = new Date();
        const timeZone = 'Africa/Addis_Ababa';
        const formattedTime = new Intl.DateTimeFormat('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
          timeZone
        }).format(now);

        const formattedDate = new Intl.DateTimeFormat(lang === 'am' ? 'am-ET' : 'en-GB', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          timeZone
        }).format(now);

        setTimeStr(formattedTime);
        setDateStr(formattedDate);
      } catch {
        const now = new Date();
        setTimeStr(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
        setDateStr(now.toLocaleDateString());
      }
    };

    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, [lang]);

  const toggleLang = () => {
    setLang(l => (l === 'en' ? 'am' : 'en'));
  };

  const toggleTheme = () => {
    setIsDark(d => !d);
  };

  const triggerError = (msg: string) => {
    setErrorMsg(msg);
    setShake(true);
    setTimeout(() => setShake(false), 450);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = T[lang];

    if (!credential.trim() || !password) {
      triggerError(t.need);
      return;
    }

    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      await login(credential.trim(), password, keepSignedIn);
      // Successful login automatically navigates via AuthContext state change in App.tsx
    } catch (err: any) {
      console.error('[Sign-in Error]', err);
      const isBadCred =
        err?.status === 401 ||
        err?.message?.toLowerCase().includes('invalid') ||
        err?.message?.toLowerCase().includes('credentials');

      const messageToDisplay = isBadCred ? t.bad : err?.message || t.bad;
      triggerError(messageToDisplay);
      setPassword('');
      if (passwordInputRef.current) {
        passwordInputRef.current.focus();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (typeof e.getModifierState === 'function') {
      setCapsLockOn(e.getModifierState('CapsLock'));
    }
  };

  const t = T[lang];

  return (
    <div className={`aura-login-root ${lang === 'am' ? 'am' : ''}`}>
      {/* Embedded High-Fidelity Luxury Typography & Design Tokens */}
      <style>{`
        .aura-login-root {
          --font: "DM Sans", "Noto Sans Ethiopic", system-ui, sans-serif;
          --bg: #FAF8F5;
          --surface: #FFFFFF;
          --ink: #1A1A18;
          --muted: #6B6B66;
          --line: #E7E2DA;
          --gold: #B8935A;
          --gold-soft: rgba(184, 147, 90, 0.16);
          --danger: #B42318;
          --danger-bg: #FEF3F2;
          --panel: #1C1B19;
          --panel-ink: #F5F1EA;
          --panel-muted: #A8A097;
          --btn: #1C1B19;
          --btn-ink: #FFFFFF;
          --shadow: 0 1px 2px rgba(28, 27, 25, 0.04), 0 24px 48px -24px rgba(28, 27, 25, 0.18);
          font-family: var(--font);
          background: var(--bg);
          color: var(--ink);
          min-height: 100vh;
          width: 100%;
          transition: background 0.3s, color 0.3s;
          -webkit-font-smoothing: antialiased;
        }

        :root[data-theme="dark"] .aura-login-root,
        .aura-login-root.dark {
          --bg: #141311;
          --surface: #1D1B18;
          --ink: #F5F1EA;
          --muted: #A39C92;
          --line: #33302B;
          --gold: #C9A46A;
          --gold-soft: rgba(201, 164, 106, 0.18);
          --danger: #FDA29B;
          --danger-bg: rgba(180, 35, 24, 0.16);
          --panel: #0E0D0C;
          --panel-ink: #F5F1EA;
          --panel-muted: #8F887E;
          --btn: #C9A46A;
          --btn-ink: #1C1B19;
          --shadow: 0 1px 2px rgba(0, 0, 0, 0.4), 0 24px 48px -24px rgba(0, 0, 0, 0.7);
        }

        .aura-shell {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1.05fr 1fr;
        }

        @media (max-width: 900px) {
          .aura-shell {
            grid-template-columns: 1fr;
          }
          .aura-panel {
            display: none !important;
          }
          .aura-mobile-brand {
            display: flex !important;
          }
        }

        /* Brand Left Editorial Panel */
        .aura-panel {
          position: relative;
          overflow: hidden;
          background: var(--panel);
          color: var(--panel-ink);
          padding: clamp(36px, 5vw, 56px);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .aura-panel::before {
          content: "";
          position: absolute;
          inset: 0;
          background:
            radial-gradient(60% 50% at 15% 8%, var(--gold-soft), transparent 70%),
            radial-gradient(50% 40% at 95% 100%, var(--gold-soft), transparent 70%);
          pointer-events: none;
        }

        .aura-weave {
          position: absolute;
          inset: 0;
          opacity: 0.09;
          background:
            repeating-linear-gradient(45deg, var(--gold) 0 1px, transparent 1px 14px),
            repeating-linear-gradient(-45deg, var(--gold) 0 1px, transparent 1px 14px);
          -webkit-mask-image: radial-gradient(70% 60% at 70% 75%, #000, transparent 75%);
          mask-image: radial-gradient(70% 60% at 70% 75%, #000, transparent 75%);
          pointer-events: none;
        }

        .aura-big-mark {
          position: absolute;
          right: -80px;
          bottom: -110px;
          width: 520px;
          height: 520px;
          opacity: 0.07;
          color: var(--gold);
          pointer-events: none;
        }

        .aura-brand {
          position: relative;
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .aura-brand .aura-name {
          font-size: 13px;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: var(--panel-muted);
          font-weight: 500;
        }

        .aura-logo {
          width: 44px;
          height: 44px;
          color: var(--gold);
          flex-shrink: 0;
        }

        .aura-pitch {
          position: relative;
          max-width: 470px;
          margin-top: 40px;
          margin-bottom: 40px;
        }

        .aura-eyebrow {
          font-size: 11px;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: var(--gold);
          font-weight: 600;
        }

        .aura-pitch h2 {
          font-family: var(--font);
          font-weight: 500;
          font-size: clamp(34px, 4.2vw, 52px);
          line-height: 1.08;
          letter-spacing: -0.02em;
          margin-top: 20px;
        }

        .aura-pitch h2 em {
          font-style: italic;
          color: var(--gold);
        }

        .aura-pitch p {
          margin-top: 20px;
          font-size: 15px;
          line-height: 1.65;
          color: var(--panel-muted);
          max-width: 400px;
        }

        .aura-foot {
          position: relative;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          font-size: 12px;
          color: var(--panel-muted);
          gap: 20px;
        }

        .aura-clock {
          font-family: var(--font);
          font-size: 28px;
          color: var(--panel-ink);
          letter-spacing: -0.01em;
          font-variant-numeric: tabular-nums;
          line-height: 1.1;
        }

        .aura-clock small {
          display: block;
          font-family: var(--font);
          font-size: 11px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--panel-muted);
          margin-top: 6px;
        }

        .aura-live {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          font-weight: 500;
        }

        .aura-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #3DBE7A;
          box-shadow: 0 0 0 0 rgba(61, 190, 122, 0.6);
          animation: aura-pulse 2s infinite;
        }

        @keyframes aura-pulse {
          70% { box-shadow: 0 0 0 8px rgba(61, 190, 122, 0); }
          100% { box-shadow: 0 0 0 0 rgba(61, 190, 122, 0); }
        }

        /* Form Side */
        .aura-side {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: clamp(60px, 8vh, 88px) 24px 40px;
        }

        .aura-tools {
          position: absolute;
          top: 24px;
          right: 24px;
          display: flex;
          gap: 8px;
          z-index: 10;
        }

        .aura-chip {
          height: 36px;
          min-width: 36px;
          padding: 0 12px;
          border-radius: 10px;
          border: 1px solid var(--line);
          background: var(--surface);
          color: var(--muted);
          font: 500 12px inherit;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: 0.2s;
        }

        .aura-chip:hover {
          color: var(--ink);
          border-color: var(--gold);
        }

        .aura-chip:focus-visible,
        .aura-eye:focus-visible,
        .aura-btn:focus-visible,
        .aura-row button.link:focus-visible {
          outline: 2px solid var(--gold);
          outline-offset: 2px;
        }

        .aura-wrap {
          width: 100%;
          max-width: 410px;
          animation: aura-rise 0.7s cubic-bezier(0.2, 0.7, 0.2, 1) both;
        }

        @keyframes aura-rise {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: none; }
        }

        .aura-mobile-brand {
          display: none;
          align-items: center;
          gap: 12px;
          margin-bottom: 28px;
          color: var(--gold);
        }

        .aura-mobile-brand span {
          font-size: 12px;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: var(--muted);
          font-weight: 500;
        }

        .aura-wrap h1 {
          font-family: var(--font);
          font-weight: 500;
          font-size: clamp(30px, 3.5vw, 36px);
          letter-spacing: -0.02em;
          margin: 0;
        }

        .aura-sub {
          margin-top: 8px;
          font-size: 14px;
          color: var(--muted);
          line-height: 1.5;
        }

        .aura-card {
          margin-top: 28px;
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: 20px;
          padding: 28px;
          box-shadow: var(--shadow);
          transition: background 0.3s, border-color 0.3s;
        }

        .aura-card.shake {
          animation: aura-shake 0.4s;
        }

        @keyframes aura-shake {
          20%, 60% { transform: translateX(-6px); }
          40%, 80% { transform: translateX(6px); }
        }

        .aura-f + .aura-f {
          margin-top: 20px;
        }

        label.aura-l {
          display: block;
          font-size: 13px;
          font-weight: 500;
          margin-bottom: 7px;
          color: var(--ink);
        }

        .aura-in {
          position: relative;
        }

        .aura-in input {
          width: 100%;
          height: 50px;
          border-radius: 12px;
          border: 1px solid var(--line);
          background: transparent;
          color: var(--ink);
          font: inherit;
          font-size: 14.5px;
          padding: 0 16px 0 46px;
          outline: none;
          transition: 0.2s;
        }

        .aura-in input::placeholder {
          color: var(--muted);
          opacity: 0.7;
        }

        .aura-in input:focus {
          border-color: var(--gold);
          box-shadow: 0 0 0 4px var(--gold-soft);
        }

        .aura-in svg.aura-i {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          width: 18px;
          height: 18px;
          color: var(--muted);
          transition: 0.2s;
          pointer-events: none;
        }

        .aura-in input:focus ~ svg.aura-i {
          color: var(--gold);
        }

        .aura-eye {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          width: 34px;
          height: 34px;
          border-radius: 9px;
          border: 0;
          background: transparent;
          color: var(--muted);
          cursor: pointer;
          display: grid;
          place-items: center;
          transition: 0.2s;
        }

        .aura-eye:hover {
          background: var(--gold-soft);
          color: var(--ink);
        }

        .aura-caps {
          display: none;
          margin-top: 7px;
          font-size: 12px;
          color: #B54708;
        }

        .aura-caps.on {
          display: block;
        }

        .aura-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 18px;
          font-size: 13px;
        }

        .aura-chk {
          display: flex;
          gap: 9px;
          align-items: center;
          cursor: pointer;
          color: var(--muted);
          user-select: none;
        }

        .aura-chk input {
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 6px;
          border: 1.5px solid var(--line);
          display: grid;
          place-items: center;
          cursor: pointer;
          transition: 0.2s;
          background: transparent;
        }

        .aura-chk input:checked {
          background: var(--gold);
          border-color: var(--gold);
        }

        .aura-chk input:checked::after {
          content: "";
          width: 9px;
          height: 5px;
          border: 2px solid #1C1B19;
          border-top: 0;
          border-right: 0;
          transform: rotate(-45deg) translate(1px, -1px);
        }

        .aura-row button.link {
          background: transparent;
          border: none;
          padding: 0;
          font: inherit;
          color: var(--muted);
          font-weight: 500;
          cursor: pointer;
          transition: 0.2s;
        }

        .aura-row button.link:hover {
          color: var(--ink);
          text-decoration: underline;
          text-underline-offset: 4px;
        }

        .aura-err {
          display: none;
          margin-top: 18px;
          padding: 11px 13px;
          border-radius: 12px;
          background: var(--danger-bg);
          color: var(--danger);
          font-size: 13px;
          line-height: 1.45;
          gap: 9px;
          align-items: flex-start;
        }

        .aura-err.on {
          display: flex;
        }

        .aura-err svg {
          width: 16px;
          height: 16px;
          flex: none;
          margin-top: 2px;
        }

        .aura-btn {
          margin-top: 22px;
          width: 100%;
          height: 52px;
          border: 0;
          border-radius: 14px;
          background: var(--btn);
          color: var(--btn-ink);
          font: 600 13px inherit;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: transform 0.15s, box-shadow 0.2s, filter 0.2s;
          box-shadow: 0 8px 20px -10px rgba(28, 27, 25, 0.6);
        }

        .aura-login-root.am .aura-btn,
        .aura-login-root.am .aura-eyebrow,
        .aura-login-root.am .aura-brand .aura-name {
          letter-spacing: 0.02em;
          text-transform: none;
          font-size: 14px;
        }

        .aura-btn:hover:not([disabled]) {
          filter: brightness(1.12);
          box-shadow: 0 12px 26px -10px rgba(28, 27, 25, 0.7);
        }

        .aura-btn:active:not([disabled]) {
          transform: scale(0.99);
        }

        .aura-btn[disabled] {
          opacity: 0.65;
          cursor: progress;
        }

        .aura-btn svg.arrow {
          width: 16px;
          height: 16px;
          transition: transform 0.2s;
        }

        .aura-btn:hover:not([disabled]) svg.arrow {
          transform: translateX(3px);
        }

        .aura-spin {
          animation: aura-sp 0.8s linear infinite;
        }

        @keyframes aura-sp {
          to { transform: rotate(360deg); }
        }

        .aura-secure {
          margin-top: 22px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: var(--muted);
        }

        .aura-secure svg {
          width: 15px;
          height: 15px;
          color: var(--gold);
          flex-shrink: 0;
        }

        .aura-legal {
          margin-top: 26px;
          font-size: 11px;
          color: var(--muted);
          opacity: 0.8;
        }

        /* Modal styling */
        .aura-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.55);
          backdrop-filter: blur(4px);
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .aura-modal {
          background: var(--surface);
          color: var(--ink);
          border: 1px solid var(--line);
          border-radius: 18px;
          width: 100%;
          max-width: 440px;
          padding: 26px;
          box-shadow: var(--shadow);
          animation: aura-rise 0.25s ease-out;
        }

        .aura-modal h3 {
          font-size: 17px;
          font-weight: 600;
          margin-bottom: 10px;
          color: var(--ink);
        }

        .aura-modal p {
          font-size: 13.5px;
          line-height: 1.55;
          color: var(--muted);
          margin-bottom: 22px;
        }

        @media (prefers-reduced-motion: reduce) {
          * {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>

      {/* Boutique SVG Monogram Symbol Definition */}
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <symbol id="mark" viewBox="0 0 48 48">
          <rect x="1.5" y="1.5" width="45" height="45" rx="13" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M15 12v24M33 12v24M15 24h18" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          <circle cx="24" cy="24" r="2.6" fill="currentColor" />
        </symbol>
      </svg>

      <div className="aura-shell">
        {/* Left Side: Editorial Brand Panel */}
        <aside className="aura-panel">
          <div className="aura-weave" />
          <svg className="aura-big-mark" aria-hidden="true">
            <use href="#mark" />
          </svg>

          <div className="aura-brand">
            <svg className="aura-logo" aria-hidden="true">
              <use href="#mark" />
            </svg>
            <span className="aura-name">{t.brand}</span>
          </div>

          <div className="aura-pitch">
            <p className="aura-eyebrow">{t.eyebrow}</p>
            <h2 dangerouslySetInnerHTML={{ __html: t.head }} />
            <p>{t.pitch}</p>
          </div>

          <div className="aura-foot">
            <div className="aura-clock">
              <span>{timeStr}</span>
              <small>{dateStr}</small>
            </div>
            <div style={{ textAlign: 'right', lineHeight: 1.7 }}>
              <div className="aura-live">
                <span className="aura-dot" />
                <span>{t.online}</span>
              </div>
              <div>{t.location}</div>
            </div>
          </div>
        </aside>

        {/* Right Side: Form Panel */}
        <main className="aura-side">
          {/* Top-Right Tools: Language and Theme Toggle */}
          <div className="aura-tools">
            <button
              className="aura-chip"
              type="button"
              onClick={toggleLang}
              aria-label="Switch language (EN / አማ)"
            >
              {lang === 'en' ? 'አማ' : 'EN'}
            </button>

            <button
              className="aura-chip"
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle dark/light mode"
            >
              {isDark ? (
                // Sun Icon for Light Mode Switch
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                // Moon Icon for Dark Mode Switch
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
                </svg>
              )}
            </button>
          </div>

          <div className="aura-wrap">
            {/* Mobile Brand Header */}
            <div className="aura-mobile-brand">
              <svg width="34" height="34" aria-hidden="true">
                <use href="#mark" />
              </svg>
              <span>{t.brand}</span>
            </div>

            <h1>{t.title}</h1>
            <p className="aura-sub">{t.sub}</p>

            {/* Sign-in Form Card */}
            <form
              className={`aura-card ${shake ? 'shake' : ''}`}
              onSubmit={handleSubmit}
              noValidate
            >
              {/* Field 1: Email or Username */}
              <div className="aura-f">
                <label className="aura-l" htmlFor="aura-user">
                  {t.user}
                </label>
                <div className="aura-in">
                  <input
                    id="aura-user"
                    type="text"
                    autoComplete="username"
                    placeholder={t.ph1}
                    value={credential}
                    onChange={e => setCredential(e.target.value)}
                    autoFocus
                  />
                  <svg
                    className="aura-i"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 21a8 8 0 0 1 16 0" />
                  </svg>
                </div>
              </div>

              {/* Field 2: Password */}
              <div className="aura-f">
                <label className="aura-l" htmlFor="aura-pass">
                  {t.pass}
                </label>
                <div className="aura-in">
                  <input
                    id="aura-pass"
                    ref={passwordInputRef}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder={t.ph2}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyUp={handlePasswordKey}
                    onKeyDown={handlePasswordKey}
                    onBlur={() => setCapsLockOn(false)}
                    style={{ paddingRight: '50px' }}
                  />
                  <svg
                    className="aura-i"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="4" y="11" width="16" height="10" rx="2.5" />
                    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                  </svg>
                  <button
                    type="button"
                    className="aura-eye"
                    onClick={() => setShowPassword(s => !s)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      width="18"
                      height="18"
                    >
                      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
                      {!showPassword ? (
                        <circle cx="12" cy="12" r="3" />
                      ) : (
                        <line x1="2" y1="2" x2="22" y2="22" strokeWidth="2" />
                      )}
                    </svg>
                  </button>
                </div>
                <p className={`aura-caps ${capsLockOn ? 'on' : ''}`}>
                  {t.caps}
                </p>
              </div>

              {/* Row: Keep Me Signed In & Forgot Password */}
              <div className="aura-row">
                <label className="aura-chk">
                  <input
                    type="checkbox"
                    checked={keepSignedIn}
                    onChange={e => setKeepSignedIn(e.target.checked)}
                  />
                  <span>{t.keep}</span>
                </label>
                <button
                  type="button"
                  className="link"
                  onClick={() => setShowForgotModal(true)}
                >
                  {t.forgot}
                </button>
              </div>

              {/* Localized Error Feedback with Shake */}
              <div className={`aura-err ${errorMsg ? 'on' : ''}`} role="alert" aria-live="polite">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 3 2 21h20L12 3z" />
                  <path d="M12 10v5M12 18h.01" />
                </svg>
                <span>{errorMsg}</span>
              </div>

              {/* Submit Button */}
              <button
                className="aura-btn"
                type="submit"
                disabled={isSubmitting}
              >
                <span>{isSubmitting ? t.busy : t.go}</span>
                {isSubmitting ? (
                  <svg className="aura-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="12" />
                  </svg>
                ) : (
                  <svg
                    className="arrow"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                )}
              </button>
            </form>

            {/* Security Notice */}
            <div className="aura-secure">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 3l8 3v6c0 5-3.4 8-8 9-4.6-1-8-4-8-9V6l8-3z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
              <span>{t.secure}</span>
            </div>

            <p className="aura-legal">{t.footer}</p>
          </div>
        </main>
      </div>

      {/* Forgot Password / Access Reset Modal */}
      {showForgotModal && (
        <div
          className="aura-modal-backdrop"
          onClick={() => setShowForgotModal(false)}
        >
          <div
            className="aura-modal"
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <h3>{t.forgotModalTitle}</h3>
            <p>{t.forgotModalBody}</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                className="aura-chip"
                type="button"
                onClick={() => setShowForgotModal(false)}
                style={{
                  background: 'var(--btn)',
                  color: 'var(--btn-ink)',
                  borderColor: 'transparent',
                  padding: '0 18px',
                  height: '38px',
                  fontWeight: 600
                }}
              >
                {t.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
