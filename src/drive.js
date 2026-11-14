import { PROJECTS } from "./data";

/* ---- The drive: one tree, built from the site's own content. Finder browses it and the terminal walks it. ---- */
function makeDrive({ sections, links, photos }) {
  const folder = (name, children) => ({ name, kind: "folder", children });
  return folder("Perfect Phanitchaleun", [
    folder("Applications", [
      ...sections.map((a) => ({ name: `${a.name}.app`, kind: "app", app: a.id })),
      ...links.map((l) => ({ name: `${l.name}.webloc`, kind: "link", href: l.href, icon: l.icon })),
    ]),
    folder("Desktop", [folder("boat", photos.map((p) => ({ name: p.name, kind: "image", src: p.src }))), { name: "sailor.txt", kind: "text", app: "sailor" }]),
    folder("Projects", PROJECTS.map((p, index) => ({ name: `${p.name}.md`, kind: "project", index }))),
    { name: "Résumé.pdf", kind: "pdf", app: "resume" },
  ]);
}
const nodeAt = (drive, path) => path.reduce((node, name) => node?.children?.find((c) => c.name === name), drive);

export { makeDrive, nodeAt };
