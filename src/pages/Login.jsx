import { useState } from "react";
import { Field } from "../components/ui.jsx";
import { useStore } from "../store.jsx";

export function Login() {
  const { login } = useStore();
  const [email, setEmail] = useState("motorista@rota.app");
  const [password, setPassword] = useState("1234");
  const [error, setError] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    const result = login(email, password);
    if (!result.ok) setError(result.error);
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="brand login-brand">
          <span className="brand-mark">SM</span>
          <div>
            <strong>Sistema Motorista</strong>
            <small>Entre para ver corridas, ganhos e a frota</small>
          </div>
        </div>

        <form className="form" onSubmit={handleSubmit}>
          <Field label="E-mail">
            <input
              type="email"
              value={email}
              autoComplete="username"
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </Field>
          <Field label="Senha">
            <input
              type="password"
              value={password}
              autoComplete="current-password"
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </Field>
          {error && <p className="form-error">{error}</p>}
          <button className="btn btn-primary btn-block" type="submit">
            Entrar
          </button>
        </form>

        <div className="demo-accounts">
          <p>Contas de demonstração</p>
          <div className="demo-row">
            <button
              type="button"
              onClick={() => {
                setEmail("motorista@rota.app");
                setPassword("1234");
                setError("");
              }}
            >
              Motorista
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail("admin@rota.app");
                setPassword("1234");
                setError("");
              }}
            >
              Administrador
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
