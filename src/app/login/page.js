"use client";

import { useState } from "react";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Simple cookie helpers
  function setCookie(name, value, days) {
    let expires = "";
    if (days) {
      const date = new Date();
      date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
      expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
  }

  function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(";");
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === " ") c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  }

  // Simulated user store (for demo only)
  function getUsers() {
    if (typeof window === "undefined") return [];
    const users = localStorage.getItem("users");
    return users ? JSON.parse(users) : [];
  }

  function saveUser(user) {
    const users = getUsers();
    users.push(user);
    localStorage.setItem("users", JSON.stringify(users));
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
    setSuccess("");
  }

  function handleLogin(e) {
    e.preventDefault();
    const users = getUsers();
    const user = users.find(
      (u) => u.username === form.username && u.password === form.password
    );
    if (user) {
      setCookie("session", user.username, 1);
      setSuccess("Login successful! Redirecting...");
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
    } else {
      setError("Invalid username or password.");
    }
  }

  function handleSignup(e) {
    e.preventDefault();
    const users = getUsers();
    if (users.find((u) => u.username === form.username)) {
      setError("Username already exists.");
      return;
    }
    if (!form.username || !form.password) {
      setError("Please fill all fields.");
      return;
    }
    saveUser({ username: form.username, password: form.password });
    setSuccess("Signup successful! You can now log in.");
    setIsLogin(true);
    setForm({ username: "", password: "" });
  }

  // If already logged in, redirect
  if (typeof window !== "undefined" && getCookie("session")) {
    if (typeof window !== "undefined") window.location.href = "/";
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300">
      <div className="bg-white/90 shadow-2xl rounded-2xl p-10 w-full max-w-md border border-blue-200">
        <div className="flex flex-col items-center mb-6">
          <div className="bg-blue-600 rounded-full w-14 h-14 flex items-center justify-center shadow-lg mb-2">
            <span className="text-white text-3xl">📚</span>
          </div>
          <h2 className="text-2xl font-bold text-blue-800 mb-1">
            {isLogin ? "Login" : "Sign Up"}
          </h2>
          <p className="text-blue-500 text-sm">
            Welcome to the Library System
          </p>
        </div>
        <form onSubmit={isLogin ? handleLogin : handleSignup} className="space-y-5">
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={form.username}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-blue-50 text-blue-900 placeholder-blue-400"
            autoComplete="username"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-blue-50 text-blue-900 placeholder-blue-400"
            autoComplete={isLogin ? "current-password" : "new-password"}
          />
          {error && <div className="text-red-500 text-sm">{error}</div>}
          {success && <div className="text-green-600 text-sm">{success}</div>}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white py-2 rounded-lg font-semibold shadow hover:from-blue-700 hover:to-blue-600 transition"
          >
            {isLogin ? "Login" : "Sign Up"}
          </button>
        </form>
        <div className="mt-6 text-center">
          {isLogin ? (
            <>
              <span className="text-blue-700">Don&apos;t have an account?</span>{" "}
              <button
                className="text-blue-600 hover:underline font-semibold"
                onClick={() => {
                  setIsLogin(false);
                  setForm({ username: "", password: "" });
                  setError("");
                  setSuccess("");
                }}
              >
                Sign Up
              </button>
            </>
          ) : (
            <>
              <span className="text-blue-700">Already have an account?</span>{" "}
              <button
                className="text-blue-600 hover:underline font-semibold"
                onClick={() => {
                  setIsLogin(true);
                  setForm({ username: "", password: "" });
                  setError("");
                  setSuccess("");
                }}
              >
                Login
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}