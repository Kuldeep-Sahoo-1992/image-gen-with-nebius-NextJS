import ImageGenerator from "@/components/image-generator"

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">AI Image Generator</h1>
      <ImageGenerator />
    </main>
  )
}

