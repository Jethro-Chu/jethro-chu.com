import type { ABGCompensation, ABGDisorder } from "@/lib/abg/types";
import { getABGIntervention } from "@/lib/abg/interventions";
import styles from "./ABGArena.module.css";

export function ClinicalInterventions({ disorder, compensation }: { disorder: ABGDisorder; compensation: ABGCompensation }) {
  const intervention = getABGIntervention(disorder, compensation);

  return (
    <section className={styles.interventions} aria-labelledby="clinical-interventions-title">
      <h3 id="clinical-interventions-title">Clinical Interventions</h3>

      <div className={styles.interventionPriority}>
        <h4>Priority</h4>
        <p>{intervention.priority}</p>
      </div>

      <div className={styles.interventionBlock}>
        <h4>Nursing Interventions</h4>
        <ul>{intervention.nursingInterventions.map((item) => <li key={item}>{item}</li>)}</ul>
      </div>

      <div className={styles.interventionBlock}>
        <h4>Possible Medical Treatment</h4>
        <p className={styles.treatmentLead}>Depending on the underlying cause, possible orders may include:</p>
        <ul>{intervention.possibleTreatments.map((item) => <li key={item}>{item}</li>)}</ul>
        {intervention.safetyNote && <p className={styles.interventionSafety}>{intervention.safetyNote}</p>}
      </div>

      <div className={styles.interventionMonitor}>
        <h4>Monitor</h4>
        <p>{intervention.monitor.map((item, index) => <span key={item}>{index > 0 && <i aria-hidden="true">·</i>}{item}</span>)}</p>
      </div>

      <div className={styles.interventionRemember}>
        <h4>Remember</h4>
        <p>{intervention.remember}</p>
      </div>

      {intervention.compensationTeaching && <p className={styles.compensationTeaching}>{intervention.compensationTeaching}</p>}
      <p className={styles.interventionDisclaimer}>Educational guidance only. Clinical interventions depend on the patient’s condition, underlying cause, provider orders, and facility protocols.</p>
    </section>
  );
}
