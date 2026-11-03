export interface SongSection {
  id: string;
  bars: number;
  beats: number;
  lyrics: string | null;
  notes?: string;
  tonverk?: string;
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
        { id: "Intro", bars: 4, beats: 0, lyrics: null, notes: "drum intro", tonverk: 'section A bars 1-4 of 16' },
        { id: "Piano Intro", bars: 8, beats: 0, lyrics: null, notes: "drum and piano intro" },
        {
          id: "Verse 1",
          bars: 8,
          beats: 0,
          lyrics: `{2}I've got 11 GCSEs{2}
It's easy for you, it's easy for me{2}
Don't have time for anything else{2}
Like extra-curricular activities`,
        },
        {
          id: "Instrumental Interlude",
          bars: 4,
          beats: 0,
          lyrics: null,
        },
        {
          id: "Verse 2",
          bars: 4,
          beats: 0,
          lyrics: `{2}I don't put it on my CV,
{2}Doesn't matter to you, doesn't matter to me`,
        },
        {
          id: "Instrumental Interlude",
          bars: 4,
          beats: 0,
          lyrics: null,
        },
        {
          id: "Verse 2",
          bars: 4,
          beats: 0,
          lyrics: `{2}I don't put it on my CV,
{2}Doesn't matter to you, doesn't matter to me`,
        },
        {
          id: "Instrumental Interlude",
          bars: 4,
          beats: 0,
          lyrics: null,
        },
        {
          id: "Outro Instrumental",
          bars: 8,
          beats: 0,
          lyrics: null,
        },
        {
          id: "Outro Building On Your Progress",
          bars: 16,
          beats: 0,
          lyrics: "{4}Building on your progress, {4}building on your progress, {4}building on your progress, {4}building on your progress",
        },
      ],
    },
  ],
  [
    1,
    {
      name: "mugs game",
      sections: [
        { id: "Intro", bars: 2, beats: 0, lyrics: null },
        {
          id: "Verse 1",
          bars: 2,
          beats: 0,
          lyrics: "looking in my notebook to find some ideas it's a mugs game.",
        },
        {
          id: "Instrumental",
          bars: 4,
          beats: 0,
          lyrics: null,
        },
        {
          id: "Verse 2",
          bars: 2,
          beats: 0,
          lyrics:
            "I wonder what it would be like to live in South Africa. I'd be in the Serengheti every day. This is all going on in the privacy inside my own mind",
        },
      ],
    },
  ],
  [
    2,
    {
      name: 'Dyno',
      sections: [
        { id: 'intro', bars: 4, beats: 0, lyrics: null },
        { id: 'verse-instr', bars: 8, beats: 0, lyrics:"{4}'''''{4},,,,,"},
        { id: 'verse', bars: 8, beats: 0, lyrics: "{3}I'm sick and tired of you{1}And your stupid mates{3}I'm sick and tired of you{1}And your stupid mates" },
        { id: 'verse-casting', bars: 4, beats: 0, lyrics:"{2}Casting aspersions{2}Casting aspersions"},
        { id: 'verse-shadow', bars: 16, beats: 0, lyrics:"{2}This stuff casts a long shadow{2}The shadow has already been cast{2}On an island in the sun{2}There's no magic f'ing spell here mate{2}This stuff casts a long shadow{2}You'll be Playing and having fun{2}Casting Aspersions{2}Casting aspesions"},
        { id: 'break', bars: 4, beats: 0, lyrics: null },
        { id: 'outro', bars: 36, beats: 0, lyrics: "I'm sick and tired of you" },
      ]
    }
  ]
]);
