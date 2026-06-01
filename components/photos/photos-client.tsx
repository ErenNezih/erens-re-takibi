"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { createPhoto, deletePhoto, createNote, deleteNote } from "@/lib/actions/photos";
import { PHOTO_TYPES, formatDateShort, toDateInputValue, today } from "@/lib/utils";
import type { ProgressPhoto, Note } from "@prisma/client";

interface PhotosClientProps {
  photos: ProgressPhoto[];
  notes: Note[];
}

export function PhotosClient({ photos, notes }: PhotosClientProps) {
  const [photoOpen, setPhotoOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function handlePhotoSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await createPhoto(formData);
      toast({ title: "Fotoğraf kaydedildi" });
      setPhotoOpen(false);
      setPreviewUrl(null);
      router.refresh();
    });
  }

  async function handleNoteSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await createNote(formData);
      toast({ title: "Not eklendi" });
      setNoteOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <PageHeader title="Fotoğraf ve Notlar" description="İlerleme fotoğrafları ve kişisel notlar">
        <Dialog open={photoOpen} onOpenChange={setPhotoOpen}>
          <DialogTrigger>
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-1" />
              Fotoğraf
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Fotoğraf Ekle</DialogTitle>
            </DialogHeader>
            <form onSubmit={handlePhotoSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Tarih</Label>
                  <Input name="date" type="date" defaultValue={toDateInputValue(today())} required />
                </div>
                <div className="space-y-1">
                  <Label>Tür</Label>
                  <select name="photoType" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" defaultValue="front">
                    {PHOTO_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <Label>Fotoğraf URL</Label>
                <Input
                  name="imageUrl"
                  placeholder="https://..."
                  onChange={(e) => setPreviewUrl(e.target.value || null)}
                />
                <p className="text-xs text-muted-foreground">
                  Vercel Blob entegrasyonu için hazır — şimdilik URL veya local preview
                </p>
              </div>
              {previewUrl && (
                <div className="relative aspect-[3/4] w-full max-w-[200px] mx-auto rounded-lg overflow-hidden border">
                  <Image src={previewUrl} alt="Preview" fill className="object-cover" unoptimized />
                </div>
              )}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label>Kilo</Label>
                  <Input name="weight" type="number" step="0.1" />
                </div>
                <div className="space-y-1">
                  <Label>Bel (cm)</Label>
                  <Input name="waist" type="number" step="0.1" />
                </div>
                <div className="space-y-1">
                  <Label>Faz</Label>
                  <Input name="phase" placeholder="Definasyon" />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Not</Label>
                <Textarea name="notes" rows={2} />
              </div>
              <Button type="submit" disabled={isPending} className="w-full">Kaydet</Button>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={noteOpen} onOpenChange={setNoteOpen}>
          <DialogTrigger>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Not Ekle
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Not Ekle</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleNoteSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Tarih</Label>
                  <Input name="date" type="date" defaultValue={toDateInputValue(today())} required />
                </div>
                <div className="space-y-1">
                  <Label>Başlık</Label>
                  <Input name="title" />
                </div>
              </div>
              <div className="space-y-1">
                <Label>İçerik</Label>
                <Textarea name="content" rows={4} required />
              </div>
              <Button type="submit" disabled={isPending} className="w-full">Kaydet</Button>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <Tabs defaultValue="photos">
        <TabsList>
          <TabsTrigger value="photos">Fotoğraflar ({photos.length})</TabsTrigger>
          <TabsTrigger value="notes">Notlar ({notes.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="photos" className="mt-4">
          {photos.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Henüz fotoğraf yok
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {photos.map((photo) => {
                const typeLabel = PHOTO_TYPES.find((t) => t.value === photo.photoType)?.label ?? photo.photoType;
                return (
                  <Card key={photo.id} className="overflow-hidden">
                    {photo.imageUrl ? (
                      <div className="relative aspect-[3/4] bg-muted">
                        <Image
                          src={photo.imageUrl}
                          alt={typeLabel}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="aspect-[3/4] bg-muted flex items-center justify-center text-muted-foreground text-sm">
                        URL yok
                      </div>
                    )}
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary">{typeLabel}</Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            startTransition(async () => {
                              await deletePhoto(photo.id);
                              router.refresh();
                            });
                          }}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{formatDateShort(photo.date)}</p>
                      {photo.weight && <p className="text-xs">{photo.weight} kg</p>}
                      {photo.notes && <p className="text-xs mt-1 line-clamp-2">{photo.notes}</p>}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="notes" className="mt-4 space-y-3">
          {notes.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Henüz not yok
              </CardContent>
            </Card>
          ) : (
            notes.map((note) => (
              <Card key={note.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{note.title ?? "Not"}</CardTitle>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{formatDateShort(note.date)}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          startTransition(async () => {
                            await deleteNote(note.id);
                            router.refresh();
                          });
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}
