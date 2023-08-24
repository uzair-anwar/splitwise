import ExpenseSkeleton from "../../Components/Skeleton/Skeleton";
import { useEffect, useState } from "react";
import { collection, getDocs, getFirestore } from "firebase/firestore";
import { Box, Button, Container, Paper, Typography } from "@mui/material";
import { app, auth } from "../../Firebase/Firebase";
import { useNavigate } from "react-router-dom";
import { calculateTransactions } from "../../Utilities/transactionUtils";

export default function UserExpense() {
  const navigate = useNavigate();
  const [expensesData, setExpensesData] = useState([]);
  const [selectedExpenseId, setSelectedExpenseId] = useState(null);
  const [selectedExpenseSummary, setSelectedExpenseSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const db = getFirestore(app);

  useEffect(() => {
    handleGenerateExpenses();
  }, []);

  const handleClick = () => {
    navigate(`/${auth.currentUser.uid}/add-expense`);
  };

  const handleNavigation = () => {
    navigate(`/${auth.currentUser.uid}`);
  };

  const handleGenerateExpenses = async () => {
    try {
      const expensesCollection = collection(db, "expenses");
      const querySnapshot = await getDocs(expensesCollection);
      const expenses = querySnapshot.docs.map((element) => ({
        id: element.id,
        ...element.data(),
      }));

      const userExpenses = expenses.filter(
        (expense) =>
          (expense.creatorEmail === auth.currentUser.email ||
            (expense.Participants &&
              expense.Participants.some(
                (Participant) => Participant.email === auth.currentUser?.email
              ))) &&
          (!expense.Transactions || expense.Transactions.length > 0)
      );

      setLoading(false);
      setExpensesData(userExpenses);
    } catch (error) {
      setLoading(false);
    }
  };

  const handletransaction = (expense) => {
    const transactions = calculateTransactions(expense);
    setSelectedExpenseSummary(transactions);
    setSelectedExpenseId(expense.id);
  };
  return (
    <Container maxWidth="md">
      <Box display="flex" justifyContent="space-between">
        <Typography
          variant="h5"
          gutterBottom
          sx={{ mt: 2, mb: 2, fontWeight: "bold" }}
        >
          {auth.currentUser?.displayName
            ? `${auth.currentUser?.displayName}'s Expenses`
            : "User's Expenses"}
        </Typography>
        <Box display="flex" flexDirection="column">
          <Button variant="outlined" onClick={handleClick} sx={{ mb: 2 }}>
            Add Expense
          </Button>
          <Button variant="outlined" onClick={handleNavigation} sx={{ mb: 2 }}>
            DashBoard
          </Button>
        </Box>
      </Box>
      {loading ? (
        <>
          <ExpenseSkeleton />
          <ExpenseSkeleton />
        </>
      ) : expensesData.length === 0 ? (
        <Typography variant="body1"> No expenses to display. </Typography>
      ) : (
        <Box display="flex" flexDirection="column" sx={{ mt: 2 }}>
          {expensesData.map((expense) => (
            <Paper
              key={expense.id}
              elevation={3}
              sx={{ marginBottom: "2rem", padding: "1rem" }}
            >
              <Typography variant="body1" gutterBottom>
                Description: {expense.Description}
              </Typography>
              <Typography variant="body1" gutterBottom>
                Date: {expense.Date}
              </Typography>
              {expense.ImageUrl && (
                <Box
                  maxWidth="20%"
                  mt={2}
                  mb={2}
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                >
                  <img
                    src={expense.ImageUrl}
                    alt="Expense"
                    style={{ width: "100%", height: "auto" }}
                  />
                </Box>
              )}
              <Button
                sx={{ mt: 3, mb: 1 }}
                variant="outlined"
                color="primary"
                onClick={() => handletransaction(expense)}
              >
                View Report
              </Button>
              {selectedExpenseSummary.length > 0 &&
                selectedExpenseId === expense.id && (
                  <Box>
                    <Typography
                      variant="h6"
                      sx={{ mt: 3, mb: 3, fontWeight: "bold" }}
                    >
                      {" "}
                      Expense Summary:
                    </Typography>
                    <ul>
                      {selectedExpenseSummary.map((transaction, index) => (
                        <li key={index}>
                          {transaction.debtor} <b>owes</b>{" "}
                          {transaction.creditor} <b>${transaction.amount}</b>
                        </li>
                      ))}
                    </ul>
                  </Box>
                )}
            </Paper>
          ))}
        </Box>
      )}
    </Container>
  );
}
