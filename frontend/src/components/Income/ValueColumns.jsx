import React from "react";
import { useIncomeView } from "../../app/IncomeViewContext.jsx";

export default function ValueColumns() {
  const { displayMode } = useIncomeView();
  const headers = [ "Rate", "Gross", "PSF", "PUnit"];
  

  if (displayMode === "both") {
    return (
      <>
        {headers.map((h) => <div key={`m-${h}`} className="col-header">{h} (Monthly)</div>)}
        {headers.map((h) => <div key={`a-${h}`} className="col-header">{h} (Annual)</div>)}
      </>
    );
  }

  const suffix = displayMode === "monthly" ? "(Monthly)" : "(Annual)";
  return <>{headers.map((h) => <div key={h} className="col-header">{h} {suffix}</div>)}</>;
}
