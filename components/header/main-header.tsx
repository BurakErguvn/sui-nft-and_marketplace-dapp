"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import logoImg from "@/assets/logo.png"; // Adjust the path as necessary
import styles from "./main-header.module.css";
import "@mysten/dapp-kit/dist/index.css";
import WalletConnector from "./wallet-connection";

export default function MainHeader() {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // 50px'den fazla scroll yapıldıysa header davranışını başlat
      if (currentScrollY > 50) {
        if (currentScrollY > lastScrollY) {
          // Aşağı scroll - header'ı gizle
          setIsVisible(false);
        } else {
          // Yukarı scroll - header'ı göster
          setIsVisible(true);
        }
      } else {
        // En üstteyse her zaman göster
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [lastScrollY]);

  return (
    <header
      className={`${styles.header} ${
        isVisible ? styles.visible : styles.hidden
      }`}
    >
      <Link href="/" className={styles.logo}>
        <img src={logoImg.src} alt="The Savage Pet" /> The Savage Pet
      </Link>
      <nav className={styles.nav}>
        <ul>
          <li>
            <Link href="/mint">Mint</Link>
          </li>
          <li>
            <Link href="/marketplace">Marketplace</Link>
          </li>
          <li>
            <Link href="/my-nft">My Nft</Link>
          </li>
          <li>
            <WalletConnector />
          </li>
        </ul>
      </nav>
    </header>
  );
}
