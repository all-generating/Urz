import { useState, useEffect } from 'react';

const { invoke } = window.__TAURI__.core;

function App() {
  const [password, setPassword] = useState('');
  const [salt, setSalt] = useState('');
  const [length, setLength] = useState(16);
  const [useSymbols, setUseSymbols] = useState(false);
  const [result, setResult] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Generate password whenever inputs change
  useEffect(() => {
    const generate = async () => {
      try {
        const res = await invoke('generate_password_cmd', {
          req: { password, salt, length, useSymbols },
        });
        setResult((res as any).password);
      } catch (e) {
        console.error(e);
        setResult('');
      }
    };
    generate();
  }, [password, salt, length, useSymbols]);
  
  const handleCopy = async () => {
    await invoke('copy_to_clipboard', { text: result });
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="container">
      <h1 className="title">Urz</h1>
      
      <div className="input-group">
        <label>Your password</label>
        <input
          type="text"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          className="input-field"
        />
      </div>

      <div className="input-group">
        <label>Salt</label>
        <input
          type="text"
          value={salt}
          onChange={(e) => setSalt(e.target.value)}
          placeholder="Enter salt"
          className="input-field"
        />
      </div>

      <div className="input-group">
        <label>Length: {length}</label>
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
        <label>Symbols</label>
        <button
          onClick={() => setUseSymbols(!useSymbols)}
          className={`toggle ${useSymbols ? 'active' : ''}`}
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
            placeholder="Generated password"
          />
          <button
            onClick={() => setShowPassword(!showPassword)}
            className="toggle-btn"
            title={showPassword ? 'Hide' : 'Show'}
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
        {copied ? '✓ Copied!' : 'Copy to clipboard'}
      </button>
    </div>
  );
}

export default App;
