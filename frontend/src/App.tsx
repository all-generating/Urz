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
      if (!password) {
        setResult('');
        return;
      }
      try {
        const res = await invoke('generate_password_cmd', {
          req: { password, salt, length, useSymbols },
        });
        setResult((res as any).password);
      } catch (e) {
        console.error(e);
      }
    };
    generate();
  }, [password, salt, length, useSymbols]);

  const handleCopy = async () => {
    if (result) {
      await invoke('copy_to_clipboard', { text: result });
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
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
        <label>Result</label>
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
          >
            {showPassword ? '🙈' : '👁'}
          </button>
        </div>
      </div>

      <button
        onClick={handleCopy}
        disabled={!result}
        className={`copy-btn ${copied ? 'copied' : ''}`}
      >
        {copied ? '✓ Copied!' : 'Copy to clipboard'}
      </button>
    </div>
  );
}

export default App;
