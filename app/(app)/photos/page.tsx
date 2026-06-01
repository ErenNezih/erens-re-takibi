import { getPhotos, getNotes } from "@/lib/actions/photos";
import { PhotosClient } from "@/components/photos/photos-client";

export default async function PhotosPage() {
  const [photos, notes] = await Promise.all([getPhotos(), getNotes()]);
  return <PhotosClient photos={photos} notes={notes} />;
}
