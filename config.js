// ─────────────────────────────────────────────────────────────
//  Configuration: the only file you need to edit.
// ─────────────────────────────────────────────────────────────
window.APP_CONFIG = {
  // Copy the GraphQL URL from your Nhost dashboard (project overview).
  // It looks like: https://<subdomain>.graphql.<region>.nhost.run/v1
  // (some projects show .../v1/graphql – use exactly what the dashboard shows)
  graphqlUrl: "https://fbrxtrpwzrghgntpzoob.graphql.eu-central-1.nhost.run/v1",

  title: "This or that?",

  // Number of histogram bins on the presenter screen.
  bins: 10,

  // Only used if live updates (WebSocket) are unavailable.
  pollIntervalMs: 2000,

  // Your image pairs, shown in this order.
  // Each side takes a label plus either an image (path or URL) or an emoji.
  //   { label: "Mountains", image: "images/mountains.jpg" }
  //   { label: "Sea", emoji: "🌊" }
  pairs: [
     { left: { label: "Dog", image: "images/dog.jpg" },           right: { label: "Cat", image: "images/cat.jpg" } },
    { left: { label: "Coffee", emoji: "☕" },           right: { label: "Tea", emoji: "🍵" } },
    { left: { label: "Early bird", emoji: "🐦" },       right: { label: "Night owl", emoji: "🦉" } },
    { left: { label: "Mountains", emoji: "⛰️" },        right: { label: "Sea", emoji: "🌊" } },
    { left: { label: "Paper notes", emoji: "📓" },      right: { label: "Laptop notes", emoji: "💻" } },
    { left: { label: "City", emoji: "🏙️" },            right: { label: "Countryside", emoji: "🌾" } },
    { left: { label: "Cats", emoji: "🐈" },             right: { label: "Dogs", emoji: "🐕" } }
  ]
};
