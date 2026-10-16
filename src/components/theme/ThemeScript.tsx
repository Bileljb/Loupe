export const THEME_STORAGE_KEY = "loupe:theme";

// Runs before first paint: applies an explicit light/dark choice so the page never flashes the
// wrong theme. With no stored choice nothing happens and CSS follows the system setting.
const script = `(function(){try{var t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});if(t==="light"||t==="dark")document.documentElement.classList.add(t)}catch(e){}})()`;

/** Constant, first-party script: one of the reviewed exceptions in security/xss.test.ts. */
export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
