import { useState } from "react";

const SCHEMES = [
  { id: "A", label: "Scheme A", ww: 0.25, pt: 0.50, exam: 0.25 },
  { id: "B", label: "Scheme B", ww: 0.25, pt: 0.45, exam: 0.30 },
];

const GRADE_LABELS = [
  { min: 90, label: "Outstanding", color: "#059669" },
  { min: 85, label: "Very Satisfactory", color: "#0284c7" },
  { min: 80, label: "Satisfactory", color: "#7c3aed" },
  { min: 75, label: "Fairly Satisfactory", color: "#d97706" },
  { min: 0, label: "Did Not Meet Expectations", color: "#dc2626" },
];

function getGradeLabel(g) {
  return GRADE_LABELS.find((l) => g >= l.min) || GRADE_LABELS[4];
}

const TRANSMUTATION_TABLE = [
  [100, 100], [98.40, 99], [96.80, 98], [95.20, 97], [93.60, 96],
  [92.00, 95], [90.40, 94], [88.80, 93], [87.20, 92], [85.60, 91],
  [84.00, 90], [82.40, 89], [80.80, 88], [79.20, 87], [77.60, 86],
  [76.00, 85], [74.40, 84], [72.80, 83], [71.20, 82], [69.60, 81],
  [68.00, 80], [66.40, 79], [64.80, 78], [63.20, 77], [61.60, 76],
  [60.00, 75], [56.00, 74], [52.00, 73], [48.00, 72], [44.00, 71],
  [40.00, 70], [36.00, 69], [32.00, 68], [28.00, 67], [24.00, 66],
  [20.00, 65], [16.00, 64], [12.00, 63], [8.00, 62], [4.00, 61], [0, 60],
];

function transmute(raw) {
  if (raw === null) return null;
  for (const [min, transmuted] of TRANSMUTATION_TABLE) {
    if (raw >= min) return transmuted;
  }
  return 60;
}

function computePS(entries) {
  const totalScore = entries.reduce((s, e) => s + (parseFloat(e.score) || 0), 0);
  const totalMax = entries.reduce((s, e) => s + (parseFloat(e.max) || 0), 0);
  if (totalMax === 0) return null;
  return (totalScore / totalMax) * 100;
}

function computeGrade(subject, scheme) {
  const psWW = computePS(subject.ww);
  const psPT = computePS(subject.pt);
  const psExam = computePS(subject.exam);
  const count = [psWW, psPT, psExam].filter(v => v !== null).length;
  if (count === 0) return null;
  let wa = 0;
  let totalWeight = 0;
  if (psWW !== null) { wa += psWW * scheme.ww; totalWeight += scheme.ww; }
  if (psPT !== null) { wa += psPT * scheme.pt; totalWeight += scheme.pt; }
  if (psExam !== null) { wa += psExam * scheme.exam; totalWeight += scheme.exam; }
  return (wa / totalWeight);
}

let nextId = 1;
function uid() { return nextId++; }

function newEntry() { return { id: uid(), score: "", max: "" }; }
function newSubject(name = "") {
  return { id: uid(), name, ww: [newEntry()], pt: [newEntry()], exam: [newEntry()] };
}

const COMPONENT_META = [
  { key: "ww", label: "Written Works", short: "WW", color: "#7c3aed" },
  { key: "pt", label: "Performance Tasks", short: "PT", color: "#0284c7" },
  { key: "exam", label: "Exams", short: "Exam", color: "#059669" },
];

export default function App() {
  const [subjects, setSubjects] = useState([newSubject("Math")]);
  const [expanded, setExpanded] = useState({});

  function addSubject() {
    const s = newSubject("");
    setSubjects(p => [...p, s]);
    setExpanded(p => ({ ...p, [s.id]: true }));
  }

  function removeSubject(id) {
    setSubjects(p => p.filter(s => s.id !== id));
  }

  function updateSubjectName(id, name) {
    setSubjects(p => p.map(s => s.id === id ? { ...s, name } : s));
  }

  function addEntry(subjectId, compKey) {
    setSubjects(p => p.map(s => s.id === subjectId
      ? { ...s, [compKey]: [...s[compKey], newEntry()] }
      : s));
  }

  function removeEntry(subjectId, compKey, entryId) {
    setSubjects(p => p.map(s => {
      if (s.id !== subjectId) return s;
      const updated = s[compKey].filter(e => e.id !== entryId);
      return { ...s, [compKey]: updated.length ? updated : [newEntry()] };
    }));
  }

  function updateEntry(subjectId, compKey, entryId, field, value) {
    setSubjects(p => p.map(s => s.id === subjectId
      ? { ...s, [compKey]: s[compKey].map(e => e.id === entryId ? { ...e, [field]: value } : e) }
      : s));
  }

  function toggleExpanded(id) {
    setExpanded(p => ({ ...p, [id]: !p[id] }));
  }

  return (
    <div style={{ fontFamily: "var(--font-sans)", padding: "1rem 0", maxWidth: 720, margin: "0 auto" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: 22, fontWeight: 500, margin: 0, color: "var(--color-text-primary)" }}>Grade tracker</h2>
        <p style={{ fontSize: 14, color: "var(--color-text-secondary)", margin: "4px 0 0" }}>
          Shows both grading schemes — figure out which one your teacher uses later.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {subjects.map(subject => (
          <SubjectCard
            key={subject.id}
            subject={subject}
            isExpanded={!!expanded[subject.id]}
            onToggle={() => toggleExpanded(subject.id)}
            onNameChange={(v) => updateSubjectName(subject.id, v)}
            onRemove={() => removeSubject(subject.id)}
            onAddEntry={addEntry}
            onRemoveEntry={removeEntry}
            onUpdateEntry={updateEntry}
          />
        ))}
      </div>

      <button
        onClick={addSubject}
        style={{
          marginTop: 12, width: "100%", padding: "10px", fontSize: 14,
          background: "transparent", border: "0.5px dashed var(--color-border-secondary)",
          borderRadius: "var(--border-radius-lg)", color: "var(--color-text-secondary)",
          cursor: "pointer"
        }}
      >
        + Add subject
      </button>
    </div>
  );
}

function SubjectCard({ subject, isExpanded, onToggle, onNameChange, onRemove, onAddEntry, onRemoveEntry, onUpdateEntry }) {
  const gradeA = computeGrade(subject, SCHEMES[0]);
  const gradeB = computeGrade(subject, SCHEMES[1]);
  const hasData = [subject.ww, subject.pt, subject.exam].some(arr => arr.some(e => e.score !== "" || e.max !== ""));

  return (
    <div style={{
      background: "var(--color-background-primary)",
      border: "0.5px solid var(--color-border-tertiary)",
      borderRadius: "var(--border-radius-lg)",
      overflow: "hidden"
    }}>
      <div
        style={{ padding: "12px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}
        onClick={onToggle}
      >
        <span style={{ fontSize: 13, color: "var(--color-text-tertiary)", userSelect: "none" }}>
          {isExpanded ? "▾" : "▸"}
        </span>
        <input
          value={subject.name}
          onClick={e => e.stopPropagation()}
          onChange={e => onNameChange(e.target.value)}
          placeholder="Subject name"
          style={{
            flex: 1, border: "none", background: "transparent",
            fontSize: 15, fontWeight: 500, color: "var(--color-text-primary)",
            outline: "none", padding: 0
          }}
        />
        {hasData && gradeA !== null && (
          <GradePills gradeA={gradeA} gradeB={gradeB} />
        )}
        <button
          onClick={e => { e.stopPropagation(); onRemove(); }}
          style={{
            background: "transparent", border: "none", cursor: "pointer",
            color: "var(--color-text-tertiary)", fontSize: 16, padding: "2px 6px", lineHeight: 1
          }}
          title="Remove subject"
        >×</button>
      </div>

      {isExpanded && (
        <div style={{ borderTop: "0.5px solid var(--color-border-tertiary)", padding: "16px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {COMPONENT_META.map(comp => (
              <ComponentSection
                key={comp.key}
                meta={comp}
                entries={subject[comp.key]}
                onAdd={() => onAddEntry(subject.id, comp.key)}
                onRemove={(eid) => onRemoveEntry(subject.id, comp.key, eid)}
                onUpdate={(eid, field, val) => onUpdateEntry(subject.id, comp.key, eid, field, val)}
              />
            ))}
          </div>

          {hasData && (
            <GradeBreakdown subject={subject} gradeA={gradeA} gradeB={gradeB} />
          )}
        </div>
      )}
    </div>
  );
}

function GradePills({ gradeA, gradeB }) {
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
      {[{ scheme: "A", grade: gradeA }, { scheme: "B", grade: gradeB }].map(({ scheme, grade }) => {
        const tg = transmute(grade);
        const info = getGradeLabel(tg);
        return (
          <span key={scheme} style={{
            fontSize: 12, fontWeight: 500, padding: "2px 8px",
            borderRadius: "var(--border-radius-md)",
            background: info.color + "18",
            color: info.color,
            border: `0.5px solid ${info.color}44`
          }}>
            {scheme}: {tg}
          </span>
        );
      })}
    </div>
  );
}

function ComponentSection({ meta, entries, onAdd, onRemove, onUpdate }) {
  const ps = computePS(entries);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{
          fontSize: 11, fontWeight: 500, padding: "2px 8px",
          borderRadius: "var(--border-radius-md)",
          background: meta.color + "18", color: meta.color
        }}>{meta.short}</span>
        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-primary)" }}>{meta.label}</span>
        {ps !== null && (
          <span style={{ fontSize: 12, color: "var(--color-text-secondary)", marginLeft: "auto" }}>
            PS: {ps.toFixed(1)}%
          </span>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {entries.map((entry, i) => (
          <div key={entry.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, color: "var(--color-text-tertiary)", minWidth: 20 }}>#{i + 1}</span>
            <input
              type="number"
              min="0"
              value={entry.score}
              onChange={e => onUpdate(entry.id, "score", e.target.value)}
              placeholder="Score"
              style={{ width: 80, fontSize: 14, textAlign: "right" }}
            />
            <span style={{ fontSize: 13, color: "var(--color-text-tertiary)" }}>/</span>
            <input
              type="number"
              min="0"
              value={entry.max}
              onChange={e => onUpdate(entry.id, "max", e.target.value)}
              placeholder="Total"
              style={{ width: 80, fontSize: 14, textAlign: "right" }}
            />
            <button
              onClick={() => onRemove(entry.id)}
              style={{
                background: "transparent", border: "none", cursor: "pointer",
                color: "var(--color-text-tertiary)", fontSize: 15, padding: "0 4px"
              }}
            >×</button>
          </div>
        ))}
      </div>

      <button
        onClick={onAdd}
        style={{
          marginTop: 6, fontSize: 12, padding: "4px 10px",
          background: "transparent", border: "0.5px solid var(--color-border-tertiary)",
          borderRadius: "var(--border-radius-md)", color: "var(--color-text-secondary)",
          cursor: "pointer"
        }}
      >+ Add entry</button>
    </div>
  );
}

function GradeBreakdown({ subject, gradeA, gradeB }) {
  const psWW = computePS(subject.ww);
  const psPT = computePS(subject.pt);
  const psExam = computePS(subject.exam);

  return (
    <div style={{ marginTop: 20, borderTop: "0.5px solid var(--color-border-tertiary)", paddingTop: 16 }}>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {[
          { label: "WW", ps: psWW, color: "#7c3aed" },
          { label: "PT", ps: psPT, color: "#0284c7" },
          { label: "Exam", ps: psExam, color: "#059669" },
        ].map(({ label, ps, color }) => ps !== null && (
          <div key={label} style={{
            fontSize: 12, padding: "4px 10px",
            background: color + "12", color, borderRadius: "var(--border-radius-md)"
          }}>
            {label}: {ps.toFixed(1)}%
          </div>
        ))}
      </div>

      <p style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-tertiary)", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        Raw grade
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
        {SCHEMES.map(scheme => {
          const grade = scheme.id === "A" ? gradeA : gradeB;
          if (grade === null) return null;
          return (
            <div key={scheme.id} style={{
              padding: "12px 14px",
              background: "var(--color-background-secondary)",
              borderRadius: "var(--border-radius-lg)",
              border: "0.5px solid var(--color-border-tertiary)"
            }}>
              <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginBottom: 4 }}>
                {scheme.label} · WW {scheme.ww*100}% / PT {scheme.pt*100}% / Exam {scheme.exam*100}%
              </div>
              <div style={{ fontSize: 28, fontWeight: 500, color: "var(--color-text-primary)", lineHeight: 1 }}>
                {grade.toFixed(2)}
              </div>
              <div style={{ fontSize: 11, marginTop: 3, color: "var(--color-text-tertiary)" }}>
                initial grade
              </div>
            </div>
          );
        })}
      </div>

      <p style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-tertiary)", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        Transmuted grade
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {SCHEMES.map(scheme => {
          const grade = scheme.id === "A" ? gradeA : gradeB;
          const tg = transmute(grade);
          if (tg === null) return null;
          const info = getGradeLabel(tg);
          return (
            <div key={scheme.id} style={{
              padding: "12px 14px",
              background: "var(--color-background-secondary)",
              borderRadius: "var(--border-radius-lg)",
              border: `0.5px solid ${info.color}44`
            }}>
              <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginBottom: 4 }}>
                {scheme.label} · WW {scheme.ww*100}% / PT {scheme.pt*100}% / Exam {scheme.exam*100}%
              </div>
              <div style={{ fontSize: 28, fontWeight: 500, color: info.color, lineHeight: 1 }}>
                {tg}
              </div>
              <div style={{ fontSize: 11, marginTop: 3, color: info.color, opacity: 0.85 }}>
                {info.label}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
