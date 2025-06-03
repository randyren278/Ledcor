import { getProject } from "../lib/data";
import ProjectCard from "../components/projectcard";
export default function Home() {
  const projects = ["demo", "site-a", "site-b"].map(getProject);
  return (
    <main className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">AI Note Projects</h1>
      <div className="grid gap-4 md:grid-cols-3">
        {projects.map((p) => <ProjectCard key={p.id} project={p} />)}
      </div>
    </main>
  );
}