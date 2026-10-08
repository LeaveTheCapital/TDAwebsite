interface TestMidiControl {
  ready(): boolean;
  emit(type: "clock" | "start"): void;
}

declare var testMidi: TestMidiControl | undefined;
