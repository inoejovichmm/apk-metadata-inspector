import { useState } from "react";
import { extractMetadataFromAPK, type MetaDataTag } from "./apkParser.ts";

export function App() {
  const [metadata, setMetadata] = useState<MetaDataTag[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setMetadata([]);

    try {
      if (!file.name.endsWith(".apk")) {
        throw new Error("Please select a valid APK file");
      }

      const tags = await extractMetadataFromAPK(file);
      setMetadata(tags);

      if (tags.length === 0) {
        setError("No <meta-data> tags found in AndroidManifest.xml");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main>
      <h1>APK Metadata Inspector</h1>

      <section>
        <h2>Select an APK File</h2>
        <div className="upload-area">
          <input
            type="file"
            accept=".apk"
            onChange={handleFileSelect}
            disabled={loading}
            id="apk-input"
          />
          <label htmlFor="apk-input" className="upload-label">
            {loading ? "Processing..." : "Choose APK file"}
          </label>
        </div>
      </section>

      {error && (
        <section className="error">
          <h3>Error</h3>
          <p>{error}</p>
        </section>
      )}

      {metadata.length > 0 && (
        <section className="results">
          <h2>Meta-Data Tags ({metadata.length})</h2>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              {metadata.map((tag, index) => (
                <tr key={index}>
                  <td className="name">{tag.name}</td>
                  <td className="value">{tag.value ?? tag.resource ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </main>
  );
}
