// Talks to the Lately server (server/ in this repo), which nginx serves under /api on the same address as the
// site. Each call returns the server's answer, or throws an Error whose message is fit to show; "status" on it is
// the HTTP status, or 0 when no server answered at all.
async function call(method, path, body) {
  let res;
  try {
    res = await fetch(`/api${path}`, {
      method,
      credentials: "same-origin",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw Object.assign(new Error("Can't reach the server."), { status: 0 });
  }
  if (res.status === 204) return null;
  // Anything that isn't JSON didn't come from the server: with it switched off, nginx answers with a page.
  const data = (res.headers.get("content-type") ?? "").includes("application/json") ? await res.json().catch(() => null) : null;
  if (!data) throw Object.assign(new Error("Can't reach the server."), { status: 0 });
  if (!res.ok) throw Object.assign(new Error(data.error ?? "Something went wrong."), { status: res.status });
  return data;
}

const api = {
  posts: () => call("GET", "/posts").then((d) => d.posts),
  post: (slug) => call("GET", `/posts/${encodeURIComponent(slug)}`),
  create: (post) => call("POST", "/posts", post),
  update: (slug, post) => call("PUT", `/posts/${encodeURIComponent(slug)}`, post),
  remove: (slug) => call("DELETE", `/posts/${encodeURIComponent(slug)}`),
  me: () => call("GET", "/me").then((d) => d.signedIn),
  signIn: (password) => call("POST", "/login", { password }),
  signOut: () => call("POST", "/logout", {}),
};

export default api;
