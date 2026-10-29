export function EditionHeader({
  date,
  title,
  introduction,
}: {
  date: string;
  title: string;
  introduction: string | null;
}) {
  const formatted = new Date(`${date}T00:00:00`).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <section className="mb-10 text-center">
      <p className="text-[11px] uppercase tracking-[0.34em] text-mute">{formatted}</p>
      <h1 className="mt-2 font-serif text-3xl italic sm:text-4xl">{title}</h1>
      {introduction ? (
        <p className="mx-auto mt-4 max-w-2xl font-serif text-lg leading-8 text-ink/75">{introduction}</p>
      ) : null}
    </section>
  );
}
