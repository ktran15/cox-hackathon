// Tiny unique-id helper for garments and passport events (Section 9 wants a
// "crypto-safe unique id, e.g. expo-crypto randomUUID or a tiny uid util").
// SPEC-NOTE: expo-crypto is not in the locked dependency list (Section 3), so
// rather than adding a library we compose an id from three parts. Swap in
// expo-crypto's randomUUID later with zero call-site changes.
//
// Collision safety: a millisecond timestamp ALONE collides for ids made in the
// same tick, and Math.random().toString(36) is a thin/variable-length suffix
// (e.g. Math.random() === 0.5 yields just "i"). So we add a monotonic,
// process-local counter that makes two ids created in the same process — even
// within the same millisecond — provably distinct regardless of randomness.
// The fixed-length random block then guards the only remaining case: ids minted
// in different process launches that happen to share a timestamp.

let counter = 0;

/** A fixed 8-char base36 random block (~2.8e12 space), zero-padded so it never
 * shrinks when Math.random() returns a short value. */
function randomBlock(): string {
  // Multiply into a large integer range, floor, then base36 + left-pad to 8.
  const n = Math.floor(Math.random() * 0x10000000000); // 40 bits
  return n.toString(36).padStart(8, '0').slice(-8);
}

export function uid(): string {
  const time = Date.now().toString(36);
  counter = (counter + 1) % Number.MAX_SAFE_INTEGER;
  const seq = counter.toString(36);
  return `${time}-${seq}-${randomBlock()}`;
}
