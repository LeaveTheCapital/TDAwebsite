function required<T>(value: T | null, message: string): T {
  if (value === null) throw new Error(message);
  return value;
}

const enableButton = required(document.querySelector<HTMLButtonElement>("#enable-audio"), "Enable audio button is missing.");
const stopButton = required(document.querySelector<HTMLButtonElement>("#stop-audio"), "Stop audio button is missing.");
const inputSelect = required(document.querySelector<HTMLSelectElement>("#audio-input"), "Audio input selector is missing.");
const statusOutput = required(document.querySelector<HTMLOutputElement>("#audio-status"), "Audio status is missing.");
const canvas = required(document.querySelector<HTMLCanvasElement>("#audio-visualizer"), "Audio visualizer is missing.");
const startCaptionsButton = required(document.querySelector<HTMLButtonElement>("#start-captions"), "Start captions button is missing.");
const stopCaptionsButton = required(document.querySelector<HTMLButtonElement>("#stop-captions"), "Stop captions button is missing.");
const installLanguageButton = required(document.querySelector<HTMLButtonElement>("#install-caption-language"), "Install language button is missing.");
const captionStatus = required(document.querySelector<HTMLOutputElement>("#caption-status"), "Caption status is missing.");
const captions = required(document.querySelector<HTMLDivElement>("#captions"), "Captions display is missing.");
const context = required(canvas.getContext("2d"), "The browser does not support the audio visualizer canvas.");
const mediaDevices = Reflect.get(navigator, "mediaDevices") as MediaDevices | undefined;

type LanguageAvailability = "available" | "downloadable" | "downloading" | "unavailable";

interface OfflineSpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  processLocally: boolean;
  start(audioTrack: MediaStreamTrack): void;
  abort(): void;
}

interface OfflineSpeechRecognitionConstructor {
  new(): OfflineSpeechRecognition;
  available(options: { langs: string[]; processLocally: true }): Promise<LanguageAvailability>;
  install(options: { langs: string[]; processLocally: true }): Promise<boolean>;
}

const preferredInputName = "tonverk";
const defaultInputId = "default";
const captionLanguage = "en-US";
const width = canvas.width;
const height = canvas.height;
let devices: MediaDeviceInfo[] = [];
let permissionGranted = false;
let activeStream: MediaStream | undefined;
let audioContext: AudioContext | undefined;
let analyser: AnalyserNode | undefined;
let animationFrame: number | undefined;
let activeDeviceId = "";
let manualInputId: string | undefined;
let requestVersion = 0;
let waveform = new Uint8Array(0);
let frequencies = new Uint8Array(0);
let recognition: OfflineSpeechRecognition | undefined;
let captionsRequested = false;
let captionRequestVersion = 0;
let captionRestartTimer: number | undefined;

function getOfflineRecognitionConstructor() {
  const candidate = (Reflect.get(window, "SpeechRecognition") ??
    Reflect.get(window, "webkitSpeechRecognition")) as
    Partial<OfflineSpeechRecognitionConstructor> | undefined;
  return candidate && typeof candidate.available === "function" &&
    typeof candidate.install === "function"
    ? candidate as OfflineSpeechRecognitionConstructor
    : undefined;
}

function stopCaptions() {
  captionRequestVersion += 1;
  captionsRequested = false;
  if (captionRestartTimer !== undefined) clearTimeout(captionRestartTimer);
  captionRestartTimer = undefined;
  recognition?.abort();
  recognition = undefined;
  startCaptionsButton.disabled = !activeStream;
  stopCaptionsButton.disabled = true;
  installLanguageButton.hidden = true;
}

function showCaptionResults(event: SpeechRecognitionEvent) {
  const finalParts: string[] = [];
  const interimParts: string[] = [];
  for (let index = 0; index < event.results.length; index += 1) {
    const result = event.results[index];
    const transcript = result[0].transcript.trim();
    if (!transcript) continue;
    if (result.isFinal) finalParts.push(transcript);
    else interimParts.push(transcript);
  }
  captions.textContent = [...finalParts, ...interimParts].join(" ").slice(-1000);
}

function startRecognition(track: MediaStreamTrack, version: number) {
  const Recognition = getOfflineRecognitionConstructor();
  if (!Recognition) return;
  const nextRecognition = new Recognition();
  if (!Reflect.has(nextRecognition, "processLocally")) {
    captionStatus.value = "This browser cannot require offline recognition";
    startCaptionsButton.disabled = false;
    return;
  }
  nextRecognition.lang = captionLanguage;
  nextRecognition.continuous = true;
  nextRecognition.interimResults = true;
  nextRecognition.processLocally = true;
  nextRecognition.addEventListener("result", (event) => {
    showCaptionResults(event as SpeechRecognitionEvent);
  });
  nextRecognition.addEventListener("error", (event) => {
    const error = (event as SpeechRecognitionErrorEvent).error;
    stopCaptions();
    captionStatus.value = error === "language-not-supported"
      ? "Offline English recognition is unavailable"
      : `Offline captions stopped: ${error}`;
  });
  nextRecognition.addEventListener("end", () => {
    if (!captionsRequested || version !== captionRequestVersion ||
      track.readyState !== "live") return;
    captionRestartTimer = window.setTimeout(() => {
      if (captionsRequested && version === captionRequestVersion) {
        try {
          nextRecognition.start(track);
        } catch (error) {
          stopCaptions();
          captionStatus.value = "Offline captions could not restart";
          console.warn("Speech recognition could not restart:", error);
        }
      }
    }, 300);
  });
  recognition = nextRecognition;
  try {
    nextRecognition.start(track);
    captionStatus.value = "Offline captions listening";
    startCaptionsButton.disabled = true;
    stopCaptionsButton.disabled = false;
  } catch (error) {
    stopCaptions();
    captionStatus.value = "This browser cannot caption the selected input offline";
    console.warn("Offline speech recognition could not start:", error);
  }
}

async function startCaptions() {
  const track = activeStream?.getAudioTracks()[0];
  if (!track) return;
  const Recognition = getOfflineRecognitionConstructor();
  if (!Recognition) {
    captionStatus.value = "On-device Web Speech recognition is unavailable here";
    return;
  }
  const version = ++captionRequestVersion;
  startCaptionsButton.disabled = true;
  installLanguageButton.hidden = true;
  captionStatus.value = "Checking offline English recognition…";
  try {
    const availability = await Recognition.available({
      langs: [captionLanguage],
      processLocally: true,
    });
    if (version !== captionRequestVersion) return;
    if (availability === "available") {
      captionsRequested = true;
      captions.textContent = "";
      startRecognition(track, version);
    } else if (availability === "downloadable") {
      captionStatus.value = "Offline English pack needs a one-time download";
      installLanguageButton.hidden = false;
      startCaptionsButton.disabled = false;
    } else if (availability === "downloading") {
      captionStatus.value = "Offline English pack is downloading; try again shortly";
      startCaptionsButton.disabled = false;
    } else {
      captionStatus.value = "Offline English recognition is unavailable in this browser";
      startCaptionsButton.disabled = false;
    }
  } catch (error) {
    captionStatus.value = "Could not check offline speech support";
    startCaptionsButton.disabled = false;
    console.warn("Offline speech availability check failed:", error);
  }
}

async function installCaptionLanguage() {
  const Recognition = getOfflineRecognitionConstructor();
  if (!Recognition) return;
  installLanguageButton.disabled = true;
  captionStatus.value = "Installing offline English pack…";
  try {
    const installed = await Recognition.install({
      langs: [captionLanguage],
      processLocally: true,
    });
    captionStatus.value = installed
      ? "Offline English pack installed; start captions"
      : "Offline English pack could not be installed";
    if (installed) installLanguageButton.hidden = true;
  } catch (error) {
    captionStatus.value = "Offline English pack could not be installed";
    console.warn("Offline speech language installation failed:", error);
  } finally {
    installLanguageButton.disabled = false;
  }
}

function setStatus(message: string) {
  statusOutput.value = message;
}

function drawBackground() {
  context.fillStyle = "#080f10";
  context.fillRect(0, 0, width, height);
  context.strokeStyle = "#234044";
  context.beginPath();
  context.moveTo(0, height / 2);
  context.lineTo(width, height / 2);
  context.stroke();
  context.font = "14px sans-serif";
  context.fillStyle = "#7bbfc1";
  context.fillText("WAVEFORM", 12, 18);
  context.fillText("SPECTRUM", 12, height / 2 + 18);
}

function drawFrame() {
  if (!analyser) return;

  analyser.getByteTimeDomainData(waveform);
  analyser.getByteFrequencyData(frequencies);
  drawBackground();

  context.beginPath();
  context.strokeStyle = "#39ff14";
  context.lineWidth = 2;
  waveform.forEach((sample, index) => {
    const x = index * width / (waveform.length - 1);
    const y = 48 + (sample - 128) / 128 * 36;
    if (index === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  });
  context.stroke();

  const barCount = 80;
  const barGap = 2;
  const barWidth = width / barCount - barGap;
  context.fillStyle = "#23d6d2";
  for (let index = 0; index < barCount; index += 1) {
    const start = Math.floor((index / barCount) ** 2 * frequencies.length);
    const end = Math.max(
      start + 1,
      Math.floor(((index + 1) / barCount) ** 2 * frequencies.length),
    );
    let level = 0;
    for (let bin = start; bin < end; bin += 1) {
      level = Math.max(level, frequencies[bin]);
    }
    const barHeight = level / 255 * 65;
    context.fillRect(
      index * width / barCount + barGap / 2,
      height - barHeight - 5,
      barWidth,
      barHeight,
    );
  }

  animationFrame = requestAnimationFrame(drawFrame);
}

function stopCapture() {
  stopCaptions();
  captionStatus.value = "Enable audio to try offline captions";
  requestVersion += 1;
  if (animationFrame !== undefined) cancelAnimationFrame(animationFrame);
  animationFrame = undefined;
  analyser = undefined;
  activeStream?.getTracks().forEach((track) => { track.stop(); });
  activeStream = undefined;
  startCaptionsButton.disabled = true;
  if (audioContext) void audioContext.close();
  audioContext = undefined;
  activeDeviceId = "";
  canvas.dataset.state = "idle";
  delete canvas.dataset.channelCount;
  inputSelect.value = defaultInputId;
  enableButton.disabled = false;
  stopButton.disabled = true;
  drawBackground();
}

function showError(error: unknown) {
  console.warn("Audio input unavailable:", error);
  setStatus(error instanceof DOMException && error.name === "NotAllowedError"
    ? "Microphone permission was denied"
    : "Audio input could not be opened");
  canvas.dataset.state = "error";
}

async function refreshAudioInputs() {
  if (!mediaDevices) return;
  devices = (await mediaDevices.enumerateDevices()).filter(
    (device) => device.kind === "audioinput",
  );
  const defaultOption = document.createElement("option");
  defaultOption.value = defaultInputId;
  defaultOption.textContent = "Default microphone";
  inputSelect.replaceChildren(defaultOption);
  devices.forEach((device, index) => {
    if (!device.deviceId || device.deviceId === defaultInputId) return;
    const option = document.createElement("option");
    option.value = device.deviceId;
    option.textContent = device.label || `Audio input ${index + 1}`;
    inputSelect.append(option);
  });
  inputSelect.disabled = false;
  inputSelect.value = activeDeviceId || manualInputId || defaultInputId;
}

function preferredAudioInput() {
  return devices.find((device) =>
    device.label.toLowerCase().includes(preferredInputName)
  );
}

async function useStream(stream: MediaStream, deviceId: string) {
  activeStream = stream;
  activeDeviceId = deviceId;
  audioContext = new AudioContext({ sampleRate: 48000 });
  await audioContext.resume();
  const source = audioContext.createMediaStreamSource(stream);
  analyser = audioContext.createAnalyser();
  analyser.fftSize = 2048;
  analyser.smoothingTimeConstant = 0.75;
  waveform = new Uint8Array(analyser.fftSize);
  frequencies = new Uint8Array(analyser.frequencyBinCount);
  source.connect(analyser);

  const track = stream.getAudioTracks()[0];
  const settings = track.getSettings();
  const selectedDevice = devices.find((device) => device.deviceId === deviceId);
  const name = selectedDevice?.label || track.label || "Default microphone";
  canvas.dataset.state = "running";
  canvas.dataset.channelCount = String(settings.channelCount ?? "unknown");
  inputSelect.value = deviceId;
  enableButton.disabled = true;
  stopButton.disabled = false;
  setStatus(`Audio: ${name}`);
  startCaptionsButton.disabled = false;
  captionStatus.value = "Ready to check offline captions";
  track.addEventListener("ended", () => {
    if (activeStream === stream) {
      stopCapture();
      setStatus("Audio input disconnected");
      void refreshAudioInputs();
    }
  });
  drawFrame();
}

async function connectToAudioInput(deviceId: string) {
  if (!mediaDevices) return;
  stopCapture();
  const version = requestVersion;
  enableButton.disabled = true;
  inputSelect.disabled = true;
  setStatus("Opening audio input…");
  try {
    const stream = await mediaDevices.getUserMedia({
      audio: {
        ...(deviceId === defaultInputId
          ? {}
          : { deviceId: { exact: deviceId } }),
        channelCount: { ideal: 4 },
        sampleRate: { ideal: 48000 },
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
    });
    if (version !== requestVersion) {
      stream.getTracks().forEach((track) => { track.stop(); });
      return;
    }
    await useStream(stream, deviceId);
  } catch (error) {
    stopCapture();
    showError(error);
  } finally {
    inputSelect.disabled = false;
    enableButton.disabled = Boolean(activeStream);
  }
}

async function enableAudio() {
  if (!mediaDevices) {
    setStatus("Audio needs HTTPS or localhost in a supported browser");
    return;
  }
  enableButton.disabled = true;
  setStatus("Requesting microphone access…");
  try {
    const permissionStream = await mediaDevices.getUserMedia({
      audio: true,
    });
    permissionGranted = true;
    await refreshAudioInputs();
    const preferredId = preferredAudioInput()?.deviceId;
    const defaultId = permissionStream.getAudioTracks()[0]?.getSettings().deviceId;
    const deviceId = manualInputId || preferredId || defaultInputId;

    if (deviceId !== defaultInputId && deviceId !== defaultId) {
      permissionStream.getTracks().forEach((track) => { track.stop(); });
      await connectToAudioInput(deviceId);
    } else {
      await useStream(permissionStream, deviceId);
    }
  } catch (error) {
    stopCapture();
    showError(error);
  } finally {
    enableButton.disabled = Boolean(activeStream);
  }
}

enableButton.addEventListener("click", () => { void enableAudio(); });
startCaptionsButton.addEventListener("click", () => { void startCaptions(); });
stopCaptionsButton.addEventListener("click", () => {
  stopCaptions();
  captionStatus.value = "Offline captions stopped";
});
installLanguageButton.addEventListener("click", () => {
  void installCaptionLanguage();
});
stopButton.addEventListener("click", () => {
  stopCapture();
  manualInputId = undefined;
  setStatus("Audio is off");
});
inputSelect.addEventListener("change", () => {
  const deviceId = inputSelect.value;
  manualInputId = deviceId;
  if (permissionGranted) void connectToAudioInput(deviceId);
  else void enableAudio();
});

if (mediaDevices) {
  mediaDevices.addEventListener("devicechange", () => {
    void refreshAudioInputs().then(() => {
      if (activeDeviceId && activeDeviceId !== defaultInputId &&
        !devices.some((device) => device.deviceId === activeDeviceId)) {
        stopCapture();
        setStatus("Audio input disconnected");
      }
      const preferred = preferredAudioInput();
      if (permissionGranted && !activeStream && preferred) {
        void connectToAudioInput(preferred.deviceId);
      }
    });
  });
  void refreshAudioInputs().catch(showError);
} else {
  enableButton.disabled = true;
  setStatus("Audio needs HTTPS or localhost in a supported browser");
}

canvas.dataset.state = "idle";
drawBackground();
