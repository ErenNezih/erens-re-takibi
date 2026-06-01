"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { MedicalDisclaimer } from "@/components/medical-disclaimer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { createSubstance, deleteSubstance } from "@/lib/actions/substances";
import {
  SUBSTANCE_CATEGORIES,
  COMMON_ABBREVIATIONS,
  SUBSTANCE_DISCLAIMER,
  formatDateShort,
  toDateInputValue,
  today,
} from "@/lib/utils";
import type { SubstanceLog } from "@prisma/client";

interface SubstancesClientProps {
  substances: SubstanceLog[];
}

export function SubstancesClient({ substances }: SubstancesClientProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await createSubstance(formData);
      toast({ title: "Kayıt eklendi" });
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <PageHeader title="Takviye ve İlaç Takibi" description="Kişisel takip amaçlı manuel kayıt sistemi">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Yeni Kayıt
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Yeni Takviye / İlaç Kaydı</DialogTitle>
            </DialogHeader>
            <MedicalDisclaimer variant="compact" text={SUBSTANCE_DISCLAIMER} />
            <form onSubmit={handleSubmit} className="space-y-3 mt-3">
              <div className="space-y-1">
                <Label>Ürün Adı</Label>
                <Input name="name" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Kategori</Label>
                  <select name="category" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" defaultValue="supplement">
                    {SUBSTANCE_CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label>Kısaltma</Label>
                  <Input name="abbreviation" list="abbreviations" placeholder="Opsiyonel" />
                  <datalist id="abbreviations">
                    {COMMON_ABBREVIATIONS.map((a) => (
                      <option key={a} value={a} />
                    ))}
                  </datalist>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Başlangıç</Label>
                  <Input name="startDate" type="date" defaultValue={toDateInputValue(today())} required />
                </div>
                <div className="space-y-1">
                  <Label>Bitiş</Label>
                  <Input name="endDate" type="date" />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Kullanım Sıklığı (kendi notunuz)</Label>
                <Input name="frequency" placeholder="Örn: günde 1 kez" />
              </div>
              <div className="space-y-1">
                <Label>Kişisel Notunuz</Label>
                <Textarea name="userNotes" rows={2} placeholder="Sadece kişisel takip notu — doz tavsiyesi verilmez" />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox id="doctorSupervised" name="doctorSupervised" />
                  <Label htmlFor="doctorSupervised">Doktor kontrolünde</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="active" name="active" defaultChecked />
                  <Label htmlFor="active">Aktif</Label>
                </div>
              </div>
              <Button type="submit" disabled={isPending} className="w-full">Kaydet</Button>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <MedicalDisclaimer className="mb-6" />

      <div className="space-y-4">
        {substances.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Henüz kayıt yok
            </CardContent>
          </Card>
        ) : (
          substances.map((sub) => {
            const catLabel = SUBSTANCE_CATEGORIES.find((c) => c.value === sub.category)?.label ?? sub.category;
            return (
              <Card key={sub.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        {sub.name}
                        {sub.abbreviation && (
                          <Badge variant="secondary">{sub.abbreviation}</Badge>
                        )}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={sub.active ? "success" : "secondary"}>
                          {sub.active ? "Aktif" : "Pasif"}
                        </Badge>
                        <Badge variant="outline">{catLabel}</Badge>
                        {sub.doctorSupervised && (
                          <Badge variant="default">Doktor kontrolünde</Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm("Silmek istediğinize emin misiniz?")) {
                          startTransition(async () => {
                            await deleteSubstance(sub.id);
                            router.refresh();
                          });
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {formatDateShort(sub.startDate)}
                    {sub.endDate && ` — ${formatDateShort(sub.endDate)}`}
                    {sub.frequency && ` • ${sub.frequency}`}
                  </p>
                  {sub.userNotes && (
                    <p className="text-sm">{sub.userNotes}</p>
                  )}
                  <MedicalDisclaimer variant="compact" text={SUBSTANCE_DISCLAIMER} />
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </>
  );
}
