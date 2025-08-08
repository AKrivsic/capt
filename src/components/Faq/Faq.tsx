"use client";

import { useState } from "react";
import styles from "./Faq.module.css";

const faqs = [
  {
    question: "How many generations are free?",
    answer: "You can generate up to 3 outputs per day on the free plan – no sign-up needed.",
  },
  {
    question: "Is Captioni safe to use?",
    answer: "Yes! We don’t save your prompts or outputs. Everything runs securely through OpenAI.",
  },
  {
    question: "How does the paid version work?",
    answer: "With a paid plan, you get more generations, premium styles, and new output types like DMs or stories.",
  },
  {
    question: "Can I use this for OnlyFans content?",
    answer: "Absolutely. Captioni is designed to support Instagram, TikTok, X, and OnlyFans – with tailored outputs for each.",
  },
  {
    question: "Will the content sound natural?",
    answer: "Yes – each style is carefully crafted to match your tone, vibe, and platform. You can even add your own description.",
  },
  {
    question: "Can I generate multiple content types at once?",
    answer: "Yes! Select multiple outputs like captions, hashtags, bios or DMs in one click and we’ll generate them all at once.",
  },
  {
    question: "Do I need an account to try it?",
    answer: "Nope! Try Captioni for free without registration. Upgrade when you're ready to unlock full features.",
  },
];

export default function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className={styles.section} id="faq">
      <h2 className={styles.heading}>Frequently Asked Questions</h2>
      <div className={styles.accordion}>
        {faqs.map((faq, index) => (
          <div key={index} className={styles.item}>
            <button className={styles.question} onClick={() => toggle(index)}>
              {faq.question}
              <span>{openIndex === index ? "−" : "+"}</span>
            </button>
            {openIndex === index && (
              <div
  className={`${styles.answer} ${openIndex === index ? styles.show : ""}`}
>
  {faq.answer}
</div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
