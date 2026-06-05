// Extended results-page narrative for each archetype.
//
// Source: Charl's "Worship Wheel — Results Emails (6 Archetypes) + Follow Ups"
// (talk-through 2026-06-03, AI Hunter edit pass 2026-06-04). Email-only
// scaffolding (subject lines, greeting, universal intro, "View results →"
// links, [CTA BLOCK] markers, sign-offs) has been stripped — this is the
// body copy intended for display on /results.
//
// Keyed by the archetype `key` defined in src/lib/scoring/archetypes.ts.
// The short one-line `message` still lives there; this file holds the long form.

export interface ArchetypeContent {
  /** Diagnosis — "Here's what that means…" */
  reveal: string[];
  /** What the wheel shape looks like and why. */
  wheelShape: string[];
  /** Common mistakes this archetype makes (rendered as a bullet list). */
  commonMistakes: string[];
  /** The "you might be thinking…" belief and the pivot. */
  beliefShift: string[];
  /** Your next step. */
  nextStep: string[];
}

export const archetypeContent: Record<string, ArchetypeContent> = {
  campfire_strummer: {
    reveal: [
      'You can pick up your guitar and lead a singalong. Your chords are solid and you can hold down a groove which is a real foundation most players never build.',
      "The thing is, your strumming and chord playing got ahead of the rest of your playing. Which means you haven't explored the rest of the neck as much as you could have, and areas like melody and tone haven't grown yet, simply because your chords and strumming were strong enough to carry you.",
    ],
    wheelShape: [
      "You'll see it on your wheel: harmony (chords) and rhythm reach out toward the edge, while the other spokes sit closer to the centre. That's an incredibly common shape and thankfully a very fixable one.",
      "The good news? You've already done the hard work. This is about growing in specific areas, not starting over.",
    ],
    commonMistakes: [
      '**Learning more songs instead of new skills.** This is the big one… your strength quietly becomes your ceiling. Song number 200 won’t grow you the way song number 20 did.',
      '**Staying in the open position** and reaching for the capo every time a song changes key.',
      '**Avoiding anything unfamiliar** — single notes, the upper neck, playing by ear — because the current skills feel safe, and that’s where you feel competent.',
      'And the biggest one: **mistaking comfort for progress.** Busy hands, but a wheel that stays the same shape.',
    ],
    beliefShift: [
      'You might be thinking, *"If I just keep playing more songs, I\'ll eventually become a better guitarist."*',
      '**Songs are where you apply skills. Practice is where you build them.** Growing your weakest spokes is what makes every song easier.',
    ],
    nextStep: [
      'Go back to your wheel. Your chords and rhythm are carrying you… now you need to pick your **two lowest spokes** and give them 15 minutes of focused practice a day.',
      'A quick win to get started: learn your octave shapes. They unlock the neck beyond the campfire faster than anything else.',
    ],
  },

  rhythm_machine: {
    reveal: [
      'You’ve got a great sense of groove. Your timing is tight, your hands do what you tell them to do, and a band can really lean on you. That’s one of the hardest things to teach and you already have it down.',
      'What’s holding you back is **vocabulary**. You can play great rhythm, but with a small set of chords, in a small section of the neck.',
    ],
    wheelShape: [
      'On your wheel, rhythm and technique reach toward the outer edge while harmony and fretboard sit closer to the centre. In other words it’s kinda like **a strong engine in a small car.**',
      'Pair that engine with a bigger chord vocabulary and some real fretboard knowledge, and you become the kind of guitarist every worship team wants.',
    ],
    commonMistakes: [
      '**Grinding what’s already strong…** chasing more speed, more chops and tighter strumming because it feels good. Meanwhile the actual bottleneck (chords and voicings) stays untouched. It’s a false sense of progress.',
      '**Learning songs as shapes and patterns** without ever learning what the chords are or why they work the way they do.',
      '**Staying in one zone of the neck**, which quietly limits your creativity because you never venture beyond that comfortable position.',
      '**Treating "I\'m a rhythm player" as an identity** instead of a starting point. Once you have great rhythm, you can do amazing things.',
    ],
    beliefShift: [
      'You might be thinking, *"I just need to get even tighter and faster, that\'s my thing."*',
      '**Your timing is already an asset.** The fastest way to level up is to give your hands more to say — more chords, more voicings, more melodic ideas, more of the neck — all plugged into that solid sense of rhythm you already have.',
    ],
    nextStep: [
      'Go back to your wheel and find your **two lowest spokes**. Give them 15 minutes of focused practice a day. Your results page shows you exactly what to work on for each one.',
    ],
  },

  theory_head: {
    reveal: [
      'You understand music. You’ve got a good grasp of how keys work, chords, the numbers and *why* everything works the way it does. That knowledge is rare among guitarists, and it’s genuinely valuable.',
      'But right now there’s a gap between what you **know** and what your hands can **deliver in real time**.',
    ],
    wheelShape: [
      'Look at your wheel and you’ll probably notice your theory and aural ability reaching out while technique and harmony lag behind.',
      'It’s like the blueprint is ready but the building isn’t finished.',
      'Your path forward is converting the knowledge you already have into instinct, through hands-on repetition. Once that clicks, progress comes fast because the understanding is already there.',
    ],
    commonMistakes: [
      '**Buying another course, another book, another YouTube deep-dive** instead of doing the unglamorous thing — physical practice.',
      '**Practising in your head**… analysing songs instead of playing them.',
      '**Perfectionism**… not playing the thing until you fully understand the thing. On guitar, it actually works the other way around.',
      '**Underrating how fast you’ll accelerate** once your hands catch up. You’re way closer than you think.',
    ],
    beliefShift: [
      'You might be thinking, *"Once I understand enough, the playing will follow."*',
      'On guitar, it runs the other way: **understanding follows doing.** Ten minutes of hands-on repetition teaches your fingers more than another hour of study teaches your brain.',
    ],
    nextStep: [
      'Go back to your wheel and find your **two lowest spokes**. Give them 15 minutes of focused practice a day. Your results page shows you exactly what to work on for each one.',
    ],
  },

  almost_there_player: {
    reveal: [
      'You’re solid across the board. There are no massive gaps in your playing, and you can serve your team well *right now*.',
      'And I want to encourage you: most players never get to where you are.',
    ],
    wheelShape: [
      'Your wheel is big and fairly round. And from this point, growth is **refinement**.',
      'The next level is made of small, deliberate moves: expressive playing, better tone choices, tighter feel, leading with confidence.',
      'The jump from "good" to "the player everyone notices" is way smaller than it feels, and you’re positioned perfectly for it.',
    ],
    commonMistakes: [
      '**Plateauing by default.** Because nothing is broken, nothing feels urgent, so practice becomes maintenance instead of growth.',
      '**Practising randomly instead of deliberately.** At your level, unfocused practice produces almost no visible change.',
      '**Comparing yourself to beginners** ("I\'m doing great") instead of to the player you could be in 12 months.',
      '**Neglecting the subtle skills** — dynamics, tone, taste, listening — because they’re harder to measure than the things you already know.',
    ],
    beliefShift: [
      'You might be thinking, *"I\'m pretty good already, I just need to keep playing."*',
      'At your level, **deliberate refinement is the only thing that moves the needle in a big way.** Small, targeted improvements compound into a different class of player.',
    ],
    nextStep: [
      'Go back to your wheel: even a round wheel has a shortest spoke. Pick your **two lowest spokes** and give them 15 minutes of focused practice a day. Your results page shows you exactly what to refine for each one.',
    ],
  },

  balanced_beginner: {
    reveal: [
      'Great news: your skills are growing **evenly**. There’s no single area drastically dragging the others down, and you’ve avoided the trap most self-taught players fall into, which is overdeveloping one skill while everything else stalls.',
    ],
    wheelShape: [
      'On your wheel you’ll see a small but round shape.',
      '**Small is temporary. Round is worth its weight in gold.**',
      'From here, everything grows together. And with a clear, structured path, balanced beginners typically progress faster than anyone else, all because every new skill has something to connect to.',
    ],
    commonMistakes: [
      '**YouTube roulette.** A chord lesson here, a strumming video there. Random hopping that breaks the very balance you’ve got going.',
      '**Trying to fix everything at once** and burning out, instead of following one structured path.',
      '**Comparing your small wheel to someone else’s spiky one** and feeling behind. You’re not! Remember, round grows faster than spiky.',
      '**Quitting in the messy middle**, right before things start clicking.',
    ],
    beliefShift: [
      'You might be thinking, *"I\'m behind… everyone else is better than me, and I have so much to learn."*',
      'Look at your shape again: **you have one of the best possible starting positions there is.** With one structured path, every skill you add starts multiplying the others.',
    ],
    nextStep: [
      'Go to your wheel and pick any **two spokes** to start with. At your stage, every one of them is a win. Give them 15 minutes of focused practice a day, and your results page shows you exactly what to work on for each one.',
    ],
  },

  uneven_intermediate: {
    reveal: [
      'You’ve put in real work and it shows. Some areas of your playing are genuinely strong.',
      'Your wheel, however, has peaks and valleys. And uneven skills follow one rule: **your playing only rises as far as your weakest spokes allow.**',
    ],
    wheelShape: [
      'A wheel this shape doesn’t roll smoothly yet.',
      'This is the most common shape among self-taught players who’ve been at it for a few years. You learned what you enjoyed. You skipped what you didn’t.',
      'The encouraging flip side? **Focused work on your two lowest spokes will produce faster, more visible improvement than anything else you could practise.** You’re sitting on the biggest quick wins of any archetype.',
    ],
    commonMistakes: [
      '**Practising what you’re already good at** because it feels rewarding, while your valleys quietly cap your ceiling.',
      '**Buying advanced lessons for your strong areas** while the basics in your weak areas go untouched.',
      '**Blaming the wrong things** — "I need better gear" — when the real bottleneck is an unbuilt foundation in one or two elements.',
      '**Avoiding your weak areas** because being a beginner at something feels uncomfortable when you’re already advanced at something else.',
    ],
    beliefShift: [
      'You might be thinking, *"I should build on my strengths because that\'s what makes me tick as a player."*',
      '**Your strengths are safe.** They’re not going anywhere, you’ve worked hard for them. But every hour you spend on your weakest spoke raises the level of your *entire* playing. Nothing else you could practise pays off faster.',
    ],
    nextStep: [
      'Go straight to your wheel and find the **two shortest spokes**. That’s your assignment: give them the majority of your practice time, even if it’s just 15 focused minutes a day for the next 30 days. Your results page shows you exactly what to work on for each one.',
    ],
  },
};
