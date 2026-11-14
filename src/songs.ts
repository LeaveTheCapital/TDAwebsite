export interface SongSection {
  id: string;
  bars: number;
  beats: number;
  lyrics: string | null;
  notes?: string;
  tonverk?: string;
  silent?: boolean;
}

export interface Song {
  name: string;
  hasMidiDrumNotes?: boolean;
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
      hasMidiDrumNotes: true,
      sections: [
        { id: "Intro", bars: 1, beats: 0, lyrics: null, silent: true },
        { id: "Intro", bars: 1, beats: 0, lyrics: null },
        { id: "Bass Intro", bars: 8, beats: 0, lyrics: null },
        {
          id: "Verse 1",
          bars: 4,
          beats: 0,
          lyrics: "{2}looking in my notebook to find some ideas {2}it's a mug's game.",
          tonverk: 'last section of pattern A-11 Mugs Game Section A'
        },
        {
          id: "Chorus With Backing",
          bars: 4,
          beats: 0,
          lyrics:
          "{2}I wonder what it would be like to live in South Africa.",
        },
        {
          id: "Verse 3",
          bars: 4,
          beats: 0,
          lyrics: "{2}I'd be in the Serengheti every day.",
        },
        {
          id: "Verse 4",
          bars: 4,
          beats: 0,
          lyrics: "{2}I think it's time to retract your nib {2}it's a mug's game",
          notes: 'la la la la la la la la backing vocals - needs animation'
        },
        {
          id: "Chorus With Backing",
          bars: 4,
          beats: 0,
          lyrics: null,
          notes: 'instrumental chorus with chords etc',
          tonverk: 'last section of pattern A-12 Mugs Game Section B'
        },
        {
          id: "Outro vox",
          bars: 4,
          beats: 0,
          lyrics:
          "{2}Nobody says to me 'you're not making any sense' {2}That's because this is all going on in the privacy inside my own mind",
        },
        {
          id: "Outro Instrumental",
          bars: 2,
          beats: 0,
          lyrics: null,
        },
        {
          id: "Outro Instrumental bass",
          bars: 1,
          beats: 0,
          lyrics: null,
          notes: 'last bar is short and only bass, no drums',
          silent: true,
          tonverk: 'last section of pattern A-13 Mugs Game Section C'
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
