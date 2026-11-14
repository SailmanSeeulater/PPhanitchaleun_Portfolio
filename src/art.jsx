// Icons drawn to sit beside the dock's flat tiles: a blue folder, a sheet of text, a drive, and the section glyphs.
// The desktop uses them straight away and the small apps reuse them, so they live apart from both.
import { useId } from "react";

// Each drawing gets its own gradient ids: a gradient inside a hidden copy (the desktop's files, hidden on a
// phone) would otherwise leave every other copy blank.
function FolderArt() {
  const id = useId();
  return (
    <svg className="fi__art" viewBox="0 0 64 54" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}b`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5fc0ff" />
          <stop offset="1" stopColor="#2f9bf0" />
        </linearGradient>
        <linearGradient id={`${id}f`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6fcbff" />
          <stop offset="1" stopColor="#1f86ea" />
        </linearGradient>
      </defs>
      <path d="M3 9a6 6 0 0 1 6-6h14.500a6 6 0 0 1 4.200 1.700l3.100 3.100a4 4 0 0 0 2.800 1.200H55a6 6 0 0 1 6 6v30a6 6 0 0 1-6 6H9a6 6 0 0 1-6-6z" fill={`url(#${id}b)`} />
      <path d="M3 20a5 5 0 0 1 5-5h48a5 5 0 0 1 5 5v25a6 6 0 0 1-6 6H9a6 6 0 0 1-6-6z" fill={`url(#${id}f)`} />
      <path d="M3.500 20a4.500 4.500 0 0 1 4.500-4.500h48a4.500 4.500 0 0 1 4.500 4.500" fill="none" stroke="#fff" strokeOpacity=".45" />
    </svg>
  );
}
const TextArt = () => (
  <svg className="fi__art" viewBox="0 0 64 54" aria-hidden="true">
    <path d="M17 2h22l10 10v36a4 4 0 0 1-4 4H17a4 4 0 0 1-4-4V6a4 4 0 0 1 4-4z" fill="#fff" stroke="#c9c9c6" />
    <path d="M39 2v7a3 3 0 0 0 3 3h7z" fill="#e9e9e6" stroke="#c9c9c6" strokeLinejoin="round" />
    <path d="M19 20h20M19 26h24M19 32h17M19 38h22" stroke="#b9b9b5" strokeWidth="1.600" strokeLinecap="round" />
  </svg>
);
const DriveArt = () => (
  <svg className="fi__art" viewBox="0 0 64 54" aria-hidden="true">
    <path d="M12 8h40l8 26v10a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V34z" fill="#e4e5e8" stroke="#b4b6bb" />
    <path d="M4 34h56v10a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z" fill="#cfd1d6" stroke="#b4b6bb" />
    <circle cx="51" cy="41" r="2" fill="#39c463" />
    <path d="M11 41h22" stroke="#a3a5ab" strokeWidth="2" strokeLinecap="round" />
  </svg>
);
const APP_ICONS = {
  projects: <path d="M4 5.5h6.5V12H4zM13.5 5.5H20V12h-6.5zM4 15h6.5v4.5H4zM13.5 15H20v4.5h-6.5z" />,
  experience: <path d="M4 8.5h16V19H4zM9 8.5V6h6v2.5M4 13h16" />,
  about: <path d="M12 12.5A3.75 3.75 0 1 0 12 5a3.75 3.75 0 0 0 0 7.5zM5 20c.6-3.4 3.3-5 7-5s6.4 1.6 7 5" />,
  contact: <path d="M4 6.5h16v11H4zM4.5 7l7.5 6 7.5-6" />,
  resume: <path d="M7 3.500h7l4 4V20.500H7zM13.500 3.500V8H18M10 12.500h5M10 16h5" />,
};
const AppIcon = ({ id }) => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {APP_ICONS[id]}
  </svg>
);

export { AppIcon, DriveArt, FolderArt, TextArt };
