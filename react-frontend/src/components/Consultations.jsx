import { useContext } from "react";
import { AppContext } from "../context";
import { t } from "../translations";

export default function Consultations() {
  const { lang } = useContext(AppContext);
  return (
    <div style={{ padding: "2rem" }}>
      <h1>{t[lang].consultations}</h1>
      <p>Your consultation history will appear here.</p>
    </div>
  );
}
