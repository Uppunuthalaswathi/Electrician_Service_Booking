import { useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  MenuItem,
  Link
} from "@mui/material";
import { registerUser } from "../../api/authApi";
import { useNavigate } from "react-router-dom";

const Register = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await registerUser(form);
      alert(res.data.message);
      navigate("/");
    } catch (err) {
      alert(err.response?.data?.message || "Registration Failed");
    }
  };

  return (
    <Box display="flex" justifyContent="center" mt={10}>
      <Paper elevation={3} sx={{ padding: 4, width: 350 }}>
        <Typography variant="h5" textAlign="center" mb={3}>
          Register
        </Typography>

        <form onSubmit={handleSubmit}>
          <TextField fullWidth label="Name" name="name" margin="normal" onChange={handleChange} />
          <TextField fullWidth label="Email" name="email" margin="normal" onChange={handleChange} />
          <TextField fullWidth label="Password" type="password" name="password" margin="normal" onChange={handleChange} />

          <TextField
            select
            fullWidth
            name="role"
            label="Role"
            margin="normal"
            defaultValue="user"
            onChange={handleChange}
          >
            <MenuItem value="user">User</MenuItem>
            <MenuItem value="electrician">Electrician</MenuItem>
          </TextField>

          <Button fullWidth variant="contained" sx={{ mt: 2 }} type="submit">
            Register
          </Button>
        </form>

        <Typography mt={2}>
          Already have account? <Link href="/">Login</Link>
        </Typography>
      </Paper>
    </Box>
  );
};

export default Register;