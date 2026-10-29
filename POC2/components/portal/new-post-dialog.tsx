"use client"

import { useState, useTransition } from "react"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import { createPost } from "@/lib/actions"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function NewPostDialog({ slug, departments }: { slug: string; departments: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false)
  const [body, setBody] = useState("")
  const [image, setImage] = useState("")
  const [audience, setAudience] = useState("all")
  const [pending, startTransition] = useTransition()

  const submit = () =>
    startTransition(async () => {
      const res = await createPost(slug, body, image || null, audience)
      if (res.ok) {
        toast.success(res.message)
        setOpen(false)
        setBody("")
        setImage("")
      } else toast.error(res.error)
    })

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus /> Nueva publicación
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nueva publicación</DialogTitle>
            <DialogDescription>Se mostrará en el portal de los colaboradores seleccionados.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="post-body">Texto</Label>
              <Textarea id="post-body" rows={5} value={body} onChange={(e) => setBody(e.target.value)} placeholder="¿Qué quieres comunicar?" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="post-image">Imagen (URL opcional)</Label>
              <Input id="post-image" value={image} onChange={(e) => setImage(e.target.value)} placeholder="/posts/welcome.png" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="post-audience">Audiencia</Label>
              <Select value={audience} onValueChange={(v) => setAudience(v as string)} items={{ all: "Toda la empresa", ...Object.fromEntries(departments.map((d) => [d.id, d.name])) }}>
                <SelectTrigger id="post-audience">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toda la empresa</SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={submit} disabled={pending || !body.trim()}>
              {pending ? "Publicando…" : "Publicar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
