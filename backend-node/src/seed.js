// Startup seed data. Mirrors backend/seed.py exactly.
//
// Two tiers, controlled by config.SEED_DEMO_DATA:
//
// 1. Always applied (real product content, safe in production):
//    the therapist account named by ADMIN_EMAIL/ADMIN_PASSWORD, the public
//    therapist profile copy, and the public resource library articles.
// 2. Demo-only (SEED_DEMO_DATA, default true — set false in production):
//    the sample client account plus its sample appointments/journal/homework/
//    consultation-request inbox items.
"use strict";
const { pool } = require("./db");
const { newId } = require("./lib/ids");
const { hashPassword, verifyPassword } = require("./security");
const config = require("./config");

async function seed() {
  // ---- Therapist admin (real account — always applied) ----
  const [therapistRows] = await pool.query("SELECT * FROM users WHERE email = ?", [config.ADMIN_EMAIL]);
  let therapist = therapistRows[0];
  if (!therapist) {
    const id = newId();
    await pool.query(
      "INSERT INTO users (id, email, password_hash, name, role) VALUES (?, ?, ?, 'Anushka Prabhu', 'therapist')",
      [id, config.ADMIN_EMAIL, hashPassword(config.ADMIN_PASSWORD)],
    );
    const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [id]);
    therapist = rows[0];
  } else {
    const updates = {};
    if (!verifyPassword(config.ADMIN_PASSWORD, therapist.password_hash)) {
      updates.password_hash = hashPassword(config.ADMIN_PASSWORD);
    }
    if (therapist.name !== "Anushka Prabhu") updates.name = "Anushka Prabhu";
    if (Object.keys(updates).length) {
      const set = Object.keys(updates).map((k) => `${k} = ?`).join(", ");
      await pool.query(`UPDATE users SET ${set} WHERE email = ?`, [...Object.values(updates), config.ADMIN_EMAIL]);
    }
  }

  // ---- Sample client (demo-only) ----
  let clientDoc = null;
  if (config.SEED_DEMO_DATA) {
    const [clientRows] = await pool.query("SELECT * FROM users WHERE email = ?", [config.CLIENT_SEED_EMAIL]);
    clientDoc = clientRows[0];
    if (!clientDoc) {
      const id = newId();
      await pool.query(
        "INSERT INTO users (id, email, password_hash, name, role) VALUES (?, ?, ?, 'Maya Iyer', 'client')",
        [id, config.CLIENT_SEED_EMAIL, hashPassword(config.CLIENT_SEED_PASSWORD)],
      );
      const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [id]);
      clientDoc = rows[0];
    } else if (!verifyPassword(config.CLIENT_SEED_PASSWORD, clientDoc.password_hash)) {
      await pool.query("UPDATE users SET password_hash = ? WHERE email = ?", [
        hashPassword(config.CLIENT_SEED_PASSWORD), config.CLIENT_SEED_EMAIL,
      ]);
    }
  }

  // ---- Public therapist profile (upserted on every boot so copy stays fresh) ----
  const profile = {
    slug: "primary",
    name: "Anushka Prabhu",
    title: "Counselling Psychologist",
    personal_note:
      "My decision to start a private practice came from a desire to " +
      "prioritise my own mental health and create a way of working that " +
      "allows me to be fully present — with both my clients and in my " +
      "personal life. I believe that being able to show up authentically " +
      "and without being consumed by work enables me to offer more " +
      "thoughtful and compassionate care.",
    approach:
      "Beginning therapy can feel daunting, and I will do my best to make " +
      "the process as seamless and comfortable as possible. I've built this " +
      "practice with the intention of creating a space where people from " +
      "all walks of life feel understood and held as they explore the " +
      "challenges they are facing — or simply try to make sense of life. " +
      "Therapy is not a one-size-fits-all process; each person's needs, " +
      "experiences, and goals deserve thoughtful consideration. My approach " +
      "is collaborative, flexible, and always open to conversation, so we " +
      "can shape the therapeutic journey together in a way that feels " +
      "meaningful and supportive for you.",
    qualifications: [
      { label: "Education", value: (
        "M.A. Psychology (Clinical), Mumbai University · " +
        "Certificate in Solution-Focused Brief Therapy · " +
        "Certificate in Transactional Analysis (TA 101) · " +
        "Certificate course in Gottman's Couple Therapy · " +
        "Certificate course in Rational Emotive Behavioural Therapy " +
        "and Acceptance and Commitment Therapy"
      ) },
      { label: "Experience", value: (
        "School Counsellor (1 year) · " +
        "Counselling Psychologist at AYJNISHD (1 year) · " +
        "Private Practice (since May 2025)"
      ) },
      { label: "Languages", value: "English, Hindi, Marathi" },
    ],
    areas: [
      "Anxiety", "Depression", "Relationship issues", "Body image issues",
      "Rumination", "Self-image issues", "Stress management",
      "Anger management", "Interpersonal problems",
    ],
    pillars: [
      { title: "Compassion", body: "A space where you feel understood and held, without judgement." },
      { title: "Collaboration", body: "Therapy is something we shape together, in conversation." },
      { title: "Flexibility", body: "No one-size-fits-all. Your needs and goals guide the work." },
      { title: "Presence", body: "Being fully here, so care can be thoughtful and unhurried." },
    ],
  };
  await pool.query(
    `INSERT INTO therapist_profile (slug, name, title, personal_note, approach, qualifications, areas, pillars)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE name=VALUES(name), title=VALUES(title), personal_note=VALUES(personal_note),
       approach=VALUES(approach), qualifications=VALUES(qualifications), areas=VALUES(areas), pillars=VALUES(pillars)`,
    [profile.slug, profile.name, profile.title, profile.personal_note, profile.approach,
      JSON.stringify(profile.qualifications), JSON.stringify(profile.areas), JSON.stringify(profile.pillars)],
  );

  // ---- Sample public resources (upserted by title so copy stays current) ----
  const samples = [
    { title: "Understanding Anxiety: A Gentle Primer", category: "Anxiety",
      kind: "article", is_public: true,
      description: "A calm, plain-language introduction to how anxiety works and what helps.",
      body:
        "Anxiety is your body's way of saying it cares about the outcome. It shows up " +
        "before the things that matter to you: a conversation you've been putting off, a " +
        "result you're waiting on, a room full of people you don't know yet. The racing " +
        "heart, the tight chest, the mind that won't stop rehearsing worst cases. None of " +
        "it means something is wrong with you. It means your nervous system is doing " +
        "exactly what it evolved to do, just a little too loudly for the size of the " +
        "actual threat.\n\n" +
        "Most people find it helps to notice anxiety early, before it has built a full " +
        "story. A tight jaw, a shallow breath, a sudden urge to check your phone: these " +
        "are often the opening moves, long before the thought \"something bad is going to " +
        "happen\" arrives. Catch it there and you have more room to respond gently instead " +
        "of reactively.\n\n" +
        "Anxiety also tends to shrink slightly the moment it's named out loud, even just " +
        "to yourself. \"This is anxiety, not danger\" is a small sentence that does a " +
        "surprising amount of work. It reminds the thinking part of your brain that it's " +
        "allowed to stay in the room.\n\n" +
        "And it isn't a problem you solve in one sitting. It responds to repetition, the " +
        "same slow breath, the same honest check-in, the same small act of staying " +
        "present, more than it responds to any single insight. You don't have to make it " +
        "disappear. You just have to keep meeting it with a little more steadiness each " +
        "time." },
    { title: "A Box Breathing Exercise", category: "Coping tools",
      kind: "article", is_public: true,
      description: "A four-count breathing pattern you can return to during difficult moments.",
      body:
        "Box breathing is a slow, even pattern that gives your nervous system something " +
        "predictable to hold onto when everything else feels uncertain. Therapists use " +
        "it. So do athletes, and for the same reason: it's simple enough to do anywhere, " +
        "and it works on the body directly, without needing you to think your way out of " +
        "anything first.\n\n" +
        "The pattern:\n\n" +
        "Breathe in slowly through your nose for a count of four.\n" +
        "Hold that breath gently for a count of four. No straining, just a pause.\n" +
        "Breathe out slowly through your mouth for a count of four.\n" +
        "Hold the empty breath for a count of four before beginning again.\n\n" +
        "Picture each phase as one side of a box, tracing the edges as you go. Repeat the " +
        "cycle for four to six rounds, or for as long as feels steadying. If four counts " +
        "feels like a stretch at first, three is fine. The rhythm matters more than the " +
        "exact number.\n\n" +
        "Use it anywhere: before a hard conversation, in the middle of a spiraling " +
        "thought, or simply as a way to close out the day. There's no wrong time to come " +
        "back to your breath." },
    { title: "The Reflection Journal Prompt Library", category: "Reflection",
      kind: "article", is_public: true,
      description: "Twelve gentle prompts to explore, each written to feel less like homework and more like a conversation.",
      body:
        "These prompts aren't a checklist. Pick whichever one meets you where you are " +
        "today. There's no right length for an answer; a single sentence counts.\n\n" +
        "1. What is one thing I'm carrying today that no one else can see?\n" +
        "2. When did I last feel fully like myself, and what made that possible?\n" +
        "3. What would I say to a friend who felt the way I feel right now?\n" +
        "4. What am I avoiding, and what am I afraid it means about me?\n" +
        "5. What's a small thing that went right today, even if the day was hard?\n" +
        "6. Where in my body am I holding tension right now, and what might it be saying?\n" +
        "7. What do I need more of this week: rest, connection, structure, or space?\n" +
        "8. What's a story I keep telling myself that might not be entirely true?\n" +
        "9. Who or what made me feel steady recently?\n" +
        "10. What would 'enough' look like today, instead of 'everything'?\n" +
        "11. What's one boundary I wish I had held more firmly this week?\n" +
        "12. If I could offer myself one piece of kindness right now, what would it be?\n\n" +
        "Return to these as often as you like. The point isn't to finish them. It's to " +
        "keep the conversation with yourself open." },
    { title: "Grief and the Shape of a Day", category: "Grief",
      kind: "article", is_public: true,
      description: "A short essay on making room for grief without letting it define you.",
      body:
        "Grief rarely arrives on a schedule. It doesn't announce itself at the start of " +
        "the day and leave politely by evening. More often it shows up sideways, in a " +
        "smell, a song, an empty chair at a table, long after you thought you'd already " +
        "done the crying you needed to do.\n\n" +
        "One of the hardest parts of grief is the expectation that it should look like " +
        "something: a clean arc, a set number of stages, a date by which you should feel " +
        "'better.' In practice, grief is less like a line and more like weather. Some days " +
        "are overcast and manageable. Others arrive as a sudden storm you didn't see " +
        "coming, even years later.\n\n" +
        "It can help to think of grief not as something to get through, but as something " +
        "that gets folded into the shape of an ordinary day, sitting alongside the " +
        "laundry, the meetings, the small pleasures, rather than replacing them entirely. " +
        "You're allowed to laugh in the same week you cry. You're allowed to feel lighter " +
        "on a Tuesday and heavier on a Thursday, with no explanation required.\n\n" +
        "Making room for grief is not the same as letting it define you. You can carry " +
        "loss and still reach for the rest of your life at the same time. Neither " +
        "cancels the other out." },
    { title: "Sleep as a Form of Care", category: "Wellbeing",
      kind: "article", is_public: true,
      description: "How rest quietly shapes our capacity for feeling.",
      body:
        "The body remembers what the mind cannot always name. Long before we can put " +
        "words to why we feel raw or short-tempered or strangely fragile, sleep has " +
        "usually already told the story. One bad night rarely undoes us, but a stretch of " +
        "them quietly narrows everything: patience, perspective, even our sense of " +
        "whether things are actually as bad as they feel.\n\n" +
        "It's tempting to treat sleep as the thing you sacrifice first when life gets " +
        "full, as though rest were a reward you earn after everything else is handled. In " +
        "practice it works the other way around. Sleep is closer to the foundation that " +
        "makes handling everything else possible at all.\n\n" +
        "You don't need a perfect routine to start caring for your sleep, just a few " +
        "honest questions. What time do I actually wind down, versus when I tell myself I " +
        "will? What's the last thing my mind is doing before I try to fall asleep: " +
        "scrolling, worrying, planning tomorrow? Does my body get any signal that the day " +
        "is closing, or does it go from full speed to lights-off with nothing in " +
        "between?\n\n" +
        "Rest is not indulgent. It's one of the quieter, steadier forms of care you can " +
        "offer yourself, and one that makes almost everything else feel more possible." },
    { title: "When You Feel Like You're Not Doing Enough", category: "Self-esteem",
      kind: "article", is_public: true,
      description: "A tender read for the days that feel small.",
      body:
        "Some days are for tending, not producing. That's a hard sentence to believe when " +
        "the voice in your head keeps a running tally of everything left undone: the " +
        "reply you haven't sent, the goal you haven't hit, the version of yourself you " +
        "imagine other people are further along toward becoming.\n\n" +
        "Enough is rarely a fixed amount. It moves depending on how much you're already " +
        "carrying, how much sleep you got, what else is quietly asking for your attention " +
        "that no one else can see. The same task that feels easy on a good week can feel " +
        "enormous on a hard one, and that's not a failure of willpower. It's just what " +
        "being human under real conditions looks like.\n\n" +
        "If you're in a season where everything feels like not enough, it can help to ask " +
        "a smaller question than 'am I doing enough': what is one true thing I did today " +
        "to take care of myself or someone else? Getting out of bed counts. Answering one " +
        "message counts. Simply making it to the end of a hard day counts.\n\n" +
        "You are allowed to measure your days by care instead of output, at least " +
        "sometimes. Productivity was never meant to be the only unit that mattered." },
  ];
  for (const s of samples) {
    const [existing] = await pool.query("SELECT id FROM resources WHERE title = ?", [s.title]);
    if (existing[0]) {
      await pool.query(
        "UPDATE resources SET description=?, category=?, kind=?, is_public=?, body=? WHERE title=?",
        [s.description, s.category, s.kind, s.is_public ? 1 : 0, s.body, s.title],
      );
    } else {
      await pool.query(
        "INSERT INTO resources (id, title, description, category, kind, is_public, body, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [newId(), s.title, s.description, s.category, s.kind, s.is_public ? 1 : 0, s.body, therapist.id],
      );
    }
  }

  // ---- Sample appointments / notes / homework / reflection / requests (demo-only) ----
  if (config.SEED_DEMO_DATA && clientDoc) {
    const [[{ n: apptCount }]] = await pool.query(
      "SELECT COUNT(*) AS n FROM appointments WHERE client_id = ?", [clientDoc.id],
    );
    if (apptCount === 0) {
      const today = new Date();
      const offsets = [[3, "scheduled"], [-4, "completed"], [-11, "completed"]];
      for (const [dateOffset, status] of offsets) {
        const d = new Date(today);
        d.setDate(d.getDate() + dateOffset);
        await pool.query(
          `INSERT INTO appointments (id, client_id, therapist_id, date, time, duration_min, mode, status)
           VALUES (?, ?, ?, ?, '10:00', 50, 'online', ?)`,
          [newId(), clientDoc.id, therapist.id, d.toISOString().slice(0, 10), status],
        );
      }
    }

    const [[{ n: noteCount }]] = await pool.query(
      "SELECT COUNT(*) AS n FROM session_notes WHERE client_id = ?", [clientDoc.id],
    );
    if (noteCount === 0) {
      const created = new Date();
      created.setDate(created.getDate() - 4);
      await pool.query(
        `INSERT INTO session_notes (id, therapist_id, client_id, summary, homework, resources, shared_with_client, created_at)
         VALUES (?, ?, ?, ?, ?, ?, 1, ?)`,
        [newId(), therapist.id, clientDoc.id,
          "We spoke about the weight of expectations at work, and how it " +
          "shows up in the body first. You named the feeling as 'a held breath.' " +
          "We practised naming small moments of rest between demands.",
          "Notice one 'held breath' moment each day. Write down what preceded it.",
          JSON.stringify([]), created],
      );
    }

    const [[{ n: hwCount }]] = await pool.query(
      "SELECT COUNT(*) AS n FROM homework WHERE client_id = ?", [clientDoc.id],
    );
    if (hwCount === 0) {
      const d1 = new Date(); d1.setDate(d1.getDate() - 3);
      const d2 = new Date(); d2.setDate(d2.getDate() - 1);
      await pool.query(
        `INSERT INTO homework (id, therapist_id, client_id, title, description, type, items, completed, completed_items, client_notes, created_at)
         VALUES (?, ?, ?, ?, ?, 'writing', NULL, 0, ?, '', ?)`,
        [newId(), therapist.id, clientDoc.id, "A gentle noticing practice",
          "Each evening, write down one moment from your day that felt tender.",
          JSON.stringify([]), d1],
      );
      await pool.query(
        `INSERT INTO homework (id, therapist_id, client_id, title, description, type, items, completed, completed_items, client_notes, created_at)
         VALUES (?, ?, ?, ?, ?, 'checklist', ?, 0, ?, '', ?)`,
        [newId(), therapist.id, clientDoc.id, "Grounding checklist",
          "When overwhelm arrives, work through these steps gently.",
          JSON.stringify(["Name five things you can see", "Name four you can touch",
            "Name three you can hear", "Name two you can smell", "Take one slow breath"]),
          JSON.stringify([]), d2],
      );
    }

    const [[{ n: reflCount }]] = await pool.query(
      "SELECT COUNT(*) AS n FROM reflections WHERE user_id = ?", [clientDoc.id],
    );
    if (reflCount === 0) {
      const created = new Date();
      created.setDate(created.getDate() - 2);
      await pool.query(
        `INSERT INTO reflections (id, user_id, title, body, mood, is_draft, created_at)
         VALUES (?, ?, 'The morning walk', ?, 'gentle', 0, ?)`,
        [newId(), clientDoc.id,
          "I walked without music today. Everything felt louder and softer at once. " +
          "I noticed the light on the wall and let it be enough.", created],
      );
    }

    const [[{ n: crCount }]] = await pool.query("SELECT COUNT(*) AS n FROM consultation_requests");
    if (crCount === 0) {
      await pool.query(
        `INSERT INTO consultation_requests (id, name, email, reason, preferred_time, status) VALUES
         (?, 'Rhea Kapoor', 'rhea@example.com', 'Recent transition, feeling ungrounded.', 'Weekday evenings', 'new'),
         (?, 'Sameer Ahuja', 'sameer@example.com', 'Work burnout and disturbed sleep.', 'Saturday mornings', 'new')`,
        [newId(), newId()],
      );
    }
  }
}

module.exports = { seed };
