"use client";

import { useEffect, useState } from "react";

const KEY = "logic-league-admin-operations-notes";

export function OperationsNotes() {
  const [value, setValue] = useState("");
  useEffect(() => setValue(window.localStorage.getItem(KEY) ?? ""), []);
  return <textarea value={value} onChange={(event) => { setValue(event.target.value); window.localStorage.setItem(KEY, event.target.value); }} rows={14} className="premium-input" placeholder="Weekly improvement notes / Bug notes / Future discussion ideas / Launch checklist" />;
}
