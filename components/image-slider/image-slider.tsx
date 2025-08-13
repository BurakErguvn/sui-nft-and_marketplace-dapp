"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useTheme } from "@/components/theme-provider/theme-provider";
import styles from "./image-slider.module.css";

interface ImageData {
  src: string;
  alt: string;
  theme: string;
}

interface ImageSliderProps {
  images: ImageData[];
  interval?: number;
}

export default function ImageSlider({
  images,
  interval = 6000,
}: ImageSliderProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { setCurrentTheme } = useTheme();

  useEffect(() => {
    const slideInterval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, interval);

    return () => clearInterval(slideInterval);
  }, [images.length, interval]);

  // Theme'i currentImageIndex değiştiğinde ayrı olarak güncelle
  useEffect(() => {
    setCurrentTheme(images[currentImageIndex].theme);
  }, [currentImageIndex, images, setCurrentTheme]);

  return (
    <div
      className={`${styles.imageContainer} ${
        styles[images[currentImageIndex].theme]
      }`}
    >
      <div className={styles.imageSlider}>
        <Image
          src={images[currentImageIndex].src}
          alt={images[currentImageIndex].alt}
          width={500}
          height={500}
          priority
          className={styles.petImage}
          key={currentImageIndex} // Bu key prop animasyonun her değişimde tetiklenmesini sağlar
        />
      </div>
    </div>
  );
}
