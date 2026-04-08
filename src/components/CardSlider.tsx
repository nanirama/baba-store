import { revalidatePath } from "next/cache"

let currentIndex = 0

const cards = [
  { title: "Card One", description: "First card content." },
  { title: "Card Two", description: "Second card content." },
  { title: "Card Three", description: "Third card content." },
  { title: "Card Four", description: "Fourth card content." },
]

async function nextSlide() {
  "use server"
  currentIndex = Math.min(currentIndex + 1, cards.length - 1)
  revalidatePath("/")
}

async function prevSlide() {
  "use server"
  currentIndex = Math.max(currentIndex - 1, 0)
  revalidatePath("/")
}

export default function CardSlider() {
  const card = cards[currentIndex]

  return (
    <section className="mx-auto max-w-4xl px-4 py-16">
      <div className="rounded-xl border p-8 shadow-sm">
        <h3 className="text-xl font-semibold">{card.title}</h3>
        <p className="mt-2 text-gray-600">{card.description}</p>
      </div>

      <div className="mt-6 flex justify-between">
        <form action={prevSlide}>
          <button
            type="submit"
            className="rounded-lg border px-4 py-2 hover:bg-gray-100"
          >
            Prev
          </button>
        </form>

        <form action={nextSlide}>
          <button
            type="submit"
            className="rounded-lg border px-4 py-2 hover:bg-gray-100"
          >
            Next
          </button>
        </form>
      </div>
    </section>
  )
}