'use client';

import { useEffect, useRef, useState } from 'react';

const articleImageSelector = '.detail__body img';

interface ActiveImage {
  alt: string;
  src: string;
}

export function ArticleImageLightbox() {
  const [activeImage, setActiveImage] = useState<ActiveImage | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const images = [...document.querySelectorAll<HTMLImageElement>(articleImageSelector)];
    const cleanups: Array<() => void> = [];

    for (const image of images) {
      const open = () => {
        triggerRef.current = image;
        setActiveImage({
          alt: image.alt.trim() || '文章图片',
          src: image.currentSrc || image.src,
        });
      };
      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          open();
        }
      };

      image.classList.add('detail__image--zoomable');
      image.setAttribute('role', 'button');
      image.setAttribute('tabindex', '0');
      image.setAttribute('aria-label', `放大查看：${image.alt.trim() || '文章图片'}`);
      image.addEventListener('click', open);
      image.addEventListener('keydown', onKeyDown);
      cleanups.push(() => {
        image.classList.remove('detail__image--zoomable');
        image.removeAttribute('role');
        image.removeAttribute('tabindex');
        image.removeAttribute('aria-label');
        image.removeEventListener('click', open);
        image.removeEventListener('keydown', onKeyDown);
      });
    }

    return () => cleanups.forEach((cleanup) => cleanup());
  }, []);

  useEffect(() => {
    if (!activeImage) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveImage(null);
      }
    };

    document.body.classList.add('article-image-lightbox-open');
    document.addEventListener('keydown', onKeyDown);
    const focusFrame = window.requestAnimationFrame(() => closeButtonRef.current?.focus({ preventScroll: true }));

    return () => {
      document.body.classList.remove('article-image-lightbox-open');
      document.removeEventListener('keydown', onKeyDown);
      window.cancelAnimationFrame(focusFrame);
      triggerRef.current?.focus({ preventScroll: true });
    };
  }, [activeImage]);

  if (!activeImage) {
    return null;
  }

  return (
    <div className="article-image-lightbox" role="dialog" aria-modal="true" aria-label="图片预览">
      <button type="button" className="article-image-lightbox__backdrop" aria-label="关闭图片预览" onClick={() => setActiveImage(null)} />
      <figure className="article-image-lightbox__figure">
        <div className="article-image-lightbox__toolbar">
          <figcaption>{activeImage.alt}</figcaption>
          <button ref={closeButtonRef} type="button" onClick={() => setActiveImage(null)}>
            关闭
          </button>
        </div>
        <img src={activeImage.src} alt={activeImage.alt} />
      </figure>
    </div>
  );
}
