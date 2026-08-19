/**
 * 音声ファイルをWeb Audio APIでデコードし、波形描画用のピーク値配列を生成する。
 * ブラウザAPI(AudioContext)に依存するため、UIコンポーネント専用のヘルパーとして
 * components配下に置く（domain/applicationからは参照されない）。
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
  // 複数チャンネルがある場合は平均を取って1チャンネル分にまとめる
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
