
import React, { useState, useRef, useEffect } from "react";
import PianoKeys from "./PianoKeys";
import Soundfont from "soundfont-player";
import { generatePrimes, toGrid, audioBufferToWav } from "./PrimeUtils";
import { FaPlay } from "@react-icons/all-files/fa/FaPlay";
import { FaStop } from "@react-icons/all-files/fa/FaStop";
import { FaFileDownload } from "@react-icons/all-files/fa/FaFileDownload";
import { FaQuestionCircle } from "@react-icons/all-files/fa/FaQuestionCircle";
import { FaDownload } from "@react-icons/all-files/fa/FaDownload";
import "./PrimePiano.scss";

const PrimeGridPlayer = () => {
  const [tab, setTab] = useState("grid");
  const [rows, setRows] = useState(4);
  const [cols, setCols] = useState(5);
  const [count, setCount] = useState(20);
  const [startIndex, setStartIndex] = useState(1);
  const [primesGrid, setPrimesGrid] = useState([]);
  const [flatPrimes, setFlatPrimes] = useState([]);
  const [displayedPrimes, setDisplayedPrimes] = useState([]);
  const [currentPrime, setCurrentPrime] = useState(null);
  const [currentMidi, setCurrentMidi] = useState(null);
  const [piano, setPiano] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [mappingStrategy, setMappingStrategy] = useState("mirror");

  const audioCtx = useRef(new (window.AudioContext || window.webkitAudioContext)());
  const timeoutIds = useRef([]);

  const primesPerRow = 10;

  useEffect(() => {
    Soundfont.instrument(audioCtx.current, "acoustic_grand_piano")
      .then((inst) => setPiano(inst))
      .catch(console.error);
  }, []);

  const mappingInfo = {
    mirror: "Reflects primes around middle C, alternating above and below.",
    cscale: "Maps primes onto degrees of the C major scale.",
    harmonic: "Turns each prime into a chord (root + major 3rd + 5th).",
    spiral: "Walks upward through the keyboard cyclically, like a spiral.",
    factors: "Number of prime factors determines chord size and richness.",
  };

  const mapPrimesToMidis = (primes, strategy) => {
    if (!primes || primes.length === 0) return [];
    const clampMidi = (m) => Math.max(21, Math.min(108, m));

    switch (strategy) {
      case "cscale": {
        const scale = [0, 2, 4, 5, 7, 9, 11];
        return primes.map((p, idx) => {
          const degree = p % scale.length;
          const octaveOffset = Math.floor(idx / scale.length);
          const baseC = 60;
          return clampMidi(baseC + octaveOffset * 12 + scale[degree]);
        });
      }

      case "harmonic": {
        return primes.map((p) => {
          let root = 36 + (p % 36);
          root = clampMidi(root);
          return [root, clampMidi(root + 4), clampMidi(root + 7)];
        });
      }

      case "spiral": {
        return primes.map((_, i) => {
          return clampMidi(21 + (i % 88));
        });
      }

      case "mirror": {
        return primes.map((p, i) => {
          const offset = p % 24;
          return i % 2 === 0 ? clampMidi(60 + offset) : clampMidi(60 - offset);
        });
      }

      case "factors": {
        const primeFactorsCount = (n) => {
          let count = 0, num = n, d = 2;
          while (num > 1) {
            while (num % d === 0) {
              count++;
              num /= d;
            }
            d++;
          }
          return count || 1;
        };
        return primes.map((p) => {
          const factors = primeFactorsCount(p);
          const root = clampMidi(40 + (p % 24));
          const chord = [root];
          if (factors >= 2) chord.push(clampMidi(root + 3));
          if (factors >= 3) chord.push(clampMidi(root + 7));
          if (factors >= 4) chord.push(clampMidi(root + 10));
          return chord;
        });
      }

      default:
        return primes.map(() => 60);
    }
  };

  const handleTabChange = (newTab) => {
    setTab(newTab);
    setPrimesGrid([]);
    setFlatPrimes([]);
    setDisplayedPrimes([]);
    setCurrentPrime(null);
    setCurrentMidi(null);
    handleStop();
  };

  const handleGenerate = () => {
    handleStop();
    let primes;
    if (tab === "grid") {
      const total = rows * cols;
      primes = generatePrimes(total);
      setPrimesGrid(toGrid(primes, cols, rows));
      setFlatPrimes(primes);
    } else {
      primes = generatePrimes(count, startIndex);
      setPrimesGrid([]);
      setFlatPrimes(primes);
    }
    setCurrentPrime(null);
    setCurrentMidi(null);
    setDisplayedPrimes([]);

    let index = 0;
    const interval = setInterval(() => {
      if (index < primes.length) {
        setDisplayedPrimes(primes.slice(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
      }
    }, tab === "count" ? 100 : 50);
  };

  const handlePlay = async () => {
    if (!piano || flatPrimes.length === 0 || isPlaying) return;
    setIsPlaying(true);
    setCurrentPrime(null);
    setCurrentMidi(null);

    const midiMapping = mapPrimesToMidis(flatPrimes, mappingStrategy);

    midiMapping.forEach((midiOrArray, i) => {
      const playTime = audioCtx.current.currentTime + i * 0.4;
      if (Array.isArray(midiOrArray)) {
        midiOrArray.forEach((m) => piano.play(m, playTime, { duration: 0.4 }));
      } else {
        piano.play(midiOrArray, playTime, { duration: 0.4 });
      }
      const timeoutId = setTimeout(() => {
        setCurrentPrime(flatPrimes[i]);
        setCurrentMidi(midiOrArray);
      }, i * 400);
      timeoutIds.current.push(timeoutId);
    });

    const finalTimeoutId = setTimeout(() => {
      setCurrentPrime(null);
      setCurrentMidi(null);
      setIsPlaying(false);
      timeoutIds.current = [];
    }, flatPrimes.length * 400 + 50);
    timeoutIds.current.push(finalTimeoutId);
  };

  const handleStop = () => {
    timeoutIds.current.forEach(clearTimeout);
    timeoutIds.current = [];
    setCurrentPrime(null);
    setCurrentMidi(null);
    setIsPlaying(false);
    if (piano && piano.stop) {
      try { piano.stop(); } catch {}
    }
  };

  const handleDownloadNumbers = () => {
    if (flatPrimes.length === 0) return;
    const blob = new Blob([flatPrimes.join(", ")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "prime_sequence.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadSound = async () => {
    if (flatPrimes.length === 0) return;
    const durationPerNote = 0.4;
    const totalDuration = Math.ceil(flatPrimes.length * durationPerNote + 1);
    const sampleRate = 44100;
    const offlineCtx = new OfflineAudioContext(1, sampleRate * totalDuration, sampleRate);
    const inst = await Soundfont.instrument(offlineCtx, "acoustic_grand_piano");
    const midiMapping = mapPrimesToMidis(flatPrimes, mappingStrategy);

    midiMapping.forEach((midiOrArray, i) => {
      const startTime = i * durationPerNote;
      if (Array.isArray(midiOrArray)) {
        midiOrArray.forEach((m) => inst.play(m, startTime, { duration: durationPerNote }));
      } else {
        inst.play(midiOrArray, startTime, { duration: durationPerNote });
      }
    });

    const rendered = await offlineCtx.startRendering();
    const wavBuffer = audioBufferToWav(rendered);
    const blob = new Blob([wavBuffer], { type: "audio/wav" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "prime_sequence.wav";
    a.click();
    URL.revokeObjectURL(url);
  };

  const toCountGrid = (primes, primesPerRow) => {
    const grid = [];
    for (let i = 0; i < primes.length; i += primesPerRow) {
      grid.push(primes.slice(i, i + primesPerRow));
    }
    return grid;
  };

  return (
    <div className="prime-grid-player">
      <h2>Play piano with prime numbers</h2>
      <p>Click <strong>Generate</strong> to create prime numbers, then click the <strong>Play</strong> icon to hear them.</p>
      <div className="tab-switch">
        <button className={tab === "grid" ? "active" : ""} onClick={() => handleTabChange("grid")}>Grid</button>
        <button className={tab === "count" ? "active" : ""} onClick={() => handleTabChange("count")}>Count</button>
        <button className={tab === "piano" ? "active" : ""} onClick={() => handleTabChange("piano")}>Piano</button>
      </div>

      <div className="mapping-select">
        <label>
          Mapping:
          <select value={mappingStrategy} onChange={(e) => setMappingStrategy(e.target.value)}>
            <option value="mirror">Octave Mirror</option>
            <option value="cscale">C Scale</option>
            <option value="harmonic">Harmonic Robot</option>
            <option value="spiral">Spiral</option>
            <option value="factors">Factor Harmony</option>
          </select>
        </label>

        <div className="help-icon-wrapper">
          <FaQuestionCircle className="help-icon" />
          <div className="tooltip">
            <strong>Mapping Strategy</strong>
            <hr />
            <p><b>Mirror:</b> {mappingInfo.mirror}</p>
            <p><b>C Major:</b> {mappingInfo.cscale}</p>
            <p><b>Harmonic:</b> {mappingInfo.harmonic}</p>
            <p><b>Spiral:</b> {mappingInfo.spiral}</p>
            <p><b>Factors:</b> {mappingInfo.factors}</p>
          </div>
        </div>
      </div>

      {tab === "grid" ? (
        <div className="controls">
          <label>
            Columns: <input type="number" min="1" value={cols} onChange={(e) => setCols(Number(e.target.value))} />
          </label>
          <label>
            Rows: <input type="number" min="1" value={rows} onChange={(e) => setRows(Number(e.target.value))} />
          </label>
        </div>
      ) : (
        <div className="controls">
          <label>
            Number of Primes: 
            <input 
              type="number" 
              min="1" 
              value={count} 
              onChange={(e) => setCount(Number(e.target.value))} 
            />
          </label>
          <label style={{ marginLeft: "1rem" }}>
            Starting Prime #: 
            <input 
              type="number" 
              min="1" 
              value={startIndex} 
              onChange={(e) => setStartIndex(Number(e.target.value))} 
            />
          </label>
        </div>
      )}

      <div className="buttons">
        <button onClick={handleGenerate}>Generate</button>
        <button className="btn-icon" onClick={handlePlay} disabled={!piano || flatPrimes.length === 0 || isPlaying}><FaPlay /></button>
        <button className="btn-icon" onClick={handleStop} disabled={isPlaying === false}><FaStop /></button>
        <button className="btn-icon" onClick={handleDownloadNumbers} disabled={flatPrimes.length === 0}><FaFileDownload /></button>
        <button className="btn-icon" onClick={handleDownloadSound} disabled={flatPrimes.length === 0}><FaDownload /></button>
      </div>

      {tab === "piano" ? (
        <div className="piano-container">
          {displayedPrimes.length > 0 && (
            <div className="primes-list-horizontal">
              {displayedPrimes.map((p, idx) => (
                <span key={idx} className={currentPrime === p ? "current" : ""}>{p}</span>
              ))}
            </div>
          )}
          <div className="piano-keys"><PianoKeys activeMidi={currentMidi} /></div>
        </div>
      ) : (
        <>
          {tab === "grid" && displayedPrimes.length > 0 && (
            <div className="primes-grid">
              {toGrid(displayedPrimes, cols, rows).map((row, rIdx) => (
                <div key={rIdx} className="row">
                  {row.map((p, cIdx) => (
                    <span key={`${rIdx}-${cIdx}`} className={currentPrime === p ? "current" : ""}>{p || ""}</span>
                  ))}
                </div>
              ))}
            </div>
          )}
          {tab === "count" && displayedPrimes.length > 0 && (
            <div className="primes-grid">
              {toCountGrid(displayedPrimes, primesPerRow).map((row, rIdx) => (
                <div key={rIdx} className="row">
                  {row.map((p, cIdx) => (
                    <span key={`${rIdx}-${cIdx}`} className={currentPrime === p ? "current" : ""}>{p}</span>
                  ))}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PrimeGridPlayer;
