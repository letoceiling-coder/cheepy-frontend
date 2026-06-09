import fs from "fs";
import path from "path";

const replacements = [
  ["gradient-primary text-primary-foreground px-6 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity whitespace-nowrap", "cheepy-btn-primary cheepy-btn-primary-sm whitespace-nowrap"],
  ["gradient-primary text-primary-foreground px-6 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity", "cheepy-btn-primary cheepy-btn-primary-sm"],
  ["gradient-primary text-primary-foreground px-4 py-2 text-xs font-semibold hover:opacity-90 transition-opacity", "cheepy-btn-primary cheepy-btn-primary-sm"],
  ["gradient-primary text-primary-foreground px-4 py-1.5 text-xs font-semibold hover:opacity-90 transition-opacity", "cheepy-btn-primary cheepy-btn-primary-sm"],
  ["h-9 px-5 gradient-primary text-primary-foreground rounded-lg font-semibold text-sm inline-flex items-center gap-2 hover:opacity-90 transition-opacity", "cheepy-btn-primary cheepy-btn-primary-sm inline-flex items-center gap-2"],
  ["h-9 px-5 gradient-primary text-primary-foreground rounded-lg font-semibold text-sm flex items-center gap-2 hover:opacity-90 transition-opacity", "cheepy-btn-primary cheepy-btn-primary-sm flex items-center gap-2"],
  ["mt-1 self-start h-9 px-5 gradient-primary text-primary-foreground rounded-lg font-semibold text-sm flex items-center gap-2 hover:opacity-90 transition-opacity", "mt-1 self-start cheepy-btn-primary cheepy-btn-primary-sm flex items-center gap-2"],
  ["mt-2 self-start h-9 px-5 gradient-primary text-primary-foreground rounded-lg font-semibold text-sm flex items-center gap-2 hover:opacity-90 transition-opacity", "mt-2 self-start cheepy-btn-primary cheepy-btn-primary-sm flex items-center gap-2"],
  ["mt-4 self-start h-9 px-5 gradient-primary text-primary-foreground rounded-lg font-semibold text-sm flex items-center gap-2 hover:opacity-90 transition-opacity", "mt-4 self-start cheepy-btn-primary cheepy-btn-primary-sm flex items-center gap-2"],
  ["mt-2 h-9 px-5 gradient-primary text-primary-foreground rounded-lg font-semibold text-sm flex items-center gap-2 hover:opacity-90 transition-opacity", "mt-2 cheepy-btn-primary cheepy-btn-primary-sm flex items-center gap-2"],
  ["mt-3 h-9 px-5 gradient-primary text-primary-foreground rounded-lg font-semibold text-sm inline-flex items-center gap-2 hover:opacity-90 transition-opacity mx-auto", "mt-3 cheepy-btn-primary cheepy-btn-primary-sm inline-flex items-center gap-2 mx-auto"],
  ["h-12 px-8 rounded-xl gradient-primary text-primary-foreground font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity group", "cheepy-btn-primary cheepy-btn-primary-lg flex items-center gap-2 group"],
  ["mt-8 h-12 px-8 rounded-xl gradient-primary text-primary-foreground font-semibold flex items-center gap-2 hover:opacity-90 transition-all duration-300 group", "mt-8 cheepy-btn-primary cheepy-btn-primary-lg flex items-center gap-2 transition-all duration-300 group"],
  ["flex-1 h-10 rounded-xl gradient-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity text-sm", "flex-1 cheepy-btn-primary cheepy-btn-primary-sm flex items-center justify-center gap-2 text-sm"],
  ["h-9 w-full gradient-primary text-primary-foreground rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity", "w-full cheepy-btn-primary cheepy-btn-primary-sm"],
  ["h-9 px-5 rounded-lg gradient-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity", "cheepy-btn-primary cheepy-btn-primary-sm"],
  ["h-8 px-4 gradient-primary text-primary-foreground rounded-lg font-semibold text-xs flex items-center gap-1.5 hover:opacity-90 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0", "cheepy-btn-primary cheepy-btn-primary-sm flex items-center gap-1.5 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"],
  ["h-9 px-5 gradient-primary text-primary-foreground rounded-lg font-semibold text-sm flex items-center gap-2 hover:opacity-90 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0", "cheepy-btn-primary cheepy-btn-primary-sm flex items-center gap-2 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"],
  ["inline-flex gradient-primary text-primary-foreground px-5 py-2 rounded-full text-sm font-semibold items-center gap-2 hover:opacity-90 transition-opacity", "cheepy-btn-primary cheepy-btn-primary-sm items-center gap-2"],
  ["gradient-primary text-primary-foreground px-5 py-2 rounded-full text-sm font-semibold disabled:opacity-50", "cheepy-btn-primary cheepy-btn-primary-sm disabled:opacity-50"],
  ["gradient-primary text-primary-foreground text-sm font-semibold px-4 py-2 hover:opacity-90 transition-opacity whitespace-nowrap", "cheepy-btn-primary cheepy-btn-primary-sm whitespace-nowrap"],
  ["w-full gradient-primary text-primary-foreground text-xs py-2 font-semibold transition-opacity duration-200 hover:opacity-90", "w-full cheepy-btn-primary cheepy-btn-primary-sm transition-opacity duration-200"],
  ["mt-auto w-full gradient-primary text-primary-foreground text-xs py-2 rounded-full font-medium flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity disabled:opacity-50", "mt-auto w-full cheepy-btn-primary cheepy-btn-primary-sm flex items-center justify-center gap-1.5 disabled:opacity-50"],
  ["mt-2 w-full gradient-primary text-primary-foreground text-[10px] py-1.5 rounded-full font-medium flex items-center justify-center gap-1 transition-all duration-200 hover:opacity-90", "mt-2 w-full cheepy-btn-primary cheepy-btn-primary-sm text-[10px] flex items-center justify-center gap-1 transition-all duration-200"],
  ["mt-3 w-full h-8 gradient-primary text-primary-foreground rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity", "mt-3 w-full cheepy-btn-primary cheepy-btn-primary-sm text-xs flex items-center justify-center gap-1.5"],
  ["h-11 w-full gradient-primary text-primary-foreground rounded-xl font-semibold text-sm hover:opacity-90 transition-all duration-200", "w-full cheepy-btn-primary cheepy-btn-primary-sm transition-all duration-200"],
  ["h-9 px-4 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity shadow-md shadow-primary/20 active:scale-95", "cheepy-btn-primary cheepy-btn-primary-sm shadow-md shadow-primary/20 active:scale-95"],
  ["md:col-span-2 h-12 rounded-lg gradient-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity w-full md:w-auto md:px-8 md:justify-self-start", "md:col-span-2 cheepy-btn-primary cheepy-btn-primary-lg flex items-center justify-center gap-2 w-full md:w-auto md:justify-self-start"],
  ["h-9 w-full rounded-lg gradient-primary text-primary-foreground text-sm font-semibold inline-flex items-center justify-center gap-2 hover:opacity-90 transition-opacity", "w-full cheepy-btn-primary cheepy-btn-primary-sm inline-flex items-center justify-center gap-2"],
  ["mt-1 h-9 px-6 gradient-primary text-primary-foreground rounded-lg font-semibold text-sm flex items-center gap-2 hover:opacity-90 transition-opacity", "mt-1 cheepy-btn-primary cheepy-btn-primary-sm flex items-center gap-2"],
  ["absolute bottom-3 left-3 right-3 h-11 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-300 hover:opacity-90", "absolute bottom-3 left-3 right-3 cheepy-btn-primary cheepy-btn-primary-sm flex items-center justify-center gap-2 transition-all duration-300"],
  ["absolute bottom-3 left-3 right-3 h-10 rounded-lg gradient-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300 pointer-events-none", "absolute bottom-3 left-3 right-3 cheepy-btn-primary cheepy-btn-primary-sm flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300 pointer-events-none"],
  ["pointer-events-none absolute bottom-3 left-3 right-3 h-10 rounded-lg gradient-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300", "pointer-events-none absolute bottom-3 left-3 right-3 cheepy-btn-primary cheepy-btn-primary-sm flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300"],
  ["pointer-events-none absolute bottom-2 left-2 right-14 h-8 rounded-lg gradient-primary text-primary-foreground text-xs font-medium flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300", "pointer-events-none absolute bottom-2 left-2 right-14 cheepy-btn-primary cheepy-btn-primary-sm text-xs flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300"],
  ["mt-4 md:mt-6 h-11 md:h-12 px-6 md:px-8 rounded-xl gradient-primary text-primary-foreground text-sm md:text-base font-semibold inline-flex items-center justify-center gap-2 hover:opacity-90 transition-opacity group w-full sm:w-auto md:w-fit shrink-0", "mt-4 md:mt-6 cheepy-btn-primary cheepy-btn-primary-lg inline-flex items-center justify-center gap-2 group w-full sm:w-auto md:w-fit shrink-0"],
  ["p-1.5 rounded-full gradient-primary text-primary-foreground transition-all duration-200 hover:opacity-90 hover:-translate-y-0.5 active:translate-y-0", "cheepy-btn-primary cheepy-btn-primary-icon transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"],
  ["w-8 h-8 rounded-lg gradient-primary flex items-center justify-center hover:opacity-90 transition-opacity", "cheepy-btn-primary cheepy-btn-primary-icon flex items-center justify-center"],
  ['page === p ? "gradient-primary text-primary-foreground"', 'page === p ? "cheepy-btn-primary cheepy-btn-primary-sm"'],
  ['? "gradient-primary text-primary-foreground"', '? "cheepy-btn-primary cheepy-btn-primary-sm"'],
  ['viewMode === "grid" ? "bg-primary text-primary-foreground"', 'viewMode === "grid" ? "cheepy-btn-primary cheepy-btn-primary-icon"'],
  ['viewMode === "list" ? "bg-primary text-primary-foreground"', 'viewMode === "list" ? "cheepy-btn-primary cheepy-btn-primary-icon"'],
  ['i === size ? "bg-primary text-primary-foreground"', 'i === size ? "gradient-primary text-primary-foreground"'],
  ["w-full gradient-primary text-primary-foreground rounded-full px-4 py-2.5 flex items-center gap-2 text-sm font-semibold mb-3", "w-full cheepy-btn-primary cheepy-btn-primary-sm flex items-center gap-2 mb-3"],
  ["gradient-primary text-primary-foreground px-8 py-3 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity", "cheepy-btn-primary cheepy-btn-primary-lg"],
  ["h-10 px-5 gradient-primary text-primary-foreground rounded-lg font-semibold text-sm flex items-center gap-2 hover:opacity-90 transition-opacity shrink-0", "cheepy-btn-primary cheepy-btn-primary-sm flex items-center gap-2 shrink-0"],
  ["mt-2 self-start h-10 px-6 gradient-primary text-primary-foreground rounded-lg font-semibold text-sm flex items-center gap-2 hover:opacity-90 transition-opacity", "mt-2 self-start cheepy-btn-primary cheepy-btn-primary-sm flex items-center gap-2"],
  ["mt-2 h-10 px-6 gradient-primary text-primary-foreground rounded-lg font-semibold text-sm flex items-center gap-2 hover:opacity-90 transition-opacity", "mt-2 cheepy-btn-primary cheepy-btn-primary-sm flex items-center gap-2"],
  ["mt-2 h-8 px-4 gradient-primary text-primary-foreground rounded-lg font-semibold text-xs inline-flex items-center gap-1.5 hover:opacity-90 transition-opacity", "mt-2 cheepy-btn-primary cheepy-btn-primary-sm inline-flex items-center gap-1.5"],
  ["h-8 px-4 gradient-primary text-primary-foreground rounded-lg font-semibold text-xs flex items-center gap-1.5 hover:opacity-90 transition-opacity", "cheepy-btn-primary cheepy-btn-primary-sm flex items-center gap-1.5"],
  ["ml-auto h-8 px-4 gradient-primary text-primary-foreground rounded-lg font-semibold text-xs flex items-center gap-1 hover:opacity-90 transition-opacity disabled:opacity-50", "ml-auto cheepy-btn-primary cheepy-btn-primary-sm flex items-center gap-1 disabled:opacity-50"],
  ["lg:hidden fixed bottom-20 right-4 z-[1040] gradient-primary text-primary-foreground p-3 rounded-full shadow-lg", "lg:hidden fixed bottom-20 right-4 z-[1040] cheepy-btn-primary cheepy-btn-primary-icon shadow-lg"],
  ["w-full gradient-primary text-primary-foreground rounded-lg", "w-full cheepy-btn-primary cheepy-btn-primary-sm"],
  ["w-full gradient-primary text-primary-foreground rounded-xl text-xs shadow-md shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200", "w-full cheepy-btn-primary cheepy-btn-primary-sm shadow-md shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"],
  ["gradient-primary text-primary-foreground rounded-xl px-6 mt-4 w-full shadow-md shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-60", "mt-4 w-full shadow-md shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-60"],
  ["gradient-primary text-primary-foreground rounded-xl px-8 mt-6 shadow-md shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-60", "mt-6 shadow-md shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-60"],
  ["gradient-primary text-primary-foreground rounded-xl px-6 w-full shadow-md shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200", "w-full shadow-md shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"],
  ["gradient-primary text-primary-foreground rounded-xl px-5 shadow-md shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200", "shadow-md shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"],
  ["gradient-primary text-primary-foreground rounded-xl px-5 text-xs shadow-md shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200", "text-xs shadow-md shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"],
  ["gradient-primary text-primary-foreground rounded-xl text-xs shadow-md shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-200", "text-xs shadow-md shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-200"],
  ["gradient-primary text-primary-foreground rounded-xl px-3", ""],
  ["gradient-primary text-primary-foreground rounded-xl text-xs", "text-xs"],
  ["gradient-primary text-primary-foreground rounded-xl px-6 mt-4 shadow-md shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-60", "mt-4 shadow-md shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-60"],
  ["gradient-primary text-primary-foreground rounded-lg", ""],
  ["gradient-primary text-primary-foreground rounded-lg gap-2", "gap-2"],
  ["w-full gradient-primary text-primary-foreground rounded-lg py-3 h-auto text-sm font-semibold", "w-full py-3 h-auto"],
  ['? "gradient-primary text-primary-foreground text-xs font-semibold px-2.5 py-1 rounded transition-opacity hover:opacity-90"', '? "cheepy-btn-primary cheepy-btn-primary-sm text-xs px-2.5 py-1 transition-opacity"'],
];

function walk(dir, files = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === "crm" || ent.name === "node_modules") continue;
      walk(p, files);
    } else if (ent.name.endsWith(".tsx") || ent.name.endsWith(".ts")) {
      files.push(p);
    }
  }
  return files;
}

const root = path.join(process.cwd(), "src");
let changed = 0;
for (const file of walk(root)) {
  let text = fs.readFileSync(file, "utf8");
  const orig = text;
  for (const [from, to] of replacements) {
    text = text.split(from).join(to);
  }
  text = text.replace(
    /px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 \$\{active === ([^}]+) \? "cheepy-btn-primary cheepy-btn-primary-sm"/g,
    'px-4 py-2 rounded-[10px] text-sm font-medium whitespace-nowrap transition-all duration-200 ${active === $1 ? "cheepy-btn-primary cheepy-btn-primary-sm"',
  );
  if (text !== orig) {
    fs.writeFileSync(file, text);
    changed++;
    console.log(path.relative(process.cwd(), file));
  }
}
console.log("Changed files:", changed);
