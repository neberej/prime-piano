
export const isPrime = (n) => {
  if (n < 2) return false;
  for (let i = 2; i * i <= n; i++) if (n % i === 0) return false;
  return true;
};

export function generatePrimes(count, startIndex = 1) {
  const maxEstimate = Math.ceil(count * Math.log(count) * 1.5) || 15;
  const sieve = new Array(maxEstimate).fill(true);
  sieve[0] = sieve[1] = false;

  for (let i = 2; i * i < maxEstimate; i++) {
    if (sieve[i]) {
      for (let j = i * i; j < maxEstimate; j += i) {
        sieve[j] = false;
      }
    }
  }

  const primes = [];
  for (let i = 2; i < sieve.length; i++) {
    if (sieve[i]) primes.push(i);
  }

  // Handle startIndex
  return primes.slice(startIndex - 1, startIndex - 1 + count);
}

// Convert flat array to 2D grid
export const toGrid = (primes, rows, cols) => {
  const grid = [];
  for (let r = 0; r < cols; r++) {
    const row = [];
    for (let c = 0; c < rows; c++) {
      const index = r * rows + c; // Fill row-wise
      row.push(primes[index] !== undefined ? primes[index] : null);
    }
    grid.push(row);
  }
  return grid;
};

// Convert AudioBuffer to WAV (16-bit PCM)
export const audioBufferToWav = (buffer) => {
  const numOfChan = buffer.numberOfChannels,
    length = buffer.length * numOfChan * 2 + 44,
    bufferArray = new ArrayBuffer(length),
    view = new DataView(bufferArray),
    channels = [],
    sampleRate = buffer.sampleRate;
  let pos = 0;

  const writeString = (s) => {
    for (let i = 0; i < s.length; i++) view.setUint8(pos++, s.charCodeAt(i));
  };

  // RIFF header
  writeString("RIFF");
  view.setUint32(pos, length - 8, true); pos += 4;
  writeString("WAVE");
  writeString("fmt ");
  view.setUint32(pos, 16, true); pos += 4;
  view.setUint16(pos, 1, true); pos += 2;
  view.setUint16(pos, numOfChan, true); pos += 2;
  view.setUint32(pos, sampleRate, true); pos += 4;
  view.setUint32(pos, sampleRate * 2 * numOfChan, true); pos += 4;
  view.setUint16(pos, numOfChan * 2, true); pos += 2;
  view.setUint16(pos, 16, true); pos += 2;
  writeString("data");
  view.setUint32(pos, length - pos - 4, true); pos += 4;

  for (let i = 0; i < numOfChan; i++) channels.push(buffer.getChannelData(i));

  for (let i = 0; i < buffer.length; i++) {
    for (let ch = 0; ch < numOfChan; ch++) {
      const sample = Math.max(-1, Math.min(1, channels[ch][i]));
      view.setInt16(pos, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      pos += 2;
    }
  }

  return bufferArray;
};
