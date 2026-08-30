import {
  useEffect,
  useState,
} from "react";

import type {
  PostImageRecord,
} from "../../types/post";

import ImageLightbox from "./ImageLightbox";

import "./PostImageGallery.css";


type Props = {
  images: PostImageRecord[];
  title?: string;
  compact?: boolean;
};


export default function PostImageGallery({
  images,
  title,
  compact = false,
}: Props) {
  const [selectedIndex, setSelectedIndex] =
    useState(0);

  const [lightboxIndex, setLightboxIndex] =
    useState<number | null>(null);


  useEffect(() => {
    if (selectedIndex >= images.length) {
      setSelectedIndex(0);
    }
  }, [images.length, selectedIndex]);


  if (images.length === 0) {
    return null;
  }

  const selected =
    images[selectedIndex] ?? images[0];

  return (
    <div
      className={
        compact
          ? "post-image-gallery compact"
          : "post-image-gallery"
      }
    >
      <button
        className="post-image-gallery-main"
        type="button"
        onClick={() => setLightboxIndex(selectedIndex)}
        aria-label={`Open ${title ?? "image"} at full resolution`}
        title="Open full-resolution image"
      >
        <img
          src={selected.image_url}
          alt={title ?? ""}
          loading="lazy"
        />
      </button>

      {images.length > 1 && (
        <div className="post-image-gallery-strip">
          <div className="post-image-gallery-thumbs">
            {images.map((image, index) => (
              <button
                key={image.id}
                type="button"
                className={index === selectedIndex ? "active" : ""}
                onClick={() => setSelectedIndex(index)}
                aria-label={`Show image ${index + 1} of ${images.length}`}
              >
                <img src={image.image_url} alt="" loading="lazy" />
              </button>
            ))}
          </div>

          <span className="post-image-gallery-count">
            {selectedIndex + 1} / {images.length}
          </span>
        </div>
      )}

      {lightboxIndex !== null && (
        <ImageLightbox
          images={images}
          initialIndex={lightboxIndex}
          title={title}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
}
