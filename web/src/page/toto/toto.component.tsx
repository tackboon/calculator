import styles from "./toto.module.scss";
import TotoForm from "../../form/toto/toto_form.component";

const TotoPage = () => {
  return (
    <div className={styles["container"]}>
      <div className={styles["child-container"]}>
        <TotoForm />
      </div>

      <div className={styles["footer"]}>
        <p>
          <strong>Disclaimer & Warning:</strong> The TOTO Number Generator
          provided on this site is for entertainment and educational purposes
          only. It is designed to help users generate random or customized
          number combinations based on personal preferences and does not
          guarantee any winning outcome. TOTO and other lottery games are games
          of chance, and results are purely random. Use of this generator does
          not improve winning odds or influence official draw results. Always
          play responsibly and within your means. The website and its authors
          assume no liability for any losses or consequences arising from the
          use or reliance on this generator.
        </p>
        <div className={styles.copy}>
          © {new Date().getFullYear()} tbwinrate.com. All rights reserved.
        </div>
      </div>
    </div>
  );
};

export default TotoPage;
