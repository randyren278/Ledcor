export default function NoteCard({ note }) {
    const preview = note.text.length > 160 ? note.text.slice(0, 160) + "…" : note.text;
    return (
      <div className="p-4 border rounded-lg space-y-2">
        <p className="text-sm text-gray-400">{new Date(note.date).toLocaleString()}</p>
        <p className="whitespace-pre-wrap">{preview}</p>
        {note.photos?.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {note.photos.map((p) => (
              <img key={p} src={`/uploads/${p}`} alt={p} className="w-full h-32 object-cover rounded-lg" />
            ))}
          </div>
        )}
      </div>
    );
  }