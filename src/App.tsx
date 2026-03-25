import { useEffect, useMemo, useRef, useState } from "react";

type RowData = {
  subject: string;
  checked: boolean;
  subtopics: string[];
  subtopicOptions: string[];
  subtopicInput: string;
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
  "Deliverable"
];

const maxSubtopicOptions = 25;
const storageKey = "promptassist-form-state-v1";

function createDefaultRows(): RowData[] {
  return subjects.map((subject) => ({
    subject,
    checked: false,
    subtopics: [],
    subtopicOptions: [],
    subtopicInput: ""
  }));
}

function readPersistedState() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as {
      clientName?: unknown;
      promptOutput?: unknown;
      rows?: unknown;
    };
  } catch {
    return null;
  }
}

function restoreRows(rawRows: unknown): RowData[] {
  const defaultRows = createDefaultRows();
  if (!Array.isArray(rawRows)) {
    return defaultRows;
  }

  return defaultRows.map((defaultRow, index) => {
    const savedRow = rawRows[index];
    if (!savedRow || typeof savedRow !== "object") {
      return defaultRow;
    }

    const row = savedRow as Partial<RowData>;
    const safeOptions = Array.isArray(row.subtopicOptions)
      ? Array.from(
          new Set(
            row.subtopicOptions
              .filter((item): item is string => typeof item === "string")
              .map((item) => normalize(item))
              .filter(Boolean)
          )
        ).slice(0, maxSubtopicOptions)
      : [];

    const safeSubtopics = Array.isArray(row.subtopics)
      ? row.subtopics
          .filter((item): item is string => typeof item === "string")
          .map((item) => normalize(item))
          .filter((item) => safeOptions.includes(item))
      : [];

    return {
      subject: defaultRow.subject,
      checked: row.checked === true,
      subtopicOptions: safeOptions,
      subtopics: safeSubtopics,
      subtopicInput: typeof row.subtopicInput === "string" ? row.subtopicInput : safeOptions.join("\n")
    };
  });
}

function normalize(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function App() {
  const [clientName, setClientName] = useState(() => {
    const persisted = readPersistedState();
    return typeof persisted?.clientName === "string" ? persisted.clientName : "";
  });
  const [statusMessage, setStatusMessage] = useState("Choose rows, select subtopics, and click Generate prompt.");
  const [promptOutput, setPromptOutput] = useState(() => {
    const persisted = readPersistedState();
    return typeof persisted?.promptOutput === "string" ? persisted.promptOutput : "";
  });
  const [showCheckedOnly, setShowCheckedOnly] = useState(false);
  const subtopicDetailsRefs = useRef<Array<HTMLDetailsElement | null>>([]);
  const [rows, setRows] = useState<RowData[]>(() => {
    const persisted = readPersistedState();
    return restoreRows(persisted?.rows);
  });
  const [editingOptionByRow, setEditingOptionByRow] = useState<Record<number, string | null>>({});
  const [editingTextByRow, setEditingTextByRow] = useState<Record<number, string>>({});

  const selectedCount = useMemo(() => rows.filter((item) => item.checked).length, [rows]);
  const displayedRows = useMemo(
    () => (showCheckedOnly ? rows.filter((item) => item.checked) : rows),
    [rows, showCheckedOnly]
  );

  const clientHeader = normalize(clientName) ? `${normalize(clientName)} (checkmark)` : "Name of client";

  useEffect(() => {
    try {
      window.localStorage.setItem(
        storageKey,
        JSON.stringify({
          clientName,
          promptOutput,
          rows
        })
      );
    } catch {
      return;
    }
  }, [clientName, promptOutput, rows]);

  const updateRow = (index: number, update: Partial<RowData>) => {
    setRows((currentRows) =>
      currentRows.map((row, rowIndex) => (rowIndex === index ? { ...row, ...update } : row))
    );
  };

  const toggleSubtopic = (rowIndex: number, option: string, checked: boolean) => {
    setRows((currentRows) =>
      currentRows.map((row, index) => {
        if (index !== rowIndex) {
          return row;
        }

        if (checked) {
          if (row.subtopics.includes(option)) {
            return row;
          }
          return { ...row, subtopics: [...row.subtopics, option] };
        }

        return { ...row, subtopics: row.subtopics.filter((item) => item !== option) };
      })
    );
  };

  const setAllChecks = (value: boolean) => {
    setRows((currentRows) => currentRows.map((row) => ({ ...row, checked: value })));
    setStatusMessage(value ? "All rows selected." : "All row selections cleared.");
  };

  const clearAll = () => {
    setRows((currentRows) => currentRows.map((row) => ({ ...row, checked: false, subtopics: [] })));
    setPromptOutput("");
    setStatusMessage("All checkmarks and subtopic selections were cleared.");
  };

  const addSubtopicOption = (rowIndex: number) => {
    const row = rows[rowIndex];
    if (!row) {
      return;
    }

    const nextOption = normalize(row.subtopicInput);
    if (!nextOption) {
      setStatusMessage(`Enter a subtopic for ${row.subject} before adding.`);
      return;
    }

    if (row.subtopicOptions.includes(nextOption)) {
      setStatusMessage(`"${nextOption}" already exists for ${row.subject}.`);
      return;
    }

    if (row.subtopicOptions.length >= maxSubtopicOptions) {
      setStatusMessage(`${row.subject} already has the maximum of ${maxSubtopicOptions} options.`);
      return;
    }

    setRows((currentRows) =>
      currentRows.map((currentRow, index) => {
        if (index !== rowIndex) {
          return currentRow;
        }

        return {
          ...currentRow,
          subtopicOptions: [...currentRow.subtopicOptions, nextOption],
          subtopicInput: ""
        };
      })
    );

    window.setTimeout(() => {
      const dropdown = subtopicDetailsRefs.current[rowIndex];
      if (dropdown) {
        dropdown.open = true;
      }
    }, 0);

    setStatusMessage(`Added "${nextOption}" to ${row.subject}.`);
  };

  const startEditSubtopicOption = (rowIndex: number, option: string) => {
    setEditingOptionByRow((current) => ({ ...current, [rowIndex]: option }));
    setEditingTextByRow((current) => ({ ...current, [rowIndex]: option }));
  };

  const cancelEditSubtopicOption = (rowIndex: number) => {
    setEditingOptionByRow((current) => ({ ...current, [rowIndex]: null }));
    setEditingTextByRow((current) => ({ ...current, [rowIndex]: "" }));
  };

  const saveEditSubtopicOption = (rowIndex: number, previousOption: string) => {
    const row = rows[rowIndex];
    if (!row) {
      return;
    }

    const updatedOption = normalize(editingTextByRow[rowIndex] || "");
    if (!updatedOption) {
      setStatusMessage(`Subtopic name cannot be empty for ${row.subject}.`);
      return;
    }

    if (updatedOption !== previousOption && row.subtopicOptions.includes(updatedOption)) {
      setStatusMessage(`"${updatedOption}" already exists for ${row.subject}.`);
      return;
    }

    setRows((currentRows) =>
      currentRows.map((currentRow, index) => {
        if (index !== rowIndex) {
          return currentRow;
        }

        return {
          ...currentRow,
          subtopicOptions: currentRow.subtopicOptions.map((option) =>
            option === previousOption ? updatedOption : option
          ),
          subtopics: currentRow.subtopics.map((subtopic) =>
            subtopic === previousOption ? updatedOption : subtopic
          )
        };
      })
    );

    cancelEditSubtopicOption(rowIndex);
    setStatusMessage(`Updated subtopic in ${row.subject}.`);
  };

  const generatePrompt = () => {
    const selectedRows = rows
      .filter((row) => row.checked)
      .map((row) => ({
        ...row,
        subtopics: row.subtopics.filter((subtopic) => row.subtopicOptions.includes(subtopic))
      }));

    if (!selectedRows.length) {
      setPromptOutput("");
      setStatusMessage("Select at least one row before generating a prompt.");
      return;
    }

    const details = selectedRows
      .map((item, index) => {
        const subtopics = item.subtopics.join(", ");
        return `${index + 1}. ${item.subject}\n   Checked subtopics: ${subtopics || "(none checked)"}`;
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
    setShowCheckedOnly(true);
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
            <caption className="sr-only">Prompt rows with include checkbox and subtopics dropdown checklist.</caption>
            <thead>
              <tr className="bg-slate-900/95 text-left text-slate-200">
                <th className="sticky top-0 border-b border-slate-700/60 px-3 py-2">{clientHeader}</th>
                <th className="sticky top-0 border-b border-slate-700/60 px-3 py-2">Row Subject</th>
                <th className="sticky top-0 border-b border-slate-700/60 px-3 py-2">Subtopics</th>
              </tr>
            </thead>
            <tbody>
              {displayedRows.map((row) => {
                const index = rows.findIndex((item) => item.subject === row.subject);

                return (
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
                    <div className="grid gap-2">
                      <div className="flex flex-wrap gap-2">
                        <input
                          type="text"
                          value={row.subtopicInput}
                          onChange={(event) => updateRow(index, { subtopicInput: event.target.value })}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              addSubtopicOption(index);
                            }
                          }}
                          placeholder={`Add one subtopic for ${row.subject}`}
                          aria-label={`Add subtopic option for ${row.subject}`}
                          className="min-w-64 flex-1 rounded-lg border border-slate-600 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-amber-400 focus:shadow-[0_0_0_3px_rgba(251,191,36,0.35)]"
                        />
                        <button
                          type="button"
                          onClick={() => addSubtopicOption(index)}
                          className="rounded-lg border border-violet-400/40 bg-violet-500/20 px-3 py-2 text-sm font-medium transition hover:-translate-y-0.5 hover:brightness-110"
                        >
                          Add subtopic
                        </button>
                      </div>

                      {row.subtopicOptions.length ? (
                        <details
                          ref={(element) => {
                            subtopicDetailsRefs.current[index] = element;
                          }}
                          className="group w-full rounded-lg border border-slate-600 bg-slate-950/70"
                        >
                          <summary className="cursor-pointer list-none rounded-lg px-3 py-2 text-slate-100 outline-none transition hover:bg-slate-900/70 focus:border-amber-400 focus:shadow-[0_0_0_3px_rgba(251,191,36,0.35)] [&::-webkit-details-marker]:hidden">
                            {row.subtopics.length
                              ? `${row.subtopics.length} selected`
                              : `Select subtopics (0/${row.subtopicOptions.length})`}
                          </summary>
                          <div className="max-h-56 overflow-y-auto border-t border-slate-700/60 p-2">
                            {row.subtopicOptions.map((option) => {
                              const optionId = `row-${index}-subtopic-${normalize(option)
                                .toLowerCase()
                                .replace(/\s+/g, "-")}`;
                              const isEditing = editingOptionByRow[index] === option;

                              return (
                                <div key={option} className="rounded-md px-2 py-1.5 text-slate-200 hover:bg-slate-800/70">
                                  {isEditing ? (
                                    <div className="flex flex-wrap items-center gap-2">
                                      <input
                                        type="text"
                                        value={editingTextByRow[index] || ""}
                                        onChange={(event) =>
                                          setEditingTextByRow((current) => ({
                                            ...current,
                                            [index]: event.target.value
                                          }))
                                        }
                                        onKeyDown={(event) => {
                                          if (event.key === "Enter") {
                                            event.preventDefault();
                                            saveEditSubtopicOption(index, option);
                                          }
                                        }}
                                        className="min-w-40 flex-1 rounded-md border border-slate-600 bg-slate-950/70 px-2 py-1 text-sm text-slate-100 outline-none transition focus:border-amber-400"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => saveEditSubtopicOption(index, option)}
                                        className="rounded-md border border-emerald-400/40 bg-emerald-500/20 px-2 py-1 text-xs font-medium"
                                      >
                                        Save
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => cancelEditSubtopicOption(index)}
                                        className="rounded-md border border-slate-500/50 bg-slate-500/15 px-2 py-1 text-xs font-medium"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <label htmlFor={optionId} className="flex flex-1 cursor-pointer items-center gap-2">
                                        <input
                                          id={optionId}
                                          type="checkbox"
                                          checked={row.subtopics.includes(option)}
                                          onChange={(event) => toggleSubtopic(index, option, event.target.checked)}
                                          className="h-4 w-4 accent-blue-400"
                                        />
                                        <span>{option}</span>
                                      </label>
                                      <button
                                        type="button"
                                        onClick={() => startEditSubtopicOption(index, option)}
                                        className="rounded-md border border-slate-500/50 bg-slate-500/15 px-2 py-1 text-xs font-medium"
                                      >
                                        Edit
                                      </button>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </details>
                      ) : (
                        <div className="rounded-lg border border-slate-700/60 bg-slate-950/50 px-3 py-2 text-sm text-slate-400">
                          No subtopic options configured for this row.
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
                );
              })}
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
          onClick={() => setShowCheckedOnly((current) => !current)}
          className="rounded-lg border border-slate-500/50 bg-slate-500/15 px-4 py-2 font-medium transition hover:-translate-y-0.5 hover:brightness-110"
        >
          {showCheckedOnly ? "Show all rows" : "Preview checked only"}
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
