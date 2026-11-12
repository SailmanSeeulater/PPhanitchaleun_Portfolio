// Short notes shown in the Showcase site's "writing" view. Each one is condensed from the findings page
// kept in the Zwans repo (docs/findings.md); the numbers and wording come from there.
export const NOTES_SOURCE = "https://github.com/SailmanSeeulater/zwans/blob/main/docs/findings.md";

export const NOTES = [
  {
    slug: "prompt-caching",
    title: "Caching the system prompt alone saves 11%",
    list: "Prompt caching",
    lead: "Zwans puts two cache breakpoints on every request: one after the system prompt and tools, and one that moves to the end of the conversation on every call. I ran the hard suite three ways to see what each one saves.",
    table: {
      head: ["Caching", "Passed", "$ per attempt", "Cache hits"],
      rows: [
        ["Conversation (default)", "64/72", "0.0168", "89%"],
        ["System prompt only", "68/72", "0.0351", "10%"],
        ["Off", "67/72", "0.0395", "0%"],
      ],
    },
    points: [
      "**Prompt caching cuts cost by 57%** on Haiku 5.5. Almost all of that comes from the breakpoint that follows the conversation.",
      "An agent's input is dominated by its own history, re-sent every call: about 300,000 input tokens per attempt here, against 18,000 output. The system prompt is 3,000 tokens of a context that reaches 20,000 to 60,000.",
      "No latency gain showed up: 6.9 s per model call in every arm. At these sizes, time is spent generating output, not reading input.",
      "The pass-rate differences are not caching. One task passed 1 time in 6 in the default arm and 3 or 4 in 6 in every other arm that day.",
    ],
  },
  {
    slug: "sandbox",
    title: "A sandbox that starts in 4 ms",
    list: "A sandbox of my own",
    lead: "zwans-jail is a Rust program that runs each command in fresh user, PID, mount, network, IPC and UTS namespaces, with a seccomp allowlist and Landlock path rules. An escape suite of 20 tests must all fail to get out, and they do.",
    table: {
      head: ["", "zwans-jail", "docker exec", "docker run"],
      rows: [
        ["Startup on CI's Linux runner, median", "4.0 ms", "37.5 ms", "115.0 ms"],
        ["Startup on CI's Linux runner, p95", "4.3 ms", "38.5 ms", "143.8 ms"],
        ["Hard suite, two runs of 36", "67/72", "67/72", "not run"],
      ],
    },
    points: [
      "**A purpose-built sandbox starts 9 to 29 times faster than Docker**, on the same Linux machine, at the same pass rate.",
      "A namespace sandbox costs a millisecond or two of setup, so one per command is affordable, and it needs no daemon.",
      "It has no network at all, which would fail a task that needs pip install. None here do. The jail runs only on Linux.",
      "A first measurement with fewer system folders mounted came out at 2.5 ms. That flattered it, so the table uses the same mounts as the executor.",
    ],
  },
  {
    slug: "one-run-lies",
    title: "One run is not a measurement",
    list: "One run lies",
    lead: "Every change to Zwans goes through an eval platform that runs the agent on fixed tasks and checks the result with hidden tests. The most useful thing it taught me was how little a single run says.",
    points: [
      "**Identical setups differed by 11 points between runs**, and a single task swung from 1 of 6 passes to 4 of 6. The comparison tool called one of those swings significant.",
      "A single attempt per task put Sonnet's hard-tier pass rate at 83%. With three it was 97%.",
      "The bootstrap resamples tasks, so it can't see that a whole run can be lucky. Run twice, or with six repeats, before believing a pass-rate difference under about 10 points.",
      "Suites saturate. With pass rates near the ceiling, experiments are read through cost, tool calls and time instead.",
      "Look for the cause in the transcript. Most experiments were settled by counting things in transcripts: field names, repeated reads, compactions one step apart.",
    ],
  },
];
