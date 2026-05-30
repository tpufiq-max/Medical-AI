import { useContext } from "react";
import { AppContext } from "../context";
import { t } from "../translations";

export default function Analytics() {
  const { lang } = useContext(AppContext);
  return (
    <div style={{ padding: "2rem" }}>
      <h1>{t[lang].analytics}</h1>
      <p>Analytics and insights will appear here.</p>
    </div>
  );
}
