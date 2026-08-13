const commands = {
  STOP: /^(stop|stop speaking|shut up|stop it|ruko|band karo|chup|chup ho jao|ruk)$/i,
  STOP_SUB: /\b(stop speaking|band karo|chup ho jao)\b/i,
  
  PAUSE: /^(pause|pause speech|wait|hold on|ruko thoda|thoda ruko|rokna|roko|hold karo)$/i,
  PAUSE_SUB: /\b(pause speech|thoda ruko|hold karo)\b/i,

  RESUME: /^(resume|continue|go on|chalu karo|phir se chalu karo|continue karo|resume karo)$/i,
  RESUME_SUB: /\b(continue karo|phir se chalu karo|resume karo)\b/i,

  REPEAT: /^(start|begin|repeat|speak again|replay|read again|say again|tell me again|shuru karo|shuru se|play karo|shuru|pehle se|phir se bolo|phir se|dobara bolo|wapas bolo)$/i,
  REPEAT_SUB: /\b(speak again|read again|say again|tell me again|shuru karo|pehle se|phir se bolo|dobara bolo|wapas bolo)\b/i,

  MUTE: /^(mute|mute volume|turn off voice|silent|awaaz band|mute karo|silent karo|aawaz band)$/i,
  MUTE_SUB: /\b(mute volume|turn off voice|awaaz band|mute karo|silent karo|aawaz band)\b/i,

  UNMUTE: /^(unmute|unmute volume|turn on voice|speak up|voice on|awaaz chalu|unmute karo|speak karo|aawaz chalu)$/i,
  UNMUTE_SUB: /\b(unmute volume|turn on voice|awaaz chalu|unmute karo|speak karo|aawaz chalu)\b/i
};

function testCommand(text) {
  const rawLower = text.toLowerCase().trim();
  if (commands.STOP.test(rawLower) || commands.STOP_SUB.test(rawLower)) return "STOP";
  if (commands.PAUSE.test(rawLower) || commands.PAUSE_SUB.test(rawLower)) return "PAUSE";
  if (commands.RESUME.test(rawLower) || commands.RESUME_SUB.test(rawLower)) return "RESUME";
  if (commands.REPEAT.test(rawLower) || commands.REPEAT_SUB.test(rawLower)) return "REPEAT/START";
  if (commands.MUTE.test(rawLower) || commands.MUTE_SUB.test(rawLower)) return "MUTE";
  if (commands.UNMUTE.test(rawLower) || commands.UNMUTE_SUB.test(rawLower)) return "UNMUTE";
  return "NO_COMMAND (Send to AI)";
}

const testPhrases = [
  // English Stop
  ["stop", "STOP"],
  ["stop speaking", "STOP"],
  // Hindi Stop
  ["ruko", "STOP"],
  ["band karo", "STOP"],
  ["chup ho jao", "STOP"],
  // English Pause
  ["pause", "PAUSE"],
  ["wait", "PAUSE"],
  // Hindi Pause
  ["ruko thoda", "PAUSE"],
  ["roko", "PAUSE"],
  // English Resume
  ["resume", "RESUME"],
  ["continue", "RESUME"],
  // Hindi Resume
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
  ["awaaz band", "MUTE"],
  ["awaaz chalu", "UNMUTE"],
  ["mute karo", "MUTE"],
  ["unmute karo", "UNMUTE"],
  // Normal questions (should NOT be detected as commands)
  ["what is the course fee?", "NO_COMMAND (Send to AI)"],
  ["does weintern provide certificates?", "NO_COMMAND (Send to AI)"]
];

let failed = 0;
testPhrases.forEach(([phrase, expected]) => {
  const actual = testCommand(phrase);
  if (actual !== expected) {
    console.log(`FAIL: "${phrase}" -> expected ${expected}, got ${actual}`);
    failed++;
  } else {
    console.log(`PASS: "${phrase}" -> ${actual}`);
  }
});

console.log(`--- Test finished. Failures: ${failed}/${testPhrases.length} ---`);
