import type { Metadata } from "next";
import styles from "./poster.module.css";

export const metadata: Metadata = {
  title: "Abstract & References | Who Benefits When AI Decides?",
  description:
    "Abstract and full APA 7th edition reference list for Jethro Chu's senior nursing ethics research poster on algorithmic bias and the ethical use of artificial intelligence in healthcare at Azusa Pacific University School of Nursing.",
  alternates: {
    canonical: "https://jethrochu.com/Abstractandreferences",
  },
  openGraph: {
    title: "Who Benefits When AI Decides? Bias and the Ethical Use of Artificial Intelligence in Healthcare",
    description:
      "Digital companion containing the abstract and full APA 7th edition reference list for the senior nursing ethics research poster by Jethro Chu, Azusa Pacific University School of Nursing.",
    url: "https://jethrochu.com/Abstractandreferences",
    type: "article",
    siteName: "Azusa Pacific University School of Nursing",
  },
  twitter: {
    card: "summary",
    title: "Who Benefits When AI Decides? Bias and the Ethical Use of Artificial Intelligence in Healthcare",
    description:
      "Senior nursing ethics research poster companion: Abstract and full APA 7th edition reference list by Jethro Chu, Azusa Pacific University School of Nursing.",
  },
};

const keywords = [
  "artificial intelligence",
  "healthcare disparities",
  "algorithmic bias",
  "health equity",
  "nursing ethics",
];

const structuredData = {
  "@context": "https://schema.org",
  "@type": "ScholarlyArticle",
  "headline":
    "Who Benefits When AI Decides? Bias and the Ethical Use of Artificial Intelligence in Healthcare",
  "name":
    "Who Benefits When AI Decides? Bias and the Ethical Use of Artificial Intelligence in Healthcare",
  "author": {
    "@type": "Person",
    "name": "Jethro Chu",
    "affiliation": {
      "@type": "EducationalOrganization",
      "name": "Azusa Pacific University School of Nursing",
    },
  },
  "keywords": keywords.join(", "),
  "url": "https://jethrochu.com/Abstractandreferences",
  "about": [
    "Artificial Intelligence in Healthcare",
    "Algorithmic Bias",
    "Health Equity",
    "Nursing Ethics",
  ],
};

export default function AbstractAndReferencesPage() {
  return (
    <div className={styles.shell}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />

      {/* 1. Academic Poster Title Banner */}
      <header className={styles.headerBanner} role="banner">
        <div className={styles.headerInner}>
          <h1 className={styles.title}>
            Who Benefits When AI Decides? Bias and the Ethical Use of
            Artificial Intelligence in Healthcare
          </h1>
          <p className={styles.authorLine}>
            Jethro Chu | Azusa Pacific University School of Nursing
          </p>
          <p className={styles.categoryLine}>
            <span className={styles.categoryLabel}>Category:</span> Special
            Projects
          </p>
        </div>
      </header>

      {/* Main Content Area */}
      <main id="main" className={styles.mainContainer}>
        {/* 2. Abstract Card */}
        <section
          className={styles.abstractCard}
          aria-labelledby="abstract-heading"
        >
          <h2 id="abstract-heading" className={styles.sectionHeading}>
            Abstract
          </h2>
          <p className={styles.abstractBody}>
            Artificial intelligence in our day and age is becoming more and
            more common as better AI models come out every month. It has the
            potential to improve clinical decision-making, diagnosis, and
            patient outcomes; however, an AI system that performs well overall
            may not perform equally well for every patient population. This
            project looks at whether it is ethical to use AI in healthcare to
            improve outcomes for most patients when it may perform worse for
            certain populations. Current research shows that differences in
            training data, health disparities, model design, and data can
            contribute to unequal AI performance, and studies have found
            examples of AI systems underdiagnosing underserved populations and
            performing differently across populations based on race, gender, and
            skin tone, producing biased recommendations that can influence a
            healthcare provider&apos;s decision. These differences raise ethical
            concerns related to justice, beneficence, and nonmaleficence because
            an AI system may benefit many patients while placing certain
            populations at a greater risk of harm. According to current
            research, AI systems can still be ethically used in healthcare, but
            healthcare organizations have a responsibility to identify and
            reduce disparities before and after implementation. In order to
            responsibly implement AI, there needs to be testing across
            different patient populations using more representative data while
            also being transparent about the limitations of the technology.
            Overall, healthcare organizations should not rely solely on an AI
            system&apos;s overall accuracy when determining whether it is safe
            or ethical to use. Instead, they should also consider how the
            technology affects individual patient populations to ensure that
            advances in AI do not worsen existing healthcare disparities.
          </p>

          <p className={styles.keywordsLine}>
            <strong className={styles.keywordsLabel}>Keywords:</strong>{" "}
            {keywords.map((kw, index) => (
              <span key={kw}>
                {index > 0 && (
                  <span className={styles.keywordSeparator} aria-hidden="true">
                    ·
                  </span>
                )}
                {kw}
              </span>
            ))}
          </p>
        </section>

        {/* 3. References Card */}
        <section
          className={styles.referencesCard}
          aria-labelledby="references-heading"
        >
          <h2 id="references-heading" className={styles.sectionHeading}>
            References
          </h2>

          <ol className={styles.referencesList}>
            {/* 1. Abràmoff et al. (2023) */}
            <li className={styles.referenceItem}>
              Abràmoff, M. D., Tarver, M. E., Loyo-Berrios, N., Trujillo, S.,
              Char, D., Obermeyer, Z., Eydelman, M. B., Foundational Principles
              of Ophthalmic Imaging and Algorithmic Interpretation Working Group
              of the Collaborative Community for Ophthalmic Imaging Foundation,
              Washington, D.C., &amp; Maisel, W. H. (2023). Considerations for
              addressing bias in artificial intelligence for health equity.{" "}
              <em>npj Digital Medicine</em>, <em>6</em>, Article 170.{" "}
              <a
                href="https://doi.org/10.1038/s41746-023-00913-9"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.refLink}
              >
                https://doi.org/10.1038/s41746-023-00913-9
              </a>
            </li>

            {/* 2. American Nurses Association. (2010) */}
            <li className={styles.referenceItem}>
              American Nurses Association. (2010).{" "}
              <em>
                Nursing’s social policy statement: The essence of the profession
              </em>{" "}
              (3rd ed.).
            </li>

            {/* 3. American Nurses Association. (2025) */}
            <li className={styles.referenceItem}>
              American Nurses Association. (2025).{" "}
              <em>Code of ethics for nurses</em>.{" "}
              <a
                href="https://www.nursingworld.org/nurses-books/Code-of-ethics-2025/"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.refLink}
              >
                https://www.nursingworld.org/nurses-books/Code-of-ethics-2025/
              </a>
            </li>

            {/* 4. California Board of Registered Nursing. (n.d.) */}
            <li className={styles.referenceItem}>
              California Board of Registered Nursing. (n.d.).{" "}
              <em>Nursing Practice Act</em>. California Department of Consumer
              Affairs. Retrieved November 2, 2026, from{" "}
              <a
                href="https://www.rn.ca.gov/practice/npa.shtml"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.refLink}
              >
                https://www.rn.ca.gov/practice/npa.shtml
              </a>
            </li>

            {/* 5. Daneshjou et al. (2022) */}
            <li className={styles.referenceItem}>
              Daneshjou, R., Vodrahalli, K., Novoa, R. A., Jenkins, M., Liang,
              W., Rotemberg, V., Ko, J., Swetter, S. M., Bailey, E. E., Gevaert,
              O., Mukherjee, P., Phung, M., Yekrang, K., Fong, B., Sahasrabudhe,
              R., Allerup, J. A. C., Okata-Karigane, U., Zou, J., &amp; Chiou,
              A. S. (2022). Disparities in dermatology AI performance on a
              diverse, curated clinical image set. <em>Science Advances</em>,{" "}
              <em>8</em>(32), eabq6147.{" "}
              <a
                href="https://doi.org/10.1126/sciadv.abq6147"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.refLink}
              >
                https://doi.org/10.1126/sciadv.abq6147
              </a>
            </li>

            {/* 6. Elgendi et al. (2026) */}
            <li className={styles.referenceItem}>
              Elgendi, M., Elkhalifa, A., Khandoker, A., Maruotti, A., Zhou, H.,
              Menon, C., &amp; Ward, R. (2026). Dataset effects outweigh
              algorithmic effects in determining fairness of healthcare machine
              learning. <em>npj Digital Medicine</em>, <em>9</em>, Article 571.{" "}
              <a
                href="https://doi.org/10.1038/s41746-026-02723-1"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.refLink}
              >
                https://doi.org/10.1038/s41746-026-02723-1
              </a>
            </li>

            {/* 7. Haider et al. (2026) */}
            <li className={styles.referenceItem}>
              Haider, S. A., Borna, S., Gomez-Cabello, C. A., Pressman, S. M.,
              Haider, C. R., &amp; Forte, A. J. (2026). The algorithmic divide:
              A systematic review on AI-driven racial disparities in healthcare.{" "}
              <em>Journal of Racial and Ethnic Health Disparities</em>,{" "}
              <em>13</em>(1), 188–217.{" "}
              <a
                href="https://doi.org/10.1007/s40615-024-02237-0"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.refLink}
              >
                https://doi.org/10.1007/s40615-024-02237-0
              </a>
            </li>

            {/* 8. The Holy Bible, English Standard Version. (2016) */}
            <li className={styles.referenceItem}>
              <em>The Holy Bible, English Standard Version</em>. (2016).
              Crossway. (Original work published 2001)
            </li>

            {/* 9. Jabbour et al. (2023) */}
            <li className={styles.referenceItem}>
              Jabbour, S., Fouhey, D., Shepard, S., Valley, T. S., Kazerooni, E.
              A., Banovic, N., Wiens, J., &amp; Sjoding, M. W. (2023). Measuring
              the impact of AI in the diagnosis of hospitalized patients: A
              randomized clinical vignette survey study. <em>JAMA</em>,{" "}
              <em>330</em>(23), 2275–2284.{" "}
              <a
                href="https://doi.org/10.1001/jama.2023.22295"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.refLink}
              >
                https://doi.org/10.1001/jama.2023.22295
              </a>
            </li>

            {/* 10. Lett et al. (2025) */}
            <li className={styles.referenceItem}>
              Lett, E., Shahbandegan, S., Barak-Corren, Y., Fine, A. M., &amp;
              La Cava, W. G. (2025). Intersectional and marginal debiasing in
              prediction models for emergency admissions.{" "}
              <em>JAMA Network Open</em>, <em>8</em>(5), e2512947.{" "}
              <a
                href="https://doi.org/10.1001/jamanetworkopen.2025.12947"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.refLink}
              >
                https://doi.org/10.1001/jamanetworkopen.2025.12947
              </a>
            </li>

            {/* 11. Nazer et al. (2023) */}
            <li className={styles.referenceItem}>
              Nazer, L. H., Zatarah, R., Waldrip, S., Ke, J. X. C., Moukheiber,
              M., Khanna, A. K., Hicklen, R. S., Moukheiber, L., Moukheiber, D.,
              Ma, H., &amp; Mathur, P. (2023). Bias in artificial intelligence
              algorithms and recommendations for mitigation.{" "}
              <em>PLOS Digital Health</em>, <em>2</em>(6), e0000278.{" "}
              <a
                href="https://doi.org/10.1371/journal.pdig.0000278"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.refLink}
              >
                https://doi.org/10.1371/journal.pdig.0000278
              </a>
            </li>

            {/* 12. OpenAI. (2026) */}
            <li className={styles.referenceItem}>
              OpenAI. (2026). <em>ChatGPT</em> [Large language model].{" "}
              <a
                href="https://chatgpt.com/"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.refLink}
              >
                https://chatgpt.com/
              </a>
            </li>

            {/* 13. Saha et al. (2026) */}
            <li className={styles.referenceItem}>
              Saha, A., Shao, L., Kim, J., &amp; Dunn, A. G. (2026). Fairness in
              multimodal machine learning applications in clinical decision
              support: A systematic review. <em>npj Digital Medicine</em>.
              Advance online publication.{" "}
              <a
                href="https://doi.org/10.1038/s41746-026-03000-x"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.refLink}
              >
                https://doi.org/10.1038/s41746-026-03000-x
              </a>
            </li>

            {/* 14. Seyyed-Kalantari et al. (2021) */}
            <li className={styles.referenceItem}>
              Seyyed-Kalantari, L., Zhang, H., McDermott, M. B. A., Chen, I. Y.,
              &amp; Ghassemi, M. (2021). Underdiagnosis bias of artificial
              intelligence algorithms applied to chest radiographs in
              under-served patient populations. <em>Nature Medicine</em>,{" "}
              <em>27</em>(12), 2176–2182.{" "}
              <a
                href="https://doi.org/10.1038/s41591-021-01595-0"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.refLink}
              >
                https://doi.org/10.1038/s41591-021-01595-0
              </a>
            </li>

            {/* 15. Sjoding et al. (2023) */}
            <li className={styles.referenceItem}>
              Sjoding, M. W., Ansari, S., &amp; Valley, T. S. (2023). Origins of
              racial and ethnic bias in pulmonary technologies.{" "}
              <em>Annual Review of Medicine</em>, <em>74</em>, 401–412.{" "}
              <a
                href="https://doi.org/10.1146/annurev-med-043021-024004"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.refLink}
              >
                https://doi.org/10.1146/annurev-med-043021-024004
              </a>
            </li>

            {/* 16. Vokinger et al. (2021) */}
            <li className={styles.referenceItem}>
              Vokinger, K. N., Feuerriegel, S., &amp; Kesselheim, A. S. (2021).
              Mitigating bias in machine learning for medicine.{" "}
              <em>Communications Medicine</em>, <em>1</em>, Article 25.{" "}
              <a
                href="https://doi.org/10.1038/s43856-021-00028-w"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.refLink}
              >
                https://doi.org/10.1038/s43856-021-00028-w
              </a>
            </li>

            {/* 17. Yang et al. (2024) */}
            <li className={styles.referenceItem}>
              Yang, Y., Zhang, H., Gichoya, J. W., Katabi, D., &amp; Ghassemi,
              M. (2024). The limits of fair medical imaging AI in real-world
              generalization. <em>Nature Medicine</em>, <em>30</em>(10),
              2838–2848.{" "}
              <a
                href="https://doi.org/10.1038/s41591-024-03113-4"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.refLink}
              >
                https://doi.org/10.1038/s41591-024-03113-4
              </a>
            </li>
          </ol>
        </section>
      </main>

      {/* 4. Subtle Academic Footer */}
      <footer className={styles.footer} role="contentinfo">
        <p className={styles.footerText}>
          Jethro Chu | Azusa Pacific University School of Nursing
        </p>
      </footer>
    </div>
  );
}
