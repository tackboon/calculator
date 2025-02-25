import styles from "./calculator.module.scss";
import ProfitLossForm from "../../form/calculator/stock/profit_loss/profit_loss_form.component";
import TabLayout, { TabContent } from "../../layout/tab_layout.component";
import PricePercentageForm from "../../form/calculator/stock/price_percentage/price_percentage_form.component";
import PositionSizeForm from "../../form/calculator/stock/position_size/position_size_form.component";
import RiskAndProfitForm from "../../form/calculator/stock/risk_and_profit/risk_and_profit.component";
import ForexPositionSizeForm from "../../form/calculator/forex/position_size/position_size_form.component";

const CalculatorPage = () => {
  return (
    <div className={styles["container"]}>
      <TabLayout minChildWidth={90} maxChildWidth={140}>
        <TabContent name="Stock">
          <div className={styles["child-container"]}>
            <TabLayout minChildWidth={93} maxChildWidth={155}>
              <TabContent name="Profit / Loss">
                <ProfitLossForm />
              </TabContent>
              <TabContent name="Position Sizing">
                <PositionSizeForm />
              </TabContent>
              <TabContent name="Price-Percentage">
                <PricePercentageForm />
              </TabContent>
              <TabContent name="Risk & Profit">
                <RiskAndProfitForm />
              </TabContent>
            </TabLayout>
          </div>
        </TabContent>
        <TabContent name="Forex">
          <div className={styles["child-container"]}>
            <TabLayout minChildWidth={93} maxChildWidth={155}>
              <TabContent name="Profit / Loss">
                <ProfitLossForm />
              </TabContent>
              <TabContent name="Position Sizing">
                <ForexPositionSizeForm />
              </TabContent>
              <TabContent name="Price-Percentage">Pip Calculator</TabContent>
              <TabContent name="Risk & Profit">Leverage Calculator</TabContent>
            </TabLayout>
          </div>
        </TabContent>
      </TabLayout>
    </div>
  );
};

export default CalculatorPage;
