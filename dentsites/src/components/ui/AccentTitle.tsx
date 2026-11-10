/** Renders *word* segments of a config string in the accent italic. */
export function AccentTitle({ text }: { text: string }) {
  const parts = text.split(/(\*[^*]+\*)/g).filter(Boolean);
  return (
    <>
      {parts.map((part, i) => (part.startsWith("*") && part.endsWith("*") ? <em key={i}>{part.slice(1, -1)}</em> : <span key={i}>{part}</span>))}
    </>
  );
}
