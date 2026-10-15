interface TestMidiControl {
  ready(): boolean;
  emit(type: "clock" | "start" | "stop", receivedTime?: number): void;
}

declare var testMidi: TestMidiControl | undefined;
