export async function fetchFirebaseConfig() {
  const res = await fetch('/.netlify/functions/firebase-config');
  if (!res.ok) throw new Error('Failed to load Firebase config');
  return await res.json();
}