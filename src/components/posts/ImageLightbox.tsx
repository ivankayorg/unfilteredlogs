import {
  useEffect,
  useState,
} from "react";

import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import type {
  PostImageRecord,
} from "../../types/post";

import "./ImageLightbox.css";


type Props = {
  images: PostImageRecord[];
  initialIndex: number;
  title?: string;
  onClose: () => void;
};


export default function ImageLightbox({
  images,
  initialIndex,
  title,
  onClose,
}: Props) {
  const [index, setIndex] = useState(
    Math.min(
      Math.max(initialIndex, 0),
      Math.max(images.length - 1, 0)
    )
  );


  useEffect(() => {
    const oldOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    const onKeyDown =
      (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          onClose();
        }

        if (
          event.key === "ArrowLeft" &&
          images.length > 1
        ) {
          setIndex((current) =>
            (current - 1 + images.length) %
            images.length
          );
        }

        if (
          event.key === "ArrowRight" &&
          images.length > 1
        ) {
          setIndex((current) =>
            (current + 1) % images.length
          );
        }
      };

    document.addEventListener(
      "keydown",
      onKeyDown
    );

    return () => {
      document.body.style.overflow =
        oldOverflow;

      document.removeEventListener(
        "keydown",
        onKeyDown
      );
    };
  }, [images.length, onClose]);


  if (images.length === 0) {
    return null;
  }

  const current = images[index];

  return (
    <div
      className="image-lightbox-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={title ? `${title} image viewer` : "Image viewer"}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      {images.length > 1 && (
        <div className="image-lightbox-count">
          {index + 1} / {images.length}
        </div>
      )}

      {images.length > 1 && (
        <>
          <button
            className="image-lightbox-nav image-lightbox-prev"
            type="button"
            onClick={() =>
              setIndex((currentIndex) =>
                (currentIndex - 1 + images.length) %
                images.length
              )
            }
            aria-label="Previous image"
          >
            <ChevronLeft size={28} />
          </button>

          <button
            className="image-lightbox-nav image-lightbox-next"
            type="button"
            onClick={() =>
              setIndex((currentIndex) =>
                (currentIndex + 1) % images.length
              )
            }
            aria-label="Next image"
          >
            <ChevronRight size={28} />
          </button>
        </>
      )}

      <div
        className="image-lightbox-canvas"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
            onClose();
          }
        }}
      >
        <img
          src={current.image_url}
          alt={title ?? ""}
          draggable={false}
          title="Click to return to post"
          onClick={onClose}
        />
      </div>

      {images.length > 1 && (
        <div className="image-lightbox-thumbs">
          {images.map((image, imageIndex) => (
            <button
              key={image.id}
              type="button"
              className={imageIndex === index ? "active" : ""}
              onClick={() => setIndex(imageIndex)}
              aria-label={`Open image ${imageIndex + 1}`}
            >
              <img src={image.image_url} alt="" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
