function detectVoiceCommand(text) {
  const rawLower = text.toLowerCase().trim();
  if (!rawLower) return "NO_COMMAND (Send to AI)";

  // 1. STOP COMMAND (Completely stops reading & resets speech index)
  const isStop =
    /^(stop|stop reading|stop speaking|stop talking|stop it|stop now|please stop|stop please|shut up|quiet|halt|cancel reading|cancel speech|band karo|बंद करो|thambva|thaambva|थांबवा|chup|chup ho jao|bas karo|rok do|band kar do|awaaz band|aawaz band)$/i.test(rawLower) ||
    /\b(stop reading|stop speaking|stop talking|stop it|please stop|stop please|shut up|band karo|बंद करो|thambva|thaambva|थांबवा|chup ho jao|bas karo|rok do|band kar do|awaaz band|aawaz band)\b/i.test(rawLower) ||
    /^(stop|band karo|बंद करो|thambva|thaambva|थांबवा)$/i.test(rawLower) ||
    (/^\b(stop|band karo|thambva|thaambva)\b/i.test(rawLower) && !/\b(non-stop|bus stop|one stop|stop by)\b/i.test(rawLower));

  if (isStop) return "STOP";

  // 2. PAUSE COMMAND (Pauses reading in-place)
  const isPause =
    /^(pause|pause reading|pause speaking|pause talking|pause it|pause now|please pause|pause please|wait|hold on|pause speech|ruko|roko|thoda ruko|ruko thoda|thamba|thaamb|रुको|थांब|hold karo|thoda wait|rokna)$/i.test(rawLower) ||
    /\b(pause reading|pause speaking|pause talking|pause it|please pause|pause please|hold on|pause speech|ruko thoda|thoda ruko|thamba|thaamb|रुको|थांब|hold karo|thoda wait|thoda roko)\b/i.test(rawLower) ||
    /^(pause|wait|ruko|roko|thamba|thaamb|रुको|थांब)$/i.test(rawLower) ||
    /^\b(pause|wait|ruko|roko|thamba|thaamb|रुको|थांब)\b/i.test(rawLower);

  if (isPause) return "PAUSE";

  // 3. CONTINUE / RESUME
  const isResume =
    /^(continue|resume|go on|keep speaking|carry on|continue speaking|jari rakho|जारी रखो|punha suru|punha shuru|पुन्हा सुरू|chalu karo|phir se chalu karo|continue karo|resume karo|aage bolo)$/i.test(rawLower) ||
    /\b(continue karo|phir se chalu karo|resume karo|continue speaking|keep speaking|carry on|jari rakho|जारी रखो|punha suru|punha shuru|पुन्हा सुरू)\b/i.test(rawLower) ||
    /^(continue|resume|जारी रखो|पुन्हा सुरू)$/i.test(rawLower);

  if (isResume) return "RESUME";

  // 4. REPEAT / START
  const isRepeat =
    /^(start|begin|repeat|speak again|replay|read again|say again|tell me again|shuru karo|shuru se|play karo|shuru|pehle se|phir se bolo|phir se|dobara bolo|wapas bolo)$/i.test(rawLower) ||
    /\b(speak again|read again|say again|tell me again|shuru karo|pehle se|phir se bolo|dobara bolo|wapas bolo)\b/i.test(rawLower) ||
    /^(repeat|replay)$/i.test(rawLower);

  if (isRepeat) return "REPEAT/START";

  // 5. MUTE
  const isMute =
    /^(mute|mute volume|turn off voice|silent|mute karo|silent karo)$/i.test(rawLower) ||
    /\b(mute volume|turn off voice|mute karo|silent karo)\b/i.test(rawLower) ||
    /^(mute)$/i.test(rawLower);

  if (isMute) return "MUTE";

  // 6. UNMUTE
  const isUnmute =
    /^(unmute|unmute volume|turn on voice|speak up|voice on|awaaz chalu|unmute karo|speak karo|aawaz chalu)$/i.test(rawLower) ||
    /\b(unmute volume|turn on voice|awaaz chalu|unmute karo|speak karo|aawaz chalu)\b/i.test(rawLower) ||
    /^(unmute)$/i.test(rawLower);

  if (isUnmute) return "UNMUTE";

  return "NO_COMMAND (Send to AI)";
}

const testPhrases = [
  // English Stop variations
  ["stop", "STOP"],
  ["stop reading", "STOP"],
  ["stop speaking", "STOP"],
  ["stop talking", "STOP"],
  ["please stop", "STOP"],
  ["stop please", "STOP"],
  ["stop it", "STOP"],
  // Hindi & Marathi Stop variations
  ["band karo", "STOP"],
  ["बंद करो", "STOP"],
  ["thambva", "STOP"],
  ["थांबवा", "STOP"],
  ["chup ho jao", "STOP"],
  ["rok do", "STOP"],
  // English Pause variations
  ["pause", "PAUSE"],
  ["pause reading", "PAUSE"],
  ["pause speaking", "PAUSE"],
  ["pause talking", "PAUSE"],
  ["please pause", "PAUSE"],
  ["wait", "PAUSE"],
  // Hindi & Marathi Pause variations
  ["ruko", "PAUSE"],
  ["रुको", "PAUSE"],
  ["thamba", "PAUSE"],
  ["थांब", "PAUSE"],
  ["ruko thoda", "PAUSE"],
  ["thoda ruko", "PAUSE"],
  // English Resume
  ["resume", "RESUME"],
  ["continue", "RESUME"],
  // Hindi & Marathi Resume
  ["jari rakho", "RESUME"],
  ["जारी रखो", "RESUME"],
  ["punha suru", "RESUME"],
  ["पुन्हा सुरू", "RESUME"],
  ["chalu karo", "RESUME"],
  ["resume karo", "RESUME"],
  // English Repeat/Start
  ["repeat", "REPEAT/START"],
  ["replay", "REPEAT/START"],
  ["speak again", "REPEAT/START"],
  // Hindi Repeat/Start
  ["phir se bolo", "REPEAT/START"],
  ["shuru se", "REPEAT/START"],
  ["dobara bolo", "REPEAT/START"],
  // English Mute/Unmute
  ["mute", "MUTE"],
  ["unmute", "UNMUTE"],
  // Hindi Mute/Unmute
  ["awaaz band", "STOP"],
  ["awaaz chalu", "UNMUTE"],
  ["mute karo", "MUTE"],
  ["unmute karo", "UNMUTE"],
  // Normal questions (should NOT be detected as commands)
  ["what is the course fee?", "NO_COMMAND (Send to AI)"],
  ["does weintern provide certificates?", "NO_COMMAND (Send to AI)"]
];

let failed = 0;
testPhrases.forEach(([phrase, expected]) => {
  const actual = detectVoiceCommand(phrase);
  if (actual !== expected) {
    console.log(`FAIL: "${phrase}" -> expected ${expected}, got ${actual}`);
    failed++;
  } else {
    console.log(`PASS: "${phrase}" -> ${actual}`);
  }
});

console.log(`--- Test finished. Failures: ${failed}/${testPhrases.length} ---`);

