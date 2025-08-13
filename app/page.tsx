"use client";

import ImageSlider from "@/components/image-slider/image-slider";
import {
  ThemeProvider,
  useTheme,
} from "@/components/theme-provider/theme-provider";
import styles from "./page.module.css";

function HomeContent() {
  const images = [
    { src: "/cat.png", alt: "Cat Pet", theme: "cat" },
    { src: "/dragon.png", alt: "Dragon Pet", theme: "dragon" },
    { src: "/snake.png", alt: "Snake Pet", theme: "snake" },
  ];

  const { currentTheme } = useTheme();

  return (
    <main className={styles.main}>
      <h1 className={`${styles.title} ${styles[currentTheme]}`}>
        Welcome to The Savage Pet
      </h1>
      <div className={styles.contentContainer}>
        <ImageSlider images={images} interval={6000} />
        <p className={styles.description}>
          Explore our NFT marketplace and mint your own Savage Pet!
        </p>
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <ThemeProvider autoRotate={false}>
      <HomeContent />
    </ThemeProvider>
  );
}
