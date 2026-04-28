import { EventForm } from "../EventForm";

export default function NewEventPage() {
  return (
    <main className="px-4 py-12 md:px-8">
      <h1 className="font-display text-4xl uppercase tracking-tight text-text-1 md:text-6xl">
        New event
      </h1>
      <div className="mt-12">
        <EventForm
          initial={{
            slug: "",
            title: "",
            kind: "performance",
            starts_at: "",
            ends_at: null,
            location: null,
            description: null,
            is_public: true,
            genres: [],
          }}
        />
      </div>
    </main>
  );
}
