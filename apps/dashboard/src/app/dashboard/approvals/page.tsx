export default function ApprovalsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Fila de Aprovação</h1>
      <p className="text-muted-foreground">
        Lançamentos com confidence &lt; 0.80 — spec pendente (Epic 09).
      </p>
    </div>
  )
}
