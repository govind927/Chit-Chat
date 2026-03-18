import { useState, useRef, useEffect } from "react";

const MentionInput = ({ value, onChange, participants, onKeyDown, disabled, placeholder }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [mentionSearch, setMentionSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [cursorPos, setCursorPos] = useState(0);
  const inputRef = useRef(null);

  const handleChange = (e) => {
    const val = e.target.value;
    const cursor = e.target.selectionStart;
    onChange(val);
    setCursorPos(cursor);

    // Detect @mention trigger
    const textBefore = val.slice(0, cursor);
    const mentionMatch = textBefore.match(/@(\w*)$/);
    if (mentionMatch) {
      const search = mentionMatch[1].toLowerCase();
      setMentionSearch(search);
      const filtered = (participants || []).filter((p) =>
        p.username?.toLowerCase().startsWith(search)
      );
      setSuggestions(filtered.slice(0, 5));
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  const selectMention = (username) => {
    const textBefore = value.slice(0, cursorPos);
    const textAfter = value.slice(cursorPos);
    const replaced = textBefore.replace(/@\w*$/, `@${username} `);
    onChange(replaced + textAfter);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  return (
    <div style={{ position: "relative", flex: 1 }}>
      <input
        ref={inputRef}
        className="input"
        placeholder={placeholder || "Type a message... (@mention)"}
        value={value}
        onChange={handleChange}
        onKeyDown={(e) => {
          if (e.key === "Escape") setShowSuggestions(false);
          onKeyDown?.(e);
        }}
        disabled={disabled}
        maxLength={2000}
        style={{ width: "100%" }}
      />

      {showSuggestions && (
        <div style={{
          position: "absolute",
          bottom: "110%",
          left: 0,
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          overflow: "hidden",
          zIndex: 100,
          minWidth: 180,
          boxShadow: "var(--shadow)",
        }}>
          {suggestions.map((p) => (
            <div
              key={p.userId || p.username}
              onClick={() => selectMention(p.username)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 12px",
                cursor: "pointer",
                fontSize: 13,
                transition: "background 0.1s",
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--border)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: "var(--accent-soft)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 600,
              }}>
                {p.username?.slice(0, 2).toUpperCase()}
              </div>
              <span>@{p.username}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MentionInput;
