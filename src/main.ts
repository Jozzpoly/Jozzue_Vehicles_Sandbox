const params = new URLSearchParams(window.location.search);

if (params.has("e1")) {
  document.title = "JV E1 Structural Rewire";
  await import("./e1/app.ts");
} else if (params.has("v0")) {
  document.title = "JV Front Steering V0";
  await import("./v0/app.ts");
} else if (params.has("c1")) {
  document.title = "JV Rep2 C1 Causal Damper Correspondence";
  await import("./rep2/c1-app.ts");
} else if (params.has("rep3")) {
  document.title = "JV Rep3 Geometry-Derived Hinge";
  await import("./rep3/stage-b-app.ts");
} else if (params.has("grammarC")) {
  document.title = "JV Construction Grammar Family C";
  await import("./grammar/component-in-hand-app-v3.js");
} else if (params.has("grammar")) {
  document.title = "JV Construction Grammar Spikes V0";
  await import("./grammar/spikes-app-v1.ts");
} else if (params.has("rep4b3")) {
  document.title = "JV Rep4 B3 Build Play Build";
  await import("./rep4/stage-b3-app.ts");
} else if (params.has("rep4b2")) {
  document.title = "JV Rep4 B2 Direct Construction";
  await import("./rep4/stage-b2-app.ts");
} else if (params.has("rep4b1")) {
  document.title = "JV Rep4 B1 Visual Correspondence Probe";
  await import("./rep4/stage-b-correspondence-app.ts");
} else {
  document.title = "JV R1 Direct Steering Pickup";
  await import("./r1/app.ts");
}
