const params = new URLSearchParams(window.location.search);

if (params.has("e1")) {
  document.title = "JV E1 Structural Rewire";
  await import("./e1/app.ts");
} else if (params.has("v0")) {
  document.title = "JV Front Steering V0";
  await import("./v0/app.ts");
} else {
  document.title = "JV R1 Direct Steering Pickup";
  await import("./r1/app.ts");
}
