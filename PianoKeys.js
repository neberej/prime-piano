
import React from "react";
import "./PianoKeys.scss";

const PianoKeys = ({ activeMidi }) => {
  const whiteKeys = [];
  const blackKeys = [];
  let whiteCount = 0;

  const isActive = (midi) => {
    if (activeMidi == null) return false;
    if (Array.isArray(activeMidi)) return activeMidi.includes(midi);
    return activeMidi === midi;
  };

  for (let m = 21; m <= 108; m++) {
    const noteIndex = m % 12;
    const noteName = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'][noteIndex];
    const octave = Math.floor(m / 12) - 1;
    const fullNote = noteName + octave;
    const isBlack = noteName.includes('#');
    const className = `key ${isBlack ? 'black' : 'white'} ${isActive(m) ? 'active' : ''}`;

    if (isBlack) {
      const w = '(100% / 52)';
      const left = `calc(${whiteCount} * ${w} + ${w} * 0.65)`;
      blackKeys.push(
        <div
          key={m}
          className={className}
          data-note={fullNote}
          data-midi={m}
          style={{ left }}
        ></div>
      );
    } else {
      whiteKeys.push(
        <div
          key={m}
          className={className}
          data-note={fullNote}
          data-midi={m}
        ></div>
      );
      whiteCount++;
    }
  }

  return (
    <div className="piano-keys">
      <div className="white-keys">{whiteKeys}</div>
      <div className="black-keys">{blackKeys}</div>
    </div>
  );
};

export default PianoKeys;
