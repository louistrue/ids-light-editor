"use client"

export function HumanReadable({ data }: { data: any }) {
  if (!data?.ids) return <div className="text-sm text-muted-foreground">No data available</div>
  const { ids } = data

  return (
    <div className="space-y-4 text-sm">
      <div>
        <div className="font-medium mb-2">Information</div>
        <div className="space-y-1 text-sm">
          {ids.title && (
            <div>
              <span className="font-medium">Title:</span> {ids.title}
            </div>
          )}
          {ids.description && (
            <div>
              <span className="font-medium">Description:</span> {ids.description}
            </div>
          )}
          {ids.author && (
            <div>
              <span className="font-medium">Author:</span> {ids.author}
            </div>
          )}
          {ids.date && (
            <div>
              <span className="font-medium">Date:</span> {ids.date}
            </div>
          )}
          <div>
            <span className="font-medium">IFC Version:</span> {ids.ifcVersion}
          </div>
        </div>
      </div>

      <div>
        <div className="font-medium mb-2">Rules ({(ids.rules || []).length})</div>
        {(ids.rules || []).map((r: any, i: number) => (
          <div key={i} className="mb-4 rounded-md border p-3 bg-muted/20">
            <div className="font-semibold mb-2">
              {r.name || r.entity} - <code className="text-xs bg-muted px-1 py-0.5 rounded">{r.entity}</code>
            </div>
            {r.predefinedType && (
              <div className="mb-2 text-xs">
                <span className="font-medium">Predefined Type:</span> {r.predefinedType}
              </div>
            )}
            {r.classification && (
              <div className="mb-2 text-xs">
                <span className="font-medium">Classification:</span> {r.classification.system}
                {r.classification.value ? ` (${r.classification.value})` : ""}
              </div>
            )}
            {section("Attributes", r.attributes)}
            {section("Properties", r.properties)}
            {section("Quantities", r.quantities)}
          </div>
        ))}
      </div>
    </div>
  )
}

function section(title: string, arr?: any[]) {
  if (!arr?.length) return null
  return (
    <div className="mt-3">
      <div className="font-medium text-xs mb-2">{title}</div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b">
              <th className="text-left py-1 pr-3 font-medium">Name</th>
              <th className="text-left py-1 pr-3 font-medium">Presence</th>
              <th className="text-left py-1 pr-3 font-medium">Datatype</th>
              <th className="text-left py-1 pr-3 font-medium">Allowed Values</th>
              <th className="text-left py-1 pr-3 font-medium">Pattern</th>
            </tr>
          </thead>
          <tbody>
            {arr.map((x, idx) => (
              <tr key={idx} className="border-b border-muted/50">
                <td className="py-1 pr-3">
                  <code className="bg-muted/50 px-1 rounded text-xs">{x.name}</code>
                </td>
                <td className="py-1 pr-3">{x.presence ?? "required"}</td>
                <td className="py-1 pr-3">{x.datatype ?? "—"}</td>
                <td className="py-1 pr-3">{x.allowed_values?.join(", ") ?? "—"}</td>
                <td className="py-1 pr-3">{x.pattern ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
