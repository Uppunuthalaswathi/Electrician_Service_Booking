const AuthForm = ({ title, children, onSubmit, buttonText }) => {
  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <h2>{title}</h2>

      <form onSubmit={onSubmit}>
        {children}

        <button style={{ padding: "10px 20px", marginTop: "10px" }}>
          {buttonText}
        </button>
      </form>
    </div>
  );
};

export default AuthForm;