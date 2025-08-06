"use client";

import { useState } from "react";
import styles from "./Faq.module.css";

const faqs = [
  {
    question: "Kolik generací je zdarma?",
    answer: "Můžeš zdarma vygenerovat až 10 výstupů denně bez registrace.",
  },
  {
    question: "Je to bezpečné?",
    answer: "Ano! Data nejsou ukládána a vše běží bezpečně přes OpenAI API.",
  },
  {
    question: "Jak funguje placená verze?",
    answer: "Získáš neomezené generace, pokročilé styly a možnost uložení výstupů.",
  },
];

export default function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className={styles.section} id="faq">
      <h2 className={styles.heading}>Nejčastější otázky</h2>
      <div className={styles.accordion}>
        {faqs.map((faq, index) => (
          <div key={index} className={styles.item}>
            <button className={styles.question} onClick={() => toggle(index)}>
              {faq.question}
              <span>{openIndex === index ? "−" : "+"}</span>
            </button>
            {openIndex === index && (
              <div className={styles.answer}>{faq.answer}</div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
