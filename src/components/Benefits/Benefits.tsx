"use client";
import { useEffect, useRef, useState } from "react";
import styles from "./Benefits.module.css";

const benefits = [
  {
    emoji: "✨",
    title: "Slay every post",
    text: "Captions that match your vibe, always.",
  },
  {
    emoji: "⏱️",
    title: "Zero effort, max glam",
    text: "We do the thinking, you do the posing.",
  },
  {
    emoji: "📈",
    title: "Boost your clout",
    text: "More likes, saves, and followers.",
  },
  {
    emoji: "🧠",
    title: "AI’s got your vibe",
    text: "Style-aware, platform-ready, mood-matching.",
  },
  {
    emoji: "💬",
    title: "No more 'what to write?'",
    text: "We’ve got the perfect words – always.",
  },
  {
    emoji: "👛",
    title: "Free = fabulous",
    text: "Slay your socials without spending a dime.",
  },
];

export default function Benefits() {
  const itemsRef = useRef<HTMLLIElement[]>([]);
  const [visibleIndexes, setVisibleIndexes] = useState<number[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = Number(entry.target.getAttribute("data-index"));
          if (entry.isIntersecting) {
            setVisibleIndexes((prev) =>
              prev.includes(index) ? prev : [...prev, index]
            );
          }
        });
      },
      {
        threshold: 0.4,
      }
    );

    itemsRef.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <section className={styles.benefits} id="benefits">
      <h2 className={styles.heading}>Why Captioni?</h2>
      <ul className={styles.list}>
        {benefits.map((item, index) => (
          <li
            key={index}
            data-index={index}
            ref={(el) => {
              if (el) itemsRef.current[index] = el;
            }}
            className={`${styles.item} ${
              visibleIndexes.includes(index) ? styles.visible : ""
            }`}
          >
            <div>
              {item.emoji} <strong>{item.title}</strong>
            </div>
            <p className={styles.subtext}>{item.text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
