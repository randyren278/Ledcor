import { useRouter } from "next/router";
import Link from "next/link";
import { getProject } from "../../lib/data";
import NoteCard from "../../components/NoteCard";

export default function ProjectPage() {
  const { query: { id } } = useRouter();
  
  // Don't render anything if id is not available yet
  if (!id) {
    return (
      <main className="p-6 max-w-4xl mx-auto">
        <p>Loading...</p>
      </main>
    );
  }
  
  const project = getProject(id);
  
  // Handle case where project is not found
  if (!project) {
    return (
      <main className="p-6 max-w-4xl mx-auto">
        <p>Project not found</p>
      </main>
    );
  }

  return (
    <main className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">{project.name}</h1>
      <Link href={`/project/${id}/create`} className="inline-block px-4 py-2 bg-green-600 text-white rounded-lg">
        Create Note
      </Link>
      <div className="space-y-4">
        {[...project.notes].reverse().map((n, i) => <NoteCard key={i} note={n} />)}
      </div>
    </main>
  );
}