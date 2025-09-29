import { Nav } from "../components/Nav";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Nav />
      <main className="mx-auto max-w-6xl p-4">
        <h1 className="text-2xl font-semibold mb-4">Welcome to SmartSchedule</h1>
        <p className="text-sm text-gray-600">Use the nav to import data, edit rules, and generate schedules.</p>
      </main>
    </div>
  );
}
