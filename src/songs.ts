export interface SongSection {
  id: string;
  bars: number;
  beats: number;
  lyrics: string | null;
}

export interface Song {
  name: string;
  sections: SongSection[];
}

export interface LyricCue {
  text: string;
  bars?: number;
}

export const TDA = "TDæ"

export function parseLyricCues(lyrics: string): LyricCue[] {
  const markerPattern = /\{(\d+)\}/g;
  const markers = [...lyrics.matchAll(markerPattern)];

  if (markers.length === 0 || lyrics.slice(0, markers[0].index).trim() !== "") {
    return [{ text: lyrics.trim() }];
  }

  return markers.flatMap((marker, index) => {
    const bars = Number(marker[1]);
    const textStart = marker.index + marker[0].length;
    const textEnd = markers[index + 1]?.index ?? lyrics.length;
    const text = lyrics.slice(textStart, textEnd).trim();

    return bars > 0 && text !== "" ? [{ bars, text }] : [];
  });
}

export const songsByProgram = new Map<number, Song>([
  [
    0,
    {
      name: "gcses",
      sections: [
        { id: "Intro", bars: 2, beats: 0, lyrics: null },
        {
          id: "Verse 1",
          bars: 28,
          beats: 0,
          lyrics: `{2}I've got 11 GCSEs {2}
It's easy for you, it's easy for me {2}
Don't have time for anything else {2}
Like extracurricular activities`,
        },
        {
          id: "Instrumental Interlude",
          bars: 2,
          beats: 0,
          lyrics: null,
        },
        {
          id: "Verse 2",
          bars: 2,
          beats: 0,
          lyrics: `I don't put it on my CV,
Doesn't matter to you doesn't matter to me
Building on your progress
On your progress`,
        },
      ],
    },
  ],
  [
    1,
    {
      name: "mugs game",
      sections: [
        {
          id: "Verse 1",
          bars: 2,
          beats: 0,
          lyrics:
            "looking in my notebook to find some ideas it's a mugs game. I wonder what it would be like to live in South Africa. I'd be in the Serengheti every day. This is all going on in the privacy inside my own mind",
        },
      ],
    },
  ],
]);
