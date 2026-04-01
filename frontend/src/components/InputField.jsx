const InputField = ({ type = "text", name, placeholder, value, onChange }) => {
  return (
    <input
      type={type}
      name={name}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required
      style={{
        display: "block",
        margin: "10px auto",
        padding: "10px",
        width: "250px",
      }}
    />
  );
};

export default InputField;