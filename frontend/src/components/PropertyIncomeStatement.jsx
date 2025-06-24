import React, { useState, useEffect } from "react";
import { useAuth } from "../app/AuthProvider";
import toast from "react-hot-toast";
import "../styles/PropertyIncomeStatement.css";
import {
  getIncomeStatement,
  saveIncomeStatement,
} from "../services/firestoreService";
import jsPDF from "jspdf";

const defaultStructure = {
  Income: {
    BRI: 0,
    RECI: 0,
    "Other Income": 0,
  },
  Vacancy: {
    "Vacancy Loss": 0,
  },
  OperatingExpenses: {
    "Property Tax": { "Base Tax": 0 },
    Insurance: 0,
    "CAM Utilities": 0,
    "CAM Repairs": {
      Labor: 0,
      Material: 0,
      Other: 0,
    },
    Management: 0,
    Other: 0,
  },
  CapitalExpenses: {
    "Financing Expense": 0,
    "Capital Expenses": 0,
    "Capital Reserve": 0,
    Other: 0,
  },
};



export default function PropertyIncomeStatement({ rowData, propertyId }) {
  const { user } = useAuth();
  const [data, setData] = useState(defaultStructure);

  // ⬇ Move these INTO here:
  const flatten = (obj, parentKey = "") =>
    Object.entries(obj).reduce((acc, [key, val]) => {
      const fullKey = parentKey ? `${parentKey}.${key}` : key;
      if (typeof val === "object") {
        Object.assign(acc, flatten(val, fullKey));
      } else {
        acc[fullKey] = val;
      }
      return acc;
    }, {});

  const handleExportCSV = () => {
    const flat = flatten(data);
    const rows = [["Line Item", "Amount"]];
    for (const [k, v] of Object.entries(flat)) {
      rows.push([k, v]);
    }
    const csvContent = rows.map((r) => r.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `IncomeStatement_${propertyId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    const flat = flatten(data);
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("📊 Income Statement", 14, 20);
    doc.setFontSize(10);

    let y = 30;
    for (const [key, val] of Object.entries(flat)) {
      doc.text(`${key}: $${val}`, 14, y);
      y += 7;
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    }

    doc.save(`IncomeStatement_${propertyId}.pdf`);
  };

  useEffect(() => {
    if (!user || !propertyId) return;
    getIncomeStatement(user.uid, propertyId).then((saved) => {
      setData(saved || defaultStructure);
    });
  }, [user, propertyId]);

  const updateData = (section, updated) => {
    setData((prev) => ({ ...prev, [section]: updated }));
  };

  const handleSave = () => {
    saveIncomeStatement(user.uid, propertyId, data)
      .then(() => toast.success("✅ Saved Income Statement"))
      .catch(() => toast.error("❌ Failed to save"));
  };

  const sumSection = (section) => {
    const sumRecursive = (obj) =>
      Object.values(obj).reduce(
        (acc, val) =>
          acc +
          (typeof val === "object" ? sumRecursive(val) : parseFloat(val) || 0),
        0
      );
    return sumRecursive(section);
  };

  const totalIncome = sumSection(data.Income);
  const totalVacancy = sumSection(data.Vacancy);
  const egi = totalIncome - totalVacancy;
  const totalOpEx = sumSection(data.OperatingExpenses);
  const totalCapEx = sumSection(data.CapitalExpenses);
  const noi = egi - totalOpEx;
  const unlevered = noi - totalCapEx;
  const levered =
    unlevered - (data.CapitalExpenses?.["Financing Expense"] || 0);

  return (
    <div className="income-statement-panel">
      <h3>📊 Income Statement</h3>
      {["Income", "Vacancy", "OperatingExpenses", "CapitalExpenses"].map(
        (section) => (
          <RecursiveSection
            key={section}
            title={section.replace(/([A-Z])/g, " $1").trim()}
            data={data[section]}
            onChange={(updated) => updateData(section, updated)}
          />
        )
      )}
      <SubTotal label="EGI (Effective Gross Income)" value={egi} />
      <SubTotal label="Gross Expenses" value={totalOpEx} />
      <SubTotal label="Net Operating Income" value={noi} />
      <SubTotal label="Unlevered Free Cash Flow" value={unlevered} />
      <SubTotal label="Leveraged Free Cash Flow" value={levered} />
      <button className="btn-save" onClick={handleSave}>
        💾 Save
      </button>
      <div style={{ marginTop: "1rem", display: "flex", gap: "10px" }}>
        <button className="btn-save" onClick={handleExportCSV}>
          📊 Export CSV
        </button>
        <button className="btn-save" onClick={handleExportPDF}>
          📄 Export PDF
        </button>
      </div>
    </div>
  );
}

function RecursiveSection({ title, data = {}, onChange }) {
  const [collapsed, setCollapsed] = useState(false);

  const update = (path, newValue) => {
    const keys = path.split(".");
    const updated = structuredClone(data);
    let current = updated;
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]] ||= {};
    }
    current[keys.at(-1)] = newValue;
    onChange(updated);
  };

  const addItem = (path = "") => {
    const label = prompt("Label for new item:");
    if (!label) return;

    const updated = structuredClone(data);
    let current = updated;
    if (path) {
      path.split(".").forEach((key) => {
        current = current[key] ||= {};
      });
    }
    current[label] = 0;
    onChange(updated);
  };

  const promoteToObject = (path) => {
    const keys = path.split(".");
    const updated = structuredClone(data);
    let current = updated;
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    const key = keys.at(-1);
    const val = current[key];
    current[key] = { Default: val };
    onChange(updated);
  };

  const render = (obj, path = "", depth = 0) =>
    Object.entries(obj).map(([key, val]) => {
      const fullPath = path ? `${path}.${key}` : key;
      const indent = { marginLeft: `${depth * 20}px` };
      const isObject = typeof val === "object";

      return (
        <div key={fullPath} className="nested-line-item" style={indent}>
          <div className="line-item">
            <span className="line-label">{key}</span>
            {isObject ? (
              <>
                <button className="sub-btn" onClick={() => addItem(fullPath)}>
                  + Sub
                </button>
                {render(val, fullPath, depth + 1)}
              </>
            ) : (
              <>
                <input
                  type="number"
                  value={val}
                  onChange={(e) =>
                    update(fullPath, parseFloat(e.target.value) || 0)
                  }
                />
                <button
                  className="sub-btn"
                  onClick={() => promoteToObject(fullPath)}
                >
                  + Sub
                </button>
              </>
            )}
          </div>
        </div>
      );
    });

  return (
    <div className="statement-section">
      <h4 onClick={() => setCollapsed(!collapsed)}>
        <span>
          {collapsed ? "▸" : "▾"} {title}
        </span>
        <button
          className="add-btn"
          onClick={(e) => {
            e.stopPropagation();
            addItem();
          }}
        >
          + Item
        </button>
      </h4>
      {!collapsed && render(data)}
    </div>
  );
}

function SubTotal({ label, value }) {
  return (
    <div className="subtotal-row">
      <strong>{label}:</strong>
      <span>${value.toLocaleString()}</span>
    </div>
  );
}
