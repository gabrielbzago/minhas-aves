"use client";

import { useRouter } from "next/navigation";

export default function BirdRow({ bird }: { bird: any }) {
  const router = useRouter();

  const open = () => router.push(`/dashboard/plantel/${bird.id}`);

  return (
    <tr
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open();
        }
      }}
      tabIndex={0}
      role="link"
      aria-label={`Abrir dados da ave ${bird.name}`}
      style={{ cursor: "pointer" }}
    >
      <td>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            open();
          }}
          style={{
            border: 0,
            background: "transparent",
            padding: 0,
            font: "inherit",
            fontWeight: 700,
            color: "var(--primary-dark)",
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          {bird.name}
        </button>
      </td>
      <td>
        {bird.species?.common_name || "—"}
        <br />
        <small style={{ color: "var(--muted)" }}>{bird.species?.scientific_name || ""}</small>
      </td>
      <td>{bird.sex || "—"}</td>
      <td><span className="badge">{bird.status || "—"}</span></td>
      <td>{bird.ring_number || "—"}</td>
      <td>{bird.father_id || bird.mother_id ? <span className="badge">Conectada</span> : "—"}</td>
      <td>
        <div className="actions" style={{ margin: 0, justifyContent: "flex-start", gap: 8 }}>
          <button
            type="button"
            className="btn btn-soft"
            onClick={(e) => {
              e.stopPropagation();
              open();
            }}
          >
            Ver dados
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/dashboard/plantel/${bird.id}?edit=1`);
            }}
          >
            Editar
          </button>
        </div>
      </td>
    </tr>
  );
}
