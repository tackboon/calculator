import styles from "./calculator.module.scss";
import ProfitLossForm from "../../form/calculator/profit_loss_form.component";
import TabLayout, { TabContent } from "../../layout/tab_layout.component";
import PositionSizeForm from "../../form/calculator/position_size_form.component";
import OptimalEntryForm from "../../form/calculator/optimal_entry_form.component";

const CalculatorPage = () => {
  return (
    <div className={styles["container"]}>
      <TabLayout>
        <TabContent name="Stock">
          <div className={styles["child-container"]}>
            <TabLayout>
              <TabContent name="Profit / Loss">
                <ProfitLossForm />
              </TabContent>
              <TabContent name="Position Sizing">
                <PositionSizeForm />
              </TabContent>
              <TabContent name="Optimal Entry">
                <OptimalEntryForm />
              </TabContent>
            </TabLayout>
          </div>
        </TabContent>
        <TabContent name="Forex">This is forex calculator</TabContent>
      </TabLayout>
    </div>
  );
};

export default CalculatorPage;
