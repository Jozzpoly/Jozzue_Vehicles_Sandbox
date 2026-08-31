const params = new URLSearchParams(window.location.search);

if (params.has("e1")) {
  document.title = "JV E1 Structural Rewire";
  await import("./e1/app.ts");
} else {
  await import("./v0/app.ts");
}
