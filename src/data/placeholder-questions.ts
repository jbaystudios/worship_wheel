export interface Question {
  id: string;
  elementCode: string;
  elementName: string;
  text: string;
  options: { letter: string; text: string; points: number }[];
}

// Placeholder questions — will be replaced with final content from Charl
export const questions: Question[] = [
  {
    id: 'fb_01',
    elementCode: 'FB',
    elementName: 'Fretboard',
    text: 'You are learning a new worship song. How do you approach finding the right chords on the fretboard?',
    options: [
      { letter: 'A', text: 'I have no idea where to start and just try random frets until something sounds okay', points: 1 },
      { letter: 'B', text: 'I stick to the first few frets and open chords I already know', points: 4 },
      { letter: 'C', text: 'I can find the right area of the neck and work out most chord shapes with some effort', points: 7 },
      { letter: 'D', text: 'I instinctively navigate the full fretboard, finding multiple voicings and inversions in any key', points: 10 },
    ],
  },
  {
    id: 'fb_02',
    elementCode: 'FB',
    elementName: 'Fretboard',
    text: 'Your worship leader calls out a song in a key you\'ve never played before. What do you do?',
    options: [
      { letter: 'A', text: 'I freeze up — I don\'t know enough chord shapes to adapt quickly', points: 1 },
      { letter: 'B', text: 'I try to follow along but mostly stick to open chords I know', points: 4 },
      { letter: 'C', text: 'I can work out the basic chords using a capo or transposing mentally', points: 7 },
      { letter: 'D', text: 'I quickly find the key centre and play confidently using barre chords and inversions across the neck', points: 10 },
    ],
  },
  {
    id: 'hm_01',
    elementCode: 'HM',
    elementName: 'Harmony',
    text: 'During worship, the band moves to an unexpected chord. How do you respond?',
    options: [
      { letter: 'A', text: 'I get lost and have to stop playing until I find my place again', points: 1 },
      { letter: 'B', text: 'I can usually recover but it takes me a bar or two', points: 4 },
      { letter: 'C', text: 'I can hear where the harmony moved and find a suitable chord fairly quickly', points: 7 },
      { letter: 'D', text: 'I anticipate harmonic movement and adjust seamlessly in real time', points: 10 },
    ],
  },
  {
    id: 'hm_02',
    elementCode: 'HM',
    elementName: 'Harmony',
    text: 'How comfortable are you with playing chord progressions in different keys?',
    options: [
      { letter: 'A', text: 'I only know a few progressions in keys like G and C', points: 1 },
      { letter: 'B', text: 'I can play common progressions in 3-4 keys', points: 4 },
      { letter: 'C', text: 'I understand how progressions work and can transpose to most keys', points: 7 },
      { letter: 'D', text: 'I can play and create progressions fluently in any key', points: 10 },
    ],
  },
  {
    id: 'ml_01',
    elementCode: 'ML',
    elementName: 'Melody',
    text: 'The worship leader asks you to play a melodic fill between sections. What happens?',
    options: [
      { letter: 'A', text: 'I don\'t know how to play fills — I just strum chords', points: 1 },
      { letter: 'B', text: 'I can play a simple fill but it\'s usually the same one', points: 4 },
      { letter: 'C', text: 'I can create appropriate fills that fit the song\'s key and mood', points: 7 },
      { letter: 'D', text: 'I instinctively craft melodic fills that enhance the song and serve the moment', points: 10 },
    ],
  },
  {
    id: 'ml_02',
    elementCode: 'ML',
    elementName: 'Melody',
    text: 'How would you describe your ability to play lead lines or melodic passages?',
    options: [
      { letter: 'A', text: 'I can\'t really play lead — I\'m strictly a rhythm player', points: 1 },
      { letter: 'B', text: 'I can pick out simple melodies slowly', points: 4 },
      { letter: 'C', text: 'I can play lead lines and melodies with reasonable confidence', points: 7 },
      { letter: 'D', text: 'I can improvise melodic passages fluently across the fretboard', points: 10 },
    ],
  },
  {
    id: 'rh_01',
    elementCode: 'RH',
    elementName: 'Rhythm',
    text: 'How do you handle playing in different time signatures during worship?',
    options: [
      { letter: 'A', text: 'I struggle to keep time even in 4/4', points: 1 },
      { letter: 'B', text: 'I can keep steady time in 4/4 but other time signatures confuse me', points: 4 },
      { letter: 'C', text: 'I\'m comfortable in 4/4 and 3/4, and can adapt to most common patterns', points: 7 },
      { letter: 'D', text: 'I\'m confident in any time signature and can switch between them seamlessly', points: 10 },
    ],
  },
  {
    id: 'rh_02',
    elementCode: 'RH',
    elementName: 'Rhythm',
    text: 'How varied is your strumming and picking approach?',
    options: [
      { letter: 'A', text: 'I basically have one strumming pattern I use for everything', points: 1 },
      { letter: 'B', text: 'I know a few patterns but tend to default to the same ones', points: 4 },
      { letter: 'C', text: 'I can vary my rhythm to match different song styles and dynamics', points: 7 },
      { letter: 'D', text: 'I instinctively adapt my rhythmic approach to serve each moment of the song', points: 10 },
    ],
  },
  {
    id: 'to_01',
    elementCode: 'TO',
    elementName: 'Tone',
    text: 'How do you approach your guitar tone for worship?',
    options: [
      { letter: 'A', text: 'I just plug in and play — I don\'t think about tone much', points: 1 },
      { letter: 'B', text: 'I have a basic setup but don\'t really know how to shape my sound', points: 4 },
      { letter: 'C', text: 'I understand my gear and can dial in appropriate tones for different songs', points: 7 },
      { letter: 'D', text: 'I craft my tone intentionally for each song and moment, using effects and technique together', points: 10 },
    ],
  },
  {
    id: 'to_02',
    elementCode: 'TO',
    elementName: 'Tone',
    text: 'The worship leader asks for a "big ambient sound" for the bridge. What do you do?',
    options: [
      { letter: 'A', text: 'I\'m not sure what that means or how to achieve it', points: 1 },
      { letter: 'B', text: 'I turn up the reverb and hope for the best', points: 4 },
      { letter: 'C', text: 'I know which pedals and settings to use to create an ambient texture', points: 7 },
      { letter: 'D', text: 'I seamlessly blend delay, reverb, and volume swells to create the perfect atmosphere', points: 10 },
    ],
  },
  {
    id: 'th_01',
    elementCode: 'TH',
    elementName: 'Theory',
    text: 'How well do you understand the music theory behind the songs you play?',
    options: [
      { letter: 'A', text: 'I just follow chord charts — I don\'t understand why chords work together', points: 1 },
      { letter: 'B', text: 'I know basic concepts like major and minor but not much more', points: 4 },
      { letter: 'C', text: 'I understand keys, scales, and common chord relationships', points: 7 },
      { letter: 'D', text: 'I have a deep understanding of harmony, modes, and can analyse any song', points: 10 },
    ],
  },
  {
    id: 'th_02',
    elementCode: 'TH',
    elementName: 'Theory',
    text: 'Someone mentions "the 4 chord" or "relative minor." How do you respond?',
    options: [
      { letter: 'A', text: 'I have no idea what those terms mean', points: 1 },
      { letter: 'B', text: 'I\'ve heard the terms but couldn\'t apply them on the spot', points: 4 },
      { letter: 'C', text: 'I understand and can apply basic number system and key relationships', points: 7 },
      { letter: 'D', text: 'I think in numbers and relationships naturally — it\'s how I process music', points: 10 },
    ],
  },
  {
    id: 'te_01',
    elementCode: 'TE',
    elementName: 'Technique',
    text: 'How clean is your playing when switching between chords quickly?',
    options: [
      { letter: 'A', text: 'I often get buzzing strings and muted notes during chord changes', points: 1 },
      { letter: 'B', text: 'Simple chord changes are okay but complex ones are messy', points: 4 },
      { letter: 'C', text: 'My chord changes are generally clean with occasional slips', points: 7 },
      { letter: 'D', text: 'My transitions are smooth and clean, even at tempo with complex voicings', points: 10 },
    ],
  },
  {
    id: 'te_02',
    elementCode: 'TE',
    elementName: 'Technique',
    text: 'How would you rate your fingerpicking and hybrid picking ability?',
    options: [
      { letter: 'A', text: 'I can only strum — I haven\'t learned fingerpicking', points: 1 },
      { letter: 'B', text: 'I can do basic fingerpicking patterns slowly', points: 4 },
      { letter: 'C', text: 'I\'m comfortable with fingerpicking and can use it in worship settings', points: 7 },
      { letter: 'D', text: 'I fluidly switch between strumming, fingerpicking, and hybrid techniques as needed', points: 10 },
    ],
  },
  {
    id: 'au_01',
    elementCode: 'AU',
    elementName: 'Aural',
    text: 'During worship practice, the band plays a chord progression you haven\'t seen written down. How well can you identify what\'s happening by ear?',
    options: [
      { letter: 'A', text: 'I can\'t tell what chords are being played just by listening — I need the chart', points: 1 },
      { letter: 'B', text: 'I can sometimes tell if something sounds major or minor, but not much more', points: 4 },
      { letter: 'C', text: 'I can pick out most of the chords and figure out the key after a few listens', points: 7 },
      { letter: 'D', text: 'I can hear the progression immediately, identify the chords, and join in confidently', points: 10 },
    ],
  },
  {
    id: 'au_02',
    elementCode: 'AU',
    elementName: 'Aural',
    text: 'How well can you learn a new song by ear without a chord chart?',
    options: [
      { letter: 'A', text: 'I can\'t learn songs by ear — I need written chords', points: 1 },
      { letter: 'B', text: 'I can pick out the basic chords of simple songs with effort', points: 4 },
      { letter: 'C', text: 'I can learn most songs by ear with a few listens', points: 7 },
      { letter: 'D', text: 'I can learn any song by ear quickly, including specific voicings and embellishments', points: 10 },
    ],
  },
];
