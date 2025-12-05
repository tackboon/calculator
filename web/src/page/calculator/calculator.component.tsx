import styles from "./calculator.module.scss";
import ProfitLossForm from "../../form/calculator/stock/profit_loss/profit_loss_form.component";
import ForexProfitLossForm from "../../form/calculator/forex/profit_loss/profit_loss_form.component";
import TabLayout, { TabContent } from "../../layout/tab_layout.component";
import PricePercentageForm from "../../form/calculator/stock/price_percentage/price_percentage_form.component";
import PositionSizeForm from "../../form/calculator/stock/position_size/position_size_form.component";
import RiskAndProfitForm from "../../form/calculator/stock/risk_and_profit/risk_and_profit.component";
import ForexPositionSizeForm from "../../form/calculator/forex/position_size/position_size_form.component";
import { useCheckIsLargeView } from "../../common/screen/size";
import ForexPipForm from "../../form/calculator/forex/pip/pip_form.component";
import ForexMarginForm from "../../form/calculator/forex/margin/margin_form.component";
import ForexSwapForm from "../../form/calculator/forex/swap/swap_form.component";
import ForexPipMovementForm from "../../form/calculator/forex/pip_movement/pip_movement_form.component";

const CalculatorPage = () => {
  const isLargeView = useCheckIsLargeView();

  return (
    <div className={styles["container"]}>
      <TabLayout minChildWidth={90} maxChildWidth={168} showSelectBox={false}>
        <TabContent name="Stock">
          <div className={styles["child-container"]}>
            <TabLayout
              minChildWidth={93}
              maxChildWidth={155}
              showSelectBox={!isLargeView}
            >
              <TabContent name="Profit / Loss">
                <ProfitLossForm />
              </TabContent>
              <TabContent name="Position Sizing">
                <PositionSizeForm />
              </TabContent>
              <TabContent name="Price Change">
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
            <TabLayout
              minChildWidth={93}
              maxChildWidth={168}
              showSelectBox={!isLargeView}
            >
              <TabContent name="Profit / Loss">
                <ForexProfitLossForm />
              </TabContent>
              <TabContent name="Position Sizing">
                <ForexPositionSizeForm />
              </TabContent>
              <TabContent name="Pip Value">
                <ForexPipForm />
              </TabContent>
              <TabContent name="Price Change">
                <ForexPipMovementForm />
              </TabContent>
              <TabContent name="Margin to Hold">
                <ForexMarginForm />
              </TabContent>
              <TabContent name="Swap Value">
                <ForexSwapForm />
              </TabContent>
            </TabLayout>
          </div>
        </TabContent>
      </TabLayout>

      <div className={styles["footer"]}>
        <p>
          <strong>Risk Disclaimer & Warning:</strong> All calculators provided
          on this site including stock and forex tools are for informational and
          educational purposes only. They are designed to assist users in
          performing general trading-related calculations and do not constitute
          investment advice or financial recommendations. Actual trading
          outcomes may differ due to market volatility, execution speed, fees,
          and other factors. Trading in financial markets carries a high level
          of risk and may result in the loss of all or part of your invested
          capital. You should evaluate your own financial situation and consult
          a licensed financial advisor before making any trading decisions. The
          website and its authors assume no liability for any losses or damages
          resulting from the use or reliance on these calculators.
        </p>
        <div className={styles.copy}>
          © {new Date().getFullYear()} tbwinrate.com. All rights reserved.
        </div>
      </div>
    </div>
  );
};

export default CalculatorPage;
