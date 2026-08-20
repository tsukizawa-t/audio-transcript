/**
 * Decodes an audio file using the Web Audio API and produces an array of
 * peak values used to draw the waveform. This depends on browser APIs
 * (AudioContext), so it lives alongside the UI component under
 * components/ and is never referenced from domain/application.
 */
export async function decodeWaveformPeaks(
  file: File,
  barCount: number
): Promise<number[]> {
  const arrayBuffer = await file.arrayBuffer();

  const AudioContextCtor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext;
  const audioContext = new AudioContextCtor();

  try {
    const audioBuffer = await audioContext.decodeAudioData(
      arrayBuffer.slice(0)
    );
    return computePeaks(audioBuffer, barCount);
  } finally {
    void audioContext.close();
  }
}

function computePeaks(audioBuffer: AudioBuffer, barCount: number): number[] {
  // Average across channels when there is more than one, collapsing to a
  // single channel for the waveform.
  const channelCount = audioBuffer.numberOfChannels;
  const length = audioBuffer.length;
  const samplesPerBar = Math.max(1, Math.floor(length / barCount));
  const peaks: number[] = new Array(barCount).fill(0);

  const channelData: Float32Array[] = [];
  for (let c = 0; c < channelCount; c++) {
    channelData.push(audioBuffer.getChannelData(c));
  }

  for (let bar = 0; bar < barCount; bar++) {
    const start = bar * samplesPerBar;
    const end = Math.min(start + samplesPerBar, length);
    let max = 0;

    for (let i = start; i < end; i++) {
      let sum = 0;
      for (let c = 0; c < channelCount; c++) {
        sum += Math.abs(channelData[c]?.[i] ?? 0);
      }
      const avg = sum / channelCount;
      if (avg > max) max = avg;
    }

    peaks[bar] = max;
  }

  const globalMax = Math.max(...peaks, 0.0001);
  return peaks.map((p) => p / globalMax);
}
