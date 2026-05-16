export const TokenStore = {
  save:  (t) => { try { localStorage.setItem("auth_token", t);    } catch {} },
  load:  ()  => { try { return localStorage.getItem("auth_token"); } catch { return null; } },
  clear: ()  => { try { localStorage.removeItem("auth_token");     } catch {} },
};