const SYNONYMS: Record<string, string[]> = {
  trash: ["delete", "bin", "remove"],
  delete: ["trash", "remove"],
  cart: ["shopping_cart", "bag", "basket"],
  nav: ["navigation", "home", "menu"],
  navbar: ["navigation bar", "nav"],
  btn: ["button"],
  cta: ["button", "action"],
  fab: ["floating action button", "plus"],
  seg: ["segmented", "button group"],
  settings: ["gear", "preferences", "tune"],
  profile: ["person", "account", "user", "avatar"],
  user: ["person", "account", "profile"],
  avatar: ["person", "profile", "account"],
  back: ["arrow_back", "return"],
  close: ["x", "dismiss", "cancel"],
  search: ["find", "magnifier"],
  filter: ["filter_alt", "sort"],
  edit: ["pencil", "write", "compose"],
  heart: ["favorite", "like", "love"],
  like: ["thumb_up", "favorite"],
  bell: ["notifications", "alert"],
  mail: ["email", "message", "inbox"],
  email: ["mail", "message"],
  message: ["chat", "comment", "mail"],
  call: ["phone", "telephone"],
  image: ["photo", "picture", "camera"],
  picture: ["image", "photo"],
  photo: ["image", "camera", "picture"],
  video: ["movie", "videocam", "play"],
  chart: ["graph", "analytics", "bar_chart"],
  graph: ["chart", "analytics", "trending_up"],
  money: ["attach_money", "payment", "price", "currency"],
  payment: ["credit_card", "payments", "money"],
  card: ["credit_card", "payment"],
  bag: ["shopping_bag", "cart"],
  shop: ["store", "storefront", "shopping"],
  folder: ["directory", "files"],
  file: ["document", "description", "note"],
  doc: ["description", "article", "file"],
  download: ["arrow_downward", "save"],
  upload: ["arrow_upward", "publish"],
  cloud: ["weather", "online", "storage"],
  lock: ["secure", "security", "password"],
  shield: ["security", "safe", "verified"],
  check: ["done", "tick", "check_circle"],
  arrow: ["direction", "pointer", "arrow_forward"],
  plus: ["add", "new", "create"],
  minus: ["remove"],
  grid: ["grid_view", "apps", "layout"],
  list: ["view_list", "rows"],
  calendar: ["date", "event", "schedule"],
  clock: ["time", "schedule", "timer"],
  people: ["group", "teams", "users"],
  team: ["groups", "people"],
  link: ["url", "chain", "attachment"],
  share: ["send", "ios_share"],
  save: ["disk", "download"],
  copy: ["duplicate", "content_copy"],
  code: ["terminal", "developer"],
  help: ["question", "support", "info"],
  info: ["about", "help"],
  warning: ["alert", "error", "caution"],
  error: ["warning", "alert", "danger"],
  home: ["house", "start", "main"],
  menu: ["hamburger", "nav"],
};

export function tokens(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[_\-–—]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

export function fuzzyScore(query: string, target: string): number {
  const q = query.trim().toLowerCase();
  if (!q) return 1;
  const t = target.toLowerCase();
  if (t === q) return 1000;
  if (t.startsWith(q)) return 900 - t.length;
  if (t.includes(q)) return 800 - t.indexOf(q);
  // token starts
  const words = t.split(/[\s_\-]+/);
  if (words.some((w) => w.startsWith(q))) return 700;
  if (words.some((w) => w.includes(q))) return 600;
  // subsequence
  let i = 0;
  for (const ch of t) {
    if (ch === q[i]) i++;
    if (i === q.length) return 400 - t.length;
  }
  return -1;
}

export function searchIcons<T extends { n: string; cat: string }>(icons: T[], query: string): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return icons;
  const scored = icons
    .map((icon) => {
      const name = icon.n.replace(/_/g, " ");
      let score = fuzzyScore(q, name) * 1.2;
      const syn = SYNONYMS[q] ?? [];
      if (syn.some((s) => icon.n === s || icon.n.includes(s))) score = Math.max(score, 650);
      if (icon.cat.toLowerCase().includes(q)) score = Math.max(score, 500);
      if (q.length > 2 && icon.n.includes(q)) score = Math.max(score, 800);
      return { icon, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.map((x) => x.icon);
}

export function searchComponents<T extends { name: string; type: string; group: string; aliases: string[] }>(
  components: T[],
  query: string,
): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return components;
  return components
    .map((c) => {
      const name = c.name.toLowerCase();
      let score = fuzzyScore(q, name);
      if (c.aliases.some((a) => a.toLowerCase() === q)) score = Math.max(score, 950);
      if (c.aliases.some((a) => a.toLowerCase().includes(q))) score = Math.max(score, 780);
      if (c.type.includes(q)) score = Math.max(score, 860);
      if (c.group.toLowerCase().includes(q)) score = Math.max(score, 480);
      return { c, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.c);
}
