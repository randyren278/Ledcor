export default function ProjectCard({ project }) {
    return (
      <a href={`/project/${project.id}`} className="block p-4 border rounded-lg hover:shadow-md transition">
        <h2 className="text-xl font-semibold mb-1">{project.name}</h2>
        <p className="text-sm text-gray-500">{project.notes.length} note{project.notes.length !== 1 && "s"}</p>
      </a>
    );
  }