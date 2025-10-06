// SortableRow.jsx (or inline in Section.jsx)
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function SortableRow({ id, disabled,  children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id, disabled });

  return (
    <div
      ref={setNodeRef}
      className={`section-row line-item ${isDragging ? "is-dragging" : ""}`}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 3 : undefined,
      }}
      data-key={id}
    >
      {/* no handle here */}
      {/*
        IMPORTANT: we’ll pass {attributes,listeners} down to the handle
        that lives inside the caret cell in each row renderer.
      */}
      {children({ attributes, listeners, disabled })}
    </div>
  );
}

export default SortableRow;
