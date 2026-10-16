# Pi audio notes

The below is copied across from another repo i have called pi-midi-router where i setup pi midi routing to connect
the devices for my TDA live set. I managed to ge audio in over usb from my Elektron Tonverk.
Nothing is imlemented in this repo yet. 

The Raspberry Pi 5 already has the core software needed to receive and process
audio from the Elektron Tonverk over USB. Tonverk is a USB class-compliant
device, so it uses Linux's standard `snd_usb_audio` driver and does not require
an Elektron-specific driver.

The Tonverk currently appears as ALSA card `Tonverk`, with the following audio
format:

- Capture from Tonverk: 4 channels, 24-bit packed little-endian (`S24_3LE`),
  48 kHz
- Playback to Tonverk: 2 channels, 24-bit packed little-endian (`S24_3LE`),
  48 kHz
- ALSA device: `hw:Tonverk,0`
- USB audio driver: `snd_usb_audio`

Elektron's manual confirms that Tonverk is class-compliant and can stream audio
and MIDI over USB without additional drivers:

- [Elektron Tonverk user manual](https://www.elektron.se/wp-content/uploads/2025/12/Tonverk-User-Manual_ENG_OS1.2.0_251217.pdf)

## Test recording

Record all four incoming channels to a WAV file:

```sh
arecord -D hw:Tonverk,0 \
  -f S24_3LE -r 48000 -c 4 \
  -t wav tonverk-test.wav
```

Press `Ctrl-C` to stop recording.

**Verified:** this command successfully recorded audio from the Tonverk on the
Pi. This confirms that the kernel driver, ALSA device name, channel count,
sample format, and sample rate above all work with the connected hardware.

The four channels currently have generic ALSA channel labels. Make a short test
recording while sending identifiable signals to determine what Tonverk routes
to channels 1-4.

## Local browser access and visualization

A browser running locally on the Pi can request the Tonverk as an audio-input
device with `navigator.mediaDevices.getUserMedia()`, then pass its `MediaStream`
into the Web Audio API. This is the audio equivalent of using Web MIDI, although
the browser treats the interface as a permission-protected microphone rather
than exposing ALSA directly. No server-side audio bridge or WebSocket is needed
for this setup.

The page must run in a secure context: HTTPS or `localhost`. The browser also
requires the user to grant microphone permission. Device labels normally
become available only after that permission has been granted.

For local development, serve the HTML and JavaScript from the project folder:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Then open `http://localhost:8000` in Chromium on the Pi. Start audio from a
button click so Chromium can show the permission prompt and activate the audio
context. Stop any direct `arecord -D hw:Tonverk,0` process first, because a
direct ALSA hardware capture may hold the device exclusively.

```js
async function openTonverk() {
  // The first request prompts for permission and unlocks device labels.
  const permissionStream = await navigator.mediaDevices.getUserMedia({
    audio: true,
  });

  const devices = await navigator.mediaDevices.enumerateDevices();
  const tonverk = devices.find(
    (device) =>
      device.kind === "audioinput" &&
      device.label.toLowerCase().includes("tonverk"),
  );

  permissionStream.getTracks().forEach((track) => track.stop());

  if (!tonverk) {
    throw new Error("Tonverk audio input was not found");
  }

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      deviceId: { exact: tonverk.deviceId },
      channelCount: { ideal: 4 },
      sampleRate: { ideal: 48000 },
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
    },
  });

  const audioContext = new AudioContext({ sampleRate: 48000 });
  await audioContext.resume();
  const source = audioContext.createMediaStreamSource(stream);
  const analyser = audioContext.createAnalyser();

  analyser.fftSize = 2048;
  analyser.smoothingTimeConstant = 0.75;
  source.connect(analyser);

  // Do not connect to audioContext.destination unless monitoring is wanted.
  // Connecting it could produce doubled sound or feedback.
  return { stream, audioContext, analyser };
}
```

Check what the browser actually accepted instead of assuming that every
requested constraint was honoured:

```js
console.log(stream.getAudioTracks()[0].getSettings());
```

An `AnalyserNode` supplies both waveform samples and FFT frequency bins without
altering the signal:

```js
const frequencyBins = new Float32Array(analyser.frequencyBinCount);
const waveform = new Float32Array(analyser.fftSize);

function analyseFrame() {
  analyser.getFloatFrequencyData(frequencyBins);
  analyser.getFloatTimeDomainData(waveform);

  let squareSum = 0;
  let peak = 0;

  for (const sample of waveform) {
    const magnitude = Math.abs(sample);
    squareSum += sample * sample;
    peak = Math.max(peak, magnitude);
  }

  const rms = Math.sqrt(squareSum / waveform.length);

  // Starting values only; calibrate these against the real Tonverk signal.
  const silent = rms < 0.002;
  const transientPeak = peak > 0.8;

  drawSpectrum(frequencyBins);
  respondToLevel({ rms, peak, silent, transientPeak });
  requestAnimationFrame(analyseFrame);
}
```

Use hysteresis and minimum hold times for silence and peak events so values
close to a threshold do not rapidly switch state. For frequency-dependent
responses, combine FFT bins into useful bands such as bass, midrange, and
treble instead of responding to every bin independently.

`AnalyserNode` plus `requestAnimationFrame()` is appropriate for the first
visualizer. If later behaviour must react to very short transients with
sample-block timing even when drawing slows down, move the level and peak
detection into an `AudioWorkletProcessor` and send only the resulting events to
the page's main thread.

For independent analysis of all four USB channels, use a
`ChannelSplitterNode(4)` and one analyser per output. Browser and PipeWire
configuration can affect the number of channels exposed, so first confirm that
`getSettings().channelCount` reports four.

References:

- [MDN: `getUserMedia()`](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)
- [MDN: visualizations with the Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Visualizations_with_Web_Audio_API)
- [MDN: `getByteFrequencyData()`](https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode/getByteFrequencyData)

## Available processing options

### ALSA

ALSA and its runtime library are already installed. Direct ALSA access is the
leanest option for a dedicated headless service and offers predictable,
low-latency access to the Tonverk. A process opening the hardware device
directly may have exclusive use of it.

For a custom C or C++ application, install the ALSA development headers:

```sh
sudo apt install libasound2-dev
```

### PipeWire

PipeWire, WirePlumber, and the JACK compatibility library are installed.
PipeWire is useful when the audio needs to be routed among multiple programs,
mixed with other devices, monitored, or passed through a graph of effects.

Raspberry Pi OS uses ALSA underneath PipeWire, with PipeWire providing the
higher-level routing and mixing layer:

- [Raspberry Pi audio documentation](https://www.raspberrypi.com/documentation/accessories/audio.html)

Useful inspection commands include:

```sh
wpctl status
pw-cli ls Node
```

These commands need to run in the logged-in user's PipeWire session. They may
not connect when invoked from an isolated shell or a system service without the
user session environment.

### FFmpeg

FFmpeg is already installed. It can record, split or combine channels, apply
filters, resample audio, generate meters, and encode recordings. It is a good
fit for file-oriented or command-line processing.

### Python

For rapid custom DSP, audio analysis, meters, or beat detection, Python can use
`sounddevice` with NumPy and SciPy. Those additional Python packages are not
currently installed.

### JACK-compatible applications

PipeWire can host JACK-compatible software for low-latency effects and audio
routing. This is useful for applications such as synthesizers, software
effects, and DAWs without requiring a completely separate audio stack.

## Recommended approach

- Use direct ALSA for one dedicated, always-on process that receives and
  processes Tonverk audio.
- Use PipeWire when several programs or USB audio devices need to share and
  route audio.
- Use FFmpeg for recording and offline or pipeline-based conversion.
- Use Python for prototyping custom analysis or DSP, then move to C/C++ only if
  latency or CPU use requires it.

## Linux USB audio caveat

Some Linux users have reported crackling when sending audio back to Elektron
devices because of USB asynchronous-feedback handling. Receiving audio from
Tonverk alone is less likely to encounter that issue. If full-duplex operation
crackles, keep the graph at 48 kHz and investigate the kernel's implicit
feedback handling before changing buffer sizes at random.

This audio path is independent of the ALSA MIDI subscriptions managed by
`router.sh`; MIDI routing can continue while another process handles the
Tonverk's PCM audio stream.
