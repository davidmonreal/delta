"use client";

import { useFormState } from "react-dom";

import { createUserAction } from "@/app/admin/users/actions";

const initialState = {};

type AdminUsersFormProps = {
  allowSuperadmin: boolean;
};

export default function AdminUsersForm({ allowSuperadmin }: AdminUsersFormProps) {
  const [state, formAction] = useFormState(createUserAction, initialState);

  return (
    <form className="card admin-form" action={formAction}>
      <h2>Crear usuari</h2>
      <div className="admin-form__fields">
        <label>
          Email
          <input type="email" name="email" required />
        </label>
        <label>
          Nom
          <input type="text" name="name" />
        </label>
        <label>
          Password
          <input type="password" name="password" required />
        </label>
        <label>
          Rol
          <select name="role" required defaultValue="USER">
            {allowSuperadmin ? (
              <option value="SUPERADMIN">SUPERADMIN</option>
            ) : null}
            <option value="ADMIN">ADMIN</option>
            <option value="USER">USER</option>
          </select>
        </label>
      </div>
      {state?.error ? <p className="form-error">{state.error}</p> : null}
      {state?.success ? <p className="form-success">{state.success}</p> : null}
      <button type="submit">Crear</button>
    </form>
  );
}
