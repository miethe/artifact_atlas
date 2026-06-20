const stats = [
  { label: "Assets", value: "1" },
  { label: "Templates", value: "2" },
  { label: "Context Packs", value: "1" },
  { label: "BOM Coverage", value: "0%" },
];

const lanes = [
  "Inbox",
  "Candidate",
  "Selected",
  "Canonical",
];

export default function Page() {
  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand">Artifact Atlas</div>
        <nav>
          {["Projects", "Assets", "Artifact BOM", "Templates", "Context Packs", "Coverage"].map((item) => (
            <a key={item} href="#">
              {item}
            </a>
          ))}
        </nav>
      </aside>
      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">T4 project scaffold</p>
            <h1>Project Command Center</h1>
          </div>
          <button type="button">Add Asset</button>
        </header>

        <section className="stats" aria-label="Project statistics">
          {stats.map((stat) => (
            <div className="stat" key={stat.label}>
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
            </div>
          ))}
        </section>

        <section className="grid">
          <div className="panel">
            <h2>Asset Flow</h2>
            <div className="board">
              {lanes.map((lane) => (
                <div className="lane" key={lane}>
                  <h3>{lane}</h3>
                  <div className="dropzone">Ready for assets</div>
                </div>
              ))}
            </div>
          </div>
          <div className="panel">
            <h2>Agent Handoff</h2>
            <p>
              Context packs should include selected assets, BOM slots, MeatyWiki pages,
              IntentTree nodes, policy metadata, and explicit instructions.
            </p>
          </div>
        </section>
      </section>
    </main>
  );
}
