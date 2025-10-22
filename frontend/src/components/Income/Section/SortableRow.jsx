import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export default function SortableRow({ id, disabled, mainRow, childrenBelow }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id, disabled });

  return (
    <div
      ref={setNodeRef}
      className={`sec__row ${isDragging ? "is-dragging" : ""} ${
        childrenBelow ? "has-children" : ""
      }`}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      data-key={id}
    >
      <div className="sec__rowGrid">
        <span className="sec__firstCell">
          <button
            type="button"
            className={`sec__drag ${disabled ? "is-disabled" : ""}`}
            {...(!disabled ? { ...attributes, ...listeners } : {})}
            aria-label="Drag row"
            title={disabled ? "" : "Drag to reorder"}
          >
            ⋮⋮
          </button>
          {mainRow.leading}
        </span>

        <span className="sec__label" data-depth={0} style={{ "--depth": 0 }}>
          <span className="sec__indent" />
          <span className="sec__labelText">{mainRow.label}</span>
        </span>

        <div className="sec__values">{mainRow.values}</div>
        <div className="sec__actions">{mainRow.actions}</div>
      </div>

      {childrenBelow}
    </div>
  );
}
