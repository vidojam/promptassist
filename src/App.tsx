import { useMemo, useState } from "react";

type RowData = {
  subject: string;
  checked: boolean;
  subtopics: string;
};

const subjects = [
  "Goal",
  "Tech Stack",
  "Style and Visual Direction",
  "Page Structure",
  "Hero Section Left",
  "Hero Section Right",
  "Social Proof",
  "How it works (3 steps)",
  "Feature Highlights",
  "Features",
  "App Preview Section",
  "Promo Banner",
  "Final CTA section",
  "Footer",
  "Animations and interactions",
  "Responsiveness",
  "Accessibility",
  "Deleverable"
];

function normalize(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function App() {
  const [clientName, setClientName] = useState("");
  const [statusMessage, setStatusMessage] = useState("Choose rows, add subtopics, and click Generate prompt.");
  const [promptOutput, setPromptOutput] = useState("");
  const [rows, setRows] = useState<RowData[]>(
    subjects.map((subject) => ({ subject, checked: false, subtopics: "" }))
  );

  const selectedCount = useMemo(() => rows.filter((item) => item.checked).length, [rows]);

  const clientHeader = normalize(clientName) ? `${normalize(clientName)} (checkmark)` : "Name of client";

  const updateRow = (index: number, update: Partial<RowData>) => {
    setRows((currentRows) =>
      currentRows.map((row, rowIndex) => (rowIndex === index ? { ...row, ...update } : row))
    );
  };

  const setAllChecks = (value: boolean) => {
    setRows((currentRows) => currentRows.map((row) => ({ ...row, checked: value })));
    setStatusMessage(value ? "All rows selected." : "All row selections cleared.");
  };

  const clearAll = () => {
    setRows((currentRows) => currentRows.map((row) => ({ ...row, checked: false, subtopics: "" })));
    setPromptOutput("");
    setStatusMessage("All checkmarks and textboxes were cleared.");
  };

  const generatePrompt = () => {
    const selectedRows = rows.filter((row) => row.checked);

    if (!selectedRows.length) {
      setPromptOutput("");
      setStatusMessage("Select at least one row before generating a prompt.");
      return;
    }

    const details = selectedRows
      .map((item, index) => {
        const subtopics = normalize(item.subtopics);
        return `${index + 1}. ${item.subject}\n   Subtopics: ${subtopics || "(not provided)"}`;
      })
      .join("\n\n");

    const client = normalize(clientName) || "the client";
    const prompt = [
      `Create a modern, responsive app concept for ${client}.`,
      "",
      "Use the selected sections below and follow each requirement carefully:",
      "",
      details,
      "",
      "Return the result as a structured implementation-ready plan with clear section headings."
    ].join("\n");

    setPromptOutput(prompt);
    setStatusMessage(`Prompt generated using ${selectedRows.length} selected row(s).`);
  };

  const copyPrompt = async () => {
    if (!promptOutput) {
      setStatusMessage("Generate a prompt first, then copy it.");
      return;
    }

    try {
      await navigator.clipboard.writeText(promptOutput);
      setStatusMessage("Prompt copied to clipboard.");
    } catch {
      setStatusMessage("Clipboard copy failed. Select the output and copy manually.");
    }
  };

  return (
    <main className="mx-auto grid max-w-7xl gap-4 p-3 md:p-5">
      <header className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-4 shadow-xl shadow-slate-950/40 backdrop-blur">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="m-0 text-2xl font-extrabold tracking-tight sm:text-3xl">PromptAssist</h1>
            <p className="mt-1 text-sm text-slate-300 sm:text-base">
              Build complete app prompts quickly using selectable rows and subtopics.
            </p>
          </div>
          <div className="grid w-full max-w-sm gap-1">
            <label htmlFor="clientName" className="text-sm font-semibold text-slate-200">
              Name of client
            </label>
            <input
              id="clientName"
              type="text"
              value={clientName}
              onChange={(event) => setClientName(event.target.value)}
              placeholder="Enter client name"
              className="rounded-lg border border-slate-600 bg-slate-950/70 px-3 py-2 text-slate-100 outline-none ring-0 transition focus:border-amber-400 focus:shadow-[0_0_0_3px_rgba(251,191,36,0.35)]"
            />
          </div>
        </div>
      </header>

      <section
        aria-label="Prompt row builder"
        className="rounded-2xl border border-slate-700/60 bg-slate-900/70 p-3 shadow-xl shadow-slate-950/40 backdrop-blur"
      >
        <div className="overflow-auto">
          <table className="w-full min-w-[860px] border-collapse text-sm">
            <caption className="sr-only">Prompt rows with include checkbox and subtopics textbox.</caption>
            <thead>
              <tr className="bg-slate-900/95 text-left text-slate-200">
                <th className="sticky top-0 border-b border-slate-700/60 px-3 py-2">{clientHeader}</th>
                <th className="sticky top-0 border-b border-slate-700/60 px-3 py-2">Row Subject</th>
                <th className="sticky top-0 border-b border-slate-700/60 px-3 py-2">Subtopics</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row.subject} className="border-b border-slate-700/45 transition-colors hover:bg-slate-800/55">
                  <td className="px-3 py-2 text-center align-top">
                    <label
                      htmlFor={`row-check-${index}`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-600 bg-slate-950/70"
                    >
                      <span className="sr-only">Include {row.subject}</span>
                      <input
                        id={`row-check-${index}`}
                        type="checkbox"
                        checked={row.checked}
                        onChange={(event) => updateRow(index, { checked: event.target.checked })}
                        className="h-4 w-4 accent-blue-400"
                      />
                    </label>
                  </td>
                  <td className="px-3 py-2 align-top font-semibold text-slate-100">{row.subject}</td>
                  <td className="px-3 py-2 align-top">
                    <textarea
                      value={row.subtopics}
                      onChange={(event) => updateRow(index, { subtopics: event.target.value })}
                      placeholder={`Enter subtopics for ${row.subject}...`}
                      aria-label={`Subtopics for ${row.subject}`}
                      className="min-h-20 w-full resize-y rounded-lg border border-slate-600 bg-slate-950/70 px-3 py-2 text-slate-100 outline-none transition focus:border-amber-400 focus:shadow-[0_0_0_3px_rgba(251,191,36,0.35)]"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-label="Prompt actions" className="flex flex-wrap gap-2 rounded-2xl border border-slate-700/60 bg-slate-900/70 p-3 shadow-xl shadow-slate-950/40 backdrop-blur">
        <button
          type="button"
          onClick={() => setAllChecks(true)}
          className="rounded-lg border border-blue-400/40 bg-blue-500/20 px-4 py-2 font-medium transition hover:-translate-y-0.5 hover:brightness-110"
        >
          Check all
        </button>
        <button
          type="button"
          onClick={clearAll}
          className="rounded-lg border border-slate-500/50 bg-slate-500/15 px-4 py-2 font-medium transition hover:-translate-y-0.5 hover:brightness-110"
        >
          Clear all
        </button>
        <button
          type="button"
          onClick={generatePrompt}
          className="rounded-lg border border-transparent bg-gradient-to-r from-blue-500 to-violet-500 px-4 py-2 font-semibold text-white transition hover:-translate-y-0.5 hover:brightness-110"
        >
          Generate prompt
        </button>
        <button
          type="button"
          onClick={copyPrompt}
          className="rounded-lg border border-slate-500/50 bg-slate-500/15 px-4 py-2 font-medium transition hover:-translate-y-0.5 hover:brightness-110"
        >
          Copy prompt
        </button>
        <p className="my-auto ml-auto text-sm text-slate-300">Selected rows: {selectedCount}</p>
      </section>

      <section
        aria-label="Generated prompt output"
        className="grid gap-3 rounded-2xl border border-slate-700/60 bg-slate-900/70 p-4 shadow-xl shadow-slate-950/40 backdrop-blur"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="m-0 text-lg font-bold">Generated Prompt</h2>
          <p role="status" aria-live="polite" className="m-0 text-sm text-slate-300">
            {statusMessage}
          </p>
        </div>
        <textarea
          readOnly
          spellCheck={false}
          value={promptOutput}
          placeholder="Your generated prompt will appear here..."
          className="min-h-60 w-full rounded-lg border border-slate-600 bg-slate-950/70 px-3 py-2 text-slate-100 outline-none"
        />
      </section>
    </main>
  );
}

export default App;
