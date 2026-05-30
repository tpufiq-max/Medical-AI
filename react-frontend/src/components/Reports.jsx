import { useContext } from "react";
import { AppContext } from "../context";
import { t } from "../translations";

export default function Reports() {
  const { lang } = useContext(AppContext);
  return (
    <div style={{ padding: "2rem" }}>
      <h1>{t[lang].reports}</h1>
      <p>Your medical reports will appear here.</p>
    </div>
  );
}
