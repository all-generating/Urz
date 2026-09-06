import { useState, useEffect, useCallback } from 'react';
import en from './locales/en.json';
import es from './locales/es.json';
import ru from './locales/ru.json';

const translations: Record<string, typeof en> = { en, es, ru };

type Lang = 'en' | 'es' | 'ru';

function App() {
  const [lang, setLang] = useState<Lang>('en');
  const t = translations[lang];
  
  // Get invoke function - safely access Tauri API
  const invoke = useCallback(async (cmd: string, args?: Record<string, unknown>) => {
    if (window.__TAURI__?.core?.invoke) {
      console.log(`[Tauri Invoke] Calling command: ${cmd}`, args);
      try {
        const result = await window.__TAURI__.core.invoke(cmd, args);
        console.log(`[Tauri Invoke] Result for ${cmd}:`, result);
        return result;
      } catch (error) {
        console.error(`[Tauri Invoke] Error for ${cmd}:`, error);
        throw error;
      }
    }
    // Fallback for testing/browser environment
    console.warn(`Tauri invoke not available, mocking command: ${cmd}`);
    if (cmd === 'generate_password_cmd') {
      return { password: 'MOCKED_PASSWORD' };
    }
    return undefined;
  }, []);
  
  const [password, setPassword] = useState('');
  const [salt, setSalt] = useState('');
  const [length, setLength] = useState(16);
  const [useSymbols, setUseSymbols] = useState(false);
  const [result, setResult] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  
  // Generate password whenever inputs change
  useEffect(() => {
    const generate = async () => {
      try {
        const res = await invoke('generate_password_cmd', {
          password,
          salt,
          length,
          useSymbols,
        });
        setResult((res as any)?.password || '');
      } catch (e) {
        console.error(e);
        setResult('');
      }
    };
    generate();
  }, [password, salt, length, useSymbols, invoke]);
  
  const handleCopy = async () => {
    await invoke('copy_to_clipboard', { text: result });
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="container">
      <div className="header">
        <h1 className="title">{t.title}</h1>
        <div className="lang-selector">
          <button onClick={() => setShowLangMenu(!showLangMenu)} className="lang-btn" title={t.selectLanguage}>
            {lang.toUpperCase()} ▼
          </button>
          {showLangMenu && (
            <div className="lang-menu">
              <button onClick={() => { setLang('en'); setShowLangMenu(false); }}>English</button>
              <button onClick={() => { setLang('es'); setShowLangMenu(false); }}>Español</button>
              <button onClick={() => { setLang('ru'); setShowLangMenu(false); }}>Русский</button>
            </div>
          )}
        </div>
      </div>
      
      <div className="input-group">
        <label>{t.yourPassword}</label>
        <input
          type="text"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t.passwordPlaceholder}
          className="input-field"
        />
      </div>

      <div className="input-group">
        <label>{t.salt}</label>
        <input
          type="text"
          value={salt}
          onChange={(e) => setSalt(e.target.value)}
          placeholder={t.saltPlaceholder}
          className="input-field"
        />
      </div>

      <div className="input-group">
        <label>{t.length}: {length}</label>
        <input
          type="range"
          min="6"
          max="64"
          value={length}
          onChange={(e) => setLength(Number(e.target.value))}
          className="slider"
        />
      </div>

      <div className="input-group toggle-group">
        <label htmlFor="symbols-toggle">{t.symbols}</label>
        <button
          id="symbols-toggle"
          onClick={() => setUseSymbols(!useSymbols)}
          className={`toggle ${useSymbols ? 'active' : ''}`}
          aria-label={t.symbols}
        >
          <span className="toggle-indicator" />
        </button>
      </div>

      <div className="input-group">
        <div className="result-container">
          <input
            type={showPassword ? 'text' : 'password'}
            value={result}
            readOnly
            className="result-field"
            placeholder={t.result}
          />
          <button
            onClick={() => setShowPassword(!showPassword)}
            className="toggle-btn"
            title={showPassword ? t.hidePassword : t.showPassword}
          >
            {showPassword ? (
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      <button
        onClick={handleCopy}
        className={`copy-btn ${copied ? 'copied' : ''}`}
      >
        {copied ? `✓ ${t.copied}` : t.copyToClipboard}
      </button>
    </div>
  );
}

export default App;
