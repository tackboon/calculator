import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../store/user/user.selector";

const PortfolioPage = () => {
  const currentUser = useSelector(selectCurrentUser);
  return (
    <>
      <h1>Portfolio</h1>
      <p>{currentUser?.email}</p>
    </>
  );
};

export default PortfolioPage;
