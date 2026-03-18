import { useState, useRef, useEffect } from "react";

const CATEGORIES = {
  "😀 Smileys": ["😀","😃","😄","😁","😆","😅","😂","🤣","😊","😇","🙂","🙃","😉","😌","😍","🥰","😘","😗","😙","😚","😋","😛","😝","😜","🤪","🤨","🧐","🤓","😎","🥸","🤩","🥳"],
  "👍 Gestures": ["👍","👎","👌","🤌","✌️","🤞","🤟","🤘","🤙","👈","👉","👆","👇","☝️","👋","🤚","🖐️","✋","🖖","🤏","💪","🦾","🙏","🤝","👏","🙌"],
  "❤️ Hearts": ["❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❣️","💕","💞","💓","💗","💖","💘","💝","💟","☮️","✝️","☪️"],
  "🎉 Fun": ["🎉","🎊","🎈","🎁","🎀","🎆","🎇","🧨","✨","⭐","🌟","💫","🔥","💥","❄️","🌈","🌊","🎵","🎶","🎤","🎮","🏆","🥇","🎯"],
  "😢 Sad": ["😢","😭","😤","😠","😡","🤬","😈","👿","💀","☠️","😱","😨","😰","😥","😓","🤗","🤔","🤭","🤫","🤥","😶","😑","😬","🙄","😯","😦","😧","😮","😲"],
};

const EmojiPicker = ({ onSelect, onClose }) => {
  const [activeCategory, setActiveCategory] = useState(Object.keys(CATEGORIES)[0]);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      style={{
        position: "absolute",
        bottom: "100%",
        left: 0,
        zIndex: 200,
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: 16,
        padding: 12,
        width: 320,
        boxShadow: "var(--shadow)",
        marginBottom: 8,
      }}
    >
      {/* Category tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 10, overflowX: "auto", paddingBottom: 4 }}>
        {Object.keys(CATEGORIES).map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            style={{
              background: activeCategory === cat ? "var(--accent)" : "transparent",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: "4px 8px",
              cursor: "pointer",
              fontSize: 13,
              color: "var(--text)",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {cat.split(" ")[0]}
          </button>
        ))}
      </div>

      {/* Emoji grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(8, 1fr)",
        gap: 4,
        maxHeight: 200,
        overflowY: "auto",
      }}>
        {CATEGORIES[activeCategory].map((emoji) => (
          <button
            key={emoji}
            onClick={() => onSelect(emoji)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 22,
              padding: 4,
              borderRadius: 6,
              transition: "background 0.1s",
              lineHeight: 1,
            }}
            onMouseEnter={(e) => e.target.style.background = "var(--border)"}
            onMouseLeave={(e) => e.target.style.background = "none"}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};

export default EmojiPicker;
