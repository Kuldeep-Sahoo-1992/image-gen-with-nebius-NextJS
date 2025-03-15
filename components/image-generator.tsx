"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Download, Trash2, RefreshCw } from "lucide-react"
import { generateImage } from "@/actions/generate-image"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"

type GeneratedImage = {
  url: string
  alt: string
  prompt: string
  timestamp: number
}

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [images, setImages] = useState<GeneratedImage[]>([])
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim()) return

    setIsGenerating(true)
    setError(null)

    try {
      const generatedImages = await generateImage(prompt)
      const newImages = generatedImages.map((img) => ({
        ...img,
        prompt,
        timestamp: Date.now(),
      }))

      setImages((prev) => [...newImages, ...prev])

      toast({
        title: "Images generated!",
        description: `Successfully created ${generatedImages.length} images.`,
      })
    } catch (err) {
      const errorMessage = typeof err === "string" ? err : "Failed to generate image. Please try again."
      setError(errorMessage)

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = async (url: string, index: number) => {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)

      const link = document.createElement("a")
      link.href = blobUrl
      link.download = `gemini-image-${index}-${Date.now()}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(blobUrl)

      toast({
        title: "Download started",
        description: "Your image is being downloaded.",
      })
    } catch (err) {
      console.error("Failed to download image:", err)
      toast({
        title: "Download failed",
        description: "Failed to download the image. Please try again.",
        variant: "destructive",
      })
    }
  }

  const clearImages = () => {
    setImages([])
    toast({
      title: "Images cleared",
      description: "All generated images have been removed.",
    })
  }

  const regenerateLastPrompt = async () => {
    if (images.length === 0) return

    const lastPrompt = images[0].prompt
    setPrompt(lastPrompt)

    setIsGenerating(true)
    setError(null)

    try {
      const generatedImages = await generateImage(lastPrompt)
      const newImages = generatedImages.map((img) => ({
        ...img,
        prompt: lastPrompt,
        timestamp: Date.now(),
      }))

      setImages((prev) => [...newImages, ...prev])

      toast({
        title: "Images regenerated!",
        description: `Successfully recreated images for "${lastPrompt}".`,
      })
    } catch (err) {
      const errorMessage = typeof err === "string" ? err : "Failed to regenerate images. Please try again."
      setError(errorMessage)

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <Tabs defaultValue="generate" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="generate">Generate</TabsTrigger>
            <TabsTrigger value="gallery">Gallery ({images.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="prompt" className="text-sm font-medium">
                  Enter your prompt
                </label>
                <div className="flex gap-2">
                  <Input
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="A futuristic city with flying cars and neon lights"
                    className="flex-1"
                    disabled={isGenerating}
                  />
                  <Button type="submit" disabled={isGenerating || !prompt.trim()}>
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      "Generate"
                    )}
                  </Button>
                </div>
              </div>
            </form>

            {error && <div className="p-4 bg-destructive/10 text-destructive rounded-md">{error}</div>}

            {isGenerating && (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-center text-muted-foreground">Generating images based on your prompt...</p>
              </div>
            )}

            {!isGenerating && images.length > 0 && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Recent Images</h3>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={regenerateLastPrompt} disabled={images.length === 0}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Regenerate
                    </Button>
                    <Button variant="outline" size="sm" onClick={clearImages} disabled={images.length === 0}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear All
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {images.slice(0, 6).map((image, index) => (
                    <div key={index} className="relative group overflow-hidden rounded-lg border border-border">
                      <div className="aspect-square relative">
                        <Image
                          src={image.url || "/placeholder.svg"}
                          alt={image.alt}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      </div>
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleDownload(image.url, index)}
                          className="flex items-center gap-1"
                        >
                          <Download className="h-4 w-4" />
                          Download
                        </Button>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2 text-white text-xs truncate">
                        {image.prompt}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="gallery">
            {images.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No images generated yet. Enter a prompt and click Generate to create images.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">All Generated Images</h3>
                  <Button variant="outline" size="sm" onClick={clearImages}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear All
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {images.map((image, index) => (
                    <div key={index} className="relative group overflow-hidden rounded-lg border border-border">
                      <div className="aspect-square relative">
                        <Image
                          src={image.url || "/placeholder.svg"}
                          alt={image.alt}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw, 25vw"
                        />
                      </div>
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleDownload(image.url, index)}
                          className="flex items-center gap-1"
                        >
                          <Download className="h-4 w-4" />
                          Download
                        </Button>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2 text-white text-xs">
                        <div className="truncate">{image.prompt}</div>
                        <div className="text-xs opacity-70">{new Date(image.timestamp).toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

