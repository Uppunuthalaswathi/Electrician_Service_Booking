import { useState } from "react";
import { Box, Button, TextField, Typography, Paper } from "@mui/material";
import { forgotPassword } from "../../api/authApi";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await forgotPassword(email);
    alert(res.data.message);
  };

  return (
    <Box display="flex" justifyContent="center" mt={10}>
      <Paper elevation={3} sx={{ padding: 4, width: 350 }}>
        <Typography variant="h5" textAlign="center" mb={3}>
          Forgot Password
        </Typography>

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Email"
            margin="normal"
            onChange={(e) => setEmail(e.target.value)}
          />

          <Button fullWidth variant="contained" type="submit">
            Send Reset Link
          </Button>
        </form>
      </Paper>
    </Box>
  );
};

export default ForgotPassword;