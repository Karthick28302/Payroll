import { useEffect, useState } from "react";
import { getCurrentEmployee, employeeLogin } from "../services/authService";

const TOKEN_KEY    = "employee_token";
const EMPLOYEE_KEY = "employee_user";

const useEmployeeAuth = () => {
  const [employee, setEmployee] = useState(() => {
    try {
      const raw = localStorage.getItem(EMPLOYEE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading]           = useState(false);
  const [bootstrapping, setBootstrapping] = useState(true);

  const isAuthenticated = Boolean(
    localStorage.getItem(TOKEN_KEY) && employee?.role === "employee"
  );

  const login = async ({ identifier, password }) => {
    setLoading(true);
    try {
      const data = await employeeLogin({ identifier, password });
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(EMPLOYEE_KEY, JSON.stringify(data.employee));
      setEmployee(data.employee);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EMPLOYEE_KEY);
    setEmployee(null);
  };

  const refreshMe = async () => {
    if (!localStorage.getItem(TOKEN_KEY)) {
      setBootstrapping(false);
      return;
    }
    try {
      const me = await getCurrentEmployee();
      const normalized = {
        id:           me.id,
        role:         me.role,
        email:        me.email,
        fullName:     me.fullName,
        employeeCode: me.employeeCode,
        department:   me.department,
        designation:  me.designation,
        joinDate:     me.joinDate,
        phone:        me.phone,
        address:      me.address,
      };
      setEmployee((prev) => {
        const merged = { ...prev, ...normalized };
        localStorage.setItem(EMPLOYEE_KEY, JSON.stringify(merged));
        return merged;
      });
    } catch (err) {
      // Only force logout on 401/403 — not on network errors
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        logout();
      }
      // Otherwise keep existing cached employee data so page still renders
    } finally {
      setBootstrapping(false);
    }
  };

  useEffect(() => {
    refreshMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { employee, loading, bootstrapping, isAuthenticated, login, logout };
};

export default useEmployeeAuth;
