import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../store/user/user.selector";

const StockJournalPage = () => {
  const currentUser = useSelector(selectCurrentUser);
  return (
    <>
      <h1>Stock Journal</h1>
      <p>{currentUser?.email}</p>
    </>
  );
};

export default StockJournalPage;
