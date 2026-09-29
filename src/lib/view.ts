/** Bascule entre l'histoire en 3D et la version simple (mémorisée pour les visites suivantes). */
export function switchView(view: "simple" | "full") {
  try {
    if (view === "simple") localStorage.setItem("view", "simple");
    else localStorage.removeItem("view");
  } catch {}
  const url = new URL(window.location.href);
  url.searchParams.delete("simple");
  if (view === "simple") url.searchParams.set("simple", "");
  window.location.href = url.toString().replace("simple=", "simple");
}
