import { useMemo, useState } from "react";

type FilterMode = "all" | "text" | "file";

type TimelineItem = {
  id: string;
  kind: "text" | "file";
  title: string;
  detail: string;
  deviceName: string;
  createdAt: string;
};

const mockItems: TimelineItem[] = [
  {
    id: "1",
    kind: "text",
    title: "Temporary note",
    detail: "The desktop client will poll every 5 seconds and keep download records locally.",
    deviceName: "windows-开心的菠萝",
    createdAt: "2026-04-30 10:20",
  },
  {
    id: "2",
    kind: "file",
    title: "meeting-notes.txt",
    detail: "18 KB",
    deviceName: "macos-沉稳的橙子",
    createdAt: "2026-04-30 09:55",
  },
];

export function App() {
  const [route, setRoute] = useState<"login" | "home" | "settings">("login");
  const [filter, setFilter] = useState<FilterMode>("all");

  const filteredItems = useMemo(() => {
    return filter === "all" ? mockItems : mockItems.filter((item) => item.kind === filter);
  }, [filter]);

  if (route === "login") {
    return (
      <main className="desktop-shell">
        <section className="desktop-panel">
          <div className="desktop-header">
            <div>
              <div className="meta">VercelSend Desktop</div>
              <h1>Sign in</h1>
            </div>
          </div>
          <div className="desktop-grid">
            <aside className="sidebar">
              <p>Desktop-first workflow, local download history, and device naming start here.</p>
            </aside>
            <section className="content-card">
              <div className="toolbar">
                <button className="button" onClick={() => setRoute("home")}>
                  Login
                </button>
                <button className="button secondary">Register</button>
              </div>
              <div style={{ display: "grid", gap: 12, marginTop: 18 }}>
                <input className="input" placeholder="Email" />
                <input className="input" placeholder="Password" type="password" />
              </div>
            </section>
          </div>
        </section>
      </main>
    );
  }

  if (route === "settings") {
    return (
      <main className="desktop-shell">
        <section className="desktop-panel">
          <div className="desktop-header">
            <div>
              <div className="meta">Settings</div>
              <h1>Device and quota</h1>
            </div>
            <div className="toolbar">
              <button className="button secondary" onClick={() => setRoute("home")}>
                Back
              </button>
            </div>
          </div>
          <div className="desktop-grid">
            <aside className="sidebar">
              <p className="meta">Editable device name and effective quota values belong here.</p>
            </aside>
            <section className="content-card">
              <div style={{ display: "grid", gap: 12 }}>
                <input className="input" defaultValue="windows-开心的菠萝" />
                <div className="meta">Text quota: 100 MB</div>
                <div className="meta">File quota: 100 MB</div>
                <div className="meta">Single file: 10 MB</div>
              </div>
            </section>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="desktop-shell">
      <section className="desktop-panel">
        <div className="desktop-header">
          <div>
            <div className="meta">Home</div>
            <h1>Timeline</h1>
          </div>
          <div className="toolbar">
            <button className="button secondary" onClick={() => setRoute("settings")}>
              Settings
            </button>
            <button className="button">Refresh</button>
          </div>
        </div>
        <div className="desktop-grid">
          <aside className="sidebar">
            <div style={{ display: "grid", gap: 12 }}>
              <textarea
                className="textarea"
                placeholder="Paste text here. Anything over 1MB should be saved as .txt and uploaded instead."
              />
              <div className="toolbar">
                <button className="button">Send Text</button>
                <button className="button secondary">Upload File</button>
              </div>
              <div className="filter-row">
                <button className="button secondary" onClick={() => setFilter("all")}>
                  All
                </button>
                <button className="button secondary" onClick={() => setFilter("text")}>
                  Text
                </button>
                <button className="button secondary" onClick={() => setFilter("file")}>
                  File
                </button>
              </div>
            </div>
          </aside>
          <section className="content-card">
            {filteredItems.map((item) => (
              <article className="timeline-item" key={item.id}>
                <div className="meta">
                  {item.kind.toUpperCase()} / {item.deviceName} / {item.createdAt}
                </div>
                <h3>{item.title}</h3>
                <p>{item.detail}</p>
              </article>
            ))}
          </section>
        </div>
      </section>
    </main>
  );
}
