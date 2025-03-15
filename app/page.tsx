import ImageGenerator from "@/components/image-generator"

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">AI Image Generator By Kuldeep</h1>
      <ImageGenerator />
    </main>
  )
}

